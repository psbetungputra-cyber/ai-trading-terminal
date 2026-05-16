/* AiSignalFx PRO - Scanner Mode Filter Fix */
(function(){
  const KEY = "aisignalfx_scanner_focus_pair";

  const forexDemo = [
    { symbol:"EURUSD", bias:"WAIT", status:"DEMO MODE", price:"1.0854", change:"+0.12%", trend:"Neutral", macro:"Neutral", momentum:"Mixed", risk:"Low", confidence:62, note:"Reference forex demo. Tunggu BOS/CHoCH valid sebelum entry." },
    { symbol:"GBPUSD", bias:"SELL", status:"DEMO MODE", price:"1.2643", change:"-0.18%", trend:"Bearish", macro:"Bearish", momentum:"Weak", risk:"Medium", confidence:70, note:"Bearish structure preview. Tunggu retest dan candle konfirmasi." },
    { symbol:"USDJPY", bias:"WAIT", status:"DEMO MODE", price:"156.23", change:"-0.08%", trend:"Sideways", macro:"Bullish", momentum:"Neutral", risk:"Medium", confidence:58, note:"Market belum bersih. Hindari entry terburu-buru." }
  ];

  const goldDemo = [
    { symbol:"XAUUSD", bias:"WAIT", status:"GOLD REFERENCE", price:"2345.12", change:"+0.22%", trend:"Bullish", macro:"Neutral", momentum:"Waiting", risk:"Medium", confidence:72, note:"Gold reference mode. Tunggu sweep/retest area sebelum valid setup." }
  ];

  const favoritesDemo = [
    { symbol:"BTCUSDT", bias:"WAIT", status:"FAVORITE", price:"Live via Crypto Real", change:"-", trend:"Open Crypto Real", macro:"-", momentum:"-", risk:"-", confidence:"-", note:"Klik Crypto Real untuk membaca BTCUSDT memakai data Binance live." },
    { symbol:"XAUUSD", bias:"WAIT", status:"FAVORITE", price:"2345.12", change:"+0.22%", trend:"Bullish", macro:"Neutral", momentum:"Waiting", risk:"Medium", confidence:72, note:"Favorite gold reference watchlist." },
    { symbol:"GBPJPY", bias:"SELL", status:"FAVORITE", price:"199.45", change:"-0.10%", trend:"Bearish", macro:"Neutral", momentum:"Weak", risk:"Medium", confidence:66, note:"Favorite forex reference watchlist." }
  ];

  function grid(){
    return document.getElementById("scanner-grid");
  }

  function pairFocusBox(){
    return document.querySelector(".scanner-pair-focus");
  }

  function badgeClass(bias){
    if (bias === "BUY") return "buy";
    if (bias === "SELL") return "sell";
    return "wait";
  }

  function normalize(mode){
    const m = String(mode || "").toLowerCase();
    if (m.includes("forex")) return "forex";
    if (m.includes("crypto")) return "crypto";
    if (m.includes("gold")) return "gold";
    if (m.includes("favorite")) return "favorites";
    return "all";
  }

  function setTopActive(mode){
    const target = normalize(mode);

    document.querySelectorAll("#scanner .scanner-tools button, #scanner .scanner-tools .chip").forEach(btn => {
      const text = (btn.textContent || "").toLowerCase();
      let btnMode = "all";
      if (text.includes("forex")) btnMode = "forex";
      else if (text.includes("crypto")) btnMode = "crypto";
      else if (text.includes("gold")) btnMode = "gold";
      else if (text.includes("favorite")) btnMode = "favorites";
      else if (text.trim() === "all") btnMode = "all";

      btn.classList.toggle("active", btnMode === target);
    });
  }

  function showPairFocus(show){
    const box = pairFocusBox();
    if (box) box.style.display = show ? "" : "none";
  }

  function renderReference(title, subtitle, rows){
    const g = grid();
    if (!g) return;

    showPairFocus(false);
    g.className = "grid-3 scanner-reference-grid";

    g.innerHTML = `
      <div class="card scanner-mode-note">
        <span class="badge free">${title}</span>
        <h3>${subtitle}</h3>
        <p class="muted">Reference mode aktif sampai provider real forex/gold tersambung.</p>
      </div>
      ${rows.map(x => `
        <div class="card signal-card scanner-reference-card">
          <div class="signal-card-top">
            <span class="badge ${badgeClass(x.bias)}">${x.bias}</span>
            <span class="badge free">${x.status}</span>
          </div>

          <h3>${x.symbol}</h3>
          <p class="crypto-price">${x.price}</p>
          <p><b>Change:</b> <span class="${String(x.change).includes('-') ? 'red' : 'green'}">${x.change}</span></p>

          <div class="scanner-v2-grid">
            <span><b>Trend:</b> ${x.trend}</span>
            <span><b>Macro:</b> ${x.macro}</span>
            <span><b>Momentum:</b> ${x.momentum}</span>
            <span><b>Risk:</b> ${x.risk}</span>
          </div>

          <p><b>Confidence:</b> ${x.confidence}%</p>
          <p>${x.note}</p>
          <small>Reference intelligence · educational analysis</small>
        </div>
      `).join("")}
    `;
  }

  function loadCrypto(){
    showPairFocus(true);
    const saved = localStorage.getItem(KEY);
    if (window.setScannerPairFocus) {
      window.setScannerPairFocus(saved && saved !== "ALL" ? saved : "BTCUSDT");
    }
  }

  function loadAll(){
    showPairFocus(true);
    if (window.setScannerPairFocus) {
      window.setScannerPairFocus("ALL");
    }
  }

  window.setScannerMode = function(mode){
    const m = normalize(mode);
    setTopActive(m);

    if (m === "crypto") return loadCrypto();
    if (m === "forex") return renderReference("FOREX DEMO", "Forex Reference Scanner", forexDemo);
    if (m === "gold") return renderReference("GOLD", "Gold Reference Scanner", goldDemo);
    if (m === "favorites") return renderReference("FAVORITES", "Favorite Watchlist", favoritesDemo);

    return loadAll();
  };

  document.addEventListener("click", function(e){
    const btn = e.target.closest("#scanner .scanner-tools button, #scanner .scanner-tools .chip");
    if (!btn) return;

    const text = (btn.textContent || "").toLowerCase();
    if (text.includes("forex")) window.setScannerMode("forex");
    else if (text.includes("crypto")) window.setScannerMode("crypto");
    else if (text.includes("gold")) window.setScannerMode("gold");
    else if (text.includes("favorite")) window.setScannerMode("favorites");
    else if (text.trim() === "all") window.setScannerMode("all");
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(() => setTopActive("all"), 900);
  });
})();
