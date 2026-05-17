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
    return (
      params.get("owner") === "1" ||
      localStorage.getItem("asfxRole") === "admin" ||
      localStorage.getItem("asfxRole") === "vip"
    );
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
          <button data-detail-tab="signal">Signal</button>
          <button data-detail-tab="risk">Risk</button>
          <button data-detail-tab="chat">AI Chat</button>
          <button data-detail-tab="vip">VIP</button>
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
      return `
        <div class="asfx-room-chart" data-room-chart>
          ${isCrypto ? detailChartHTML() : referenceChartHTML(data)}
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
