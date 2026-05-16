/* AiSignalFx PRO - Scanner Favorites */
(function(){
  const KEY = "aisignalfx_favorite_markets";
  const FOCUS_KEY = "aisignalfx_scanner_focus_pair";
  const CRYPTO = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","TONUSDT"];

  const REFERENCE = {
    XAUUSD: { symbol:"XAUUSD", bias:"WAIT", price:"2345.12", change:"+0.22%", note:"Gold reference mode sampai provider real aktif." },
    EURUSD: { symbol:"EURUSD", bias:"WAIT", price:"1.0854", change:"+0.12%", note:"Forex reference mode sampai provider real aktif." },
    GBPUSD: { symbol:"GBPUSD", bias:"SELL", price:"1.2643", change:"-0.18%", note:"Forex reference mode sampai provider real aktif." },
    GBPJPY: { symbol:"GBPJPY", bias:"SELL", price:"199.45", change:"-0.10%", note:"Forex reference mode sampai provider real aktif." }
  };

  const HOSTS = ["https://api.binance.com","https://api1.binance.com","https://api2.binance.com","https://api3.binance.com","https://data-api.binance.vision"];
  const previousSetScannerMode = window.setScannerMode;

  function getGrid(){ return document.getElementById("scanner-grid"); }
  function getFocusBox(){ return document.querySelector(".scanner-pair-focus"); }

  function getFavs(){
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch(e){ return []; }
  }

  function saveFavs(rows){
    localStorage.setItem(KEY, JSON.stringify([...new Set(rows)].slice(0, 20)));
  }

  function isFav(symbol){
    return getFavs().includes(symbol);
  }

  function toggleFav(symbol){
    let rows = getFavs();
    if (rows.includes(symbol)) rows = rows.filter(x => x !== symbol);
    else rows.unshift(symbol);
    saveFavs(rows);
    updateStars();
    showToast(rows.includes(symbol) ? `${symbol} ditambahkan ke Favorites.` : `${symbol} dihapus dari Favorites.`);
  }

  function showToast(text){
    let el = document.querySelector(".favorite-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "favorite-toast";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  }

  function badgeClass(bias){
    if (bias === "BUY") return "buy";
    if (bias === "SELL") return "sell";
    return "wait";
  }

  function symbolFromCard(card){
    return card.querySelector("h3")?.textContent?.trim() || "";
  }

  function updateStars(){
    document.querySelectorAll(".favorite-star-btn").forEach(btn => {
      const symbol = btn.dataset.symbol;
      const active = isFav(symbol);
      btn.classList.toggle("active", active);
      btn.innerHTML = active ? "★" : "☆";
      btn.title = active ? "Hapus dari Favorites" : "Tambah ke Favorites";
      btn.setAttribute("aria-label", btn.title);
    });
  }

  function injectStars(){
    document.querySelectorAll("#scanner-grid .signal-card").forEach(card => {
      const symbol = symbolFromCard(card);
      if (!symbol) return;

      let btn = card.querySelector(".favorite-star-btn");
      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "favorite-star-btn";
        btn.addEventListener("click", function(e){
          e.preventDefault();
          e.stopPropagation();
          toggleFav(symbol);
        });

        const top = card.querySelector(".signal-card-top");
        if (top) top.appendChild(btn);
        else card.insertAdjacentElement("afterbegin", btn);
      }

      btn.dataset.symbol = symbol;
    });

    updateStars();
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

  function fmt(n){
    const x = Number(n || 0);
    return x.toLocaleString("en-US", { maximumFractionDigits: x > 100 ? 2 : 4 });
  }

  async function cryptoFavoriteRows(symbols){
    if (!symbols.length) return [];
    const encoded = encodeURIComponent(JSON.stringify(symbols));
    const rows = await fetchJson(`/api/v3/ticker/24hr?symbols=${encoded}`);
    const map = new Map(rows.map(x => [x.symbol, x]));
    return symbols.map(symbol => {
      const x = map.get(symbol);
      const change = Number(x?.priceChangePercent || 0);
      return {
        symbol,
        bias: change > 1.2 ? "BUY" : change < -1.2 ? "SELL" : "WAIT",
        price: "$" + fmt(x?.lastPrice),
        change: change.toFixed(2) + "%",
        note: "Crypto live via Binance Public API."
      };
    });
  }

  async function renderFavorites(){
    const grid = getGrid();
    if (!grid) return;

    const box = getFocusBox();
    if (box) box.style.display = "none";

    document.querySelectorAll("#scanner .scanner-tools button, #scanner .scanner-tools .chip").forEach(btn => {
      const txt = (btn.textContent || "").toLowerCase();
      btn.classList.toggle("active", txt.includes("favorite"));
    });

    const favs = getFavs();
    grid.className = "grid-3 scanner-reference-grid favorite-grid";

    if (!favs.length) {
      grid.innerHTML = `
        <div class="card scanner-mode-note favorite-empty">
          <span class="badge free">FAVORITES</span>
          <h3>Belum ada market favorit</h3>
          <p class="muted">Klik ikon bintang pada card scanner untuk menyimpan market pilihan ke watchlist pribadi.</p>
        </div>
      `;
      return;
    }

    const cryptoSymbols = favs.filter(x => CRYPTO.includes(x));
    const referenceSymbols = favs.filter(x => !CRYPTO.includes(x));
    let cryptoRows = [];

    try { cryptoRows = await cryptoFavoriteRows(cryptoSymbols); }
    catch(e) {
      cryptoRows = cryptoSymbols.map(symbol => ({
        symbol, bias:"WAIT", price:"Live data loading", change:"-", note:"Crypto live belum tersedia. Coba refresh."
      }));
    }

    const refRows = referenceSymbols.map(symbol => REFERENCE[symbol]).filter(Boolean);
    const rows = [...cryptoRows, ...refRows];

    grid.innerHTML = `
      <div class="card scanner-mode-note">
        <span class="badge free">FAVORITE WATCHLIST</span>
        <h3>Market pilihan pengguna</h3>
        <p class="muted">Watchlist ini tersimpan di perangkat pengguna. Crypto memakai Binance live; forex/gold tetap reference sampai provider real aktif.</p>
      </div>

      ${rows.map(x => `
        <div class="card signal-card favorite-market-card">
          <div class="signal-card-top">
            <span class="badge ${badgeClass(x.bias)}">${x.bias}</span>
            <span class="badge free">FAVORITE</span>
          </div>
          <h3>${x.symbol}</h3>
          <p class="crypto-price">${x.price}</p>
          <p><b>Change:</b> <span class="${String(x.change).includes("-") ? "red" : "green"}">${x.change}</span></p>
          <p>${x.note}</p>
          ${CRYPTO.includes(x.symbol) ? `<button class="small-btn" data-open-favorite="${x.symbol}">Open Detail</button>` : ""}
          <small>Personal watchlist · educational analysis</small>
        </div>
      `).join("")}
    `;

    injectStars();
  }

  document.addEventListener("click", function(e){
    const open = e.target.closest("[data-open-favorite]");
    if (!open) return;

    const symbol = open.dataset.openFavorite;
    localStorage.setItem(FOCUS_KEY, symbol);

    if (typeof previousSetScannerMode === "function") previousSetScannerMode("crypto");
    setTimeout(() => {
      if (window.setScannerPairFocus) window.setScannerPairFocus(symbol);
      const box = getFocusBox();
      if (box) box.style.display = "";
      injectStars();
    }, 300);
  });

  window.setScannerMode = function(mode){
    const m = String(mode || "").toLowerCase();

    if (m.includes("favorite")) {
      renderFavorites();
      return;
    }

    if (typeof previousSetScannerMode === "function") previousSetScannerMode(mode);

    setTimeout(() => {
      const box = getFocusBox();
      if (box) box.style.display = "";
      injectStars();
    }, 600);
  };

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(injectStars, 900);
    setTimeout(injectStars, 2200);
  });

  setInterval(injectStars, 2500);
})();
