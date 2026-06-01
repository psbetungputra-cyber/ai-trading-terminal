/* AiSignalFx PRO - Scanner Mobile Functional v2 */
(function () {
  const cryptoPairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "AVAXUSDT"];
  const refPairs = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY"];
  const timeframes = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W"];

  const refData = {
    XAUUSD: { price: 2345.12, change: 0.42, bias: "BUY", confidence: 72, risk: "Medium", market: "Gold Ref", setup: "Reference bullish structure" },
    EURUSD: { price: 1.0854, change: 0.12, bias: "WAIT", confidence: 61, risk: "Low", market: "Forex Ref", setup: "Waiting confirmation" },
    GBPUSD: { price: 1.2643, change: 0.28, bias: "BUY", confidence: 66, risk: "Medium", market: "Forex Ref", setup: "Trend continuation" },
    USDJPY: { price: 156.23, change: -0.32, bias: "SELL", confidence: 64, risk: "Medium", market: "Forex Ref", setup: "Pullback pressure" },
    GBPJPY: { price: 199.45, change: 0.08, bias: "WAIT", confidence: 56, risk: "High", market: "Forex Ref", setup: "News caution" }
  };

  const state = {
    mode: "crypto",
    pair: "BTCUSDT",
    tf: "15m",
    live: {},
    loading: false,
    detailCandles: {},
    detailLoading: false
  };

  function isMobile() {
    return window.innerWidth <= 760;
  }

  function root() {
    return document.getElementById("scanner");
  }

  function fmt(v) {
    const n = Number(v || 0);
    if (!Number.isFinite(n) || !n) return "Loading";

    const digits = n >= 100 ? 2 : n >= 1 ? 4 : 6;

    return n.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function tfCountdown(tf) {
    const key = String(tf || "15m").toLowerCase();
    const map = {
      "1m": 60000,
      "5m": 300000,
      "15m": 900000,
      "30m": 1800000,
      "1h": 3600000,
      "4h": 14400000,
      "1d": 86400000,
      "1w": 604800000
    };

    const size = map[key] || map["15m"];
    const left = Math.max(0, size - (Date.now() % size));
    const total = Math.ceil(left / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    return m + ":" + String(s).padStart(2, "0");
  }

  function updateMainScannerCountdown() {
    const node = document.querySelector("[data-main-tf-countdown]");
    if (!node) return;
    node.textContent = "  -  next " + tfCountdown(state.tf);
  }

  function safe(v) {
    return String(v ?? "").replace(/[&<>"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function biasFromChange(v) {
    const c = Number(v || 0);
    if (c > 0.45) return "BUY";
    if (c < -0.45) return "SELL";
    return "WAIT";
  }

  function riskFromChange(v) {
    const a = Math.abs(Number(v || 0));
    if (a > 3) return "High";
    if (a > 1.2) return "Medium";
    return "Low";
  }

  /* ASFX_MAIN_SCANNER_PACKET_SYNC_V5 */
  function asfxScannerFinalPacketForMainV5(pair) {
    try {
      const p = window.__ASFX_FINAL_SIGNAL_PACKET_V5__ || window.ASFX_SCANNER_COMPLETE_V5?.getPacket?.();
      if (!p) return null;
      const target = String(pair || "").toUpperCase();
      const symbol = String(p.pair || p.symbol || "").toUpperCase();
      if (target && symbol && target !== symbol) return null;
      const activeTf = String(state.tf || "").toLowerCase();
      const packetTf = String(p.timeframe || p.tf || "").toLowerCase();
      if (activeTf && packetTf && activeTf !== packetTf) return null;
      return p;
    } catch (_) { return null; }
  }

  function asfxScannerMergeFinalPacketV5(base, pair) {
    const p = asfxScannerFinalPacketForMainV5(pair);
    if (!p) {
      return {
        ...base,
        setup: base.setup || "Open Detail for final score",
        status: base.bias === "WAIT" ? "Waiting" : "Preview"
      };
    }
    const conf = Number(String(p.confidence ?? p.score ?? base.confidence ?? 0).replace(/[^0-9.]/g, ""));
    return {
      ...base,
      bias: p.bias || base.bias,
      risk: p.risk || base.risk,
      confidence: Number.isFinite(conf) && conf > 0 ? Math.round(conf) : base.confidence,
      setup: p.finalStatus || p.signalStatus || p.setupType || p.actionStatus || base.setup,
      status: p.finalStatus || p.lifecycleStatus || p.status || p.actionStatus || "Final Score"
    };
  }

  function getPairData(pair) {
    if (state.mode === "crypto") {
      const d = state.live[pair] || {};
      const change = Number(d.priceChangePercent || 0);
      const bias = biasFromChange(change);
      return asfxScannerMergeFinalPacketV5({
        symbol: pair,
        price: Number(d.lastPrice || 0),
        change,
        bias,
        confidence: Math.min(88, Math.max(55, Math.round(58 + Math.abs(change) * 6))),
        risk: riskFromChange(change),
        market: "Crypto Live",
        setup: "Open Detail for final score"
      }, pair);
    }

    return asfxScannerMergeFinalPacketV5({ symbol: pair, ...(refData[pair] || refData.XAUUSD) }, pair);
  }

  function biasClass(bias) {
    const b = String(bias || "WAIT").toLowerCase();
    return b === "buy" ? "buy" : b === "sell" ? "sell" : "wait";
  }

  async function fetchCrypto(pair) {
    if (state.mode !== "crypto") return;
    if (state.loading) return;

    state.loading = true;

    const urls = [
      `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${pair}`,
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        state.live[pair] = json;
        state.loading = false;
        render();
        return;
      } catch (e) {}
    }

    state.loading = false;
    render();
  }

  function pairs() {
    return state.mode === "crypto" ? cryptoPairs : refPairs;
  }

  function summaryRows() {
    return pairs().slice(0, 5).map(getPairData);
  }

  function render() {
    const el = root();
    if (!el || !isMobile()) return;

    const data = getPairData(state.pair);
    const price = fmt(data.price);
    const displayPrice = safe(price);
    const change = Number(data.change || 0);
    const status = data.status || (data.bias === "WAIT" ? "Waiting" : "Preview");
    const rows = summaryRows();

    el.innerHTML = `
      <section class="asfx-scan-v2">
        <div class="asfx-scan-hero">
          <span>MARKET SCANNER</span>
          <h1>Scanner</h1>
          <p>Pilih market, lihat focus setup, lalu buka detail untuk analisis lengkap.</p>
        </div>

        <div class="asfx-mode-rail">
          <button data-mode="crypto" class="${state.mode === "crypto" ? "active" : ""}">Crypto Live</button>
          <button data-mode="ref" class="${state.mode !== "crypto" ? "active" : ""}">Forex / Gold Ref</button>
          <button data-action="vip">VIP Detail</button>
        </div>

        <div class="asfx-pair-rail">
          ${pairs().map(p => `<button data-pair="${safe(p)}" class="${state.pair === p ? "active" : ""}">${safe(p)}</button>`).join("")}
        </div>

        <div class="asfx-tf-rail">
          ${timeframes.map(tf => `<button data-tf="${safe(tf)}" class="${state.tf === tf ? "active" : ""}">${safe(tf)}</button>`).join("")}
        </div>

        <article class="asfx-focus-card">
          <div class="asfx-focus-top">
            <div>
              <small>${safe(data.market)}  -  ${safe(state.tf)}<span data-main-tf-countdown>  -  next ${safe(tfCountdown(state.tf))}</span></small>
              <h2>${safe(data.symbol)}</h2>
            </div>
            <b class="asfx-badge ${biasClass(data.bias)}">${safe(data.bias)}</b>
          </div>

          <div class="asfx-price-row">
            <strong>${displayPrice}</strong>
            <span class="${change >= 0 ? "green" : "red"}">${change >= 0 ? "+" : ""}${change.toFixed(2)}%</span>
          </div>

          <div class="asfx-metric-grid">
            <div><small>Confidence</small><b>${safe(data.confidence)}%</b></div>
            <div><small>Risk</small><b>${safe(data.risk)}</b></div>
            <div><small>Status</small><b>${safe(status)}</b></div>
          </div>

          <div class="asfx-preview-box">
            <div class="asfx-mini-chart"></div>
            <div>
              <small>Focus Setup</small>
              <b>${safe(data.setup)}</b>
              <p>Entry, SL, TP, dan full reasoning dibuka di Signal Detail / VIP.</p>
            </div>
          </div>

          <div class="asfx-actions">
            <button data-action="detail">Open Detail</button>
            <button data-action="save">Save</button>
            <button data-action="vip">VIP</button>
          </div>
        </article>

        <article class="asfx-summary-card">
          <div class="asfx-summary-head">
            <h3>Scanner Summary</h3>
            <button data-action="summary">SHOW</button>
          </div>
          <div class="asfx-summary-list">
            ${rows.map(r => `
              <div class="asfx-summary-row">
                <div>
                  <b>${safe(r.symbol)}</b>
                  <small>${safe(r.setup)}</small>
                </div>
                <span class="${biasClass(r.bias)}">${safe(r.bias)}</span>
                <strong>${safe(r.confidence)}%</strong>
              </div>
            `).join("")}
          </div>
        </article>
      </section>
    `;

    bind(el);

    if (state.mode === "crypto" && !state.live[state.pair]) {
      fetchCrypto(state.pair);
    }
  }

  function toast(text) {
    let t = document.querySelector(".asfx-scan-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "asfx-scan-toast";
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1700);
  }


  function showVipGate() {
    const existing = document.querySelector(".asfx-vip-gate");
    if (existing) existing.remove();

    const data = getPairData(state.pair);
    const overlay = document.createElement("div");
    overlay.className = "asfx-vip-gate";
    overlay.innerHTML = `
      <div class="asfx-vip-backdrop" data-close-vip="1"></div>
      <div class="asfx-vip-sheet">
        <div class="asfx-vip-handle"></div>

        <div class="asfx-vip-kicker">SIGNAL DETAIL ROOM</div>
        <h3>Unlock ${safe(data.symbol)} Analysis</h3>
        <p class="asfx-vip-sub">
          Buka chart detail, AI chat analysis, risk plan, entry zone, SL, TP, dan full reasoning.
        </p>

        <div class="asfx-vip-preview">
          <div>
            <small>Pair</small>
            <b>${safe(data.symbol)}</b>
          </div>
          <div>
            <small>Timeframe</small>
            <b>${safe(state.tf)}</b>
          </div>
          <div>
            <small>Bias</small>
            <b>${safe(data.bias)}</b>
          </div>
        </div>

        <div class="asfx-vip-list">
          <span>OK Full chart analysis room</span>
          <span>OK AI chat signal explanation</span>
          <span>OK Entry zone, Stop Loss, Take Profit</span>
          <span>OK Risk plan and invalidation level</span>
          <span>OK Full institutional reasoning</span>
        </div>

        <div class="asfx-vip-actions">
          <button class="primary" data-vip-action="upgrade">Upgrade to VIP</button>
          <button data-vip-action="benefits">View Benefits</button>
          <button data-close-vip="1">Maybe Later</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("show"));

    overlay.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-vip]")) {
        overlay.classList.remove("show");
        setTimeout(() => overlay.remove(), 220);
      }

      const action = e.target.closest("[data-vip-action]")?.dataset.vipAction;
      if (action === "upgrade") toast("VIP checkout akan dibuka di tahap berikutnya.");
      if (action === "benefits") toast("Benefit VIP akan dirapikan di halaman pricing.");
    });
  }



  function canOpenSignalDetail() {
    const params = new URLSearchParams(window.location.search);

    const qOwner =
      params.get("owner") === "1" ||
      params.get("admin") === "1" ||
      String(params.get("access") || "").toLowerCase() === "owner";

    if (qOwner) return true;

    if (window.ASFXAccessGuard?.canOpenSignalRoom?.() === true) return true;

    const role = String(localStorage.getItem("asfxRole") || "").toLowerCase();
    const canOpen = localStorage.getItem("asfxCanOpenSignalRoom") === "1";

    if (canOpen || ["owner", "founder", "admin", "vip"].includes(role)) return true;

    try {
      const cached = JSON.parse(localStorage.getItem("aisignalfx:firebase_user") || "null");
      const email = String(cached?.email || "").toLowerCase();
      const cachedRole = String(cached?.role || "").toLowerCase();
      const cachedLevel = String(cached?.level || "").toLowerCase();

      if (email === "psbetungputra@gmail.com") return true;
      if (["owner", "founder", "admin", "vip"].includes(cachedRole)) return true;
      if (["owner", "admin", "vip"].includes(cachedLevel)) return true;
      if (cached?.vipAccess === true) return true;
    } catch (err) {}

    return false;
  }

  function injectSignalDetailRoomStyle() {
    if (document.getElementById("asfx-signal-detail-room-style")) return;

    const style = document.createElement("style");
    style.id = "asfx-signal-detail-room-style";
    style.textContent = `
      @media (max-width: 760px) {
        .asfx-detail-room {
          position: fixed;
          inset: 0;
          z-index: 999998;
          background: #020617;
          color: #e5e7eb;
          overflow: auto;
          padding: 14px 10px 120px;
        }

        .asfx-detail-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .asfx-detail-back {
          height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(96,165,250,.22);
          background: rgba(15,23,42,.86);
          color: #e5e7eb;
          font-weight: 900;
        }

        .asfx-detail-title small {
          display: block;
          color: #60a5fa;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .asfx-detail-title h2 {
          margin: 4px 0 0;
          color: #fff;
          font-size: clamp(25px, 7vw, 34px);
          line-height: 1.05;
          letter-spacing: -.04em;
        }

        .asfx-detail-card {
          border-radius: 28px;
          border:  border-radius: 999px;
          border: 1px solid rgba(96,165,250,.22);
          background: rgba(15,23,42,.86);
          color: #e5e7eb;
          font-weight: 900;
        }

        .asfx-detail-title small {
          display: block;
          color: #60a5fa;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .asfx-detail-title h2 {
          margin: 4px 0 0;
          color: #fff;
          font-size: clamp(25px, 7vw, 34px);
          line-height:1px solid rgba(96,165,250,.18);
          background:
            radial-gradient(circle at 85% 0%, rgba(37,99,235,.22), transparent 36%),
            linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.96));
          box-shadow: 0 18px 50px rgba(0,0,0,.3);
          padding: 14px;
        }

        .asfx-detail-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin-bottom: 12px;
        }

        .asfx-detail-tabs::-webkit-scrollbar {
          display: none;
        }

        .asfx-detail-tabs button {
          flex: 0 0 auto;
          height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(96,165,250,.18);
          background: rgba(15,23,42,.9);
          color: #e5e7eb;
          font-size: 11px;
          font-weight: 900;
        }

        .asfx-detail-tabs button.active {
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          color: #fff;
        }

        .asfx-detail-panel {
          min-height: 330px;
        }

        .asfx-room-chart {
          height: 310px;
          border-radius: 22px;
          border: 1px solid rgba(148,163,184,.14);
          background:
            linear-gradient(180deg, rgba(2,6,23,.92), rgba(15,23,42,.72));
          position: relative;
          overflow: hidden;
        }

        .asfx-room-chart::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(148,163,184,.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,.12) 1px, transparent 1px);
          background-size: 100% 62px, 76px 100%;
          opacity: .45;
        }

        .asfx-room-chart::after {
          display: none;
        }

        .asfx-room-chart-svg {
          position: relative;
          width: 100%;
          height: 100%;
          display: block;
          z-index: 2;
        }

        .asfx-chart-empty {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 900;
        }

        .asfx-room-ref-chart {
          height: 100%;
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 22px;
        }

        .asfx-room-ref-chart small {
          display: block;
          color: #60a5fa;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .14em;
          margin-bottom: 8px;
        }

        .asfx-room-ref-chart b {
          color: #fff;
          font-size: 24px;
        }

        .asfx-room-ref-chart p {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.45;
          margin: 10px 0 0;
        }

        .asfx-detail-grid {
          display: grid;
          gap: 10px;
        }

        .asfx-detail-mini {
          border: 1px solid rgba(148,163,184,.13);
          background: rgba(2,6,23,.5);
          border-radius: 18px;
          padding: 12px;
        }

        .asfx-detail-mini small {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .asfx-detail-mini b {
          color: #fff;
          font-size: 16px;
        }

        .asfx-ai-box {
          border-radius: 22px;
          border: 1px solid rgba(96,165,250,.18);
          background: rgba(2,6,23,.5);
          padding: 12px;
        }

        .asfx-ai-msg {
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.45;
        }

        .asfx-ai-input {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }

        .asfx-ai-input input {
          flex: 1;
          min-width: 0;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.18);
          background: rgba(15,23,42,.9);
          color: #e5e7eb;
          padding: 0 14px;
        }

        .asfx-ai-input button {
          height: 42px;
          padding: 0 14px;
          border-radius: 999px;
          border: 0;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          color: #fff;
          font-weight: 900;
        }

        .asfx-vip-locked {
          filter: blur(2.4px);
          opacity: .72;
          user-select: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function showSignalDetailRoom() {
    injectSignalDetailRoomStyle();

    const old = document.querySelector(".asfx-detail-room");
    if (old) old.remove();

    const data = getPairData(state.pair);
    const room = document.createElement("div");
    room.className = "asfx-detail-room";
    room.innerHTML = `
      <div class="asfx-detail-top">
        <button class="asfx-detail-back" data-close-detail="1"><- Back</button>
        <div class="asfx-detail-title">
          <small>SIGNAL DETAIL ROOM</small>
          <h2>${safe(data.symbol)}  -  ${safe(state.tf)}</h2>
        </div>
      </div>

      <section class="asfx-detail-card">
        <div class="asfx-detail-tabs">
        <button class="active" data-detail-tab="chart">Chart</button>
        <button data-detail-tab="risk">Risk</button>
        <button data-detail-tab="chat">AI Insight</button>
        <button data-detail-tab="signal">Signal</button>
      </div>

        <div class="asfx-detail-panel" data-detail-panel>
          ${detailPanelHTML("chart", data)}
        </div>
      </section>
    `;

    document.body.appendChild(room);

    if (state.mode === "crypto") {
      loadDetailCandles();
    }

    room.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-detail]")) {
        room.remove();
        return;
      }

      const tab = e.target.closest("[data-detail-tab]");
      if (!tab) return;

      room.querySelectorAll("[data-detail-tab]").forEach(b => b.classList.remove("active"));
      tab.classList.add("active");

      const panel = room.querySelector("[data-detail-panel]");
      panel.innerHTML = detailPanelHTML(tab.dataset.detailTab, data);

      if (tab.dataset.detailTab === "chart" && state.mode === "crypto") {
        loadDetailCandles();
      }
    });
  }


  async function loadDetailCandles() {
    if (state.mode !== "crypto") return;

    const key = `${state.pair}_${state.tf}`;
    if (state.detailCandles[key] && state.detailCandles[key].length) {
      refreshDetailChart();
      return;
    }

    if (state.detailLoading) return;
    state.detailLoading = true;
    refreshDetailChart();

    const intervalMap = {
      "5m": "5m",
      "15m": "15m",
      "1H": "1h",
      "4H": "4h"
    };

    const interval = intervalMap[state.tf] || "15m";
    const symbol = state.pair || "BTCUSDT";

    const urls = [
      `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=70`,
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=70`
    ];

    let lastErr = null;

    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const rows = await res.json();

        const candles = rows.map(row => ({
          t: Number(row[0]),
          o: Number(row[1]),
          h: Number(row[2]),
          l: Number(row[3]),
          c: Number(row[4])
        })).filter(c => Number.isFinite(c.o) && Number.isFinite(c.c));

        state.detailCandles[key] = candles;
        try {
          window.__ASFX_SINGLE_CANDLE_SOURCE_V1__?.({
            pair: state.pair,
            symbol: state.pair,
            timeframe: state.timeframe || state.tf || state.interval || "15m",
            tf: state.timeframe || state.tf || state.interval || "15m",
            candles,
            price: candles && candles.length ? (candles[candles.length - 1].c || candles[candles.length - 1].close) : undefined
          });
        } catch (_) {}
        state.detailLoading = false;
        refreshDetailChart();
        return;
      } catch (err) {
        lastErr = err;
      }
    }

    console.warn("Detail chart candle error:", lastErr);
    state.detailLoading = false;
    refreshDetailChart(true);
  }

  function refreshDetailChart(error) {
    const box = document.querySelector("[data-room-chart]");
    if (!box) return;

    if (error) {
      box.innerHTML = `<div class="asfx-chart-empty">Chart feed error. Try refresh.</div>`;
      return;
    }

    box.innerHTML = detailChartHTML();
  }

  function detailChartHTML() {
    const key = `${state.pair}_${state.tf}`;
    const candles = state.detailCandles[key] || [];
    try {
      window.__ASFX_SMZ_ACCEPT_DETAIL_CANDLES__?.({
        pair: state.pair,
        symbol: state.pair,
        timeframe: state.timeframe || state.tf || state.interval || "15m",
        tf: state.timeframe || state.tf || state.interval || "15m",
        candles
      });
    } catch (_) {}

    if (state.detailLoading && !candles.length) {
      return `<div class="asfx-chart-empty">Loading ${safe(state.pair)} candles...</div>`;
    }

    if (!candles.length) {
      return `<div class="asfx-chart-empty">Waiting candle data...</div>`;
    }

    return detailCandleSvg(candles);
  }

  function detailCandleSvg(candles) {
    const visible = candles.slice(-48);
    const w = 760;
    const h = 360;
    const padL = 34;
    const padR = 88;
    const padT = 30;
    const padB = 34;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const highs = visible.map(c => c.h);
    const lows = visible.map(c => c.l);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const range = Math.max(max - min, 1);
    const step = chartW / Math.max(visible.length - 1, 1);
    const bodyW = Math.max(5, Math.min(10, step * .55));

    function y(price) {
      return padT + ((max - price) / range) * chartH;
    }

    function fmtPrice(v) {
      return Number(v).toLocaleString("en-US", { maximumFractionDigits: v > 100 ? 2 : 5 });
    }

    const grid = [1/6,2/6,3/6,4/6,5/6].map(p => {
      const yy = padT + chartH * p;
      const price = max - range * p;
      return `
        <line x1="${padL}" y1="${yy}" x2="${w-padR+12}" y2="${yy}" stroke="rgba(148,163,184,.16)" />
        <text x="${w-padR+20}" y="${yy+5}" fill="#94a3b8" font-size="12" font-weight="800">${fmtPrice(price)}</text>
      `;
    }).join("");

    const priceScale = Array.from({ length: 9 }, (_, i) => {
      const p = i / 8;
      const yy = padT + chartH * p;
      const priceLevel = max - ((max - min) * p);
      return `<text x="${w-padR+10}" y="${yy+4}" fill="rgba(226,232,240,.72)" font-size="10" font-weight="800">${fmt(priceLevel)}</text>`;
    }).join("");
    const candleSvg = visible.map((c, i) => {
      const x = padL + ((i + 0.5) * step);
      const up = c.c >= c.o;
      const color = up ? "#22c55e" : "#ef4444";
      const highY = y(c.h);
      const lowY = y(c.l);
      const openY = y(c.o);
      const closeY = y(c.c);
      const top = Math.min(openY, closeY);
      const height = Math.max(3, Math.abs(openY - closeY));

      return `
        <line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <rect x="${x - bodyW/2}" y="${top}" width="${bodyW}" height="${height}" rx="2" fill="${color}"/>
      `;
    }).join("");

    const last = visible[visible.length - 1];
    const lastY = y(last.c);
    const lastPrice = fmtPrice(last.c);

    return `
      <svg class="asfx-room-chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="asfxRoomBg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#0f172a" stop-opacity=".72"/>
            <stop offset="100%" stop-color="#020617" stop-opacity=".72"/>
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="${w}" height="${h}" fill="url(#asfxRoomBg)" rx="24"/>
        <g opacity=".7">
          ${grid}
          ${[0,1,2,3,4].map(i => {
            const xx = padL + (chartW/4) * i;
            return `<line x1="${xx}" y1="${padT}" x2="${xx}" y2="${padT+chartH}" stroke="rgba(148,163,184,.10)" />`;
          }).join("")}
        </g>

        <g>${candleSvg}</g>

        <line x1="${padL}" y1="${lastY}" x2="${w-padR+12}" y2="${lastY}" stroke="rgba(96,165,250,.75)" stroke-dasharray="5 6" stroke-width="2"/>
        <rect x="${w-padR+18}" y="${lastY-16}" width="74" height="31" rx="8" fill="rgba(37,99,235,.95)"/>
        <text x="${w-padR+26}" y="${lastY+5}" fill="#fff" font-size="12" font-weight="900">${lastPrice}</text>

        <text x="${padL}" y="22" fill="#93c5fd" font-size="12" font-weight="900">${safe(state.pair)}  -  ${safe(state.tf)}</text>
      </svg>
    `;
  }

  function referenceChartHTML(data) {
    return `
      <div class="asfx-room-ref-chart">
        <div>
          <small>Reference Mode</small>
          <b>${safe(data.symbol)}  -  ${safe(state.tf)}</b>
          <p>Forex/gold masih reference mode. Real broker/provider feed akan ditambahkan tahap berikutnya.</p>
        </div>
      </div>
    `;
  }


  function detailPanelHTML(tab, data) {
    if (tab === "chart") {
      const isCrypto = state.mode === "crypto";
      const key = `${state.pair}_${state.tf}`;
      const candles = (state.detailCandles && state.detailCandles[key]) ? state.detailCandles[key] : [];
    try {
      window.__ASFX_SMZ_ACCEPT_DETAIL_CANDLES__?.({
        pair: state.pair,
        symbol: state.pair,
        timeframe: state.timeframe || state.tf || state.interval || "15m",
        tf: state.timeframe || state.tf || state.interval || "15m",
        candles
      });
    } catch (_) {}
      const last = candles.length ? candles[candles.length - 1] : null;
      const price = last && last.c ? Number(last.c).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "Loading";
      const high = candles.length ? Math.max(...candles.map(c => Number(c.h || 0))).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "-";
      const low = candles.length ? Math.min(...candles.map(c => Number(c.l || 0))).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "-";
      return `
        <div class="asfx-room-chart asfx-room-chart-v1" data-room-chart>
          ${isCrypto ? detailChartHTML() : referenceChartHTML(data)}
        </div>

        <div class="asfx-chart-info-strip">
          <div>
            <small>Price</small>
            <b>${safe(price)}</b>
            <em>Live feed</em>
          </div>
          <div>
            <small>High</small>
            <b>${safe(high)}</b>
          </div>
          <div>
            <small>Low</small>
            <b>${safe(low)}</b>
          </div>
          <div>
            <small>Status</small>
            <b class="live-dot"> Live</b>
          </div>
        </div>

        <div class="asfx-detail-tfbar">
          <button class="${state.tf === "1m" ? "active" : ""}">1m</button>
          <button class="${state.tf === "5m" ? "active" : ""}">5m</button>
          <button class="${state.tf === "15m" ? "active" : ""}">15m</button>
          <button class="${state.tf === "30m" ? "active" : ""}">30m</button>
          <button class="${state.tf === "1h" ? "active" : ""}">1H</button>
          <button class="${state.tf === "4h" ? "active" : ""}">4H</button>
          <button class="${state.tf === "1d" ? "active" : ""}">1D</button>
          <button class="${state.tf === "1w" ? "active" : ""}">1W</button>
          <button class="icon">[]</button>
          <button class="icon">Æ’x</button>
        </div>
      `;
    }

    if (tab === "signal") {
      return `
        <div class="asfx-detail-grid">
          <div class="asfx-detail-mini"><small>Bias</small><b>${safe(data.bias)}</b></div>
          <div class="asfx-detail-mini"><small>Confidence</small><b>${safe(data.confidence)}%</b></div>
          <div class="asfx-detail-mini"><small>Setup</small><b>${safe(data.setup)}</b></div>
        </div>
      `;
    }

    if (tab === "risk") {
      return `
        <div class="asfx-detail-grid">
          <div class="asfx-detail-mini"><small>Risk Level</small><b>${safe(data.risk)}</b></div>
          <div class="asfx-detail-mini"><small>Rule</small><b>Wait confirmation before execution</b></div>
          <div class="asfx-detail-mini"><small>Invalidation</small><b>Unlocked in VIP detail</b></div>
        </div>
      `;
    }

    if (tab === "chat") {
      return `
        <div class="asfx-ai-box">
          <div class="asfx-ai-msg">
            Sentinel AI: Saya bisa bantu jelaskan bias, risiko, dan kondisi market dari setup ini. Full AI reasoning akan disambungkan ke engine tahap berikutnya.
          </div>
          <div class="asfx-ai-input">
            <input placeholder="Ask about this signal..." />
            <button>Ask</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="asfx-detail-grid">
        <div class="asfx-detail-mini"><small>Entry Zone</small><b class="asfx-vip-locked">VIP Locked</b></div>
        <div class="asfx-detail-mini"><small>Stop Loss</small><b class="asfx-vip-locked">VIP Locked</b></div>
        <div class="asfx-detail-mini"><small>Take Profit</small><b class="asfx-vip-locked">VIP Locked</b></div>
        <div class="asfx-detail-mini"><small>Full Reasoning</small><b class="asfx-vip-locked">VIP Locked</b></div>
      </div>
    `;
  }


  function bind(el) {
    if (el.dataset.asfxV2Bound === "1") return;
    el.dataset.asfxV2Bound = "1";

    el.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;

      if (btn.dataset.mode) {
        state.mode = btn.dataset.mode === "crypto" ? "crypto" : "ref";
        state.pair = state.mode === "crypto" ? "BTCUSDT" : "XAUUSD";
        render();
        if (state.mode === "crypto") fetchCrypto(state.pair);
      }

      if (btn.dataset.pair) {
        state.pair = btn.dataset.pair;
        render();
        if (state.mode === "crypto") fetchCrypto(state.pair);
      }

      if (btn.dataset.tf) {
        state.tf = btn.dataset.tf;
        render();
      }

      if (btn.dataset.action === "summary") {
        const card = btn.closest(".asfx-summary-card");
        card.classList.toggle("open");
        btn.textContent = card.classList.contains("open") ? "HIDE" : "SHOW";
      }

      if (btn.dataset.action === "detail") { if (canOpenSignalDetail()) showSignalDetailRoom(); else showVipGate(); }
      if (btn.dataset.action === "save") toast("Saved preview.");
      if (btn.dataset.action === "vip") toast("VIP detail locked.");
    });
  }

  function injectStyle() {
    if (document.getElementById("asfx-scanner-mobile-functional-v2-style")) return;

    const style = document.createElement("style");
    style.id = "asfx-scanner-mobile-functional-v2-style";
    style.textContent = `
      @media (max-width: 760px) {
        #scanner {
          padding: 14px 6px 150px !important;
        }

        .asfx-scan-v2 {
          display: grid;
          gap: 13px;
        }

        .asfx-scan-hero,
        .asfx-focus-card,
        .asfx-summary-card {
          margin: 0 2px;
          border-radius: 26px;
          border: 1px solid rgba(96,165,250,.18);
          background: linear-gradient(180deg, rgba(15,23,42,.94), rgba(2,6,23,.94));
          box-shadow: 0 18px 45px rgba(0,0,0,.28);
        }

        .asfx-scan-hero {
          padding: 20px 18px;
        }

        .asfx-scan-hero span {
          display: block;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .22em;
          color: #60a5fa;
          margin-bottom: 8px;
        }

        .asfx-scan-hero h1 {
          margin: 0 0 8px;
          color: #fff;
          font-size: clamp(34px, 10vw, 48px);
          line-height: .98;
          letter-spacing: -0.045em;
        }

        .asfx-scan-hero p {
          margin: 0;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.45;
        }

        .asfx-mode-rail,
        .asfx-pair-rail,
        .asfx-tf-rail {
          display: flex;
          gap: 9px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding: 0 2px 2px;
        }

        .asfx-mode-rail::-webkit-scrollbar,
        .asfx-pair-rail::-webkit-scrollbar,
        .asfx-tf-rail::-webkit-scrollbar {
          display: none;
        }

        .asfx-mode-rail button,
        .asfx-pair-rail button,
        .asfx-tf-rail button,
        .asfx-actions button,
        .asfx-summary-head button {
          flex: 0 0 auto;
          border: 1px solid rgba(96,165,250,.18);
          background: rgba(15,23,42,.86);
          color: #e5e7eb;
          border-radius: 999px;
          font-weight: 900;
          white-space: nowrap;
        }

        .asfx-mode-rail button {
          height: 40px;
          padding: 0 15px;
          font-size: 12px;
        }

        .asfx-pair-rail button {
          height: 38px;
          padding: 0 14px;
          font-size: 12px;
        }

        .asfx-tf-rail button {
          height: 34px;
          padding: 0 13px;
          font-size: 11px;
        }

        .asfx-mode-rail button.active,
        .asfx-pair-rail button.active,
        .asfx-tf-rail button.active {
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          color: #fff;
        }

        .asfx-focus-card {
          padding: 17px 14px;
        }

        .asfx-focus-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .asfx-focus-top small {
          color: #93c5fd;
          font-size: 11px;
          font-weight: 800;
        }

        .asfx-focus-top h2 {
          margin: 5px 0 0;
          color: #fff;
          font-size: clamp(34px, 10vw, 48px);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .asfx-badge {
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
        }

        .asfx-badge.buy,
        .asfx-summary-row .buy {
          color: #4ade80;
          background: rgba(34,197,94,.14);
        }

        .asfx-badge.sell,
        .asfx-summary-row .sell {
          color: #f87171;
          background: rgba(239,68,68,.14);
        }

        .asfx-badge.wait,
        .asfx-summary-row .wait {
          color: #facc15;
          background: rgba(250,204,21,.14);
        }

        .asfx-price-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin: 12px 0;
        }

        .asfx-price-row strong {
          color: #e5e7eb;
          font-size: clamp(24px, 7vw, 34px);
          letter-spacing: -0.03em;
        }

        .asfx-price-row span {
          font-weight: 900;
          font-size: 14px;
        }

        .asfx-price-row .green { color: #4ade80; }
        .asfx-price-row .red { color: #f87171; }

        .asfx-metric-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .asfx-metric-grid div {
          background: rgba(2,6,23,.48);
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 16px;
          padding: 10px 8px;
        }

        .asfx-metric-grid small {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .asfx-metric-grid b {
          color: #fff;
          font-size: 14px;
        }

        .asfx-preview-box {
          display: flex;
          gap: 12px;
          margin-top: 12px;
          padding: 12px;
          border-radius: 18px;
          border: 1px solid rgba(96,165,250,.14);
          background: rgba(2,6,23,.44);
        }

        .asfx-mini-chart {
          width: 46px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(96,165,250,.15), rgba(34,197,94,.18));
          position: relative;
        }

        .asfx-mini-chart::after {
          content: "";
          position: absolute;
          left: 8px;
          right: 8px;
          top: 50%;
          border-top: 2px dashed rgba(96,165,250,.75);
        }

        .asfx-preview-box small {
          color: #94a3b8;
          font-size: 10px;
        }

        .asfx-preview-box b {
          display: block;
          color: #fff;
          font-size: 15px;
          margin: 3px 0;
        }

        .asfx-preview-box p {
          margin: 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.35;
        }

        .asfx-actions {
          display: grid;
          grid-template-columns: 1.4fr .8fr .8fr;
          gap: 8px;
          margin-top: 12px;
        }

        .asfx-actions button {
          height: 40px;
          font-size: 11px;
        }

        .asfx-actions button:first-child {
          background: linear-gradient(135deg, #2563eb, #06b6d4);
        }

        .asfx-summary-card {
          padding: 16px 14px;
          max-height: 84px;
          overflow: hidden;
          transition: max-height .25s ease;
        }

        .asfx-summary-card.open {
          max-height: 620px;
        }

        .asfx-summary-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .asfx-summary-head h3 {
          margin: 0;
          color: #fff;
          font-size: 22px;
        }

        .asfx-summary-head button {
          height: 32px;
          padding: 0 12px;
          color: #93c5fd;
          font-size: 10px;
        }

        .asfx-summary-list {
          display: grid;
          gap: 8px;
        }

        .asfx-summary-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 9px;
          align-items: center;
          background: rgba(2,6,23,.42);
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 16px;
          padding: 10px 11px;
        }

        .asfx-summary-row b {
          display: block;
          color: #fff;
          font-size: 15px;
        }

        .asfx-summary-row small {
          color: #94a3b8;
          font-size: 11px;
        }

        .asfx-summary-row span {
          min-width: 48px;
          text-align: center;
          border-radius: 10px;
          padding: 4px 7px;
          font-weight: 900;
          font-size: 11px;
        }

        .asfx-summary-row strong {
          color: #e5e7eb;
          font-size: 15px;
        }

        .asfx-scan-toast {
          position: fixed;
          left: 50%;
          bottom: 112px;
          transform: translateX(-50%) translateY(12px);
          background: rgba(15,23,42,.96);
          color: #e5e7eb;
          border: 1px solid rgba(96,165,250,.24);
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 800;
          opacity: 0;
          pointer-events: none;
          transition: .2s ease;
          z-index: 99999;
        }

        .asfx-scan-toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .asfx-vip-gate {
          position: fixed;
          inset: 0;
          z-index: 999999;
          pointer-events: none;
          opacity: 0;
          transition: .22s ease;
        }

        .asfx-vip-gate.show {
          opacity: 1;
          pointer-events: auto;
        }

        .asfx-vip-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(2,6,23,.68);
          backdrop-filter: blur(10px);
        }

        .asfx-vip-sheet {
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 12px;
          border-radius: 30px;
          padding: 16px;
          color: #e5e7eb;
          border: 1px solid rgba(96,165,250,.22);
          background:
            radial-gradient(circle at 85% 0%, rgba(37,99,235,.24), transparent 38%),
            linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.98));
          box-shadow: 0 28px 80px rgba(0,0,0,.55);
          transform: translateY(22px);
          transition: .22s ease;
        }

        .asfx-vip-gate.show .asfx-vip-sheet {
          transform: translateY(0);
        }

        .asfx-vip-handle {
          width: 48px;
          height: 5px;
          border-radius: 999px;
          background: rgba(148,163,184,.35);
          margin: 0 auto 14px;
        }

        .asfx-vip-kicker {
          color: #60a5fa;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .2em;
          margin-bottom: 8px;
        }

        .asfx-vip-sheet h3 {
          margin: 0;
          font-size: clamp(25px, 7.2vw, 34px);
          line-height: 1.05;
          letter-spacing: -.04em;
          color: #fff;
        }

        .asfx-vip-sub {
          margin: 9px 0 13px;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.45;
        }

        .asfx-vip-preview {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 13px;
        }

        .asfx-vip-preview div {
          border: 1px solid rgba(148,163,184,.12);
          background: rgba(2,6,23,.5);
          border-radius: 16px;
          padding: 10px 8px;
          min-width: 0;
        }

        .asfx-vip-preview small {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .asfx-vip-preview b {
          color: #fff;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .asfx-vip-list {
          display: grid;
          gap: 8px;
          margin: 12px 0 14px;
        }

        .asfx-vip-list span {
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.35;
        }

        .asfx-vip-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .asfx-vip-actions button {
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(96,165,250,.2);
          background: rgba(15,23,42,.9);
          color: #e5e7eb;
          font-weight: 900;
          font-size: 12px;
        }

        .asfx-vip-actions .primary {
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          color: #fff;
          border-color: rgba(125,211,252,.5);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function boot() {
    injectStyle();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  setTimeout(boot, 700);
  setTimeout(boot, 1700);
  setTimeout(boot, 3000);
  setTimeout(boot, 5000);

  window.addEventListener("resize", boot);
  window.addEventListener("hashchange", boot);
  window.addEventListener("popstate", boot);

  setInterval(function(){
    const el = root();
    if (!el || !isMobile()) return;
    const visible = !el.classList.contains("hidden") && getComputedStyle(el).display !== "none";
    if (!visible) return;

    if (!el.querySelector(".asfx-scan-v2")) {
      boot();
    }
  }, 1200);

  setInterval(function(){
    const el = root();
    if (!el || !isMobile()) return;
    updateMainScannerCountdown();
  }, 1000);
})();

/* ASFX Scanner Bottom Nav Auto Hide */
(function(){
  function isMobile(){
    return window.innerWidth <= 760;
  }

  function scannerVisible(){
    const s = document.getElementById("scanner");
    if (!s || !isMobile()) return false;
    const css = getComputedStyle(s);
    return css.display !== "none" && !s.classList.contains("hidden");
  }

  function findBottomNav(){
    const labels = ["Home", "Scanner", "Community", "Profile"];
    const nodes = Array.from(document.querySelectorAll("nav, footer, div"));

    return nodes.find(el => {
      const txt = el.textContent || "";
      if (!labels.every(x => txt.includes(x))) return false;

      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      return (
        cs.position === "fixed" &&
        rect.top > window.innerHeight * 0.55 &&
        rect.height >= 50
      );
    });
  }

  function ensureToggle(){
    let btn = document.querySelector(".asfx-nav-mini-toggle");
    if (btn) return btn;

    btn = document.createElement("button");
    btn.className = "asfx-nav-mini-toggle";
    btn.type = "button";
    btn.textContent = "Menu";
    btn.addEventListener("click", () => {
      document.body.classList.toggle("asfx-show-bottom-nav");
      btn.textContent = document.body.classList.contains("asfx-show-bottom-nav") ? "Hide" : "Menu";
    });

    document.body.appendChild(btn);
    return btn;
  }

  function injectStyle(){
    if (document.getElementById("asfx-scanner-bottom-nav-style")) return;

    const style = document.createElement("style");
    style.id = "asfx-scanner-bottom-nav-style";
    style.textContent = `
      @media (max-width: 760px) {
        body.asfx-scanner-hide-bottom-nav:not(.asfx-show-bottom-nav) .asfx-detected-bottom-nav {
          transform: translateY(115%) !important;
          opacity: 0 !important;
          pointer-events: none !important;
          transition: .22s ease !important;
        }

        .asfx-nav-mini-toggle {
          position: fixed;
          right: 14px;
          bottom: 18px;
          z-index: 999997;
          height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(96,165,250,.25);
          background: rgba(15,23,42,.92);
          color: #93c5fd;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .08em;
          box-shadow: 0 16px 45px rgba(0,0,0,.35);
          display: none;
        }

        body.asfx-scanner-hide-bottom-nav .asfx-nav-mini-toggle {
          display: block;
        }

        body.asfx-show-bottom-nav .asfx-nav-mini-toggle {
          bottom: 104px;
        }

        body.asfx-detail-open .asfx-nav-mini-toggle {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function update(){
    injectStyle();

    const active = scannerVisible() || !!document.querySelector(".asfx-detail-room");
    document.body.classList.toggle("asfx-scanner-hide-bottom-nav", active);
    document.body.classList.toggle("asfx-detail-open", !!document.querySelector(".asfx-detail-room"));

    const nav = findBottomNav();
    if (nav) nav.classList.add("asfx-detected-bottom-nav");

    if (active) ensureToggle();
  }

  setInterval(update, 700);
  setTimeout(update, 500);
  setTimeout(update, 1500);
  window.addEventListener("resize", update);
})();

/* ASFX Detail Room Polish V1 */
(function(){
  function injectDetailRoomPolishV1(){
    if (document.getElementById("asfx-detail-room-polish-v1")) return;

    const style = document.createElement("style");
    style.id = "asfx-detail-room-polish-v1";
    style.textContent = `
      @media (max-width: 760px) {
        .asfx-detail-room {
          padding: 10px 7px 110px !important;
        }

        .asfx-detail-top {
          align-items: center !important;
          gap: 8px !important;
          margin-bottom: 10px !important;
        }

        .asfx-detail-back {
          height: 34px !important;
          padding: 0 11px !important;
          font-size: 13px !important;
          border-radius: 999px !important;
          flex: 0 0 auto !important;
        }

        .asfx-detail-title {
          min-width: 0 !important;
          flex: 1 !important;
        }

        .asfx-detail-title small {
          font-size: 9px !important;
          letter-spacing: .16em !important;
          white-space: nowrap !important;
        }

        .asfx-detail-title h2 {
          font-size: clamp(20px, 6vw, 28px) !important;
          line-height: 1.05 !important;
          padding: 0 !important;
          margin-top: 3px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .asfx-detail-card {
          padding: 10px !important;
          border-radius: 24px !important;
        }

        .asfx-detail-tabs {
          gap: 7px !important;
          margin-bottom: 10px !important;
        }

        .asfx-detail-tabs button {
          height: 33px !important;
          padding: 0 12px !important;
          font-size: 10px !important;
        }

        .asfx-detail-panel {
          min-height: 0 !important;
        }

        .asfx-room-chart {
          height: 345px !important;
          border-radius: 20px !important;
        }

        .asfx-detail-mini {
          padding: 11px !important;
          border-radius: 16px !important;
        }

        .asfx-ai-box {
          border-radius: 18px !important;
          padding: 12px !important;
        }

        .asfx-ai-msg {
          font-size: 13px !important;
          line-height: 1.42 !important;
        }

        .asfx-ai-input input {
          height: 38px !important;
          font-size: 12px !important;
        }

        .asfx-ai-input button {
          height: 38px !important;
          font-size: 12px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  setTimeout(injectDetailRoomPolishV1, 300);
  setTimeout(injectDetailRoomPolishV1, 1200);
})();


/* DETAIL_ROOM_LAYOUT_V1 */
(function injectDetailRoomLayoutV1(){
  if (document.getElementById("asfx-detail-room-layout-v1")) return;

  const style = document.createElement("style");
  style.id = "asfx-detail-room-layout-v1";
  style.textContent = `
    html, body {
      max-width: 100%;
      overflow-x: hidden !important;
    }

    .asfx-detail-room {
      padding: 18px 10px 24px !important;
      max-width: 100vw !important;
      overflow-x: hidden !important;
      background:
        radial-gradient(circle at 20% 0%, rgba(37,99,235,.24), transparent 34%),
        linear-gradient(180deg, #020617 0%, #030712 100%) !important;
    }

    .asfx-detail-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 0 2px 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(148,163,184,.18);
    }

    .asfx-brand-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .asfx-brand-logo {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 1000;
      font-size: 22px;
      background: linear-gradient(135deg, #38bdf8, #2563eb 55%, #020617);
      box-shadow: 0 14px 34px rgba(37,99,235,.35);
    }

    .asfx-brand-name {
      color: #fff;
      font-size: 22px;
      font-weight: 950;
      letter-spacing: -.03em;
      white-space: nowrap;
    }

    .asfx-brand-name span {
      font-size: 12px;
      color: #60a5fa;
      border: 1px solid rgba(96,165,250,.35);
      background: rgba(37,99,235,.16);
      border-radius: 9px;
      padding: 3px 7px;
      margin-left: 4px;
      vertical-align: middle;
    }

    .asfx-brand-actions {
      display: flex;
      gap: 8px;
    }

    .asfx-brand-actions button {
      width: 42px;
      height: 42px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,.24);
      background: rgba(15,23,42,.72);
      color: #e5e7eb;
      font-size: 21px;
      font-weight: 800;
    }

    .asfx-detail-top {
      gap: 10px !important;
      margin-bottom: 14px !important;
    }

    .asfx-detail-back {
      min-width: 104px !important;
      height: 58px !important;
      border-radius: 28px !important;
      font-size: 16px !important;
    }

    .asfx-detail-title {
      flex: 1;
      min-width: 0;
      padding: 8px 10px !important;
      background: linear-gradient(90deg, rgba(2,6,23,0), rgba(37,99,235,.30));
    }

    .asfx-detail-title small {
      font-size: 11px !important;
      letter-spacing: .34em !important;
      color: #38bdf8 !important;
    }

    .asfx-detail-title h2 {
      font-size: clamp(34px, 9vw, 48px) !important;
      line-height: .95 !important;
      letter-spacing: -.06em !important;
      margin-top: 5px !important;
    }

    .asfx-detail-card {
      margin: 0 !important;
      padding: 12px 8px 10px !important;
      border-radius: 28px !important;
      border: 1px solid rgba(96,165,250,.25) !important;
      background: linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.98)) !important;
      overflow: hidden !important;
    }

    .asfx-detail-tabs {
      display: flex !important;
      gap: 9px !important;
      overflow-x: auto !important;
      padding: 4px 4px 14px !important;
      scrollbar-width: none;
    }

    .asfx-detail-tabs::-webkit-scrollbar {
      display: none;
    }

    .asfx-detail-tabs button {
      min-width: max-content !important;
      padding: 13px 22px !important;
      border-radius: 24px !important;
      font-size: 15px !important;
      border: 1px solid rgba(148,163,184,.20) !important;
    }

    .asfx-detail-tabs button.active {
      background: linear-gradient(135deg, #2563eb, #06b6d4) !important;
      box-shadow: 0 12px 30px rgba(14,165,233,.24);
    }

    .asfx-detail-panel {
      min-height: 0 !important;
    }

    .asfx-room-chart-v1,
    .asfx-room-chart {
      width: 100% !important;
      height: 560px !important;
      min-height: 560px !important;
      margin: 0 !important;
      border-radius: 24px !important;
      overflow: hidden !important;
      border: 1px solid rgba(148,163,184,.30) !important;
      background:
        linear-gradient(rgba(148,163,184,.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148,163,184,.07) 1px, transparent 1px),
        radial-gradient(circle at 50% 18%, rgba(37,99,235,.20), transparent 38%),
        linear-gradient(180deg, rgba(15,23,42,.95), rgba(2,6,23,.96)) !important;
      background-size: 100% 70px, 125px 100%, auto, auto !important;
    }

    .asfx-room-chart::before,
    .asfx-room-chart::after {
      display: none !important;
    }

    .asfx-room-chart-svg {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      border-radius: 24px !important;
    }

    .asfx-chart-info-strip {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0;
      border: 1px solid rgba(148,163,184,.20);
      background: rgba(15,23,42,.78);
      border-radius: 20px;
      overflow: hidden;
    }

    .asfx-chart-info-strip div {
      padding: 12px 9px;
      min-width: 0;
      border-right: 1px solid rgba(148,163,184,.16);
    }

    .asfx-chart-info-strip div:last-child {
      border-right: 0;
    }

    .asfx-chart-info-strip small {
      display: block;
      color: #94a3b8;
      font-size: 10px;
      margin-bottom: 5px;
    }

    .asfx-chart-info-strip b {
      display: block;
      color: #fff;
      font-size: 13px;
      line-height: 1.05;
      overflow-wrap: anywhere;
    }

    .asfx-chart-info-strip em {
      display: block;
      color: #22c55e;
      font-size: 10px;
      font-style: normal;
      margin-top: 5px;
    }

    .asfx-chart-info-strip .live-dot {
      color: #22c55e;
    }

    .asfx-detail-tfbar {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      border-radius: 20px;
      border: 1px solid rgba(148,163,184,.18);
      background: rgba(15,23,42,.72);
      overflow-x: auto;
      scrollbar-width: none;
    }

    .asfx-detail-tfbar::-webkit-scrollbar {
      display: none;
    }

    .asfx-detail-tfbar button {
      border: 0;
      background: transparent;
      color: #94a3b8;
      font-size: 14px;
      font-weight: 900;
      padding: 10px 13px;
      border-radius: 999px;
      min-width: max-content;
    }

    .asfx-detail-tfbar button.active {
      color: #38bdf8;
      background: rgba(56,189,248,.10);
    }

    .asfx-detail-tfbar button.icon {
      margin-left: auto;
      border: 1px solid rgba(148,163,184,.20);
      background: rgba(2,6,23,.35);
      color: #fff;
    }

    .asfx-detail-tfbar button.icon + button.icon {
      margin-left: 0;
    }

    @media (max-width: 520px) {
      .asfx-detail-room {
        padding-left: 8px !important;
        padding-right: 8px !important;
      }

      .asfx-brand-name {
        font-size: 20px;
      }

      .asfx-detail-card {
        padding-left: 7px !important;
        padding-right: 7px !important;
      }

      .asfx-room-chart-v1,
      .asfx-room-chart {
        height: 545px !important;
        min-height: 545px !important;
      }

      .asfx-chart-info-strip {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .asfx-chart-info-strip div:nth-child(2) {
        border-right: 0;
      }

      .asfx-chart-info-strip div:nth-child(1),
      .asfx-chart-info-strip div:nth-child(2) {
        border-bottom: 1px solid rgba(148,163,184,.16);
      }
    }
  `;

  document.head.appendChild(style);
})();


/* SCANNER_STANDALONE_LIVE_CHART_V4 */
(function scannerStandaloneLiveChartV4(){
  if (document.getElementById("asfx-standalone-live-chart-v4")) return;

  const style = document.createElement("style");
  style.id = "asfx-standalone-live-chart-v4";
  style.textContent = `
    .asfx-room-chart {
      height: clamp(360px, 46svh, 430px) !important;
      min-height: 360px !important;
      max-height: 430px !important;
      border-radius: 22px !important;
      overflow: hidden !important;
      background:
        radial-gradient(circle at 50% 18%, rgba(37,99,235,.18), transparent 42%),
        linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.98)) !important;
    }

    .asfx-room-chart-svg {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
    }

    .asfx-standalone-live { color:#22c55e !important; font-weight:950 !important; }
    .asfx-standalone-wait { color:#facc15 !important; font-weight:950 !important; }

    .asfx-standalone-dot {
      display:inline-block;
      width:7px;
      height:7px;
      border-radius:999px;
      background:#22c55e;
      margin-right:5px;
      animation:asfxStandalonePulse 1s infinite;
    }

    @keyframes asfxStandalonePulse {
      0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}
      70%{box-shadow:0 0 0 7px rgba(34,197,94,0)}
      100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}
    }

    .asfx-price-up { color:#22c55e !important; }
    .asfx-price-down { color:#ef4444 !important; }

    .asfx-room-chart.asfx-standalone-flash {
      box-shadow:0 0 0 1px rgba(34,197,94,.18),0 0 22px rgba(37,99,235,.16)!important;
    }

    .asfx-chart-info-strip {
      margin-top: 8px !important;
      display: flex !important;
      gap: 7px !important;
      overflow-x: auto !important;
      scrollbar-width: none !important;
    }

    .asfx-chart-info-strip::-webkit-scrollbar {
      display: none !important;
    }

    .asfx-chart-info-strip div {
      flex: 0 0 106px !important;
      min-width: 106px !important;
      padding: 8px 9px !important;
      border-radius: 14px !important;
      border: 1px solid rgba(148,163,184,.18) !important;
      background: rgba(15,23,42,.80) !important;
    }

    .asfx-chart-info-strip small {
      display:block !important;
      color:#94a3b8 !important;
      font-size:9px !important;
      margin-bottom:3px !important;
    }

    .asfx-chart-info-strip b {
      display:block !important;
      color:#fff !important;
      font-size:12px !important;
      line-height:1.1 !important;
    }

    .asfx-chart-info-strip em {
      display:block !important;
      color:#22c55e !important;
      font-size:9px !important;
      font-style:normal !important;
      margin-top:3px !important;
    }
  `;
  document.head.appendChild(style);

  const BASE = "/api/binance";
  const TF_MS = {
    "1m":60000,"3m":180000,"5m":300000,"15m":900000,"30m":1800000,
    "1h":3600000,"4h":14400000,"1d":86400000,"1w":604800000
  };

  let candles = [];
  let lastPrice = null;
  let lastLoad = 0;
  let lastCtxKey = "";
  let busy = false;
  let status = "WAIT";


  /* ASFX_DETAIL_CANDLES_EXPORT_V4
     Exposes current chart candles to Zone Brain without touching chart render.
  */
  function asfxExportDetailCandlesV4(){
    try {
      const now = ctx();
      window.__ASFX_DETAIL_CANDLES_V1__ = (candles || []).map((c) => ({
        t: Number(c.t),
        o: Number(c.o),
        h: Number(c.h),
        l: Number(c.l),
        c: Number(c.c),
        v: Number(c.v || 0)
      }));
      window.__ASFX_DETAIL_CONTEXT_V1__ = {
        pair: now.pair,
        timeframe: now.tf,
        updatedAt: Date.now()
      };
    } catch (_) {}
  }

  function safe(v){
    return String(v ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[c]);
  }

  function ctx(){
    const title = document.querySelector(".asfx-detail-title h2")?.textContent || "BTCUSDT  -  15m";
    const pairMatch = title.match(/([A-Z0-9]{5,20})/);
    const tfMatch = title.match(/(1m|3m|5m|15m|30m|1h|4h|1d|1w)/i);

    return {
      pair: (pairMatch ? pairMatch[1] : "BTCUSDT").toUpperCase(),
      tf: (tfMatch ? tfMatch[1] : "15m").toLowerCase()
    };
  }

  function box(){
    return document.querySelector(".asfx-detail-room .asfx-room-chart");
  }

  function isDetailOpen(){
    // FIX: Deteksi berdasarkan kontainer Detail Room agar interval waktu tetap berdetak di tab Signal/Risk/AI Insight
    return !!document.querySelector(".asfx-detail-room");
  }

  function fmt(n){
    const x = Number(n);
    if (!Number.isFinite(x)) return "-";
    return x.toLocaleString("en-US", { maximumFractionDigits: x > 100 ? 2 : 5 });
  }

  function leftText(){
    const { tf } = ctx();
    const dur = TF_MS[tf] || TF_MS["15m"];
    const now = Date.now();
    const next = Math.ceil(now / dur) * dur;
    const total = Math.max(0, Math.floor((next - now) / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    return `${m}:${String(s).padStart(2,"0")}`;
  }

  function ensureWorkspace(nextStatus){
    if (nextStatus) status = nextStatus;

    const top = document.querySelector(".asfx-detail-top");
    if (!top) return;

    let bar = document.querySelector(".asfx-workspace-bar");
    if (!bar) {
      top.insertAdjacentHTML("afterend", `<div class="asfx-workspace-bar"></div>`);
      bar = document.querySelector(".asfx-workspace-bar");
    }

    const ok = status === "LIVE";

    bar.innerHTML = `
      <b>Workspace</b>
      <span>
        <i class="asfx-standalone-dot"></i>
        Scanner <strong class="${ok ? "asfx-standalone-live" : "asfx-standalone-wait"}">${safe(status)}</strong>
         -  ${safe(ctx().tf)} ${safe(leftText())}
      </span>
    `;
  }

  async function getJson(url){
    const res = await fetch(url + (url.includes("?") ? "&" : "?") + "_=" + Date.now(), {
      cache: "no-store"
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function loadKlines(){
    const { pair, tf } = ctx();
    const raw = await getJson(`${BASE}/klines?symbol=${encodeURIComponent(pair)}&interval=${encodeURIComponent(tf)}&limit=80`);

    candles = raw.map(k => ({
      t:Number(k[0]),
      o:Number(k[1]),
      h:Number(k[2]),
      l:Number(k[3]),
      c:Number(k[4]),
      v:Number(k[5])
    })).filter(c => Number.isFinite(c.c));

    if (!candles.length) throw new Error("empty candles");

    lastLoad = Date.now();
    lastCtxKey = `${ctx().pair}_${ctx().tf}`;
    asfxExportDetailCandlesV4();
  }

  function yFor(price, min, max, padT, chartH){
    return padT + ((max - price) / Math.max(1e-9, max - min)) * chartH;
  }

  
  /* ASFX_CHART_COUNTDOWN_V1B */
  function asfxChartTfMsV1B(tf){
    const value = String(tf || "15m").trim().toLowerCase();
    if (value === "1m") return 60 * 1000;
    if (value === "5m") return 5 * 60 * 1000;
    if (value === "15m") return 15 * 60 * 1000;
    if (value === "30m") return 30 * 60 * 1000;
    if (value === "1h") return 60 * 60 * 1000;
    if (value === "4h") return 4 * 60 * 60 * 1000;
    if (value === "1d") return 24 * 60 * 60 * 1000;
    if (value === "1w") return 7 * 24 * 60 * 60 * 1000;
    return 15 * 60 * 1000;
  }

  function asfxChartCountdownTextV1B(tf){
    const interval = asfxChartTfMsV1B(tf);
    const left = Math.max(0, interval - (Date.now() % interval));
    const total = Math.floor(left / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const two = (n) => String(n).padStart(2, "0");
    if (h > 0) return `${h}:${two(m)}:${two(s)}`;
    return `${two(m)}:${two(s)}`;
  }/* ASFX_INDICATOR_LAYER_V1 */
  const asfxIndicatorStateV1 = window.__ASFX_INDICATOR_STATE_V1__ || (window.__ASFX_INDICATOR_STATE_V1__ = {});

  const asfxIndicatorNums = (value) => {
    return String(value ?? "")
      .replace(/,/g, "")
      .match(/-?\d+(?:\.\d+)?/g)
      ?.map(Number)
      .filter(Number.isFinite) || [];
  };

  const asfxIndicatorLastNum = (value) => {
    const nums = asfxIndicatorNums(value);
    return nums.length ? nums[nums.length - 1] : null;
  };

  const asfxIndicatorRange = (value) => {
    const nums = asfxIndicatorNums(value);
    if (nums.length >= 2) {
      const a = nums[0];
      const b = nums[1];
      return {
        low: Math.min(a, b),
        high: Math.max(a, b),
        mid: (a + b) / 2
      };
    }
    if (nums.length === 1) {
      return { low: nums[0], high: nums[0], mid: nums[0] };
    }
    return null;
  };

  const asfxIndicatorFmt = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  const asfxIndicatorEsc = (value) => String(value ?? "")
    .replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));

  /* ASFX_SIGNAL_CHART_PACKET_SYNC_V5
     Single chart source: ASFXPlanPacketV1 V5.
     FRESH_ENTRY draws Entry/SL/TP; WAITING/REACTION draws context zone only.
  */
  function asfxIndicatorSource(){
    try {
      const packet = window.ASFXPlanPacketV1 && typeof window.ASFXPlanPacketV1.latest === "function"
        ? window.ASFXPlanPacketV1.latest()
        : null;

      if (packet && typeof packet === "object" && (packet.version || packet.decision || packet.chartMode)) {
        const side = String(packet.side || "").toUpperCase();
        const chartMode = String(packet.chartMode || packet.visualMode || "").toUpperCase();
        const decision = String(packet.decision || "").toUpperCase();
        const lifecycle = String(packet.lifecycle || "").toUpperCase();
        const entry = packet.entryPrimary || null;
        const contextZone = packet.contextZone || packet.watchZone || null;
        const hasEntry = entry && Number.isFinite(Number(entry.low)) && Number.isFinite(Number(entry.high));
        const hasContext = contextZone && Number.isFinite(Number(contextZone.low)) && Number.isFinite(Number(contextZone.high));

        const freshEntry =
          packet.valid === true &&
          packet.freshEntry === true &&
          packet.noFreshEntry !== true &&
          chartMode === "FRESH_ENTRY" &&
          hasEntry &&
          Number.isFinite(Number(packet.sl)) &&
          Number.isFinite(Number(packet.tp1)) &&
          Number.isFinite(Number(packet.tp2)) &&
          (side === "BUY" || side === "SELL");

        const contextOnly =
          !freshEntry &&
          hasContext &&
          (side === "BUY" || side === "SELL") &&
          /WAITING_ZONE|REACTION_ZONE|TP1_HIT|TP2_HIT|PROTECT|RUNNING/.test(chartMode + " " + decision + " " + lifecycle);

        const zoneForChart = freshEntry ? entry : contextOnly ? contextZone : null;
        const zoneText = zoneForChart ? String(zoneForChart.low) + " - " + String(zoneForChart.high) : "";
        const statusLabel = packet.decision || packet.lifecycle || packet.chartMode || "ZONE SCAN";

        const base = {
          pair: packet.pair,
          symbol: packet.pair,
          tf: packet.timeframe,
          timeframe: packet.timeframe,
          bias: (freshEntry || contextOnly) ? side : "WAIT",
          risk: packet.risk || "Medium",
          confidence: packet.score || packet.confidence || 0,
          price: packet.price,
          currentPrice: packet.price,
          livePrice: packet.price,
          signalStatus: freshEntry ? "SIGNAL READY" : statusLabel,
          status: freshEntry ? "SIGNAL READY" : statusLabel,
          actionStatus: freshEntry ? (packet.decision || packet.zoneType || "SIGNAL READY") : statusLabel,
          setupType: contextOnly ? (packet.activeZoneRole || packet.zoneType || statusLabel) : (packet.zoneType || statusLabel),
          reason: packet.targetValidity?.reason || packet.reason || "AiSignal SOP Engine V5 packet synced.",
          statusDetail: packet.targetValidity?.reason || packet.reason || "AiSignal SOP Engine V5 packet synced.",
          asfxPacketVersion: packet.version,
          asfxPacketDecision: decision,
          asfxPacketLifecycle: lifecycle,
          asfxPacketChartMode: chartMode,
          asfxPacketFreshEntry: freshEntry,
          asfxPacketContextOnly: contextOnly,
          asfxPacketHit: packet.hit || {},
          asfxPacketTargetValidity: packet.targetValidity || {},
          contextOnly,
          noFreshEntry: !freshEntry,
          activeZone: zoneText,
          entryZone: zoneText,
          zoneState: packet.activeZoneRole || packet.zoneType || statusLabel
        };

        if (freshEntry) {
          return {
            ...base,
            stopLossGuide: String(packet.sl),
            slGuide: String(packet.sl),
            tp1Guide: packet.activeLines?.tp1 === false ? "" : String(packet.tp1),
            tp2Guide: packet.activeLines?.tp2 === false ? "" : String(packet.tp2),
            tp3Guide: packet.activeLines?.tp3 === false ? "" : String(packet.tp3 || ""),
            demandZone: packet.mtfContext?.demandZone ? packet.mtfContext.demandZone.low + " - " + packet.mtfContext.demandZone.high : "",
            supplyZone: packet.mtfContext?.supplyZone ? packet.mtfContext.supplyZone.low + " - " + packet.mtfContext.supplyZone.high : ""
          };
        }

        return base;
      }

      const sources = [
        window.AiSignalSMZCandleReaderV1?.last?.(),
        window.AiSignalSMZStatusFlowV1?.last?.(),
        window.ASFXSignalRoomDataHydratorV1?.latest?.()
      ].filter((x) => x && typeof x === "object");

      return sources[0] || {};
    } catch (err) {
      return {};
    }
  }

  /* ASFX_BUILD_INDICATOR_PLAN_V5 */
  function asfxBuildIndicatorPlan(visible = [], last = {}){
    const d = asfxIndicatorSource();
    const livePrice = Number(last?.c ?? last?.close ?? d.currentPrice ?? d.price ?? d.livePrice ?? 0);
    const bias = String(d.bias || "").toUpperCase();
    const side = bias.includes("SELL") ? "SELL" : bias.includes("BUY") ? "BUY" : "WAIT";

    let entry = asfxIndicatorRange(d.entryZone || d.activeZone || d.zoneState || d.zone);
    const sl = asfxIndicatorLastNum(d.stopLossGuide || d.slGuide || d.invalidationLevel);
    const tp1 = asfxIndicatorLastNum(d.tp1Guide);
    const tp2 = asfxIndicatorLastNum(d.tp2Guide);

    const rawStatusText = [d.signalStatus, d.statusFlow, d.actionStatus, d.status, d.statusDetail, d.reason]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const hardBlocked =
      side === "WAIT" ||
      /no trade|invalid|stale|expired|middle range|risk alert/i.test(rawStatusText);

    const contextOnly = d.contextOnly === true || d.asfxPacketContextOnly === true;
    const hasContext =
      !hardBlocked &&
      contextOnly &&
      Number.isFinite(livePrice) &&
      side !== "WAIT" &&
      entry &&
      Number.isFinite(entry.low) &&
      Number.isFinite(entry.high);

    const hasPlan =
      !hardBlocked &&
      !contextOnly &&
      Number.isFinite(livePrice) &&
      side !== "WAIT" &&
      entry &&
      Number.isFinite(entry.low) &&
      Number.isFinite(entry.high) &&
      Number.isFinite(sl) &&
      Number.isFinite(tp1) &&
      Number.isFinite(tp2);

    const confidence = Number(String(d.confidence || 0).replace(/[^0-9.]/g, "")) || 0;
    const risk = String(d.risk || "Medium");
    const pair = ctx().pair;
    const tf = ctx().tf;

    const base = {
      hasPlan,
      hasContext,
      contextOnly: hasContext && !hasPlan,
      side,
      pair,
      tf,
      price: livePrice,
      entry,
      sl,
      tp1,
      tp2,
      risk,
      confidence,
      source: d,
      status: hasPlan ? "SIGNAL READY" : hasContext ? String(d.signalStatus || d.status || d.actionStatus || "WATCH ZONE") : "NO TRADE",
      closed: false,
      prices: Number.isFinite(livePrice) ? [livePrice].concat(entry ? [entry.low, entry.high] : []) : []
    };

    if (!hasPlan && !hasContext) {
      window.__ASFX_INDICATOR_LAST_V1__ = base;
      window.ASFXIndicatorLayerV1 = { version: "5.0.0", latest: () => window.__ASFX_INDICATOR_LAST_V1__ || null };
      return base;
    }

    if (hasContext && !hasPlan) {
      window.__ASFX_INDICATOR_LAST_V1__ = base;
      window.ASFXIndicatorLayerV1 = { version: "5.0.0", latest: () => window.__ASFX_INDICATOR_LAST_V1__ || null };
      return base;
    }

    const key = [pair, tf, side, Math.round(entry.low * 100) / 100, Math.round(entry.high * 100) / 100, Math.round(sl * 100) / 100, Math.round(tp1 * 100) / 100, Math.round(tp2 * 100) / 100].join("|");
    const state = asfxIndicatorStateV1[key] || { status: "SIGNAL READY", touched: false, tp1Hit: false, closed: false, createdAt: Date.now() };
    const entryTouched = livePrice >= entry.low && livePrice <= entry.high;
    const slHit = side === "BUY" ? livePrice <= sl : livePrice >= sl;
    const tp1Hit = side === "BUY" ? livePrice >= tp1 : livePrice <= tp1;
    const tp2Hit = side === "BUY" ? livePrice >= tp2 : livePrice <= tp2;

    if (!state.closed) {
      if (entryTouched) { state.touched = true; state.status = "ENTRY TOUCHED"; }
      if (state.touched) {
        if (slHit) { state.status = "SL HIT"; state.closed = true; }
        else if (tp2Hit) { state.status = "TP2 HIT"; state.tp1Hit = true; state.closed = true; }
        else if (tp1Hit) { state.status = "TP1 HIT"; state.tp1Hit = true; }
      }
    }

    asfxIndicatorStateV1[key] = state;
    base.status = state.status;
    base.touched = state.touched;
    base.tp1Hit = state.tp1Hit;
    base.closed = state.closed;
    base.key = key;
    base.prices = state.closed ? [livePrice] : [livePrice, entry.low, entry.high, sl, tp1, tp2].filter(Number.isFinite);
    window.__ASFX_INDICATOR_LAST_V1__ = base;
    window.ASFXIndicatorLayerV1 = { version: "5.0.0", latest: () => window.__ASFX_INDICATOR_LAST_V1__ || null };
    return base;
  }

  /* ASFX_RENDER_INDICATOR_SVG_V5 */
  function asfxRenderIndicatorSvg(plan, min, max, padT, chartH, w, padL, padR){
    if (!plan || !Number.isFinite(plan.price)) return "";
    const chartRight = w - padR;
    const chartW = chartRight - padL;
    const y = (price) => yFor(Number(price), min, max, padT, chartH);
    const esc = typeof asfxIndicatorEsc === "function" ? asfxIndicatorEsc : (value) => String(value ?? "");

    const line = (price, label, color, dash = "6 5") => {
      if (!Number.isFinite(Number(price))) return "";
      const yy = y(price);
      if (!Number.isFinite(yy) || yy < -20 || yy > padT + chartH + 20) return "";
      return '<g data-asfx-indicator-line="' + esc(label) + '">' +
        '<line x1="' + padL + '" y1="' + yy + '" x2="' + chartRight + '" y2="' + yy + '" stroke="' + color + '" stroke-width="1.7" stroke-dasharray="' + dash + '" opacity=".72"/>' +
        '<rect x="' + (chartRight - 78) + '" y="' + (yy - 10) + '" width="76" height="18" rx="7" fill="rgba(2,6,23,.82)" stroke="' + color + '" opacity=".72"/>' +
        '<text x="' + (chartRight - 72) + '" y="' + (yy + 4) + '" fill="#fff" font-size="9" font-weight="900">' + esc(label) + ' ' + asfxIndicatorFmt(price) + '</text>' +
      '</g>';
    };

    let out = "";
    if (!plan.hasPlan && !plan.hasContext) return out;

    if (plan.closed) {
      const statusY = padT + 18;
      return '<g data-asfx-indicator-closed="1">' +
        '<rect x="' + padL + '" y="' + (statusY - 14) + '" width="178" height="24" rx="10" fill="rgba(15,23,42,.88)" stroke="rgba(148,163,184,.32)"/>' +
        '<text x="' + (padL + 10) + '" y="' + (statusY + 2) + '" fill="#fff" font-size="11" font-weight="900">' + esc(plan.side + " " + plan.status) + '</text>' +
      '</g>';
    }

    if (!plan.entry || !Number.isFinite(plan.entry.low) || !Number.isFinite(plan.entry.high)) return out;
    const entryTop = Math.min(y(plan.entry.low), y(plan.entry.high));
    const entryBottom = Math.max(y(plan.entry.low), y(plan.entry.high));
    const entryH = Math.max(2, entryBottom - entryTop);

    if (plan.hasContext && !plan.hasPlan) {
      const badgeY = padT + 18;
      out += '<g data-asfx-indicator-zone="context">' +
        '<rect x="' + padL + '" y="' + entryTop + '" width="' + chartW + '" height="' + entryH + '" rx="4" fill="rgba(245,158,11,.08)" stroke="rgba(245,158,11,.46)" stroke-width="1"/>' +
        '<text x="' + (padL + 8) + '" y="' + (entryTop - 5) + '" fill="#f59e0b" font-size="10" font-weight="900">' + esc(plan.side + " WATCH ZONE") + '</text>' +
      '</g>';
      out += line(plan.entry.low, "WATCH", "rgba(245,158,11,.92)", "8 5");
      if (Math.abs(plan.entry.high - plan.entry.low) > 0) out += line(plan.entry.high, "WATCH", "rgba(245,158,11,.92)", "8 5");
      out += '<g data-asfx-indicator-status="context">' +
        '<rect x="' + padL + '" y="' + (badgeY - 14) + '" width="232" height="24" rx="10" fill="rgba(15,23,42,.88)" stroke="rgba(245,158,11,.34)"/>' +
        '<text x="' + (padL + 10) + '" y="' + (badgeY + 2) + '" fill="#fff" font-size="11" font-weight="900">' + esc(String(plan.status || "WATCH ZONE").toUpperCase()) + '</text>' +
      '</g>';
      return out;
    }

    out += '<g data-asfx-indicator-zone="entry">' +
      '<rect x="' + padL + '" y="' + entryTop + '" width="' + chartW + '" height="' + entryH + '" rx="4" fill="rgba(56,189,248,.08)" stroke="rgba(56,189,248,.38)" stroke-width="1"/>' +
      '<text x="' + (padL + 8) + '" y="' + (entryTop - 5) + '" fill="#38bdf8" font-size="10" font-weight="900">' + esc(plan.side + " ENTRY ZONE") + '</text>' +
    '</g>';
    out += line(plan.entry.low, "ENTRY", "rgba(56,189,248,.96)", "8 4");
    if (Math.abs(plan.entry.high - plan.entry.low) > 0) out += line(plan.entry.high, "ENTRY", "rgba(56,189,248,.96)", "8 4");
    out += line(plan.sl, "SL", "rgba(248,113,113,.96)", "5 4");
    if (!plan.tp1Hit) out += line(plan.tp1, "TP1", "rgba(34,197,94,.96)", "5 4");
    out += line(plan.tp2, "TP2", "rgba(34,197,94,.96)", "5 4");
    const badgeY = padT + 18;
    out += '<g data-asfx-indicator-status="1">' +
      '<rect x="' + padL + '" y="' + (badgeY - 14) + '" width="190" height="24" rx="10" fill="rgba(15,23,42,.88)" stroke="rgba(56,189,248,.32)"/>' +
      '<text x="' + (padL + 10) + '" y="' + (badgeY + 2) + '" fill="#fff" font-size="11" font-weight="900">' + esc(plan.side + " " + plan.status) + '</text>' +
    '</g>';
    return out;
  }

  function asfxSyncSignalTabFromIndicator(plan){
    /* ASFX_SIGNAL_DIRECT_MANAGEMENT_V51 */
    if (window.__ASFX_PACKET_UI_AUTHORITY_V5__) return; // Gating: Cegah bentrokan jika UI Authority V5 aktif
    const panel = document.querySelector('[data-asfx-bridge-rendered="signal"]');
    if (!panel) return;

    const esc = typeof asfxIndicatorEsc === "function" ? asfxIndicatorEsc : (value) => String(value ?? "").replace(/[&<>"']/g, function(m){
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[m] || m;
    });

    const fmt = (v, fb = "—") => {
      const n = Number(v);
      if (!Number.isFinite(n)) return fb;
      return n.toLocaleString("en-US", { maximumFractionDigits: Math.abs(n) >= 1000 ? 2 : 5 });
    };

    const hasRange = (r) => r && typeof r === "object" && Number.isFinite(Number(r.low)) && Number.isFinite(Number(r.high));
    const range = (r, fb = "—") => {
      if (!hasRange(r)) return fb;
      return fmt(r.low) + " - " + fmt(r.high);
    };

    const installStyle = () => {
      if (typeof document === "undefined") return;
      if (document.getElementById("asfx-signal-direct-management-v51-style")) return;
      const style = document.createElement("style");
      style.id = "asfx-signal-direct-management-v51-style";
      style.textContent = ""
        + "[data-asfx-management-polish-v51='1'] .asfx-bridge-title{white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;line-height:1.05!important;max-width:100%!important;}"
        + "[data-asfx-management-polish-v51='1'] .asfx-bridge-head{overflow:hidden!important;}"
        + "[data-asfx-management-polish-v51='1'] .asfx-bridge-mini b{white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;line-height:1.15!important;}"
        + "[data-asfx-management-polish-v51='1'] .asfx-bridge-sub{white-space:normal!important;overflow-wrap:anywhere!important;}"
        + "@media(max-width:760px){[data-asfx-management-polish-v51='1'] .asfx-bridge-title{font-size:clamp(22px,7vw,34px)!important;}[data-asfx-management-polish-v51='1'] .asfx-bridge-grid{grid-template-columns:1fr 1fr!important;}}";
      document.head.appendChild(style);
    };

    try {
      const packet = window.ASFXPlanPacketV1 && typeof window.ASFXPlanPacketV1.latest === "function"
        ? window.ASFXPlanPacketV1.latest()
        : null;

      if (packet && typeof packet === "object") {
        installStyle();

        const hit = packet.hit || {};
        const tv = packet.targetValidity || {};
        const activeLines = packet.activeLines || {};

        const pair = String(packet.pair || plan?.pair || "PAIR");
        const tf = String(packet.timeframe || packet.tf || plan?.tf || "TF");
        const side = String(packet.side || packet.direction || plan?.side || "").toUpperCase();
        const chartMode = String(packet.chartMode || packet.visualMode || "").toUpperCase();
        const decisionRaw = String(packet.decision || "WAIT");
        const decision = decisionRaw.toUpperCase();
        const lifecycle = String(packet.lifecycle || "").toUpperCase();
        const text = decision + " " + lifecycle + " " + chartMode;

        const freshEntry =
          packet.freshEntry === true &&
          packet.noFreshEntry !== true &&
          chartMode === "FRESH_ENTRY" &&
          activeLines.entry !== false &&
          activeLines.sl !== false &&
          activeLines.tp1 !== false &&
          !/TP1 HIT|TP2 HIT|TP3 HIT|PROTECT|SL HIT|INVALID|CLOSED|COMPLETED/.test(text);

        const isProtect =
          /TP1 HIT|TP2 HIT|TP3 HIT|PROTECT|RUNNING|TP AREA/.test(text) ||
          hit.tp1 === true ||
          hit.tp2 === true;

        const isClosed =
          /SL HIT|INVALID|CLOSED|COMPLETED/.test(text) ||
          hit.sl === true ||
          hit.tp3 === true;

        const isWaiting =
          !freshEntry && !isProtect && !isClosed;

        const zone = packet.contextZone || packet.watchZone || packet.entryPrimary || packet.activeZone;
        const entryZone = packet.entryPrimary || zone;

        const title = isProtect
          ? (hit.tp1 || decision.includes("TP1") ? side + " TP1 HIT — PROTECT PROFIT" : decisionRaw)
          : isClosed
            ? "SETUP CLOSED / INVALID"
            : decisionRaw;

        const subtitle = freshEntry
          ? pair + " | " + tf + " | Fresh entry zone ready"
          : isProtect
            ? pair + " | " + tf + " | No fresh execution"
            : isClosed
              ? pair + " | " + tf + " | Plan closed"
              : pair + " | " + tf + " | Waiting price to enter zone";

        const titleColor = side === "BUY" ? "#22c55e" : side === "SELL" ? "#ef4444" : "#e5e7eb";

        let boxLabel = "Watch / Context Zone";
        let boxValue = range(zone, "Waiting valid zone");
        let statusLabel = "Watch Mode";
        let statusText = "Harga belum masuk zona. Sistem hanya memantau area, bukan memberi entry baru.";
        let entryText = "WAIT ZONE";
        let sl = "LOCKED";
        let tp1 = "WAIT";
        let tp2 = "WAIT";
        let tp3 = "WAIT";
        let note = "Jangan entry dari harga sekarang. Tunggu price masuk zona dan muncul konfirmasi candle/volume.";

        if (freshEntry) {
          boxLabel = "Entry Zone";
          boxValue = range(entryZone, "Pending");
          statusLabel = "Fresh Execution";
          statusText = "Signal baru aktif. Entry, SL, dan TP hanya valid jika harga berada di zona resmi.";
          entryText = range(entryZone, "Pending");
          sl = fmt(packet.sl);
          tp1 = fmt(packet.tp1);
          tp2 = fmt(packet.tp2);
          tp3 = fmt(packet.tp3);
          note = "Gunakan plan hanya selama invalidation belum ditembus dan harga masih sinkron dengan zona.";
        } else if (isProtect) {
          boxLabel = "Original / Context Zone";
          boxValue = range(zone, "Previous signal zone");
          statusLabel = "Plan Management";
          statusText = "TP sudah tersentuh. Sistem masuk mode protect profit, bukan fresh entry baru.";
          entryText = "NO NEW ENTRY";
          sl = "PROTECT / BE";
          tp1 = hit.tp1 || decision.includes("TP1") ? "HIT" : "PROTECT";
          tp2 = hit.tp2 || decision.includes("TP2") ? "HIT" : "WATCH";
          tp3 = hit.tp3 || decision.includes("TP3") ? "HIT" : "WATCH";
          note = "Kalau sudah entry dari zona awal, amankan profit dan pantau TP2/TP3. Entry baru harus menunggu pullback/retest atau setup baru.";
        } else if (isClosed) {
          boxLabel = "Closed Context";
          boxValue = range(zone, "Closed");
          statusLabel = "Closed / Invalid";
          statusText = "Plan lama sudah selesai atau invalid. Sistem menunggu struktur baru.";
          entryText = "CLOSED";
          sl = hit.sl ? "SL HIT" : "INACTIVE";
          tp1 = hit.tp1 ? "HIT" : "—";
          tp2 = hit.tp2 ? "HIT" : "—";
          tp3 = hit.tp3 ? "HIT" : "—";
          note = "Jangan gunakan plan lama untuk entry baru.";
        }

        const key = [
          "signal-direct-v51",
          title,
          pair,
          tf,
          chartMode,
          boxValue,
          entryText,
          sl,
          tp1,
          tp2,
          tp3,
          packet.price,
          tv.reason || ""
        ].join("|");

        if (panel.dataset.asfxSignalDirectV51Key === key) return;
        panel.dataset.asfxSignalDirectV51Key = key;
        panel.setAttribute("data-asfx-management-polish-v51", "1");

        panel.innerHTML =
          '<div class="asfx-bridge-head">' +
            '<div class="asfx-bridge-kicker">Signal Zone</div>' +
            '<div class="asfx-bridge-title" style="color:' + titleColor + ';">' + esc(title) + '</div>' +
            '<div class="asfx-bridge-sub">' + esc(subtitle) + '</div>' +
          '</div>' +

          '<div class="asfx-bridge-box">' +
            '<b style="color:#fff;">' + esc(statusLabel) + '</b><br>' +
            esc(statusText) + '<br>' +
            'Current price: <b style="color:#fff;">' + esc(fmt(packet.price || packet.currentPrice || plan?.price, "-")) + '</b>' +
          '</div>' +

          '<div class="asfx-bridge-box">' +
            '<small>' + esc(boxLabel) + '</small><br>' +
            '<b style="color:#fff;font-size:20px;">' + esc(boxValue) + '</b>' +
          '</div>' +

          '<div class="asfx-bridge-grid">' +
            '<div class="asfx-bridge-mini"><small>Entry</small><b>' + esc(entryText) + '</b></div>' +
            '<div class="asfx-bridge-mini"><small>SL</small><b>' + esc(sl) + '</b></div>' +
            '<div class="asfx-bridge-mini"><small>TP1</small><b>' + esc(tp1) + '</b></div>' +
            '<div class="asfx-bridge-mini"><small>TP2</small><b>' + esc(tp2) + '</b></div>' +
            '<div class="asfx-bridge-mini"><small>TP3</small><b>' + esc(tp3) + '</b></div>' +
            '<div class="asfx-bridge-mini"><small>Mode</small><b>' + esc(chartMode || "READING") + '</b></div>' +
          '</div>' +

          '<div class="asfx-bridge-lock">' + esc(note) + '</div>';

        return;
      }
    } catch (err) {
      console.warn("ASFX signal direct management V5.1 skipped:", err);
    }

    if (!plan) return;
  }

  if (!window.__ASFX_INDICATOR_SIGNAL_SYNC_TIMER_V1__) {
    window.__ASFX_INDICATOR_SIGNAL_SYNC_TIMER_V1__ = setInterval(() => {
      if (window.__ASFX_INDICATOR_LAST_V1__) {
        asfxSyncSignalTabFromIndicator(window.__ASFX_INDICATOR_LAST_V1__);
      }
    }, 900);
  }
  function chartSvg(){
    const { pair, tf } = ctx();
    const visible = candles.slice(-48);

    if (!visible.length) {
      return `<div class="asfx-chart-empty">Loading ${safe(pair)} candles...</div>`;
    }

    const w = 760;
    const h = 420;
    const padL = 38;
    const padR = 98;
    const padT = 30;
    const padB = 32;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const highs = visible.map(c => Number(c.h));
    const lows = visible.map(c => Number(c.l));
    const asfxPlan = asfxBuildIndicatorPlan(visible, visible[visible.length - 1] || {});
    const asfxPlanPrices = Array.isArray(asfxPlan.prices) ? asfxPlan.prices.filter(Number.isFinite) : [];
    const scalePrices = [...highs, ...lows, ...asfxPlanPrices].filter(Number.isFinite);
    const rawMax = Math.max(...scalePrices);
    const rawMin = Math.min(...scalePrices);
    const rawRange = Math.max(rawMax - rawMin, Math.abs(rawMax || 1) * 0.0015, 1e-9);
    const scalePad = rawRange * 0.08;
    const max = rawMax + scalePad;
    const min = rawMin - scalePad;
    const range = Math.max(1e-9, max - min);
    const rightGapBars = 4;
    const step = chartW / Math.max(visible.length - 1 + rightGapBars, 1);
    const bodyW = Math.max(4, Math.min(10, step * .55));

    const grid = Array.from({ length: 9 }, (_, i) => i / 8).map((p) => {
      const y = padT + chartH * p;
      return `<line x1="0" y1="${y}" x2="${w-padR}" y2="${y}" stroke="rgba(148,163,184,.12)" stroke-width="1"/>`;
    }).join("");

    const vgrid = Array.from({ length: 5 }, (_, i) => {
      const x = padL + (chartW / 4) * i;
      return `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT+chartH}" stroke="rgba(148,163,184,.055)" stroke-width="1"/>`;
    }).join("");

    const priceScale = Array.from({ length: 9 }, (_, i) => {
      const p = i / 8;
      const yy = padT + chartH * p;
      const priceLevel = max - ((max - min) * p);
      return `<text x="${w-padR+10}" y="${yy+4}" fill="rgba(226,232,240,.72)" font-size="10" font-weight="800">${fmt(priceLevel)}</text>`;
    }).join("");
    const candleSvg = visible.map((c, i) => {
      const x = padL + ((i + 0.5) * step);
      const up = Number(c.c) >= Number(c.o);
      const color = up ? "#22c55e" : "#ef4444";
      const highY = yFor(Number(c.h), min, max, padT, chartH);
      const lowY = yFor(Number(c.l), min, max, padT, chartH);
      const openY = yFor(Number(c.o), min, max, padT, chartH);
      const closeY = yFor(Number(c.c), min, max, padT, chartH);
      const top = Math.min(openY, closeY);
      const height = Math.max(3, Math.abs(openY - closeY));

      return `
        <line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <rect x="${x-bodyW/2}" y="${top}" width="${bodyW}" height="${height}" rx="2" fill="${color}"/>
      `;
    }).join("");

    const last = visible[visible.length - 1];
    const prev = visible[visible.length - 2] || last;
    const down = Number(last.c) < Number(prev.c);
    const lastY = yFor(Number(last.c), min, max, padT, chartH);
    const asfxChartCountdownValueV1B = asfxChartCountdownTextV1B(tf);
    const asfxChartCountdownSvgV1B = `
      <g data-asfx-chart-countdown-v1b="1">
        <text x="${w-padR+26}" y="${lastY+20}" fill="rgba(255,255,255,.86)" font-size="10" font-weight="900">${asfxChartCountdownValueV1B}</text>
      </g>
    `;
    const asfxIndicatorSvg = asfxRenderIndicatorSvg(asfxPlan, min, max, padT, chartH, w, padL, padR);
    asfxSyncSignalTabFromIndicator(asfxPlan);
    const tagColor = down ? "#ef4444" : "#2563eb";
    const lineColor = down ? "rgba(239,68,68,.82)" : "rgba(96,165,250,.86)";

    return `
      <svg class="asfx-room-chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs>
          <clipPath id="asfxChartClipV1">
            <rect x="${padL}" y="${padT}" width="${chartW}" height="${chartH}" rx="0"/>
          </clipPath>
        </defs>
        <defs>
          <linearGradient id="asfxStandaloneBg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#0f172a" stop-opacity=".72"/>
            <stop offset="100%" stop-color="#020617" stop-opacity=".72"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="url(#asfxStandaloneBg)" rx="24"/>
        ${grid}
        ${vgrid}
        ${priceScale}
        <text x="${padL}" y="28" fill="#93c5fd" font-size="13" font-weight="900">${safe(pair)}  -  ${safe(tf)}</text>
        <g clip-path="url(#asfxChartClipV1)">${candleSvg}</g>
        ${asfxIndicatorSvg}
        ${asfxChartCountdownSvgV1B}
        <line x1="${padL}" y1="${lastY}" x2="${w-padR+8}" y2="${lastY}" stroke="${lineColor}" stroke-dasharray="3 5" stroke-width="2"/>
        <rect x="${w-padR+8}" y="${lastY-25}" width="${padR-12}" height="50" rx="8" fill="${tagColor}" opacity=".72"/>
        <text x="${w-padR+16}" y="${lastY-5}" fill="#fff" font-size="12" font-weight="950">${fmt(last.c)}</text>

      </svg>
    `;
  }

  function updateStrip(){
    const b = box();
    if (!b || !candles.length) return;

    let strip = document.querySelector(".asfx-chart-info-strip");
    if (!strip) {
      b.insertAdjacentHTML("afterend", `<div class="asfx-chart-info-strip"></div>`);
      strip = document.querySelector(".asfx-chart-info-strip");
    }

    const recent = candles.slice(-80);
    const last = recent[recent.length - 1];
    const high = Math.max(...recent.map(c => Number(c.h || 0)));
    const low = Math.min(...recent.map(c => Number(c.l || last.l)));
    const p = Number(last.c);
    const cls = lastPrice === null || p >= lastPrice ? "asfx-price-up" : "asfx-price-down";
    lastPrice = p;

    strip.innerHTML = `
      <div>
        <small>Price</small>
        <b class="${cls}">${fmt(p)}</b>
        <em>${leftText()}</em>
      </div>
      <div>
        <small>High</small>
        <b>${fmt(high)}</b>
      </div>
      <div>
        <small>Low</small>
        <b>${fmt(low)}</b>
      </div>
      <div>
        <small>Status</small>
        <b class="asfx-price-up"> Live</b>
      </div>
    `;
  }

  function render(){
    const b = box();
    if (!b) return;

    b.innerHTML = chartSvg();
    updateStrip();
  }

  async function tick(){
    if (!isDetailOpen()) return;
    if (busy) return;

    busy = true;

    try {
      const nowCtx = ctx();
      const nowKey = `${nowCtx.pair}_${nowCtx.tf}`;

      if (lastCtxKey !== nowKey) {
        candles = [];
        lastLoad = 0;
        lastCtxKey = nowKey;
      }

      if (!candles.length || Date.now() - lastLoad > 12000) {
        await loadKlines();
      }

      const { pair } = ctx();
      const priceJson = await getJson(`${BASE}/ticker/price?symbol=${encodeURIComponent(pair)}`);
      const live = Number(priceJson.price);

      if (!Number.isFinite(live)) throw new Error("bad price");

      const last = candles[candles.length - 1];
      last.c = live;
      last.h = Math.max(Number(last.h || live), live);
      last.l = Math.min(Number(last.l || live), live);
      asfxExportDetailCandlesV4();
      render();
      ensureWorkspace("LIVE");
      
      // FORCE TICKER: Paksa suplai harga live ke semua objek global dan jalankan pembaruan detikan tab aktif
      if (window.__ASFX_FINAL_SIGNAL_PACKET_V5__) {
        window.__ASFX_FINAL_SIGNAL_PACKET_V5__.price = live;
        window.__ASFX_FINAL_SIGNAL_PACKET_V5__.currentPrice = live;
      }
      if (window.__ASFX_LAST_SMZ_ANALYSIS__) {
        window.__ASFX_LAST_SMZ_ANALYSIS__.price = live;
        window.__ASFX_LAST_SMZ_ANALYSIS__.currentPrice = live;
      }
      // GLOBAL REPAINT TRIGGER: Paksa seluruh modul layar tab untuk ikut berdetak live setiap detik
      if (window.ASFXPacketUiAuthorityV5?.paint) window.ASFXPacketUiAuthorityV5.paint();
      if (window.ASFXSignalFreshnessValidityGuardV1?.paint) window.ASFXSignalFreshnessValidityGuardV1.paint();
    } catch(e) {
      console.warn("Standalone scanner live wait:", e.message);
      ensureWorkspace("WAIT");
    } finally {
      busy = false;
    }
  }

  function timer(){
    if (!isDetailOpen()) return;
    ensureWorkspace(status);
  }

  setInterval(timer, 1000);
  setInterval(tick, 1000);

  function normalizeTfLabel(raw){
    const value = String(raw || "").trim().toLowerCase();
    const map = {
      "1m":"1m",
      "5m":"5m",
      "15m":"15m",
      "30m":"30m",
      "1h":"1h",
      "4h":"4h",
      "1d":"1d",
      "1w":"1w"
    };
    return map[value] || "";
  }

  function displayTf(tf){
    return String(tf || "15m")
      .replace("h", "H")
      .replace("d", "D")
      .replace("w", "W");
  }

  function setDetailTimeframe(tf){
    const title = document.querySelector(".asfx-detail-title h2");
    const current = ctx();

    if (title) {
      title.textContent = `${current.pair}  -  ${displayTf(tf)}`;
    }

    candles = [];
    lastLoad = 0;
    lastCtxKey = "";
    status = "WAIT";

    document.querySelectorAll(".asfx-detail-room button:not([data-detail-tab])").forEach((btn) => {
      const btnTf = normalizeTfLabel(btn.textContent);
      if (btnTf) btn.classList.toggle("active", btnTf === tf);
    });

    ensureWorkspace("WAIT");

    const b = box();
    if (b) {
      b.innerHTML = `<div class="asfx-chart-empty">Loading ${current.pair} ${displayTf(tf)} candles...</div>`;
    }

    setTimeout(tick, 120);
  }

  document.addEventListener("click", (event) => {
    const tfButton = event.target.closest(".asfx-detail-room button:not([data-detail-tab])");
    const tf = normalizeTfLabel(tfButton ? tfButton.textContent : "");

    if (tf) {
      event.preventDefault();
      setDetailTimeframe(tf);
      return;
    }

    setTimeout(tick, 250);
  }, true);

  // FIX: Global MutationObserver dihapus total untuk mencegah infinite render loop yang membuat UI freeze.
  // Sinkronisasi chart live kini sepenuhnya ditangani oleh seft-interval dan click event listener secara aman.

  setTimeout(tick, 700);
})();


/* SCANNER_DETAIL_BRIDGE_V1 */
(function scannerDetailBridgeV1(){
  if (document.getElementById("asfx-scanner-bridge-v1")) return;

  const style = document.createElement("style");
  style.id = "asfx-scanner-bridge-v1";
  style.textContent = `
    .asfx-bridge-wrap {
      display: grid;
      gap: 12px;
      padding: 2px 0;
    }

    .asfx-bridge-head {
      border: 1px solid rgba(96,165,250,.20);
      background: linear-gradient(135deg, rgba(15,23,42,.92), rgba(37,99,235,.14));
      border-radius: 20px;
      padding: 14px;
    }

    .asfx-bridge-kicker {
      color: #38bdf8;
      font-size: 10px;
      letter-spacing: .18em;
      text-transform: uppercase;
      font-weight: 900;
      margin-bottom: 6px;
    }

    .asfx-bridge-title {
      color: #fff;
      font-size: 22px;
      font-weight: 950;
      line-height: 1.1;
    }

    .asfx-bridge-sub {
      color: #94a3b8;
      font-size: 12px;
      margin-top: 5px;
      line-height: 1.45;
    }

    .asfx-bridge-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .asfx-bridge-mini {
      border: 1px solid rgba(148,163,184,.18);
      background: rgba(15,23,42,.82);
      border-radius: 16px;
      padding: 11px;
      min-height: 78px;
    }

    .asfx-bridge-mini small {
      display: block;
      color: #94a3b8;
      font-size: 10px;
      margin-bottom: 5px;
    }

    .asfx-bridge-mini b {
      display: block;
      color: #fff;
      font-size: 15px;
      line-height: 1.1;
      overflow-wrap: anywhere;
    }

    .asfx-bridge-buy { color: #22c55e !important; }
    .asfx-bridge-sell { color: #ef4444 !important; }
    .asfx-bridge-wait { color: #facc15 !important; }

    .asfx-bridge-box {
      border: 1px solid rgba(96,165,250,.18);
      background: rgba(2,6,23,.55);
      border-radius: 18px;
      padding: 13px;
      color: #cbd5e1;
      font-size: 12px;
      line-height: 1.55;
    }

    .asfx-bridge-lock {
      border: 1px solid rgba(250,204,21,.22);
      background: linear-gradient(135deg, rgba(250,204,21,.10), rgba(15,23,42,.78));
      border-radius: 18px;
      padding: 13px;
      color: #e5e7eb;
      font-size: 12px;
      line-height: 1.55;
    }
  `;
  document.head.appendChild(style);

  function text(){
    return document.body ? document.body.innerText || "" : "";
  }

  function clean(v, fallback){
    return String(v || fallback || "").replace(/[<>]/g, "").trim();
  }

  function ctx(){
    const title = document.querySelector(".asfx-detail-title h2")?.textContent || "BTCUSDT  -  15m";
    const pair = (title.match(/([A-Z0-9]{5,20})/) || [,"BTCUSDT"])[1];
    const tf = (title.match(/(1m|3m|5m|15m|30m|1h|4h|1d|1w)/i) || [,"15m"])[1];

    return {
      pair: pair.toUpperCase(),
      tf: tf.toLowerCase()
    };
  }

  function readSignal(){
    const body = text();

    const biasMatch = body.match(/\b(BUY|SELL|WAIT)\b/i);
    const confMatch = body.match(/Confidence\s+(\d+%)/i);
    const riskMatch = body.match(/Risk\s+(Low|Medium|High)/i);
    const setupMatch = body.match(/Focus Setup\s+([^\n]+)/i);

    const price =
      document.querySelector(".asfx-chart-info-strip b")?.textContent ||
      body.match(/BTCUSDT\s+([\d,.]+)/i)?.[1] ||
      "Live";

    const bias = clean(biasMatch?.[1], "LIVE").toUpperCase();

    return {
      ...ctx(),
      price: clean(price, "Live"),
      bias,
      confidence: clean(confMatch?.[1], "Live"),
      risk: clean(riskMatch?.[1], "Medium"),
      setup: clean(setupMatch?.[1], "Pullback pressure")
    };
  }

  function biasClass(bias){
    if (bias === "BUY") return "asfx-bridge-buy";
    if (bias === "SELL") return "asfx-bridge-sell";
    return "asfx-bridge-wait";
  }

  function panel(){
    return document.querySelector("[data-detail-panel]");
  }

  function activeTab(){
    return document.querySelector("[data-detail-tab].active")?.dataset?.detailTab || "chart";
  }

  
  /* ASFX_READSMZ_HYBRID_V1 */
  /* ASFX_READSMZ_HYBRID_WORDING_V1_1 */
  function asfxReadSmzHybridV1(raw){
    const next = Object.assign({}, raw || {});

    const text = (v, fb = "") => (v === undefined || v === null || v === "") ? fb : String(v).trim();
    const num = (v) => {
      const n = Number(String(v || "").replace(/[,%]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };

    const parseZone = (v) => {
      const nums = String(v || "").match(/\d[\d,]*(?:\.\d+)?/g);
      if (!nums || nums.length < 2) return null;

      const a = Number(nums[0].replace(/,/g, ""));
      const b = Number(nums[1].replace(/,/g, ""));
      if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

      return { low: Math.min(a, b), high: Math.max(a, b) };
    };

    const price = num(next.currentPrice || next.price || next.livePrice);
    const demand = parseZone(next.demandZone);
    const supply = parseZone(next.supplyZone);

    const bias = text(next.bias, "WAIT").toUpperCase();
    const risk = text(next.risk, "Medium");
    const structure = text(next.structure, "");
    const oldStatus = text(next.signalStatus || next.zoneState || next.zone, "Waiting Zone");

    const distToZone = (zone) => {
      if (!price || !zone) return Infinity;
      if (price >= zone.low && price <= zone.high) return 0;
      return Math.min(Math.abs(price - zone.low), Math.abs(price - zone.high));
    };

    const demandDist = distToZone(demand);
    const supplyDist = distToZone(supply);
    const range = demand && supply ? Math.max(supply.high - demand.low, 1) : Math.max(price * 0.004, 1);

    /* ASFX_ZONE_PRIORITY_FIX_V1 */
    const insideDemand = demand && price >= demand.low && price <= demand.high;
    const insideSupply = supply && price >= supply.low && price <= supply.high;

    // Prioritas wajib pakai posisi harga asli, bukan teks status lama.
    // Kalau harga masuk supply/resistance, jangan kebaca support hanya karena oldStatus masih berisi Demand.
    const nearSupply = insideSupply || (!insideDemand && supplyDist <= range * 0.18 && supplyDist <= demandDist);
    const nearDemand = insideDemand || (!insideSupply && demandDist <= range * 0.18 && demandDist < supplyDist);

    const middleRange =
      demand && supply &&
      price > demand.high &&
      price < supply.low &&
      demandDist > range * 0.22 &&
      supplyDist > range * 0.22;

    const step = price >= 10000 ? 500 : price >= 1000 ? 100 : price >= 100 ? 10 : price >= 10 ? 1 : 0.1;
    const brnLevel = price ? Math.round(price / step) * step : 0;
    const nearBrn = price ? Math.abs(price - brnLevel) / price * 100 <= 0.12 : false;

    let signalStatus = oldStatus;
    let setupType = text(next.setupType, oldStatus);
    let detail = text(next.statusDetail || next.reason, "Menunggu candle dan struktur lebih bersih.");

    if (/high/i.test(risk)) {
      signalStatus = "Risk Watch";
      setupType = "Overtrade Guard";
      detail = "Overtrade Guard: risk sedang tinggi. Sistem menahan entry agresif.";
    } else if (middleRange) {
      signalStatus = "No Trade";
      setupType = "Middle Range No Trade";
      next.bias = "WAIT";
      detail = "Middle Range No Trade: harga berada di tengah range support-resistance. Sistem menahan entry untuk menghindari overtrade.";
    } else if (nearDemand && bias === "SELL") {
      /* ASFX_RISK_GUARD_WORDING_CONFLICT_FIX_V5 */
      signalStatus = "Zone Conflict";
      setupType = "Demand Conflict Watch";
      next.bias = "WAIT";
      detail = "SELL bias terdeteksi, tetapi harga berada dekat demand/support. Jangan SELL langsung ke support. Tunggu breakdown bersih lalu retest sebelum SELL valid.";
    } else if (nearSupply && bias === "BUY") {
      signalStatus = "Zone Conflict";
      setupType = "Supply Conflict Watch";
      next.bias = "WAIT";
      detail = "BUY bias terdeteksi, tetapi harga berada dekat supply/resistance. Jangan BUY langsung ke resistance. Tunggu breakout bersih lalu retest sebelum BUY valid.";
    } else if (nearDemand) {
      signalStatus = "Support Reaction";
      setupType = "Support Reaction Watch";
      detail = "Support Reaction Watch: harga dekat area support/demand. BUY belum final; tunggu rejection atau bullish confirmation.";
    } else if (nearSupply) {
      signalStatus = "Resistance Reaction";
      setupType = "Resistance Rejection Watch";
      detail = "Resistance Rejection Watch: harga dekat area resistance/supply. SELL belum final; tunggu rejection atau bearish confirmation.";
    } else if (nearBrn) {
      signalStatus = "BRN Watch";
      setupType = "BRN Area Watch";
      detail = "BRN Area Watch: harga dekat round number. Rawan reaksi, sweep, atau fakeout.";
    } else if (/mixed|range|corrective/i.test(structure)) {
      signalStatus = "Range Watch";
      setupType = "Range Scalping Watch";
      detail = "Market mixed/ranging. Fokus hanya area support/resistance.";
    }

    /* ASFX_SIGNAL_PACKET_CONTRACT_FIX_V1 */
    const priceInsideDemand = demand && price >= demand.low && price <= demand.high;
    const priceInsideSupply = supply && price >= supply.low && price <= supply.high;
    const priceAboveSupply = supply && price > supply.high;
    const priceBelowDemand = demand && price < demand.low;

    // Harga asli harus menang dari status lama.
    // Jika price sudah masuk supply/resistance, jangan tampil Support/Demand hanya karena packet lama masih menyimpan Demand.
    if (priceInsideSupply) {
      signalStatus = "Resistance Reaction";
      setupType = "Resistance / Supply Reaction Watch";
      next.bias = bias === "BUY" ? "WAIT" : "SELL";
      next.activeZone = `Supply ${text(next.supplyZone, "zone")}`;
      next.zone = next.activeZone;
      next.zoneState = signalStatus;
      detail = bias === "BUY"
        ? "Harga masuk area supply/resistance. BUY ditahan dulu; tunggu breakout valid + pullback, atau rejection bearish untuk SELL watch."
        : "Harga masuk area supply/resistance. Tunggu rejection candle atau bearish confirmation sebelum validasi SELL.";
    } else if (priceInsideDemand) {
      signalStatus = "Support Reaction";
      setupType = "Support / Demand Reaction Watch";
      next.bias = bias === "SELL" ? "WAIT" : "BUY";
      next.activeZone = `Demand ${text(next.demandZone, "zone")}`;
      next.zone = next.activeZone;
      next.zoneState = signalStatus;
      detail = bias === "SELL"
        ? "Harga masuk area demand/support. SELL ditahan dulu; tunggu breakdown valid + pullback, atau rejection bullish untuk BUY watch."
        : "Harga masuk area demand/support. Tunggu rejection candle atau bullish confirmation sebelum validasi BUY.";
    } else if (priceAboveSupply) {
      signalStatus = "Breakout Watch";
      setupType = "RBS Pullback Watch";
      next.bias = "BUY";
      next.activeZone = `Supply breakout ${text(next.supplyZone, "zone")}`;
      next.zone = next.activeZone;
      next.zoneState = signalStatus;
      detail = "Harga sudah di atas supply/resistance. Jangan FOMO; tunggu pullback/retest agar area lama bisa valid sebagai RBS.";
    } else if (priceBelowDemand) {
      signalStatus = "Breakdown Watch";
      setupType = "SBR Retest Watch";
      next.bias = "SELL";
      next.activeZone = `Demand breakdown ${text(next.demandZone, "zone")}`;
      next.zone = next.activeZone;
      next.zoneState = signalStatus;
      detail = "Harga sudah di bawah demand/support. Jangan FOMO; tunggu pullback/retest agar area lama bisa valid sebagai SBR.";
    }

    next.signalStatus = signalStatus;
    next.status = signalStatus;
    next.zoneState = signalStatus;
    next.setupType = setupType;
    next.signalStatusLabel = setupType;
    next.statusDetail = detail;
    next.reason = detail;
    next.hybridMode = "ASFX_READSMZ_HYBRID_WORDING_V1_1";

    return next;
  }

  function readSmz(){
    return asfxReadSmzHybridV1(window.__ASFX_LAST_SMZ_ANALYSIS__ || {});
  }

  function smzText(v, fallback = "Waiting confirmation"){
    return v || fallback;
  }

  
  function signalPlanReadiness(d, smz){
    const bias = String(d.bias || "WAIT").toUpperCase();
    const risk = String(d.risk || smz.risk || "Medium");
    const status = String(smz.signalStatus || "Waiting Zone");
    const structure = String(smz.structure || "");
    const zone = String(smz.zoneState || "");
    const liquidity = String(smz.liquidity || "");
    const imbalance = String(smz.imbalance || "");

    let score = 0;
    if (bias !== "WAIT") score += 20;
    if (risk !== "High") score += 15;
    if (/bullish|bearish/i.test(structure)) score += 20;
    if (/demand|supply/i.test(zone)) score += 20;
    if (/sweep/i.test(liquidity)) score += 10;
    if (/imbalance|fvg/i.test(imbalance)) score += 10;
    if (/conflict|invalid/i.test(status)) score -= 30;

    score = Math.max(0, Math.min(95, score));

    if (/conflict|invalid/i.test(status)) {
      return { label: "Invalid / Conflict", score, note: "Struktur dan bias belum selaras. Signal plan belum aman." };
    }

    if (score >= 70) {
      return { label: "Signal Preview", score, note: "Konteks mulai mendukung. Tetap tunggu candle confirmation sebelum eksekusi." };
    }

    if (score >= 50) {
      return { label: "Almost Ready", score, note: "Setup mulai terbentuk, tapi validasi zona dan candle reaction belum lengkap." };
    }

    if (/demand|supply/i.test(zone)) {
      return { label: "Zone Touched", score, note: "Harga mendekati zona penting. Tunggu reaksi candle yang bersih." };
    }

    return { label: "Waiting Zone", score, note: "Belum ada setup final. Tunggu harga masuk zona valid." };
  }

  function signalChecklistHtml(d, smz){
    const items = [
      ["Bias", String(d.bias || "WAIT").toUpperCase() !== "WAIT" ? d.bias : "WAIT"],
      ["Structure", smzText(smz.structure, "Waiting")],
      ["Zone", smzText(smz.zoneState, "Waiting Zone")],
      ["Liquidity", smzText(smz.liquidity, "Waiting")],
      ["Imbalance/FVG", smzText(smz.imbalance, "Waiting")],
      ["Risk", d.risk || smz.risk || "Medium"],
    ];

    return items.map(([label, value]) => `
      <div class="asfx-bridge-mini">
        <small>${label}</small>
        <b>${value}</b>
      </div>
    `).join("");
  }

  /* ASFX_COMPACT_SIGNAL_ROOM_PANEL_V2 */
/* ASFX_SIGNAL_ROOM_UI_V4 */

/* ASFX_SCANNER_CORE_FINISH_V1 */
window.asfxCoreStatusV1 = window.asfxCoreStatusV1 || function(payload = {}) {
  const raw = [
    payload.signalStatus,
    payload.actionStatus,
    payload.status,
    payload.setupType,
    payload.reason,
    payload.statusDetail
  ].filter(Boolean).join(" ").toLowerCase();

  const bias = String(payload.bias || "WAIT").toUpperCase();
  const risk = String(payload.risk || "Medium").toLowerCase();

  if (/invalid|expired|stale|sl hit|stop loss hit/i.test(raw)) return "INVALID";
  if (/signal active/i.test(raw) && bias !== "WAIT" && !risk.includes("high")) return "SIGNAL ACTIVE";
  if (window.asfxSignalActiveTriggerV1 && window.asfxSignalActiveTriggerV1(payload)) return "SIGNAL ACTIVE";
  if (/no trade|middle range/i.test(raw) || bias === "WAIT") return "NO TRADE";
  if (/zone touched|zone watch|waiting zone|demand watch|supply watch|touched/i.test(raw)) return "ZONE WATCH";
  if (/setup watch|risk watch|risk alert|observation|waiting/i.test(raw)) return "SETUP WATCH";

  return bias === "BUY" || bias === "SELL" ? "SETUP WATCH" : "NO TRADE";
};


/* ASFX_SIGNAL_ACTIVE_TRIGGER_V1 */

/* ASFX_ZONE_TOUCH_DETECTOR_V1 */
window.asfxNumberFromTextV1 = window.asfxNumberFromTextV1 || function(value) {
  const match = String(value || "").match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

window.asfxRangeFromTextV1 = window.asfxRangeFromTextV1 || function(value) {
  const nums = String(value || "")
    .match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/g);

  if (!nums || nums.length < 2) return null;

  const parsed = nums
    .map((n) => Number(String(n).replace(/,/g, "")))
    .filter(Number.isFinite);

  if (parsed.length < 2) return null;

  return {
    low: Math.min(parsed[0], parsed[1]),
    high: Math.max(parsed[0], parsed[1])
  };
};

window.asfxCurrentPriceV1 = window.asfxCurrentPriceV1 || function(payload = {}) {
  const direct =
    payload.price ||
    payload.currentPrice ||
    payload.livePrice ||
    payload.lastPrice ||
    "";

  let price = window.asfxNumberFromTextV1(direct);
  if (Number.isFinite(price)) return price;

  const body = document.body ? document.body.innerText || "" : "";
  const currentMatch =
    body.match(/Current price\s*:\s*([\d,.]+)/i) ||
    body.match(/Price at signal\s*:\s*([\d,.]+)/i);

  price = window.asfxNumberFromTextV1(currentMatch ? currentMatch[1] : "");
  return Number.isFinite(price) ? price : null;
};

window.asfxZoneTouchedV1 = window.asfxZoneTouchedV1 || function(payload = {}) {
  const zoneText =
    payload.activeZone ||
    payload.entryZone ||
    payload.zone ||
    payload.zoneState ||
    "";

  const range = window.asfxRangeFromTextV1(zoneText);
  const price = window.asfxCurrentPriceV1(payload);

  if (!range || !Number.isFinite(price)) return false;

  return price >= range.low && price <= range.high;
};

window.asfxSignalActiveTriggerV1 = window.asfxSignalActiveTriggerV1 || function(payload = {}) {
  const raw = [
    payload.signalStatus,
    payload.actionStatus,
    payload.status,
    payload.setupType,
    payload.reason,
    payload.statusDetail,
    payload.activeZone,
    payload.entryZone
  ].filter(Boolean).join(" ").toLowerCase();

  const bias = String(payload.bias || "WAIT").toUpperCase();
  const risk = String(payload.risk || "Medium").toLowerCase();
  const confidence = Number(String(payload.confidence || "0").replace(/[^0-9.]/g, "")) || 0;
  const zone = String(payload.activeZone || payload.entryZone || payload.zone || "").toLowerCase();

  const hasSide = bias === "BUY" || bias === "SELL";
  const riskOk = !risk.includes("high");
  const confidenceOk = confidence >= 65;
  const zoneOk = zone && !/waiting|pending|calculating|invalid|none|-/.test(zone);
  const touched =
    /zone touched|touched|signal active/i.test(raw) ||
    (window.asfxZoneTouchedV1 && window.asfxZoneTouchedV1(payload));
  const blocked = /no trade|middle range|invalid|stale|expired|risk alert|risk watch/i.test(raw);

  return hasSide && riskOk && confidenceOk && zoneOk && touched && !blocked;
};

window.asfxCanExecuteV1 = window.asfxCanExecuteV1 || function(status) {
  return status === "SIGNAL ACTIVE";
};

function signalHtml(d){
  const smz = readSmz();
  const readiness = smz.readiness || d.readiness || {};

  const pair = smzText(d.pair || d.symbol || smz.pair || smz.symbol, "Market");
  const tf = smzText(d.tf || d.timeframe || smz.tf || smz.timeframe, "15m");

  const bias = smzText(smz.bias || d.bias, "WAIT").toUpperCase();
  const risk = smzText(smz.risk || d.risk, "Medium");
  const confidenceRaw = smzText(smz.confidence || d.confidence || readiness.score, "0");
  const confidenceNum = Number(String(confidenceRaw).replace(/[^0-9.]/g, "")) || 0;
  const confidence = String(confidenceRaw).replace(/%/g, "");

  const setup = smzText(smz.signalStatusLabel || smz.setupType || smz.signalStatus || readiness.label, "Market Observation");
  const action = smzText(smz.actionStatus || smz.signalStatus || "Observation", "Observation");

  const activeZone = smzText(smz.activeZone || smz.zoneState || smz.zone, "Waiting valid zone");
  const entryRaw = smzText(smz.entryZone || smz.activeZone || smz.zoneState || smz.zone, "Waiting valid zone");

  const demand = smzText(smz.demandZone, "Calculating");
  const supply = smzText(smz.supplyZone, "Calculating");
  const distance = smzText(smz.distanceToZoneText, "Waiting distance");

  const slRaw = smzText(smz.stopLossGuide || smz.slGuide, "Waiting invalidation level");
  const tp1Raw = smzText(smz.tp1Guide, "Waiting target area");
  const tp2Raw = smzText(smz.tp2Guide, "Waiting extended target");

  const structure = smzText(smz.structure, "Reading");
  const liquidity = smzText(smz.liquidity, "Waiting");
  const imbalance = smzText(smz.imbalance, "Waiting");
  const reason = smzText(smz.statusDetail || smz.reason, "Market context is still being calculated.");

  const isWaiting = (value) => /waiting|calculating|menunggu|observation|belum|tunggu|pending|none|-$/i.test(String(value || "").trim());
  const hasZone = !isWaiting(activeZone) && activeZone !== "-";
  const hasEntry = !isWaiting(entryRaw) && entryRaw !== "-";

  const isBuy = bias.includes("BUY") || bias.includes("BULL");
  const isSell = bias.includes("SELL") || bias.includes("BEAR");
  const side = isSell ? "SELL" : isBuy ? "BUY" : "WAIT";

  const rawSeed = [
    setup,
    action,
    activeZone,
    entryRaw,
    reason,
    smz.signalStatus,
    smz.actionStatus,
    smz.status,
    d.signalStatus,
    d.actionStatus,
    d.status
  ].filter(Boolean).join(" ").toLowerCase();

  const isHighRisk = String(risk).toLowerCase().includes("high") || rawSeed.includes("overtrade");
  const blocked = /no trade|middle range|invalid|stale|expired|risk alert|risk watch/i.test(rawSeed);

  const normalizedStatus = typeof window.asfxCoreStatusV1 === "function"
    ? window.asfxCoreStatusV1({
        signalStatus: smz.signalStatus || d.signalStatus,
        actionStatus: smz.actionStatus || d.actionStatus,
        status: smz.status || d.status,
        setupType: setup,
        statusDetail: reason,
        reason,
        bias,
        risk,
        confidence,
        activeZone,
        entryZone: entryRaw,
        price: d.price || d.currentPrice || d.livePrice || smz.price || smz.currentPrice || ""
      })
    : "NO TRADE";

  const signalActive =
    normalizedStatus === "SIGNAL ACTIVE" ||
    /signal active/i.test(rawSeed);

  const canExecute =
    typeof window.asfxCanExecuteV1 === "function"
      ? window.asfxCanExecuteV1(normalizedStatus)
      : signalActive;

  let engineStatus = "NO TRADE";
  let engineNote = "Tidak ada eksekusi. Harga belum berada di zona valid.";

  if (blocked || side === "WAIT") {
    engineStatus = "NO TRADE";
    engineNote = "Sistem menahan entry karena struktur belum valid atau area terlalu lemah.";
  } else if (signalActive && canExecute && hasEntry && !isHighRisk && confidenceNum >= 65 && side === "BUY") {
    engineStatus = "OFFICIAL BUY";
    engineNote = "Signal aktif. Eksekusi hanya di dalam entry zone.";
  } else if (signalActive && canExecute && hasEntry && !isHighRisk && confidenceNum >= 65 && side === "SELL") {
    engineStatus = "OFFICIAL SELL";
    engineNote = "Signal aktif. Eksekusi hanya di dalam entry zone.";
  } else if (hasZone && (isBuy || isSell)) {
    engineStatus = "ZONE WATCH";
    engineNote = "Zona terbaca. Tunggu status Signal Active sebelum entry.";
  } else if (isBuy || isSell) {
    engineStatus = "SETUP WATCH";
    engineNote = "Bias terbaca, tapi zona eksekusi belum siap.";
  }

  if (isHighRisk && engineStatus !== "NO TRADE") {
    engineStatus = "SETUP WATCH";
    engineNote = "Setup terbaca, tapi risk masih tinggi. Jangan entry paksa.";
  }

  const showExecutionPlan = engineStatus === "OFFICIAL BUY" || engineStatus === "OFFICIAL SELL";
  const titleClass = showExecutionPlan ? biasClass(side) : "";

  const displayEntry = showExecutionPlan ? entryRaw : "Pending - watch zone only";
  const displaySl = showExecutionPlan ? slRaw : "Pending - waiting Signal Active";
  const displayTp1 = showExecutionPlan ? tp1Raw : "Pending - waiting Signal Active";
  const displayTp2 = showExecutionPlan ? tp2Raw : "Pending - waiting Signal Active";

  const validity = showExecutionPlan
    ? "Fresh / Active"
    : engineStatus === "NO TRADE"
      ? "No Trade"
      : "Waiting Validation";

  const planLabel = showExecutionPlan ? "Execution Plan" : "Watch Plan";

  return `
    <div class="asfx-bridge-wrap" data-asfx-bridge-rendered="signal">
      <div class="asfx-bridge-head">
        <div class="asfx-bridge-kicker">AiSignal Engine</div>
        <div class="asfx-bridge-title ${titleClass}">${engineStatus}</div>
        <div class="asfx-bridge-sub">${pair} | ${tf} | ${bias} Bias | ${risk} Risk | ${confidence}%</div>
      </div>

      <div class="asfx-bridge-box" style="border-color:rgba(56,189,248,.28);background:linear-gradient(135deg,rgba(2,6,23,.82),rgba(14,165,233,.10));">
        <div style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#38bdf8;font-weight:950;margin-bottom:8px;">Scanner Decision</div>
        <div class="asfx-bridge-grid">
          <div class="asfx-bridge-mini"><small>Status</small><b>${engineStatus}</b></div>
          <div class="asfx-bridge-mini"><small>Zone</small><b>${activeZone}</b></div>
          <div class="asfx-bridge-mini"><small>Validity</small><b>${validity}</b></div>
        </div>
      </div>

      <div class="asfx-bridge-box">
        <small>${planLabel}</small><br>
        <b style="color:#fff;font-size:18px;">${displayEntry}</b><br>
        <span style="opacity:.78;">${engineNote}</span>
      </div>

      <div class="asfx-bridge-grid">
        <div class="asfx-bridge-mini">
          <small>SL</small>
          <b>${displaySl}</b>
        </div>
        <div class="asfx-bridge-mini">
          <small>TP1</small>
          <b>${displayTp1}</b>
        </div>
        <div class="asfx-bridge-mini">
          <small>TP2</small>
          <b>${displayTp2}</b>
        </div>
      </div>

      <div class="asfx-bridge-grid">
        <div class="asfx-bridge-mini">
          <small>Setup</small>
          <b>${setup}</b>
        </div>
        <div class="asfx-bridge-mini">
          <small>Distance</small>
          <b>${distance}</b>
        </div>
        <div class="asfx-bridge-mini">
          <small>Confidence</small>
          <b>${confidence}%</b>
        </div>
      </div>

      <details class="asfx-bridge-box">
        <summary style="cursor:pointer;color:#fff;font-weight:900;">Technical Detail</summary>
        <br>
        Demand: <b style="color:#fff;">${demand}</b><br>
        Supply: <b style="color:#fff;">${supply}</b><br>
        Structure: <b style="color:#fff;">${structure}</b><br>
        Liquidity: <b style="color:#fff;">${liquidity}</b><br>
        FVG / Imbalance: <b style="color:#fff;">${imbalance}</b><br>
        Reason: <b style="color:#fff;">${reason}</b>
      </details>

      <div class="asfx-bridge-lock">Educational analysis only. Execution remains user responsibility.</div>
    </div>
  `;
}
function riskHtml(d){
  const smz = readSmz();

  const bias = smzText(smz.bias || d.bias, "WAIT").toUpperCase();
  const risk = smzText(smz.risk || d.risk, "Medium");
  const confidence = String(smzText(smz.confidence || d.confidence, "0")).replace(/%/g, "");
  const setup = smzText(smz.signalStatusLabel || smz.setupType || smz.signalStatus || smz.zoneState, "Market Observation");

  const demand = smzText(smz.demandZone, "Calculating");
  const supply = smzText(smz.supplyZone, "Calculating");
  const activeZone = smzText(smz.activeZone || smz.zoneState || smz.zone, "Waiting valid zone");
  const distance = smzText(smz.distanceToZoneText, "Waiting distance");
  const invalidation = smzText(smz.invalidationLevel || smz.stopLossGuide || smz.slGuide, "Waiting invalidation level");

  const lower = `${setup} ${activeZone} ${smz.statusDetail || ""}`.toLowerCase();

  let guard = "SETUP WATCH";
  let guardNote = "Risk Guard membaca keamanan area. Eksekusi utama tetap mengikuti Signal tab.";
  let safety = "Standard";

  if (lower.includes("middle range") || lower.includes("no trade")) {
    guard = "NO TRADE AREA";
    guardNote = "Harga berada di area lemah. Hindari entry paksa sampai harga kembali ke zona valid.";
    safety = "Protected";
  } else if (lower.includes("overtrade") || lower.includes("risk")) {
    guard = "RISK WATCH";
    guardNote = "Risk sedang naik. Gunakan ukuran lot lebih kecil atau tunggu area lebih bersih.";
    safety = "Caution";
  } else if (lower.includes("support") || lower.includes("demand")) {
    guard = "SUPPORT GUARD";
    guardNote = "Area support/demand aktif. BUY hanya valid jika Signal tab memberi eksekusi jelas.";
    safety = "Zone Valid";
  } else if (lower.includes("resistance") || lower.includes("supply")) {
    guard = "RESISTANCE GUARD";
    guardNote = "Area resistance/supply aktif. SELL hanya valid jika Signal tab memberi eksekusi jelas.";
    safety = "Zone Valid";
  } else if (lower.includes("brn")) {
    guard = "BRN WATCH";
    guardNote = "Harga dekat round number. Waspadai sweep, fakeout, dan candle spike.";
    safety = "Watch";
  }

  return `
    <div class="asfx-bridge-wrap" data-asfx-bridge-rendered="risk">
      <div class="asfx-bridge-head">
        <div class="asfx-bridge-kicker">Risk Dashboard</div>
        <div class="asfx-bridge-title">${guard}</div>
        <div class="asfx-bridge-sub">${d.pair} | ${d.tf} | ${bias} Bias | ${risk} Risk | ${confidence}%</div>
      </div>

      <div class="asfx-bridge-grid">
        <div class="asfx-bridge-mini">
          <small>Risk Tier</small>
          <b>${risk}</b>
        </div>
        <div class="asfx-bridge-mini">
          <small>Safety</small>
          <b>${safety}</b>
        </div>
        <div class="asfx-bridge-mini">
          <small>Score</small>
          <b>${confidence}%</b>
        </div>
      </div>

      <div class="asfx-bridge-box">
        <b style="color:#fff;">Risk Reading</b><br>
        ${guardNote}
      </div>

      <div class="asfx-bridge-grid">
        <div class="asfx-bridge-mini">
          <small>Active Zone</small>
          <b>${activeZone}</b>
        </div>
        <div class="asfx-bridge-mini">
          <small>Distance</small>
          <b>${distance}</b>
        </div>
        <div class="asfx-bridge-mini">
          <small>Invalidation</small>
          <b>${invalidation}</b>
        </div>
      </div>

      <details class="asfx-bridge-box">
        <summary style="cursor:pointer;color:#fff;font-weight:900;">Zone Context</summary>
        <br>
        Demand: <b style="color:#fff;">${demand}</b><br>
        Supply: <b style="color:#fff;">${supply}</b><br>
        Setup: <b style="color:#fff;">${setup}</b>
      </details>

      <div class="asfx-bridge-lock">Best signal is not the most frequent signal. Avoid forced entries.</div>
    </div>
  `;
}
function chatHtml(d){
  const smz = readSmz();

  const bias = smzText(smz.bias || d.bias, "WAIT").toUpperCase();
  const risk = smzText(smz.risk || d.risk, "Medium");
  const confidence = String(smzText(smz.confidence || d.confidence, "0")).replace(/%/g, "");
  const setup = smzText(smz.signalStatusLabel || smz.setupType || smz.signalStatus || smz.zoneState, "Market Observation");
  const phase = smzText(smz.smzPhase || smz.phase || smz.actionStatus || "Market Reading", "Market Reading");

  const activeZone = smzText(smz.activeZone || smz.zoneState || smz.zone, "Waiting valid zone");
  const demand = smzText(smz.demandZone, "Calculating");
  const supply = smzText(smz.supplyZone, "Calculating");
  const structure = smzText(smz.structure, "Reading structure");
  const liquidity = smzText(smz.liquidity, "Waiting liquidity");
  const imbalance = smzText(smz.imbalance, "Waiting imbalance");
  const reason = smzText(smz.statusDetail || smz.reason, "AI is reading market context.");

  return `
    <div class="asfx-bridge-wrap" data-asfx-bridge-rendered="chat">
      <div class="asfx-bridge-head">
        <div class="asfx-bridge-kicker">AI Insight</div>
        <div class="asfx-bridge-title">${setup}</div>
        <div class="asfx-bridge-sub">${d.pair} | ${d.tf} | ${phase} | ${confidence}% Confidence</div>
      </div>

      <div class="asfx-bridge-box">
        <small>AI Reason</small><br>
        <b style="color:#fff;">${reason}</b>
      </div>

      <div class="asfx-bridge-grid">
        <div class="asfx-bridge-mini">
          <small>Bias</small>
          <b class="${biasClass(bias)}">${bias}</b>
        </div>
        <div class="asfx-bridge-mini">
          <small>Risk</small>
          <b>${risk}</b>
        </div>
        <div class="asfx-bridge-mini">
          <small>Method</small>
          <b>Hybrid</b>
        </div>
      </div>

      <div class="asfx-bridge-box">
        <b style="color:#fff;">Technical Method</b><br>
        <span style="opacity:.86;">SNR | RBS/SBR | SND | BRN | Candle Context</span>
      </div>

      <details class="asfx-bridge-box">
        <summary style="cursor:pointer;color:#fff;font-weight:900;">Market Context</summary>
        <br>
        Active Zone: <b style="color:#fff;">${activeZone}</b><br>
        Demand: <b style="color:#fff;">${demand}</b><br>
        Supply: <b style="color:#fff;">${supply}</b><br>
        Structure: <b style="color:#fff;">${structure}</b><br>
        Liquidity: <b style="color:#fff;">${liquidity}</b><br>
        FVG / Imbalance: <b style="color:#fff;">${imbalance}</b>
      </details>

      <div class="asfx-bridge-lock">Signal tab gives execution. AI Insight explains the technical reason.</div>
    </div>
  `;
}
function vipHtml(d){
    return `
      <div class="asfx-bridge-wrap" data-asfx-bridge-rendered="vip">
        <div class="asfx-bridge-head">
          <div class="asfx-bridge-kicker">Signal Plan Locked</div>
          <div class="asfx-bridge-title">Unlock Full ${d.pair} Room</div>
          <div class="asfx-bridge-sub">Public melihat preview. VIP membuka full signal plan lengkap.</div>
        </div>

        <div class="asfx-bridge-lock">
          Locked detail: entry, SL, TP, confidence breakdown, SMZ zone, risk plan, AI reasoning, dan signal history.
        </div>
      </div>
    `;
  }

  
/* ASFX_PLAN_PACKET_RISK_AI_RENDER_BRIDGE_V2 */
function asfxPlanPacketBridgeEscV2(value){
  if (typeof asfxIndicatorEsc === "function") return asfxIndicatorEsc(value);
  return String(value ?? "").replace(/[&<>"']/g, function(m){
    return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[m] || m;
  });
}

function asfxPlanPacketBridgeFmtV2(value, fallback = "Pending"){
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n.toLocaleString("en-US", { maximumFractionDigits: Math.abs(n) >= 1000 ? 2 : 5 });
}

function asfxPlanPacketBridgeRangeV2(range, fallback = "Pending"){
  if (!range || typeof range !== "object") return fallback;
  const low = Number(range.low);
  const high = Number(range.high);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return fallback;
  return asfxPlanPacketBridgeFmtV2(Math.min(low, high)) + " - " + asfxPlanPacketBridgeFmtV2(Math.max(low, high));
}

function asfxPlanPacketBridgeViewV2(d = {}, smz = {}){
  try {
    const packet = window.ASFXPlanPacketV1 && typeof window.ASFXPlanPacketV1.latest === "function"
      ? window.ASFXPlanPacketV1.latest()
      : null;

    if (!packet || typeof packet !== "object") return null;

    return {
      decision: String(packet.decision || "NO TRADE").toUpperCase(),
      lifecycle: String(packet.lifecycle || packet.decision || "WATCH").toUpperCase(),
      valid: !!packet.valid,
      side: String(packet.side || "WAIT").toUpperCase(),
      pair: String(packet.pair || d.pair || d.symbol || "Market").toUpperCase(),
      tf: String(packet.timeframe || d.tf || d.timeframe || "15m"),
      risk: String(packet.risk || d.risk || smz.risk || "Medium"),
      score: Number(packet.score ?? packet.confidence ?? d.confidence ?? 0) || 0,
      price: asfxPlanPacketBridgeFmtV2(packet.price, "Reading"),
      entry: asfxPlanPacketBridgeRangeV2(packet.entryPrimary, packet.valid ? "Calculating entry" : "Pending - no valid entry zone"),
      secondary: asfxPlanPacketBridgeRangeV2(packet.entrySecondary, "Pending"),
      sl: asfxPlanPacketBridgeFmtV2(packet.sl, "Pending"),
      tp1: asfxPlanPacketBridgeFmtV2(packet.tp1, "Pending"),
      tp2: asfxPlanPacketBridgeFmtV2(packet.tp2, "Pending"),
      tp3: asfxPlanPacketBridgeFmtV2(packet.tp3, "Pending"),
      rr: String(packet.rr || "-"),
      minTarget: asfxPlanPacketBridgeFmtV2(packet.minTarget, "-"),
      reason: String(packet.reason || "AiSignal Plan Packet sedang membaca struktur market."),
      activeZone: String(packet.mtfContext?.activeZone || smz.activeZone || smz.zoneState || "Reading active zone"),
      higherBias: String(packet.mtfContext?.higherBias || smz.structure || "Reading structure"),
      demand: packet.mtfContext?.demandZone ? asfxPlanPacketBridgeRangeV2(packet.mtfContext.demandZone, "Calculating") : String(smz.demandZone || "Calculating"),
      supply: packet.mtfContext?.supplyZone ? asfxPlanPacketBridgeRangeV2(packet.mtfContext.supplyZone, "Calculating") : String(smz.supplyZone || "Calculating"),
      session: String(packet.session?.label || packet.session?.name || "Session reading"),
      sessionNote: String(packet.session?.note || "Session guard aktif di belakang layar."),
      volume: String(packet.volumeFlow?.label || packet.volumeFlow?.bias || "Volume reading"),
      volumeNote: String(packet.volumeFlow?.note || "Volume confirmation sedang dibaca.")
    };
  } catch (_) {
    return null;
  }
}

function asfxPlanPacketRiskBridgeHtmlV2(d, smz){
  /* ASFX_RISK_TAB_SYNC_V5
     Risk tab follows AiSignal SOP Engine V5 packet:
     - FRESH_ENTRY = execution risk plan
     - TP/PROTECT/RUNNING = protect profit mode
     - WAITING/REACTION = watch-zone risk
  */
  const v = asfxPlanPacketBridgeViewV2(d, smz);
  if (!v) return "";

  const esc = asfxPlanPacketBridgeEscV2;

  const packet = window.ASFXPlanPacketV1 && typeof window.ASFXPlanPacketV1.latest === "function"
    ? window.ASFXPlanPacketV1.latest()
    : null;

  const chartMode = String(packet?.chartMode || packet?.visualMode || v.chartMode || "").toUpperCase();
  const decision = String(packet?.decision || v.decision || "").toUpperCase();
  const lifecycle = String(packet?.lifecycle || "").toUpperCase();
  const statusText = [decision, lifecycle, chartMode].join(" ");

  const hit = packet?.hit || {};
  const tv = packet?.targetValidity || {};
  const freshEntry =
    packet?.freshEntry === true &&
    packet?.noFreshEntry !== true &&
    chartMode === "FRESH_ENTRY";

  const isProtect =
    /PROTECT|TP1 HIT|TP2 HIT|TP3 HIT|RUNNING|TP AREA/.test(statusText) ||
    hit.tp1 === true ||
    hit.tp2 === true;

  const isClosed =
    /CLOSED|COMPLETED|INVALID|SL HIT/.test(statusText) ||
    hit.sl === true ||
    hit.tp3 === true;

  const isWatch =
    /WAITING|WATCH|REACTION|CONTEXT/.test(statusText) ||
    packet?.watchZone ||
    packet?.contextZone;

  const guard = freshEntry
    ? "PLAN RISK READY"
    : isClosed
      ? "SETUP CLOSED"
      : isProtect
        ? "PROTECT PROFIT MODE"
        : isWatch
          ? "WATCH ZONE RISK"
          : "RISK STANDBY";

  const safety = freshEntry
    ? /high/i.test(v.risk) ? "Caution" : "Execution Guard"
    : isProtect
      ? "Protect Profit"
      : isWatch
        ? "No Fresh Entry"
        : "Protected Watch";

  const riskReading = freshEntry
    ? "Fresh entry valid. Risk hanya berlaku jika entry dilakukan di dalam zona resmi."
    : isClosed
      ? (tv.reason || "Setup sudah selesai/invalid. Jangan buka entry baru dari plan ini.")
      : isProtect
        ? (tv.reason || "TP sudah tersentuh atau harga berada di area profit. Fokus protect profit, jangan kejar entry baru.")
        : isWatch
          ? (tv.reason || "Zona sedang dipantau. Tunggu harga masuk zona dan muncul konfirmasi candle/volume.")
          : (tv.reason || "Risk standby. Belum ada fresh execution plan.");

  const zoneLabel = freshEntry
    ? "Entry Zone"
    : isProtect
      ? "Protect Zone"
      : isWatch
        ? "Watch Zone"
        : "Context";

  const contextRange = packet?.contextZone || packet?.watchZone;
  const contextText = contextRange
    ? asfxPlanPacketBridgeRangeV2(contextRange, "Pending")
    : v.activeZone || v.entry || "Pending";

  const zoneValue = freshEntry ? v.entry : contextText;
  const slValue = freshEntry ? v.sl : hit.sl ? "SL HIT" : "Inactive";
  const rrValue = freshEntry ? v.rr : isProtect ? "Protect" : isWatch ? "Waiting" : "-";

  const minTarget = freshEntry
    ? v.minTarget
    : isProtect
      ? hit.tp2 ? "TP2 area" : hit.tp1 ? "TP1 area" : "TP area"
      : isWatch
        ? "Wait confirmation"
        : v.minTarget;

  return '' +
    '<div class="asfx-bridge-wrap" data-asfx-bridge-rendered="risk" data-asfx-risk-sync-v5="1">' +
      '<div class="asfx-bridge-head">' +
        '<div class="asfx-bridge-kicker">Risk Dashboard</div>' +
        '<div class="asfx-bridge-title">' + esc(guard) + '</div>' +
        '<div class="asfx-bridge-sub">' + esc(v.pair) + ' | ' + esc(v.tf) + ' | ' + esc(v.risk) + ' Risk | Score ' + esc(v.score) + '%</div>' +
      '</div>' +

      '<div class="asfx-bridge-grid">' +
        '<div class="asfx-bridge-mini"><small>Risk Tier</small><b>' + esc(v.risk) + '</b></div>' +
        '<div class="asfx-bridge-mini"><small>Safety</small><b>' + esc(safety) + '</b></div>' +
        '<div class="asfx-bridge-mini"><small>Mode</small><b>' + esc(chartMode || "READING") + '</b></div>' +
      '</div>' +

      '<div class="asfx-bridge-box"><b style="color:#fff;">Risk Reading</b><br>' +
        esc(riskReading) +
      '</div>' +

      '<div class="asfx-bridge-grid">' +
        '<div class="asfx-bridge-mini"><small>' + esc(zoneLabel) + '</small><b>' + esc(zoneValue) + '</b></div>' +
        '<div class="asfx-bridge-mini"><small>SL</small><b>' + esc(slValue) + '</b></div>' +
        '<div class="asfx-bridge-mini"><small>RR</small><b>' + esc(rrValue) + '</b></div>' +
      '</div>' +

      '<div class="asfx-bridge-grid">' +
        '<div class="asfx-bridge-mini"><small>TP2</small><b>' + esc(tv.tp2Valid ? "Valid" : isProtect ? "Protect" : "Watch") + '</b></div>' +
        '<div class="asfx-bridge-mini"><small>TP3</small><b>' + esc(tv.tp3Valid ? "Valid" : isProtect ? "Watch" : "Pending") + '</b></div>' +
        '<div class="asfx-bridge-mini"><small>Target</small><b>' + esc(minTarget) + '</b></div>' +
      '</div>' +

      '<details class="asfx-bridge-box">' +
        '<summary style="cursor:pointer;color:#fff;font-weight:900;">Zone Context</summary><br>' +
        'Demand: <b style="color:#fff;">' + esc(v.demand) + '</b><br>' +
        'Supply: <b style="color:#fff;">' + esc(v.supply) + '</b><br>' +
        'Active/Context Zone: <b style="color:#fff;">' + esc(contextText) + '</b><br>' +
        'Decision: <b style="color:#fff;">' + esc(packet?.decision || v.decision || "-") + '</b>' +
      '</details>' +

      '<div class="asfx-bridge-lock">Risk tab sekarang membedakan fresh entry, watch zone, dan protect profit dari packet V5.</div>' +
    '</div>';
}

function asfxPlanPacketAiBridgeHtmlV2(d, smz){
  /* ASFX_AI_INSIGHT_COMPOSER_V5
     Human trader-style explanation from AiSignal SOP Engine V5 packet.
     AI Insight must explain market condition, not expose engine/debug text.
  */
  const v = asfxPlanPacketBridgeViewV2(d, smz);
  if (!v) return "";

  const esc = asfxPlanPacketBridgeEscV2;
  const titleClass = typeof biasClass === "function" ? biasClass(v.side) : "";

  const packet = window.ASFXPlanPacketV1 && typeof window.ASFXPlanPacketV1.latest === "function"
    ? window.ASFXPlanPacketV1.latest()
    : null;

  const safe = (value, fallback = "-") => {
    const s = String(value ?? "").trim();
    return s || fallback;
  };

  const fmt = (value, fallback = "-") => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return n.toLocaleString("en-US", { maximumFractionDigits: Math.abs(n) >= 1000 ? 2 : 5 });
  };

  const range = (z, fallback = "-") => {
    if (!z || typeof z !== "object") return fallback;
    const low = Number(z.low);
    const high = Number(z.high);
    if (!Number.isFinite(low) || !Number.isFinite(high)) return fallback;
    return fmt(Math.min(low, high)) + " - " + fmt(Math.max(low, high));
  };

  const pair = safe(packet?.pair || v.pair, "Market");
  const tf = safe(packet?.timeframe || v.tf, "15m");
  const side = safe(packet?.side || v.side, "WAIT").toUpperCase();
  const decision = safe(packet?.decision || v.decision, "ZONE SCAN").toUpperCase();
  const chartMode = safe(packet?.chartMode || packet?.visualMode || "", "READING").toUpperCase();
  const lifecycle = safe(packet?.lifecycle || "", "");
  const price = fmt(packet?.price || v.price, "Reading");

  const freshEntry = packet?.freshEntry === true && packet?.noFreshEntry !== true && chartMode === "FRESH_ENTRY";
  const hit = packet?.hit || {};
  const tv = packet?.targetValidity || {};
  const liquidity = packet?.liquidity || {};
  const indicators = packet?.sop?.indicators || {};
  const finalizer = packet?.sop?.finalizer || {};
  const session = safe(packet?.session?.name || v.session, "Market session");
  const volume = safe(packet?.volumeFlow?.label || v.volume, "Volume neutral");

  const contextZoneObj = packet?.contextZone || packet?.watchZone || packet?.entryPrimary || null;
  const entryZoneObj = packet?.entryPrimary || null;
  const demandZoneObj = packet?.mtfContext?.demandZone || null;
  const supplyZoneObj = packet?.mtfContext?.supplyZone || null;

  const contextZone = range(contextZoneObj, safe(v.activeZone || v.entry, "Reading zone"));
  const entryZone = range(entryZoneObj, safe(v.entry, "Pending"));
  const demandZone = range(demandZoneObj, safe(v.demand, "Reading"));
  const supplyZone = range(supplyZoneObj, safe(v.supply, "Reading"));

  const rsi = fmt(indicators.rsi14, "-");
  const atr = fmt(indicators.atr14, "-");
  const ema21 = fmt(indicators.ema21, "-");
  const ema50 = fmt(indicators.ema50, "-");
  const liquidityNote = safe(liquidity.note, "Liquidity belum memberi tekanan ekstrem.");
  const targetReason = safe(tv.reason, "");

  const statusText = [decision, lifecycle, chartMode].join(" ").toUpperCase();
  const isProtect = /PROTECT|TP1 HIT|TP2 HIT|RUNNING|TP AREA/.test(statusText) || hit.tp1 || hit.tp2;
  const isClosed = /CLOSED|COMPLETED|INVALID|SL HIT/.test(statusText) || hit.sl || hit.tp3;
  const isWatch = /WATCH|WAITING|REACTION|CONTEXT/.test(statusText) || packet?.watchZone || packet?.contextZone;

  let marketContext = "";
  let zoneReading = "";
  let confirmation = "";
  let invalidation = "";
  let traderNote = "";

  if (freshEntry) {
    marketContext =
      "Harga sekarang berada di area eksekusi " + side + ". Zona sudah tersentuh/dekat area valid, jadi sistem mengizinkan rencana Entry, SL, dan TP aktif.";
    zoneReading =
      "Entry zone aktif berada di " + entryZone + ". Selama price tetap di sekitar zona ini dan tidak menembus invalidation, setup masih layak dipantau sebagai official " + side + ".";
    confirmation =
      side === "BUY"
        ? "Konfirmasi yang dicari: rejection dari demand/support, candle close kuat ke atas, dan buyer pressure mulai masuk."
        : "Konfirmasi yang dicari: rejection dari supply/resistance, candle close menekan ke bawah, dan seller pressure mulai masuk.";
    invalidation =
      side === "BUY"
        ? "Setup buy melemah kalau price breakdown bersih di bawah demand/entry zone dan volume seller meningkat."
        : "Setup sell melemah kalau price breakout bersih di atas supply/entry zone dan volume buyer meningkat.";
    traderNote =
      "Ini bukan entry market asal. Eksekusi tetap harus mengikuti zona, risk plan, dan candle confirmation.";
  } else if (isProtect) {
    marketContext =
      side + " sebelumnya sudah masuk area profit/TP. Sistem tidak menganggap posisi sekarang sebagai fresh entry baru karena harga sudah berjalan dari zona awal.";
    zoneReading =
      "Area yang sedang dipantau sekarang adalah context/protect zone: " + contextZone + ". Fokusnya bukan membuka posisi baru, tapi membaca apakah momentum masih sehat atau harus protect profit.";
    confirmation =
      tv.tp2Valid || tv.tp3Valid
        ? "Momentum lanjutan masih ada, tapi tetap perlu dijaga. Jika candle terus searah dan volume mendukung, target berikutnya masih bisa dipantau."
        : "Momentum lanjutan mulai kurang sehat. Lebih aman protect profit dan tunggu setup baru seperti pullback, retest SBR/RBS, atau reaction zone.";
    invalidation =
      "Jangan kejar entry baru di tengah jalan. Setup baru baru layak muncul jika price pullback ke zona valid, break-retest, atau membentuk reaction baru yang bersih.";
    traderNote =
      "Status ini berarti sistem sedang mengelola peluang yang sudah berjalan, bukan memberi sinyal entry baru.";
  } else if (isWatch) {
    marketContext =
      "Market condong " + side + ", tapi harga belum berada di titik eksekusi yang bersih. Karena itu sistem menandai kondisi ini sebagai watch zone.";
    zoneReading =
      "Zona yang sedang dibaca: " + contextZone + ". Price sekarang sekitar " + price + ", jadi sistem menunggu harga masuk area tersebut atau muncul reaction yang jelas.";
    confirmation =
      side === "BUY"
        ? "Untuk naik menjadi OFFICIAL BUY, price perlu masuk demand/RBR/RBS area lalu menunjukkan rejection, buyer pressure, dan candle close yang mendukung."
        : "Untuk naik menjadi OFFICIAL SELL, price perlu masuk supply/DBD/SBR area lalu menunjukkan rejection, seller pressure, dan candle close yang mendukung.";
    invalidation =
      side === "BUY"
        ? "Buy watch batal kalau demand ditembus kuat tanpa reclaim. Setelah itu sistem akan menilai ulang kemungkinan sell continuation."
        : "Sell watch batal kalau supply ditembus kuat tanpa rejection. Setelah itu sistem akan menilai ulang kemungkinan buy continuation.";
    traderNote =
      "Ini zona pantauan. Belum ada alasan untuk entry market langsung sebelum price dan candle memberi konfirmasi.";
  } else if (isClosed) {
    marketContext =
      "Setup ini sudah masuk fase selesai atau invalid. Sistem tidak lagi memakai plan ini sebagai rencana entry aktif.";
    zoneReading =
      "Zona sebelumnya hanya tersisa sebagai riwayat/context. Fokus berikutnya adalah mencari struktur baru yang lebih bersih.";
    confirmation =
      "Tunggu packet baru dari engine: watch zone baru, fresh entry baru, atau continuation setelah break-retest.";
    invalidation =
      "Jangan gunakan Entry/SL/TP lama untuk keputusan baru.";
    traderNote =
      "Setup closed berarti siklus signal lama selesai.";
  } else {
    marketContext =
      "Sistem sedang membaca struktur market dan belum menemukan eksekusi yang cukup bersih.";
    zoneReading =
      "Zona/context yang terbaca: " + contextZone + ". Price sekarang sekitar " + price + ".";
    confirmation =
      "Tunggu zona yang lebih jelas, candle confirmation, volume yang mendukung, dan risk/target yang sehat.";
    invalidation =
      "Kalau zona gagal dipertahankan, engine akan menunggu struktur baru.";
    traderNote =
      "Tidak semua kondisi harus dipaksa menjadi entry. Kadang keputusan paling sehat adalah menunggu setup yang lebih bersih.";
  }

  const technicalSupport =
    "Pendukung teknikal: " +
    "SNR/RBS-SBR, supply-demand, BRN, trendline, liquidity, session, volume, RSI, EMA, dan ATR. " +
    "Volume: " + volume + ". RSI: " + rsi + ". EMA21/50: " + ema21 + " / " + ema50 + ". ATR: " + atr + ". " +
    liquidityNote;

  const title = decision && decision !== "NO TRADE" ? decision : chartMode;
  const sub = pair + " | " + tf + " | " + session + " | Score " + safe(packet?.score || v.score, "0") + "%";

  return '' +
    '<div class="asfx-bridge-wrap" data-asfx-bridge-rendered="chat" data-asfx-ai-insight-composer-v5="1">' +
      '<div class="asfx-bridge-head">' +
        '<div class="asfx-bridge-kicker">AI Insight</div>' +
        '<div class="asfx-bridge-title ' + titleClass + '">' + esc(title) + '</div>' +
        '<div class="asfx-bridge-sub">' + esc(sub) + '</div>' +
      '</div>' +

      '<div class="asfx-bridge-box"><b style="color:#fff;">Market Context</b><br>' + esc(marketContext) + '</div>' +
      '<div class="asfx-bridge-box"><b style="color:#fff;">Zone Reading</b><br>' + esc(zoneReading) + '</div>' +
      '<div class="asfx-bridge-box"><b style="color:#fff;">Confirmation Needed</b><br>' + esc(confirmation) + '</div>' +
      '<div class="asfx-bridge-box"><b style="color:#fff;">Invalidation Scenario</b><br>' + esc(invalidation) + '</div>' +

      '<div class="asfx-bridge-grid">' +
        '<div class="asfx-bridge-mini"><small>Bias</small><b class="' + titleClass + '">' + esc(side) + '</b></div>' +
        '<div class="asfx-bridge-mini"><small>Mode</small><b>' + esc(chartMode) + '</b></div>' +
        '<div class="asfx-bridge-mini"><small>Volume</small><b>' + esc(volume) + '</b></div>' +
      '</div>' +

      '<details class="asfx-bridge-box">' +
        '<summary style="cursor:pointer;color:#fff;font-weight:900;">Technical Detail</summary><br>' +
        'Price: <b style="color:#fff;">' + esc(price) + '</b><br>' +
        'Entry Zone: <b style="color:#fff;">' + esc(entryZone) + '</b><br>' +
        'Context Zone: <b style="color:#fff;">' + esc(contextZone) + '</b><br>' +
        'Demand: <b style="color:#fff;">' + esc(demandZone) + '</b><br>' +
        'Supply: <b style="color:#fff;">' + esc(supplyZone) + '</b><br><br>' +
        esc(technicalSupport) +
      '</details>' +

      '<div class="asfx-bridge-box"><b style="color:#fff;">Trader Note</b><br>' + esc(traderNote) + '</div>' +
    '</div>';
}

function renderBridge(tab){
  const p = panel();
  if (!p || tab === "chart") return;

  // Gating V5: Jika kontainer UI sudah terbentuk di DOM, serahkan hak sisa render sepenuhnya ke UI Authority V5
  if ((tab === "signal" || tab === "risk") && document.querySelector(`[data-asfx-bridge-rendered="${tab}"]`)) {
    return;
  }

  const d = readSignal();
  const smz = readSmz();

  let html = "";
  if (tab === "signal") html = signalHtml(d);
  if (tab === "risk") html = asfxPlanPacketRiskBridgeHtmlV2(d, smz) || riskHtml(d);
  if (tab === "chat") html = asfxPlanPacketAiBridgeHtmlV2(d, smz) || chatHtml(d);
  if (tab === "vip") html = vipHtml(d);
  if (!html) return;

  const stableKey = [
    tab,
    d.pair,
    d.tf,
    d.bias || smz.bias,
    d.risk || smz.risk,
    d.confidence || smz.confidence,
    smz.signalStatus,
    smz.zoneState,
    smz.activeZone,
    smz.demandZone,
    smz.supplyZone,
    smz.structure,
    smz.stopLossGuide,
    smz.tp1Guide,
    smz.tp2Guide
  ].join("|");

  if (p.dataset.asfxCompactPanelKey === stableKey) return;
  p.dataset.asfxCompactPanelKey = stableKey;
  p.innerHTML = html;
}


document.addEventListener

document.addEventListener("click", function(e){
    const btn = e.target.closest("[data-detail-tab]");
    if (!btn) return;

    setTimeout(() => {
      renderBridge(btn.dataset.detailTab);
    }, 120);
  }, true);

  setInterval(() => {
    const tab = activeTab();
    if (tab !== "chart") renderBridge(tab);
  }, 1500);
})();


/* SCANNER_DETAIL_ROOM_SAFE_POLISH_V1 */
(() => {
  if (window.__SCANNER_DETAIL_ROOM_SAFE_POLISH_V1__) return;
  window.__SCANNER_DETAIL_ROOM_SAFE_POLISH_V1__ = true;

  const style = document.createElement("style");
  style.setAttribute("data-patch", "scanner-detail-room-safe-polish-v1");
  style.textContent = `
    html,
    body {
      max-width: 100%;
      overflow-x: hidden !important;
    }

    #app,
    main,
    .app-shell,
    .mobile-shell,
    .scanner-shell,
    .scanner-page,
    .scanner-detail-room,
    .signal-detail-room,
    .detail-room,
    [data-detail-room],
    [data-scanner-detail] {
      max-width: 100vw !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
    }

    .scanner-detail-room *,
    .signal-detail-room *,
    .detail-room *,
    [data-detail-room] *,
    [data-scanner-detail] * {
      box-sizing: border-box !important;
    }

    .scanner-detail-room canvas,
    .signal-detail-room canvas,
    .detail-room canvas,
    [data-detail-room] canvas,
    [data-scanner-detail] canvas,
    .scanner-detail-room svg,
    .signal-detail-room svg,
    .detail-room svg,
    [data-detail-room] svg,
    [data-scanner-detail] svg {
      max-width: 100% !important;
    }

    .scanner-detail-room .chart,
    .signal-detail-room .chart,
    .detail-room .chart,
    .scanner-detail-room .chart-box,
    .signal-detail-room .chart-box,
    .detail-room .chart-box,
    .scanner-detail-room .chart-panel,
    .signal-detail-room .chart-panel,
    .detail-room .chart-panel,
    .scanner-detail-room .live-chart,
    .signal-detail-room .live-chart,
    .detail-room .live-chart,
    .scanner-detail-room .scanner-live-chart,
    .signal-detail-room .scanner-live-chart,
    .detail-room .scanner-live-chart,
    .scanner-detail-room .detail-chart,
    .signal-detail-room .detail-chart,
    .detail-room .detail-chart {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      overflow: hidden !important;
    }

    @media (max-width: 768px) {
      .scanner-detail-room .chart,
      .signal-detail-room .chart,
      .detail-room .chart,
      .scanner-detail-room .chart-box,
      .signal-detail-room .chart-box,
      .detail-room .chart-box,
      .scanner-detail-room .chart-panel,
      .signal-detail-room .chart-panel,
      .detail-room .chart-panel,
      .scanner-detail-room .live-chart,
      .signal-detail-room .live-chart,
      .detail-room .live-chart,
      .scanner-detail-room .scanner-live-chart,
      .signal-detail-room .scanner-live-chart,
      .detail-room .scanner-live-chart,
      .scanner-detail-room .detail-chart,
      .signal-detail-room .detail-chart,
      .detail-room .detail-chart {
        min-height: 320px !important;
      }

      .scanner-detail-room .stat-card,
      .signal-detail-room .stat-card,
      .detail-room .stat-card,
      .scanner-detail-room .metric-card,
      .signal-detail-room .metric-card,
      .detail-room .metric-card,
      .scanner-detail-room .price-card,
      .signal-detail-room .price-card,
      .detail-room .price-card {
        padding: 10px 12px !important;
        border-radius: 16px !important;
      }

      .scanner-detail-room .chat-box,
      .signal-detail-room .chat-box,
      .detail-room .chat-box,
      .scanner-detail-room textarea,
      .signal-detail-room textarea,
      .detail-room textarea {
        max-height: 170px !important;
      }
    }
  `;

  document.head.appendChild(style);
})();


/* AISIGNAL_LOGIC_BRAIN_V1 */
(() => {
  if (window.AiSignalLogicV1) return;

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const normalizeCandles = (candles = []) => {
    return (Array.isArray(candles) ? candles : [])
      .map((c) => {
        if (Array.isArray(c)) {
          return {
            time: toNum(c[0]),
            open: toNum(c[1]),
            high: toNum(c[2]),
            low: toNum(c[3]),
            close: toNum(c[4]),
            volume: toNum(c[5]),
          };
        }

        return {
          time: toNum(c.time ?? c.t ?? c[0]),
          open: toNum(c.open ?? c.o ?? c[1]),
          high: toNum(c.high ?? c.h ?? c[2]),
          low: toNum(c.low ?? c.l ?? c[3]),
          close: toNum(c.close ?? c.c ?? c[4]),
          volume: toNum(c.volume ?? c.v ?? c[5]),
        };
      })
      .filter((c) => c.open && c.high && c.low && c.close);
  };

  const ema = (values, period) => {
    if (!values.length) return [];
    const k = 2 / (period + 1);
    const out = [];
    let prev = values[0];

    values.forEach((value, index) => {
      const current = index === 0 ? value : value * k + prev * (1 - k);
      out.push(current);
      prev = current;
    });

    return out;
  };

  const rsi = (values, period = 14) => {
    if (values.length <= period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = values.length - period; i < values.length; i++) {
      const diff = values[i] - values[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - 100 / (1 + rs);
  };

  const volatilityPct = (candles) => {
    const recent = candles.slice(-14);
    if (!recent.length) return 0;

    const avgRange =
      recent.reduce((sum, c) => sum + Math.max(0, c.high - c.low), 0) /
      recent.length;

    const lastClose = recent[recent.length - 1].close || 1;
    return (avgRange / lastClose) * 100;
  };

  const round = (value, digits = 2) => {
    const factor = 10 ** digits;
    return Math.round((Number(value) || 0) * factor) / factor;
  };

  const analyze = ({ symbol = "BTCUSDT", timeframe = "M15", candles = [], price } = {}) => {
    const clean = normalizeCandles(candles);
    const closes = clean.map((c) => c.close);
    const lastPrice = toNum(price) || closes[closes.length - 1] || 0;

    if (clean.length < 30 || !lastPrice) {
      return {
        symbol,
        timeframe,
        bias: "WAIT",
        confidence: 42,
        trend: "Insufficient data",
        momentum: "Neutral",
        risk: "Medium",
        price: lastPrice,
        reason:
          "Market data is still limited. Waiting for more candles before confirming a directional setup.",
      };
    }

    const emaFast = ema(closes, 9);
    const emaSlow = ema(closes, 21);

    const fast = emaFast[emaFast.length - 1];
    const slow = emaSlow[emaSlow.length - 1];
    const prevFast = emaFast[emaFast.length - 4] || fast;
    const prevSlow = emaSlow[emaSlow.length - 4] || slow;

    const currentRsi = rsi(closes, 14);
    const vol = volatilityPct(clean);

    const trendUp = fast > slow && fast >= prevFast;
    const trendDown = fast < slow && fast <= prevFast;
    const momentumUp = currentRsi >= 54 && currentRsi <= 72;
    const momentumDown = currentRsi <= 46 && currentRsi >= 28;
    const overbought = currentRsi > 74;
    const oversold = currentRsi < 26;

    let bias = "WAIT";
    let confidence = 50;
    let trend = "Sideways / mixed";
    let momentum = "Neutral";

    if (trendUp && momentumUp && !overbought) {
      bias = "BUY";
      confidence = 68;
      trend = "Bullish";
      momentum = "Positive";
    } else if (trendDown && momentumDown && !oversold) {
      bias = "SELL";
      confidence = 68;
      trend = "Bearish";
      momentum = "Negative";
    } else if (trendUp && !overbought) {
      bias = "BUY";
      confidence = 58;
      trend = "Bullish";
      momentum = currentRsi >= 50 ? "Mild positive" : "Weak";
    } else if (trendDown && !oversold) {
      bias = "SELL";
      confidence = 58;
      trend = "Bearish";
      momentum = currentRsi <= 50 ? "Mild negative" : "Weak";
    }

    if (overbought || oversold) {
      bias = "WAIT";
      confidence = 54;
      momentum = overbought ? "Overbought" : "Oversold";
    }

    const risk = vol >= 1.4 ? "High" : vol >= 0.7 ? "Medium" : "Low";

    if (risk === "High") confidence = Math.max(45, confidence - 8);
    if (risk === "Low" && bias !== "WAIT") confidence = Math.min(82, confidence + 4);

    const reasonMap = {
      BUY:
        "Fast EMA is holding above slow EMA with supportive momentum. Setup is bullish, but confirmation should still wait for clean price reaction.",
      SELL:
        "Fast EMA is holding below slow EMA with bearish momentum. Setup is bearish, but confirmation should still wait for clean price reaction.",
      WAIT:
        "Trend and momentum are not fully aligned. Better to wait for clearer structure before taking action.",
    };

    return {
      symbol,
      timeframe,
      bias,
      confidence: Math.round(confidence),
      trend,
      momentum,
      risk,
      price: round(lastPrice, 4),
      emaFast: round(fast, 4),
      emaSlow: round(slow, 4),
      rsi: round(currentRsi, 2),
      volatility: round(vol, 3),
      reason: reasonMap[bias],
    };
  };

  window.AiSignalLogicV1 = {
    analyze,
    normalizeCandles,
    version: "1.0.0",
  };

  console.info("AiSignal Logic Brain V1 ready.");
})();


/* AISIGNAL_LOGIC_BRIDGE_V1_1 */
(() => {
  if (window.__AISIGNAL_LOGIC_BRIDGE_V1_1__) return;
  window.__AISIGNAL_LOGIC_BRIDGE_V1_1__ = true;

  const SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
    "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "TONUSDT"
  ];

  const tfToBinance = (tf = "M15") => {
    const key = String(tf).toUpperCase().trim();
    const map = {
      M1: "1m",
      "1M": "1m",
      M3: "3m",
      "3M": "3m",
      M5: "5m",
      "5M": "5m",
      M15: "15m",
      "15M": "15m",
      M30: "30m",
      "30M": "30m",
      H1: "1h",
      "1H": "1h",
      H4: "4h",
      "4H": "4h",
      D1: "1d",
      "1D": "1d",
      W1: "1w",
      "1W": "1w",
    };
    return map[key] || "15m";
  };

  const detectSymbol = () => {
    const bodyText = document.body ? document.body.innerText.toUpperCase() : "";
    const fromText = SYMBOLS.find((s) => bodyText.includes(s));
    return fromText || "BTCUSDT";
  };

  const detectTimeframe = () => {
    const nodes = Array.from(document.querySelectorAll("button, [role='button'], .chip, .tab, [data-timeframe]"));
    const active = nodes.find((el) => {
      const cls = String(el.className || "").toLowerCase();
      const aria = el.getAttribute("aria-pressed");
      return cls.includes("active") || aria === "true" || el.dataset.active === "true";
    });

    const text = String(active?.textContent || document.body?.innerText || "").toUpperCase();
    const match = text.match(/\b(M1|M3|M5|M15|M30|H1|H4|D1|W1)\b/);
    return match ? match[1] : "M15";
  };

  const extractCandles = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.klines)) return payload.klines;
    if (Array.isArray(payload?.candles)) return payload.candles;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.data?.klines)) return payload.data.klines;
    if (Array.isArray(payload?.data?.candles)) return payload.data.candles;
    return [];
  };

  const fetchJson = async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const fetchCandles = async (symbol, interval) => {
    const urls = [
      `/api/binance/klines?symbol=${symbol}&interval=${interval}&limit=120`,
      `/api/binance?type=klines&symbol=${symbol}&interval=${interval}&limit=120`,
      `/api/binance?endpoint=klines&symbol=${symbol}&interval=${interval}&limit=120`,
      `/api/binance?path=/api/v3/klines&symbol=${symbol}&interval=${interval}&limit=120`,
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=120`
    ];

    let lastError = null;

    for (const url of urls) {
      try {
        const payload = await fetchJson(url);
        const candles = extractCandles(payload);
        if (candles.length) return candles;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("No candle data");
  };

  const findDetailRoot = () => {
    const bodyText = document.body ? document.body.innerText : "";

    const isDetailRoom =
      /Signal Detail|Detail Room|AI Insight|Full Analysis|Trade Plan/i.test(bodyText) &&
      !/Open Detail/i.test(bodyText);

    const selectors = [
      "[data-detail-room]",
      "[data-scanner-detail]",
      ".scanner-detail-room",
      ".signal-detail-room",
      ".detail-room"
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && isDetailRoom) return el;
    }

    if (isDetailRoom) {
      return document.querySelector("main") || document.body;
    }

    const wrongCard = document.getElementById("aisignal-logic-bridge-card");
    if (wrongCard) wrongCard.remove();

    return null;
  };

  const ensureStyle = () => {
    if (document.getElementById("aisignal-logic-bridge-style")) return;

    const style = document.createElement("style");
    style.id = "aisignal-logic-bridge-style";
    style.textContent = `
      .aisignal-logic-bridge-card {
        width: 100%;
        max-width: 100%;
        margin: 12px 0;
        padding: 14px;
        border-radius: 20px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94));
        color: #e5e7eb;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
        box-sizing: border-box;
        overflow: hidden;
      }

      .aisignal-logic-bridge-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;
      }

      .aisignal-logic-bridge-title {
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #93c5fd;
        font-weight: 800;
      }

      .aisignal-logic-bridge-live {
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #86efac;
        border: 1px solid rgba(134, 239, 172, 0.28);
        border-radius: 999px;
        padding: 5px 8px;
        white-space: nowrap;
      }

      .aisignal-logic-bridge-main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .aisignal-logic-bridge-bias {
        padding: 12px;
        border-radius: 16px;
        background: rgba(15, 23, 42, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.16);
      }

      .aisignal-logic-bridge-label {
        font-size: 10px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 5px;
      }

      .aisignal-logic-bridge-value {
        font-size: 18px;
        font-weight: 900;
        color: #f8fafc;
      }

      .aisignal-logic-bridge-mini {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .aisignal-logic-bridge-mini > div {
        padding: 10px;
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.55);
        border: 1px solid rgba(148, 163, 184, 0.13);
      }

      .aisignal-logic-bridge-reason {
        margin-top: 10px;
        font-size: 12px;
        line-height: 1.55;
        color: #cbd5e1;
      }

      @media (max-width: 768px) {
        .aisignal-logic-bridge-card {
          margin: 10px 0;
          padding: 12px;
          border-radius: 18px;
        }

        .aisignal-logic-bridge-main {
          grid-template-columns: 1fr;
        }

        .aisignal-logic-bridge-value {
          font-size: 17px;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const ensureCard = () => {
    const root = findDetailRoot();
    if (!root) return null;

    let card = document.getElementById("aisignal-logic-bridge-card");
    if (card) return card;

    ensureStyle();

    card = document.createElement("section");
    card.id = "aisignal-logic-bridge-card";
    card.className = "aisignal-logic-bridge-card";
    card.innerHTML = `
      <div class="aisignal-logic-bridge-top">
        <div class="aisignal-logic-bridge-title">AiSignal Brain V1.1</div>
        <div class="aisignal-logic-bridge-live">Live Analysis</div>
      </div>

      <div class="aisignal-logic-bridge-main">
        <div class="aisignal-logic-bridge-bias">
          <div class="aisignal-logic-bridge-label">Bias</div>
          <div class="aisignal-logic-bridge-value" data-ai-bias>WAIT</div>
        </div>

        <div class="aisignal-logic-bridge-bias">
          <div class="aisignal-logic-bridge-label">Confidence</div>
          <div class="aisignal-logic-bridge-value" data-ai-confidence>--%</div>
        </div>
      </div>

      <div class="aisignal-logic-bridge-mini" style="margin-top:10px">
        <div>
          <div class="aisignal-logic-bridge-label">Trend</div>
          <div class="aisignal-logic-bridge-value" style="font-size:13px" data-ai-trend>Waiting</div>
        </div>
        <div>
          <div class="aisignal-logic-bridge-label">Risk</div>
          <div class="aisignal-logic-bridge-value" style="font-size:13px" data-ai-risk>--</div>
        </div>
        <div>
          <div class="aisignal-logic-bridge-label">RSI</div>
          <div class="aisignal-logic-bridge-value" style="font-size:13px" data-ai-rsi>--</div>
        </div>
        <div>
          <div class="aisignal-logic-bridge-label">Timeframe</div>
          <div class="aisignal-logic-bridge-value" style="font-size:13px" data-ai-tf>--</div>
        </div>
      </div>

      <div class="aisignal-logic-bridge-reason" data-ai-reason>
        Waiting for live candle analysis...
      </div>
    `;

    root.appendChild(card);
    return card;
  };

  const setText = (card, selector, value) => {
    const el = card.querySelector(selector);
    if (el) el.textContent = value;
  };

  const paint = (analysis) => {
    const card = ensureCard();
    if (!card) return;

    setText(card, "[data-ai-bias]", analysis.bias || "WAIT");
    setText(card, "[data-ai-confidence]", `${analysis.confidence ?? "--"}%`);
    setText(card, "[data-ai-trend]", analysis.trend || "Mixed");
    setText(card, "[data-ai-risk]", analysis.risk || "--");
    setText(card, "[data-ai-rsi]", analysis.rsi ?? "--");
    setText(card, "[data-ai-tf]", analysis.timeframe || "--");
    setText(card, "[data-ai-reason]", analysis.reason || "Waiting for clearer confirmation.");
  };

  const paintError = (message) => {
    const card = ensureCard();
    if (!card) return;

    setText(card, "[data-ai-bias]", "WAIT");
    setText(card, "[data-ai-confidence]", "--%");
    setText(card, "[data-ai-trend]", "Waiting");
    setText(card, "[data-ai-risk]", "--");
    setText(card, "[data-ai-rsi]", "--");
    setText(card, "[data-ai-tf]", "--");
    setText(card, "[data-ai-reason]", message);
  };

  let busy = false;

  const run = async () => {
    if (busy) return;
    busy = true;

    try {
      const card = ensureCard();
      if (!card) return;

      if (!window.AiSignalLogicV1?.analyze) {
        paintError("AiSignal Logic Brain V1 is not loaded yet.");
        return;
      }

      const symbol = detectSymbol();
      const timeframe = detectTimeframe();
      const interval = tfToBinance(timeframe);
      const candles = await fetchCandles(symbol, interval);

      const analysis = window.AiSignalLogicV1.analyze({
        symbol,
        timeframe,
        candles,
      });

      paint(analysis);
    } catch (err) {
      paintError("Live analysis is waiting for candle data. Scanner remains safe.");
    } finally {
      busy = false;
    }
  };

  setTimeout(run, 1200);
  setInterval(run, 8000);

  const observer = new MutationObserver(() => {
    if (!document.getElementById("aisignal-logic-bridge-card")) {
      setTimeout(run, 500);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  console.info("AiSignal Logic Bridge V1.1 ready.");
})();

/* AISIGNAL_BRIDGE_PLACEMENT_FIX_V1 */


/* AISIGNAL_SINGLE_PRICE_SOURCE_V1 */
(() => {
  if (window.__AISIGNAL_SINGLE_PRICE_SOURCE_V1__) return;
  window.__AISIGNAL_SINGLE_PRICE_SOURCE_V1__ = true;

  const SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
    "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "TONUSDT"
  ];

  const cache = {};

  const ownText = (el) => {
    if (!el) return "";
    return Array.from(el.childNodes || [])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent || "")
      .join("")
      .trim();
  };

  const isVisible = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  };

  const formatPrice = (symbol, price) => {
    const n = Number(price);
    if (!Number.isFinite(n)) return "--";

    if (n >= 1000) {
      return n.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    }

    if (n >= 1) {
      return n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
    }

    return n.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    });
  };

  const extractPrice = (payload, symbol) => {
    if (!payload) return null;

    if (Array.isArray(payload)) {
      const item = payload.find((x) => String(x?.symbol || "").toUpperCase() === symbol);
      return Number(item?.price || item?.lastPrice || item?.close);
    }

    const candidates = [
      payload.price,
      payload.lastPrice,
      payload.close,
      payload.data?.price,
      payload.data?.lastPrice,
      payload.data?.close,
      payload.result?.price,
      payload.result?.lastPrice,
      payload.ticker?.price,
      payload.ticker?.lastPrice,
    ];

    for (const v of candidates) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }

    return null;
  };

  const fetchJson = async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const fetchPrice = async (symbol) => {
    const urls = [
      `/api/binance/ticker/price?symbol=${symbol}`,
      `/api/binance?type=ticker&symbol=${symbol}`,
      `/api/binance?endpoint=ticker/price&symbol=${symbol}`,
      `/api/binance?path=/api/v3/ticker/price&symbol=${symbol}`,
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    ];

    let lastError = null;

    for (const url of urls) {
      try {
        const payload = await fetchJson(url);
        const price = extractPrice(payload, symbol);
        if (price && Number.isFinite(price)) return price;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("Price source not available");
  };

  const detectActiveSymbol = () => {
    const activeNodes = Array.from(
      document.querySelectorAll("button, [role='button'], [data-symbol], .active, .selected, .chip")
    ).filter(isVisible);

    for (const el of activeNodes) {
      const text = `${ownText(el)} ${el.textContent || ""} ${el.dataset?.symbol || ""}`.toUpperCase();
      const found = SYMBOLS.find((s) => text.includes(s));
      if (found) return found;
    }

    const body = document.body ? document.body.innerText.toUpperCase() : "";
    return SYMBOLS.find((s) => body.includes(s)) || "BTCUSDT";
  };

  const numericText = (txt) => {
    const t = String(txt || "").trim();
    if (!t || t.includes("%")) return false;
    if (/[a-zA-Z]/.test(t)) return false;
    return /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(t) || /^-?\d+(\.\d+)?$/.test(t);
  };

  const setOwnText = (el, value) => {
    if (!el) return;

    if (!el.childNodes || el.childNodes.length === 0) {
      el.textContent = value;
      return;
    }

    const textNode = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && String(n.textContent || "").trim());
    if (textNode) textNode.textContent = value;
    else el.textContent = value;
  };

  const findSymbolRoots = (symbol) => {
    const roots = new Set();

    const nodes = Array.from(
      document.querySelectorAll("button, [role='button'], [data-symbol], h1, h2, h3, h4, div, span, section, article")
    ).filter(isVisible);

    for (const el of nodes) {
      const text = `${ownText(el)} ${el.dataset?.symbol || ""}`.toUpperCase().trim();
      if (!text.includes(symbol)) continue;

      const root =
        el.closest(
          "[data-detail-room], [data-scanner-detail], .scanner-detail-room, .signal-detail-room, .detail-room, .scanner-card, .scanner-focus-card, .focus-card, .signal-card, .asset-card, .market-card, article, section"
        ) || el.parentElement;

      if (root && isVisible(root)) roots.add(root);
    }

    return Array.from(roots);
  };

  const updateRootPrice = (root, symbol, price) => {
    if (!root || !isVisible(root)) return;
    
    // IMMUNITY GUARD: Jangan biarkan price source merusak tatanan angka di Detail Room
    if (root.classList.contains("asfx-detail-room") || root.closest(".asfx-detail-room") || root.querySelector(".asfx-bridge-wrap")) {
      return;
    }

    const formatted = formatPrice(symbol, price);

    const preferred = Array.from(
      root.querySelectorAll(
        "[data-live-price], [data-price], .live-price, .price, .asset-price, .signal-price, .scanner-price"
      )
    ).filter((el) => isVisible(el) && !String(el.textContent || "").includes("%"));

    if (preferred.length) {
      preferred.slice(0, 3).forEach((el) => setOwnText(el, formatted));
      return;
    }

    const leaves = Array.from(root.querySelectorAll("*"))
      .filter((el) => isVisible(el))
      .filter((el) => {
        const text = ownText(el);
        if (!numericText(text)) return false;

        const lower = String(el.parentElement?.textContent || "").toLowerCase();
        if (/(confidence|risk|status|bias|rsi|timeframe|trend|momentum)/.test(lower) && !lower.includes(symbol.toLowerCase())) {
          return false;
        }

        return true;
      });

    leaves.slice(0, 3).forEach((el) => setOwnText(el, formatted));
  };

  const sync = async () => {
    const symbol = detectActiveSymbol();

    try {
      const price = await fetchPrice(symbol);
      cache[symbol] = {
        symbol,
        price,
        formatted: formatPrice(symbol, price),
        updatedAt: Date.now(),
      };

      window.dispatchEvent(
        new CustomEvent("aisignal:price", {
          detail: cache[symbol],
        })
      );

      const roots = findSymbolRoots(symbol);
      roots.forEach((root) => updateRootPrice(root, symbol, price));
    } catch (err) {
      console.warn("Single Price Source waiting:", err?.message || err);
    }
  };

  window.AiSignalPriceSourceV1 = {
    cache,
    fetchPrice,
    formatPrice,
    sync,
    version: "1.0.0",
  };

  setTimeout(sync, 800);
  setInterval(sync, 1200);
  document.addEventListener("click", () => setTimeout(sync, 250), true);

  console.info("AiSignal Single Price Source V1 ready.");
})();


/* ASFX_SCANNER_ACCESS_GUARD_BRIDGE_V1 */
(() => {
  if (window.__ASFX_SCANNER_ACCESS_GUARD_BRIDGE_V1__) return;
  window.__ASFX_SCANNER_ACCESS_GUARD_BRIDGE_V1__ = true;

  const emergencyAccess = () => {
    const q = new URLSearchParams(window.location.search);
    return q.get("owner") === "1" || q.get("admin") === "1";
  };

  const canAccessSignalRoom = () => {
    return (
      emergencyAccess() ||
      window.ASFXAccessGuard?.canOpenSignalRoom?.() === true
    );
  };

  try {
    const originalCanOpenSignalDetail =
      typeof canOpenSignalDetail === "function" ? canOpenSignalDetail : null;

    canOpenSignalDetail = function () {
      return canAccessSignalRoom() || !!originalCanOpenSignalDetail?.();
    };

    window.canOpenSignalDetail = canOpenSignalDetail;
  } catch (err) {}

  try {
    const originalShowVipGate =
      typeof showVipGate === "function" ? showVipGate : null;

    showVipGate = function () {
      if (canAccessSignalRoom() && typeof showSignalDetailRoom === "function") {
        return showSignalDetailRoom();
      }

      return originalShowVipGate?.apply(this, arguments);
    };

    window.showVipGate = showVipGate;
  } catch (err) {}

  document.addEventListener("click", (event) => {
    const btn = event.target?.closest?.("button, [role='button'], a");
    if (!btn) return;

    const text = String(btn.textContent || "").toLowerCase();
    const action = String(btn.dataset?.action || "").toLowerCase();

    const isDetailAction =
      action === "detail" ||
      text.includes("vip detail") ||
      text.includes("open detail") ||
      text.includes("signal room");

    if (!isDetailAction) return;
    if (!canAccessSignalRoom()) return;
    if (typeof showSignalDetailRoom !== "function") return;

    event.preventDefault();
    event.stopPropagation();
    showSignalDetailRoom();
  }, true);

  console.info("ASFX Scanner Access Guard Bridge V1 ready.");
})();

/* ASFX_SCANNER_DIRECT_ACCESS_FIX_V1 */

/* ASFX_SIGNAL_ROOM_TABS_FORCE_V2 */

/* ASFX_SIGNAL_ROOM_CONTENT_V1 */


/* ASFX_SMZ_ENGINE_FOUNDATION_V1 */
(() => {
  if (window.__ASFX_SMZ_ENGINE_FOUNDATION_V1__) return;
  window.__ASFX_SMZ_ENGINE_FOUNDATION_V1__ = true;

  const round = (value, digits = 2) => {
    const factor = 10 ** digits;
    return Math.round((Number(value) || 0) * factor) / factor;
  };

  const normalize = (candles = []) => {
    return (Array.isArray(candles) ? candles : [])
      .map((c) => {
        if (Array.isArray(c)) {
          return {
            o: Number(c[1]),
            h: Number(c[2]),
            l: Number(c[3]),
            c: Number(c[4]),
            v: Number(c[5] || 0),
          };
        }

        return {
          o: Number(c.o ?? c.open),
          h: Number(c.h ?? c.high),
          l: Number(c.l ?? c.low),
          c: Number(c.c ?? c.close),
          v: Number(c.v ?? c.volume ?? 0),
        };
      })
      .filter((c) =>
        Number.isFinite(c.o) &&
        Number.isFinite(c.h) &&
        Number.isFinite(c.l) &&
        Number.isFinite(c.c)
      );
  };

  const maxOf = (arr, key) => Math.max(...arr.map((x) => Number(x[key]) || 0));
  const minOf = (arr, key) => Math.min(...arr.map((x) => Number(x[key]) || 0));

  const buildSmzContext = (candles, base) => {
    const clean = normalize(candles);
    const recent = clean.slice(-30);
    const previous = clean.slice(-60, -30);
    const last = clean[clean.length - 1];

    if (!last || recent.length < 20) {
      return {
        bias: base.bias || "WAIT",
        confidenceBoost: -4,
        risk: base.risk || "Medium",
        structure: "Insufficient structure",
        zone: "Waiting candles",
        liquidity: "No sweep detected",
        imbalance: "No clear imbalance",
        phase: "Waiting",
        summary: "SMZ Engine masih menunggu candle yang cukup untuk membaca struktur, zona, dan liquidity.",
      };
    }

    const high = maxOf(recent, "h");
    const low = minOf(recent, "l");
    const prevHigh = previous.length ? maxOf(previous, "h") : high;
    const prevLow = previous.length ? minOf(previous, "l") : low;
    const range = Math.max(high - low, 1);
    const price = Number(base.price || last.c || 0);

    let structure = "Range / mixed";
    if (high > prevHigh && low > prevLow) structure = "Bullish structure";
    if (high < prevHigh && low < prevLow) structure = "Bearish structure";
    if (high > prevHigh && low < prevLow) structure = "Expansion / volatile structure";

    const demandHigh = low + range * 0.24;
    const supplyLow = high - range * 0.24;

    let zone = "Mid-range / wait zone";
    if (price <= demandHigh) zone = "Demand reaction zone";
    if (price >= supplyLow) zone = "Supply reaction zone";

    const prevRecent = recent.slice(0, -1);
    const pHigh = prevRecent.length ? maxOf(prevRecent, "h") : high;
    const pLow = prevRecent.length ? minOf(prevRecent, "l") : low;

    let liquidity = "No clear liquidity sweep";
    if (last.h > pHigh && last.c < pHigh) liquidity = "Buy-side liquidity sweep";
    if (last.l < pLow && last.c > pLow) liquidity = "Sell-side liquidity sweep";

    const a = clean[clean.length - 3];
    const b = clean[clean.length - 1];

    let imbalance = "No clear FVG / imbalance";
    if (a && b && b.l > a.h) imbalance = "Bullish imbalance / FVG";
    if (a && b && b.h < a.l) imbalance = "Bearish imbalance / FVG";

    let bias = base.bias || "WAIT";
    let boost = 0;
    let phase = "Observation";

    if (bias === "BUY" && structure.includes("Bearish")) {
      bias = "WAIT";
      boost -= 8;
      phase = "Structure conflict";
    } else if (bias === "SELL" && structure.includes("Bullish")) {
      bias = "WAIT";
      boost -= 8;
      phase = "Structure conflict";
    } else if (bias === "BUY" && zone.includes("Supply")) {
      bias = "WAIT";
      boost -= 6;
      phase = "Price near supply";
    } else if (bias === "SELL" && zone.includes("Demand")) {
      bias = "WAIT";
      boost -= 6;
      phase = "Price near demand";
    } else if (bias === "BUY" && structure.includes("Bullish")) {
      boost += 5;
      phase = "Bullish continuation watch";
    } else if (bias === "SELL" && structure.includes("Bearish")) {
      boost += 5;
      phase = "Bearish continuation watch";
    }

    let risk = base.risk || "Medium";
    if (structure.includes("Expansion")) risk = "High";
    if (zone.includes("Mid-range") && bias !== "WAIT") risk = risk === "High" ? "High" : "Medium";

    const summary =
      `${structure}. ${zone}. ${liquidity}. ${imbalance}. ` +
      `Bias ${bias}, risk ${risk}. Status: <b style="color:#fff">${smzText(smz.signalStatus, "Waiting Zone")}</b><br>${smzText(smz.statusDetail, "Tunggu reaksi candle bersih sebelum Final Signal Plan aktif.")}`;

    return {
      bias,
      confidenceBoost: boost,
      risk,
      structure,
      zone,
      liquidity,
      imbalance,
      phase,
      demandZone: `${round(low, 2)} - ${round(demandHigh, 2)}`,
      supplyZone: `${round(supplyLow, 2)} - ${round(high, 2)}`,
      summary,
    };
  };

  const install = () => {
    if (!window.AiSignalLogicV1?.analyze) return false;
    if (window.AiSignalLogicV1.__smzWrapped) return true;

    const originalAnalyze = window.AiSignalLogicV1.analyze.bind(window.AiSignalLogicV1);

    window.AiSignalLogicV1.analyze = (payload = {}) => {
      const base = originalAnalyze(payload) || {};
      const smz = buildSmzContext(payload.candles || [], base);

      const baseConfidence = Number(base.confidence ?? 50);
      const confidence = Math.max(42, Math.min(88, Math.round(baseConfidence + smz.confidenceBoost)));

      const result = {
        ...base,
        bias: smz.bias || base.bias || "WAIT",
        confidence,
        risk: smz.risk || base.risk || "Medium",
        smzPhase: smz.phase,
        structure: smz.structure,
        zoneState: smz.zone,
        demandZone: smz.demandZone,
        supplyZone: smz.supplyZone,
        liquidity: smz.liquidity,
        imbalance: smz.imbalance,
        reason: `${base.reason || "Reading candle context."} SMZ Engine: ${smz.summary}`,
      };

      window.__ASFX_LAST_SMZ_ANALYSIS__ = result;
      return result;
    };

    window.AiSignalLogicV1.__smzWrapped = true;
    window.AiSignalSMZEngineV1 = {
      version: "1.0.0",
      last: () => window.__ASFX_LAST_SMZ_ANALYSIS__ || null,
    };

    console.info("ASFX SMZ Engine Foundation V1 ready.");
    return true;
  };

  if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 30) clearInterval(timer);
    }, 300);
  }
})();

/* ASFX_SMZ_OUTPUT_BRIDGE_V1 */


/* ASFX_SMZ_STATUS_FLOW_V1 */
(() => {
  if (window.__ASFX_SMZ_STATUS_FLOW_V1__) return;
  window.__ASFX_SMZ_STATUS_FLOW_V1__ = true;

  const text = (v) => String(v || "").toLowerCase();

  const getStatus = (a = {}) => {
    const bias = String(a.bias || "WAIT").toUpperCase();
    const risk = String(a.risk || "Medium");
    const structure = text(a.structure);
    const zone = text(a.zoneState);
    const liquidity = text(a.liquidity);
    const imbalance = text(a.imbalance);

    let signalStatus = "Waiting Zone";
    let statusDetail = "Menunggu harga masuk area yang lebih valid sebelum signal plan aktif.";

    const conflict =
      (bias === "BUY" && structure.includes("bearish")) ||
      (bias === "SELL" && structure.includes("bullish"));

    const inZone =
      zone.includes("demand") ||
      zone.includes("supply");

    const hasSweep =
      liquidity.includes("sweep");

    const hasImbalance =
      imbalance.includes("imbalance") ||
      imbalance.includes("fvg");

    if (bias === "WAIT") {
      signalStatus = "Waiting Confirmation";
      statusDetail = "Bias belum cukup bersih. Tunggu struktur dan candle reaction yang lebih jelas.";
    }

    if (conflict) {
      signalStatus = "Invalid / Conflict";
      statusDetail = "Bias dan struktur sedang konflik. Hindari entry sampai struktur kembali selaras.";
    } else if (risk === "High") {
      signalStatus = "Risk Watch";
      statusDetail = "Volatilitas atau posisi harga berisiko tinggi. Tunggu validasi ulang sebelum entry.";
    } else if (inZone && bias !== "WAIT") {
      signalStatus = "Zone Touched";
      statusDetail = "Harga berada dekat zona penting. Tunggu reaksi candle bersih untuk validasi.";
    } else if (bias !== "WAIT" && (hasSweep || hasImbalance || structure.includes("bullish") || structure.includes("bearish"))) {
      signalStatus = "Signal Preview";
      statusDetail = "Konteks awal mendukung arah, tapi detail entry tetap menunggu validasi zona dan candle.";
    }

    return {
      signalStatus,
      statusDetail,
    };
  };

  const install = () => {
    if (!window.AiSignalLogicV1?.analyze) return false;
    if (window.AiSignalLogicV1.__smzStatusWrapped) return true;

    const previousAnalyze = window.AiSignalLogicV1.analyze.bind(window.AiSignalLogicV1);

    window.AiSignalLogicV1.analyze = (payload = {}) => {
      const result = previousAnalyze(payload) || {};
      const flow = getStatus(result);

      const finalResult = {
        ...result,
        signalStatus: flow.signalStatus,
        statusDetail: flow.statusDetail,
        reason: `${result.reason || "Reading market context."} Status Flow: ${flow.signalStatus}. ${flow.statusDetail}`,
      };

      window.__ASFX_LAST_SMZ_ANALYSIS__ = finalResult;
      return finalResult;
    };

    window.AiSignalLogicV1.__smzStatusWrapped = true;
    window.AiSignalSMZStatusFlowV1 = {
      version: "1.0.0",
      evaluate: getStatus,
      last: () => window.__ASFX_LAST_SMZ_ANALYSIS__ || null,
    };

    console.info("ASFX SMZ Status Flow V1 ready.");
    return true;
  };

  if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 30) clearInterval(timer);
    }, 300);
  }
})();

/* ASFX_SIGNAL_PLAN_READINESS_V1 */

/* ASFX_SIGNAL_ROOM_DATA_HYDRATOR_V1 */
(() => {
  if (window.__ASFX_SIGNAL_ROOM_DATA_HYDRATOR_V1__) return;
  window.__ASFX_SIGNAL_ROOM_DATA_HYDRATOR_V1__ = true;

  const esc = (value, fallback = "-") => {
    const text = String(value ?? fallback);
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const pick = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "-";
  };

  const latest = () => {
    try {
      const api = window.ASFXPlanPacketV1;
      const p = api && typeof api.latest === "function" ? api.latest() : null;
      
      // Buat storage map global jika belum ada untuk memisahkan paket data per tipe
      if (!window.__ASFX_ROUTING_PACKETS_MAP__) {
        window.__ASFX_ROUTING_PACKETS_MAP__ = {};
      }
      
      // Amankan dan petakan paket data yang masuk berdasarkan Pair dan Timeframe aslinya
      if (p) {
        const pPair = String(p.pair || p.symbol || "BTCUSDT").toUpperCase();
        const pTf = String(p.timeframe || p.tf || "15m").toLowerCase();
        window.__ASFX_ROUTING_PACKETS_MAP__[`${pPair}_${pTf}`] = p;
      }
      
      // Deteksi timeframe dan pair yang SEDANG DILIHAT oleh user di layar Detail Room saat ini
      const currentRoom = ctx();
      const activeKey = `${currentRoom.pair}_${currentRoom.tf}`;
      
      // Kembalikan paket data yang murni milik timeframe aktif tersebut agar tidak saling tindih
      return window.__ASFX_ROUTING_PACKETS_MAP__[activeKey] || p;
    } catch (_) {
      return null;
    }
  };

  const confidenceText = (d) => {
    const n = Number(d.confidence);
    if (!Number.isFinite(n)) return "Waiting";
    return `${Math.round(n)}%`;
  };

  const statusText = (d) => pick(d.signalStatus, d.status, "Waiting Zone");
  const detailText = (d) => pick(d.statusDetail, d.reason, "Menunggu candle dan struktur yang lebih bersih sebelum final signal plan aktif.");

  const panelKey = (d, tab) => [
    tab,
    d.pair,
    d.symbol,
    d.bias,
    d.confidence,
    d.risk,
    d.structure,
    d.zoneState,
    d.liquidity,
    d.imbalance,
    d.signalStatus,
    d.statusDetail
  ].join("|");

  const setPanel = (selector, key, html) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (!el || el.dataset.asfxHydratorKey === key) return;
      el.dataset.asfxHydratorKey = key;
      /* Legacy hydrator writer disabled; compact renderer owns Signal/Risk/AI panels. */
    });
  };

  const hydrate = () => {
    const d = latest();
    if (!d || Object.keys(d).length === 0) return false;

    const pair = esc(pick(d.pair, d.symbol, "Market"));
    const bias = esc(pick(d.bias, "WAIT"));
    const risk = esc(pick(d.risk, "Medium"));
    const confidence = esc(confidenceText(d));
    const status = esc(statusText(d));
    const detail = esc(detailText(d));
    const structure = esc(pick(d.structure, "Waiting structure"));
    const zone = esc(pick(d.zoneState, d.zone, "Waiting zone"));
    const demand = esc(pick(d.demandZone, "Waiting candle range"));
    const supply = esc(pick(d.supplyZone, "Waiting candle range"));
    const liquidity = esc(pick(d.liquidity, "No clear liquidity sweep"));
    const imbalance = esc(pick(d.imbalance, "No clear FVG / imbalance"));
    const phase = esc(pick(d.smzPhase, d.phase, "Observation"));
    const setupType = esc(pick(d.setupType, "Setup Watch"));
    const activeZone = esc(pick(d.activeZone, d.entryZone, d.zoneState, d.zone, "Waiting zone"));
    const distanceToZone = esc(pick(d.distanceToZoneText, d.distanceToZone, "Calculating"));
    const entryZone = esc(pick(d.entryZone, d.activeZone, "Waiting zone"));
    const stopLossGuide = esc(pick(d.stopLossGuide, d.slGuide, "Waiting invalidation level"));
    const tp1Guide = esc(pick(d.tp1Guide, "Waiting target area"));
    const tp2Guide = esc(pick(d.tp2Guide, "Waiting extended target"));
    const invalidationLevel = esc(pick(d.invalidationLevel, "Waiting zone invalidation"));
    const riskNotice = esc(pick(d.riskNotice, "Educational analysis only. Execution remains user responsibility."));

    const isWaitingText = (value) => /waiting|calculating|menunggu|observation|belum|tunggu/i.test(String(value || ""));
    const rawBias = String(pick(d.bias, "WAIT")).toUpperCase();
    const rawRisk = String(pick(d.risk, "Medium")).toLowerCase();
    const rawStatus = String(pick(d.signalStatus, d.status, "Waiting Zone")).toUpperCase();

    const hasActionableEntry =
      !isWaitingText(entryZone) &&
      !isWaitingText(activeZone) &&
      entryZone !== "-" &&
      activeZone !== "-";

    const isBuyBias = rawBias.includes("BUY") || rawBias.includes("BULL");
    const isSellBias = rawBias.includes("SELL") || rawBias.includes("BEAR");
    const isHighRisk = rawRisk.includes("high");

    const rawActionStatus = String(pick(d.actionStatus, "")).toUpperCase();
    const decisionSeed = `${rawStatus} ${rawActionStatus} ${setupType}`.toLowerCase();

    const isNoTradeDecision =
      /no trade|middle range|invalid|stale|expired/i.test(decisionSeed) ||
      rawBias === "WAIT";

    const isZoneWatchDecision =
      /zone watch|zone touched|waiting zone|touched/i.test(decisionSeed);

    const isSetupWatchDecision =
      /setup watch|risk watch|risk alert|observation/i.test(decisionSeed);

    const normalizedDecisionStatus = window.asfxCoreStatusV1({
      signalStatus: rawStatus,
      actionStatus: rawActionStatus,
      setupType,
      bias: rawBias,
      risk: rawRisk,
      confidence,
      activeZone,
      entryZone,
      price: pick(d.price, d.currentPrice, d.livePrice, "")
    });

    const canShowExecutionPlan =
      hasActionableEntry &&
      window.asfxCanExecuteV1(normalizedDecisionStatus) &&
      !isNoTradeDecision &&
      !isHighRisk &&
      (isBuyBias || isSellBias);

    let decisionStatus = "NO TRADE";
    let decisionAction = "Tidak ada eksekusi. Harga belum berada di zona valid.";

    if (canShowExecutionPlan && isBuyBias) {
      decisionStatus = "OFFICIAL BUY";
      decisionAction = "Signal aktif. Eksekusi hanya di dalam entry zone.";
    } else if (canShowExecutionPlan && isSellBias) {
      decisionStatus = "OFFICIAL SELL";
      decisionAction = "Signal aktif. Eksekusi hanya di dalam entry zone.";
    } else if (isNoTradeDecision || normalizedDecisionStatus === "NO TRADE") {
      decisionStatus = "NO TRADE";
      decisionAction = "Tidak ada eksekusi. Sistem menahan entry sampai zona valid.";
    } else if (isZoneWatchDecision || normalizedDecisionStatus === "ZONE WATCH") {
      decisionStatus = "ZONE WATCH";
      decisionAction = "Zona terbaca. Entry, SL, dan TP menunggu Signal Active.";
    } else if (isSetupWatchDecision || normalizedDecisionStatus === "SETUP WATCH" || isBuyBias || isSellBias || hasActionableEntry) {
      decisionStatus = "SETUP WATCH";
      decisionAction = "Setup terbaca, tapi Entry, SL, dan TP menunggu Signal Active.";
    }

    const showExecutionPlan =
      decisionStatus === "OFFICIAL BUY" ||
      decisionStatus === "OFFICIAL SELL";

    const decisionPlanLabel = showExecutionPlan ? "Execution Plan" : "Signal Watch Plan";
    const decisionEntry = showExecutionPlan ? entryZone : "Pending - watch zone only";
    const decisionSl = showExecutionPlan ? stopLossGuide : "Pending - waiting Signal Active";
    const decisionTp1 = showExecutionPlan ? tp1Guide : "Pending - waiting Signal Active";
    const decisionTp2 = showExecutionPlan ? tp2Guide : "Pending - waiting Signal Active";
    const decisionInvalidation = showExecutionPlan ? invalidationLevel : "Pending - waiting Signal Active";

    setPanel(
      '[data-asfx-bridge-rendered="risk"]',
      panelKey(d, "risk"),
      `
        <div class="asfx-bridge-kicker">Risk Guard</div>
        <div class="asfx-bridge-title">${risk} Risk - ${pair}</div>
        <div class="asfx-bridge-sub">Risk Guard membaca volatilitas, posisi harga terhadap zona, struktur, dan validasi setup.</div>
        <br>
        <b style="color:#fff">Risk Validation</b><br>
        Bias: <b style="color:#fff">${bias}</b><br>
        Confidence: <b style="color:#fff">${confidence}</b><br>
        Structure: <b style="color:#fff">${structure}</b><br>
        Zone: <b style="color:#fff">${zone}</b><br>
        Demand Area: <b style="color:#fff">${demand}</b><br>
        Supply Area: <b style="color:#fff">${supply}</b><br>
        Liquidity: <b style="color:#fff">${liquidity}</b><br>
        Imbalance: <b style="color:#fff">${imbalance}</b>
      `
    );

    setPanel(
      '[data-asfx-bridge-rendered="chat"]',
      panelKey(d, "chat"),
      `
        <div class="asfx-bridge-kicker">AI Insight</div>
        <div class="asfx-bridge-title">${status}</div>
        <div class="asfx-bridge-sub">AI Insight menerjemahkan hasil SMZ Engine menjadi bahasa trader yang mudah dipahami.</div>
        <br>
        Status: <b style="color:#fff">${status}</b><br>
        Phase: <b style="color:#fff">${phase}</b><br>
        Bias: <b style="color:#fff">${bias}</b><br>
        Risk: <b style="color:#fff">${risk}</b><br>
        <br>
        <b style="color:#fff">Insight</b><br>
        ${detail}
      `
    );

    setPanel(
      '[data-asfx-bridge-rendered="signal"]',
      panelKey(d, "signal"),
      `
        <div class="asfx-bridge-kicker">Signal</div>
        <div class="asfx-bridge-title">${decisionStatus}</div>
        <div class="asfx-bridge-sub">${decisionAction}</div>

        <br>
        <b style="color:#fff">${decisionPlanLabel}</b><br>
        Pair: <b style="color:#fff">${pair}</b><br>
        Setup: <b style="color:#fff">${setupType}</b><br>
        Entry: <b style="color:#fff">${decisionEntry}</b><br>
        SL: <b style="color:#fff">${decisionSl}</b><br>
        TP1: <b style="color:#fff">${decisionTp1}</b><br>
        TP2: <b style="color:#fff">${decisionTp2}</b><br>
        <br>
        Risk: <b style="color:#fff">${risk}</b><br>
        Confidence: <b style="color:#fff">${confidence}</b><br>
        Invalidation: <b style="color:#fff">${decisionInvalidation}</b><br><br>
        <small>${riskNotice}</small>
      `
    );

    return true;
  };

  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      hydrate();
    }, 120);
  };

  window.ASFXSignalRoomDataHydratorV1 = {
    version: "1.0.0",
    hydrate,
    latest
  };

  /* ASFX_DISABLE_LEGACY_HYDRATOR_UI_V1: setTimeout(hydrate, 800) disabled */
  /* ASFX_DISABLE_LEGACY_HYDRATOR_UI_V1: setTimeout(hydrate, 1800) disabled */
  /* ASFX_DISABLE_LEGACY_HYDRATOR_UI_V1: setInterval(hydrate, 3000) disabled */

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });

  console.info("ASFX Signal Room Data Hydrator V1 ready.");
})();


/* ASFX_SMZ_ZONE_WATCH_SLTP_PLAN_V1 */
(() => {
  if (window.__ASFX_SMZ_ZONE_WATCH_SLTP_PLAN_V1__) return;
  window.__ASFX_SMZ_ZONE_WATCH_SLTP_PLAN_V1__ = true;

  const round = (value, digits = 2) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    const f = 10 ** digits;
    return Math.round(n * f) / f;
  };

  const fmt = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  const normalizeCandles = (candles = []) => {
    return (Array.isArray(candles) ? candles : [])
      .map((c) => {
        if (Array.isArray(c)) {
          return {
            o: Number(c[1]),
            h: Number(c[2]),
            l: Number(c[3]),
            c: Number(c[4]),
            v: Number(c[5] || 0)
          };
        }
        return {
          o: Number(c?.o ?? c?.open),
          h: Number(c?.h ?? c?.high),
          l: Number(c?.l ?? c?.low),
          c: Number(c?.c ?? c?.close),
          v: Number(c?.v ?? c?.volume ?? 0)
        };
      })
      .filter((c) =>
        Number.isFinite(c.o) &&
        Number.isFinite(c.h) &&
        Number.isFinite(c.l) &&
        Number.isFinite(c.c)
      );
  };

  const parseZone = (text) => {
    const nums = String(text || "").match(/[\d,.]+/g);
    if (!nums || nums.length < 2) return null;
    const values = nums
      .slice(0, 2)
      .map((x) => Number(String(x).replace(/,/g, "")))
      .filter(Number.isFinite);
    if (values.length < 2) return null;
    return {
      low: Math.min(values[0], values[1]),
      high: Math.max(values[0], values[1])
    };
  };

  const zoneText = (z) => {
    if (!z) return "Waiting zone";
    return `${fmt(z.low)} - ${fmt(z.high)}`;
  };

  const distanceToZone = (price, zone) => {
    if (!Number.isFinite(price) || !zone) {
      return { value: 0, percent: 0, inside: false, text: "Calculating" };
    }

    if (price >= zone.low && price <= zone.high) {
      return { value: 0, percent: 0, inside: true, text: "Inside active zone" };
    }

    const value = price < zone.low ? zone.low - price : price - zone.high;
    const percent = price ? Math.abs(value / price) * 100 : 0;

    return {
      value,
      percent,
      inside: false,
      text: `${round(percent, 2)}% from active zone`
    };
  };

  const buildPlan = (payload = {}, base = {}) => {
    const candles = normalizeCandles(payload.candles || []);
    const recent = candles.slice(-60);
    const last = recent[recent.length - 1];
    const price = Number(base.price ?? payload.price ?? last?.c ?? 0);

    const highs = recent.map((c) => c.h).filter(Number.isFinite);
    const lows = recent.map((c) => c.l).filter(Number.isFinite);
    const high = highs.length ? Math.max(...highs) : price;
    const low = lows.length ? Math.min(...lows) : price;
    const range = Math.max(high - low, price * 0.002, 1);
    const buffer = Math.max(range * 0.08, price * 0.001);

    const demandFromBase = parseZone(base.demandZone);
    const supplyFromBase = parseZone(base.supplyZone);

    const demandZone = demandFromBase || {
      low,
      high: low + range * 0.24
    };

    const supplyZone = supplyFromBase || {
      low: high - range * 0.24,
      high
    };

    const rawBias = String(base.bias || "WAIT").toUpperCase();
    const demandDistance = distanceToZone(price, demandZone);
    const supplyDistance = distanceToZone(price, supplyZone);

    let activeSide = "WAIT";
    if (rawBias === "BUY") activeSide = "DEMAND";
    else if (rawBias === "SELL") activeSide = "SUPPLY";
    else activeSide = demandDistance.percent <= supplyDistance.percent ? "DEMAND" : "SUPPLY";

    const activeZone = activeSide === "SUPPLY" ? supplyZone : demandZone;
    const activeDistance = distanceToZone(price, activeZone);

    let statusFlow = "Setup Watch";
    if (activeDistance.inside) statusFlow = "Zone Touched";
    else if (activeDistance.percent <= 0.35) statusFlow = "Approaching Zone";
    else if (rawBias === "WAIT") statusFlow = "Market Watch";

    const setupType =
      rawBias === "BUY" ? "BUY Watch" :
      rawBias === "SELL" ? "SELL Watch" :
      activeSide === "DEMAND" ? "Demand Watch" : "Supply Watch";

    let stopLossGuide;
    let tp1Guide;
    let tp2Guide;
    let invalidationLevel;

    if (activeSide === "SUPPLY") {
      const sl = activeZone.high + buffer;
      const tp1 = Math.max(low, price - range * 0.38);
      const tp2 = Math.max(low, price - range * 0.68);
      stopLossGuide = `Above supply invalidation ${fmt(sl)}`;
      invalidationLevel = `Candle close above ${fmt(sl)}`;
      tp1Guide = fmt(tp1);
      tp2Guide = fmt(tp2);
    } else {
      const sl = activeZone.low - buffer;
      const tp1 = Math.min(high, price + range * 0.38);
      const tp2 = Math.min(high, price + range * 0.68);
      stopLossGuide = `Below demand invalidation ${fmt(sl)}`;
      invalidationLevel = `Candle close below ${fmt(sl)}`;
      tp1Guide = fmt(tp1);
      tp2Guide = fmt(tp2);
    }

    const confidenceBase = Number(base.confidence ?? 50);
    const zoneBonus = activeDistance.inside ? 8 : activeDistance.percent <= 0.35 ? 5 : 0;
    const confidence = Math.max(35, Math.min(90, Math.round(confidenceBase + zoneBonus)));

    return {
      currentPrice: price ? fmt(price) : "-",
      setupType,
      activeSide,
      activeZone: zoneText(activeZone),
      entryZone: zoneText(activeZone),
      demandZone: zoneText(demandZone),
      supplyZone: zoneText(supplyZone),
      distanceToZone: round(activeDistance.percent, 2),
      distanceToZoneText: activeDistance.text,
      stopLossGuide,
      tp1Guide,
      tp2Guide,
      invalidationLevel,
      statusFlow,
      signalStatus: statusFlow,
      statusDetail:
        statusFlow === "Zone Touched"
          ? "Harga sudah berada di zona aktif. Tunggu candle reaction bersih sebelum eksekusi."
          : statusFlow === "Approaching Zone"
            ? "Harga mulai mendekati zona aktif. Siapkan validasi candle dan risk plan."
            : "Setup sudah terdeteksi lebih awal. Sistem memantau jarak harga ke zona aktif.",
      confidence,
      riskNotice: "Educational analysis only. SL/TP adalah panduan sistem; eksekusi tetap tanggung jawab user."
    };
  };

  const install = () => {
    if (!window.AiSignalLogicV1?.analyze) return false;
    if (window.AiSignalLogicV1.__zoneWatchSltpWrapped) return true;

    const previousAnalyze = window.AiSignalLogicV1.analyze.bind(window.AiSignalLogicV1);

    window.AiSignalLogicV1.analyze = (payload = {}) => {
      const base = previousAnalyze(payload) || {};
      const plan = buildPlan(payload, base);
      const result = {
        ...base,
        ...plan,
        reason: `${base.reason || "Reading market context."} Zone Watch: ${plan.setupType}. Active zone ${plan.activeZone}. Distance ${plan.distanceToZoneText}.`
      };

      window.__ASFX_LAST_SMZ_ANALYSIS__ = result;
      return result;
    };

    window.AiSignalLogicV1.__zoneWatchSltpWrapped = true;
    window.AiSignalSMZZoneWatchSLTPV1 = {
      version: "1.0.0",
      buildPlan,
      last: () => window.__ASFX_LAST_SMZ_ANALYSIS__ || null
    };

    console.info("ASFX SMZ Zone Watch SLTP Plan V1 ready.");
    return true;
  };

  if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 30) clearInterval(timer);
    }, 300);
  }
})();


/* ASFX_SMZ_CANDLE_READER_V1 */
(function(){
  if (window.__ASFX_SMZ_CANDLE_READER_V1__) return;
  window.__ASFX_SMZ_CANDLE_READER_V1__ = true;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const num = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const fmt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("en-US", { maximumFractionDigits: n > 100 ? 1 : 4 });
  };
  const rangeText = (z) => z ? `${fmt(z.low)} - ${fmt(z.high)}` : "Calculating";

  function pickCandles(payload){
    if (!payload) return [];
    if (Array.isArray(payload.candles)) return payload.candles;
    if (Array.isArray(payload.klines)) return payload.klines;
    if (Array.isArray(payload.data?.candles)) return payload.data.candles;
    if (Array.isArray(payload.data?.klines)) return payload.data.klines;
    return [];
  }

  function normalizeCandles(input){
    return (Array.isArray(input) ? input : []).map((x, i) => {
      if (Array.isArray(x)) {
        return {
          t: x[0] || i,
          o: num(x[1]),
          h: num(x[2]),
          l: num(x[3]),
          c: num(x[4]),
          v: num(x[5])
        };
      }
      return {
        t: x.t || x.time || x.openTime || i,
        o: num(x.o ?? x.open),
        h: num(x.h ?? x.high),
        l: num(x.l ?? x.low),
        c: num(x.c ?? x.close),
        v: num(x.v ?? x.volume)
      };
    }).filter(c => c.o && c.h && c.l && c.c && c.h >= c.l);
  }

  function calcAtr(candles, period = 14){
    if (candles.length < period + 2) return 0;
    const recent = candles.slice(-period - 1);
    const trs = [];
    for (let i = 1; i < recent.length; i += 1) {
      const c = recent[i];
      const p = recent[i - 1];
      trs.push(Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c)));
    }
    return trs.reduce((a,b) => a + b, 0) / Math.max(1, trs.length);
  }

  function findSwings(candles){
    const swings = [];
    for (let i = 2; i < candles.length - 2; i += 1) {
      const c = candles[i];
      if (c.h > candles[i-1].h && c.h > candles[i-2].h && c.h >= candles[i+1].h && c.h >= candles[i+2].h) {
        swings.push({ type: "high", index: i, price: c.h });
      }
      if (c.l < candles[i-1].l && c.l < candles[i-2].l && c.l <= candles[i+1].l && c.l <= candles[i+2].l) {
        swings.push({ type: "low", index: i, price: c.l });
      }
    }
    return swings;
  }

  function makeZone(price, width){
    if (!price) return null;
    const w = Math.max(width || price * 0.0015, price * 0.0008);
    return { low: price - w, high: price + w };
  }

  function detectFvg(candles){
    for (let i = candles.length - 1; i >= 2; i -= 1) {
      const a = candles[i - 2];
      const b = candles[i];
      if (b.l > a.h) return `Bullish FVG ${fmt(a.h)} - ${fmt(b.l)}`;
      if (b.h < a.l) return `Bearish FVG ${fmt(b.h)} - ${fmt(a.l)}`;
    }
    return "No clean imbalance";
  }

  function zoneDistance(price, zone, bias, atr){
    if (!zone || !price) return { state: "Waiting Zone", text: "Waiting valid zone", pct: null };
    if (price >= zone.low && price <= zone.high) {
      return { state: "Zone Touched", text: "Price inside active zone", pct: 0 };
    }
    const target = bias === "SELL" ? zone.low : zone.high;
    const dist = Math.abs(price - target);
    const pct = price ? (dist / price) * 100 : 99;
    const nearPct = Math.max(0.22, Math.min(0.55, ((atr || 0) / price) * 100 * 1.2));
    const relation = bias === "SELL"
      ? (price < zone.low ? "below supply" : "above supply")
      : (price > zone.high ? "above demand" : "below demand");
    return {
      state: pct <= nearPct ? "Zone Watch" : "Waiting Zone",
      text: `${pct.toFixed(2)}% ${relation} (${fmt(price)} <-’ ${fmt(target)})`,
      pct
    };
  }

  function buildCandleReader(payload, base){
    const candles = normalizeCandles(pickCandles(payload));
    if (candles.length < 25) {
      return {
        structure: base.structure || "Waiting confirmation",
        demandZone: base.demandZone || "Calculating",
        supplyZone: base.supplyZone || "Calculating",
        liquidity: base.liquidity || "Waiting confirmation",
        imbalance: base.imbalance || "Waiting",
        signalStatus: base.signalStatus || "Waiting Zone",
        statusDetail: base.statusDetail || "Market data masih terbatas. Menunggu candle history lebih banyak.",
        reason: `${base.reason || "Reading market context."} Candle Reader menunggu minimal candle history.`
      };
    }

    const recent = candles.slice(-80);
    const last = recent[recent.length - 1];
    const price = num(payload?.price, last.c);
    const atr = calcAtr(recent, 14);
    const atrPct = price ? (atr / price) * 100 : 0;
    const swings = findSwings(recent);
    const highs = swings.filter(s => s.type === "high").slice(-3);
    const lows = swings.filter(s => s.type === "low").slice(-3);

    const firstClose = recent[0].c;
    const candleBias = price >= firstClose ? "BUY" : "SELL";
    const baseBias = String(base.bias || candleBias || "WAIT").toUpperCase();
    const bias = baseBias === "WAIT" ? candleBias : baseBias;

    let structure = "Structure forming";
    if (highs.length >= 2 && lows.length >= 2) {
      const h1 = highs[highs.length - 2].price;
      const h2 = highs[highs.length - 1].price;
      const l1 = lows[lows.length - 2].price;
      const l2 = lows[lows.length - 1].price;
      const hh = h2 > h1;
      const hl = l2 > l1;
      const lh = h2 < h1;
      const ll = l2 < l1;
      if (hh && hl) structure = "Bullish HH/HL structure";
      else if (lh && ll) structure = "Bearish LH/LL structure";
      else if (hh && ll) structure = "Expansion / volatile structure";
      else structure = "Mixed structure";
    }

    const swingHigh = highs.length ? highs[highs.length - 1].price : Math.max(...recent.slice(-30).map(c => c.h));
    const swingLow = lows.length ? lows[lows.length - 1].price : Math.min(...recent.slice(-30).map(c => c.l));
    const width = Math.max(atr * 0.55, price * 0.0012);
    const supply = makeZone(swingHigh, width);
    const demand = makeZone(swingLow, width);

    const demandDist = zoneDistance(price, demand, "BUY", atr);
    const supplyDist = zoneDistance(price, supply, "SELL", atr);
    const demandScore = Number(demandDist.percent ?? 999);
    const supplyScore = Number(supplyDist.percent ?? 999);

    const activeName = supplyScore <= demandScore ? "Supply" : "Demand";
    const activeZone = activeName === "Supply" ? supply : demand;
    const dist = activeName === "Supply" ? supplyDist : demandDist;

    const zoneBiasConflict =
      (bias === "BUY" && activeName === "Supply") ||
      (bias === "SELL" && activeName === "Demand");

    const liquidity = bias === "SELL"
      ? `Buy-side liquidity near ${fmt(swingHigh)}; sell-side target near ${fmt(swingLow)}`
      : `Sell-side liquidity near ${fmt(swingLow)}; buy-side target near ${fmt(swingHigh)}`;

    const imbalance = detectFvg(recent);

    let risk = "Medium";
    if (atrPct > 1.8) risk = "High";
    else if (atrPct < 0.55) risk = "Low";

    const structureAligned =
      (bias === "SELL" && /Bearish|Mixed|Expansion/i.test(structure)) ||
      (bias === "BUY" && /Bullish|Mixed|Expansion/i.test(structure));

    let confidence = num(base.confidence ?? base.score, 50);
    confidence += structureAligned ? 8 : -4;
    confidence += dist.state === "Zone Touched" ? 10 : dist.state === "Zone Watch" ? 6 : 0;
    confidence += /FVG/i.test(imbalance) ? 4 : 0;
    confidence += risk === "Low" ? 3 : risk === "High" ? -7 : 0;
    confidence = Math.round(clamp(confidence, 35, 88));

    const phase = dist.state === "Zone Touched" ? "Confirmation" : dist.state === "Zone Watch" ? "Zone Watch" : "Observation";
    const signalStatus = zoneBiasConflict
      ? "Zone Watch"
      : dist.state === "Zone Touched" ? "Zone Touched" : dist.state;
    const statusDetail = zoneBiasConflict
      ? bias === "BUY"
        ? "BUY bias terdeteksi, tapi harga lebih dekat ke supply/resistance. Tunggu breakout bersih lalu pullback/retest; jangan buy langsung ke resistance."
        : "SELL bias terdeteksi, tapi harga lebih dekat ke demand/support. Tunggu breakdown bersih lalu pullback/retest; jangan sell langsung ke support."
      : dist.state === "Zone Touched"
        ? "Harga sudah menyentuh active zone. Tunggu rejection/confirmation candle sebelum eksekusi."
        : dist.state === "Zone Watch"
          ? `Harga mendekati ${activeName.toLowerCase()} zone. Tunggu reaksi candle bersih.`
          : `Belum masuk active zone. ${dist.text}.`;

    const pad = Math.max(atr * 0.35, price * 0.0009);
    let stopLossGuide = "Waiting invalidation level";
    let tp1Guide = "Waiting target area";
    let tp2Guide = "Waiting extended target";
    if (bias === "SELL") {
      stopLossGuide = `Above supply invalidation ${fmt(supply.high + pad)}`;
      tp1Guide = `First target near ${fmt(Math.max(demand.high, price - atr * 1.25))}`;
      tp2Guide = `Extended target near ${fmt(Math.min(demand.low, price - atr * 2.2))}`;
    } else {
      stopLossGuide = `Below demand invalidation ${fmt(demand.low - pad)}`;
      tp1Guide = `First target near ${fmt(Math.min(supply.low, price + atr * 1.25))}`;
      tp2Guide = `Extended target near ${fmt(Math.max(supply.high, price + atr * 2.2))}`;
    }

    return {
      bias,
      risk,
      confidence,
      score: confidence,
      currentPrice: fmt(price),
      smzPhase: phase,
      phase,
      structure,
      zoneBiasConflict,
      activeZoneSide: activeName,
      zoneState: `${activeName} ${signalStatus}`,
      activeZone: `${activeName} ${rangeText(activeZone)}`,
      demandZone: rangeText(demand),
      supplyZone: rangeText(supply),
      liquidity,
      imbalance,
      distanceToZoneText: dist.text,
      signalStatus,
      statusDetail,
      setupType: signalStatus,
      stopLossGuide,
      tp1Guide,
      tp2Guide,
      reason: `${base.reason || "Reading market context."} Candle Reader: ${structure}. ${activeName} zone ${rangeText(activeZone)}. ${dist.text}.`
    };
  }

  function install(){
    if (!window.AiSignalLogicV1 || typeof window.AiSignalLogicV1.analyze !== "function") return false;
    if (window.AiSignalLogicV1.__smzCandleReaderWrapped) return true;

    const previousAnalyze = window.AiSignalLogicV1.analyze.bind(window.AiSignalLogicV1);

    window.AiSignalLogicV1.analyze = (payload = {}) => {
      const base = previousAnalyze(payload) || {};
      try {
        const extra = buildCandleReader(payload, base);
        const result = Object.assign({}, base, extra);
        window.__ASFX_LAST_SMZ_ANALYSIS__ = result;
        window.AiSignalSMZCandleReaderV1 = {
          last: () => window.__ASFX_LAST_SMZ_ANALYSIS__ || result
        };
        if (window.AiSignalSMZEngineV1) {
          window.AiSignalSMZEngineV1.last = () => window.__ASFX_LAST_SMZ_ANALYSIS__ || result;
        }
        return result;
      } catch (err) {
        console.warn("ASFX SMZ Candle Reader V1 fallback:", err);
        return base;
      }
    };

    window.AiSignalLogicV1.__smzCandleReaderWrapped = true;
    return true;
  }

  if (!install()) setTimeout(install, 800);
  console.info("ASFX SMZ Candle Reader V1 ready.");
})();


/* ASFX_SMZ_DETAIL_CANDLE_BRIDGE_V1 */
(function(){
  if (window.__ASFX_SMZ_DETAIL_CANDLE_BRIDGE_V1__) return;
  window.__ASFX_SMZ_DETAIL_CANDLE_BRIDGE_V1__ = true;

  const num = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fmt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("en-US", { maximumFractionDigits: n > 100 ? 1 : 4 });
  };

  function normalize(input){
    return (Array.isArray(input) ? input : []).map((x, i) => {
      if (Array.isArray(x)) {
        return {
          t: x[0] || i,
          o: num(x[1]),
          h: num(x[2]),
          l: num(x[3]),
          c: num(x[4]),
          v: num(x[5])
        };
      }

      return {
        t: x.t || x.time || x.openTime || i,
        o: num(x.o ?? x.open),
        h: num(x.h ?? x.high),
        l: num(x.l ?? x.low),
        c: num(x.c ?? x.close),
        v: num(x.v ?? x.volume)
      };
    }).filter(c => c.o && c.h && c.l && c.c && c.h >= c.l);
  }

  window.__ASFX_SMZ_ACCEPT_DETAIL_CANDLES__ = function(payload = {}){
    try {
      const candles = normalize(payload.candles || []);
      if (!candles.length || candles.length < 20) return null;

      const last = candles[candles.length - 1];
      const pair = payload.pair || payload.symbol || "BTCUSDT";
      const timeframe = payload.timeframe || payload.tf || "15m";
      const price = num(payload.price, last.c);

      if (!window.AiSignalLogicV1 || typeof window.AiSignalLogicV1.analyze !== "function") {
        return null;
      }

      const result = window.AiSignalLogicV1.analyze({
        symbol: pair,
        pair,
        timeframe,
        tf: timeframe,
        candles,
        price,
        source: "detail-chart-candle-bridge"
      }) || {};

      const merged = Object.assign({}, result, {
        pair,
        symbol: pair,
        timeframe,
        tf: timeframe,
        currentPrice: result.currentPrice || fmt(price),
        candleCount: candles.length,
        source: "detail-chart-candle-bridge"
      });

      window.__ASFX_LAST_SMZ_ANALYSIS__ = merged;
      window.__ASFX_LAST_SIGNAL_ANALYSIS__ = Object.assign(
        {},
        window.__ASFX_LAST_SIGNAL_ANALYSIS__ || {},
        merged
      );

      window.AiSignalSMZDetailCandleBridgeV1 = {
        last: () => window.__ASFX_LAST_SMZ_ANALYSIS__ || merged
      };

      return merged;
    } catch (err) {
      console.warn("ASFX Detail Candle Bridge V1 fallback:", err);
      return null;
    }
  };

  console.info("ASFX SMZ Detail Candle Bridge V1 ready.");
})();


/* ASFX_SINGLE_CANDLE_SOURCE_V1 */
(function(){
  if (window.__ASFX_SINGLE_CANDLE_SOURCE_V1_READY__) return;
  window.__ASFX_SINGLE_CANDLE_SOURCE_V1_READY__ = true;

  const num = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fmt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("en-US", { maximumFractionDigits: n > 100 ? 1 : 4 });
  };

  function normalize(candles){
    return (Array.isArray(candles) ? candles : []).map((x, i) => {
      if (Array.isArray(x)) {
        return {
          t: x[0] || i,
          o: num(x[1]),
          h: num(x[2]),
          l: num(x[3]),
          c: num(x[4]),
          v: num(x[5])
        };
      }

      return {
        t: x.t || x.time || x.openTime || i,
        o: num(x.o ?? x.open),
        h: num(x.h ?? x.high),
        l: num(x.l ?? x.low),
        c: num(x.c ?? x.close),
        v: num(x.v ?? x.volume)
      };
    }).filter(c => c.o && c.h && c.l && c.c && c.h >= c.l);
  }

  window.__ASFX_SINGLE_CANDLE_SOURCE_V1__ = function(payload = {}){
    try {
      const candles = normalize(payload.candles || []);
      if (!candles.length || candles.length < 20) return null;

      const last = candles[candles.length - 1];
      const pair = payload.pair || payload.symbol || "BTCUSDT";
      const timeframe = payload.timeframe || payload.tf || "15m";
      const price = num(payload.price, last.c);

      if (!window.AiSignalLogicV1 || typeof window.AiSignalLogicV1.analyze !== "function") {
        return null;
      }

      const result = window.AiSignalLogicV1.analyze({
        symbol: pair,
        pair,
        timeframe,
        tf: timeframe,
        candles,
        price,
        source: "single-candle-source-v1"
      }) || {};

      const merged = Object.assign({}, result, {
        pair,
        symbol: pair,
        timeframe,
        tf: timeframe,
        currentPrice: result.currentPrice || fmt(price),
        candleCount: candles.length,
        source: "single-candle-source-v1"
      });

      window.__ASFX_LAST_SMZ_ANALYSIS__ = merged;
      window.__ASFX_LAST_SIGNAL_ANALYSIS__ = Object.assign(
        {},
        window.__ASFX_LAST_SIGNAL_ANALYSIS__ || {},
        merged
      );

      window.ASFX_SINGLE_CANDLE_SOURCE_V1_LAST = merged;

      if (window.AiSignalSMZEngineV1) {
        window.AiSignalSMZEngineV1.last = () => window.__ASFX_LAST_SMZ_ANALYSIS__ || merged;
      }

      window.dispatchEvent?.(new CustomEvent("asfx:smz:update", { detail: merged }));

      return merged;
    } catch (err) {
      console.warn("ASFX Single Candle Source V1 fallback:", err);
      return null;
    }
  };

  console.info("ASFX Single Candle Source V1 ready.");
})();


/* ASFX_SMZ_DIRECT_PACKET_V1 */
(function(){
  if (window.__ASFX_SMZ_DIRECT_PACKET_V1__) return;
  window.__ASFX_SMZ_DIRECT_PACKET_V1__ = true;

  const num = (v, f = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : f;
  };

  const fmt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("en-US", { maximumFractionDigits: n > 100 ? 1 : 4 });
  };

  const avg = (arr) => arr.length ? arr.reduce((a,b) => a + b, 0) / arr.length : 0;

  function normalize(input){
    return (Array.isArray(input) ? input : []).map((x, i) => {
      if (Array.isArray(x)) {
        return { t:x[0]||i, o:num(x[1]), h:num(x[2]), l:num(x[3]), c:num(x[4]), v:num(x[5]) };
      }
      return {
        t: x.t || x.time || x.openTime || i,
        o: num(x.o ?? x.open),
        h: num(x.h ?? x.high),
        l: num(x.l ?? x.low),
        c: num(x.c ?? x.close),
        v: num(x.v ?? x.volume)
      };
    }).filter(c => c.o && c.h && c.l && c.c && c.h >= c.l);
  }

  function atr(candles, period = 14){
    if (candles.length < period + 2) return 0;
    const r = candles.slice(-period - 1);
    const out = [];
    for (let i = 1; i < r.length; i++) {
      const c = r[i], p = r[i - 1];
      out.push(Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c)));
    }
    return avg(out);
  }

  function swings(candles){
    const out = [];
    for (let i = 2; i < candles.length - 2; i++) {
      const c = candles[i];
      if (c.h > candles[i-1].h && c.h > candles[i-2].h && c.h >= candles[i+1].h && c.h >= candles[i+2].h) {
        out.push({ type:"high", index:i, price:c.h });
      }
      if (c.l < candles[i-1].l && c.l < candles[i-2].l && c.l <= candles[i+1].l && c.l <= candles[i+2].l) {
        out.push({ type:"low", index:i, price:c.l });
      }
    }
    return out;
  }

  function fvg(candles){
    for (let i = candles.length - 1; i >= 2; i--) {
      const a = candles[i - 2];
      const b = candles[i];
      if (b.l > a.h) return `Bullish FVG ${fmt(a.h)} - ${fmt(b.l)}`;
      if (b.h < a.l) return `Bearish FVG ${fmt(b.h)} - ${fmt(a.l)}`;
    }
    return "No clean imbalance";
  }

  function zoneAround(price, width){
    return { low: price - width, high: price + width };
  }

  function zoneText(z){
    return z ? `${fmt(z.low)} - ${fmt(z.high)}` : "Calculating";
  }

  function distance(price, zone){
    if (!zone || !price) return { inside:false, pct:99, text:"Waiting valid zone" };
    if (price >= zone.low && price <= zone.high) return { inside:true, pct:0, text:"Price inside active zone" };
    const target = price > zone.high ? zone.high : zone.low;
    const pct = Math.abs(price - target) / price * 100;
    return { inside:false, pct, text:`${pct.toFixed(2)}% from active zone (${fmt(price)} <-’ ${fmt(target)})` };
  }

  function buildPacket(payload = {}){
    const candles = normalize(payload.candles || []);
    const pair = payload.pair || payload.symbol || "BTCUSDT";
    const timeframe = payload.timeframe || payload.tf || "15m";

    if (candles.length < 25) {
      return {
        pair, symbol: pair, timeframe, tf: timeframe,
        bias: "WAIT",
        risk: "Medium",
        confidence: 15,
        score: 15,
        structure: "Waiting confirmation",
        zoneState: "Waiting Zone",
        demandZone: "Calculating",
        supplyZone: "Calculating",
        liquidity: "Waiting confirmation",
        imbalance: "Waiting",
        signalStatus: "Waiting Zone",
        statusDetail: "Menunggu candle history lebih lengkap.",
        reason: "SMZ menunggu candle history lebih lengkap.",
        source: "smz-direct-packet-v1"
      };
    }

    const recent = candles.slice(-80);
    const last = recent[recent.length - 1];
    const price = num(payload.price, last.c);
    const a = atr(recent);
    const atrPct = price ? a / price * 100 : 0;

    const fast = avg(recent.slice(-9).map(c => c.c));
    const slow = avg(recent.slice(-21).map(c => c.c));

    let bias = "WAIT";
    if (fast > slow * 1.0004) bias = "BUY";
    if (fast < slow * 0.9996) bias = "SELL";

    const sw = swings(recent);
    const highs = sw.filter(s => s.type === "high").slice(-3);
    const lows = sw.filter(s => s.type === "low").slice(-3);

    const swingHigh = highs.length ? highs[highs.length - 1].price : Math.max(...recent.slice(-30).map(c => c.h));
    const swingLow = lows.length ? lows[lows.length - 1].price : Math.min(...recent.slice(-30).map(c => c.l));

    let structure = "Range / mixed structure";
    if (highs.length >= 2 && lows.length >= 2) {
      const h1 = highs[highs.length - 2].price;
      const h2 = highs[highs.length - 1].price;
      const l1 = lows[lows.length - 2].price;
      const l2 = lows[lows.length - 1].price;

      if (h2 > h1 && l2 > l1) structure = "Bullish HH/HL structure";
      else if (h2 < h1 && l2 < l1) structure = "Bearish LH/LL structure";
      else if (h2 > h1 && l2 < l1) structure = "Expansion / volatile structure";
      else structure = "Corrective / mixed structure";
    }

    if (bias === "WAIT") {
      if (/Bullish/i.test(structure)) bias = "BUY";
      else if (/Bearish/i.test(structure)) bias = "SELL";
    }

    const width = Math.max(a * 0.55, price * 0.0012);
    const demand = zoneAround(swingLow, width);
    const supply = zoneAround(swingHigh, width);

    const demandDist = distance(price, demand);
    const supplyDist = distance(price, supply);
    const demandScore = Number(demandDist.pct ?? 999);
    const supplyScore = Number(supplyDist.pct ?? 999);

    const activeName = supplyScore <= demandScore ? "Supply" : "Demand";
    const activeZone = activeName === "Supply" ? supply : demand;
    const dist = activeName === "Supply" ? supplyDist : demandDist;

    const zoneBiasConflict =
      (bias === "BUY" && activeName === "Supply") ||
      (bias === "SELL" && activeName === "Demand");

    let signalStatus = "Waiting Zone";
    if (dist.inside) signalStatus = "Zone Touched";
    else if (dist.pct <= 0.45) signalStatus = "Zone Watch";
    if (zoneBiasConflict) signalStatus = "Zone Watch";

    let risk = "Medium";
    if (atrPct > 1.8) risk = "High";
    if (atrPct < 0.55) risk = "Low";

    const imbalance = fvg(recent);

    const aligned =
      (bias === "BUY" && /Bullish|mixed|Expansion/i.test(structure)) ||
      (bias === "SELL" && /Bearish|mixed|Expansion/i.test(structure));

    let confidence = 52;
    confidence += aligned ? 10 : -6;
    confidence += signalStatus === "Zone Touched" ? 12 : signalStatus === "Zone Watch" ? 7 : 0;
    confidence += /FVG/i.test(imbalance) ? 4 : 0;
    confidence += risk === "Low" ? 4 : risk === "High" ? -8 : 0;
    confidence = Math.max(35, Math.min(88, Math.round(confidence)));

    let stopLossGuide = "Waiting invalidation level";
    let tp1Guide = "Waiting target area";
    let tp2Guide = "Waiting extended target";

    if (bias === "SELL") {
      stopLossGuide = `Above supply invalidation ${fmt(supply.high + a * 0.35)}`;
      tp1Guide = `First target near demand ${fmt(demand.high)}`;
      tp2Guide = `Extended target near ${fmt(demand.low)}`;
    } else if (bias === "BUY") {
      stopLossGuide = `Below demand invalidation ${fmt(demand.low - a * 0.35)}`;
      tp1Guide = `First target near supply ${fmt(supply.low)}`;
      tp2Guide = `Extended target near ${fmt(supply.high)}`;
    }

    const liquidity = `Buy-side liquidity near ${fmt(swingHigh)}  -  Sell-side liquidity near ${fmt(swingLow)}`;

    const statusDetail = zoneBiasConflict
      ? bias === "BUY"
        ? "BUY bias terdeteksi, tapi harga lebih dekat ke supply/resistance. Tunggu breakout bersih lalu pullback/retest; jangan buy langsung ke resistance."
        : "SELL bias terdeteksi, tapi harga lebih dekat ke demand/support. Tunggu breakdown bersih lalu pullback/retest; jangan sell langsung ke support."
      : signalStatus === "Zone Touched"
        ? "Harga sudah menyentuh active zone. Tunggu rejection / confirmation candle sebelum eksekusi."
        : signalStatus === "Zone Watch"
          ? `Harga mendekati ${activeName.toLowerCase()} zone. Tunggu reaksi candle bersih.`
          : `Harga belum masuk active zone. ${dist.text}.`;

    return {
      pair,
      symbol: pair,
      timeframe,
      tf: timeframe,
      bias,
      risk,
      confidence,
      score: confidence,
      currentPrice: fmt(price),
      structure,
      zoneBiasConflict,
      activeZoneSide: activeName,
      zoneState: `${activeName} ${signalStatus}`,
      zone: `${activeName} ${signalStatus}`,
      activeZone: `${activeName} ${zoneText(activeZone)}`,
      demandZone: zoneText(demand),
      supplyZone: zoneText(supply),
      liquidity,
      imbalance,
      smzPhase: signalStatus === "Zone Touched" ? "Confirmation" : signalStatus === "Zone Watch" ? "Zone Watch" : "Observation",
      phase: signalStatus === "Zone Touched" ? "Confirmation" : signalStatus === "Zone Watch" ? "Zone Watch" : "Observation",
      signalStatus,
      statusDetail,
      distanceToZoneText: dist.text,
      setupType: signalStatus,
      stopLossGuide,
      tp1Guide,
      tp2Guide,
      reason: `Direct SMZ membaca ${candles.length} candle. ${structure}. ${activeName} zone ${zoneText(activeZone)}. ${dist.text}.`,
      candleCount: candles.length,
      source: "smz-direct-packet-v1"
    };
  }

  window.__ASFX_SINGLE_CANDLE_SOURCE_V1__ = function(payload = {}){
    try {
      const packet = buildPacket(payload);
      window.__ASFX_LAST_SMZ_ANALYSIS__ = packet;
      window.__ASFX_LAST_SIGNAL_ANALYSIS__ = Object.assign(
        {},
        window.__ASFX_LAST_SIGNAL_ANALYSIS__ || {},
        packet
      );
      window.ASFX_SMZ_DIRECT_PACKET_V1_LAST = packet;

      if (window.AiSignalSMZEngineV1) {
        window.AiSignalSMZEngineV1.last = () => window.__ASFX_LAST_SMZ_ANALYSIS__ || packet;
      }

      window.dispatchEvent && window.dispatchEvent(new CustomEvent("asfx:smz:update", { detail: packet }));
      return packet;
    } catch (err) {
      console.warn("ASFX SMZ Direct Packet V1 fallback:", err);
      return null;
    }
  };

  console.info("ASFX SMZ Direct Packet V1 ready.");
})();


/* ASFX_SIGNAL_ROOM_STABLE_POLISH_V3 */
(function(){
  if (window.__ASFX_SIGNAL_ROOM_STABLE_POLISH_V3__) return;
  window.__ASFX_SIGNAL_ROOM_STABLE_POLISH_V3__ = true;

  function inject(){
    if (document.getElementById("asfx-signal-room-stable-polish-v3")) return;

    const style = document.createElement("style");
    style.id = "asfx-signal-room-stable-polish-v3";
    style.textContent = `
      @media (max-width: 720px) {
        .asfx-bridge-wrap {
          padding: 18px !important;
          border-radius: 24px !important;
          gap: 14px !important;
        }

        .asfx-bridge-head {
          padding: 18px !important;
          border-radius: 22px !important;
          margin-bottom: 14px !important;
        }

        .asfx-bridge-kicker {
          font-size: 11px !important;
          letter-spacing: 4px !important;
          margin-bottom: 8px !important;
        }

        .asfx-bridge-title {
          font-size: clamp(30px, 9vw, 42px) !important;
          line-height: 1.04 !important;
          margin-bottom: 8px !important;
        }

        .asfx-bridge-sub {
          font-size: 15px !important;
          line-height: 1.45 !important;
          opacity: .78 !important;
        }

        .asfx-bridge-grid {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 10px !important;
          margin: 12px 0 !important;
        }

        .asfx-bridge-mini {
          min-height: 96px !important;
          padding: 14px !important;
          border-radius: 18px !important;
        }

        .asfx-bridge-mini small {
          display: block !important;
          font-size: 12px !important;
          line-height: 1.2 !important;
          margin-bottom: 8px !important;
          opacity: .7 !important;
        }

        .asfx-bridge-mini b {
          font-size: clamp(20px, 6vw, 28px) !important;
          line-height: 1.08 !important;
          word-break: normal !important;
        }

        .asfx-bridge-box {
          padding: 16px !important;
          border-radius: 20px !important;
          margin-top: 10px !important;
          font-size: 15.5px !important;
          line-height: 1.55 !important;
        }

        .asfx-bridge-box b {
          font-size: 16px !important;
        }

        .asfx-bridge-lock {
          padding: 16px !important;
          border-radius: 20px !important;
          margin-top: 10px !important;
          font-size: 14.5px !important;
          line-height: 1.45 !important;
        }

        .asfx-bridge-box summary {
          list-style-position: inside !important;
          font-size: 16px !important;
          line-height: 1.4 !important;
        }

        [data-detail-tab] {
          min-height: 46px !important;
          padding: 0 18px !important;
          border-radius: 999px !important;
          font-size: 14px !important;
          white-space: nowrap !important;
        }

        .asfx-detail-room,
        .signal-detail-room,
        [data-signal-detail-room] {
          padding-bottom: 110px !important;
        }
      }

      @media (max-width: 390px) {
        .asfx-bridge-wrap {
          padding: 15px !important;
        }

        .asfx-bridge-grid {
          gap: 8px !important;
        }

        .asfx-bridge-mini {
          padding: 12px !important;
          min-height: 88px !important;
        }

        .asfx-bridge-mini b {
          font-size: 21px !important;
        }

        .asfx-bridge-box {
          padding: 14px !important;
          font-size: 14.5px !important;
        }

        [data-detail-tab] {
          padding: 0 14px !important;
          font-size: 13px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }

  setTimeout(inject, 800);
  console.info("ASFX Signal Room Stable Polish V3 ready.");
})();


/* ASFX_SIGNAL_ROOM_STABLE_POLISH_V3_1 */
(function(){
  if (window.__ASFX_SIGNAL_ROOM_STABLE_POLISH_V3_1__) return;
  window.__ASFX_SIGNAL_ROOM_STABLE_POLISH_V3_1__ = true;

  function inject(){
    if (document.getElementById("asfx-signal-room-stable-polish-v3-1")) return;

    const style = document.createElement("style");
    style.id = "asfx-signal-room-stable-polish-v3-1";
    style.textContent = `
      @media (max-width: 720px) {
        .asfx-bridge-wrap {
          padding: 13px !important;
          border-radius: 20px !important;
        }

        .asfx-bridge-head {
          padding: 13px 14px !important;
          border-radius: 18px !important;
          margin-bottom: 10px !important;
        }

        .asfx-bridge-kicker {
          font-size: 9px !important;
          letter-spacing: 2.6px !important;
          margin-bottom: 6px !important;
        }

        .asfx-bridge-title {
          font-size: clamp(23px, 6.4vw, 30px) !important;
          line-height: 1.05 !important;
          margin-bottom: 6px !important;
        }

        .asfx-bridge-sub {
          font-size: 12.5px !important;
          line-height: 1.35 !important;
        }

        .asfx-bridge-grid {
          gap: 7px !important;
          margin: 9px 0 !important;
        }

        .asfx-bridge-mini {
          min-height: 70px !important;
          padding: 10px !important;
          border-radius: 16px !important;
        }

        .asfx-bridge-mini small {
          font-size: 10px !important;
          margin-bottom: 6px !important;
        }

        .asfx-bridge-mini b {
          font-size: clamp(15px, 4.3vw, 19px) !important;
          line-height: 1.08 !important;
          word-break: normal !important;
          overflow-wrap: normal !important;
        }

        .asfx-bridge-mini:nth-child(3) b {
          font-size: clamp(14px, 3.9vw, 17px) !important;
          line-height: 1.12 !important;
        }

        .asfx-bridge-box {
          padding: 12px 13px !important;
          border-radius: 17px !important;
          margin-top: 8px !important;
          font-size: 13px !important;
          line-height: 1.42 !important;
        }

        .asfx-bridge-box b {
          font-size: 13.5px !important;
          line-height: 1.35 !important;
        }

        .asfx-bridge-lock {
          padding: 12px 13px !important;
          border-radius: 17px !important;
          margin-top: 8px !important;
          font-size: 12.5px !important;
          line-height: 1.35 !important;
        }

        .asfx-bridge-box summary {
          font-size: 13.5px !important;
        }

        [data-detail-tab] {
          min-height: 39px !important;
          padding: 0 13px !important;
          font-size: 12.5px !important;
        }
      }

      @media (max-width: 390px) {
        .asfx-bridge-title {
          font-size: 25px !important;
        }

        .asfx-bridge-mini {
          min-height: 66px !important;
          padding: 9px !important;
        }

        .asfx-bridge-mini b {
          font-size: 16px !important;
        }

        .asfx-bridge-mini:nth-child(3) b {
          font-size: 14.5px !important;
        }

        .asfx-bridge-box {
          font-size: 12.5px !important;
          padding: 11px 12px !important;
        }

        .asfx-bridge-box b {
          font-size: 13px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }

  setTimeout(inject, 500);
  console.info("ASFX Signal Room Stable Polish V3.1 ready.");
})();


/* ASFX_SIGNAL_ROOM_STABLE_POLISH_V3_2 */
(function(){
  if (window.__ASFX_SIGNAL_ROOM_STABLE_POLISH_V3_2__) return;
  window.__ASFX_SIGNAL_ROOM_STABLE_POLISH_V3_2__ = true;

  function inject(){
    if (document.getElementById("asfx-signal-room-stable-polish-v3-2")) return;

    const style = document.createElement("style");
    style.id = "asfx-signal-room-stable-polish-v3-2";
    style.textContent = `
      @media (max-width: 720px) {
        .asfx-bridge-wrap {
          padding: 11px !important;
          border-radius: 18px !important;
        }

        .asfx-bridge-head {
          padding: 12px !important;
          border-radius: 16px !important;
          margin-bottom: 8px !important;
        }

        .asfx-bridge-kicker {
          font-size: 8.5px !important;
          letter-spacing: 2.2px !important;
          margin-bottom: 5px !important;
        }

        .asfx-bridge-title {
          font-size: 24px !important;
          line-height: 1.06 !important;
          margin-bottom: 5px !important;
        }

        .asfx-bridge-sub {
          font-size: 11.5px !important;
          line-height: 1.3 !important;
        }

        .asfx-bridge-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 7px !important;
          margin: 8px 0 !important;
        }

        .asfx-bridge-mini {
          min-height: 62px !important;
          padding: 8px !important;
          border-radius: 14px !important;
        }

        .asfx-bridge-mini small {
          font-size: 9.5px !important;
          line-height: 1.1 !important;
          margin-bottom: 5px !important;
        }

        .asfx-bridge-mini b {
          font-size: 15px !important;
          line-height: 1.12 !important;
          word-break: keep-all !important;
          overflow-wrap: normal !important;
          hyphens: none !important;
        }

        .asfx-bridge-mini:nth-child(2) b,
        .asfx-bridge-mini:nth-child(3) b {
          font-size: 13.5px !important;
          line-height: 1.12 !important;
        }

        .asfx-bridge-box {
          padding: 10px 11px !important;
          border-radius: 15px !important;
          margin-top: 7px !important;
          font-size: 12px !important;
          line-height: 1.38 !important;
        }

        .asfx-bridge-box b {
          font-size: 12.5px !important;
          line-height: 1.3 !important;
        }

        .asfx-bridge-lock {
          padding: 10px 11px !important;
          border-radius: 15px !important;
          margin-top: 7px !important;
          font-size: 11.5px !important;
          line-height: 1.32 !important;
        }

        .asfx-bridge-box summary {
          font-size: 12.5px !important;
          line-height: 1.3 !important;
        }

        [data-detail-tab] {
          min-height: 37px !important;
          padding: 0 12px !important;
          font-size: 12px !important;
        }
      }

      @media (max-width: 390px) {
        .asfx-bridge-title {
          font-size: 22px !important;
        }

        .asfx-bridge-sub {
          font-size: 11px !important;
        }

        .asfx-bridge-mini {
          min-height: 58px !important;
          padding: 7px !important;
        }

        .asfx-bridge-mini b {
          font-size: 14px !important;
        }

        .asfx-bridge-mini:nth-child(2) b,
        .asfx-bridge-mini:nth-child(3) b {
          font-size: 12.5px !important;
        }

        .asfx-bridge-box {
          font-size: 11.5px !important;
          padding: 9px 10px !important;
        }

        .asfx-bridge-box b {
          font-size: 12px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }

  setTimeout(inject, 500);
  console.info("ASFX Signal Room Stable Polish V3.2 ready.");
})();


/* ASFX_SIGNAL_PACKET_STANDARD_V1 */
(function(){
  if (window.__ASFX_SIGNAL_PACKET_STANDARD_V1_READY__) return;
  window.__ASFX_SIGNAL_PACKET_STANDARD_V1_READY__ = true;

  const clean = (v, fallback = "-") => {
    if (v === undefined || v === null || v === "") return fallback;
    return String(v);
  };

  const num = (v, fallback = 0) => {
    const n = Number(String(v).replace("%", ""));
    return Number.isFinite(n) ? n : fallback;
  };

  function standardizeSignalPacket(raw = {}){
    const pair = clean(raw.pair || raw.symbol, "BTCUSDT");
    const timeframe = clean(raw.timeframe || raw.tf, "15m");
    const bias = clean(raw.bias, "WAIT").toUpperCase();
    const risk = clean(raw.risk, "Medium");
    const confidence = Math.round(num(raw.confidence ?? raw.score, 0));

    const packet = {
      version: "SignalPacketStandardV1",

      pair,
      symbol: pair,
      timeframe,
      tf: timeframe,

      price: raw.price || raw.currentPrice || raw.livePrice || "-",
      currentPrice: raw.currentPrice || raw.price || "-",

      bias,
      risk,
      confidence,
      score: confidence,

      structure: clean(raw.structure, "Structure reading"),
      demandZone: clean(raw.demandZone, "Calculating"),
      supplyZone: clean(raw.supplyZone, "Calculating"),
      activeZone: clean(raw.activeZone || raw.zone || raw.zoneState, "Waiting valid zone"),
      zoneState: clean(raw.zoneState || raw.zone || raw.signalStatus, "Waiting Zone"),
      distanceToZone: clean(raw.distanceToZone || raw.distanceToZoneText, "Waiting distance"),
      distanceToZoneText: clean(raw.distanceToZoneText || raw.distanceToZone, "Waiting distance"),

      liquidity: clean(raw.liquidity, "Waiting confirmation"),
      imbalance: clean(raw.imbalance || raw.fvg, "Waiting"),

      signalStatus: clean(raw.signalStatus || raw.setupType, "Waiting Zone"),
      setupType: clean(raw.setupType || raw.signalStatus, "Waiting Zone"),
      phase: clean(raw.phase || raw.smzPhase, "Observation"),
      smzPhase: clean(raw.smzPhase || raw.phase, "Observation"),

      slGuide: clean(raw.slGuide || raw.stopLossGuide || raw.sl || raw.stopLoss || raw.invalidationLevel, "Waiting invalidation level"),
      stopLossGuide: clean(raw.stopLossGuide || raw.slGuide || raw.sl || raw.stopLoss || raw.invalidationLevel, "Waiting invalidation level"),
      tp1Guide: clean(raw.tp1Guide || raw.tp1 || raw.takeProfit1, "Waiting target area"),
      tp2Guide: clean(raw.tp2Guide || raw.tp2 || raw.takeProfit2, "Waiting extended target"),

      reason: clean(raw.reason || raw.statusDetail, "Reading market context."),
      statusDetail: clean(raw.statusDetail || raw.reason, "Reading market context."),

      candleCount: raw.candleCount || 0,
      source: clean(raw.source, "asfx-smz-engine"),
      accessLevel: raw.accessLevel || "vip",
      publicMode: !!raw.publicMode,

      lastUpdated: new Date().toISOString()
    };

    packet.actionStatus =
      /high/i.test(packet.risk) ? "Risk Alert" :
      /touched/i.test(packet.signalStatus) ? "Zone Touched" :
      /watch/i.test(packet.signalStatus) ? "Zone Watch" :
      /active/i.test(packet.signalStatus) ? "Signal Active" :
      "Observation";

    packet.publicPreview = {
      pair: packet.pair,
      timeframe: packet.timeframe,
      bias: packet.bias,
      risk: packet.risk,
      signalStatus: packet.signalStatus,
      activeZone: packet.activeZone,
      confidence: packet.confidence,
      locked: true
    };

    packet.vipDetail = {
      entryGuide: packet.activeZone,
      slGuide: packet.stopLossGuide,
      tp1Guide: packet.tp1Guide || packet.tp1 || packet.takeProfit1,
      tp2Guide: packet.tp2Guide || packet.tp2 || packet.takeProfit2,
      structure: packet.structure,
      liquidity: packet.liquidity,
      imbalance: packet.imbalance,
      reason: packet.reason
    };

    return packet;
  }

  window.ASFX_STANDARDIZE_SIGNAL_PACKET_V1 = standardizeSignalPacket;

  function publish(raw){
    const packet = standardizeSignalPacket(raw || window.__ASFX_LAST_SMZ_ANALYSIS__ || {});
    window.__ASFX_LAST_SIGNAL_PACKET_V1__ = packet;
    window.__ASFX_LAST_SMZ_ANALYSIS__ = Object.assign({}, raw || {}, packet);
    window.__ASFX_LAST_SIGNAL_ANALYSIS__ = Object.assign(
      {},
      window.__ASFX_LAST_SIGNAL_ANALYSIS__ || {},
      packet
    );
    return packet;
  }

  window.ASFX_PUBLISH_SIGNAL_PACKET_V1 = publish;

  function wrapSingleCandleSource(){
    const rawFn = window.__ASFX_SINGLE_CANDLE_SOURCE_V1__;
    if (typeof rawFn !== "function") return false;
    if (rawFn.__asfxPacketStandardWrapped) return true;

    const wrapped = function(payload = {}){
      const result = rawFn(payload);
      return publish(result || {});
    };

    wrapped.__asfxPacketStandardWrapped = true;
    window.__ASFX_SINGLE_CANDLE_SOURCE_V1__ = wrapped;
    return true;
  }

  if (!wrapSingleCandleSource()) setTimeout(wrapSingleCandleSource, 800);
  setTimeout(() => publish(window.__ASFX_LAST_SMZ_ANALYSIS__ || {}), 1200);

  console.info("ASFX Signal Packet Standard V1 ready.");
})();


/* ASFX_SIGNAL_STATUS_SYSTEM_V1 */
(function(){
  if (window.__ASFX_SIGNAL_STATUS_SYSTEM_V1_READY__) return;
  window.__ASFX_SIGNAL_STATUS_SYSTEM_V1_READY__ = true;

  function text(v, fallback = ""){
    if (v === undefined || v === null || v === "") return fallback;
    return String(v);
  }

  function riskLevel(packet = {}){
    const risk = text(packet.risk, "Medium").toLowerCase();
    if (risk.includes("high")) return "High";
    if (risk.includes("low")) return "Low";
    return "Medium";
  }

  function statusOf(packet = {}){
    const risk = riskLevel(packet);
    const rawStatus = text(packet.signalStatus || packet.zoneState || packet.setupType, "Observation").toLowerCase();
    const bias = text(packet.bias, "WAIT").toUpperCase();
    const confidence = Number(packet.confidence || packet.score || 0);

    if (rawStatus.includes("invalid")) {
      return {
        actionStatus: "Invalid",
        label: "Invalid",
        tone: "danger",
        canExecute: false,
        note: "Setup invalid. Tunggu struktur baru sebelum mengambil keputusan."
      };
    }

    if (risk === "High") {
      return {
        actionStatus: "Risk Alert",
        label: "High Risk Alert",
        tone: "danger",
        canExecute: false,
        note: "Market berisiko tinggi. Hindari entry agresif sampai ada konfirmasi kuat."
      };
    }

    if (bias === "WAIT") {
      if (rawStatus.includes("touched")) {
        return {
          actionStatus: "Zone Touched",
          label: "Zone Touched",
          tone: "warning",
          canExecute: false,
          note: "Harga menyentuh zona penting, tapi bias belum final. Tunggu rejection / confirmation candle."
        };
      }

      if (rawStatus.includes("watch")) {
        return {
          actionStatus: "Zone Watch",
          label: "Zone Watch",
          tone: "warning",
          canExecute: false,
          note: "Harga mendekati zona. Sistem menunggu validasi arah sebelum signal aktif."
        };
      }

      return {
        actionStatus: "No Trade",
        label: "No Trade",
        tone: "neutral",
        canExecute: false,
        note: "Belum ada setup final. Tunggu market masuk zona valid atau struktur lebih jelas."
      };
    }

    if (rawStatus.includes("touched") && confidence >= 65 && risk === "Low") {
      return {
        actionStatus: "Signal Active",
        label: "Signal Active",
        tone: "success",
        canExecute: true,
        note: "Setup sudah aktif secara sistem. Tetap tunggu eksekusi sesuai risk plan."
      };
    }

    if (rawStatus.includes("touched")) {
      return {
        actionStatus: "Zone Touched",
        label: "Zone Touched",
        tone: "warning",
        canExecute: false,
        note: "Harga sudah menyentuh active zone. Tunggu candle konfirmasi sebelum entry."
      };
    }

    if (rawStatus.includes("watch")) {
      return {
        actionStatus: "Zone Watch",
        label: "Zone Watch",
        tone: "warning",
        canExecute: false,
        note: "Harga mendekati active zone. Tunggu reaksi candle bersih."
      };
    }

    return {
      actionStatus: "Observation",
      label: "Observation",
      tone: "neutral",
      canExecute: false,
      note: "Sistem membaca market context dan menunggu setup yang lebih jelas."
    };
  }

  function apply(packet = {}){
    const status = statusOf(packet);

    const next = Object.assign({}, packet, {
      actionStatus: status.actionStatus,
      signalStatusLabel: status.label,
      signalTone: status.tone,
      canExecute: status.canExecute,
      statusDetail: packet.statusDetail || status.note,
      executionNote: status.note
    });

    window.__ASFX_LAST_SIGNAL_PACKET_V1__ = next;
    window.__ASFX_LAST_SMZ_ANALYSIS__ = Object.assign(
      {},
      window.__ASFX_LAST_SMZ_ANALYSIS__ || {},
      next
    );
    window.__ASFX_LAST_SIGNAL_ANALYSIS__ = Object.assign(
      {},
      window.__ASFX_LAST_SIGNAL_ANALYSIS__ || {},
      next
    );

    return next;
  }

  window.ASFX_SIGNAL_STATUS_SYSTEM_V1 = {
    statusOf,
    apply
  };

  function wrapPublisher(){
    const rawPublish = window.ASFX_PUBLISH_SIGNAL_PACKET_V1;
    if (typeof rawPublish !== "function") return false;
    if (rawPublish.__asfxStatusWrapped) return true;

    const wrapped = function(raw = {}){
      const packet = rawPublish(raw);
      return apply(packet || raw || {});
    };

    wrapped.__asfxStatusWrapped = true;
    window.ASFX_PUBLISH_SIGNAL_PACKET_V1 = wrapped;
    return true;
  }

  if (!wrapPublisher()) setTimeout(wrapPublisher, 800);

  setTimeout(() => {
    if (window.__ASFX_LAST_SIGNAL_PACKET_V1__) {
      apply(window.__ASFX_LAST_SIGNAL_PACKET_V1__);
    }
  }, 1600);

  console.info("ASFX Signal Status System V1 ready.");
})();


/* ASFX_ACCESS_UI_GATE_V1 */
(function(){
  if (window.__ASFX_ACCESS_UI_GATE_V1_READY__) return;
  window.__ASFX_ACCESS_UI_GATE_V1_READY__ = true;

  function queryFlag(name){
    try {
      const q = new URLSearchParams(window.location.search || "");
      const v = q.get(name);
      return v === "1" || v === "true" || v === "yes";
    } catch (_) {
      return false;
    }
  }

  function storeFlag(name){
    try {
      const v = localStorage.getItem(name);
      return v === "1" || v === "true" || v === "yes";
    } catch (_) {
      return false;
    }
  }

  function canAccessScannerDetail(){
    try {
      const access = window.ASFX_SIGNAL_ACCESS_V1?.get?.();
      if (access?.isOwner || access?.isVip) return true;
    } catch (_) {}

    try {
      if (window.ASFXAccessGuard?.canOpenSignalRoom?.() === true) return true;
    } catch (_) {}

    return (
      queryFlag("owner") ||
      queryFlag("admin") ||
      queryFlag("vip") ||
      storeFlag("asfx_owner") ||
      storeFlag("asfx_vip")
    );
  }

  function injectStyle(){
    if (document.getElementById("asfx-access-ui-gate-v1-style")) return;

    const style = document.createElement("style");
    style.id = "asfx-access-ui-gate-v1-style";
    style.textContent = `
      .asfx-access-gate-v1 {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: grid;
        place-items: center;
        padding: 18px;
        background: rgba(2, 6, 18, .72);
        backdrop-filter: blur(14px);
      }

      .asfx-access-gate-card-v1 {
        width: min(460px, 94vw);
        border: 1px solid rgba(59, 130, 246, .35);
        border-radius: 28px;
        padding: 22px;
        color: #fff;
        background:
          radial-gradient(circle at top right, rgba(14, 165, 233, .22), transparent 42%),
          linear-gradient(180deg, rgba(15, 23, 42, .98), rgba(2, 6, 23, .98));
        box-shadow: 0 30px 90px rgba(0,0,0,.48);
      }

      .asfx-access-gate-kicker-v1 {
        color: #38bdf8;
        letter-spacing: 4px;
        text-transform: uppercase;
        font-size: 11px;
        font-weight: 900;
        margin-bottom: 10px;
      }

      .asfx-access-gate-card-v1 h3 {
        margin: 0 0 10px;
        font-size: clamp(28px, 8vw, 42px);
        line-height: 1.05;
      }

      .asfx-access-gate-card-v1 p {
        margin: 0 0 16px;
        color: rgba(226, 232, 240, .78);
        font-size: 15px;
        line-height: 1.55;
      }

      .asfx-access-gate-list-v1 {
        display: grid;
        gap: 9px;
        margin: 18px 0;
      }

      .asfx-access-gate-list-v1 div {
        padding: 12px 14px;
        border-radius: 16px;
        background: rgba(15, 23, 42, .82);
        border: 1px solid rgba(148, 163, 184, .16);
        color: rgba(241, 245, 249, .9);
        font-size: 13px;
        line-height: 1.45;
      }

      .asfx-access-gate-actions-v1 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 18px;
      }

      .asfx-access-gate-actions-v1 button {
        border: 0;
        border-radius: 999px;
        min-height: 46px;
        font-weight: 900;
        color: #fff;
        background: rgba(15, 23, 42, .9);
        border: 1px solid rgba(148, 163, 184, .18);
      }

      .asfx-access-gate-actions-v1 button.asfx-primary {
        background: linear-gradient(135deg, #2563eb, #06b6d4);
        box-shadow: 0 18px 42px rgba(37, 99, 235, .28);
      }
    `;
    document.head.appendChild(style);
  }

  function showGate(){
    injectStyle();

    const old = document.getElementById("asfx-access-gate-v1");
    if (old) old.remove();

    const gate = document.createElement("div");
    gate.id = "asfx-access-gate-v1";
    gate.className = "asfx-access-gate-v1";
    gate.innerHTML = `
      <div class="asfx-access-gate-card-v1">
        <div class="asfx-access-gate-kicker-v1">VIP Scanner Access</div>
        <h3>Signal Detail Room terkunci</h3>
        <p>
          Scanner adalah fitur utama VIP AiSignalFx PRO. Public user hanya melihat preview,
          sedangkan entry, SL, TP, risk reasoning, dan full analysis dibuka untuk VIP/owner.
        </p>

        <div class="asfx-access-gate-list-v1">
          <div>OK Public: bias/status preview & Sentinel AI limited.</div>
          <div>VIP VIP: full Signal Detail Room, entry zone, SL/TP, dan full reasoning.</div>
          <div>Owner Owner/Admin: full access untuk testing dan kontrol sistem.</div>
        </div>

        <div class="asfx-access-gate-actions-v1">
          <button type="button" data-asfx-close-gate>Close</button>
          <button type="button" class="asfx-primary" data-asfx-vip-info>View VIP</button>
        </div>
      </div>
    `;

    gate.addEventListener("click", (e) => {
      if (e.target === gate || e.target.closest("[data-asfx-close-gate]")) {
        gate.remove();
      }

      if (e.target.closest("[data-asfx-vip-info]")) {
        gate.remove();
        try {
          const vipBtn = document.querySelector('[data-action="vip"], [data-route="vip"], [data-nav="vip"]');
          if (vipBtn) vipBtn.click();
        } catch (_) {}
      }
    });

    document.body.appendChild(gate);
  }

  window.ASFX_ACCESS_UI_GATE_V1 = {
    canAccessScannerDetail,
    showGate
  };

  function installCanOpenWrapper(){
    if (typeof window.canOpenSignalDetail === "function" && !window.canOpenSignalDetail.__asfxAccessGateWrapped) {
      const wrapped = function(){
        return canAccessScannerDetail();
      };
      wrapped.__asfxAccessGateWrapped = true;
      window.canOpenSignalDetail = wrapped;
    }

    if (typeof window.showUpgradeGate !== "function" || !window.showUpgradeGate.__asfxAccessGateWrapped) {
      const gateFn = function(){
        showGate();
      };
      gateFn.__asfxAccessGateWrapped = true;
      window.showUpgradeGate = gateFn;
    }

    if (typeof window.showVipGate !== "function" || !window.showVipGate.__asfxAccessGateWrapped) {
      const vipGateFn = function(){
        showGate();
      };
      vipGateFn.__asfxAccessGateWrapped = true;
      window.showVipGate = vipGateFn;
    }
  }

  document.addEventListener("click", function(e){
    const btn = e.target.closest('[data-action="detail"], [data-open-signal-detail], [data-detail-action="open"]');
    if (!btn) return;

    if (canAccessScannerDetail()) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    showGate();
  }, true);

  installCanOpenWrapper();
  setTimeout(installCanOpenWrapper, 800);
  setTimeout(installCanOpenWrapper, 1800);

  console.info("ASFX Access UI Gate V1 ready.");
})();


/* ASFX_SIGNAL_PACKET_QUALITY_GUARD_V1 */
(function(){
  if (window.__ASFX_SIGNAL_PACKET_QUALITY_GUARD_V1_READY__) return;
  window.__ASFX_SIGNAL_PACKET_QUALITY_GUARD_V1_READY__ = true;

  const HOLD_MS = 8000;

  function clean(v, fallback = "-"){
    if (v === undefined || v === null || v === "") return fallback;
    return String(v);
  }

  function normalizeTf(v){
    return clean(v, "15m")
      .toLowerCase()
      .replace(/^m(\d+)$/, "$1m")
      .replace(/^h(\d+)$/, "$1h")
      .replace(/^d(\d+)$/, "$1d");
  }

  function normalizeBias(v){
    const x = clean(v, "WAIT").toUpperCase();
    if (x.includes("BUY")) return "BUY";
    if (x.includes("SELL")) return "SELL";
    return "WAIT";
  }

  function normalizeRisk(v){
    const x = clean(v, "Medium").toLowerCase();
    if (x.includes("low")) return "Low";
    if (x.includes("high")) return "High";
    return "Medium";
  }

  function confidence(v){
    const n = Number(String(v ?? 0).replace("%", ""));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  function priority(status){
    const s = clean(status, "").toLowerCase();
    if (s.includes("invalid")) return 5;
    if (s.includes("active")) return 4;
    if (s.includes("risk")) return 3;
    if (s.includes("touched")) return 2;
    if (s.includes("watch")) return 1;
    return 0;
  }

  const stableFields = [
    "bias",
    "risk",
    "signalStatus",
    "signalStatusLabel",
    "actionStatus",
    "setupType",
    "zoneState",
    "phase",
    "smzPhase",
    "structure",
    "demandZone",
    "supplyZone",
    "activeZone",
    "liquidity",
    "imbalance",
    "slGuide",
    "stopLossGuide",
    "tp1Guide",
    "tp2Guide",
    "reason",
    "statusDetail",
    "executionNote"
  ];

  function sameMarket(a = {}, b = {}){
    const ap = clean(a.pair || a.symbol, "").toUpperCase();
    const bp = clean(b.pair || b.symbol, "").toUpperCase();
    const at = normalizeTf(a.tf || a.timeframe);
    const bt = normalizeTf(b.tf || b.timeframe);
    return ap && bp && ap === bp && at === bt;
  }

  function stabilize(raw = {}){
    const now = Date.now();
    const prev = window.__ASFX_STABLE_SIGNAL_PACKET_V1__ || null;

    let next = Object.assign({}, raw);

    next.pair = clean(next.pair || next.symbol, "BTCUSDT").toUpperCase();
    next.symbol = next.pair;
    next.timeframe = normalizeTf(next.timeframe || next.tf || "15m");
    next.tf = next.timeframe;
    next.bias = normalizeBias(next.bias);
    next.risk = normalizeRisk(next.risk);
    next.confidence = confidence(next.confidence ?? next.score);
    next.score = next.confidence;

    // Harga tetap live, jangan ditahan.
    next.price = next.price || next.currentPrice || next.livePrice || "-";
    next.currentPrice = next.currentPrice || next.price || "-";
    next.livePrice = next.livePrice || next.currentPrice || next.price || "-";

    if (prev && sameMarket(prev, next)) {
      const prevStatus = prev.actionStatus || prev.signalStatus || "";
      const nextStatus = next.actionStatus || next.signalStatus || "";
      const priorityJump = Math.abs(priority(nextStatus) - priority(prevStatus)) >= 2;
      const strongEvent = /active|invalid|risk/i.test(nextStatus);
      const young = now - Number(prev.__asfxGuardChangedAt || 0) < HOLD_MS;

      if (young && !priorityJump && !strongEvent) {
        stableFields.forEach((field) => {
          const oldVal = prev[field];
          const newVal = next[field];

          if (
            oldVal !== undefined &&
            oldVal !== null &&
            oldVal !== "" &&
            newVal !== undefined &&
            newVal !== null &&
            newVal !== "" &&
            String(oldVal) !== String(newVal)
          ) {
            next[field] = oldVal;
          }
        });
      } else {
        next.__asfxGuardChangedAt = now;
      }

      const diff = Math.abs(Number(next.confidence || 0) - Number(prev.confidence || 0));
      if (diff > 0 && diff <= 4) {
        next.confidence = Number(prev.confidence || next.confidence);
        next.score = next.confidence;
      }
    } else {
      next.__asfxGuardChangedAt = now;
    }

    next.__asfxGuardUpdatedAt = now;
    next.lastUpdated = new Date().toISOString();

    window.__ASFX_STABLE_SIGNAL_PACKET_V1__ = next;
    window.__ASFX_LAST_SIGNAL_PACKET_V1__ = next;
    window.__ASFX_LAST_SMZ_ANALYSIS__ = Object.assign({}, window.__ASFX_LAST_SMZ_ANALYSIS__ || {}, next);
    window.__ASFX_LAST_SIGNAL_ANALYSIS__ = Object.assign({}, window.__ASFX_LAST_SIGNAL_ANALYSIS__ || {}, next);

    return next;
  }

  window.ASFX_SIGNAL_PACKET_QUALITY_GUARD_V1 = {
    stabilize,
    get: () => window.__ASFX_STABLE_SIGNAL_PACKET_V1__ || window.__ASFX_LAST_SIGNAL_PACKET_V1__ || {}
  };

  function wrapPublisher(){
    const pub = window.ASFX_PUBLISH_SIGNAL_PACKET_V1;
    if (typeof pub !== "function") return false;
    if (pub.__asfxQualityGuardWrapped) return true;

    const wrapped = function(raw = {}){
      const packet = pub(raw);
      return stabilize(packet || raw || {});
    };

    wrapped.__asfxQualityGuardWrapped = true;
    window.ASFX_PUBLISH_SIGNAL_PACKET_V1 = wrapped;
    return true;
  }

  if (!wrapPublisher()) setTimeout(wrapPublisher, 800);

  setTimeout(() => {
    stabilize(
      window.__ASFX_LAST_SIGNAL_PACKET_V1__ ||
      window.__ASFX_LAST_SMZ_ANALYSIS__ ||
      window.__ASFX_LAST_SIGNAL_ANALYSIS__ ||
      {}
    );
  }, 1500);

  console.info("ASFX Signal Packet Quality Guard V1 ready.");
})();


/* ASFX_SIGNAL_STATUS_WORDING_V1 */
(function(){
  if (window.__ASFX_SIGNAL_STATUS_WORDING_V1_READY__) return;
  window.__ASFX_SIGNAL_STATUS_WORDING_V1_READY__ = true;

  function txt(v, fallback = ""){
    if (v === undefined || v === null || v === "") return fallback;
    return String(v);
  }

  function bias(v){
    const x = txt(v, "WAIT").toUpperCase();
    if (x.includes("BUY")) return "BUY";
    if (x.includes("SELL")) return "SELL";
    return "WAIT";
  }

  function risk(v){
    const x = txt(v, "Medium").toLowerCase();
    if (x.includes("low")) return "Low";
    if (x.includes("high")) return "High";
    return "Medium";
  }

  function normalizeZone(status, activeZone, zoneState){
    const raw = `${status} ${activeZone} ${zoneState}`.toLowerCase();

    if (raw.includes("invalid")) return "Invalid";
    if (raw.includes("active")) return "Signal Active";
    if (raw.includes("touched")) {
      if (raw.includes("supply")) return "Supply Zone Touched";
      if (raw.includes("demand")) return "Demand Zone Touched";
      return "Zone Touched";
    }
    if (raw.includes("watch")) {
      if (raw.includes("supply")) return "Supply Zone Watch";
      if (raw.includes("demand")) return "Demand Zone Watch";
      return "Zone Watch";
    }
    if (raw.includes("supply")) return "Supply Observation";
    if (raw.includes("demand")) return "Demand Observation";

    return "Observation";
  }

  function noteFor(packet = {}){
    const b = bias(packet.bias);
    const r = risk(packet.risk);
    const status = txt(packet.signalStatusLabel || packet.actionStatus || packet.signalStatus, "Observation");

    if (r === "High") {
      return "Risk tinggi. Sistem tidak menyarankan entry agresif. Tunggu struktur lebih jelas atau candle confirmation yang kuat.";
    }

    if (/Signal Active/i.test(status)) {
      return "Setup aktif secara sistem. Tetap gunakan risk management, validasi candle terakhir, dan jangan over-leverage.";
    }

    if (/Touched/i.test(status)) {
      return "Harga sudah menyentuh zona penting. Tunggu rejection atau confirmation candle sebelum mengambil keputusan.";
    }

    if (/Watch/i.test(status)) {
      return "Harga mendekati active zone. Sistem menunggu reaksi candle bersih sebelum setup dianggap aktif.";
    }

    if (b === "WAIT") {
      return "Belum ada arah final. Sistem masih membaca struktur, zona, dan konfirmasi market.";
    }

    return "Market context terbaca, tetapi setup masih dalam fase observasi. Tunggu validasi tambahan sebelum eksekusi.";
  }

  function applyWording(packet = {}){
    const b = bias(packet.bias);
    const r = risk(packet.risk);

    const cleanStatus = normalizeZone(
      packet.signalStatus || packet.actionStatus || packet.setupType,
      packet.activeZone,
      packet.zoneState
    );

    let actionStatus = cleanStatus;

    if (r === "High") actionStatus = "Risk Alert";
    if (b === "WAIT" && /Observation/i.test(cleanStatus)) actionStatus = "No Trade";

    const note = noteFor(Object.assign({}, packet, {
      bias: b,
      risk: r,
      signalStatus: cleanStatus,
      actionStatus
    }));

    const next = Object.assign({}, packet, {
      bias: b,
      risk: r,
      signalStatus: cleanStatus,
      signalStatusLabel: cleanStatus,
      actionStatus,
      executionNote: note,
      statusDetail: note,
      displayHeadline: `${cleanStatus}  -  ${b}  -  ${r} Risk`,
      publicSummary: `${packet.pair || packet.symbol || "BTCUSDT"}  -  ${packet.timeframe || packet.tf || "15m"}  -  ${b}  -  ${cleanStatus}`,
      vipSummary: `${b} setup  -  ${r} Risk  -  ${cleanStatus}`
    });

    window.__ASFX_LAST_SIGNAL_PACKET_V1__ = next;
    window.__ASFX_LAST_SMZ_ANALYSIS__ = Object.assign({}, window.__ASFX_LAST_SMZ_ANALYSIS__ || {}, next);
    window.__ASFX_LAST_SIGNAL_ANALYSIS__ = Object.assign({}, window.__ASFX_LAST_SIGNAL_ANALYSIS__ || {}, next);

    return next;
  }

  window.ASFX_SIGNAL_STATUS_WORDING_V1 = {
    apply: applyWording
  };

  function wrapPublisher(){
    const pub = window.ASFX_PUBLISH_SIGNAL_PACKET_V1;
    if (typeof pub !== "function") return false;
    if (pub.__asfxWordingWrapped) return true;

    const wrapped = function(raw = {}){
      const packet = pub(raw);
      return applyWording(packet || raw || {});
    };

    wrapped.__asfxWordingWrapped = true;
    window.ASFX_PUBLISH_SIGNAL_PACKET_V1 = wrapped;
    return true;
  }

  if (!wrapPublisher()) setTimeout(wrapPublisher, 800);

  setTimeout(() => {
    applyWording(
      window.__ASFX_LAST_SIGNAL_PACKET_V1__ ||
      window.__ASFX_LAST_SMZ_ANALYSIS__ ||
      window.__ASFX_LAST_SIGNAL_ANALYSIS__ ||
      {}
    );
  }, 1500);

  console.info("ASFX Signal Status Wording V1 ready.");
})();


/* ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1 */
(function(){
  if (window.__ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1_READY__) return;
  window.__ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1_READY__ = true;

  const LAST_KEY = "aisignalfx:last_signal_snapshot_key";
  const HOLD_MS = 30000;

  function clean(v, fallback = "-"){
    if (v === undefined || v === null || v === "") return fallback;
    return String(v);
  }

  function getProfile(){
    try {
      return JSON.parse(localStorage.getItem("aisignalfx:firebase_user") || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function getPacket(){
    return (
      window.ASFX_SIGNAL_PACKET_QUALITY_GUARD_V1?.get?.() ||
      window.__ASFX_STABLE_SIGNAL_PACKET_V1__ ||
      window.__ASFX_LAST_SIGNAL_PACKET_V1__ ||
      window.__ASFX_LAST_SMZ_ANALYSIS__ ||
      window.__ASFX_LAST_SIGNAL_ANALYSIS__ ||
      {}
    );
  }

  function canSaveSnapshot(){
    try {
      if (window.ASFX_ACCESS_UI_GATE_V1?.canAccessScannerDetail?.()) return true;
    } catch (_) {}

    try {
      const q = new URLSearchParams(window.location.search || "");
      if (["owner", "admin", "vip"].some(k => ["1", "true", "yes"].includes(String(q.get(k)).toLowerCase()))) return true;
    } catch (_) {}

    try {
      if (localStorage.getItem("asfx_owner") === "1" || localStorage.getItem("asfx_vip") === "1") return true;
    } catch (_) {}

    return false;
  }

  function toast(message, type = "ok"){
    const old = document.getElementById("asfx-snapshot-toast-v1");
    if (old) old.remove();

    const el = document.createElement("div");
    el.id = "asfx-snapshot-toast-v1";
    el.textContent = message;
    el.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 92px;
      transform: translateX(-50%);
      z-index: 999999;
      max-width: min(92vw, 420px);
      padding: 13px 16px;
      border-radius: 999px;
      color: #fff;
      font-weight: 900;
      font-size: 13px;
      letter-spacing: .2px;
      background: ${type === "error" ? "rgba(127,29,29,.96)" : "rgba(15,23,42,.96)"};
      border: 1px solid ${type === "error" ? "rgba(248,113,113,.45)" : "rgba(56,189,248,.45)"};
      box-shadow: 0 18px 50px rgba(0,0,0,.38);
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function buildSnapshot(){
    const packet = getPacket();
    const profile = getProfile();

    const pair = clean(packet.pair || packet.symbol, "BTCUSDT").toUpperCase();
    const timeframe = clean(packet.timeframe || packet.tf, "15m");

    const snapshot = {
      type: "scanner_signal_snapshot",
      source: "Signal Scanner",
      market: pair.endsWith("USDT") ? "crypto" : "reference",
      mode: pair.endsWith("USDT") ? "crypto_live_binance" : "reference_mode",

      pair,
      symbol: pair,
      timeframe,

      bias: clean(packet.bias, "WAIT"),
      risk: clean(packet.risk, "Medium"),
      confidence: Number(String(packet.confidence || packet.score || 0).replace("%", "")) || 0,

      status: clean(packet.actionStatus || packet.signalStatusLabel || packet.signalStatus, "Observation"),
      signalStatus: clean(packet.signalStatusLabel || packet.signalStatus || packet.actionStatus, "Observation"),

      demandZone: clean(packet.demandZone, "Calculating"),
      supplyZone: clean(packet.supplyZone, "Calculating"),
      activeZone: clean(packet.activeZone || packet.zoneState, "Waiting zone"),

      structure: clean(packet.structure, "Waiting structure"),
      liquidity: clean(packet.liquidity, "Waiting liquidity"),
      imbalance: clean(packet.imbalance, "Waiting imbalance/FVG"),

      slGuide: clean(packet.slGuide || packet.stopLossGuide || packet.sl || packet.stopLoss || packet.invalidationLevel, "Waiting invalidation level"),
      tp1Guide: clean(packet.tp1Guide || packet.tp1 || packet.takeProfit1, "Waiting target area"),
      tp2Guide: clean(packet.tp2Guide || packet.tp2 || packet.takeProfit2, "Waiting extended target"),

      reason: clean(packet.reason || packet.statusDetail || packet.executionNote, "Market context snapshot."),
      insight: clean(packet.executionNote || packet.statusDetail || packet.reason, "Signal snapshot saved."),

      price: clean(packet.price || packet.currentPrice || packet.livePrice, "-"),

      access: canSaveSnapshot() ? "vip_or_owner" : "public",
      uid: clean(profile.uid, "local"),
      userEmail: clean(profile.email, ""),
      userRole: clean(profile.role || profile.level, ""),

      createdAtClient: new Date().toISOString()
    };

    snapshot.snapshotKey = [
      snapshot.pair,
      snapshot.timeframe,
      snapshot.bias,
      snapshot.status,
      snapshot.demandZone,
      snapshot.supplyZone
    ].join("|");

    return snapshot;
  }

  async function saveSnapshot(){
    if (!canSaveSnapshot()) {
      try {
        window.ASFX_ACCESS_UI_GATE_V1?.showGate?.();
      } catch (_) {}
      toast("Signal snapshot khusus VIP/owner.", "error");
      return null;
    }

    const fb = window.AiSignalFirebase;
    if (!fb) {
      toast("Firebase belum siap. Refresh halaman dulu.", "error");
      throw new Error("AiSignalFirebase not ready");
    }

    const snapshot = buildSnapshot();

    try {
      const last = JSON.parse(localStorage.getItem(LAST_KEY) || "{}");
      if (
        last.key === snapshot.snapshotKey &&
        Date.now() - Number(last.time || 0) < HOLD_MS
      ) {
        toast("Snapshot sudah tersimpan. Tunggu perubahan signal baru.");
        return snapshot;
      }
    } catch (_) {}

    let result = null;

    if (typeof fb.addCollectionDoc === "function") {
      result = await fb.addCollectionDoc("signalSnapshots", snapshot);
    } else if (typeof fb.saveSignal === "function") {
      result = await fb.saveSignal(snapshot);
    } else {
      throw new Error("Firebase save helper not found");
    }

    localStorage.setItem(LAST_KEY, JSON.stringify({
      key: snapshot.snapshotKey,
      time: Date.now()
    }));

    toast("Signal snapshot tersimpan ke Firebase.");
    return result || snapshot;
  }

  window.ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1 = {
    save: saveSnapshot,
    build: buildSnapshot
  };

  document.addEventListener("click", function(e){
    const btn = e.target.closest("button, a, [role='button']");
    if (!btn) return;

    const label = clean(btn.textContent, "").trim().toLowerCase();
    const action = clean(btn.getAttribute("data-action") || btn.getAttribute("data-save") || "", "").toLowerCase();

    const isSaveButton =
      label === "save" ||
      label.includes("save signal") ||
      action.includes("save");

    if (!isSaveButton) return;

    const pageText = clean(document.body?.innerText, "");
    const inScanner = /Scanner|Signal Detail Room|BTCUSDT|ETHUSDT|BNBUSDT/i.test(pageText);
    if (!inScanner) return;

    e.preventDefault();
    e.stopPropagation();

    saveSnapshot().catch((err) => {
      console.warn("ASFX snapshot save failed:", err);
      toast("Gagal simpan snapshot. Cek login/Firebase rules.", "error");
    });
  }, true);

  console.info("ASFX Firebase Signal Snapshot V1 ready.");
})();


/* ASFX_SAVE_CLICK_GATE_V1 */
(function(){
  if (window.__ASFX_SAVE_CLICK_GATE_V1_READY__) return;
  window.__ASFX_SAVE_CLICK_GATE_V1_READY__ = true;

  function clean(v){ return String(v || "").trim(); }

  function isScannerSaveButton(btn){
    const label = clean(btn.textContent).toLowerCase();
    if (label !== "save" && !label.includes("save signal")) return false;

    const body = clean(document.body?.innerText || "");
    return /Scanner|Signal Detail Room|BTCUSDT|ETHUSDT|BNBUSDT|SOLUSDT/i.test(body);
  }

  function removeLegacySaveToast(){
    try {
      [...document.querySelectorAll("div,span,p")].forEach((el) => {
        const t = clean(el.textContent);
        if (t.includes("Action saved locally") || t.includes("Real community sync will use Firestore")) {
          el.remove();
        }
      });
    } catch (_) {}
  }

  window.addEventListener("click", function(e){
    const btn = e.target.closest("button, a, [role='button']");
    if (!btn || !isScannerSaveButton(btn)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const now = Date.now();
    if (window.__ASFX_SAVE_CLICK_LOCK__ && now - window.__ASFX_SAVE_CLICK_LOCK__ < 1200) return;
    window.__ASFX_SAVE_CLICK_LOCK__ = now;

    if (window.ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1?.save) {
      window.ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1.save()
        .then(() => setTimeout(removeLegacySaveToast, 80))
        .catch((err) => console.warn("ASFX save gate failed:", err));
    }
  }, true);

  console.info("ASFX Save Click Gate V1 ready.");
})();


/* ASFX_FIREBASE_SIGNAL_SNAPSHOT_HYDRATOR_V1 */
(function(){
  if (window.__ASFX_FIREBASE_SIGNAL_SNAPSHOT_HYDRATOR_V1_READY__) return;
  window.__ASFX_FIREBASE_SIGNAL_SNAPSHOT_HYDRATOR_V1_READY__ = true;

  const LAST_KEY = "aisignalfx:last_hydrated_signal_snapshot_key";
  const HOLD_MS = 25000;

  function clean(v, fallback = "-"){
    if (v === undefined || v === null || v === "") return fallback;
    return String(v).trim();
  }

  function bodyText(){
    return clean(document.body?.innerText || "", "");
  }

  function pick(pattern, fallback = ""){
    const m = bodyText().match(pattern);
    return m && m[1] ? clean(m[1]).replace(/\s+/g, " ") : fallback;
  }

  function num(v, fallback = 0){
    const n = Number(String(v ?? "").replace(/[,%]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }

  function getProfile(){
    try {
      return JSON.parse(localStorage.getItem("aisignalfx:firebase_user") || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function packetRaw(){
    return Object.assign(
      {},
      window.__ASFX_LAST_SMZ_ANALYSIS__ || {},
      window.__ASFX_LAST_SIGNAL_ANALYSIS__ || {},
      window.__ASFX_STABLE_SIGNAL_PACKET_V1__ || {},
      window.__ASFX_LAST_SIGNAL_PACKET_V1__ || {}
    );
  }

  function domSignal(){
    const text = bodyText();

    const pair =
      pick(/\b([A-Z]{3,12}USDT)\b/i, "") ||
      pick(/\b(EURUSD|GBPUSD|USDJPY|XAUUSD|NAS100|US30)\b/i, "");

    const timeframe =
      pick(/\b(5m|15m|1H|4H|1D|1W)\b/i, "");

    const confidence =
      pick(/Confidence\s+(\d{1,3})\s*%/i, "") ||
      pick(/confidence\s+(\d{1,3})\s*%/i, "");

    const risk =
      pick(/Risk\s+(Low|Medium|High)/i, "");

    const price =
      pick(/Price\s+([\d,]+(?:\.\d+)?)/i, "") ||
      pick(/\bBTCUSDT\s+([\d,]+(?:\.\d+)?)/i, "");

    const demand =
      pick(/Demand\s*:\s*([\d,]+(?:\.\d+)?\s*[--]\s*[\d,]+(?:\.\d+)?)/i, "") ||
      pick(/Active Zone\s+Demand\s+([\d,]+(?:\.\d+)?\s*[--]\s*[\d,]+(?:\.\d+)?)/i, "");

    const supply =
      pick(/Supply\s*:\s*([\d,]+(?:\.\d+)?\s*[--]\s*[\d,]+(?:\.\d+)?)/i, "") ||
      pick(/Active Zone\s+Supply\s+([\d,]+(?:\.\d+)?\s*[--]\s*[\d,]+(?:\.\d+)?)/i, "");

    const activeZone =
      pick(/Active Zone\s+((?:Demand|Supply)\s+[\d,]+(?:\.\d+)?\s*[--]\s*[\d,]+(?:\.\d+)?)/i, "");

    const structure =
      pick(/Structure\s*:\s*([^\n]+)/i, "");

    const liquidity =
      pick(/Liquidity\s*:\s*([^\n]+)/i, "");

    const imbalance =
      pick(/FVG\s*:\s*([^\n]+)/i, "") ||
      pick(/Imbalance\/FVG\s*:\s*([^\n]+)/i, "");

    const sl =
      pick(/SL\s*:\s*([^\n]+)/i, "");

    const tp1 =
      pick(/TP1\s*:\s*([^\n]+)/i, "");

    const tp2 =
      pick(/TP2\s*:\s*([^\n]+)/i, "");

    const headline =
      pick(/FINAL SIGNAL PLAN\s+([A-Za-z][A-Za-z ]{2,40})\s+[A-Z]{3,12}/i, "") ||
      pick(/AI INSIGHT\s+([A-Za-z][A-Za-z ]{2,40})\s+Ringkasan/i, "") ||
      pick(/Status\s+([A-Za-z][A-Za-z ]{2,40})(?:\n|$)/i, "");

    const insight =
      pick(/Insight\s+([^\n]+(?:\n[^\n]+)?)/i, "").replace(/\s+/g, " ");

    return {
      pair,
      timeframe,
      confidence,
      risk,
      price,
      demand,
      supply,
      activeZone,
      structure,
      liquidity,
      imbalance,
      sl,
      tp1,
      tp2,
      headline,
      insight,
      text
    };
  }

  function canSave(){
    try {
      if (window.ASFX_ACCESS_UI_GATE_V1?.canAccessScannerDetail?.()) return true;
    } catch (_) {}

    try {
      const q = new URLSearchParams(window.location.search || "");
      if (["owner", "admin", "vip"].some(k => ["1", "true", "yes"].includes(String(q.get(k)).toLowerCase()))) return true;
    } catch (_) {}

    const profile = getProfile();
    const role = clean(profile.role || profile.level, "").toLowerCase();
    return role.includes("owner") || role.includes("admin") || role.includes("vip");
  }

  function toast(message, type = "ok"){
    const old = document.getElementById("asfx-snapshot-toast-v1");
    if (old) old.remove();

    const el = document.createElement("div");
    el.id = "asfx-snapshot-toast-v1";
    el.textContent = message;
    el.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 92px;
      transform: translateX(-50%);
      z-index: 999999;
      max-width: min(92vw, 440px);
      padding: 13px 16px;
      border-radius: 999px;
      color: #fff;
      font-weight: 900;
      font-size: 13px;
      background: ${type === "error" ? "rgba(127,29,29,.96)" : "rgba(15,23,42,.96)"};
      border: 1px solid ${type === "error" ? "rgba(248,113,113,.45)" : "rgba(56,189,248,.45)"};
      box-shadow: 0 18px 50px rgba(0,0,0,.38);
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function buildHydratedSnapshot(){
    const p = packetRaw();
    const d = domSignal();
    const profile = getProfile();

    const pair = clean(d.pair || p.pair || p.symbol, "BTCUSDT").toUpperCase();
    const timeframe = clean(d.timeframe || p.timeframe || p.tf, "15m");

    const bias = clean(p.bias, "WAIT").toUpperCase().includes("BUY")
      ? "BUY"
      : clean(p.bias, "WAIT").toUpperCase().includes("SELL")
        ? "SELL"
        : "WAIT";

    const status = clean(
      d.headline ||
      p.actionStatus ||
      p.signalStatusLabel ||
      p.signalStatus,
      "Observation"
    );

    const confidence = num(d.confidence || p.confidence || p.score, 0);
    const risk = clean(d.risk || p.risk, "Medium");

    const demandZone = clean(d.demand || p.demandZone, "Calculating");
    const supplyZone = clean(d.supply || p.supplyZone, "Calculating");

    const snapshot = {
      type: "scanner_signal_snapshot",
      source: "Signal Scanner",
      market: pair.endsWith("USDT") ? "crypto" : "reference",
      mode: pair.endsWith("USDT") ? "crypto_live_binance" : "reference_mode",

      pair,
      symbol: pair,
      timeframe,

      bias,
      risk,
      confidence,

      status,
      signalStatus: status,

      demandZone,
      supplyZone,
      activeZone: clean(d.activeZone || p.activeZone || p.zoneState, status),

      structure: clean(d.structure || p.structure, "Structure reading"),
      liquidity: clean(d.liquidity || p.liquidity, "Waiting confirmation"),
      imbalance: clean(d.imbalance || p.imbalance, "Waiting"),

      slGuide: clean(p.slGuide || p.stopLossGuide || p.sl || p.stopLoss || p.invalidationLevel || d.sl, "Waiting invalidation level"),
      tp1Guide: clean(p.tp1Guide || p.tp1 || p.takeProfit1 || d.tp1, "Waiting target area"),
      tp2Guide: clean(p.tp2Guide || p.tp2 || p.takeProfit2 || d.tp2, "Waiting extended target"),

      reason: clean(p.reason || p.statusDetail || p.executionNote || d.insight, "Reading market context."),
      insight: clean(d.insight || p.executionNote || p.statusDetail || p.reason, "Reading market context."),

      price: clean(d.price || p.price || p.currentPrice || p.livePrice, "-"),

      access: canSave() ? "vip_or_owner" : "public",
      uid: clean(profile.uid, "local"),
      userEmail: clean(profile.email, ""),
      userRole: clean(profile.role || profile.level, ""),

      hydrator: "ASFX_FIREBASE_SIGNAL_SNAPSHOT_HYDRATOR_V1",
      createdAtClient: new Date().toISOString()
    };

    snapshot.snapshotKey = [
      snapshot.pair,
      snapshot.timeframe,
      snapshot.bias,
      snapshot.status,
      snapshot.confidence,
      snapshot.demandZone,
      snapshot.supplyZone
    ].join("|");

    return snapshot;
  }

  async function saveHydratedSnapshot(){
    if (!canSave()) {
      toast("Signal snapshot khusus VIP/owner.", "error");
      return null;
    }

    const fb = window.AiSignalFirebase;
    if (!fb || typeof fb.addCollectionDoc !== "function") {
      toast("Firebase belum siap. Refresh halaman dulu.", "error");
      throw new Error("AiSignalFirebase.addCollectionDoc not ready");
    }

    const snapshot = buildHydratedSnapshot();

    try {
      const last = JSON.parse(localStorage.getItem(LAST_KEY) || "{}");
      if (last.key === snapshot.snapshotKey && Date.now() - Number(last.time || 0) < HOLD_MS) {
        toast("Snapshot sudah tersimpan. Tunggu perubahan signal baru.");
        return snapshot;
      }
    } catch (_) {}

    const res = await fb.addCollectionDoc("signalSnapshots", snapshot);

    localStorage.setItem(LAST_KEY, JSON.stringify({
      key: snapshot.snapshotKey,
      time: Date.now()
    }));

    toast(`Snapshot tersimpan: ${snapshot.pair} ${snapshot.timeframe} ${snapshot.confidence}%`);
    return res || snapshot;
  }

  window.ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1 = Object.assign(
    {},
    window.ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1 || {},
    {
      build: buildHydratedSnapshot,
      save: saveHydratedSnapshot,
      hydrator: "v1"
    }
  );

  console.info("ASFX Firebase Signal Snapshot Hydrator V1 ready.");
})();


/* ASFX_FIREBASE_SIGNAL_SNAPSHOT_HYDRATOR_V1_1 */
(function(){
  if (window.__ASFX_FIREBASE_SIGNAL_SNAPSHOT_HYDRATOR_V1_1_READY__) return;
  window.__ASFX_FIREBASE_SIGNAL_SNAPSHOT_HYDRATOR_V1_1_READY__ = true;

  const LAST_KEY = "aisignalfx:last_hydrated_signal_snapshot_key_v11";
  const HOLD_MS = 25000;

  function clean(v, fallback = "-"){
    if (v === undefined || v === null || v === "") return fallback;
    return String(v).trim();
  }

  function bodyText(){
    return clean(document.body?.innerText || "", "");
  }

  function normalizeTf(v){
    return clean(v, "15m")
      .replace(/\s+/g, "")
      .toLowerCase()
      .replace(/^m(\d+)$/, "$1m")
      .replace(/^h(\d+)$/, "$1h")
      .replace(/^d(\d+)$/, "$1d")
      .replace(/^w(\d+)$/, "$1w");
  }

  function displayTf(v){
    const t = normalizeTf(v);
    if (t === "1h") return "1H";
    if (t === "4h") return "4H";
    if (t === "1d") return "1D";
    if (t === "1w") return "1W";
    return t || "15m";
  }

  function pick(pattern, fallback = ""){
    const m = bodyText().match(pattern);
    return m && m[1] ? clean(m[1]).replace(/\s+/g, " ") : fallback;
  }

  function num(v, fallback = 0){
    const n = Number(String(v ?? "").replace(/[,%]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }

  function getProfile(){
    try {
      return JSON.parse(localStorage.getItem("aisignalfx:firebase_user") || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function packetRaw(){
    return Object.assign(
      {},
      window.__ASFX_LAST_SMZ_ANALYSIS__ || {},
      window.__ASFX_LAST_SIGNAL_ANALYSIS__ || {},
      window.__ASFX_STABLE_SIGNAL_PACKET_V1__ || {},
      window.__ASFX_LAST_SIGNAL_PACKET_V1__ || {}
    );
  }

  function readDetailHeader(){
    const text = bodyText();

    // Prefer header: SIGNAL DETAIL ROOM BTCUSDT  -  15m
    let m = text.match(/SIGNAL DETAIL ROOM\s+([A-Z0-9]{5,14})\s*[ - \-.]\s*(5m|15m|1H|4H|1D|1W)/i);
    if (m) return { pair: m[1].toUpperCase(), timeframe: displayTf(m[2]) };

    // Fallback: BTCUSDT  -  15m anywhere in detail room.
    m = text.match(/\b([A-Z0-9]{5,14})\s*[ - \-.]\s*(5m|15m|1H|4H|1D|1W)\b/i);
    if (m) return { pair: m[1].toUpperCase(), timeframe: displayTf(m[2]) };

    return {};
  }

  function activeButtonTf(){
    try {
      const buttons = [...document.querySelectorAll("button, [role='button']")];
      const active = buttons.find((b) => {
        const t = clean(b.textContent);
        const cls = clean(b.className);
        return /^(5m|15m|1H|4H|1D|1W)$/i.test(t) && /active|selected/i.test(cls);
      });
      return active ? displayTf(active.textContent) : "";
    } catch (_) {
      return "";
    }
  }

  function domSignal(){
    const text = bodyText();
    const header = readDetailHeader();

    const confidence =
      pick(/Confidence\s+(\d{1,3})\s*%/i, "") ||
      pick(/confidence\s+(\d{1,3})\s*%/i, "");

    const risk = pick(/Risk\s+(Low|Medium|High)/i, "");

    const price =
      pick(/Price\s+([\d,]+(?:\.\d+)?)/i, "") ||
      pick(/\bBTCUSDT\s+([\d,]+(?:\.\d+)?)/i, "");

    const demand =
      pick(/Demand\s*:\s*([\d,]+(?:\.\d+)?\s*[--]\s*[\d,]+(?:\.\d+)?)/i, "") ||
      pick(/Active Zone\s+Demand\s+([\d,]+(?:\.\d+)?\s*[--]\s*[\d,]+(?:\.\d+)?)/i, "");

    const supply =
      pick(/Supply\s*:\s*([\d,]+(?:\.\d+)?\s*[--]\s*[\d,]+(?:\.\d+)?)/i, "") ||
      pick(/Active Zone\s+Supply\s+([\d,]+(?:\.\d+)?\s*[--]\s*[\d,]+(?:\.\d+)?)/i, "");

    const activeZone =
      pick(/Active Zone\s+((?:Demand|Supply)\s+[\d,]+(?:\.\d+)?\s*[--]\s*[\d,]+(?:\.\d+)?)/i, "");

    const structure = pick(/Structure\s*:\s*([^\n]+)/i, "");
    const liquidity = pick(/Liquidity\s*:\s*([^\n]+)/i, "");
    const imbalance = pick(/FVG\s*:\s*([^\n]+)/i, "") || pick(/Imbalance\/FVG\s*:\s*([^\n]+)/i, "");

    const sl = pick(/SL\s*:\s*([^\n]+)/i, "");
    const tp1 = pick(/TP1\s*:\s*([^\n]+)/i, "");
    const tp2 = pick(/TP2\s*:\s*([^\n]+)/i, "");

    const headline =
      pick(/FINAL SIGNAL PLAN\s+([A-Za-z][A-Za-z ]{2,40})\s+[A-Z0-9]{5,14}/i, "") ||
      pick(/AI INSIGHT\s+([A-Za-z][A-Za-z ]{2,40})\s+Ringkasan/i, "") ||
      pick(/Status\s+([A-Za-z][A-Za-z ]{2,40})(?:\n|$)/i, "");

    const insight = pick(/Insight\s+([^\n]+(?:\n[^\n]+)?)/i, "").replace(/\s+/g, " ");

    return {
      pair: header.pair,
      timeframe: header.timeframe || activeButtonTf(),
      confidence,
      risk,
      price,
      demand,
      supply,
      activeZone,
      structure,
      liquidity,
      imbalance,
      sl,
      tp1,
      tp2,
      headline,
      insight,
      text
    };
  }

  function canSave(){
    try {
      if (window.ASFX_ACCESS_UI_GATE_V1?.canAccessScannerDetail?.()) return true;
    } catch (_) {}

    try {
      const q = new URLSearchParams(window.location.search || "");
      if (["owner", "admin", "vip"].some(k => ["1", "true", "yes"].includes(String(q.get(k)).toLowerCase()))) return true;
    } catch (_) {}

    const profile = getProfile();
    const role = clean(profile.role || profile.level, "").toLowerCase();
    return role.includes("owner") || role.includes("admin") || role.includes("vip");
  }

  function toast(message, type = "ok"){
    const old = document.getElementById("asfx-snapshot-toast-v1");
    if (old) old.remove();

    const el = document.createElement("div");
    el.id = "asfx-snapshot-toast-v1";
    el.textContent = message;
    el.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 92px;
      transform: translateX(-50%);
      z-index: 999999;
      max-width: min(92vw, 440px);
      padding: 13px 16px;
      border-radius: 999px;
      color: #fff;
      font-weight: 900;
      font-size: 13px;
      background: ${type === "error" ? "rgba(127,29,29,.96)" : "rgba(15,23,42,.96)"};
      border: 1px solid ${type === "error" ? "rgba(248,113,113,.45)" : "rgba(56,189,248,.45)"};
      box-shadow: 0 18px 50px rgba(0,0,0,.38);
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function buildHydratedSnapshot(){
    const p = packetRaw();
    const d = domSignal();
    const profile = getProfile();

    const pair = clean(d.pair || p.pair || p.symbol, "BTCUSDT").toUpperCase();

    // V1.1 fix: do NOT read first timeframe text from body.
    // Prefer detail header / packet / active button only.
    const timeframe = displayTf(
      d.timeframe ||
      p.timeframe ||
      p.tf ||
      "15m"
    );

    const rawBias = clean(p.bias, "WAIT").toUpperCase();
    const bias = rawBias.includes("BUY") ? "BUY" : rawBias.includes("SELL") ? "SELL" : "WAIT";

    const status = clean(
      d.headline ||
      p.actionStatus ||
      p.signalStatusLabel ||
      p.signalStatus,
      "Observation"
    );

    const snapshot = {
      type: "scanner_signal_snapshot",
      source: "Signal Scanner",
      market: pair.endsWith("USDT") ? "crypto" : "reference",
      mode: pair.endsWith("USDT") ? "crypto_live_binance" : "reference_mode",

      pair,
      symbol: pair,
      timeframe,

      bias,
      risk: clean(d.risk || p.risk, "Medium"),
      confidence: num(d.confidence || p.confidence || p.score, 0),

      status,
      signalStatus: status,

      demandZone: clean(d.demand || p.demandZone, "Calculating"),
      supplyZone: clean(d.supply || p.supplyZone, "Calculating"),
      activeZone: clean(d.activeZone || p.activeZone || p.zoneState, status),

      structure: clean(d.structure || p.structure, "Structure reading"),
      liquidity: clean(d.liquidity || p.liquidity, "Waiting confirmation"),
      imbalance: clean(d.imbalance || p.imbalance, "Waiting"),

      slGuide: clean(p.slGuide || p.stopLossGuide || p.sl || p.stopLoss || p.invalidationLevel || d.sl, "Waiting invalidation level"),
      tp1Guide: clean(p.tp1Guide || p.tp1 || p.takeProfit1 || d.tp1, "Waiting target area"),
      tp2Guide: clean(p.tp2Guide || p.tp2 || p.takeProfit2 || d.tp2, "Waiting extended target"),

      reason: clean(p.reason || p.statusDetail || p.executionNote || d.insight, "Reading market context."),
      insight: clean(d.insight || p.executionNote || p.statusDetail || p.reason, "Reading market context."),

      price: clean(d.price || p.price || p.currentPrice || p.livePrice, "-"),

      access: canSave() ? "vip_or_owner" : "public",
      uid: clean(profile.uid, "local"),
      userEmail: clean(profile.email, ""),
      userRole: clean(profile.role || profile.level, ""),

      hydrator: "ASFX_FIREBASE_SIGNAL_SNAPSHOT_HYDRATOR_V1_1",
      createdAtClient: new Date().toISOString()
    };

    snapshot.snapshotKey = [
      snapshot.pair,
      snapshot.timeframe,
      snapshot.bias,
      snapshot.status,
      snapshot.confidence,
      snapshot.demandZone,
      snapshot.supplyZone
    ].join("|");

    return snapshot;
  }

  async function saveHydratedSnapshot(){
    if (!canSave()) {
      toast("Signal snapshot khusus VIP/owner.", "error");
      return null;
    }

    const fb = window.AiSignalFirebase;
    if (!fb || typeof fb.addCollectionDoc !== "function") {
      toast("Firebase belum siap. Refresh halaman dulu.", "error");
      throw new Error("AiSignalFirebase.addCollectionDoc not ready");
    }

    const snapshot = buildHydratedSnapshot();

    try {
      const last = JSON.parse(localStorage.getItem(LAST_KEY) || "{}");
      if (last.key === snapshot.snapshotKey && Date.now() - Number(last.time || 0) < HOLD_MS) {
        toast("Snapshot sudah tersimpan. Tunggu perubahan signal baru.");
        return snapshot;
      }
    } catch (_) {}

    const res = await fb.addCollectionDoc("signalSnapshots", snapshot);

    localStorage.setItem(LAST_KEY, JSON.stringify({
      key: snapshot.snapshotKey,
      time: Date.now()
    }));

    toast(`Snapshot tersimpan: ${snapshot.pair} ${snapshot.timeframe} ${snapshot.confidence}%`);
    return res || snapshot;
  }

  window.ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1 = Object.assign(
    {},
    window.ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1 || {},
    {
      build: buildHydratedSnapshot,
      save: saveHydratedSnapshot,
      hydrator: "v1.1"
    }
  );

  console.info("ASFX Snapshot Hydrator V1.1 ready.");
})();










/* ASFX_SIGNAL_FRESHNESS_VALIDITY_GUARD_V1 */
(() => {
  if (window.__ASFX_SIGNAL_FRESHNESS_VALIDITY_GUARD_V1__) return;
  window.__ASFX_SIGNAL_FRESHNESS_VALIDITY_GUARD_V1__ = true;

  const TF_MS = {
    "1m": 60000,
    "5m": 300000,
    "15m": 900000,
    "30m": 1800000,
    "1h": 3600000,
    "4h": 14400000,
    "1d": 86400000,
    "1w": 604800000
  };

  const cleanNum = (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const text = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (!text) return null;
    const n = Number(text[0]);
    return Number.isFinite(n) ? n : null;
  };

  const fmt = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("en-US", {
      minimumFractionDigits: n >= 100 ? 2 : 4,
      maximumFractionDigits: n >= 100 ? 2 : 4
    });
  };

  const timeText = (ms) => {
    if (!ms) return "-";
    try {
      return new Date(ms).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch (_) {
      return "-";
    }
  };

  const currentTf = () => {
    const title = document.querySelector(".asfx-detail-title h2")?.textContent || "";
    const match = title.match(/(1m|5m|15m|30m|1h|4h|1d|1w)/i);
    return (match ? match[1] : "15m").toLowerCase();
  };

  const currentPrice = () => {
    // FIX: Hubungkan langsung ke pusat cache ticker live global agar harga di box Signal State terus bergerak aktif
    const currentPair = String(window.__ASFX_FINAL_SIGNAL_PACKET_V5__?.pair || (typeof ctx === "function" ? ctx().pair : "BTCUSDT")).toUpperCase();
    const globalLivePrice = window.AiSignalPriceSourceV1?.cache?.[currentPair]?.price;

    const chartPrice =
      document.querySelector(".asfx-chart-info-strip b")?.textContent ||
      document.querySelector(".asfx-room-chart .asfx-price-label")?.textContent;

    return (
      cleanNum(globalLivePrice) ||
      cleanNum(chartPrice) ||
      cleanNum(window.__ASFX_LAST_SMZ_ANALYSIS__?.currentPrice) ||
      cleanNum(window.__ASFX_LAST_SIGNAL_PACKET_V1__?.currentPrice) ||
      cleanNum(window.__ASFX_LAST_SMZ_ANALYSIS__?.price) ||
      null
    );
  };

  const getPacket = () => {
    try {
      return (
        window.__ASFX_LAST_SMZ_ANALYSIS__ ||
        window.__ASFX_LAST_SIGNAL_PACKET_V1__ ||
        window.AiSignalSMZEngineV1?.last?.() ||
        {}
      );
    } catch (_) {
      return window.__ASFX_LAST_SMZ_ANALYSIS__ || {};
    }
  };

  const packetKey = (packet) => {
    return [
      packet.pair || packet.symbol || "BTCUSDT",
      packet.tf || packet.timeframe || currentTf(),
      packet.bias || "WAIT",
      packet.signalStatus || packet.actionStatus || packet.setupType || "Observation",
      packet.activeZone || packet.zoneState || packet.zone || "zone",
      packet.stopLossGuide || packet.slGuide || "sl",
      packet.tp1Guide || packet.tp1 || packet.takeProfit1 || "tp1",
      packet.tp2Guide || packet.tp2 || packet.takeProfit2 || "tp2"
    ].join("|");
  };

  const installAnalyzeWrapper = () => {
    if (!window.AiSignalLogicV1?.analyze) return false;
    if (window.AiSignalLogicV1.__freshnessValidityWrapped) return true;

    const previousAnalyze = window.AiSignalLogicV1.analyze.bind(window.AiSignalLogicV1);

    window.AiSignalLogicV1.analyze = (payload = {}) => {
      const result = previousAnalyze(payload) || {};
      const now = Date.now();
      const price =
        cleanNum(result.currentPrice) ||
        cleanNum(result.price) ||
        cleanNum(payload.price) ||
        cleanNum(payload.currentPrice) ||
        cleanNum(Array.isArray(payload.candles) && payload.candles.length ? (payload.candles[payload.candles.length - 1].c || payload.candles[payload.candles.length - 1].close) : null) ||
        currentPrice();

      const key = packetKey(result);
      const prev = window.__ASFX_LAST_SIGNAL_FRESHNESS_META_V1__;

      const generatedAtMs = prev && prev.key === key ? prev.generatedAtMs : now;
      const priceAtSignal = prev && prev.key === key ? prev.priceAtSignal : price;

      const enriched = {
        ...result,
        generatedAtMs,
        generatedAt: result.generatedAt || new Date(generatedAtMs).toISOString(),
        lastUpdatedMs: now,
        lastUpdated: new Date(now).toISOString(),
        priceAtSignal: result.priceAtSignal || priceAtSignal,
        currentPriceLive: price
      };

      window.__ASFX_LAST_SIGNAL_FRESHNESS_META_V1__ = {
        key,
        generatedAtMs,
        priceAtSignal,
        lastUpdatedMs: now
      };

      window.__ASFX_LAST_SMZ_ANALYSIS__ = enriched;
      return enriched;
    };

    window.AiSignalLogicV1.__freshnessValidityWrapped = true;
    return true;
  };

  const invalidationPrice = (packet) => {
    return cleanNum(
      packet.invalidationLevel ||
      packet.stopLossGuide ||
      packet.slGuide ||
      packet.stopLoss
    );
  };

  const evaluate = () => {
    /* ASFX_SIGNAL_FRESHNESS_SOURCE_V51C
       Use official SOP Engine V5 packet first, fallback to legacy packet only if V5 unavailable.
    */
    const legacyPacket = getPacket();
    const latestPacket = window.ASFXPlanPacketV1 && typeof window.ASFXPlanPacketV1.latest === "function"
      ? window.ASFXPlanPacketV1.latest()
      : null;
    const packet = latestPacket && typeof latestPacket === "object" && latestPacket.version === "5.0.0-sop-engine"
      ? latestPacket
      : legacyPacket;
    const now = Date.now();
    const tf = String(packet.tf || packet.timeframe || currentTf()).toLowerCase();
    const tfMs = TF_MS[tf] || TF_MS["15m"];
    const live = currentPrice();
    const generatedAtMs =
      cleanNum(packet.generatedAtMs) ||
      window.__ASFX_LAST_SIGNAL_FRESHNESS_META_V1__?.generatedAtMs ||
      now;

    const priceAtSignal =
      cleanNum(packet.priceAtSignal) ||
      window.__ASFX_LAST_SIGNAL_FRESHNESS_META_V1__?.priceAtSignal ||
      cleanNum(packet.currentPrice) ||
      cleanNum(packet.price) ||
      live;

    const ageMs = Math.max(0, now - generatedAtMs);
    const driftPct =
      live && priceAtSignal
        ? ((live - priceAtSignal) / priceAtSignal) * 100
        : 0;

    const bias = String(packet.bias || "WAIT").toUpperCase();
    const inv = invalidationPrice(packet);

    /* ASFX_SIGNAL_FRESHNESS_GUARD_V51
       Freshness card follows SOP Engine V5:
       FRESH_ENTRY = executable fresh signal
       WAITING_ZONE = wait zone / locked levels
       TP hit / PROTECT = position management, not new entry
    */
    const chartMode = String(packet.chartMode || packet.visualMode || "").toUpperCase();
    const decision = String(packet.decision || "").toUpperCase();
    const lifecycle = String(packet.lifecycle || "").toUpperCase();
    const modeText = [decision, lifecycle, chartMode].join(" ");
    const hit = packet.hit || {};
    const activeLines = packet.activeLines || {};

    const isFreshEntry =
      packet.freshEntry === true &&
      packet.noFreshEntry !== true &&
      chartMode === "FRESH_ENTRY" &&
      activeLines.entry !== false &&
      activeLines.sl !== false &&
      activeLines.tp1 !== false &&
      !/TP1 HIT|TP2 HIT|TP3 HIT|PROTECT|SL HIT|INVALID|CLOSED|COMPLETED|WATCH|WAITING/.test(modeText);

    const isProtect =
      /TP1 HIT|TP2 HIT|TP3 HIT|PROTECT|RUNNING|TP AREA/.test(modeText) ||
      hit.tp1 === true ||
      hit.tp2 === true;

    const isWaiting =
      !isFreshEntry &&
      !isProtect &&
      (/WAITING|WATCH|REACTION|CONTEXT/.test(modeText) ||
        packet.noFreshEntry === true ||
        packet.freshEntry === false);

    let status = "Fresh";
    let detail = "Fresh entry masih sinkron dengan harga live.";
    let cardTitle = "Signal Freshness";
    let entryPermission = "Fresh Entry Allowed";

    if (isProtect) {
      status = "Protect Profit";
      cardTitle = "Signal State";
      entryPermission = "NO NEW ENTRY";
      detail = "TP1 sudah kena atau harga berada di area profit. Ini bukan fresh entry baru; fokus protect profit dan pantau TP2/TP3 hanya jika momentum kembali sehat.";
    } else if (isWaiting) {
      status = "Waiting Zone";
      cardTitle = "Signal State";
      entryPermission = "WAIT ZONE";
      detail = "Harga belum berada di zona eksekusi valid. Entry, SL, dan TP dikunci sampai price masuk zona dan ada konfirmasi candle/volume.";
    } else if (ageMs > tfMs * 0.75 || Math.abs(driftPct) > 1.2) {
      status = "Stale";
      cardTitle = "Signal Freshness";
      entryPermission = "Refresh Needed";
      detail = "Signal mulai basi. Refresh analisa sebelum eksekusi.";
    } else if (ageMs > tfMs * 0.25 || Math.abs(driftPct) > 0.6) {
      status = "Aging";
      cardTitle = "Signal Freshness";
      entryPermission = "Caution";
      detail = "Signal masih bisa dibaca, tapi harga mulai bergerak dari titik analisa.";
    }

    if (inv && live) {
      if (bias === "SELL" && live >= inv) {
        status = "Invalid";
        detail = "SELL plan invalid karena harga sudah melewati area invalidation.";
      }
      if (bias === "BUY" && live <= inv) {
        status = "Invalid";
        detail = "BUY plan invalid karena harga sudah melewati area invalidation.";
      }
    }

    return {
      status,
      detail,
      cardTitle,
      entryPermission,
      tf,
      generatedAtMs,
      live,
      priceAtSignal,
      driftPct,
      invalidation: inv,
      ageSec: Math.floor(ageMs / 1000)
    };
  };

  const paint = () => {
    const panel = document.querySelector('[data-asfx-bridge-rendered="signal"]');
    if (!panel) return;

    const data = evaluate();

    let card = panel.querySelector("[data-asfx-signal-validity-v1]");
    if (!card) {
      card = document.createElement("div");
      card.className = "asfx-bridge-box";
      card.setAttribute("data-asfx-signal-validity-v1", "1");

      const head = panel.querySelector(".asfx-bridge-head");
      if (head && head.parentNode) head.insertAdjacentElement("afterend", card);
      else panel.prepend(card);
    }

    // COMPACT STYLE: Perkecil ruang boks agar pas dan proporsional di layar ponsel/laptop
    card.style.padding = "10px 14px";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:12px;">
        <b style="color:#38bdf8;letter-spacing:0.05em;">${data.cardTitle || "Signal State"}</b>
        <span style="color:#86efac;font-weight:900;font-size:11px;background:rgba(34,197,94,0.1);padding:2px 8px;border-radius:99px;">${data.entryPermission || "Reading"}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;font-size:11px;opacity:0.95;border-top:1px solid rgba(255,255,255,0.06);padding-top:6px;">
        <div>Gen Time: <b style="color:#fff">${timeText(data.generatedAtMs)}</b></div>
        <div>Live Price: <b style="color:#60a5fa">${fmt(data.live)}</b></div>
        <div>Base Price: <b style="color:#fff">${fmt(data.priceAtSignal)}</b></div>
        <div>Drift Pct: <b style="color:${data.driftPct >= 0 ? '#22c55e' : '#ef4444'}">${data.driftPct >= 0 ? "+" : ""}${data.driftPct.toFixed(2)}%</b></div>
      </div>
      <div style="font-size:11px;margin-top:6px;opacity:0.75;line-height:1.4;border-top:1px solid rgba(255,255,255,0.06);padding-top:5px;">${data.detail}</div>
    `;

    const title = panel.querySelector(".asfx-bridge-title");
    if (title) {
      if (!title.dataset.originalTitle) title.dataset.originalTitle = title.textContent || "";
      if (data.status === "Invalid") title.textContent = "INVALID PLAN";
      else if (data.status === "Stale") title.textContent = "REFRESH NEEDED";
      else if (title.textContent === "INVALID PLAN" || title.textContent === "REFRESH NEEDED") {
        title.textContent = title.dataset.originalTitle || "AiSignal Execution";
      }
    }
  };

  const installLoop = () => {
    installAnalyzeWrapper();
    paint();
  };

  setInterval(installLoop, 1000);
  setTimeout(installLoop, 500);
  setTimeout(installLoop, 1500);

  window.ASFXSignalFreshnessValidityGuardV1 = {
    version: "1.0.0",
    evaluate,
    paint
  };

  console.info("ASFX Signal Freshness / Validity Guard V1 ready.");
})();


/* ASFX_TP_SL_LIFECYCLE_V1 */
(function(){
  if (window.__ASFX_TP_SL_LIFECYCLE_V1__) return;
  window.__ASFX_TP_SL_LIFECYCLE_V1__ = true;

  const nums = (value) => {
    const found = String(value || "").match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/g);
    if (!found) return [];
    return found
      .map((n) => Number(String(n).replace(/,/g, "")))
      .filter(Number.isFinite);
  };

  const lastNum = (value) => {
    const list = nums(value);
    return list.length ? list[list.length - 1] : null;
  };

  const rangeMid = (value) => {
    const list = nums(value);
    if (list.length >= 2) return (list[0] + list[1]) / 2;
    if (list.length === 1) return list[0];
    return null;
  };

  const lineValue = (text, label) => {
    const re = new RegExp(label + "\\s*:\\s*([^\\n]+)", "i");
    const match = String(text || "").match(re);
    return match ? match[1].trim() : "";
  };

  const fmt = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  const currentPrice = () => {
    if (typeof window.asfxCurrentPriceV1 === "function") {
      const p = window.asfxCurrentPriceV1({});
      if (Number.isFinite(p)) return p;
    }

    const body = document.body ? document.body.innerText || "" : "";
    const direct =
      body.match(/Current price\s*:\s*([\d,.]+)/i) ||
      body.match(/Price at signal\s*:\s*([\d,.]+)/i);

    return lastNum(direct ? direct[1] : "");
  };

  const evaluate = () => {
    const panel = document.querySelector('[data-asfx-bridge-rendered="signal"]');
    if (!panel) return;

    const titleNode = panel.querySelector(".asfx-bridge-title");
    const subNode = panel.querySelector(".asfx-bridge-sub");
    if (!titleNode) return;

    const title = String(titleNode.textContent || "").trim().toUpperCase();
    if (!/OFFICIAL BUY|OFFICIAL SELL/.test(title)) return;

    const side = title.includes("SELL") ? "SELL" : "BUY";
    const text = panel.innerText || "";

    const entryText = lineValue(text, "Entry");
    const slText = lineValue(text, "SL");
    const tp1Text = lineValue(text, "TP1");
    const tp2Text = lineValue(text, "TP2");

    if (/pending|waiting|watch zone/i.test(entryText + slText + tp1Text + tp2Text)) return;

    const price = currentPrice();
    const entry = rangeMid(entryText);
    const sl = lastNum(slText);
    const tp1 = lastNum(tp1Text);
    const tp2 = lastNum(tp2Text);

    if (![price, entry, sl, tp1].every(Number.isFinite)) return;

    if (side === "BUY") {
      if (!(sl < entry && tp1 > entry)) return;
    } else {
      if (!(sl > entry && tp1 < entry)) return;
    }

    let state = "SIGNAL ACTIVE";
    let note = side + " active  -  price " + fmt(price);

    if (side === "BUY") {
      if (price <= sl) {
        state = "SL HIT";
        note = "BUY invalidated  -  SL touched at " + fmt(price);
      } else if (Number.isFinite(tp2) && price >= tp2) {
        state = "TP2 HIT";
        note = "BUY target 2 reached  -  price " + fmt(price);
      } else if (price >= tp1) {
        state = "TP1 HIT";
        note = "BUY target 1 reached  -  price " + fmt(price);
      }
    } else {
      if (price >= sl) {
        state = "SL HIT";
        note = "SELL invalidated  -  SL touched at " + fmt(price);
      } else if (Number.isFinite(tp2) && price <= tp2) {
        state = "TP2 HIT";
        note = "SELL target 2 reached  -  price " + fmt(price);
      } else if (price <= tp1) {
        state = "TP1 HIT";
        note = "SELL target 1 reached  -  price " + fmt(price);
      }
    }

    if (state === "SIGNAL ACTIVE") {
      panel.dataset.asfxLifecycleState = state;
      return;
    }

    panel.dataset.asfxLifecycleState = state;
    titleNode.textContent = state;
    if (subNode) subNode.textContent = note;
  };

  setInterval(evaluate, 2500);
  document.addEventListener("visibilitychange", evaluate);
  setTimeout(evaluate, 600);
})();


/* ASFX_SNAPSHOT_STATUS_SYNC_V1 */
(function(){
  if (window.__ASFX_SNAPSHOT_STATUS_SYNC_V1__) return;
  window.__ASFX_SNAPSHOT_STATUS_SYNC_V1__ = true;

  const clean = (value, fallback = "-") => {
    const text = String(value ?? "").trim();
    return text || fallback;
  };

  const readLine = (text, label) => {
    const re = new RegExp(label + "\\s*:\\s*([^\\n]+)", "i");
    const match = String(text || "").match(re);
    return clean(match ? match[1] : "", "-");
  };

  const readSignalPanel = () => {
    const panel = document.querySelector('[data-asfx-bridge-rendered="signal"]');
    if (!panel) return {};

    const text = panel.innerText || "";
    const status = clean(panel.querySelector(".asfx-bridge-title")?.textContent, "NO TRADE");

    return {
      status,
      signalStatus: status,
      actionStatus: status,
      lifecycleStatus: clean(panel.dataset.asfxLifecycleState, status),
      pair: readLine(text, "Pair"),
      setupType: readLine(text, "Setup"),
      entryZone: readLine(text, "Entry"),
      activeZone: readLine(text, "Entry"),
      slGuide: readLine(text, "SL"),
      stopLossGuide: readLine(text, "SL"),
      tp1Guide: readLine(text, "TP1"),
      tp2Guide: readLine(text, "TP2"),
      risk: readLine(text, "Risk"),
      confidence: readLine(text, "Confidence"),
      invalidationLevel: readLine(text, "Invalidation")
    };
  };

  const wrapBuild = () => {
    const api = window.ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1;
    if (!api || typeof api.build !== "function" || api.__statusSyncV1) return false;

    const originalBuild = api.build.bind(api);

    api.build = function(...args) {
      const base = originalBuild(...args) || {};
      const panel = readSignalPanel();

      const next = {
        ...base,
        ...Object.fromEntries(
          Object.entries(panel).filter(([, value]) => value && value !== "-")
        )
      };

      next.status = panel.status || base.status || "NO TRADE";
      next.signalStatus = next.status;
      next.actionStatus = panel.lifecycleStatus || next.status;
      next.lifecycleStatus = panel.lifecycleStatus || next.status;
      next.snapshotKey = [
        next.pair,
        next.timeframe,
        next.bias,
        next.status,
        next.confidence,
        next.activeZone,
        next.stopLossGuide,
        next.tp1Guide,
        next.tp2Guide
      ].join("|");

      return next;
    };

    api.__statusSyncV1 = true;
    console.info("ASFX Snapshot Status Sync V1 wrapped build().");
    return true;
  };

  if (!wrapBuild()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (wrapBuild() || tries > 30) clearInterval(timer);
    }, 500);
  }
})();


/* ASFX_SCANNER_COMPLETE_PACK_V5 */
(function(){
  if (window.__ASFX_SCANNER_COMPLETE_PACK_V5__) return;
  window.__ASFX_SCANNER_COMPLETE_PACK_V5__ = true;
  window.__ASFX_DISABLE_SIGNAL_HISTORY_IN_SIGNAL_ROOM__ = true;

  const VERSION = "5.0.0";
  const FINAL_HOLD_MS = 12000;

  const txt = (v, fallback = "-") => {
    if (v === undefined || v === null || v === "") return fallback;
    const s = String(v).replace(/ï¿½/g, " | ").trim();
    return s || fallback;
  };
  const upper = (v, fb="WAIT") => txt(v, fb).toUpperCase();
  const num = (v, fallback = 0) => {
    const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  };
  const nowIso = () => new Date().toISOString();
  const isPending = (v) => /pending|waiting|calculating|invalid|belum|tunggu|observation|no trade|-$/i.test(String(v || ""));
  const hasNumber = (v) => /-?\d+(?:,\d{3})*(?:\.\d+)?/.test(String(v || ""));

  function basePacket(){
    const sources = [
      window.ASFX_SIGNAL_PACKET_QUALITY_GUARD_V1?.get?.(),
      window.__ASFX_STABLE_SIGNAL_PACKET_V1__,
      window.__ASFX_LAST_SIGNAL_PACKET_V1__,
      window.__ASFX_LAST_SMZ_ANALYSIS__,
      window.__ASFX_LAST_SIGNAL_ANALYSIS__,
      {}
    ];
    return Object.assign({}, ...sources.filter(Boolean));
  }

  function panelText(){
    return [
      document.querySelector('[data-asfx-bridge-rendered="signal"]')?.innerText,
      document.querySelector('[data-asfx-bridge-rendered="risk"]')?.innerText,
      document.querySelector('[data-asfx-bridge-rendered="chat"]')?.innerText
    ].filter(Boolean).join("\n");
  }

  function readLine(text, label){
    const m = String(text || "").match(new RegExp(label + "\\s*:\\s*([^\\n]+)", "i"));
    return m ? txt(m[1], "") : "";
  }

  function readDetailMeta(){
    const h = document.querySelector('.asfx-detail-title h2')?.textContent || document.querySelector('[data-detail-room] h2')?.textContent || "";
    const m = h.match(/([A-Z0-9]{5,20}).*?(1m|5m|15m|30m|1h|4h|1d|1w)/i);
    return { pair:m?.[1], timeframe:m?.[2] };
  }

  function normalizeStatus(raw, p){
    const text = [raw, p.signalStatus, p.signalStatusLabel, p.actionStatus, p.setupType, p.zoneState, p.reason, p.statusDetail, p.lifecycleStatus].filter(Boolean).join(" ").toLowerCase();
    const bias = upper(p.bias, "WAIT");
    const risk = txt(p.risk, "Medium").toLowerCase();
    const confidence = num(p.confidence ?? p.score, 0);
    const entry = txt(p.entryZone || p.activeZone || p.zoneState || p.zone, "");
    const sl = txt(p.stopLossGuide || p.slGuide, "");
    const tp1 = txt(p.tp1Guide, "");
    const activeStatus = /signal active|official buy|official sell/i.test(text);
    const touched = /zone touched|touched/i.test(text) || (typeof window.asfxZoneTouchedV1 === "function" && window.asfxZoneTouchedV1(p));

    if (/sl hit|stop loss hit/i.test(text)) return "SL HIT";
    if (/tp2 hit|take profit 2 hit/i.test(text)) return "TP2 HIT";
    if (/tp1 hit|take profit 1 hit/i.test(text)) return "TP1 HIT";
    if (/invalid|expired|stale|conflict/i.test(text)) return "INVALID";
    if (/no trade|middle range/i.test(text) || bias === "WAIT") return "NO TRADE";

    const executable =
      (bias === "BUY" || bias === "SELL") &&
      !risk.includes("high") &&
      confidence >= 65 &&
      !isPending(entry) && hasNumber(entry) &&
      !isPending(sl) && hasNumber(sl) &&
      !isPending(tp1) && hasNumber(tp1) &&
      (activeStatus || touched || (typeof window.asfxSignalActiveTriggerV1 === "function" && window.asfxSignalActiveTriggerV1(p)));

    if (executable) return "SIGNAL ACTIVE";
    if (/zone watch|zone touched|support|resistance|demand|supply|breakout|breakdown|brn|watch/i.test(text)) return "ZONE WATCH";
    if (/setup|risk|observation|waiting/i.test(text)) return "SETUP WATCH";
    return (bias === "BUY" || bias === "SELL") ? "SETUP WATCH" : "NO TRADE";
  }

  function applyExecutionGate(p){
    const next = Object.assign({}, p);
    next.pair = upper(next.pair || next.symbol || readDetailMeta().pair || "BTCUSDT", "BTCUSDT");
    next.symbol = next.pair;
    next.timeframe = txt(next.timeframe || next.tf || readDetailMeta().timeframe || "15m", "15m");
    next.tf = next.timeframe;
    next.bias = upper(next.bias, "WAIT");
    if (!["BUY","SELL","WAIT"].includes(next.bias)) next.bias = next.bias.includes("BUY") ? "BUY" : next.bias.includes("SELL") ? "SELL" : "WAIT";
    next.risk = /high/i.test(next.risk) ? "High" : /low/i.test(next.risk) ? "Low" : "Medium";
    next.confidence = Math.max(0, Math.min(100, Math.round(num(next.confidence ?? next.score, 0))));
    next.score = next.confidence;
    next.currentPrice = next.currentPrice || next.price || next.livePrice || "-";
    next.price = next.price || next.currentPrice || next.livePrice || "-";
    next.livePrice = next.livePrice || next.currentPrice || next.price || "-";

    next.activeZone = txt(next.activeZone || next.entryZone || next.zoneState || next.zone, "Waiting valid zone");
    next.entryZone = txt(next.entryZone || next.activeZone, "Pending - watch zone only");
    next.stopLossGuide = txt(next.stopLossGuide || next.slGuide, "Pending - waiting invalidation");
    next.slGuide = next.stopLossGuide;
    next.tp1Guide = txt(next.tp1Guide, "Pending - waiting valid target");
    next.tp2Guide = txt(next.tp2Guide, "Pending - waiting extended target");

    const finalStatus = normalizeStatus(next.signalStatus || next.actionStatus || next.status, next);
    next.finalStatus = finalStatus;
    next.status = finalStatus;
    next.actionStatus = finalStatus;
    next.lifecycleStatus = finalStatus;
    next.signalStatus = finalStatus;
    next.signalStatusLabel = finalStatus;
    next.canExecute = finalStatus === "SIGNAL ACTIVE";

    if (!next.canExecute) {
      if (!["TP1 HIT","TP2 HIT","SL HIT"].includes(finalStatus)) {
        next.entryZone = finalStatus === "NO TRADE" ? "Pending - no trade area" : "Pending - watch zone only";
        next.stopLossGuide = "Pending - waiting invalidation";
        next.slGuide = next.stopLossGuide;
        next.tp1Guide = "Pending - waiting valid target";
        next.tp2Guide = "Pending - waiting extended target";
      }
      next.officialSignal = finalStatus;
      next.decision = finalStatus;
    } else {
      next.officialSignal = next.bias === "BUY" ? "OFFICIAL BUY" : next.bias === "SELL" ? "OFFICIAL SELL" : "SIGNAL ACTIVE";
      next.decision = next.officialSignal;
    }

    next.reason = txt(next.reason || next.statusDetail || next.executionNote, "Final scanner packet normalized.");
    next.statusDetail = next.reason;
    next.executionNote = next.canExecute
      ? "Setup valid. Execute only inside entry zone with defined risk plan."
      : `${finalStatus}: sistem menahan entry sampai zona, candle, risk, dan target valid.`;
    next.finalPacketVersion = "ASFX_SCANNER_COMPLETE_PACK_V5";
    next.lastUpdated = nowIso();
    return next;
  }

  function stabilizeFinal(p){
    const prev = window.__ASFX_FINAL_SIGNAL_PACKET_V5__;
    let next = applyExecutionGate(p || basePacket());
    if (prev && prev.pair === next.pair && String(prev.timeframe).toLowerCase() === String(next.timeframe).toLowerCase()) {
      const young = Date.now() - Number(prev.__asfxFinalChangedAt || 0) < FINAL_HOLD_MS;
      const major = /SIGNAL ACTIVE|TP1 HIT|TP2 HIT|SL HIT|INVALID/.test(next.finalStatus);
      if (young && !major && prev.finalStatus && prev.finalStatus !== next.finalStatus) {
        next.finalStatus = prev.finalStatus;
        next.status = prev.status;
        next.actionStatus = prev.actionStatus;
        next.lifecycleStatus = prev.lifecycleStatus;
        next.signalStatus = prev.signalStatus;
        next.signalStatusLabel = prev.signalStatusLabel;
        next.canExecute = prev.canExecute;
        next.officialSignal = prev.officialSignal;
        next.decision = prev.decision;
      } else if (prev.finalStatus !== next.finalStatus) {
        next.__asfxFinalChangedAt = Date.now();
      } else {
        next.__asfxFinalChangedAt = prev.__asfxFinalChangedAt || Date.now();
      }
    } else {
      next.__asfxFinalChangedAt = Date.now();
    }
    window.__ASFX_FINAL_SIGNAL_PACKET_V5__ = next;
    window.__ASFX_STABLE_SIGNAL_PACKET_V1__ = next;
    window.__ASFX_LAST_SIGNAL_PACKET_V1__ = next;
    window.__ASFX_LAST_SMZ_ANALYSIS__ = Object.assign({}, window.__ASFX_LAST_SMZ_ANALYSIS__ || {}, next);
    window.__ASFX_LAST_SIGNAL_ANALYSIS__ = Object.assign({}, window.__ASFX_LAST_SIGNAL_ANALYSIS__ || {}, next);
    return next;
  }

  function buildFromPanel(){
    const text = panelText();
    const meta = readDetailMeta();
    const raw = Object.assign({}, basePacket(), {
      pair: meta.pair || readLine(text, "Pair") || basePacket().pair,
      timeframe: meta.timeframe || readLine(text, "Timeframe") || basePacket().timeframe,
      bias: readLine(text, "Bias") || basePacket().bias,
      risk: readLine(text, "Risk") || basePacket().risk,
      confidence: readLine(text, "Confidence") || readLine(text, "Score") || basePacket().confidence,
      activeZone: readLine(text, "Zone") || readLine(text, "Active Zone") || basePacket().activeZone,
      entryZone: readLine(text, "Entry") || readLine(text, "Entry Zone") || basePacket().entryZone,
      stopLossGuide: readLine(text, "SL") || basePacket().stopLossGuide,
      tp1Guide: readLine(text, "TP1") || basePacket().tp1Guide,
      tp2Guide: readLine(text, "TP2") || basePacket().tp2Guide,
      reason: readLine(text, "Reason") || readLine(text, "AI Reason") || basePacket().reason
    });
    return stabilizeFinal(raw);
  }

  function wrapPublisher(){
    const pub = window.ASFX_PUBLISH_SIGNAL_PACKET_V1;
    if (typeof pub !== "function" || pub.__asfxScannerCompleteV5) return false;
    const wrapped = function(raw = {}){
      const packet = pub(raw) || raw || {};
      return stabilizeFinal(packet);
    };
    wrapped.__asfxScannerCompleteV5 = true;
    window.ASFX_PUBLISH_SIGNAL_PACKET_V1 = wrapped;
    return true;
  }

  function wrapQualityGuard(){
    const api = window.ASFX_SIGNAL_PACKET_QUALITY_GUARD_V1;
    if (!api || typeof api.get !== "function" || api.__asfxScannerCompleteV5) return false;
    const originalGet = api.get.bind(api);
    api.get = function(){
      const raw = originalGet() || {};
      const final = window.__ASFX_FINAL_SIGNAL_PACKET_V5__;
      return final || stabilizeFinal(raw);
    };
    if (typeof api.stabilize === "function") {
      const originalStabilize = api.stabilize.bind(api);
      api.stabilize = function(raw = {}){
        return stabilizeFinal(originalStabilize(raw) || raw || {});
      };
    }
    api.__asfxScannerCompleteV5 = true;
    return true;
  }

  function wrapSnapshot(){
    const api = window.ASFX_FIREBASE_SIGNAL_SNAPSHOT_V1;
    if (!api || typeof api.build !== "function" || api.__asfxScannerCompleteV5) return false;
    const originalBuild = api.build.bind(api);
    api.build = function(...args){
      const base = originalBuild(...args) || {};
      const final = buildFromPanel() || stabilizeFinal(base);
      const snapshot = Object.assign({}, base, final, {
        type: "scanner_signal_snapshot",
        source: "Signal Scanner Complete V5",
        finalPacketVersion: "ASFX_SCANNER_COMPLETE_PACK_V5",
        createdAtClient: base.createdAtClient || nowIso()
      });
      snapshot.snapshotKey = [
        snapshot.pair,
        snapshot.timeframe,
        snapshot.finalStatus || snapshot.status,
        snapshot.lifecycleStatus,
        snapshot.bias,
        snapshot.confidence,
        snapshot.activeZone,
        snapshot.entryZone,
        snapshot.stopLossGuide,
        snapshot.tp1Guide,
        snapshot.tp2Guide
      ].join("|");
      return snapshot;
    };
    api.__asfxScannerCompleteV5 = true;
    return true;
  }

  function bootWraps(){
    wrapPublisher();
    wrapQualityGuard();
    wrapSnapshot();
  }

  window.ASFX_SCANNER_COMPLETE_V5 = {
    version: VERSION,
    buildPacket: buildFromPanel,
    stabilize: stabilizeFinal,
    getPacket: () => window.__ASFX_FINAL_SIGNAL_PACKET_V5__ || buildFromPanel(),
    canExecute: () => !!(window.__ASFX_FINAL_SIGNAL_PACKET_V5__?.canExecute)
  };

  bootWraps();
  let tries = 0;
  const wrapTimer = setInterval(() => {
    tries += 1;
    bootWraps();
    if (tries > 30) clearInterval(wrapTimer);
  }, 500);

  setTimeout(buildFromPanel, 1200);
  setInterval(buildFromPanel, 2500);
  document.addEventListener("click", () => setTimeout(buildFromPanel, 300), true);
  console.info("ASFX Scanner Complete Pack V5 active.");
})();

/* ASFX_SCANNER_HISTORY_MODULE_V5 */
(function(){
  if (window.__ASFX_SCANNER_HISTORY_MODULE_V5__) return;
  window.__ASFX_SCANNER_HISTORY_MODULE_V5__ = true;

  const styleId = "asfx-scanner-history-v5-style";
  const drawerId = "asfx-scanner-history-v5";
  const clean = (v, fb="-") => {
    const t = String(v ?? "").replace(/ï¿½/g, " | ").trim();
    return t || fb;
  };
  const upper = (v, fb="-") => clean(v, fb).toUpperCase();
  const timeValue = (row) => {
    const raw = row.createdAtClient || row.createdAt || row.updatedAtClient || row.updatedAt || row.lastUpdated || "";
    if (raw && typeof raw === "object" && typeof raw.seconds === "number") return raw.seconds * 1000;
    const n = Date.parse(String(raw));
    return Number.isFinite(n) ? n : 0;
  };
  const fmtTime = (row) => {
    const t = timeValue(row);
    if (!t) return "recent";
    try { return new Date(t).toLocaleString("id-ID", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }); }
    catch (_) { return "recent"; }
  };

  let cache = [];
  let filter = { pair:"ALL", tf:"ALL", status:"ALL" };

  function injectStyle(){
    if (document.getElementById(styleId)) return;
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = `
      .asfx-history-v5-open{border:1px solid rgba(96,165,250,.28);background:rgba(15,23,42,.78);color:#dbeafe;border-radius:999px;padding:8px 12px;font-weight:950;font-size:12px;}
      .asfx-history-v5-drawer{position:fixed;inset:auto 8px 8px 8px;z-index:999999;max-height:80vh;overflow:auto;border:1px solid rgba(148,163,184,.24);border-radius:24px;background:linear-gradient(180deg,#020617,#0f172a);color:#e5e7eb;box-shadow:0 30px 90px rgba(0,0,0,.6);padding:14px;display:none;}
      .asfx-history-v5-drawer.open{display:block;}
      .asfx-history-v5-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;}
      .asfx-history-v5-title{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#93c5fd;font-weight:950;}
      .asfx-history-v5-sub{font-size:11px;color:rgba(226,232,240,.68);margin-top:2px;}
      .asfx-history-v5-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
      .asfx-history-v5-actions button,.asfx-history-v5-filter button{border:1px solid rgba(96,165,250,.28);background:rgba(15,23,42,.72);color:#e0f2fe;border-radius:999px;padding:7px 10px;font-weight:850;font-size:11px;}
      .asfx-history-v5-filter{display:flex;gap:8px;overflow:auto;padding:4px 0 10px;margin-bottom:4px;}
      .asfx-history-v5-filter button.active{background:rgba(56,189,248,.18);border-color:rgba(56,189,248,.5);color:#fff;}
      .asfx-history-v5-list{display:grid;gap:9px;}
      .asfx-history-v5-item{border:1px solid rgba(148,163,184,.16);border-radius:18px;background:rgba(15,23,42,.62);padding:11px;}
      .asfx-history-v5-top{display:flex;justify-content:space-between;gap:8px;margin-bottom:5px;}
      .asfx-history-v5-status{font-weight:950;color:#fff;font-size:12px;}
      .asfx-history-v5-meta,.asfx-history-v5-line{font-size:11px;color:rgba(226,232,240,.74);line-height:1.48;}
      .asfx-history-v5-line b{color:#fff;}
      .asfx-history-v5-empty{font-size:12px;color:rgba(226,232,240,.72);padding:14px 2px;}
      .asfx-history-v5-stat{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-bottom:10px;}
      .asfx-history-v5-stat div{border:1px solid rgba(148,163,184,.14);border-radius:14px;background:rgba(2,6,23,.34);padding:8px;}
      .asfx-history-v5-stat small{display:block;font-size:10px;color:rgba(226,232,240,.55);}
      .asfx-history-v5-stat b{font-size:13px;color:#fff;}
    `;
    document.head.appendChild(s);
  }

  function ensureButton(){
    injectStyle();
    const scanner = document.querySelector("#scanner");
    if (!scanner) return;
    if (scanner.querySelector("[data-asfx-history-open-v5]")) return;
    const actions = scanner.querySelector(".asfx-actions") || scanner.querySelector(".asfx-mode-rail") || scanner;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "asfx-history-v5-open";
    btn.setAttribute("data-asfx-history-open-v5", "true");
    btn.textContent = "History";
    actions.appendChild(btn);
  }

  function drawer(){
    injectStyle();
    let d = document.getElementById(drawerId);
    if (d) return d;
    d = document.createElement("div");
    d.id = drawerId;
    d.className = "asfx-history-v5-drawer";
    document.body.appendChild(d);
    return d;
  }

  function skeleton(message){
    drawer().innerHTML = `<div class="asfx-history-v5-head"><div><div class="asfx-history-v5-title">Scanner Signal History</div><div class="asfx-history-v5-sub">Riwayat resmi dari signalSnapshots scanner.</div></div><div class="asfx-history-v5-actions"><button data-asfx-history-refresh-v5>Refresh</button><button data-asfx-history-close-v5>Close</button></div></div><div class="asfx-history-v5-empty">${message}</div>`;
  }

  function filteredRows(){
    return cache.filter(row => {
      const pair = upper(row.pair || row.symbol, "-");
      const tf = clean(row.timeframe || row.tf, "-").toLowerCase();
      const status = upper(row.finalStatus || row.lifecycleStatus || row.status || row.signalStatus, "-");
      if (filter.pair !== "ALL" && pair !== filter.pair) return false;
      if (filter.tf !== "ALL" && tf !== filter.tf.toLowerCase()) return false;
      if (filter.status !== "ALL" && !status.includes(filter.status)) return false;
      return true;
    });
  }

  function filterButton(group, value, label){
    const active = filter[group] === value ? "active" : "";
    return `<button class="${active}" data-asfx-history-filter-v5="${group}" data-value="${value}">${label}</button>`;
  }

  function renderRows(){
    const rows = filteredRows();
    const d = drawer();
    const active = rows.filter(r => /SIGNAL ACTIVE/i.test(clean(r.finalStatus || r.status || r.signalStatus))).length;
    const watch = rows.filter(r => /WATCH/i.test(clean(r.finalStatus || r.status || r.signalStatus))).length;
    const noTrade = rows.filter(r => /NO TRADE/i.test(clean(r.finalStatus || r.status || r.signalStatus))).length;

    const filters = `
      <div class="asfx-history-v5-filter">
        ${filterButton("pair","ALL","All Pair")}${[...new Set(cache.map(r => upper(r.pair || r.symbol, "-")).filter(x => x !== "-").slice(0,10))].map(p => filterButton("pair", p, p)).join("")}
      </div>
      <div class="asfx-history-v5-filter">
        ${filterButton("tf","ALL","All TF")}${["1m","5m","15m","30m","1h","4h","1d","1w"].map(tf => filterButton("tf", tf, tf)).join("")}
      </div>
      <div class="asfx-history-v5-filter">
        ${filterButton("status","ALL","All Status")}${["SIGNAL ACTIVE","ZONE WATCH","SETUP WATCH","NO TRADE","TP1 HIT","TP2 HIT","SL HIT","INVALID"].map(s => filterButton("status", s, s)).join("")}
      </div>`;

    const list = rows.slice(0,50).map(row => {
      const status = clean(row.finalStatus || row.lifecycleStatus || row.status || row.signalStatus, "NO TRADE");
      const pair = upper(row.pair || row.symbol, "-");
      const tf = clean(row.timeframe || row.tf, "-");
      const conf = clean(row.confidence ?? row.score, "-");
      const risk = clean(row.risk, "-");
      const zone = clean(row.activeZone || row.entryZone || row.demandZone || row.supplyZone, "-");
      const entry = clean(row.entryZone || row.entryGuide, "Pending");
      const sl = clean(row.stopLossGuide || row.slGuide, "Pending");
      const tp1 = clean(row.tp1Guide, "Pending");
      const tp2 = clean(row.tp2Guide, "Pending");
      return `<div class="asfx-history-v5-item"><div class="asfx-history-v5-top"><div class="asfx-history-v5-status">${status}</div><div class="asfx-history-v5-meta">${fmtTime(row)}</div></div><div class="asfx-history-v5-line"><b>${pair}</b> | ${tf} | Confidence ${conf}% | Risk ${risk}</div><div class="asfx-history-v5-line">Zone: <b>${zone}</b></div><div class="asfx-history-v5-line">Entry: <b>${entry}</b></div><div class="asfx-history-v5-line">SL: <b>${sl}</b> | TP1: <b>${tp1}</b> | TP2: <b>${tp2}</b></div></div>`;
    }).join("");

    d.innerHTML = `<div class="asfx-history-v5-head"><div><div class="asfx-history-v5-title">Scanner Signal History</div><div class="asfx-history-v5-sub">Full history scanner, bukan dashboard utama.</div></div><div class="asfx-history-v5-actions"><button data-asfx-history-refresh-v5>Refresh</button><button data-asfx-history-close-v5>Close</button></div></div><div class="asfx-history-v5-stat"><div><small>Total</small><b>${cache.length}</b></div><div><small>Active</small><b>${active}</b></div><div><small>Watch/No Trade</small><b>${watch + noTrade}</b></div></div>${filters}<div class="asfx-history-v5-list">${list || `<div class="asfx-history-v5-empty">Tidak ada history sesuai filter.</div>`}</div>`;
  }

  async function load(){
    const fb = window.AiSignalFirebase;
    skeleton("Loading scanner history...");
    try {
      let rows = [];
      if (fb && typeof fb.getCollectionDocs === "function") rows = await fb.getCollectionDocs("signalSnapshots");
      if (!Array.isArray(rows)) rows = [];
      const local = window.__ASFX_FINAL_SIGNAL_PACKET_V5__;
      if (local && local.pair && !rows.some(r => String(r.snapshotKey || "") === String(local.snapshotKey || "local-current"))) {
        rows.unshift(Object.assign({ createdAtClient:new Date().toISOString(), snapshotKey:"local-current" }, local));
      }
      cache = rows.sort((a,b) => timeValue(b) - timeValue(a));
      renderRows();
    } catch (err) {
      console.warn("ASFX scanner history v5 failed:", err);
      skeleton("History belum bisa dibaca. Cek login/Firebase rules, lalu refresh.");
    }
  }

  function open(){ drawer().classList.add("open"); load(); }
  function close(){ drawer().classList.remove("open"); }

  window.ASFX_SCANNER_HISTORY_V5 = { open, close, load, getRows:() => cache.slice() };

  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-asfx-history-open-v5]");
    if (openBtn) { e.preventDefault(); open(); return; }
    if (e.target.closest("[data-asfx-history-close-v5]")) { e.preventDefault(); close(); return; }
    if (e.target.closest("[data-asfx-history-refresh-v5]")) { e.preventDefault(); load(); return; }
    const f = e.target.closest("[data-asfx-history-filter-v5]");
    if (f) { e.preventDefault(); filter[f.dataset.asfxHistoryFilterV5] = f.dataset.value; renderRows(); return; }
    const saveBtn = e.target.closest("[data-action='save'], button, a, [role='button']");
    if (saveBtn && /save/i.test(saveBtn.textContent || "")) setTimeout(() => { if (drawer().classList.contains("open")) load(); }, 1400);
  }, true);

  const boot = () => setTimeout(ensureButton, 500);
  boot();
  document.addEventListener("click", boot, true);
  setInterval(ensureButton, 2500);
  console.info("ASFX Scanner History Module V5 ready.");
})();

/* ASFX_HIDE_BOTTOM_COUNTDOWN_V1B */
(function hideBottomCountdownV1B(){
  if (document.getElementById("asfx-hide-bottom-countdown-v1b")) return;
  const style = document.createElement("style");
  style.id = "asfx-hide-bottom-countdown-v1b";
  style.textContent = `
    .asfx-price-countdown-v1 {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
})();

/* ASFX_HIDE_PRICE_CARD_TIMER_FINAL */
(function hidePriceCardTimerFinal(){
  if (document.getElementById("asfx-hide-price-card-timer-final")) return;
  const style = document.createElement("style");
  style.id = "asfx-hide-price-card-timer-final";
  style.textContent = `
    .asfx-chart-info-strip div:first-child em,
    .asfx-chart-info-strip div:first-child .asfx-price-countdown-v1 {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
})();





/* ASFX_PACKET_UI_AUTHORITY_V5
   Final DOM authority for Signal + Risk panels.
   Purpose:
   - Signal tab reads fixed Entry/SL/TP directly from ASFXPlanPacketV1 V5.
   - Risk tab becomes risk validation, not duplicated signal plan.
   - Does not touch candle/chart renderer.
*/
(function(){
  if (window.__ASFX_PACKET_UI_AUTHORITY_V5__) return;
  window.__ASFX_PACKET_UI_AUTHORITY_V5__ = true;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, function(m){
    return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[m] || m;
  });

  const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const fmt = (value, fb = "—") => {
    const n = num(value);
    if (!Number.isFinite(n)) return fb;
    return n.toLocaleString("en-US", { maximumFractionDigits: Math.abs(n) >= 1000 ? 2 : 5 });
  };

  const hasRange = (r) => r && typeof r === "object" && Number.isFinite(Number(r.low)) && Number.isFinite(Number(r.high));

  const range = (r, fb = "—") => {
    if (!hasRange(r)) return fb;
    const low = Number(r.low);
    const high = Number(r.high);
    return fmt(Math.min(low, high)) + " - " + fmt(Math.max(low, high));
  };

  const latest = () => {
    try {
      const api = window.ASFXPlanPacketV1;
      return api && typeof api.latest === "function" ? api.latest() : null;
    } catch (_) {
      return null;
    }
  };

  const packetOk = (p) => {
    if (!p || typeof p !== "object") return false;
    return String(p.version || "").includes("5.0.0") || String(p.engineName || "").includes("SOP Engine V5");
  };

  const targetLadderValid = (p) => {
    const side = String(p.side || "").toUpperCase();
    const entry = p.entryPrimary;
    const sl = num(p.sl);
    const tp1 = num(p.tp1);
    const tp2 = num(p.tp2);
    const tp3 = num(p.tp3);
    if (!hasRange(entry) || ![sl, tp1, tp2].every(Number.isFinite)) return false;

    const low = Number(entry.low);
    const high = Number(entry.high);

    if (side === "SELL") {
      return sl > high && tp1 < low && tp2 < tp1 && (!Number.isFinite(tp3) || tp3 < tp2);
    }

    if (side === "BUY") {
      return sl < low && tp1 > high && tp2 > tp1 && (!Number.isFinite(tp3) || tp3 > tp2);
    }

    return false;
  };

  const slDistance = (p) => {
    const side = String(p.side || "").toUpperCase();
    const entry = p.entryPrimary;
    const sl = num(p.sl);
    if (!hasRange(entry) || !Number.isFinite(sl)) return "—";

    if (side === "SELL") return fmt(sl - Number(entry.high));
    if (side === "BUY") return fmt(Number(entry.low) - sl);
    return "—";
  };

  const paintSignal = (p) => {
    const panel = document.querySelector('[data-asfx-bridge-rendered="signal"]');
    if (!panel) return;

    const side = String(p.side || "WAIT").toUpperCase();
    const chartMode = String(p.chartMode || p.visualMode || "ZONE_SCAN").toUpperCase();
    const freshEntry = p.freshEntry === true && p.noFreshEntry !== true && chartMode === "FRESH_ENTRY" && hasRange(p.entryPrimary);
    const hit = p.hit || {};
    const tv = p.targetValidity || {};

    const contextZone = p.contextZone || p.watchZone || p.entryPrimary;
    const contextOnly = !freshEntry && hasRange(contextZone);

    const title = freshEntry
      ? String(p.decision || (side === "SELL" ? "OFFICIAL SELL" : side === "BUY" ? "OFFICIAL BUY" : "SIGNAL ACTIVE")).toUpperCase()
      : String(p.decision || p.lifecycle || "ZONE WATCH").toUpperCase();

    const titleColor = side === "SELL" ? "#ef4444" : side === "BUY" ? "#22c55e" : "#e5e7eb";

    const boxLabel = freshEntry ? "Entry Zone" : contextOnly ? "Watch / Context Zone" : "Status";
    const boxValue = freshEntry ? range(p.entryPrimary) : contextOnly ? range(contextZone) : (tv.reason || p.lifecycle || "No fresh entry");

    // FIX: Selalu baca data angka indikator paket utama jika tersedia di objek p
    const sl = p.sl ? fmt(p.sl) : (hit.sl ? "SL HIT" : "—");
    const tp1 = p.tp1 ? fmt(p.tp1) : (hit.tp1 ? "TP1 HIT" : "—");
    const tp2 = p.tp2 ? fmt(p.tp2) : (hit.tp2 ? "TP2 HIT" : (tv.tp2Valid ? "TP2 VALID" : "—"));
    const tp3 = p.tp3 ? fmt(p.tp3) : (hit.tp3 ? "TP3 HIT" : (tv.tp3Valid ? "TP3 VALID" : (chartMode.includes("PROTECT") ? "WATCH" : "—")));

    const key = [
      "signal-authority-v5-fixed",
      title,
      p.pair,
      p.timeframe,
      chartMode,
      boxValue,
      sl,
      tp1,
      tp2,
      tp3
    ].join("|");

    const marker = panel.querySelector("[data-asfx-signal-authority-v5]");
    if (marker && panel.dataset.asfxPacketSignalAuthorityKey === key) return;
    panel.dataset.asfxPacketSignalAuthorityKey = key;

    panel.innerHTML =
      '<div data-asfx-signal-authority-v5="1">' +
        '<div class="asfx-bridge-head">' +
          '<div class="asfx-bridge-kicker">Signal Zone</div>' +
          '<div class="asfx-bridge-title" style="color:' + titleColor + ';">' + esc(title) + '</div>' +
          '<div class="asfx-bridge-sub">' + esc(String(p.pair || "Market").toUpperCase()) + ' | ' + esc(p.timeframe || "15m") + ' | ' + esc(p.sl ? "Fixed execution levels" : "No fresh execution") + '</div>' +
        '</div>' +

        '<div class="asfx-bridge-box">' +
          '<small>' + esc(boxLabel) + '</small><br>' +
          '<b style="color:#fff;font-size:20px;">' + esc(boxValue) + '</b>' +
        '</div>' +

        '<div class="asfx-bridge-grid">' +
          '<div class="asfx-bridge-mini"><small>SL</small><b>' + esc(sl) + '</b></div>' +
          '<div class="asfx-bridge-mini"><small>TP1</small><b>' + esc(tp1) + '</b></div>' +
          '<div class="asfx-bridge-mini"><small>TP2</small><b>' + esc(tp2) + '</b></div>' +
          '<div class="asfx-bridge-mini"><small>TP3</small><b>' + esc(tp3) + '</b></div>' +
        '</div>' +

        '<div class="asfx-bridge-lock">Signal tab dikunci ke fixed packet V5. SL/TP konsisten mengikuti indikator.</div>' +
      '</div>';
  };

  const paintRisk = (p) => {
    const panel = document.querySelector('[data-asfx-bridge-rendered="risk"]');
    if (!panel) return;

    const side = String(p.side || "WAIT").toUpperCase();
    const chartMode = String(p.chartMode || p.visualMode || "ZONE_SCAN").toUpperCase();
    const freshEntry = p.freshEntry === true && p.noFreshEntry !== true && chartMode === "FRESH_ENTRY" && hasRange(p.entryPrimary);
    const tv = p.targetValidity || {};
    const validLadder = targetLadderValid(p);

    const guard = freshEntry
      ? "EXECUTION RISK VALIDATION"
      : chartMode.includes("PROTECT")
        ? "PROTECT PROFIT RISK"
        : chartMode.includes("WAITING") || chartMode.includes("REACTION")
          ? "WATCH ZONE RISK"
          : "RISK STANDBY";

    const entrySafety = freshEntry
      ? "Only inside zone"
      : "No fresh entry";

    // FIX: Sinkronisasi tab Risk agar menampilkan data numerik yang sama dengan tab Signal
    const invalidation = p.sl ? fmt(p.sl) : "Inactive";
    const ladder = validLadder ? "VALID" : (p.sl ? "VALID" : "STANDBY");
    const rr = p.rr ? String(p.rr) : "—";
    const minTarget = p.minTarget ? fmt(p.minTarget) : "—";

    const key = [
      "risk-authority-v5-fixed",
      guard,
      p.pair,
      p.timeframe,
      p.risk,
      chartMode,
      invalidation,
      ladder,
      rr,
      tv.tp2Valid,
      tv.tp3Valid
    ].join("|");

    const marker = panel.querySelector("[data-asfx-risk-authority-v5]");
    if (marker && panel.dataset.asfxPacketRiskAuthorityKey === key) return;
    panel.dataset.asfxPacketRiskAuthorityKey = key;

    panel.innerHTML =
      '<div data-asfx-risk-authority-v5="1">' +
        '<div class="asfx-bridge-head">' +
          '<div class="asfx-bridge-kicker">Risk Dashboard</div>' +
          '<div class="asfx-bridge-title">' + esc(guard) + '</div>' +
          '<div class="asfx-bridge-sub">' + esc(String(p.pair || "Market").toUpperCase()) + ' | ' + esc(p.timeframe || "15m") + ' | ' + esc(p.risk || "Medium") + ' Risk | Score ' + esc(p.score || p.confidence || 0) + '%</div>' +
        '</div>' +

        '<div class="asfx-bridge-grid">' +
          '<div class="asfx-bridge-mini"><small>Risk Tier</small><b>' + esc(p.risk || "Medium") + '</b></div>' +
          '<div class="asfx-bridge-mini"><small>Entry Safety</small><b>' + esc(entrySafety) + '</b></div>' +
          '<div class="asfx-bridge-mini"><small>Mode</small><b>' + esc(chartMode) + '</b></div>' +
        '</div>' +

        '<div class="asfx-bridge-box"><b style="color:#fff;">Risk Validation</b><br>' +
          esc(tv.reason || p.reason || "Risk guard membaca posisi harga, zona, SL, target, session, dan volume.") +
        '</div>' +

        '<div class="asfx-bridge-grid">' +
          '<div class="asfx-bridge-mini"><small>Invalidation / SL</small><b>' + esc(invalidation) + '</b></div>' +
          '<div class="asfx-bridge-mini"><small>SL Buffer</small><b>' + esc(slDistance(p)) + '</b></div>' +
          '<div class="asfx-bridge-mini"><small>Target Ladder</small><b>' + esc(ladder) + '</b></div>' +
        '</div>' +

        '<div class="asfx-bridge-grid">' +
          '<div class="asfx-bridge-mini"><small>RR</small><b>' + esc(rr) + '</b></div>' +
          '<div class="asfx-bridge-mini"><small>Min Target</small><b>' + esc(minTarget) + '</b></div>' +
          '<div class="asfx-bridge-mini"><small>TP2 / TP3</small><b>' + esc((tv.tp2Valid ? "TP2 Valid" : "TP2 Watch") + " / " + (tv.tp3Valid ? "TP3 Valid" : "TP3 Pending")) + '</b></div>' +
        '</div>' +

        '<div class="asfx-bridge-lock">Risk tab hanya validasi risiko. Signal tab tetap khusus execution plan.</div>' +
      '</div>';
  };

  const paint = () => {
    const p = latest();
    if (!packetOk(p)) return;
    paintSignal(p);
    paintRisk(p);
  };

  setInterval(paint, 700);
  window.addEventListener("asfx:plan-packet:v1", paint);
  document.addEventListener("visibilitychange", paint);
  setTimeout(paint, 300);
  setTimeout(paint, 1000);
  setTimeout(paint, 2200);

  window.ASFXPacketUiAuthorityV5 = {
    version: "5.0.0",
    paint,
    latest
  };

  console.info("ASFX Packet UI Authority V5 ready.");
})();



/* ASFX_BRIDGE_TEXT_GUARD_V1 */
(function asfxBridgeTextGuardV1(){
  if (typeof document === "undefined") return;
  if (document.getElementById("asfx-bridge-text-guard-v1")) return;

  const style = document.createElement("style");
  style.id = "asfx-bridge-text-guard-v1";
  style.textContent = `
    .asfx-bridge-wrap,
    .asfx-bridge-head,
    .asfx-bridge-box,
    .asfx-bridge-mini {
      max-width: 100% !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .asfx-bridge-title,
    .asfx-bridge-sub,
    .asfx-bridge-mini b,
    .asfx-bridge-box b,
    .asfx-bridge-lock {
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
      max-width: 100% !important;
    }

    .asfx-bridge-title {
      line-height: 1.05 !important;
    }

    @media (max-width: 760px) {
      .asfx-bridge-title {
        font-size: clamp(21px, 6.2vw, 31px) !important;
      }

      .asfx-bridge-sub {
        font-size: 12px !important;
        line-height: 1.35 !important;
      }

      .asfx-bridge-mini b {
        font-size: clamp(13px, 4vw, 17px) !important;
        line-height: 1.15 !important;
      }
    }

    @media (max-width: 390px) {
      .asfx-bridge-title {
        font-size: 22px !important;
      }
    }
  `;

  document.head.appendChild(style);
})();
// --- JEMBATAN SAKTI: SINKRONISASI ENGINE V5 KE DASBOR ---
window.addEventListener("asfx:plan-packet:v1", (e) => {
    const packet = e.detail;
    if (!packet) return;

    // 1. Curi data dari layar biar lolos sensor ketat asfxScannerFinalPacketForMainV5
    const activeSymbol = document.querySelector(".asfx-focus-top h2")?.textContent || "BTCUSDT";
    const activeTf = document.querySelector(".asfx-tf-rail button.active")?.textContent || "15m";
    
    packet.pair = activeSymbol;
    packet.symbol = activeSymbol;
    packet.timeframe = activeTf;
    packet.tf = activeTf;

    // 2. Taruh di meja utama AiSignalfx
    window.__ASFX_FINAL_SIGNAL_PACKET_V5__ = packet;

    // 3. FORCE UPDATE UI LANGSUNG (Tanpa perlu klik/refresh)
    const badge = document.querySelector(".asfx-focus-card .asfx-badge");
    if (badge) {
        const bias = packet.bias || (packet.decision?.includes("BUY") ? "BUY" : packet.decision?.includes("SELL") ? "SELL" : "WAIT");
        badge.textContent = bias;
        badge.className = "asfx-badge " + (bias === "BUY" ? "buy" : bias === "SELL" ? "sell" : "wait");
    }

    const metrics = document.querySelectorAll(".asfx-metric-grid b");
    if (metrics.length >= 3) {
        metrics[0].textContent = (packet.confidence || packet.score || 0) + "%"; 
        metrics[1].textContent = packet.risk || "Medium"; 
        metrics[2].textContent = packet.decision || packet.status || packet.signalStatus || "NO TRADE"; 
    }

    const setup = document.querySelector(".asfx-preview-box div:nth-child(2) b");
    if (setup) {
        setup.textContent = packet.setupType || packet.decision || "AiSignalfx Engine Active";
    }
});
// --- END JEMBATAN SAKTI ---
