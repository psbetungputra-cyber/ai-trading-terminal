/* AiSignalFx PRO - Scanner Mobile Functional v2 */
(function () {
  const cryptoPairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "AVAXUSDT"];
  const refPairs = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY"];
  const timeframes = ["5m", "15m", "1H", "4H"];

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
    if (!n) return "Loading";
    return n.toLocaleString("en-US", { maximumFractionDigits: n > 100 ? 2 : 5 });
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

  function getPairData(pair) {
    if (state.mode === "crypto") {
      const d = state.live[pair] || {};
      const change = Number(d.priceChangePercent || 0);
      const bias = biasFromChange(change);
      return {
        symbol: pair,
        price: Number(d.lastPrice || 0),
        change,
        bias,
        confidence: Math.min(88, Math.max(55, Math.round(58 + Math.abs(change) * 6))),
        risk: riskFromChange(change),
        market: "Crypto Live",
        setup: bias === "BUY" ? "Momentum continuation" : bias === "SELL" ? "Pullback pressure" : "Waiting confirmation"
      };
    }

    return { symbol: pair, ...(refData[pair] || refData.XAUUSD) };
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
    const change = Number(data.change || 0);
    const status = data.bias === "WAIT" ? "Waiting" : "Preview";
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
              <small>${safe(data.market)} · ${safe(state.tf)}</small>
              <h2>${safe(data.symbol)}</h2>
            </div>
            <b class="asfx-badge ${biasClass(data.bias)}">${safe(data.bias)}</b>
          </div>

          <div class="asfx-price-row">
            <strong>${safe(price)}</strong>
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
          <span>✓ Full chart analysis room</span>
          <span>✓ AI chat signal explanation</span>
          <span>✓ Entry zone, Stop Loss, Take Profit</span>
          <span>✓ Risk plan and invalidation level</span>
          <span>✓ Full institutional reasoning</span>
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
        <button class="asfx-detail-back" data-close-detail="1">← Back</button>
        <div class="asfx-detail-title">
          <small>SIGNAL DETAIL ROOM</small>
          <h2>${safe(data.symbol)} · ${safe(state.tf)}</h2>
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

    const candleSvg = visible.map((c, i) => {
      const x = padL + i * step;
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
            <stop offset="0%" stop-color="#0f172a" stop-opacity=".98"/>
            <stop offset="100%" stop-color="#020617" stop-opacity=".98"/>
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

        <text x="${padL}" y="22" fill="#93c5fd" font-size="12" font-weight="900">${safe(state.pair)} · ${safe(state.tf)}</text>
      </svg>
    `;
  }

  function referenceChartHTML(data) {
    return `
      <div class="asfx-room-ref-chart">
        <div>
          <small>Reference Mode</small>
          <b>${safe(data.symbol)} · ${safe(state.tf)}</b>
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
      const high = candles.length ? Math.max(...candles.map(c => Number(c.h || 0))).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";
      const low = candles.length ? Math.min(...candles.map(c => Number(c.l || 0))).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";
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
            <b class="live-dot">● Live</b>
          </div>
        </div>

        <div class="asfx-detail-tfbar">
          <button class="${state.tf === "15m" ? "active" : ""}">15m</button>
          <button class="${state.tf === "1h" ? "active" : ""}">1H</button>
          <button class="${state.tf === "4h" ? "active" : ""}">4H</button>
          <button class="${state.tf === "1d" ? "active" : ""}">1D</button>
          <button>1W</button>
          <button class="icon">▥</button>
          <button class="icon">ƒx</button>
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

  function safe(v){
    return String(v ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[c]);
  }

  function ctx(){
    const title = document.querySelector(".asfx-detail-title h2")?.textContent || "BTCUSDT · 15m";
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
    return !!box();
  }

  function fmt(n){
    const x = Number(n);
    if (!Number.isFinite(x)) return "—";
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
        · ${safe(ctx().tf)} ${safe(leftText())}
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
  }

  function yFor(price, min, max, padT, chartH){
    return padT + ((max - price) / Math.max(1e-9, max - min)) * chartH;
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
    const padT = 42;
    const padB = 44;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const highs = visible.map(c => Number(c.h));
    const lows = visible.map(c => Number(c.l));
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const range = Math.max(1e-9, max - min);
    const step = chartW / Math.max(visible.length - 1, 1);
    const bodyW = Math.max(4, Math.min(10, step * .55));

    const grid = [1/6,2/6,3/6,4/6,5/6].map(p => {
      const y = padT + chartH * p;
      const price = max - range * p;
      return `
        <line x1="${padL}" y1="${y}" x2="${w-padR+8}" y2="${y}" stroke="rgba(148,163,184,.14)"/>
        <text x="${w-padR+18}" y="${y+5}" fill="#94a3b8" font-size="12" font-weight="800">${fmt(price)}</text>
      `;
    }).join("");

    const vgrid = [0,1,2,3,4].map(i => {
      const x = padL + (chartW/4) * i;
      return `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT+chartH}" stroke="rgba(148,163,184,.08)"/>`;
    }).join("");

    const candleSvg = visible.map((c, i) => {
      const x = padL + i * step;
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
    const tagColor = down ? "#ef4444" : "#2563eb";
    const lineColor = down ? "rgba(239,68,68,.82)" : "rgba(96,165,250,.86)";

    return `
      <svg class="asfx-room-chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="asfxStandaloneBg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#0f172a" stop-opacity=".96"/>
            <stop offset="100%" stop-color="#020617" stop-opacity=".98"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="url(#asfxStandaloneBg)" rx="24"/>
        ${grid}
        ${vgrid}
        <text x="${padL}" y="28" fill="#93c5fd" font-size="13" font-weight="900">${safe(pair)} · ${safe(tf)}</text>
        <g>${candleSvg}</g>
        <line x1="${padL}" y1="${lastY}" x2="${w-padR+8}" y2="${lastY}" stroke="${lineColor}" stroke-dasharray="3 5" stroke-width="2"/>
        <rect x="${w-padR+8}" y="${lastY-25}" width="${padR-12}" height="50" rx="8" fill="${tagColor}" opacity=".98"/>
        <text x="${w-padR+16}" y="${lastY-5}" fill="#fff" font-size="12" font-weight="950">${fmt(last.c)}</text>
        <text x="${w-padR+16}" y="${lastY+14}" fill="rgba(255,255,255,.86)" font-size="12" font-weight="800">${leftText()}</text>
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
        <b class="asfx-price-up">● Live</b>
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

      render();
      ensureWorkspace("LIVE");
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
      "5m":"5m",
      "15m":"15m",
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
      title.textContent = `${current.pair} · ${displayTf(tf)}`;
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

  const observer = new MutationObserver(() => {
    setTimeout(tick, 250);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

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
    const title = document.querySelector(".asfx-detail-title h2")?.textContent || "BTCUSDT · 15m";
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

  
  function readSmz(){
    return window.__ASFX_LAST_SMZ_ANALYSIS__ || {};
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
function signalHtml(d){
  const smz = readSmz();
  const readiness = signalPlanReadiness(d, smz);

  const bias = smzText(d.bias || smz.bias, "WAIT");
  const risk = smzText(d.risk || smz.risk, "Medium");
  const confidence = String(smzText(d.confidence || smz.confidence || readiness.score, "0")).replace(/%/g, "");
  const status = smzText(smz.signalStatus || readiness.label, "Waiting Zone");
  const activeZone = smzText(smz.activeZone || smz.zoneState || smz.zone, "Waiting valid zone");
  const sl = smzText(smz.stopLossGuide, "Waiting invalidation level");
  const tp1 = smzText(smz.tp1Guide, "Waiting target area");
  const tp2 = smzText(smz.tp2Guide, "Waiting extended target");
  const insight = smzText(smz.statusDetail || smz.reason || d.setup, "Tunggu reaksi candle bersih sebelum validasi entry.");

  return `
    <div class="asfx-bridge-wrap" data-asfx-bridge-rendered="signal">
      <div class="asfx-bridge-head">
        <div class="asfx-bridge-kicker">Final Signal Plan</div>
        <div class="asfx-bridge-title">${status}</div>
        <div class="asfx-bridge-sub">${d.pair} · ${d.tf} · ${bias} · ${risk} Risk · ${confidence}%</div>
      </div>

      <div class="asfx-bridge-grid">
        <div class="asfx-bridge-mini"><small>Bias</small><b class="${biasClass(bias)}">${bias}</b></div>
        <div class="asfx-bridge-mini"><small>Status</small><b>${status}</b></div>
        <div class="asfx-bridge-mini"><small>Score</small><b>${confidence}%</b></div>
      </div>

      <div class="asfx-bridge-box">
        <b style="color:#fff;">Active Zone</b><br>
        ${activeZone}
      </div>

      <div class="asfx-bridge-box">
        <b style="color:#fff;">Execution Guide</b><br>
        SL: <b style="color:#fff;">${sl}</b><br>
        TP1: <b style="color:#fff;">${tp1}</b><br>
        TP2: <b style="color:#fff;">${tp2}</b>
      </div>

      <div class="asfx-bridge-box">
        <b style="color:#fff;">Insight</b><br>
        ${insight}
      </div>

      <details class="asfx-bridge-box">
        <summary style="cursor:pointer;color:#fff;font-weight:900;">Lihat Full Analysis</summary>
        <br>
        Structure: <b style="color:#fff;">${smzText(smz.structure, "Reading")}</b><br>
        Demand: <b style="color:#fff;">${smzText(smz.demandZone, "Calculating")}</b><br>
        Supply: <b style="color:#fff;">${smzText(smz.supplyZone, "Calculating")}</b><br>
        Liquidity: <b style="color:#fff;">${smzText(smz.liquidity, "Waiting")}</b><br>
        FVG: <b style="color:#fff;">${smzText(smz.imbalance, "Waiting")}</b>
      </details>

      <div class="asfx-bridge-lock">Educational analysis only. Execution remains user responsibility.</div>
    </div>
  `;
}

function riskHtml(d){
  const smz = readSmz();

  const bias = smzText(d.bias || smz.bias, "WAIT");
  const risk = smzText(d.risk || smz.risk, "Medium");
  const confidence = String(smzText(d.confidence || smz.confidence, "0")).replace(/%/g, "");
  const zone = smzText(smz.zoneState || smz.zone || smz.activeZone, "Waiting Zone");

  return `
    <div class="asfx-bridge-wrap" data-asfx-bridge-rendered="risk">
      <div class="asfx-bridge-head">
        <div class="asfx-bridge-kicker">Risk Guard</div>
        <div class="asfx-bridge-title">${risk} Risk · ${d.pair}</div>
        <div class="asfx-bridge-sub">Validasi volatilitas, struktur, dan posisi harga terhadap zona.</div>
      </div>

      <div class="asfx-bridge-grid">
        <div class="asfx-bridge-mini"><small>Bias</small><b class="${biasClass(bias)}">${bias}</b></div>
        <div class="asfx-bridge-mini"><small>Confidence</small><b>${confidence}%</b></div>
        <div class="asfx-bridge-mini"><small>Status</small><b>${zone}</b></div>
      </div>

      <div class="asfx-bridge-box">
        <b style="color:#fff;">Risk Validation</b><br>
        Structure: <b style="color:#fff;">${smzText(smz.structure, "Reading")}</b><br>
        Demand: <b style="color:#fff;">${smzText(smz.demandZone, "Calculating")}</b><br>
        Supply: <b style="color:#fff;">${smzText(smz.supplyZone, "Calculating")}</b>
      </div>
    </div>
  `;
}

function chatHtml(d){
  const smz = readSmz();

  const bias = smzText(d.bias || smz.bias, "WAIT");
  const risk = smzText(d.risk || smz.risk, "Medium");
  const confidence = String(smzText(d.confidence || smz.confidence, "0")).replace(/%/g, "");
  const status = smzText(smz.signalStatus || smz.zoneState, "Waiting Zone");
  const insight = smzText(smz.statusDetail || smz.reason || d.setup, "Tunggu candle yang lebih jelas sebelum validasi entry.");

  return `
    <div class="asfx-bridge-wrap" data-asfx-bridge-rendered="chat">
      <div class="asfx-bridge-head">
        <div class="asfx-bridge-kicker">AI Insight</div>
        <div class="asfx-bridge-title">${status}</div>
        <div class="asfx-bridge-sub">Ringkasan bahasa trader dari hasil SMZ Engine.</div>
      </div>

      <div class="asfx-bridge-box">
        <b style="color:#fff;">Ringkasan</b><br>
        ${d.pair} · ${d.tf} bias <b class="${biasClass(bias)}">${bias}</b>, risk <b style="color:#fff;">${risk}</b>, confidence <b style="color:#fff;">${confidence}%</b>.
      </div>

      <div class="asfx-bridge-box">
        <b style="color:#fff;">Insight</b><br>
        ${insight}
      </div>
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

  function renderBridge(tab){
  const p = panel();
  if (!p || tab === "chart") return;

  const d = readSignal();
  const smz = readSmz();

  let html = "";
  if (tab === "signal") html = signalHtml(d);
  if (tab === "risk") html = riskHtml(d);
  if (tab === "chat") html = chatHtml(d);
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
      return (
        window.AiSignalSMZStatusFlowV1?.last?.() ||
        window.AiSignalSMZEngineV1?.last?.() ||
        window.__ASFX_LAST_SMZ_ANALYSIS__ ||
        {}
      );
    } catch (_) {
      return window.__ASFX_LAST_SMZ_ANALYSIS__ || {};
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
      /* ASFX_DISABLE_LEGACY_HYDRATOR_UI_V1: legacy panel writer disabled; compact stable renderer owns panel. */
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
        <div class="asfx-bridge-kicker">Final Signal Plan</div>
        <div class="asfx-bridge-title">${status}</div>
        <div class="asfx-bridge-sub">Final plan membaca Chart, Risk Guard, AI Insight, dan SMZ context sebelum eksekusi.</div>
        <br>
        <b style="color:#fff">Signal Readiness</b><br>
        Pair: <b style="color:#fff">${pair}</b><br>
        Bias: <b style="color:#fff">${bias}</b><br>
        Risk: <b style="color:#fff">${risk}</b><br>
        Confidence: <b style="color:#fff">${confidence}</b><br>
        Structure: <b style="color:#fff">${structure}</b><br>
        Zone: <b style="color:#fff">${zone}</b><br>
        <br>
        <b style="color:#fff">Execution Plan Guide</b><br>
        Setup Type: <b style="color:#fff">${setupType}</b><br>
        Active Zone: <b style="color:#fff">${activeZone}</b><br>
        Distance to Zone: <b style="color:#fff">${distanceToZone}</b><br>
        Entry Zone Guide: <b style="color:#fff">${entryZone}</b><br>
        Stop Loss Guide: <b style="color:#fff">${stopLossGuide}</b><br>
        TP1 Guide: <b style="color:#fff">${tp1Guide}</b><br>
        TP2 Guide: <b style="color:#fff">${tp2Guide}</b><br>
        Invalidation: <b style="color:#fff">${invalidationLevel}</b><br><br>
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
      text: `${pct.toFixed(2)}% ${relation} (${fmt(price)} → ${fmt(target)})`,
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
    const activeZone = bias === "SELL" ? supply : demand;
    const activeName = bias === "SELL" ? "Supply" : "Demand";
    const dist = zoneDistance(price, activeZone, bias, atr);

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
    const signalStatus = dist.state === "Zone Touched" ? "Zone Touched" : dist.state;
    const statusDetail = dist.state === "Zone Touched"
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
      zoneState: `${activeName} ${dist.state}`,
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
    return { inside:false, pct, text:`${pct.toFixed(2)}% from active zone (${fmt(price)} → ${fmt(target)})` };
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

    const activeZone = bias === "SELL" ? supply : demand;
    const activeName = bias === "SELL" ? "Supply" : "Demand";
    const dist = distance(price, activeZone);

    let signalStatus = "Waiting Zone";
    if (dist.inside) signalStatus = "Zone Touched";
    else if (dist.pct <= 0.45) signalStatus = "Zone Watch";

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

    const liquidity = `Buy-side liquidity near ${fmt(swingHigh)} · Sell-side liquidity near ${fmt(swingLow)}`;

    const statusDetail =
      signalStatus === "Zone Touched"
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

      slGuide: clean(raw.slGuide || raw.stopLossGuide, "Waiting invalidation level"),
      stopLossGuide: clean(raw.stopLossGuide || raw.slGuide, "Waiting invalidation level"),
      tp1Guide: clean(raw.tp1Guide, "Waiting target area"),
      tp2Guide: clean(raw.tp2Guide, "Waiting extended target"),

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
      tp1Guide: packet.tp1Guide,
      tp2Guide: packet.tp2Guide,
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
          <div>✅ Public: bias/status preview & Sentinel AI limited.</div>
          <div>🔒 VIP: full Signal Detail Room, entry zone, SL/TP, dan full reasoning.</div>
          <div>👑 Owner/Admin: full access untuk testing dan kontrol sistem.</div>
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
      displayHeadline: `${cleanStatus} · ${b} · ${r} Risk`,
      publicSummary: `${packet.pair || packet.symbol || "BTCUSDT"} · ${packet.timeframe || packet.tf || "15m"} · ${b} · ${cleanStatus}`,
      vipSummary: `${b} setup · ${r} Risk · ${cleanStatus}`
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

