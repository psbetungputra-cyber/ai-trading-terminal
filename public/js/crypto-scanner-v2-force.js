/* AiSignalFx PRO - Force Crypto Scanner V2 Renderer */
(function(){
  const TOP = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","TONUSDT"];
  const HOSTS = ["https://api.binance.com","https://api1.binance.com","https://api2.binance.com","https://api3.binance.com","https://data-api.binance.vision"];
  const oldSetScannerMode = window.setScannerMode;

  async function fetchJson(path){
    let lastErr;
    for (const host of HOSTS){
      try{
        const res = await fetch(host + path, { cache: "no-store" });
        if(!res.ok) throw new Error("Binance " + res.status);
        return await res.json();
      }catch(e){ lastErr = e; }
    }
    throw lastErr;
  }

  function ema(values, period){
    if(!values.length) return 0;
    const k = 2 / (period + 1);
    let out = values[0];
    for(let i=1;i<values.length;i++) out = values[i] * k + out * (1-k);
    return out;
  }

  function rsi(values, period=14){
    if(values.length <= period) return 50;
    let gains = 0, losses = 0;
    for(let i = values.length - period; i < values.length; i++){
      const d = values[i] - values[i-1];
      if(d >= 0) gains += d; else losses += Math.abs(d);
    }
    if(losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  }

  async function klines(symbol, interval){
    const rows = await fetchJson(`/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=80`);
    return rows.map(x => ({
      high: Number(x[2]),
      low: Number(x[3]),
      close: Number(x[4])
    }));
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

    const ema9 = ema(c1.slice(-40), 9);
    const ema21 = ema(c1.slice(-60), 21);
    const ema4Fast = ema(c4.slice(-40), 9);
    const ema4Slow = ema(c4.slice(-60), 21);
    const rsi1 = rsi(c1);
    const rsi15 = rsi(c15);

    const swing = h1.slice(-20);
    const high = Math.max(...swing.map(x => x.high));
    const low = Math.min(...swing.map(x => x.low));
    const vol = price ? ((high - low) / price) * 100 : 0;

    let trend = "Sideways";
    if(price > ema21 && ema9 > ema21) trend = "Bullish";
    if(price < ema21 && ema9 < ema21) trend = "Bearish";

    let macro = "Neutral";
    if(ema4Fast > ema4Slow) macro = "Bullish";
    if(ema4Fast < ema4Slow) macro = "Bearish";

    let momentum = "Neutral";
    if(rsi1 > 56 && rsi15 > 52) momentum = "Bullish";
    if(rsi1 < 44 && rsi15 < 48) momentum = "Bearish";

    let bias = "WAIT";
    if(trend === "Bullish" && momentum === "Bullish") bias = "BUY";
    if(trend === "Bearish" && momentum === "Bearish") bias = "SELL";

    const risk = vol > 7 ? "High" : vol > 3.5 ? "Medium" : "Low";
    const confidence = Math.min(94, Math.max(55, Math.round(58 + Math.abs(change) * 3 + (trend === macro ? 10 : 0) + (momentum !== "Neutral" ? 8 : 0))));

    return {
      symbol, price, change, bias, trend, macro, momentum, risk, confidence,
      rsi: Math.round(rsi1),
      entry: bias === "BUY" ? "Tunggu pullback/retest bullish area." : bias === "SELL" ? "Tunggu retest breakdown area." : "Tunggu BOS/CHoCH valid.",
      invalid: bias === "BUY" ? `Invalid jika breakdown di bawah ${low.toFixed(price > 100 ? 2 : 4)}` : bias === "SELL" ? `Invalid jika break kuat di atas ${high.toFixed(price > 100 ? 2 : 4)}` : "Invalid jika struktur masih choppy.",
      tp: bias === "BUY" ? `TP reference dekat ${high.toFixed(price > 100 ? 2 : 4)}` : bias === "SELL" ? `TP reference dekat ${low.toFixed(price > 100 ? 2 : 4)}` : "TP menunggu struktur valid."
    };
  }

  function cls(bias){
    if(bias === "BUY") return "buy";
    if(bias === "SELL") return "sell";
    return "wait";
  }

  function price(x){
    return "$" + Number(x.price).toLocaleString("en-US", { maximumFractionDigits: x.price > 100 ? 2 : 4 });
  }

  function render(rows){
    const grid = document.getElementById("scanner-grid");
    if(!grid) return;

    grid.innerHTML = rows.map(x => `
      <div class="card signal-card scanner-v2-card">
        <div class="signal-card-top">
          <span class="badge ${cls(x.bias)}">${x.bias}</span>
          <span class="badge free">BINANCE V2</span>
        </div>
        <h3>${x.symbol}</h3>
        <p class="crypto-price">${price(x)}</p>
        <p><b>24h:</b> <span class="${x.change >= 0 ? "green" : "red"}">${x.change.toFixed(2)}%</span></p>
        <div class="scanner-v2-grid">
          <span><b>Trend:</b> ${x.trend}</span>
          <span><b>Macro:</b> ${x.macro}</span>
          <span><b>Momentum:</b> ${x.momentum}</span>
          <span><b>Risk:</b> ${x.risk}</span>
        </div>
        <p><b>Confidence:</b> ${x.confidence}% · <b>RSI:</b> ${x.rsi}</p>
        <div class="scanner-v2-plan">
          <p><b>Entry idea:</b> ${x.entry}</p>
          <p><b>Invalid:</b> ${x.invalid}</p>
          <p><b>TP:</b> ${x.tp}</p>
        </div>
        <small>Real mode · Binance ticker + klines 15m/1h/4h</small>
      </div>
    `).join("");
  }

  async function loadV2(){
    const grid = document.getElementById("scanner-grid");
    if(grid) grid.innerHTML = `<p class="muted">Loading Binance V2 scanner...</p>`;

    const tickers = await fetchJson("/api/v3/ticker/24hr");
    const allowed = new Set(TOP);
    const selected = tickers.filter(x => allowed.has(x.symbol)).sort((a,b) => TOP.indexOf(a.symbol) - TOP.indexOf(b.symbol));

    const rows = [];
    for(const t of selected){
      try { rows.push(await buildSignal(t)); }
      catch(e) {
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
          entry: "Klines belum terbaca. Tunggu struktur valid.",
          invalid: "Belum tersedia.",
          tp: "Belum tersedia."
        });
      }
    }

    render(rows);
  }

  window.loadCryptoMarket = loadV2;
  window.renderScannerGrid = function(){ loadV2(); };
  window.setScannerMode = function(mode){
    if(mode !== "crypto" && typeof oldSetScannerMode === "function") {
      oldSetScannerMode(mode);
      return;
    }
    document.querySelectorAll(".scanner-tools .chip").forEach(btn => btn.classList.remove("active"));
    const active = Array.from(document.querySelectorAll(".scanner-tools .chip")).find(btn => (btn.getAttribute("onclick") || "").includes("'crypto'"));
    if(active) active.classList.add("active");
    loadV2();
  };

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(loadV2, 1800);
    setTimeout(loadV2, 3500);
  });
})();
