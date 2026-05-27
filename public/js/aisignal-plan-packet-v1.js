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

  /* ASFX_TECHNICAL_SOP_ENGINE_V41
     Full SOP layer: swing, trendline, SNR/RBS/SBR, BRN, EMA/RSI/ATR/volume,
     active zone selector, TP area guard, continuation zone, and hit flags.
     This upgrades the brain only; chart/UI render is untouched.
  */
  function asfxTechnicalSopV41(packet) {
    const finite = (value) => Number.isFinite(Number(value));
    const num = (...values) => {
      for (const value of values) {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
      }
      return null;
    };
    const round = (value, digits = 5) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      const f = Math.pow(10, digits);
      return Math.round(n * f) / f;
    };
    const zone = (value) => {
      if (!value || typeof value !== "object") return null;
      const low = num(value.low, value.min, value.from);
      const high = num(value.high, value.max, value.to);
      if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
      const lo = Math.min(low, high);
      const hi = Math.max(low, high);
      return { low: round(lo), high: round(hi), mid: round((lo + hi) / 2) };
    };
    const text = (value, fallback = "") => String(value || fallback || "");
    const candle = (c, i) => {
      const o = num(c?.o, c?.open);
      const h = num(c?.h, c?.high);
      const l = num(c?.l, c?.low);
      const close = num(c?.c, c?.close);
      if (![o, h, l, close].every(Number.isFinite)) return null;
      return { i, t: num(c?.t, c?.time) || i, o, h, l, c: close, v: num(c?.v, c?.volume) || 0 };
    };

    const rawCandles = Array.isArray(window.__ASFX_DETAIL_CANDLES_V1__) && window.__ASFX_DETAIL_CANDLES_V1__.length
      ? window.__ASFX_DETAIL_CANDLES_V1__
      : Array.isArray(packet?.source?.candles)
        ? packet.source.candles
        : Array.isArray(packet?.source?.klines)
          ? packet.source.klines
          : [];

    const candles = rawCandles.map(candle).filter(Boolean).slice(-240);
    const price = num(packet?.price, packet?.source?.currentPrice, packet?.source?.price, candles[candles.length - 1]?.c);
    const out = Object.assign({}, packet || {});

    const atr = (list, period = 14) => {
      const src = list.slice(-period - 1);
      if (src.length < 2) return 0;
      let total = 0;
      let count = 0;
      for (let i = 1; i < src.length; i += 1) {
        const prevClose = src[i - 1].c;
        const tr = Math.max(src[i].h - src[i].l, Math.abs(src[i].h - prevClose), Math.abs(src[i].l - prevClose));
        if (Number.isFinite(tr)) {
          total += tr;
          count += 1;
        }
      }
      return count ? total / count : 0;
    };

    const ema = (list, period) => {
      const closes = list.map((c) => c.c).filter(Number.isFinite);
      if (!closes.length) return null;
      const k = 2 / (period + 1);
      let value = closes[0];
      for (let i = 1; i < closes.length; i += 1) value = closes[i] * k + value * (1 - k);
      return value;
    };

    const rsi = (list, period = 14) => {
      const closes = list.map((c) => c.c).filter(Number.isFinite);
      if (closes.length <= period) return 50;
      let gain = 0;
      let loss = 0;
      const start = closes.length - period;
      for (let i = start; i < closes.length; i += 1) {
        const d = closes[i] - closes[i - 1];
        if (d >= 0) gain += d;
        else loss += Math.abs(d);
      }
      const avgGain = gain / period;
      const avgLoss = loss / period;
      if (avgLoss === 0) return 100;
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    };

    const swings = (list, span = 2) => {
      const highs = [];
      const lows = [];
      for (let i = span; i < list.length - span; i += 1) {
        let isHigh = true;
        let isLow = true;
        for (let j = i - span; j <= i + span; j += 1) {
          if (j === i) continue;
          if (list[i].h <= list[j].h) isHigh = false;
          if (list[i].l >= list[j].l) isLow = false;
        }
        if (isHigh) highs.push({ i, t: list[i].t, price: list[i].h });
        if (isLow) lows.push({ i, t: list[i].t, price: list[i].l });
      }
      return { highs, lows };
    };

    const cluster = (values, tolerance) => {
      const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
      if (!clean.length) return null;
      let best = [clean[0]];
      let cur = [clean[0]];
      for (let i = 1; i < clean.length; i += 1) {
        const avg = cur.reduce((s, v) => s + v, 0) / cur.length;
        if (Math.abs(clean[i] - avg) <= tolerance) cur.push(clean[i]);
        else {
          if (cur.length > best.length) best = cur.slice();
          cur = [clean[i]];
        }
      }
      if (cur.length > best.length) best = cur.slice();
      const level = best.reduce((s, v) => s + v, 0) / best.length;
      return { level, touches: best.length };
    };

    const makeZone = (level, buffer) => zone({ low: level - buffer, high: level + buffer });

    const trendLine = (points, currentIndex, tolerance) => {
      const pts = points.slice(-4);
      if (pts.length < 2) return null;
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      if (a.i === b.i) return null;
      const slope = (b.price - a.price) / (b.i - a.i);
      const value = b.price + slope * (currentIndex - b.i);
      let touches = 0;
      for (const p of pts) {
        const lineAtP = b.price + slope * (p.i - b.i);
        if (Math.abs(p.price - lineAtP) <= tolerance) touches += 1;
      }
      return { value, slope, touches, anchorA: a, anchorB: b, distance: Math.abs(price - value) };
    };

    const brn = (px) => {
      if (!Number.isFinite(px)) return null;
      const step = px >= 10000 ? 500 : px >= 1000 ? 100 : px >= 100 ? 10 : px >= 10 ? 1 : px >= 1 ? 0.1 : 0.01;
      const level = Math.round(px / step) * step;
      return { level, step, distance: Math.abs(px - level) };
    };

    const levelsFor = (side, entryZone, atrValue, minTarget, oppositeZone) => {
      const z = zone(entryZone);
      if (!z) return { entryPrimary: null, sl: null, tp1: null, tp2: null, tp3: null };
      const width = Math.max(Math.abs(z.high - z.low), atrValue * 0.5);
      const riskDist = Math.max(width * 1.25, atrValue * 0.85, minTarget * 0.28);
      const target1 = Math.max(riskDist * 1.2, minTarget, atrValue * 1.4);

      let tp1 = side === "BUY" ? z.mid + target1 : z.mid - target1;
      let tp2 = side === "BUY" ? z.mid + target1 * 1.85 : z.mid - target1 * 1.85;
      let tp3 = side === "BUY" ? z.mid + target1 * 2.75 : z.mid - target1 * 2.75;

      if (oppositeZone) {
        if (side === "BUY" && oppositeZone.mid > z.mid) tp1 = Math.max(tp1, oppositeZone.low);
        if (side === "SELL" && oppositeZone.mid < z.mid) tp1 = Math.min(tp1, oppositeZone.high);
      }

      return {
        entryPrimary: z,
        sl: round(side === "BUY" ? z.low - riskDist : z.high + riskDist),
        tp1: round(tp1),
        tp2: round(tp2),
        tp3: round(tp3)
      };
    };

    if (!Number.isFinite(price) || candles.length < 30) {
      out.version = "4.1.0-technical-sop";
      out.sopStatus = "INSUFFICIENT_CANDLES";
      out.reason = text(out.reason, "Candle history belum cukup untuk SOP Engine V4.1.");
      return out;
    }

    const recent = candles.slice(-180);
    const last = recent[recent.length - 1];
    const prev = recent[recent.length - 2] || last;
    const atrValue = atr(recent, 14) || Math.max(price * 0.002, 1);
    const buffer = Math.max(atrValue * 0.45, price * 0.0008);
    const tolerance = Math.max(atrValue * 0.65, buffer);

    const swing = swings(recent, 2);
    const lowCluster = cluster(swing.lows.slice(-16).map((p) => p.price), tolerance) || cluster(recent.slice(-80).map((c) => c.l), tolerance);
    const highCluster = cluster(swing.highs.slice(-16).map((p) => p.price), tolerance) || cluster(recent.slice(-80).map((c) => c.h), tolerance);

    const packetDemand = zone(out?.mtfContext?.demandZone);
    const packetSupply = zone(out?.mtfContext?.supplyZone);
    const demand = packetDemand || (lowCluster ? makeZone(lowCluster.level, buffer) : null);
    const supply = packetSupply || (highCluster ? makeZone(highCluster.level, buffer) : null);

    const ema21 = ema(recent, 21);
    const ema50 = ema(recent, 50);
    const ema200 = ema(recent, Math.min(200, recent.length));
    const rsi14 = rsi(recent, 14);
    const tSupport = trendLine(swing.lows, recent.length - 1, tolerance);
    const tResistance = trendLine(swing.highs, recent.length - 1, tolerance);
    const roundNumber = brn(price);

    const baseVol = recent.slice(-20, -5);
    const lastVol = recent.slice(-5);
    const lastVolAvg = baseVol.reduce((s, c) => s + (c.v || 0), 0) / Math.max(1, baseVol.length);
    const currentVolAvg = lastVol.reduce((s, c) => s + (c.v || 0), 0) / Math.max(1, lastVol.length);
    const volumePressure = currentVolAvg > lastVolAvg * 1.15
      ? (last.c >= last.o ? "BUYER PRESSURE" : "SELLER PRESSURE")
      : "NORMAL";

    const structureUp =
      swing.lows.length >= 2 &&
      swing.highs.length >= 2 &&
      swing.lows[swing.lows.length - 1].price > swing.lows[swing.lows.length - 2].price &&
      swing.highs[swing.highs.length - 1].price > swing.highs[swing.highs.length - 2].price;

    const structureDown =
      swing.lows.length >= 2 &&
      swing.highs.length >= 2 &&
      swing.lows[swing.lows.length - 1].price < swing.lows[swing.lows.length - 2].price &&
      swing.highs[swing.highs.length - 1].price < swing.highs[swing.highs.length - 2].price;

    const emaBias = Number.isFinite(ema21) && Number.isFinite(ema50)
      ? (ema21 >= ema50 ? "BUY" : "SELL")
      : text(out.side, "WAIT").toUpperCase();

    const structureBias = structureUp ? "BUY" : structureDown ? "SELL" : emaBias;

    let side = text(out.side, structureBias).toUpperCase();
    if (side !== "BUY" && side !== "SELL") side = structureBias === "SELL" ? "SELL" : "BUY";

    const nearDemand = !!demand && price <= demand.high + atrValue * 0.85;
    const nearSupply = !!supply && price >= supply.low - atrValue * 0.85;
    const inDemand = !!demand && price >= demand.low - buffer && price <= demand.high + buffer;
    const inSupply = !!supply && price >= supply.low - buffer && price <= supply.high + buffer;

    const demandReject = !!demand && last.l <= demand.high + buffer && last.c > last.o && last.c > demand.mid;
    const supplyReject = !!supply && last.h >= supply.low - buffer && last.c < last.o && last.c < supply.mid;

    const demandBreak = !!demand && last.c < demand.low - buffer && prev.c >= demand.low;
    const supplyBreak = !!supply && last.c > supply.high + buffer && prev.c <= supply.high;

    const demandRetestAfterBreak =
      !!demand &&
      price <= demand.high + atrValue * 0.65 &&
      price >= demand.low - atrValue * 0.65 &&
      recent.slice(-8).some((c) => c.c < demand.low - buffer);

    const supplyRetestAfterBreak =
      !!supply &&
      price >= supply.low - atrValue * 0.65 &&
      price <= supply.high + atrValue * 0.65 &&
      recent.slice(-8).some((c) => c.c > supply.high + buffer);

    const oldEntry = zone(out.entryPrimary);

    const reachedTp1 = side === "SELL"
      ? finite(out.tp1) && price <= Number(out.tp1) + atrValue * 0.4
      : finite(out.tp1) && price >= Number(out.tp1) - atrValue * 0.4;

    const reachedTp2 = side === "SELL"
      ? finite(out.tp2) && price <= Number(out.tp2) + atrValue * 0.4
      : finite(out.tp2) && price >= Number(out.tp2) - atrValue * 0.4;

    const reachedTp3 = side === "SELL"
      ? finite(out.tp3) && price <= Number(out.tp3) + atrValue * 0.4
      : finite(out.tp3) && price >= Number(out.tp3) - atrValue * 0.4;

    const touchedEntry = oldEntry && price >= oldEntry.low - buffer && price <= oldEntry.high + buffer;

    const slHit = side === "SELL"
      ? finite(out.sl) && price >= Number(out.sl) - buffer
      : finite(out.sl) && price <= Number(out.sl) + buffer;

    let lifecycle = text(out.lifecycle, "ZONE READY");
    let decision = text(out.decision, side === "BUY" ? "OFFICIAL BUY" : "OFFICIAL SELL");
    let activeZoneRole = "FRESH_ENTRY_ZONE";
    let freshEntry = true;
    let risk = text(out.risk, "Medium");
    let activeZone = oldEntry || (side === "BUY" ? demand : supply) || (nearDemand ? demand : supply);
    let reason = "SOP Engine V4.1 membaca bias, zona terdekat, trendline, SNR, BRN, RSI, volume, dan posisi harga sebelum memberi status.";

    if (side === "SELL") {
      if (slHit) {
        lifecycle = "SL HIT / INVALID";
        decision = "INVALID";
        freshEntry = false;
        activeZoneRole = "INVALIDATION";
      } else if (reachedTp3) {
        lifecycle = "TP3 HIT / SELL COMPLETED";
        decision = "SELL COMPLETED";
        freshEntry = false;
        activeZoneRole = "TP_COMPLETED";
      } else if (reachedTp2) {
        lifecycle = "TP2 HIT / SELL RUNNING";
        decision = "SELL RUNNING";
        freshEntry = false;
        activeZoneRole = "TP_AREA";
      } else if (reachedTp1 || nearDemand) {
        lifecycle = "SELL RUNNING — TP AREA";
        decision = "SELL TP AREA";
        freshEntry = false;
        activeZoneRole = "DEMAND_REACTION_TP_AREA";
        activeZone = demand || oldEntry;
        reason = "Bias sell masih ada, tetapi harga sudah dekat demand/TP area. SOP tidak mengejar sell baru; tunggu demand break dan retest untuk continuation.";
      } else if (demandBreak || demandRetestAfterBreak) {
        lifecycle = "SELL CONTINUATION ZONE";
        decision = "OFFICIAL SELL";
        freshEntry = true;
        activeZoneRole = "SBR_CONTINUATION";
        activeZone = demand || oldEntry;
        reason = "Demand/support ditembus atau sedang retest sebagai SBR. SOP mengizinkan sell continuation.";
      } else if (inSupply || nearSupply || supplyReject) {
        lifecycle = touchedEntry ? "ENTRY TOUCHED / SELL ACTIVE" : "SELL ZONE READY";
        decision = "OFFICIAL SELL";
        freshEntry = true;
        activeZoneRole = "SUPPLY_ENTRY_ZONE";
        activeZone = supply || oldEntry;
      } else if (demandReject && rsi14 <= 45) {
        side = "BUY";
        lifecycle = "BUY WATCH — HIGH RISK COUNTER-TREND";
        decision = "BUY WATCH";
        freshEntry = false;
        activeZoneRole = "COUNTER_TREND_DEMAND_REACTION";
        activeZone = demand || oldEntry;
        risk = "High";
        reason = "Harga reject demand saat bias besar masih sell. SOP hanya memberi BUY WATCH high risk, bukan official buy.";
      }
    } else {
      if (slHit) {
        lifecycle = "SL HIT / INVALID";
        decision = "INVALID";
        freshEntry = false;
        activeZoneRole = "INVALIDATION";
      } else if (reachedTp3) {
        lifecycle = "TP3 HIT / BUY COMPLETED";
        decision = "BUY COMPLETED";
        freshEntry = false;
        activeZoneRole = "TP_COMPLETED";
      } else if (reachedTp2) {
        lifecycle = "TP2 HIT / BUY RUNNING";
        decision = "BUY RUNNING";
        freshEntry = false;
        activeZoneRole = "TP_AREA";
      } else if (reachedTp1 || nearSupply) {
        lifecycle = "BUY RUNNING — TP AREA";
        decision = "BUY TP AREA";
        freshEntry = false;
        activeZoneRole = "SUPPLY_REACTION_TP_AREA";
        activeZone = supply || oldEntry;
        reason = "Bias buy masih ada, tetapi harga sudah dekat supply/TP area. SOP tidak mengejar buy baru; tunggu supply break dan retest untuk continuation.";
      } else if (supplyBreak || supplyRetestAfterBreak) {
        lifecycle = "BUY CONTINUATION ZONE";
        decision = "OFFICIAL BUY";
        freshEntry = true;
        activeZoneRole = "RBS_CONTINUATION";
        activeZone = supply || oldEntry;
        reason = "Supply/resistance ditembus atau sedang retest sebagai RBS. SOP mengizinkan buy continuation.";
      } else if (inDemand || nearDemand || demandReject) {
        lifecycle = touchedEntry ? "ENTRY TOUCHED / BUY ACTIVE" : "BUY ZONE READY";
        decision = "OFFICIAL BUY";
        freshEntry = true;
        activeZoneRole = "DEMAND_ENTRY_ZONE";
        activeZone = demand || oldEntry;
      } else if (supplyReject && rsi14 >= 55) {
        side = "SELL";
        lifecycle = "SELL WATCH — HIGH RISK COUNTER-TREND";
        decision = "SELL WATCH";
        freshEntry = false;
        activeZoneRole = "COUNTER_TREND_SUPPLY_REACTION";
        activeZone = supply || oldEntry;
        risk = "High";
        reason = "Harga reject supply saat bias besar masih buy. SOP hanya memberi SELL WATCH high risk, bukan official sell.";
      }
    }

    const minTarget = num(out.minTarget) || Math.max(atrValue * 1.5, price * 0.002);
    const recompute = activeZone && (!oldEntry || activeZoneRole.includes("CONTINUATION") || activeZoneRole.includes("COUNTER_TREND"));

    if (recompute) {
      const levels = levelsFor(side, activeZone, atrValue, minTarget, side === "BUY" ? supply : demand);
      out.entryPrimary = levels.entryPrimary || out.entryPrimary;
      out.sl = levels.sl || out.sl;
      out.tp1 = levels.tp1 || out.tp1;
      out.tp2 = levels.tp2 || out.tp2;
      out.tp3 = levels.tp3 || out.tp3;
    }

    let score = num(out.score, out.confidence, 60) || 60;

    if ((side === "BUY" && structureBias === "BUY") || (side === "SELL" && structureBias === "SELL")) score += 8;
    else score -= 7;

    if ((side === "BUY" && nearDemand) || (side === "SELL" && nearSupply)) score += 9;
    if (activeZoneRole.includes("TP_AREA")) score -= 12;
    if (activeZoneRole.includes("COUNTER_TREND")) score -= 15;
    if (roundNumber && roundNumber.distance <= atrValue * 0.35) score += 3;
    if (tSupport && side === "BUY" && tSupport.distance <= atrValue) score += 5;
    if (tResistance && side === "SELL" && tResistance.distance <= atrValue) score += 5;
    if ((side === "BUY" && rsi14 < 35) || (side === "SELL" && rsi14 > 65)) score += 4;
    if ((side === "BUY" && volumePressure === "BUYER PRESSURE") || (side === "SELL" && volumePressure === "SELLER PRESSURE")) score += 4;

    score = Math.max(20, Math.min(98, Math.round(score)));

    out.version = "4.1.0-technical-sop";
    out.valid = !!out.entryPrimary && !!out.sl && !!out.tp1 && decision !== "INVALID";
    out.side = side;
    out.zoneType = side === "BUY" ? "BUY ZONE" : "SELL ZONE";
    out.decision = decision;
    out.lifecycle = lifecycle;
    out.risk = risk;
    out.score = score;
    out.confidence = Math.max(num(out.confidence, score) || score, Math.min(score, 96));
    out.freshEntry = freshEntry;
    out.activeZoneRole = activeZoneRole;
    out.hit = {
      entry: !!touchedEntry,
      sl: !!slHit,
      tp1: !!reachedTp1,
      tp2: !!reachedTp2,
      tp3: !!reachedTp3
    };

    out.sop = {
      name: "AiSignal Technical SOP Engine V4.1",
      status: activeZoneRole,
      structureBias,
      emaBias,
      swing: {
        highs: swing.highs.slice(-4),
        lows: swing.lows.slice(-4),
        structureUp,
        structureDown
      },
      trendline: {
        support: tSupport ? {
          value: round(tSupport.value),
          slope: round(tSupport.slope, 8),
          touches: tSupport.touches,
          distance: round(tSupport.distance)
        } : null,
        resistance: tResistance ? {
          value: round(tResistance.value),
          slope: round(tResistance.slope, 8),
          touches: tResistance.touches,
          distance: round(tResistance.distance)
        } : null
      },
      snr: {
        demand,
        supply,
        demandTouches: lowCluster?.touches || 0,
        supplyTouches: highCluster?.touches || 0
      },
      indicator: {
        ema21: round(ema21),
        ema50: round(ema50),
        ema200: round(ema200),
        rsi14: round(rsi14, 2),
        atr14: round(atrValue),
        volumePressure,
        brn: roundNumber ? {
          level: round(roundNumber.level),
          distance: round(roundNumber.distance),
          step: round(roundNumber.step)
        } : null
      },
      rules: {
        nearDemand,
        nearSupply,
        demandReject,
        supplyReject,
        demandBreak,
        supplyBreak,
        demandRetestAfterBreak,
        supplyRetestAfterBreak
      }
    };

    out.reason = reason + " Score SOP: " + score + ".";

    try {
      STATE.last = out;
      window.__ASFX_PLAN_PACKET_LAST_V1__ = out;
      window.dispatchEvent(new CustomEvent("asfx:plan-packet:v1", { detail: out }));
    } catch (_) {}

    return out;
  }




  /* ASFX_SOP_ENGINE_FINAL_V5
     Final packet normalizer for the active web engine.
     This keeps the existing SOP reader, then forces one clean output contract:
     FRESH_ENTRY, WAITING_ZONE, REACTION_ZONE, TP/PROTECT, or SETUP_CLOSED.
  */
  const asfxSopEngineFinalV5 = (packet) => {
    if (!packet || typeof packet !== "object") return packet;

    const finite = (value) => Number.isFinite(Number(value));
    const num = (...values) => {
      for (const value of values) {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
      }
      return null;
    };
    const roundV5 = (value, digits = 5) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      const f = 10 ** digits;
      return Math.round(n * f) / f;
    };
    const zoneV5 = (z) => {
      if (!z || typeof z !== "object") return null;
      const low = num(z.low, z.min, z.from);
      const high = num(z.high, z.max, z.to);
      if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
      const a = Math.min(low, high);
      const b = Math.max(low, high);
      return { low: roundV5(a), high: roundV5(b), mid: roundV5((a + b) / 2) };
    };
    const normalizeCandleV5 = (c, i) => {
      if (!c) return null;
      const o = num(c.o, c.open, Array.isArray(c) ? c[1] : null);
      const h = num(c.h, c.high, Array.isArray(c) ? c[2] : null);
      const l = num(c.l, c.low, Array.isArray(c) ? c[3] : null);
      const close = num(c.c, c.close, Array.isArray(c) ? c[4] : null);
      if (![o, h, l, close].every(Number.isFinite)) return null;
      return { i, t: num(c.t, c.time, Array.isArray(c) ? c[0] : null) || i, o, h, l, c: close, v: num(c.v, c.volume, Array.isArray(c) ? c[5] : null) || 0 };
    };
    const candlesV5 = (Array.isArray(window.__ASFX_DETAIL_CANDLES_V1__) ? window.__ASFX_DETAIL_CANDLES_V1__ : [])
      .map(normalizeCandleV5)
      .filter(Boolean)
      .slice(-240);
    const atrV5 = (list, period = 14) => {
      const src = list.slice(-period - 1);
      if (src.length < 2) return 0;
      let total = 0;
      let count = 0;
      for (let i = 1; i < src.length; i += 1) {
        const prevClose = src[i - 1].c;
        const tr = Math.max(src[i].h - src[i].l, Math.abs(src[i].h - prevClose), Math.abs(src[i].l - prevClose));
        if (Number.isFinite(tr)) {
          total += tr;
          count += 1;
        }
      }
      return count ? total / count : 0;
    };

    const p = { ...packet };
    const last = candlesV5[candlesV5.length - 1] || {};
    const price = num(p.price, p.currentPrice, p.source?.currentPrice, p.source?.price, last.c);
    const entry = zoneV5(p.entryPrimary);
    const demand = zoneV5(p.sop?.snr?.demand || p.mtfContext?.demandZone || p.demandZone);
    const supply = zoneV5(p.sop?.snr?.supply || p.mtfContext?.supplyZone || p.supplyZone);

    let side = String(p.side || "").toUpperCase();
    if (side !== "BUY" && side !== "SELL" && entry && finite(p.tp1)) {
      side = Number(p.tp1) >= Number(entry.mid) ? "BUY" : "SELL";
    }

    const atrValue = Math.max(
      num(p.sop?.indicator?.atr14, p.zoneBrain?.atrValue, atrV5(candlesV5, 14), price ? Math.abs(price) * 0.0015 : null, 1) || 1,
      1e-9
    );
    const buffer = Math.max(atrValue * 0.45, price ? Math.abs(price) * 0.0005 : 0);
    const statusText = [p.decision, p.lifecycle, p.activeZoneRole, p.zoneType].filter(Boolean).join(" ").toUpperCase();

    const insideZone = (z) => z && Number.isFinite(price) && price >= z.low - buffer && price <= z.high + buffer;
    const distanceToZone = (z) => {
      if (!z || !Number.isFinite(price)) return Infinity;
      if (price < z.low) return z.low - price;
      if (price > z.high) return price - z.high;
      return 0;
    };
    const inEntry = insideZone(entry);
    const inDemand = insideZone(demand);
    const inSupply = insideZone(supply);

    const hit = {
      entry: !!(p.hit?.entry || inEntry),
      sl: !!p.hit?.sl,
      tp1: !!p.hit?.tp1,
      tp2: !!p.hit?.tp2,
      tp3: !!p.hit?.tp3
    };
    if (side === "BUY") {
      if (finite(p.sl) && price <= Number(p.sl) + buffer) hit.sl = true;
      if (finite(p.tp1) && price >= Number(p.tp1) - buffer) hit.tp1 = true;
      if (finite(p.tp2) && price >= Number(p.tp2) - buffer) hit.tp2 = true;
      if (finite(p.tp3) && price >= Number(p.tp3) - buffer) hit.tp3 = true;
    } else if (side === "SELL") {
      if (finite(p.sl) && price >= Number(p.sl) - buffer) hit.sl = true;
      if (finite(p.tp1) && price <= Number(p.tp1) + buffer) hit.tp1 = true;
      if (finite(p.tp2) && price <= Number(p.tp2) + buffer) hit.tp2 = true;
      if (finite(p.tp3) && price <= Number(p.tp3) + buffer) hit.tp3 = true;
    }

    const liquidityV5 = (() => {
      const list = candlesV5.slice(-50);
      if (list.length < 12 || !Number.isFinite(price)) {
        return { equalHigh: null, equalLow: null, sweepHigh: false, sweepLow: false, stopHunt: false, note: "Liquidity belum cukup terbaca." };
      }
      const prev = list.slice(0, -1);
      const highs = prev.map((c) => c.h).filter(Number.isFinite).slice(-24);
      const lows = prev.map((c) => c.l).filter(Number.isFinite).slice(-24);
      const maxHigh = highs.length ? Math.max(...highs) : null;
      const minLow = lows.length ? Math.min(...lows) : null;
      const highTouches = maxHigh ? highs.filter((v) => Math.abs(v - maxHigh) <= buffer).length : 0;
      const lowTouches = minLow ? lows.filter((v) => Math.abs(v - minLow) <= buffer).length : 0;
      const lastHigh = Number(list[list.length - 1].h);
      const lastLow = Number(list[list.length - 1].l);
      const lastClose = Number(list[list.length - 1].c);
      const sweepHigh = Number.isFinite(maxHigh) && lastHigh > maxHigh + buffer * 0.2 && lastClose < maxHigh;
      const sweepLow = Number.isFinite(minLow) && lastLow < minLow - buffer * 0.2 && lastClose > minLow;
      let note = "Liquidity normal.";
      if (sweepHigh) note = "Sweep equal high terdeteksi; buyer berpotensi kehabisan tenaga.";
      else if (sweepLow) note = "Sweep equal low terdeteksi; seller berpotensi kehabisan tenaga.";
      else if (highTouches >= 2) note = "Equal high/liquidity atas terpantau.";
      else if (lowTouches >= 2) note = "Equal low/liquidity bawah terpantau.";
      return {
        equalHigh: maxHigh ? { level: roundV5(maxHigh), touches: highTouches } : null,
        equalLow: minLow ? { level: roundV5(minLow), touches: lowTouches } : null,
        sweepHigh,
        sweepLow,
        stopHunt: sweepHigh || sweepLow,
        note
      };
    })();

    const indicator = p.sop?.indicator || {};
    const rules = p.sop?.rules || {};
    const structure = p.sop || {};
    const rsi14 = num(indicator.rsi14, 50) || 50;
    const volumePressure = String(indicator.volumePressure || p.volumeFlow?.direction || "").toUpperCase();
    const structureUp = !!p.sop?.swing?.structureUp;
    const structureDown = !!p.sop?.swing?.structureDown;
    const nearDemand = !!rules.nearDemand || inDemand;
    const nearSupply = !!rules.nearSupply || inSupply;
    const demandReject = !!rules.demandReject;
    const supplyReject = !!rules.supplyReject;

    let continuationScore = 50;
    if (side === "BUY") {
      if (structureUp) continuationScore += 8;
      if (volumePressure.includes("BUYER")) continuationScore += 9;
      if (rsi14 >= 42 && rsi14 <= 72) continuationScore += 6;
      if (nearSupply || supplyReject) continuationScore -= 18;
      if (rsi14 > 76 || liquidityV5.sweepHigh) continuationScore -= 14;
      if (liquidityV5.sweepLow) continuationScore += 6;
    } else if (side === "SELL") {
      if (structureDown) continuationScore += 8;
      if (volumePressure.includes("SELLER")) continuationScore += 9;
      if (rsi14 >= 28 && rsi14 <= 58) continuationScore += 6;
      if (nearDemand || demandReject) continuationScore -= 18;
      if (rsi14 < 24 || liquidityV5.sweepLow) continuationScore -= 14;
      if (liquidityV5.sweepHigh) continuationScore += 6;
    }
    continuationScore = Math.max(0, Math.min(100, Math.round(continuationScore)));
    const tp2Valid = continuationScore >= 54 && !hit.sl && !hit.tp3;
    const tp3Valid = continuationScore >= 66 && !hit.sl && !hit.tp3;

    const hasEntryPlan = !!entry && (side === "BUY" || side === "SELL") && p.valid !== false && finite(p.sl) && finite(p.tp1) && finite(p.tp2);
    const closed = hit.sl || hit.tp3 || /INVALID|CLOSED|COMPLETED|SL HIT/.test(statusText);
    const running = /TP AREA|RUNNING|PROTECT|TP1 HIT|TP2 HIT|TP3 HIT/.test(statusText) || hit.tp1 || hit.tp2;
    let chartMode = "ZONE_SCAN";
    let decision = "ZONE SCAN";
    let lifecycle = "SCANNING ZONE";
    let freshEntry = false;
    let contextZone = null;
    let targetReason = "Belum ada zona aktif yang cukup bersih.";

    if (closed) {
      chartMode = "SETUP_CLOSED";
      decision = hit.sl ? "INVALID" : side + " COMPLETED";
      lifecycle = hit.sl ? "SL HIT / SETUP CLOSED" : "TP3 HIT / SETUP COMPLETED";
      targetReason = hit.sl ? "SL/invalidasi terkena. Setup ditutup." : "TP3 sudah tercapai. Setup selesai.";
    } else if (hit.tp2) {
      chartMode = tp3Valid ? "TP2_HIT_TP3_VALID" : "TP2_HIT_PROTECT_PROFIT";
      decision = side + (tp3Valid ? " TP2 HIT — TP3 VALID" : " TP2 HIT — PROTECT PROFIT");
      lifecycle = side + (tp3Valid ? " RUNNING — TP3 WATCH" : " RUNNING — PROTECT PROFIT");
      targetReason = tp3Valid ? "TP2 sudah kena; TP3 masih valid tapi wajib dijaga." : "TP2 sudah kena; momentum ke TP3 melemah. Protect profit lebih aman.";
      contextZone = side === "BUY" ? supply : demand;
    } else if (hit.tp1 || running) {
      chartMode = tp2Valid ? "TP1_HIT_TP2_VALID" : "TP1_HIT_PROTECT_PROFIT";
      decision = side + (tp2Valid ? " TP1 HIT — TP2 VALID" : " TP1 HIT — PROTECT PROFIT");
      lifecycle = side + (tp2Valid ? " RUNNING — TP2 WATCH" : " RUNNING — PROTECT PROFIT");
      targetReason = tp2Valid ? "TP1 sudah kena; TP2 masih valid berdasarkan momentum, volume, zona lawan, RSI, dan liquidity." : "TP1 sudah kena atau harga berada di TP area; TP2/TP3 kurang sehat. Protect profit, jangan kejar entry baru.";
      contextZone = side === "BUY" ? supply : demand;
    } else if (hasEntryPlan && inEntry) {
      chartMode = "FRESH_ENTRY";
      decision = side === "BUY" ? "OFFICIAL BUY" : "OFFICIAL SELL";
      lifecycle = side + " ENTRY ZONE ACTIVE";
      freshEntry = true;
      contextZone = entry;
      targetReason = "Harga sudah berada di dalam/dekat entry zone. Entry/SL/TP valid untuk chart indicator.";
    } else if (hasEntryPlan && !inEntry) {
      chartMode = "WAITING_ZONE";
      decision = side + " WATCH";
      lifecycle = side + " WAITING ENTRY ZONE";
      contextZone = entry;
      targetReason = "Zona entry sudah terbaca, tapi harga belum masuk zona. Tunggu price masuk zona dan konfirmasi candle/volume.";
    } else if (demand || supply) {
      const demandDist = distanceToZone(demand);
      const supplyDist = distanceToZone(supply);
      const useDemand = demand && (!supply || demandDist <= supplyDist);
      side = useDemand ? "BUY" : "SELL";
      contextZone = useDemand ? demand : supply;
      chartMode = insideZone(contextZone) ? "REACTION_ZONE" : "WAITING_ZONE";
      decision = side + " WATCH";
      lifecycle = useDemand ? "DEMAND/RBR WATCH ZONE" : "SUPPLY/DBD WATCH ZONE";
      targetReason = useDemand ? "Demand/support context terbaca. Tunggu harga masuk zona dan rejection buyer." : "Supply/resistance context terbaca. Tunggu harga masuk zona dan rejection seller.";
    }

    p.version = "5.0.0-sop-engine";
    p.engineName = "AiSignal SOP Engine V5";
    p.side = side === "BUY" || side === "SELL" ? side : p.side;
    p.price = roundV5(price);
    p.valid = chartMode !== "ZONE_SCAN" && chartMode !== "SETUP_CLOSED" && p.valid !== false;
    p.decision = decision;
    p.lifecycle = lifecycle;
    p.chartMode = chartMode;
    p.visualMode = chartMode;
    p.freshEntry = !!freshEntry;
    p.noFreshEntry = !freshEntry;
    p.hit = hit;
    p.liquidity = liquidityV5;
    p.contextZone = zoneV5(contextZone);
    p.watchZone = chartMode === "WAITING_ZONE" || chartMode === "REACTION_ZONE" ? zoneV5(contextZone) : null;
    p.contextZoneText = p.contextZone ? `${p.contextZone.low} - ${p.contextZone.high}` : "";
    p.targetValidity = {
      continuationScore,
      tp2Valid,
      tp3Valid,
      protectProfit: /PROTECT/.test(chartMode),
      reason: targetReason
    };
    p.activeLines = {
      entry: chartMode === "FRESH_ENTRY",
      sl: chartMode === "FRESH_ENTRY",
      tp1: chartMode === "FRESH_ENTRY" && !hit.tp1,
      tp2: chartMode === "FRESH_ENTRY" || chartMode === "TP1_HIT_TP2_VALID",
      tp3: chartMode === "FRESH_ENTRY" || chartMode === "TP1_HIT_TP2_VALID" || chartMode === "TP2_HIT_TP3_VALID",
      contextZone: chartMode === "WAITING_ZONE" || chartMode === "REACTION_ZONE" || /PROTECT|TP/.test(chartMode)
    };
    p.sop = {
      ...(p.sop || {}),
      name: "AiSignal SOP Engine V5",
      version: "5.0.0",
      finalizer: {
        chartMode,
        inEntry,
        buffer: roundV5(buffer),
        contextZone: p.contextZone,
        liquidity: liquidityV5,
        targetValidity: p.targetValidity
      }
    };
    p.reason = targetReason + " " + String(p.reason || "");

    STATE.last = p;
    window.__ASFX_PLAN_PACKET_LAST_V1__ = p;
    try { window.dispatchEvent(new CustomEvent("asfx:plan-packet:v1", { detail: p })); } catch (_) {}
    return p;
  };

  const update = () => asfxSopEngineFinalV5(asfxTechnicalSopV41(asfxDecisiveZoneV401(buildPacket())));
window.ASFXPlanPacketV1 = {
    version: "5.0.0-sop-engine",
    build: update,
    latest: () => window.__ASFX_PLAN_PACKET_LAST_V1__ || update(),
    state: STATE
  };

  update();
  setInterval(update, 1200);

  console.info("ASFX SOP Engine V5 ready.");
})();

