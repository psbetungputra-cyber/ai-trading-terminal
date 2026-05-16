/* AiSignalFx PRO - Stable Fast Scanner */
(function(){
  const TOP = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","TONUSDT"];
  const HOSTS = ["https://api.binance.com","https://api1.binance.com","https://api2.binance.com","https://api3.binance.com","https://data-api.binance.vision"];
  const KEY = "aisignalfx_scanner_focus_pair";

  function grid(){ return document.getElementById("scanner-grid"); }
  function fmt(n, base){ return Number(n || 0).toLocaleString("en-US",{maximumFractionDigits: base > 100 ? 2 : 4}); }

  async function fetchJson(path){
    let last;
    for(const h of HOSTS){
      try{
        const r = await fetch(h + path, {cache:"no-store"});
        if(!r.ok) throw new Error("Binance " + r.status);
        return await r.json();
      }catch(e){ last = e; }
    }
    throw last || new Error("Binance unavailable");
  }

  function ema(v,p){
    if(!v.length) return 0;
    const k = 2/(p+1);
    let e = v[0];
    for(let i=1;i<v.length;i++) e = v[i]*k + e*(1-k);
    return e;
  }

  function rsi(v,p=14){
    if(v.length <= p) return 50;
    let g=0,l=0;
    for(let i=v.length-p;i<v.length;i++){
      const d = v[i]-v[i-1];
      if(d>=0) g+=d; else l+=Math.abs(d);
    }
    if(l===0) return 100;
    const rs = g/l;
    return 100 - (100/(1+rs));
  }

  async function klines(symbol, interval){
    const rows = await fetchJson(`/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=80`);
    return rows.map(x => ({ high:+x[2], low:+x[3], close:+x[4] }));
  }

  async function analyze(symbol){
    const t = await fetchJson(`/api/v3/ticker/24hr?symbol=${symbol}`);
    const price = +(t.lastPrice || 0);
    const change = +(t.priceChangePercent || 0);

    const [h1,h4] = await Promise.all([
      klines(symbol,"1h"),
      klines(symbol,"4h")
    ]);

    const c1 = h1.map(x=>x.close);
    const c4 = h4.map(x=>x.close);

    const ema9 = ema(c1.slice(-50),9);
    const ema21 = ema(c1.slice(-70),21);
    const ema4a = ema(c4.slice(-50),9);
    const ema4b = ema(c4.slice(-70),21);
    const r = rsi(c1);

    const recent = h1.slice(-24);
    const high = Math.max(...recent.map(x=>x.high));
    const low = Math.min(...recent.map(x=>x.low));
    const range = price ? ((high-low)/price)*100 : 0;

    let trend = "Sideways";
    if(price > ema21 && ema9 > ema21) trend = "Bullish";
    if(price < ema21 && ema9 < ema21) trend = "Bearish";

    let macro = "Neutral";
    if(ema4a > ema4b) macro = "Bullish";
    if(ema4a < ema4b) macro = "Bearish";

    let momentum = "Neutral";
    if(r > 56) momentum = "Bullish";
    if(r < 44) momentum = "Bearish";

    let bias = "WAIT";
    if(trend === "Bullish" && momentum === "Bullish") bias = "BUY";
    if(trend === "Bearish" && momentum === "Bearish") bias = "SELL";

    const risk = range > 7 ? "High" : range > 3.5 ? "Medium" : "Low";
    const aligned = trend === macro && trend !== "Sideways";
    const confidence = Math.min(94, Math.max(55, Math.round(58 + (aligned?12:0) + (momentum!=="Neutral"?8:0) + Math.min(Math.abs(change)*3,12))));

    const valid = bias !== "WAIT" && aligned && risk !== "High" && confidence >= 75;
    const status = valid ? "VALID SETUP" : "WAIT CONFIRMATION";

    return {symbol,price,change,trend,macro,momentum,risk,bias,confidence,rsi:Math.round(r),valid,status};
  }

  function badge(b){ return b==="BUY" ? "buy" : b==="SELL" ? "sell" : "wait"; }

  function ensureFocus(){
    const g = grid();
    if(!g) return;

    let box = document.querySelector(".scanner-pair-focus");
    if(box) return;

    box = document.createElement("div");
    box.className = "scanner-pair-focus";
    box.innerHTML = `
      <div>
        <span class="scanner-focus-kicker">PAIR FOCUS MODE</span>
        <h3>Pilih market untuk detail analisis</h3>
        <p>Mode fokus memuat satu market terpilih agar analisis cepat, ringan, dan responsif.</p>
      </div>
      <div class="scanner-pair-chips">
        <button type="button" data-symbol="ALL">All Pairs</button>
        ${TOP.map(s=>`<button type="button" data-symbol="${s}">${s}</button>`).join("")}
      </div>
    `;
    g.parentNode.insertBefore(box,g);
  }

  function activeChip(symbol){
    document.querySelectorAll(".scanner-pair-chips button").forEach(b=>{
      b.classList.toggle("active", b.dataset.symbol === symbol);
    });
  }

  function scanValue(v, fallback = "calculating") {
    if (v === undefined || v === null || v === "" || Number.isNaN(Number(v))) return fallback;
    return v;
  }

  function scanStatus(x) {
    if (x && x.valid && (x.entryPrice || x.stopLoss || x.tp1 || x.tp2)) return "VALID SETUP";
    if (x && x.valid) return "BIAS VALID";
    return (x && x.status) ? x.status : "BIAS PREVIEW";
  }

  function scanLevel(x, keys, fallback) {
    for (const key of keys) {
      if (x && x[key] !== undefined && x[key] !== null && String(x[key]).trim() !== "") {
        return x[key];
      }
    }
    return fallback;
  }

  function renderOne(x){
    const g = grid();
    if(!g) return;

    g.className = "grid-3 scanner-focus-grid";
    g.innerHTML = `
      <div class="card signal-card scanner-v21-card ${x.valid ? "valid-setup":"wait-setup"} scanner-card-focused">
        <div class="signal-card-top">
          <span class="badge ${badge(x.bias)}">${x.bias}</span>
          <span class="badge ${x.valid ? "vip":"free"}">${x.status || "BIAS PREVIEW"}</span>
        </div>
        <h3>${x.symbol}</h3>
        <p class="crypto-price">$${fmt(x.price,x.price)}</p>
        <p><b>24h:</b> <span class="${x.change>=0?"green":"red"}">${x.change.toFixed(2)}%</span></p>
        <div class="scanner-v2-grid">
          <span><b>Trend:</b> ${x.trend}</span>
          <span><b>Macro:</b> ${x.macro}</span>
          <span><b>Momentum:</b> ${x.momentum}</span>
          <span><b>Risk:</b> ${x.risk}</span>
        </div>
        <p><b>Confidence:</b> ${x.confidence}% · <b>RSI:</b> ${x.rsi}</p>
        <div class="scanner-v21-plan">
          <p><b>Entry Zone:</b> ${scanLevel(x, ["entryZone", "entryIdea", "entry"], "Tunggu retest dan candle konfirmasi")}</p>
          <p><b>Stop Loss:</b> ${scanLevel(x, ["stopLoss", "sl", "invalidation"], "Tunggu invalidation candle jelas")}</p>
          <p><b>TP 1:</b> ${scanLevel(x, ["tp1", "target1", "target"], "Target mengikuti struktur market")}</p>
          <p><b>TP 2:</b> ${scanLevel(x, ["tp1", "target1", "target"], "Target mengikuti struktur market")}</p>
        </div>
        <p>${x.valid ? "Setup valid secara sistem. Tetap tunggu candle konfirmasi sebelum entry." : `Belum valid untuk entry angka detail. Trend: ${x.trend}, Macro: ${x.macro}, Momentum: ${x.momentum}, Risk: ${x.risk}.`}</p>
        <small>Sentinel Scanner · Binance ticker + klines 1h/4h · educational analysis</small>
      </div>
    `;
  }


  let stablePairRequestId = 0;
  const stablePairCache = new Map();

  function readBinanceFastRows(){
    if (Array.isArray(window.AisignalBinanceLastRows)) return window.AisignalBinanceLastRows;

    const keys = [
      "aisignalfx_binance_24h_cache_v2",
      "aisignalfx_binance_24h_cache_v1"
    ];

    for (const key of keys) {
      try {
        const cached = JSON.parse(localStorage.getItem(key) || "null");
        if (cached && Array.isArray(cached.rows)) return cached.rows;
      } catch(e) {}
    }

    return [];
  }

  function quickAnalyzeFromTicker(symbol){
    const rows = readBinanceFastRows();
    const t = rows.find(x => x.symbol === symbol);
    if (!t) return null;

    const price = +(t.lastPrice || 0);
    const change = +(t.priceChangePercent || 0);
    const high = +(t.highPrice || price);
    const low = +(t.lowPrice || price);
    const range = price ? Math.abs((high - low) / price) * 100 : 0;

    const bias = change > 1.2 ? "BUY" : change < -1.2 ? "SELL" : "WAIT";
    const trend = change > 0.8 ? "Bullish" : change < -0.8 ? "Bearish" : "Neutral";
    const macro = trend;
    const momentum = Math.abs(change) > 1.2 ? "Active" : "Mixed";
    const risk = range > 7 ? "High" : range > 3.5 ? "Medium" : "Low";
    const confidence = Math.min(88, Math.max(55, Math.round(58 + Math.abs(change) * 6 + Math.min(range, 6) * 2)));

    return {
      symbol,
      price,
      change,
      trend,
      macro,
      momentum,
      risk,
      bias,
      confidence,
      valid: false,
      note: "Fast Binance cache preview. Detail 1H/4H diperbarui di background.",
      source: "fast-cache",
      status: "BIAS PREVIEW",
      rsi: null,
      entryZone: "Tunggu retest dan candle konfirmasi",
      stopLoss: "Tunggu invalidation candle jelas",
      tp1: "Target mengikuti struktur market",
      tp2: "Target mengikuti struktur market"
    };
  }

  async function loadPair(symbol){
    ensureFocus();
    activeChip(symbol);

    const g = grid();
    const reqId = ++stablePairRequestId;

    const cached = stablePairCache.get(symbol);
    if (cached) {
      renderOne(cached);
    } else {
      const quick = quickAnalyzeFromTicker(symbol);
      if (quick) {
        stablePairCache.set(symbol, quick);
        renderOne(quick);
      } else if (g && !g.querySelector(".signal-card")) {
        g.innerHTML = `<p class="muted scanner-fast-loading">Preparing ${symbol} scanner...</p>`;
      }
    }

    try{
      const full = await analyze(symbol);
      stablePairCache.set(symbol, full);

      const current = localStorage.getItem(KEY) || "BTCUSDT";
      if (reqId === stablePairRequestId && current === symbol) {
        renderOne(full);
      }
    }catch(e){
      if (reqId === stablePairRequestId && g && !g.querySelector(".signal-card")) {
        g.innerHTML = `<p class="muted">Data ${symbol} belum tersedia. Coba refresh.</p>`;
      }
    }
  }

  async function loadAll(){
    ensureFocus();
    activeChip("ALL");
    const g = grid();
    if(g) g.innerHTML = `<p class="muted">Loading all pairs lite...</p>`;

    try{
      const rows = await fetchJson("/api/v3/ticker/24hr");
      const set = new Set(TOP);
      const data = rows.filter(x=>set.has(x.symbol)).sort((a,b)=>TOP.indexOf(a.symbol)-TOP.indexOf(b.symbol));

      g.className = "grid-3 scanner-all-grid";
      g.innerHTML = data.map(t=>{
        const price = +(t.lastPrice || 0);
        const change = +(t.priceChangePercent || 0);
        const bias = change > 1.2 ? "BUY" : change < -1.2 ? "SELL" : "WAIT";
        return `
          <div class="card signal-card">
            <span class="badge ${badge(bias)}">${bias}</span>
            <h3>${t.symbol}</h3>
            <p class="crypto-price">$${fmt(price,price)}</p>
            <p><b>24h:</b> <span class="${change>=0?"green":"red"}">${change.toFixed(2)}%</span></p>
            <small>Market overview · pilih market untuk analisis detail.</small>
          </div>
        `;
      }).join("");
    }catch(e){
      if(g) g.innerHTML = `<p class="muted">All pairs belum tersedia.</p>`;
    }
  }

  function selected(){
    const s = localStorage.getItem(KEY);
    return TOP.includes(s) ? s : "BTCUSDT";
  }

  function loadSaved(){
    const s = localStorage.getItem(KEY);
    if(s === "ALL") loadAll();
    else loadPair(selected());
  }

  document.addEventListener("click", e=>{
    const btn = e.target.closest(".scanner-pair-chips button");
    if(!btn) return;
    const s = btn.dataset.symbol;
    localStorage.setItem(KEY,s);
    if(s === "ALL") loadAll(); else loadPair(s);
  });

  window.setScannerPairFocus = function(s){
    localStorage.setItem(KEY,s || "BTCUSDT");
    if(s === "ALL") loadAll(); else loadPair(s || "BTCUSDT");
  };

  window.loadCryptoMarket = loadSaved;
  window.renderScannerGrid = loadSaved;
  window.setScannerMode = function(mode){
    if(mode === "crypto" || mode === "all" || !mode) loadSaved();
    else if(mode === "gold") loadPair("BTCUSDT");
    else loadSaved();
  };

  document.addEventListener("DOMContentLoaded", ()=>{
    setTimeout(loadSaved,500);
  });
})();
