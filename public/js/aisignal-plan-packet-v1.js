/* ASFX_PLAN_PACKET_V1
   AiSignal Brain Core V1
   Single source for Signal Tab + Chart Indicator.
   This module does not draw chart lines yet.
*/
(function aisignalPlanPacketV1(){
  if (window.__ASFX_PLAN_PACKET_V1__) return;
  window.__ASFX_PLAN_PACKET_V1__ = true;

  const STATE = window.__ASFX_PLAN_PACKET_STATE_V1__ || (window.__ASFX_PLAN_PACKET_STATE_V1__ = {
    active: {},
    last: null
  });

  const toNum = (value) => {
    if (value === undefined || value === null) return null;
    const n = Number(String(value).replace(/,/g, "").replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const round = (value, digits = 5) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const f = 10 ** digits;
    return Math.round(n * f) / f;
  };

  const text = (value, fallback = "") => {
    const t = String(value ?? "").trim();
    return t || fallback;
  };

  const nums = (value) => {
    return String(value ?? "")
      .replace(/,/g, "")
      .match(/-?\d+(?:\.\d+)?/g)
      ?.map(Number)
      .filter(Number.isFinite) || [];
  };

  const lastNum = (value) => {
    const list = nums(value);
    return list.length ? list[list.length - 1] : null;
  };

  const normalizeZone = (z) => {
    if (!z) return null;
    const low = Number(z.low);
    const high = Number(z.high);
    if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
    const a = Math.min(low, high);
    const b = Math.max(low, high);
    return { low: round(a), high: round(b), mid: round((a + b) / 2) };
  };

  const parseZone = (value) => {
    const list = nums(value);
    if (list.length >= 2) return normalizeZone({ low: list[0], high: list[1] });
    if (list.length === 1) return normalizeZone({ low: list[0], high: list[0] });
    return null;
  };

  const latestSource = () => {
    try {
      return (
        window.AiSignalSMZCandleReaderV1?.last?.() ||
        window.AiSignalSMZStatusFlowV1?.last?.() ||
        window.AiSignalSMZEngineV1?.last?.() ||
        window.ASFXSignalRoomDataHydratorV1?.latest?.() ||
        window.__ASFX_LAST_SMZ_ANALYSIS__ ||
        {}
      );
    } catch (_) {
      return window.__ASFX_LAST_SMZ_ANALYSIS__ || {};
    }
  };

  const detailCtx = () => {
    const title = document.querySelector(".asfx-detail-title h2")?.textContent || "";
    const pair = title.match(/([A-Z0-9]{5,20})/)?.[1] || "BTCUSDT";
    const tf = title.match(/\b(1m|5m|15m|30m|1h|4h|1d|1w)\b/i)?.[1] || "15m";
    return { pair: pair.toUpperCase(), timeframe: tf.toLowerCase() };
  };

  const normalizeCandles = (input = []) => {
    return (Array.isArray(input) ? input : [])
      .map((c) => {
        if (Array.isArray(c)) {
          return { o: toNum(c[1]), h: toNum(c[2]), l: toNum(c[3]), c: toNum(c[4]), v: toNum(c[5] || 0) };
        }
        return {
          o: toNum(c.o ?? c.open),
          h: toNum(c.h ?? c.high),
          l: toNum(c.l ?? c.low),
          c: toNum(c.c ?? c.close),
          v: toNum(c.v ?? c.volume ?? 0)
        };
      })
      .filter((c) =>
        Number.isFinite(c.o) &&
        Number.isFinite(c.h) &&
        Number.isFinite(c.l) &&
        Number.isFinite(c.c)
      );
  };

  const pickCandles = (source = {}) => {
    const raw =
      source.candles ||
      source.klines ||
      source.data?.candles ||
      source.data?.klines ||
      window.__ASFX_DETAIL_CANDLES_V1__ ||
      [];
    return normalizeCandles(raw);
  };

  const atr = (candles, period = 14) => {
    if (!candles || candles.length < period + 2) return 0;
    const recent = candles.slice(-period - 1);
    let total = 0;

    for (let i = 1; i < recent.length; i += 1) {
      const c = recent[i];
      const p = recent[i - 1];
      total += Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c));
    }

    return total / period;
  };

  const marketInfo = (pair, price, candles) => {
    const p = String(pair || "").toUpperCase();
    const a = atr(candles, 14);
    const px = Number(price) || 0;

    if (p.includes("USDT") || p.includes("BTC") || p.includes("ETH")) {
      return {
        type: "CRYPTO",
        minTarget: Math.max(px * 0.0035, a * 1.1, 1),
        buffer: Math.max(px * 0.0009, a * 0.25, 1)
      };
    }

    if (p.includes("XAU")) {
      return {
        type: "GOLD",
        minTarget: Math.max(5, a * 1.0),
        buffer: Math.max(1.5, a * 0.28)
      };
    }

    if (p.includes("JPY")) {
      return {
        type: "FOREX",
        minTarget: 0.50,
        buffer: Math.max(0.12, a * 0.30)
      };
    }

    return {
      type: "FOREX",
      minTarget: 0.0050,
      buffer: Math.max(0.0012, a * 0.30)
    };
  };

  const sessionGuard = () => {
    const now = new Date();
    const mins = now.getUTCHours() * 60 + now.getUTCMinutes();

    const asia = mins >= 0 && mins < 480;
    const london = mins >= 420 && mins < 960;
    const ny = mins >= 720 && mins < 1260;
    const overlap = mins >= 720 && mins < 960;

    let name = "Off Session";
    let score = -4;
    let note = "Liquidity tipis, signal harus lebih selektif.";

    if (asia) {
      name = "Asia";
      score = 0;
      note = "Asia cenderung range; entry terbaik harus dekat zona.";
    }

    if (london) {
      name = "London";
      score = 6;
      note = "London meningkatkan volatilitas; momentum valid tapi fakeout tetap diawasi.";
    }

    if (ny) {
      name = "New York";
      score = 5;
      note = "New York bisa memperkuat continuation jika struktur searah.";
    }

    if (overlap) {
      name = "London-New York Overlap";
      score = 9;
      note = "Overlap memberi volume kuat; signal lebih valid jika struktur dan flow searah.";
    }

    const nearH4Turn = (mins % 240) <= 10 || (mins % 240) >= 230;
    if (nearH4Turn) {
      score -= 3;
      note += " Dekat pergantian H4 candle, risk guard lebih ketat.";
    }

    return { name, score, nearH4Turn, note };
  };

  const volumeFlow = (candles, side) => {
    if (!candles || candles.length < 22) {
      return {
        label: "Volume Reading",
        direction: "NEUTRAL",
        score: 0,
        note: "Volume history belum cukup untuk membaca pressure kuat."
      };
    }

    const recent = candles.slice(-22);
    const last = recent[recent.length - 1];
    const prev = recent[recent.length - 2];

    const avgVol = recent.slice(0, -1).reduce((s, c) => s + Math.max(0, c.v || 0), 0) / Math.max(1, recent.length - 1);
    const volRatio = avgVol > 0 ? (last.v || 0) / avgVol : 1;

    const spread = Math.max(last.h - last.l, 1e-9);
    const body = Math.abs(last.c - last.o);
    const closePos = (last.c - last.l) / spread;
    const upperWick = last.h - Math.max(last.o, last.c);
    const lowerWick = Math.min(last.o, last.c) - last.l;

    const bullishPressure = volRatio >= 1.18 && last.c > last.o && closePos >= 0.58;
    const bearishPressure = volRatio >= 1.18 && last.c < last.o && closePos <= 0.42;

    const bullSweep = last.l < prev.l && last.c > prev.l && lowerWick > body * 0.9 && volRatio >= 1.05;
    const bearSweep = last.h > prev.h && last.c < prev.h && upperWick > body * 0.9 && volRatio >= 1.05;

    let direction = "NEUTRAL";
    let score = 0;
    let label = "Neutral Flow";
    let note = "Volume belum menunjukkan dominasi institusional yang jelas.";

    if (bullishPressure || bullSweep) {
      direction = "BUY";
      score = side === "BUY" ? 10 : -6;
      label = bullSweep ? "Buy-Side Reclaim" : "Buyer Pressure";
      note = bullSweep
        ? "Ada sweep bawah lalu candle kembali naik; buyer mulai menyerap tekanan sell."
        : "Volume mendukung buyer pressure; close candle cukup kuat di area atas.";
    }

    if (bearishPressure || bearSweep) {
      direction = "SELL";
      score = side === "SELL" ? 10 : -6;
      label = bearSweep ? "Sell-Side Rejection" : "Seller Pressure";
      note = bearSweep
        ? "Ada sweep atas lalu candle kembali turun; seller mulai menekan dari area atas."
        : "Volume mendukung seller pressure; close candle cukup kuat di area bawah.";
    }

    const trapRisk = volRatio >= 1.65 && body <= spread * 0.35;
    if (trapRisk) {
      score -= 8;
      label = "Trap Risk";
      note = "Volume besar tapi candle penuh wick; ada risiko stop hunt atau retail trap.";
    }

    return { label, direction, score, volRatio: round(volRatio, 2), note };
  };

  const inferSide = (source, candles) => {
    const bias = String(source.bias || "WAIT").toUpperCase();
    if (bias.includes("BUY")) return "BUY";
    if (bias.includes("SELL")) return "SELL";

    const combined = [
      source.structure,
      source.reason,
      source.statusDetail,
      source.signalStatus,
      source.statusFlow,
      source.zoneState,
      source.setupType,
      source.liquidity,
      source.imbalance
    ].filter(Boolean).join(" ").toLowerCase();

    const bearishScore = [
      /bearish/,
      /hl\/ll/,
      /lower high/,
      /lower low/,
      /seller/,
      /sell pressure/,
      /supply/,
      /resistance/,
      /rejection/,
      /breakdown/,
      /choch bearish/,
      /bos bearish/
    ].reduce((score, pattern) => score + (pattern.test(combined) ? 1 : 0), 0);

    const bullishScore = [
      /bullish/,
      /hh\/hl/,
      /higher high/,
      /higher low/,
      /buyer/,
      /buy pressure/,
      /demand/,
      /support/,
      /reclaim/,
      /breakout/,
      /choch bullish/,
      /bos bullish/
    ].reduce((score, pattern) => score + (pattern.test(combined) ? 1 : 0), 0);

    if (bearishScore > bullishScore && bearishScore >= 1) return "SELL";
    if (bullishScore > bearishScore && bullishScore >= 1) return "BUY";

    if (candles.length >= 12) {
      const first = candles[candles.length - 12].c;
      const last = candles[candles.length - 1].c;
      if (last > first) return "BUY";
      if (last < first) return "SELL";
    }

    return "WAIT";
  };
  const choosePrimaryEntry = ({ side, source, demand, supply, price, market }) => {
    let active = parseZone(source.entryZone || source.activeZone || source.zone || source.zoneState);

    if (!active && side === "BUY") active = demand;
    if (!active && side === "SELL") active = supply;

    if (!active && Number.isFinite(price)) {
      const width = Math.max(market.buffer * 1.2, market.minTarget * 0.20);

      if (side === "BUY") active = normalizeZone({ low: price - width, high: price - width * 0.25 });
      if (side === "SELL") active = normalizeZone({ low: price + width * 0.25, high: price + width });
    }

    return normalizeZone(active);
  };

  const chooseStopLoss = ({ side, primary, source, market }) => {
    let sl = lastNum(source.stopLossGuide || source.slGuide || source.invalidationLevel);

    if (side === "BUY" && (!Number.isFinite(sl) || sl >= primary.low)) sl = primary.low - market.buffer;
    if (side === "SELL" && (!Number.isFinite(sl) || sl <= primary.high)) sl = primary.high + market.buffer;

    return round(sl);
  };

  const chooseTargets = ({ side, primary, sl, source, market, demand, supply }) => {
    const entry = primary.mid;
    const riskDistance = Math.max(Math.abs(entry - sl), market.minTarget * 0.65);

    let tp1 = lastNum(source.tp1Guide);
    let tp2 = lastNum(source.tp2Guide);
    let tp3 = lastNum(source.tp3Guide);

    if (side === "BUY") {
      if (!Number.isFinite(tp1) || tp1 <= entry) tp1 = supply?.low && supply.low > entry ? supply.low : entry + Math.max(market.minTarget, riskDistance * 1.0);
      if (!Number.isFinite(tp2) || tp2 <= tp1) tp2 = supply?.high && supply.high > tp1 ? supply.high : entry + Math.max(market.minTarget * 1.6, riskDistance * 1.8);
      if (!Number.isFinite(tp3) || tp3 <= tp2) tp3 = tp2 + Math.max(market.minTarget, Math.abs(tp2 - tp1));
    }

    if (side === "SELL") {
      if (!Number.isFinite(tp1) || tp1 >= entry) tp1 = demand?.high && demand.high < entry ? demand.high : entry - Math.max(market.minTarget, riskDistance * 1.0);
      if (!Number.isFinite(tp2) || tp2 >= tp1) tp2 = demand?.low && demand.low < tp1 ? demand.low : entry - Math.max(market.minTarget * 1.6, riskDistance * 1.8);
      if (!Number.isFinite(tp3) || tp3 >= tp2) tp3 = tp2 - Math.max(market.minTarget, Math.abs(tp1 - tp2));
    }

    return { tp1: round(tp1), tp2: round(tp2), tp3: round(tp3) };
  };

  const secondaryEntry = ({ side, primary, sl, market }) => {
    const width = Math.max(primary.high - primary.low, market.buffer * 1.4);
    const gap = width * 0.35;

    if (side === "BUY") {
      const high = primary.low - gap;
      const low = high - width;
      if (low <= sl || high <= sl) return null;
      return normalizeZone({ low, high });
    }

    if (side === "SELL") {
      const low = primary.high + gap;
      const high = low + width;
      if (low >= sl || high >= sl) return null;
      return normalizeZone({ low, high });
    }

    return null;
  };

  const lifecycleFor = ({ packet, price }) => {
    if (!packet.valid) return packet.lifecycle;

    const key = [
      packet.pair,
      packet.timeframe,
      packet.side,
      packet.entryPrimary?.low,
      packet.entryPrimary?.high,
      packet.sl,
      packet.tp1,
      packet.tp2,
      packet.tp3
    ].join("|");

    const state = STATE.active[key] || {
      touched: false,
      tp1Hit: false,
      tp2Hit: false,
      closed: false,
      lifecycle: "SIGNAL READY"
    };

    const inEntry = price >= packet.entryPrimary.low && price <= packet.entryPrimary.high;
    const slHit = packet.side === "BUY" ? price <= packet.sl : price >= packet.sl;
    const tp1Hit = packet.side === "BUY" ? price >= packet.tp1 : price <= packet.tp1;
    const tp2Hit = packet.side === "BUY" ? price >= packet.tp2 : price <= packet.tp2;
    const tp3Hit = packet.side === "BUY" ? price >= packet.tp3 : price <= packet.tp3;

    if (!state.closed) {
      if (inEntry) {
        state.touched = true;
        state.lifecycle = "ENTRY TOUCHED";
      }

      if (state.touched) {
        if (slHit) {
          state.lifecycle = "SL HIT / CLOSED";
          state.closed = true;
        } else if (tp3Hit) {
          state.lifecycle = "TP3 HIT / COMPLETED";
          state.tp1Hit = true;
          state.tp2Hit = true;
          state.closed = true;
        } else if (tp2Hit) {
          state.lifecycle = "TP2 HIT";
          state.tp1Hit = true;
          state.tp2Hit = true;
        } else if (tp1Hit) {
          state.lifecycle = "TP1 HIT";
          state.tp1Hit = true;
        }
      }
    }

    STATE.active[key] = state;
    return state.lifecycle;
  };

  /* ASFX_ZONE_BRAIN_V4_ENGINE
     Official zone brain: converts candle history into BUY/SELL zone packet.
     Signal tab and chart consume this packet; Risk/AI explain safety and reason.
  */
  const avgRange = (candles, period = 20) => {
    const list = (candles || []).slice(-period);
    if (!list.length) return 0;
    return list.reduce((s, c) => s + Math.max(0, Number(c.h) - Number(c.l)), 0) / list.length;
  };

  const emaValue = (candles, period = 21) => {
    const closes = (candles || []).map((c) => Number(c.c)).filter(Number.isFinite);
    if (!closes.length) return null;
    const k = 2 / (period + 1);
    let ema = closes[0];
    for (let i = 1; i < closes.length; i += 1) ema = closes[i] * k + ema * (1 - k);
    return Number.isFinite(ema) ? ema : null;
  };

  const clusterLevel = (values, tolerance) => {
    const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!clean.length) return null;
    let best = { values: [clean[0]], score: 1 };
    let current = [clean[0]];

    for (let i = 1; i < clean.length; i += 1) {
      const avg = current.reduce((s, v) => s + v, 0) / current.length;
      if (Math.abs(clean[i] - avg) <= tolerance) current.push(clean[i]);
      else {
        if (current.length > best.score) best = { values: current.slice(), score: current.length };
        current = [clean[i]];
      }
    }

    if (current.length > best.score) best = { values: current.slice(), score: current.length };
    const level = best.values.reduce((s, v) => s + v, 0) / best.values.length;
    return { level, touches: best.values.length };
  };

  const candleZones = ({ candles, price, market }) => {
    const recent = (candles || []).slice(-120);
    const px = Number(price);
    const baseAtr = atr(recent, 14) || avgRange(recent, 20) || (Number.isFinite(px) ? px * 0.0025 : 1);
    const buffer = Math.max(market.buffer || 0, baseAtr * 0.35, Number.isFinite(px) ? px * 0.0009 : 1);
    const tolerance = Math.max(buffer * 1.5, baseAtr * 0.45);

    if (!recent.length || !Number.isFinite(px)) {
      return { demand: null, supply: null, atrValue: baseAtr, buffer, demandTouches: 0, supplyTouches: 0 };
    }

    const lows = recent.map((c) => Number(c.l)).filter(Number.isFinite);
    const highs = recent.map((c) => Number(c.h)).filter(Number.isFinite);
    const below = lows.filter((v) => v <= px + tolerance);
    const above = highs.filter((v) => v >= px - tolerance);

    const demandCluster = clusterLevel(below.length ? below : lows, tolerance);
    const supplyCluster = clusterLevel(above.length ? above : highs, tolerance);

    let demand = null;
    let supply = null;

    if (demandCluster) {
      const level = demandCluster.level;
      demand = normalizeZone({ low: level - buffer * 0.55, high: level + buffer * 0.55 });
    }

    if (supplyCluster) {
      const level = supplyCluster.level;
      supply = normalizeZone({ low: level - buffer * 0.55, high: level + buffer * 0.55 });
    }

    if (!demand) demand = normalizeZone({ low: px - buffer * 2.2, high: px - buffer * 0.9 });
    if (!supply) supply = normalizeZone({ low: px + buffer * 0.9, high: px + buffer * 2.2 });

    return {
      demand,
      supply,
      atrValue: baseAtr,
      buffer,
      demandTouches: demandCluster?.touches || 1,
      supplyTouches: supplyCluster?.touches || 1
    };
  };

  const buildZoneBrain = ({ source, candles, pair, timeframe, price, market, session }) => {
    const candleDemandSupply = candleZones({ candles, price, market });
    const sourceDemand = parseZone(source.demandZone);
    const sourceSupply = parseZone(source.supplyZone);
    const demand = sourceDemand || candleDemandSupply.demand;
    const supply = sourceSupply || candleDemandSupply.supply;

    const emaFast = emaValue(candles.slice(-80), 9);
    const emaSlow = emaValue(candles.slice(-100), 21);
    const last = candles[candles.length - 1] || {};
    const prev = candles[candles.length - 2] || {};
    const trendUp = Number.isFinite(emaFast) && Number.isFinite(emaSlow) && emaFast >= emaSlow;
    const trendDown = Number.isFinite(emaFast) && Number.isFinite(emaSlow) && emaFast < emaSlow;
    const candleBull = Number(last.c) >= Number(last.o);
    const candleBear = Number(last.c) < Number(last.o);

    let side = inferSide(source, candles);
    const px = Number(price);

    const distDemand = demand ? Math.abs(px - demand.mid) : Infinity;
    const distSupply = supply ? Math.abs(px - supply.mid) : Infinity;
    const nearDemand = demand && px <= demand.high + candleDemandSupply.buffer * 2.2;
    const nearSupply = supply && px >= supply.low - candleDemandSupply.buffer * 2.2;

    if (side !== 'BUY' && side !== 'SELL') {
      if (nearDemand && !nearSupply) side = 'BUY';
      else if (nearSupply && !nearDemand) side = 'SELL';
      else if (trendUp && distDemand <= distSupply * 1.35) side = 'BUY';
      else if (trendDown && distSupply <= distDemand * 1.35) side = 'SELL';
      else side = distDemand <= distSupply ? 'BUY' : 'SELL';
    }

    let primary = side === 'BUY' ? demand : supply;
    primary = normalizeZone(primary);

    if (!primary && Number.isFinite(px)) {
      const width = Math.max(market.buffer * 1.4, market.minTarget * 0.22, candleDemandSupply.buffer);
      primary = side === 'BUY'
        ? normalizeZone({ low: px - width * 1.4, high: px - width * 0.35 })
        : normalizeZone({ low: px + width * 0.35, high: px + width * 1.4 });
    }

    let technicalScore = 52;
    if ((side === 'BUY' && trendUp) || (side === 'SELL' && trendDown)) technicalScore += 12;
    if ((side === 'BUY' && candleBull) || (side === 'SELL' && candleBear)) technicalScore += 5;
    if ((side === 'BUY' && nearDemand) || (side === 'SELL' && nearSupply)) technicalScore += 12;
    if (candleDemandSupply.demandTouches >= 2 || candleDemandSupply.supplyTouches >= 2) technicalScore += 6;
    if (session?.score) technicalScore += Math.max(-4, Math.min(8, session.score));

    technicalScore = Math.max(35, Math.min(96, Math.round(technicalScore)));

    const zoneType = side === 'BUY' ? 'BUY ZONE' : 'SELL ZONE';
    const reason = side === 'BUY'
      ? 'Buyer zone terbentuk dari demand/support candle. Entry memakai area zona, bukan harga market asal.'
      : 'Seller zone terbentuk dari supply/resistance candle. Entry memakai area zona, bukan harga market asal.';

    return {
      side,
      zoneType,
      primary,
      demand,
      supply,
      technicalScore,
      atrValue: candleDemandSupply.atrValue,
      buffer: candleDemandSupply.buffer,
      reason,
      context: {
        trend: trendUp ? 'Bullish / recovery' : trendDown ? 'Bearish / pressure' : 'Range / neutral',
        demandTouches: candleDemandSupply.demandTouches,
        supplyTouches: candleDemandSupply.supplyTouches,
        emaFast: round(emaFast),
        emaSlow: round(emaSlow),
        lastCandle: {
          open: round(last.o), high: round(last.h), low: round(last.l), close: round(last.c),
          previousClose: round(prev.c)
        }
      }
    };
  };

  const buildPacket = () => {
    const source = latestSource();
    const ctx = detailCtx();
    const candles = pickCandles(source);
    const lastCandle = candles[candles.length - 1] || {};

    const price =
      toNum(source.currentPrice) ||
      toNum(source.price) ||
      toNum(source.livePrice) ||
      toNum(lastCandle.c);

    const pair = String(source.pair || source.symbol || ctx.pair).toUpperCase();
    const timeframe = String(source.tf || source.timeframe || ctx.timeframe).toLowerCase();
    const market = marketInfo(pair, price, candles);
    const session = sessionGuard();
    const volume = volumeFlow(candles, 'WAIT');

    if (!Number.isFinite(Number(price)) || candles.length < 20) {
      const packet = {
        version: '4.0.0-zone-brain',
        valid: false,
        decision: 'ZONE SCAN',
        lifecycle: 'SCANNING',
        pair,
        timeframe,
        side: 'WAIT',
        price: round(price),
        risk: text(source.risk, 'Medium'),
        confidence: toNum(source.confidence) || 0,
        session,
        volumeFlow: volume,
        entryPrimary: null,
        entrySecondary: null,
        sl: null,
        tp1: null,
        tp2: null,
        tp3: null,
        score: 0,
        reason: 'Candle history belum cukup untuk membentuk zona eksekusi yang layak.',
        source
      };
      STATE.last = packet;
      window.__ASFX_PLAN_PACKET_LAST_V1__ = packet;
      try { window.dispatchEvent(new CustomEvent('asfx:plan-packet:v1', { detail: packet })); } catch (_) {}
      return packet;
    }

    const brain = buildZoneBrain({ source, candles, pair, timeframe, price, market, session });
    const side = brain.side;
    const primary = normalizeZone(brain.primary);

    if (!primary || (side !== 'BUY' && side !== 'SELL')) {
      const packet = {
        version: '4.0.0-zone-brain',
        valid: false,
        decision: 'ZONE SCAN',
        lifecycle: 'SCANNING',
        pair,
        timeframe,
        side: 'WAIT',
        price: round(price),
        risk: text(source.risk, 'Medium'),
        confidence: toNum(source.confidence) || brain.technicalScore || 0,
        session,
        volumeFlow: volume,
        entryPrimary: null,
        entrySecondary: null,
        sl: null,
        tp1: null,
        tp2: null,
        tp3: null,
        score: brain.technicalScore || 0,
        reason: 'Zona belum terbentuk dari candle aktif.',
        source,
        zoneBrain: brain.context
      };
      STATE.last = packet;
      window.__ASFX_PLAN_PACKET_LAST_V1__ = packet;
      try { window.dispatchEvent(new CustomEvent('asfx:plan-packet:v1', { detail: packet })); } catch (_) {}
      return packet;
    }

    const risk = text(source.risk, 'Medium');
    const confidence = toNum(source.confidence) || brain.technicalScore;
    const volumeAligned = volumeFlow(candles, side);
    const sl = chooseStopLoss({ side, primary, source, market });
    const targets = chooseTargets({ side, primary, sl, source, market, demand: brain.demand, supply: brain.supply });
    const secondary = secondaryEntry({ side, primary, sl, market });

    const entryMid = primary.mid;
    const targetDistance = side === 'BUY' ? targets.tp1 - entryMid : entryMid - targets.tp1;
    const slDistance = Math.abs(entryMid - sl);
    const rr = slDistance > 0 ? targetDistance / slDistance : 0;

    let score = brain.technicalScore;
    if (confidence >= 60) score += 5;
    if (!/high/i.test(risk)) score += 4;
    if (rr >= 1.0) score += 4;
    if (rr >= 1.4) score += 4;
    score += Math.max(-6, Math.min(8, volumeAligned.score || 0));
    score = Math.max(40, Math.min(98, Math.round(score)));

    const packet = {
      version: '4.0.0-zone-brain',
      valid: true,
      decision: side === 'BUY' ? 'OFFICIAL BUY' : 'OFFICIAL SELL',
      zoneType: brain.zoneType,
      lifecycle: 'ZONE READY',
      pair,
      timeframe,
      side,
      price: round(price),
      marketType: market.type,
      minTarget: round(market.minTarget),
      entryPrimary: primary,
      entrySecondary: secondary,
      sl,
      tp1: targets.tp1,
      tp2: targets.tp2,
      tp3: targets.tp3,
      risk,
      confidence,
      score,
      rr: round(rr, 2),
      session,
      volumeFlow: volumeAligned,
      mtfContext: {
        higherBias: text(source.higherBias || source.structure || brain.context.trend, brain.context.trend),
        activeZone: brain.zoneType,
        demandZone: brain.demand,
        supplyZone: brain.supply
      },
      zoneBrain: brain.context,
      reason: brain.reason + ' ' + volumeAligned.note + ' ' + session.note,
      source
    };

    packet.lifecycle = lifecycleFor({ packet, price });
    STATE.last = packet;
    window.__ASFX_PLAN_PACKET_LAST_V1__ = packet;
    try { window.dispatchEvent(new CustomEvent('asfx:plan-packet:v1', { detail: packet })); } catch (_) {}
    return packet;
  };


  /* ASFX_DECISIVE_ZONE_V401
     Small safe normalizer only.
     Does not touch chart renderer, indicator source, or UI layout.
  */
  const asfxDecisiveZoneV401 = (packet) => {
    if (!packet || typeof packet !== "object") return packet;

    const p = { ...packet };
    const finite = (v) => Number.isFinite(Number(v));
    const hasEntry =
      p.entryPrimary &&
      finite(p.entryPrimary.low) &&
      finite(p.entryPrimary.high) &&
      finite(p.entryPrimary.mid);

    const hasPlan =
      hasEntry &&
      finite(p.sl) &&
      finite(p.tp1) &&
      finite(p.tp2);

    const cleanSide =
      p.side === "BUY" || p.side === "SELL"
        ? p.side
        : finite(p.tp1) && finite(p.entryPrimary?.mid)
          ? Number(p.tp1) >= Number(p.entryPrimary.mid)
            ? "BUY"
            : "SELL"
          : "SCAN";

    p.version = "4.0.1-decisive-zone";

    if (hasPlan && (cleanSide === "BUY" || cleanSide === "SELL")) {
      p.valid = true;
      p.side = cleanSide;
      p.zoneType = cleanSide === "BUY" ? "BUY ZONE" : "SELL ZONE";

      const decisionText = String(p.decision || "").toUpperCase();
      if (!decisionText.includes("OFFICIAL")) {
        p.decision = p.zoneType + " READY";
      }

      const lifeText = String(p.lifecycle || "").toUpperCase();
      if (!lifeText || lifeText.includes("WAIT") || lifeText.includes("NO TRADE") || lifeText.includes("SCAN")) {
        p.lifecycle = p.zoneType + " READY";
      }

      p.reason = String(p.reason || "") + " Decisive Zone V4.0.1: zona valid ditampilkan langsung; detail keamanan tetap di Risk dan AI Insight.";
    } else {
      p.valid = false;
      p.side = cleanSide === "BUY" || cleanSide === "SELL" ? cleanSide : "SCAN";
      p.decision = "ZONE SCAN";
      p.lifecycle = "SCANNING ZONE";
      p.zoneType = p.zoneType || "ZONE SCAN";
      p.reason = String(p.reason || "Candle belum cukup untuk membentuk zona eksekusi bersih.")
        .replace(/NO TRADE/gi, "ZONE SCAN")
        .replace(/WAIT/gi, "SCANNING ZONE");
    }

    STATE.last = p;
    window.__ASFX_PLAN_PACKET_LAST_V1__ = p;
    return p;
  };

  const update = () => asfxDecisiveZoneV401(buildPacket());

  window.ASFXPlanPacketV1 = {
    version: "4.0.1-decisive-zone",
    build: update,
    latest: () => window.__ASFX_PLAN_PACKET_LAST_V1__ || update(),
    state: STATE
  };

  update();
  setInterval(update, 1200);

  console.info("ASFX Zone Brain V4.0.1 Decisive ready.");
})();

