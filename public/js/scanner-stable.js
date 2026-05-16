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

  function renderOne(x){
    const g = grid();
    if(!g) return;

    g.className = "grid-3 scanner-focus-grid";
    g.innerHTML = `
      <div class="card signal-card scanner-v21-card ${x.valid ? "valid-setup":"wait-setup"} scanner-card-focused">
        <div class="signal-card-top">
          <span class="badge ${badge(x.bias)}">${x.bias}</span>
          <span class="badge ${x.valid ? "vip":"free"}">${x.status}</span>
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
          <p><b>Entry Zone:</b> ${x.valid ? "Detail aktif pada valid detail layer" : "Wait confirmation"}</p>
          <p><b>Stop Loss:</b> ${x.valid ? "Dihitung oleh risk layer" : "Wait confirmation"}</p>
          <p><b>TP 1:</b> ${x.valid ? "Dihitung oleh target layer" : "Wait confirmation"}</p>
          <p><b>TP 2:</b> ${x.valid ? "Dihitung oleh target layer" : "Wait confirmation"}</p>
        </div>
        <p>${x.valid ? "Setup valid secara sistem. Tetap tunggu candle konfirmasi sebelum entry." : `Belum valid untuk entry angka detail. Trend: ${x.trend}, Macro: ${x.macro}, Momentum: ${x.momentum}, Risk: ${x.risk}.`}</p>
        <small>Sentinel Scanner · Binance ticker + klines 1h/4h · educational analysis</small>
      </div>
    `;
  }

  async function loadPair(symbol){
    ensureFocus();
    activeChip(symbol);
    const g = grid();
    if(g) g.innerHTML = `<p class="muted scanner-fast-loading">Loading ${symbol} stable scanner...</p>`;
    try{
      renderOne(await analyze(symbol));
    }catch(e){
      if(g) g.innerHTML = `<p class="muted">Data ${symbol} belum tersedia. Coba refresh.</p>`;
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
    setTimeout(loadSaved,700);
    setTimeout(loadSaved,2200);
  });
})();
