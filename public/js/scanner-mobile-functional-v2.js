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

  function signalHtml(d){
    const smz = readSmz();
    const readiness = signalPlanReadiness(d, smz);

    return `
      <div class="asfx-bridge-wrap" data-asfx-bridge-rendered="signal">
        <div class="asfx-bridge-head">
          <div class="asfx-bridge-kicker">Final Signal Plan</div>
          <div class="asfx-bridge-title">${d.pair} · ${d.tf}</div>
          <div class="asfx-bridge-sub">Final plan membaca Chart, Risk Guard, AI Insight, dan SMZ context sebelum eksekusi.</div>
        </div>

        <div class="asfx-bridge-grid">
          <div class="asfx-bridge-mini">
            <small>Bias</small>
            <b class="${biasClass(d.bias)}">${d.bias}</b>
          </div>
          <div class="asfx-bridge-mini">
            <small>Readiness</small>
            <b>${readiness.label}</b>
          </div>
          <div class="asfx-bridge-mini">
            <small>Score</small>
            <b>${readiness.score}%</b>
          </div>
        </div>

        <div class="asfx-bridge-box">
          <b style="color:#fff">Signal Readiness</b><br>
          Status: <b style="color:#fff">${readiness.label}</b><br>
          Detail: ${readiness.note}
        </div>

        <div class="asfx-bridge-grid">
          ${signalChecklistHtml(d, smz)}
        </div>

        <div class="asfx-bridge-box">
          <b style="color:#fff">Current Plan Preview</b><br>
          Pair aktif: <b style="color:#fff">${d.pair}</b> · Timeframe: <b style="color:#fff">${d.tf}</b><br>
          Harga aktif: <b style="color:#fff">${d.price}</b><br>
          Status Flow: <b style="color:#fff">${smzText(smz.signalStatus, "Waiting Zone")}</b><br>
          Phase: <b style="color:#fff">${smzText(smz.smzPhase || smz.phase, "Observation")}</b><br><br>
          ${smz.reason || d.setup || "Menunggu reaksi candle yang lebih jelas sebelum final signal aktif."}
        </div>

        <div class="asfx-bridge-lock">
          Locked execution detail: entry zone, stop loss, take profit, invalidation rule, position sizing, confidence breakdown, dan signal history.
        </div>
      </div>
    `;
  }

  function riskHtml(d){
    const smz = readSmz();
    return `
      <div class="asfx-bridge-wrap" data-asfx-bridge-rendered="risk">
        <div class="asfx-bridge-head">
          <div class="asfx-bridge-kicker">Risk Guard</div>
          <div class="asfx-bridge-title">${d.risk} Risk · ${d.pair}</div>
          <div class="asfx-bridge-sub">Risk Guard membaca volatility, posisi harga terhadap zona, struktur, dan validasi setup.</div>
        </div>

        <div class="asfx-bridge-grid">
          <div class="asfx-bridge-mini">
            <small>Market Bias</small>
            <b class="${biasClass(d.bias)}">${d.bias}</b>
          </div>
          <div class="asfx-bridge-mini">
            <small>Zone State</small>
            <b>${smzText(smz.zoneState, "Waiting")}</b>
          </div>
          <div class="asfx-bridge-mini">
            <small>Status</small>
            <b class="asfx-bridge-wait">${smzText(smz.signalStatus, "Waiting Zone")}</b>
          </div>
        </div>

        <div class="asfx-bridge-box">
          <b style="color:#fff">Risk Validation</b><br>
          Structure: <b style="color:#fff">${smzText(smz.structure)}</b><br>
          Demand Zone: <b style="color:#fff">${smzText(smz.demandZone, "Calculating")}</b><br>
          Supply Zone: <b style="color:#fff">${smzText(smz.supplyZone, "Calculating")}</b><br>
          Liquidity: <b style="color:#fff">${smzText(smz.liquidity)}</b>
        </div>

        <div class="asfx-bridge-lock">
          VIP/owner unlock: exact entry zone, stop loss, take profit, invalidation rule, position sizing, dan full risk reasoning.
        </div>
      </div>
    `;
  }

  function chatHtml(d){
    const smz = readSmz();
    return `
      <div class="asfx-bridge-wrap" data-asfx-bridge-rendered="chat">
        <div class="asfx-bridge-head">
          <div class="asfx-bridge-kicker">AI Insight</div>
          <div class="asfx-bridge-title">Sentinel Insight · ${d.pair}</div>
          <div class="asfx-bridge-sub">AI Insight menerjemahkan hasil SMZ Engine menjadi bahasa trader yang mudah dipahami.</div>
        </div>

        <div class="asfx-bridge-box">
          <b style="color:#fff">Ringkasan:</b> ${d.pair} di ${d.tf} sekarang bias <b class="${biasClass(d.bias)}">${d.bias}</b>, confidence <b>${d.confidence}</b>, risk <b>${d.risk}</b>.<br><br>
          ${smz.reason || d.setup || "Menunggu candle yang lebih jelas."}
        </div>

        <div class="asfx-bridge-box">
          <b style="color:#fff">Yang ditunggu:</b><br>
          ${smzText(smz.zoneState, "Zona valid")} · ${smzText(smz.structure, "struktur belum jelas")} · ${smzText(smz.liquidity, "liquidity belum jelas")}.<br><br>
          Status: <b style="color:#fff">${smzText(smz.signalStatus, "Waiting Zone")}</b><br>${smzText(smz.statusDetail, "Tunggu reaksi candle bersih sebelum Final Signal Plan aktif.")}
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

    if (tab === "signal") p.innerHTML = signalHtml(d);
    if (tab === "risk") p.innerHTML = riskHtml(d);
    if (tab === "chat") p.innerHTML = chatHtml(d);
    if (tab === "vip") p.innerHTML = vipHtml(d);
  }

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
      el.innerHTML = html;
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

  setTimeout(hydrate, 800);
  setTimeout(hydrate, 1800);
  setInterval(hydrate, 3000);

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
