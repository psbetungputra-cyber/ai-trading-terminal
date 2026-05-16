/* AiSignalFx PRO - Forex & Gold Reference Mode */
(function(){
  const previousSetScannerMode = window.setScannerMode;

  const forexPairs = [
    {
      symbol: "EURUSD",
      bias: "WAIT",
      price: "1.0854",
      change: "+0.12%",
      trend: "Neutral",
      macro: "Neutral",
      momentum: "Mixed",
      risk: "Low",
      confidence: 62,
      session: "London / New York",
      note: "EURUSD masih dalam reference mode. Tunggu BOS/CHoCH dan retest area sebelum valid setup."
    },
    {
      symbol: "GBPUSD",
      bias: "SELL",
      price: "1.2643",
      change: "-0.18%",
      trend: "Bearish",
      macro: "Bearish",
      momentum: "Weak",
      risk: "Medium",
      confidence: 70,
      session: "London",
      note: "GBPUSD menunjukkan bearish reference bias. Tunggu retest supply kecil dan candle konfirmasi."
    },
    {
      symbol: "USDJPY",
      bias: "WAIT",
      price: "156.23",
      change: "-0.08%",
      trend: "Sideways",
      macro: "Bullish",
      momentum: "Neutral",
      risk: "Medium",
      confidence: 58,
      session: "Asia / New York",
      note: "USDJPY belum bersih untuk entry. Hindari entry saat struktur masih choppy."
    },
    {
      symbol: "GBPJPY",
      bias: "SELL",
      price: "199.45",
      change: "-0.10%",
      trend: "Bearish Pullback",
      macro: "Neutral",
      momentum: "Weak",
      risk: "Medium",
      confidence: 66,
      session: "London / Asia",
      note: "GBPJPY masuk watchlist reference. Tunggu liquidity sweep atau retest sebelum entry."
    },
    {
      symbol: "AUDUSD",
      bias: "WAIT",
      price: "0.6521",
      change: "+0.06%",
      trend: "Neutral",
      macro: "Bearish",
      momentum: "Mixed",
      risk: "Low",
      confidence: 60,
      session: "Asia",
      note: "AUDUSD masih menunggu validasi arah. Perhatikan USD news dan China-related sentiment."
    },
    {
      symbol: "USDCAD",
      bias: "BUY",
      price: "1.3712",
      change: "+0.14%",
      trend: "Bullish",
      macro: "Bullish",
      momentum: "Positive",
      risk: "Medium",
      confidence: 71,
      session: "New York",
      note: "USDCAD menunjukkan bullish reference bias, tapi tetap tunggu pullback dan candle konfirmasi."
    },
    {
      symbol: "USDCHF",
      bias: "WAIT",
      price: "0.9034",
      change: "-0.04%",
      trend: "Sideways",
      macro: "Neutral",
      momentum: "Neutral",
      risk: "Low",
      confidence: 57,
      session: "London / New York",
      note: "USDCHF belum memberi struktur bersih. Mode terbaik saat ini adalah wait confirmation."
    },
    {
      symbol: "NZDUSD",
      bias: "WAIT",
      price: "0.6118",
      change: "+0.05%",
      trend: "Neutral",
      macro: "Bearish",
      momentum: "Mixed",
      risk: "Low",
      confidence: 59,
      session: "Asia",
      note: "NZDUSD reference mode. Tunggu market structure lebih jelas."
    }
  ];

  const goldPairs = [
    {
      symbol: "XAUUSD",
      bias: "WAIT",
      price: "2345.12",
      change: "+0.22%",
      trend: "Bullish",
      macro: "Neutral",
      momentum: "Waiting Confirmation",
      risk: "Medium",
      confidence: 72,
      session: "London / New York",
      note: "Gold reference mode. Tunggu sweep liquidity, CHoCH/BOS kecil, dan retest area sebelum valid setup."
    },
    {
      symbol: "XAGUSD",
      bias: "WAIT",
      price: "29.42",
      change: "+0.16%",
      trend: "Neutral",
      macro: "Neutral",
      momentum: "Mixed",
      risk: "Medium",
      confidence: 61,
      session: "London / New York",
      note: "Silver reference mode. Gunakan sebagai market watch, bukan entry langsung."
    }
  ];

  function grid(){
    return document.getElementById("scanner-grid");
  }

  function pairFocus(){
    return document.querySelector(".scanner-pair-focus");
  }

  function badgeClass(bias){
    if (bias === "BUY") return "buy";
    if (bias === "SELL") return "sell";
    return "wait";
  }

  function activeTop(mode){
    const target = String(mode || "").toLowerCase();

    document.querySelectorAll("#scanner .scanner-tools button, #scanner .scanner-tools .chip").forEach(btn => {
      const t = (btn.textContent || "").toLowerCase();
      let isActive = false;

      if (target === "forex" && t.includes("forex")) isActive = true;
      if (target === "gold" && t.includes("gold")) isActive = true;
      if (target === "crypto" && t.includes("crypto")) isActive = true;
      if (target === "favorites" && t.includes("favorite")) isActive = true;
      if (target === "all" && t.trim() === "all") isActive = true;

      btn.classList.toggle("active", isActive);
    });
  }

  const referenceSelection = {
    forex: null,
    gold: null
  };

  function referenceBiasLabel(bias) {
    const b = String(bias || "").toUpperCase();
    if (b === "BUY") return "Bullish Bias";
    if (b === "SELL") return "Bearish Bias";
    if (b === "WAIT") return "Neutral";
    return "Reference Bias";
  }

  function getReferenceVisibleRows(mode, rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!referenceSelection[mode] && list.length) {
      referenceSelection[mode] = list[0].symbol;
    }

    if (referenceSelection[mode] === "__all__") return list;

    const focused = list.filter(x => x.symbol === referenceSelection[mode]);
    return focused.length ? focused : list.slice(0, 1);
  }

  window.setReferencePair = function(mode, symbol) {
    const m = String(mode || "").toLowerCase();
    referenceSelection[m] = symbol;

    if (m === "forex") renderReference("forex", forexPairs);
    if (m === "gold") renderReference("gold", goldPairs);
  };

  function renderReference(mode, rows){
    const g = grid();
    if (!g) return;

    const box = pairFocus();
    if (box) box.style.display = "none";

    activeTop(mode);

    const fullRows = Array.isArray(rows) ? rows : [];
    const visibleRows = getReferenceVisibleRows(mode, fullRows);
    const current = referenceSelection[mode] || (fullRows[0] && fullRows[0].symbol) || "__all__";
    const isAll = current === "__all__";

    const title = mode === "gold" ? "Gold & Metals Reference" : "Forex Reference Scanner";
    const label = mode === "gold" ? "GOLD REFERENCE" : "FOREX REFERENCE";

    const pairSelector = `
      <div class="reference-pair-scroll-wrap">
        <div class="reference-pair-scroll">
          ${fullRows.map(x => `
            <button type="button"
              class="reference-pair-chip ${current === x.symbol ? "active" : ""}"
              onclick="setReferencePair('${mode}', '${x.symbol}')">
              <span>${x.symbol}</span>
              <small>${referenceBiasLabel(x.bias)}</small>
            </button>
          `).join("")}

          <button type="button"
            class="reference-pair-chip all-pairs ${isAll ? "active" : ""}"
            onclick="setReferencePair('${mode}', '__all__')">
            <span>All Pairs</span>
            <small>View all</small>
          </button>
        </div>
      </div>
    `;

    g.className = "scanner-reference-shell forex-reference-grid";
    g.innerHTML = `
      <div class="card scanner-mode-note forex-reference-note">
        <span class="badge free">${label}</span>
        <h3>${title}</h3>
        <p class="muted">
          Mode ini memakai reference data sementara. Crypto sudah live via Binance; forex/gold akan di-upgrade ke finance/FMP/backend saat engine data siap.
        </p>
      </div>

      ${pairSelector}

      <div class="${isAll ? "reference-all-grid" : "reference-focus-grid"}">
        ${visibleRows.map(x => `
          <div class="card signal-card forex-reference-card">
            <div class="signal-card-top">
              <span class="badge ${badgeClass(x.bias)}">${referenceBiasLabel(x.bias)}</span>
              <span class="badge free">REFERENCE</span>
            </div>

            <h3>${x.symbol}</h3>
            <p class="crypto-price">${x.price}</p>
            <p><b>Change:</b> <span class="${String(x.change).includes("-") ? "red" : "green"}">${x.change}</span></p>

            <div class="scanner-v2-grid">
              <span><b>Trend:</b> ${x.trend}</span>
              <span><b>Macro:</b> ${x.macro}</span>
              <span><b>Momentum:</b> ${x.momentum}</span>
              <span><b>Risk:</b> ${x.risk}</span>
            </div>

            <p><b>Confidence:</b> ${x.confidence}%</p>
            <p><b>Session:</b> ${x.session}</p>
            <p>${x.note || "Reference mode forex/gold."}</p>

            <div class="forex-reference-footer">
              <span>Reference intelligence</span>
              <span>Educational analysis</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }


  window.setScannerMode = function(mode){
    const m = String(mode || "").toLowerCase();

    if (m.includes("forex")) {
      renderReference("forex", forexPairs);
      return;
    }

    if (m.includes("gold")) {
      renderReference("gold", goldPairs);
      return;
    }

    if (typeof previousSetScannerMode === "function") {
      previousSetScannerMode(mode);
    }
  };

  document.addEventListener("click", function(e){
    const btn = e.target.closest("#scanner .scanner-tools button, #scanner .scanner-tools .chip");
    if (!btn) return;

    const text = (btn.textContent || "").toLowerCase();

    if (text.includes("forex")) {
      e.preventDefault();
      window.setScannerMode("forex");
    }

    if (text.includes("gold")) {
      e.preventDefault();
      window.setScannerMode("gold");
    }
  });
})();
