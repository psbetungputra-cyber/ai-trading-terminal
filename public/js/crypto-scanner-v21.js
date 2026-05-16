/* AiSignalFx PRO - Crypto Scanner V2.1 Valid Setup Logic */
(function(){
  const TOP = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","TONUSDT"];
  const HOSTS = ["https://api.binance.com","https://api1.binance.com","https://api2.binance.com","https://api3.binance.com","https://data-api.binance.vision"];
  let currentMode = "crypto";

  function fmt(n, price){
    if (!Number.isFinite(n)) return "-";
    return Number(n).toLocaleString("en-US", { maximumFractionDigits: price > 100 ? 2 : 4 });
  }

  async function fetchJson(path){
    let lastErr;
    for (const host of HOSTS) {
      try {
        const res = await fetch(host + path, { cache: "no-store" });
        if (!res.ok) throw new Error("Binance " + res.status);
        return await res.json();
      } catch(err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Binance unavailable");
  }

  async function klines(symbol, interval){
    const rows = await fetchJson(`/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=90`);
    return rows.map(x => ({
      open: Number(x[1]),
      high: Number(x[2]),
      low: Number(x[3]),
      close: Number(x[4]),
      volume: Number(x[5])
    }));
  }

  function ema(values, period){
    if (!values.length) return 0;
    const k = 2 / (period + 1);
    let out = values[0];
    for (let i = 1; i < values.length; i++) out = values[i] * k + out * (1 - k);
    return out;
  }

  function rsi(values, period = 14){
    if (values.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = values.length - period; i < values.length; i++){
      const d = values[i] - values[i - 1];
      if (d >= 0) gains += d;
      else losses += Math.abs(d);
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  }

  function atr(rows, period = 14){
    const slice = rows.slice(-period);
    if (!slice.length) return 0;
    return slice.reduce((sum, x) => sum + Math.abs(x.high - x.low), 0) / slice.length;
  }

  async function buildSignal(ticker){
    const symbol = ticker.symbol;
    const price = Number(ticker.lastPrice || 0);
    const change = Number(ticker.priceChangePercent || 0);

    const [m15, h1, h4] = await Promise.all([
      klines(symbol, "15m"),
      klines(symbol, "1h"),
      klines(symbol, "4h")
    ]);

    const c15 = m15.map(x => x.close);
    const c1 = h1.map(x => x.close);
    const c4 = h4.map(x => x.close);

    const ema9 = ema(c1.slice(-50), 9);
    const ema21 = ema(c1.slice(-70), 21);
    const ema4Fast = ema(c4.slice(-50), 9);
    const ema4Slow = ema(c4.slice(-70), 21);
    const rsi1 = rsi(c1);
    const rsi15 = rsi(c15);

    const recent = h1.slice(-24);
    const swingHigh = Math.max(...recent.map(x => x.high));
    const swingLow = Math.min(...recent.map(x => x.low));
    const atrValue = atr(h1);
    const volatility = price ? ((swingHigh - swingLow) / price) * 100 : 0;

    let trend = "Sideways";
    if (price > ema21 && ema9 > ema21) trend = "Bullish";
    if (price < ema21 && ema9 < ema21) trend = "Bearish";

    let macro = "Neutral";
    if (ema4Fast > ema4Slow) macro = "Bullish";
    if (ema4Fast < ema4Slow) macro = "Bearish";

    let momentum = "Neutral";
    if (rsi1 > 56 && rsi15 > 52) momentum = "Bullish";
    if (rsi1 < 44 && rsi15 < 48) momentum = "Bearish";

    let bias = "WAIT";
    if (trend === "Bullish" && momentum === "Bullish" && change > -1.5) bias = "BUY";
    if (trend === "Bearish" && momentum === "Bearish" && change < 1.5) bias = "SELL";

    const risk = volatility > 7 ? "High" : volatility > 3.5 ? "Medium" : "Low";
    const aligned = trend === macro && trend !== "Sideways";
    const confidence = Math.min(
      94,
      Math.max(
        55,
        Math.round(58 + (aligned ? 12 : 0) + (momentum !== "Neutral" ? 9 : 0) + Math.min(Math.abs(change) * 3, 12))
      )
    );

    const rsiSafeBuy = rsi1 >= 45 && rsi1 <= 72;
    const rsiSafeSell = rsi1 >= 28 && rsi1 <= 55;

    const validSetup =
      bias !== "WAIT" &&
      confidence >= 75 &&
      aligned &&
      risk !== "High" &&
      ((bias === "BUY" && rsiSafeBuy) || (bias === "SELL" && rsiSafeSell));

    let entryZone = "Tunggu konfirmasi";
    let stopLoss = "Tunggu konfirmasi";
    let tp1 = "Tunggu konfirmasi";
    let tp2 = "Tunggu konfirmasi";

    if (validSetup && bias === "BUY") {
      const entryLow = price - atrValue * 0.35;
      const entryHigh = price + atrValue * 0.10;
      entryZone = `${fmt(entryLow, price)} - ${fmt(entryHigh, price)}`;
      stopLoss = fmt(Math.min(swingLow, price - atrValue * 1.25), price);
      tp1 = fmt(price + atrValue * 1.15, price);
      tp2 = fmt(Math.max(swingHigh, price + atrValue * 1.85), price);
    }

    if (validSetup && bias === "SELL") {
      const entryLow = price - atrValue * 0.10;
      const entryHigh = price + atrValue * 0.35;
      entryZone = `${fmt(entryLow, price)} - ${fmt(entryHigh, price)}`;
      stopLoss = fmt(Math.max(swingHigh, price + atrValue * 1.25), price);
      tp1 = fmt(price - atrValue * 1.15, price);
      tp2 = fmt(Math.min(swingLow, price - atrValue * 1.85), price);
    }

    const status = validSetup ? "VALID SETUP" : "WAIT CONFIRMATION";
    const reason = validSetup
      ? `${bias} setup valid: trend, macro, momentum, dan risk masih mendukung. Tetap tunggu candle konfirmasi sebelum entry.`
      : `Belum valid untuk entry angka detail. Trend: ${trend}, Macro: ${macro}, Momentum: ${momentum}, Risk: ${risk}.`;

    return {
      symbol,
      price,
      change,
      bias,
      trend,
      macro,
      momentum,
      risk,
      confidence,
      rsi: Math.round(rsi1),
      status,
      validSetup,
      entryZone,
      stopLoss,
      tp1,
      tp2,
      reason
    };
  }

  async function getSignals(){
    const tickers = await fetchJson("/api/v3/ticker/24hr");
    const allowed = new Set(TOP);
    const selected = tickers
      .filter(x => allowed.has(x.symbol))
      .sort((a,b) => TOP.indexOf(a.symbol) - TOP.indexOf(b.symbol));

    const rows = [];
    for (const t of selected) {
      try {
        rows.push(await buildSignal(t));
      } catch(e) {
        rows.push({
          symbol: t.symbol,
          price: Number(t.lastPrice || 0),
          change: Number(t.priceChangePercent || 0),
          bias: "WAIT",
          trend: "Reference",
          macro: "Reference",
          momentum: "Neutral",
          risk: "Medium",
          confidence: 58,
          rsi: 50,
          status: "WAIT CONFIRMATION",
          validSetup: false,
          entryZone: "Tunggu konfirmasi",
          stopLoss: "Tunggu konfirmasi",
          tp1: "Tunggu konfirmasi",
          tp2: "Tunggu konfirmasi",
          reason: "Klines belum terbaca. Scanner memakai reference mode."
        });
      }
    }
    return rows;
  }

  function badgeClass(bias){
    if (bias === "BUY") return "buy";
    if (bias === "SELL") return "sell";
    return "wait";
  }

  function render(rows){
    const grid = document.getElementById("scanner-grid");
    if (!grid) return;

    grid.innerHTML = rows.map(x => `
      <div class="card signal-card scanner-v21-card ${x.validSetup ? "valid-setup" : "wait-setup"}">
        <div class="signal-card-top">
          <span class="badge ${badgeClass(x.bias)}">${x.bias}</span>
          <span class="badge ${x.validSetup ? "vip" : "free"}">${x.status || "BIAS PREVIEW"}</span>
        </div>

        <h3>${x.symbol}</h3>
        <p class="crypto-price">$${fmt(x.price, x.price)}</p>
        <p><b>24h:</b> <span class="${x.change >= 0 ? "green" : "red"}">${x.change.toFixed(2)}%</span></p>

        <div class="scanner-v2-grid">
          <span><b>Trend:</b> ${x.trend}</span>
          <span><b>Macro:</b> ${x.macro}</span>
          <span><b>Momentum:</b> ${x.momentum}</span>
          <span><b>Risk:</b> ${x.risk}</span>
        </div>

        <p><b>Confidence:</b> ${x.confidence}% · <b>RSI:</b> ${x.rsi}</p>

        <div class="scanner-v21-plan">
          <p><b>Entry Zone:</b> ${x.entryZone}</p>
          <p><b>Stop Loss:</b> ${x.stopLoss}</p>
          <p><b>TP 1:</b> ${x.tp1}</p>
          <p><b>TP 2:</b> ${x.tp2}</p>
        </div>

        <p>${x.reason}</p>
        <small>Binance V2.1 · ticker + klines 15m/1h/4h · educational analysis</small>
      </div>
    `).join("");
  }

  async function loadV21(){
    const grid = document.getElementById("scanner-grid");
    if (grid) grid.innerHTML = `<p class="muted">Loading Binance V2.1 valid setup scanner...</p>`;

    try {
      const rows = await getSignals();
      render(rows);
    } catch(e) {
      if (grid) grid.innerHTML = `<p class="muted">Binance V2.1 belum tersedia. Coba refresh scanner.</p>`;
    }
  }

  window.loadCryptoMarket = loadV21;
  window.renderScannerGrid = function(){ loadV21(); };
  window.setScannerMode = function(mode){
    if (mode !== "crypto") {
      if (typeof window.__oldScannerMode === "function") window.__oldScannerMode(mode);
      return;
    }
    document.querySelectorAll(".scanner-tools .chip").forEach(btn => btn.classList.remove("active"));
    const active = Array.from(document.querySelectorAll(".scanner-tools .chip")).find(btn => (btn.getAttribute("onclick") || "").includes("'crypto'"));
    if (active) active.classList.add("active");
    loadV21();
  };

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(loadV21, 2300);
    setTimeout(loadV21, 4600);
  });
})();
