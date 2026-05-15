/* AiSignalFx PRO - Crypto Scanner V2 Klines Engine */
(function(){
  const TOP = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","TONUSDT"];
  const HOSTS = ["https://api.binance.com","https://api1.binance.com","https://api2.binance.com","https://api3.binance.com","https://data-api.binance.vision"];
  let currentMode = "crypto";
  let latestSignals = [];

  const demoForex = [
    {symbol:"XAUUSD", market:"gold", bias:"WAIT", confidence:72, trend:"Bullish session view", momentum:"Waiting confirmation", risk:"Medium", entryIdea:"Tunggu retest premium/discount area.", invalid:"Break struktur berlawanan.", tp:"Nearest liquidity.", note:"Reference mode forex/gold."},
    {symbol:"EURUSD", market:"forex", bias:"WAIT", confidence:64, trend:"Neutral", momentum:"Mixed", risk:"Low", entryIdea:"Tunggu BOS/CHoCH valid.", invalid:"Invalid jika sweep gagal.", tp:"Session liquidity.", note:"Reference mode forex."},
    {symbol:"GBPUSD", market:"forex", bias:"SELL", confidence:68, trend:"Bearish pullback", momentum:"Weak", risk:"Medium", entryIdea:"Tunggu retest supply kecil.", invalid:"Break above previous swing.", tp:"London low liquidity.", note:"Reference mode forex."}
  ];

  function ema(values, period){
    if (!values.length) return 0;
    const k = 2 / (period + 1);
    let e = values[0];
    for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
    return e;
  }

  function rsi(values, period = 14){
    if (values.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = values.length - period; i < values.length; i++){
      const diff = values[i] - values[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  }

  async function fetchJson(path){
    let lastErr;
    for (const host of HOSTS){
      try {
        const res = await fetch(host + path, { cache: "no-store" });
        if (!res.ok) throw new Error("Binance " + res.status);
        return await res.json();
      } catch(err){
        lastErr = err;
      }
    }
    throw lastErr || new Error("Binance unavailable");
  }

  async function ticker24(){
    const data = await fetchJson("/api/v3/ticker/24hr");
    const allowed = new Set(TOP);
    return data.filter(x => allowed.has(x.symbol)).sort((a,b) => TOP.indexOf(a.symbol) - TOP.indexOf(b.symbol));
  }

  async function klines(symbol, interval, limit = 80){
    const rows = await fetchJson(`/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    return rows.map(x => ({
      open: Number(x[1]),
      high: Number(x[2]),
      low: Number(x[3]),
      close: Number(x[4]),
      volume: Number(x[5])
    }));
  }

  function analyze(symbol, ticker, m15, h1, h4){
    const closes1h = h1.map(x => x.close);
    const closes15 = m15.map(x => x.close);
    const closes4h = h4.map(x => x.close);
    const price = Number(ticker.lastPrice || closes1h.at(-1) || 0);
    const change = Number(ticker.priceChangePercent || 0);

    const emaFast = ema(closes1h.slice(-40), 9);
    const emaSlow = ema(closes1h.slice(-60), 21);
    const rsi1h = rsi(closes1h, 14);
    const rsi15 = rsi(closes15, 14);
    const ema4hFast = ema(closes4h.slice(-40), 9);
    const ema4hSlow = ema(closes4h.slice(-60), 21);

    const last20 = h1.slice(-20);
    const swingHigh = Math.max(...last20.map(x => x.high));
    const swingLow = Math.min(...last20.map(x => x.low));
    const volatility = price ? ((swingHigh - swingLow) / price) * 100 : 0;

    let trend = "Sideways";
    if (price > emaSlow && emaFast > emaSlow) trend = "Bullish";
    if (price < emaSlow && emaFast < emaSlow) trend = "Bearish";

    let macro = "Neutral";
    if (ema4hFast > ema4hSlow) macro = "Bullish";
    if (ema4hFast < ema4hSlow) macro = "Bearish";

    let momentum = "Neutral";
    if (rsi1h > 56 && rsi15 > 52) momentum = "Bullish";
    if (rsi1h < 44 && rsi15 < 48) momentum = "Bearish";

    let bias = "WAIT";
    if (trend === "Bullish" && momentum === "Bullish" && change > 0.2) bias = "BUY";
    if (trend === "Bearish" && momentum === "Bearish" && change < -0.2) bias = "SELL";

    let risk = "Low";
    if (volatility > 3.5) risk = "Medium";
    if (volatility > 7) risk = "High";

    const aligned = trend === macro ? 10 : 0;
    const momentumScore = momentum !== "Neutral" ? 8 : 0;
    const changeScore = Math.min(12, Math.abs(change) * 3);
    const confidence = Math.min(94, Math.max(55, Math.round(58 + aligned + momentumScore + changeScore + Math.min(volatility, 6))));

    const entryIdea = bias === "BUY"
      ? "Tunggu pullback/retest di atas EMA area sebelum entry."
      : bias === "SELL"
        ? "Tunggu retest area breakdown sebelum continuation."
        : "Tunggu BOS/CHoCH dan candle konfirmasi.";

    const invalid = bias === "BUY"
      ? `Invalid jika breakdown di bawah ${swingLow.toFixed(price > 100 ? 2 : 4)}`
      : bias === "SELL"
        ? `Invalid jika break kuat di atas ${swingHigh.toFixed(price > 100 ? 2 : 4)}`
        : "Invalid jika struktur tetap choppy/no confirmation.";

    const tp = bias === "BUY"
      ? `TP reference: liquidity dekat ${swingHigh.toFixed(price > 100 ? 2 : 4)}`
      : bias === "SELL"
        ? `TP reference: liquidity dekat ${swingLow.toFixed(price > 100 ? 2 : 4)}`
        : "TP reference menunggu struktur valid.";

    const note = `${trend} H1 · Macro ${macro} H4 · RSI ${Math.round(rsi1h)}. ${entryIdea}`;

    return {
      symbol, market:"crypto", bias, confidence, price, change,
      trend, macro, momentum, risk, rsi: Math.round(rsi1h),
      volatility: volatility.toFixed(2),
      entryIdea, invalid, tp, note
    };
  }

  async function getSignals(){
    const ticks = await ticker24();
    const signals = [];
    for (const t of ticks){
      try {
        const [m15, h1, h4] = await Promise.all([
          klines(t.symbol, "15m", 80),
          klines(t.symbol, "1h", 80),
          klines(t.symbol, "4h", 80)
        ]);
        signals.push(analyze(t.symbol, t, m15, h1, h4));
      } catch(e){
        signals.push({
          symbol:t.symbol, market:"crypto", bias:"WAIT", confidence:58,
          price:Number(t.lastPrice || 0), change:Number(t.priceChangePercent || 0),
          trend:"Reference", macro:"Reference", momentum:"Neutral", risk:"Medium",
          note:"Klines belum tersedia. Memakai ticker reference mode.",
          entryIdea:"Tunggu struktur lebih jelas.", invalid:"Belum tersedia.", tp:"Belum tersedia."
        });
      }
    }
    return signals;
  }

  function badge(bias){
    if (bias === "BUY") return "buy";
    if (bias === "SELL") return "sell";
    return "wait";
  }

  function priceText(x){
    if (!x.price) return "Reference";
    return "$" + Number(x.price).toLocaleString("en-US", { maximumFractionDigits: x.price > 100 ? 2 : 4 });
  }

  function renderScanner(rows){
    const grid = document.getElementById("scanner-grid");
    if (!grid) return;

    const data = rows && rows.length ? rows : demoForex;

    grid.innerHTML = data.slice(0, 12).map(x => `
      <div class="card signal-card scanner-v2-card">
        <div class="signal-card-top">
          <span class="badge ${badge(x.bias)}">${x.bias}</span>
          <span class="badge free">${x.market === "crypto" ? "BINANCE V2" : "REFERENCE"}</span>
        </div>
        <h3>${x.symbol}</h3>
        ${x.price ? `<p class="crypto-price">${priceText(x)}</p>` : ""}
        ${typeof x.change === "number" ? `<p><b>24h:</b> <span class="${x.change >= 0 ? "green" : "red"}">${x.change.toFixed(2)}%</span></p>` : ""}
        <div class="scanner-v2-grid">
          <span><b>Trend:</b> ${x.trend || "-"}</span>
          <span><b>Macro:</b> ${x.macro || "-"}</span>
          <span><b>Momentum:</b> ${x.momentum || "-"}</span>
          <span><b>Risk:</b> ${x.risk || "-"}</span>
        </div>
        <p><b>Confidence:</b> ${x.confidence}%</p>
        <p>${x.note}</p>
        <div class="scanner-v2-plan">
          <p><b>Entry idea:</b> ${x.entryIdea}</p>
          <p><b>Invalid:</b> ${x.invalid}</p>
          <p><b>TP:</b> ${x.tp}</p>
        </div>
        <small>${x.market === "crypto" ? "Real mode · Binance klines 15m/1h/4h" : "Demo/reference mode"}</small>
      </div>
    `).join("");
  }

  function renderPulse(rows, fallback = false){
    const box = document.getElementById("crypto-market-preview");
    if (!box) return;
    const data = rows && rows.length ? rows.slice(0,4) : [];

    box.innerHTML = data.length ? `
      <div class="crypto-pulse-list">
        ${data.map(x => `
          <div class="crypto-pulse-item">
            <b>${x.symbol}</b>
            <span>${priceText(x)}</span>
            <small class="${(x.change || 0) >= 0 ? "green" : "red"}">${(x.change || 0).toFixed(2)}%</small>
          </div>
        `).join("")}
      </div>
      <p class="muted">${fallback ? "Fallback reference mode." : "Binance V2 active: ticker + klines."}</p>
    ` : `<p class="muted">Crypto data sedang dimuat.</p>`;
  }

  async function load(){
    try {
      renderPulse([], false);
      const rows = await getSignals();
      latestSignals = rows;
      if (currentMode === "crypto") renderScanner(rows);
      else if (currentMode === "gold") renderScanner(demoForex.filter(x => x.market === "gold"));
      else if (currentMode === "forex") renderScanner(demoForex.filter(x => x.market === "forex"));
      else renderScanner([...demoForex.slice(0,2), ...rows.slice(0,3)]);
      renderPulse(rows, false);
    } catch(e){
      renderScanner(demoForex);
      renderPulse([], true);
    }
  }

  window.setScannerMode = function(mode){
    currentMode = mode;
    document.querySelectorAll(".scanner-tools .chip").forEach(btn => btn.classList.remove("active"));
    const active = Array.from(document.querySelectorAll(".scanner-tools .chip")).find(btn => (btn.getAttribute("onclick") || "").includes("'" + mode + "'"));
    if (active) active.classList.add("active");
    load();
  };

  window.renderScannerGrid = renderScanner;
  window.loadCryptoMarket = load;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(load, 900);
  });
})();
