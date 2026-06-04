/* AiSignalFx PRO - Mobile Dashboard V2
   HP only: chart-first, no ticker, swipe tabs, sentiment/session tetap ada.
*/
(function () {
  let currentTab = "overview";
  let rendering = false;

  function isMobile() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function dashActive() {
    const dash = document.getElementById("dashboard");
    return dash && dash.classList.contains("active");
  }

  function go(page) {
    if (typeof window.v4Go === "function") return window.v4Go(page);
    if (typeof window.showPageById === "function") return window.showPageById(page);
    if (typeof window.showPage === "function") return window.showPage(page);
  }

  window.mobileDashGo = go;

  window.MobileDashboardV2 = {
    setTab(tab) {
      currentTab = tab || "overview";
      renderMobileDashboardV2();
    },
    render: renderMobileDashboardV2
  };

  function injectStyle() {
    if (document.getElementById("mobile-dashboard-v2-style")) return;

    const style = document.createElement("style");
    style.id = "mobile-dashboard-v2-style";
    style.textContent = `
      @media (max-width: 760px) {
        .m2-hide-ticker {
          display: none !important;
        }

        #dashboard .m2 {
          display: grid;
          gap: 12px;
          padding: 10px 8px 108px !important;
          color: #e5eefc;
          overflow-x: hidden;
        }

        #dashboard .m2 * {
          box-sizing: border-box;
        }

        #dashboard .m2-card {
          width: 100%;
          max-width: calc(100vw - 16px);
          margin-left: auto;
          margin-right: auto;
          border: 1px solid rgba(96, 165, 250, .18);
          background:
            radial-gradient(circle at 84% 16%, rgba(37,99,235,.16), transparent 34%),
            linear-gradient(145deg, #08111f, #050c16);
          border-radius: 24px;
          box-shadow: 0 18px 44px rgba(0,0,0,.28);
        }

        #dashboard .m2-signal {
          padding: 14px;
        }

        #dashboard .m2-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        #dashboard .m2-title {
          min-width: 0;
        }

        #dashboard .m2-title h2 {
          margin: 0;
          color: #fff;
          font-size: 21px;
          line-height: 1.05;
          letter-spacing: -0.03em;
        }

        #dashboard .m2-title h2 span {
          color: #60a5fa;
          margin-right: 6px;
        }

        #dashboard .m2-title p {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        #dashboard .m2-live {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #4ade80;
          background: rgba(34,197,94,.12);
          border: 1px solid rgba(34,197,94,.25);
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 900;
        }

        #dashboard .m2-live i {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 12px rgba(34,197,94,.8);
        }

        #dashboard .m2-chartbox {
          background: rgba(2,6,23,.58);
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 20px;
          overflow: hidden;
          min-height: 246px;
        }

        #dashboard .m2-chart {
          display: block;
          width: 100%;
          height: 246px;
        }

        #dashboard .m2-chart .grid line {
          stroke: rgba(148,163,184,.12);
          stroke-width: 1;
        }

        #dashboard .m2-chart .line {
          fill: none;
          stroke: #2f7cff;
          stroke-width: 4;
        }

        #dashboard .m2-chart .area {
          fill: rgba(37,99,235,.14);
        }

        #dashboard .m2-chart .tp {
          stroke: rgba(34,197,94,.72);
          stroke-width: 2;
          stroke-dasharray: 7 7;
        }

        #dashboard .m2-chart .entry {
          stroke: rgba(59,130,246,.72);
          stroke-width: 2;
          stroke-dasharray: 7 7;
        }

        #dashboard .m2-chart .sl {
          stroke: rgba(239,68,68,.78);
          stroke-width: 2;
          stroke-dasharray: 7 7;
        }

        #dashboard .m2-chart text {
          font-size: 14px;
          font-weight: 900;
        }

        #dashboard .m2-chart .green { fill: #22c55e; }
        #dashboard .m2-chart .red { fill: #ef4444; }
        #dashboard .m2-chart .blue { fill: #60a5fa; }

        #dashboard .m2-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 10px;
        }

        #dashboard .m2-stats div {
          background: rgba(2,6,23,.58);
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 15px;
          padding: 10px 7px;
          text-align: center;
        }

        #dashboard .m2-stats small {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          margin-bottom: 4px;
        }

        #dashboard .m2-stats b {
          display: block;
          color: #fff;
          font-size: 12px;
          line-height: 1.15;
        }

        #dashboard .m2-stats .buy { color: #4ade80; }
        #dashboard .m2-stats .red { color: #f87171; }
        #dashboard .m2-stats .green { color: #4ade80; }
        #dashboard .m2-stats .blue { color: #60a5fa; }

        #dashboard .m2-explore {
          display: grid;
          grid-template-columns: 54px 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 14px;
          background:
            radial-gradient(circle at 12% 50%, rgba(59,130,246,.28), transparent 28%),
            linear-gradient(135deg, #0b1f3a, #082047 55%, #0e7490);
        }

        #dashboard .m2-radar {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          color: #60a5fa;
          border: 1px solid rgba(96,165,250,.35);
          font-size: 28px;
        }

        #dashboard .m2-explore h3 {
          margin: 0;
          color: #fff;
          font-size: 18px;
          line-height: 1.12;
        }

        #dashboard .m2-explore p {
          margin: 4px 0 0;
          color: #a8b6cc;
          font-size: 12px;
          line-height: 1.35;
        }

        #dashboard .m2-arrow {
          color: #7dd3fc;
          font-size: 34px;
          line-height: 1;
        }

        #dashboard .m2-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 2px 0 4px;
          scrollbar-width: none;
        }

        #dashboard .m2-tabs::-webkit-scrollbar {
          display: none;
        }

        #dashboard .m2-tabs button {
          flex: 0 0 auto;
          border: 1px solid rgba(96,165,250,.18);
          background: rgba(8,17,31,.92);
          color: #bfdbfe;
          border-radius: 999px;
          padding: 10px 13px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        #dashboard .m2-tabs button.active {
          border-color: transparent;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
        }

        #dashboard .m2-panel {
          padding: 14px;
        }

        #dashboard .m2-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        #dashboard .m2-panel-head h3 {
          margin: 0;
          color: #fff;
          font-size: 17px;
        }

        #dashboard .m2-panel-head span {
          color: #60a5fa;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        #dashboard .m2-overview-grid,
        #dashboard .m2-pulse-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        #dashboard .m2-overview-grid {
          grid-template-columns: 1fr 1fr;
        }

        #dashboard .m2-mini-box {
          background: rgba(2,6,23,.58);
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 15px;
          padding: 12px 10px;
        }

        #dashboard .m2-mini-box small {
          display: block;
          color: #94a3b8;
          font-size: 11px;
          margin-bottom: 5px;
        }

        #dashboard .m2-mini-box b {
          display: block;
          color: #fff;
          font-size: 18px;
          line-height: 1.1;
        }

        #dashboard .m2-mini-box span {
          display: block;
          color: #94a3b8;
          font-size: 11px;
          margin-top: 5px;
        }

        #dashboard .m2-green { color: #4ade80 !important; }
        #dashboard .m2-red { color: #f87171 !important; }
        #dashboard .m2-blue { color: #60a5fa !important; }

        #dashboard .m2-sent-row {
          display: grid;
          grid-template-columns: 82px 1fr 42px;
          gap: 10px;
          align-items: center;
          margin-top: 12px;
        }

        #dashboard .m2-sent-row label {
          color: #e5eefc;
          font-size: 13px;
        }

        #dashboard .m2-sent-row b {
          text-align: right;
          font-size: 13px;
        }

        #dashboard .m2-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(148,163,184,.15);
          overflow: hidden;
        }

        #dashboard .m2-track i {
          display: block;
          height: 100%;
          border-radius: inherit;
        }

        #dashboard .m2-track .bull { width: 62%; background: #22c55e; }
        #dashboard .m2-track .neu { width: 23%; background: #94a3b8; }
        #dashboard .m2-track .bear { width: 15%; background: #ef4444; }

        #dashboard .m2-sessions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        #dashboard .m2-session {
          background: rgba(2,6,23,.58);
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 14px;
          padding: 10px 7px;
          text-align: center;
          min-width: 0;
        }

        #dashboard .m2-session.active {
          border-color: rgba(59,130,246,.85);
          background: rgba(37,99,235,.18);
        }

        #dashboard .m2-session span {
          display: block;
          font-size: 20px;
          margin-bottom: 6px;
        }

        #dashboard .m2-session b {
          display: block;
          color: #fff;
          font-size: 11px;
          white-space: nowrap;
        }

        #dashboard .m2-session small {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.3;
          margin-top: 5px;
        }

        #dashboard .m2-community {
          display: grid;
          grid-template-columns: 88px 1fr;
          gap: 12px;
          align-items: center;
        }

        #dashboard .m2-community-chart {
          height: 76px;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(2,6,23,.58);
          border: 1px solid rgba(148,163,184,.12);
        }

        #dashboard .m2-community h4 {
          margin: 0;
          color: #fff;
          font-size: 15px;
        }

        #dashboard .m2-community p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.35;
        }

        #dashboard .m2-community button {
          margin-top: 8px;
          border: 1px solid rgba(96,165,250,.22);
          background: rgba(37,99,235,.16);
          color: #bfdbfe;
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 10px;
          font-weight: 900;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function hideMobileTicker() {
    if (!isMobile()) return;

    const symbols = ["XAUUSD", "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "EURUSD", "GBPUSD", "USDJPY"];
    const nodes = Array.from(document.body.querySelectorAll("div, section, nav, header"));

    nodes.forEach((el) => {
      if (el.closest("#dashboard")) return;
      const text = (el.innerText || el.textContent || "").toUpperCase();
      const hit = symbols.filter((s) => text.includes(s)).length;
      if (hit < 3) return;

      const r = el.getBoundingClientRect();
      if (r.top >= 80 && r.top <= 220 && r.height > 20 && r.height < 82 && r.width > window.innerWidth * 0.7) {
        el.classList.add("m2-hide-ticker");
      }
    });
  }

  function chartSvg() {
  const state = window.asfxMobileRealChart || {};
  const candles = Array.isArray(state.candles) ? state.candles.slice(-44) : [];
  const symbol = state.symbol || "BTCUSDT";
  const interval = state.interval || "15m";
  const status = state.status || "loading";

  if (!candles.length) {
    const msg = status === "error" ? "Binance candle feed unavailable" : "Loading Binance candles...";
    return `
      <svg class="m2-chart" viewBox="0 0 760 540" preserveAspectRatio="none" aria-label="Real candle chart loading">
        <rect x="0" y="0" width="760" height="540" rx="34" fill="#020617"/>
        <text x="42" y="72" fill="#60a5fa" font-size="24" font-weight="900">${symbol}</text>
        <text x="42" y="104" fill="#94a3b8" font-size="16" font-weight="800">${msg}</text>
      </svg>
    `;
  }

  const last = candles[candles.length - 1];
  const lastPrice = Number(last.c);

  const highs = candles.map(c => Number(c.h)).filter(Number.isFinite);
  const lows = candles.map(c => Number(c.l)).filter(Number.isFinite);
  const max = highs.length ? Math.max(...highs, lastPrice) : lastPrice;
  const min = lows.length ? Math.min(...lows, lastPrice) : lastPrice;
  const range = Math.max(max - min, Math.abs(lastPrice || 1) * 0.0015, 1);
  const pad = range * 0.04;

  const targetTop = max + pad;
  const targetBottom = min - pad;
  const scaleKey = `${symbol}_${interval}`;
  const previousScale = window.__ASFX_MOBILE_DASH_SCALE_V1__;

  let top = targetTop;
  let bottom = targetBottom;

  if (
    previousScale &&
    previousScale.key === scaleKey &&
    Number.isFinite(previousScale.top) &&
    Number.isFinite(previousScale.bottom)
  ) {
    top = targetTop > previousScale.top
      ? targetTop
      : previousScale.top + (targetTop - previousScale.top) * 0.08;

    bottom = targetBottom < previousScale.bottom
      ? targetBottom
      : previousScale.bottom + (targetBottom - previousScale.bottom) * 0.08;
  }

  if (lastPrice >= top) top = lastPrice + range * 0.08;
  if (lastPrice <= bottom) bottom = lastPrice - range * 0.08;

  if (!Number.isFinite(top) || !Number.isFinite(bottom) || top <= bottom) {
    top = targetTop;
    bottom = targetBottom;
  }

  window.__ASFX_MOBILE_DASH_SCALE_V1__ = {
    key: scaleKey,
    top,
    bottom,
    at: Date.now()
  };

  const chartTop = 24;
  const chartLeft = 24;
  const chartW = 608;
  const chartH = 468;
  const chartBottom = chartTop + chartH;
  const chartRight = chartLeft + chartW;
  const step = chartW / candles.length;
  const bodyW = Math.max(7, step * 0.66);

  const y = (price) => chartTop + ((top - price) / Math.max(1e-9, top - bottom)) * chartH;
  const fmt = (v) => Number(v).toLocaleString("en-US", { maximumFractionDigits: v > 100 ? 2 : 5 });
  const lastY = Math.max(chartTop + 6, Math.min(chartBottom - 6, y(lastPrice)));

  const intervalMs = interval.endsWith("m")
    ? Number(interval.replace("m", "")) * 60 * 1000
    : 15 * 60 * 1000;
  const closeAt = Number(last.t || Date.now()) + intervalMs;
  const remainMs = Math.max(0, closeAt - Date.now());
  const remainMin = String(Math.floor(remainMs / 60000)).padStart(2, "0");
  const remainSec = String(Math.floor((remainMs % 60000) / 1000)).padStart(2, "0");
  const candleTimer = `${remainMin}:${remainSec}`;
  const tfLabel = interval.toUpperCase();

  const grid = Array.from({ length: 10 }, (_, i) => i / 9).map(p => {
    const gy = chartTop + chartH * p;
    const price = top - (top - bottom) * p;
    return `<line x1="${chartLeft}" y1="${gy}" x2="${chartRight}" y2="${gy}" stroke="rgba(148,163,184,.16)" stroke-width="1"/>
            <text x="${chartRight + 10}" y="${gy + 4}" fill="#cbd5e1" font-size="11" font-weight="850">${fmt(price)}</text>`;
  }).join("");

  const timeFmt = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch (_) {
      return "--:--";
    }
  };

  const timeMarks = Array.from({ length: 6 }, (_, i) => {
    const ratio = i / 5;
    const gx = chartLeft + chartW * ratio;
    const idx = Math.min(candles.length - 1, Math.max(0, Math.round((candles.length - 1) * ratio)));
    return { gx, label: timeFmt(candles[idx]?.t || Date.now()) };
  });

  const verticalGrid = timeMarks.map(mark => {
    return `<line x1="${mark.gx}" y1="${chartTop}" x2="${mark.gx}" y2="${chartBottom}" stroke="rgba(148,163,184,.13)" stroke-width="1"/>`;
  }).join("");

  const timeLabels = timeMarks.map(mark => {
    return `<text x="${mark.gx}" y="${chartBottom + 26}" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="850">${mark.label}</text>`;
  }).join("");

  const candleSvg = candles.map((c, i) => {
    const cx = chartLeft + i * step + step / 2;
    const openY = y(c.o);
    const closeY = y(c.c);
    const highY = y(c.h);
    const lowY = y(c.l);
    const bullish = c.c >= c.o;
    const color = bullish ? "#22c55e" : "#ef4444";
    const bodyY = Math.min(openY, closeY);
    const bodyH = Math.max(Math.abs(closeY - openY), 3);

    return `<line x1="${cx}" y1="${highY}" x2="${cx}" y2="${lowY}" stroke="${color}" stroke-width="2.1" stroke-linecap="round"/>
            <rect x="${cx - bodyW / 2}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="3" fill="${color}"/>`;
  }).join("");

  const badgeX = chartRight + 8;
  const badgeY = Math.max(chartTop + 8, Math.min(chartBottom - 42, lastY - 21));

  return `
    <svg class="m2-chart" viewBox="0 0 760 540" preserveAspectRatio="none" aria-label="Real Binance candle chart">
      <defs>
        <linearGradient id="realCandleBgM2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#020617" stop-opacity=".98"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity=".78"/>
        </linearGradient>
        <clipPath id="m2ChartClip">
          <rect x="${chartLeft}" y="${chartTop}" width="${chartW}" height="${chartH}" rx="0"/>
        </clipPath>
      </defs>

      <rect x="0" y="0" width="760" height="540" rx="34" fill="url(#realCandleBgM2)"/>

      <g>${verticalGrid}</g>
      <g>${grid}</g>

      <g clip-path="url(#m2ChartClip)">
        ${candleSvg}
      </g>

      <line x1="${chartLeft}" y1="${lastY}" x2="${chartRight}" y2="${lastY}" stroke="rgba(56,189,248,.86)" stroke-width="1.8" stroke-dasharray="6 6"/>
      <rect x="${badgeX}" y="${badgeY}" width="112" height="42" rx="10" fill="rgba(14,165,233,.96)" stroke="rgba(255,255,255,.18)"/>
      <text x="${badgeX + 10}" y="${badgeY + 17}" fill="#ffffff" font-size="12" font-weight="950">${fmt(lastPrice)}</text>
      <text x="${badgeX + 10}" y="${badgeY + 33}" fill="#e0f2fe" font-size="10" font-weight="900">${candleTimer}</text>

      <g>${timeLabels}</g>
    </svg>
  `;
}
  function miniChart() {
    return `
      <svg width="100%" height="76" viewBox="0 0 120 76" preserveAspectRatio="none">
        <path d="M8 58 L25 48 L40 52 L55 36 L72 42 L88 24 L112 18" fill="none" stroke="#38bdf8" stroke-width="4"/>
        <path d="M8 63 L112 28" fill="none" stroke="#2563eb" stroke-width="2"/>
      </svg>
    `;
  }

  function tabButtons() {
    const tabs = [
      ["overview", "Overview"],
      ["sentiment", "Sentiment"],
      ["sessions", "Sessions"],
      ["pulse", "Pulse"],
      ["community", "Community"]
    ];

    return `
      <div class="m2-tabs">
        ${tabs.map(([id, label]) => `
          <button class="${currentTab === id ? "active" : ""}" onclick="MobileDashboardV2.setTab('${id}')">${label}</button>
        `).join("")}
      </div>
    `;
  }

  function tabContent() {
    if (currentTab === "sentiment") {
      return `
        <section class="m2-card m2-panel">
          <div class="m2-panel-head">
            <h3>Market Sentiment</h3>
            <span>Overall Bullish</span>
          </div>

          <div class="m2-sent-row">
            <label>🐂 Bullish</label>
            <div class="m2-track"><i class="bull"></i></div>
            <b class="m2-green">62%</b>
          </div>
          <div class="m2-sent-row">
            <label>– Neutral</label>
            <div class="m2-track"><i class="neu"></i></div>
            <b>23%</b>
          </div>
          <div class="m2-sent-row">
            <label>🐻 Bearish</label>
            <div class="m2-track"><i class="bear"></i></div>
            <b class="m2-red">15%</b>
          </div>
        </section>
      `;
    }

    if (currentTab === "sessions") {
      return `
        <section class="m2-card m2-panel">
          <div class="m2-panel-head">
            <h3>Market Sessions</h3>
            <span>Current London</span>
          </div>

          <div class="m2-sessions">
            <div class="m2-session"><span>🌆</span><b>Sydney</b><small>01:00 - 10:00<br>GMT+0</small></div>
            <div class="m2-session"><span>🗼</span><b>Tokyo</b><small>02:00 - 11:00<br>GMT+0</small></div>
            <div class="m2-session active"><span>🏛️</span><b>London</b><small>07:00 - 16:00<br>GMT+0</small></div>
            <div class="m2-session"><span>🗽</span><b>New York</b><small>12:00 - 21:00<br>GMT+0</small></div>
          </div>
        </section>
      `;
    }

    if (currentTab === "pulse") {
      return `
        <section class="m2-card m2-panel">
          <div class="m2-panel-head">
            <h3>Market Pulse</h3>
            <span>Watchlist</span>
          </div>

          <div class="m2-pulse-grid">
            <div class="m2-mini-box"><small>XAUUSD</small><b class="m2-green">2345.12</b><span>Bullish</span></div>
            <div class="m2-mini-box"><small>BTCUSDT</small><b class="m2-red">67120</b><span>Pullback</span></div>
            <div class="m2-mini-box"><small>EURUSD</small><b class="m2-green">1.0854</b><span>Watch</span></div>
          </div>
        </section>
      `;
    }

    if (currentTab === "community") {
      return `
        <section class="m2-card m2-panel">
          <div class="m2-panel-head">
            <h3>Community Spotlight</h3>
            <span>Top Mapper</span>
          </div>

          <div class="m2-community">
            <div class="m2-community-chart">${miniChart()}</div>
            <div>
              <h4>Romadon Saputra</h4>
              <p>XAUUSD Bullish Channel. Tunggu konfirmasi candle di area support.</p>
              <button onclick="mobileDashGo('mapping')">View Community</button>
            </div>
          </div>
        </section>
      `;
    }

    return `
      <section class="m2-card m2-panel">
        <div class="m2-panel-head">
          <h3>Overview</h3>
          <span>Quick Read</span>
        </div>

        <div class="m2-overview-grid">
          <div class="m2-mini-box">
            <small>Market Sentiment</small>
            <b class="m2-green">Bullish 62%</b>
            <span>XAUUSD session view</span>
          </div>
          <div class="m2-mini-box">
            <small>Market Session</small>
            <b class="m2-blue">London</b>
            <span>Watch confirmation</span>
          </div>
        </div>
      </section>
    `;
  }

  function renderMobileDashboardV2() {
    if (!isMobile() || !dashActive()) return;
    if (rendering) return;

    rendering = true;
    injectStyle();
    hideMobileTicker();

    const dash = document.getElementById("dashboard");

    dash.innerHTML = `
      <div class="m2">
        <section class="m2-card m2-signal">
          <div class="m2-head">
            <div class="m2-title">
              <h2><span>BTCUSDT</span>Active Signal</h2>
              <p>Live candle · 15m</p>
            </div>
            <div class="m2-live"><i></i> LIVE</div>
          </div>

          <div class="m2-chartbox">
            ${chartSvg()}
          </div>

                    <div class="m2-stats">
          <div><small>Pair</small><b class="blue">BTCUSDT</b></div>
          <div><small>Price</small><b class="blue">${mobileRealChartPriceLabel()}</b></div>
          <div><small>Status</small><b class="green">${mobileRealChartStatusLabel()}</b></div>
          <div><small>Access</small><b class="yellow">Preview</b></div>
        </div>
      </section>

      <section class="m2-card m2-explore" onclick="mobileDashGo('scanner')">
          <div class="m2-radar">◎</div>
          <div>
            <h3>Explore Signal Scanner</h3>
            <p>Find high-probability setups in real time</p>
          </div>
          <div class="m2-arrow">›</div>
        </section>

        ${tabButtons()}
        ${tabContent()}
      </div>
    `;

    hideMobileTicker();
    rendering = false;
  }

  function schedule() {
    setTimeout(renderMobileDashboardV2, 80);
    setTimeout(renderMobileDashboardV2, 450);
    setTimeout(renderMobileDashboardV2, 1100);
    setTimeout(renderMobileDashboardV2, 2300);
  }

  function watch() {
    const dash = document.getElementById("dashboard");
    if (!dash || dash.dataset.m2Observer === "ready") return;

    dash.dataset.m2Observer = "ready";

    const observer = new MutationObserver(function () {
      if (!isMobile()) return;
      if (!dash.classList.contains("active")) return;
      if (dash.querySelector(".m2")) return;

      setTimeout(renderMobileDashboardV2, 120);
    });

    observer.observe(dash, { childList: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    schedule();
    watch();
    setTimeout(watch, 700);
    setTimeout(hideMobileTicker, 900);
  });

  window.addEventListener("resize", schedule);

  const oldShowPage = window.showPage;
  window.showPage = function () {
    const result = oldShowPage ? oldShowPage.apply(this, arguments) : undefined;
    schedule();
    return result;
  };

  const oldShowPageById = window.showPageById;
  window.showPageById = function () {
    const result = oldShowPageById ? oldShowPageById.apply(this, arguments) : undefined;
    schedule();
    return result;
  };

  schedule();

function mobileRealChartPriceLabel() {
  const state = window.asfxMobileRealChart || {};
  const candles = Array.isArray(state.candles) ? state.candles : [];
  const last = candles[candles.length - 1];
  if (!last) return "Loading";
  return Number(last.c).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function mobileRealChartStatusLabel() {
  const state = window.asfxMobileRealChart || {};
  if (state.status === "live") return "Live";
  if (state.status === "error") return "Feed Error";
  return "Loading";
}

async function loadMobileRealChartCandles() {
  const symbol = "BTCUSDT";
  const interval = "15m";
  const endpoints = [
    `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=60`,
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=60`
  ];

  window.asfxMobileRealChart = {
    ...(window.asfxMobileRealChart || {}),
    symbol,
    interval,
    status: "loading"
  };

  refreshMobileRealChartCard();

  let lastErr = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);

      const rows = await res.json();
      const candles = rows.map((row) => ({
        t: Number(row[0]),
        o: Number(row[1]),
        h: Number(row[2]),
        l: Number(row[3]),
        c: Number(row[4]),
        v: Number(row[5])
      })).filter((c) => Number.isFinite(c.o) && Number.isFinite(c.c));

      if (!candles.length) throw new Error("No candle rows");

      window.asfxMobileRealChart = {
        symbol,
        interval,
        status: "live",
        candles,
        updatedAt: Date.now()
      };

      refreshMobileRealChartCard();
      return;
    } catch (err) {
      lastErr = err;
    }
  }

  console.warn("AiSignalFx mobile real chart feed error:", lastErr);
  window.asfxMobileRealChart = {
    ...(window.asfxMobileRealChart || {}),
    symbol,
    interval,
    status: "error"
  };
  refreshMobileRealChartCard();
}

async function updateMobileRealChartLivePrice() {
  const state = window.asfxMobileRealChart || {};
  const symbol = state.symbol || "BTCUSDT";
  const candles = Array.isArray(state.candles) ? state.candles : [];

  if (!candles.length) return;

  const endpoints = [
    `https://data-api.binance.vision/api/v3/ticker/price?symbol=${symbol}`,
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
  ];

  let livePrice = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Ticker HTTP ${res.status}`);
      const payload = await res.json();
      const price = Number(payload.price);

      if (Number.isFinite(price) && price > 0) {
        livePrice = price;
        break;
      }
    } catch (err) {}
  }

  if (!Number.isFinite(livePrice) || livePrice <= 0) return;

  const nextCandles = candles.slice();
  const last = { ...nextCandles[nextCandles.length - 1] };

  last.c = livePrice;
  last.h = Math.max(Number(last.h || livePrice), livePrice);
  last.l = Math.min(Number(last.l || livePrice), livePrice);

  nextCandles[nextCandles.length - 1] = last;

  window.asfxMobileRealChart = {
    ...state,
    symbol,
    status: "live",
    candles: nextCandles,
    livePrice,
    liveUpdatedAt: Date.now()
  };

  refreshMobileRealChartCard();
}

function refreshMobileRealChartCard() {
  const signal = document.querySelector(".m2-card.m2-signal");
  if (!signal) return;

  const chartBox = signal.querySelector(".m2-chartbox");
  if (chartBox) {
    chartBox.innerHTML = chartSvg();
  }

  const stats = signal.querySelector(".m2-stats");
  if (stats) {
        stats.innerHTML = `
      <div><small>Pair</small><b class="blue">BTCUSDT</b></div>
      <div><small>Price</small><b class="blue">${mobileRealChartPriceLabel()}</b></div>
      <div><small>Status</small><b class="green">${mobileRealChartStatusLabel()}</b></div>
      <div><small>Access</small><b class="yellow">Preview</b></div>
    `;
  }
}

function injectMobileRealChartSizeFix() {
  if (document.getElementById("asfx-mobile-real-chart-size-fix")) return;

  const style = document.createElement("style");
  style.id = "asfx-mobile-real-chart-size-fix";
  style.textContent = `
    @media (max-width: 760px) {
      .m2-card.m2-signal {
        margin-left: 10px !important;
        margin-right: 10px !important;
        padding-left: 14px !important;
        padding-right: 14px !important;
      }

      .m2-chartbox {
        margin-left: 0 !important;
        margin-right: 0 !important;
        min-height: 360px !important;
      }

      .m2-chart {
        min-height: 360px !important;
      }

      .m2-title h2 {
        font-size: clamp(30px, 9vw, 46px) !important;
        line-height: 1.06 !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function startMobileRealChartEngineV1() {
  if (window.asfxMobileRealChartStarted) return;
  window.asfxMobileRealChartStarted = true;

  injectMobileRealChartSizeFix();

  setTimeout(refreshMobileRealChartCard, 250);

  loadMobileRealChartCandles().then(() => {
    updateMobileRealChartLivePrice();
  }).catch(() => {});

  setInterval(updateMobileRealChartLivePrice, 2000);
  setInterval(loadMobileRealChartCandles, 60000);
}

startMobileRealChartEngineV1();












/* ASFX MOBILE DASHBOARD CLEAR FINAL */
function injectMobileDashboardClearFinal() {
  if (document.getElementById("asfx-mobile-dashboard-clear-final")) return;

  const style = document.createElement("style");
  style.id = "asfx-mobile-dashboard-clear-final";
  style.textContent = `
    @media (max-width: 760px) {
      #dashboard .m2 {
        padding-left: 5px !important;
        padding-right: 5px !important;
        padding-bottom: 145px !important;
      }

      .m2-card.m2-signal {
        margin-left: 4px !important;
        margin-right: 4px !important;
        padding-left: 10px !important;
        padding-right: 10px !important;
        padding-bottom: 14px !important;
        border-radius: 28px !important;
        overflow: hidden !important;
      }

      .m2-head {
        gap: 8px !important;
        align-items: flex-start !important;
      }

      .m2-title h2 {
        font-size: clamp(22px, 6.2vw, 30px) !important;
        line-height: 1.05 !important;
        letter-spacing: -0.03em !important;
        margin: 0 !important;
      }

      .m2-title h2 span {
        display: inline !important;
        margin-right: 6px !important;
      }

      .m2-title p {
        margin-top: 5px !important;
        font-size: 12px !important;
        line-height: 1.25 !important;
        opacity: .78 !important;
      }

      .m2-live {
        transform: scale(.78) !important;
        transform-origin: top right !important;
        flex: 0 0 auto !important;
      }

      .m2-chartbox {
        margin-top: 10px !important;
        height: 395px !important;
        min-height: 395px !important;
        max-height: 395px !important;
        overflow: hidden !important;
        border-radius: 24px !important;
      }

      .m2-chartbox svg,
      .m2-chart {
        width: 100% !important;
        height: 395px !important;
        min-height: 395px !important;
        max-height: 395px !important;
        display: block !important;
      }

      .m2-card.m2-signal .m2-stats {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 8px !important;
        margin-top: 12px !important;
      }

      .m2-card.m2-signal .m2-stats > div {
        min-width: 0 !important;
        height: 62px !important;
        padding: 8px 5px !important;
        border-radius: 17px !important;
        text-align: center !important;
      }

      .m2-card.m2-signal .m2-stats small {
        display: block !important;
        font-size: 10px !important;
        line-height: 1 !important;
        margin-bottom: 5px !important;
      }

      .m2-card.m2-signal .m2-stats b {
        display: block !important;
        font-size: clamp(11px, 3.4vw, 15px) !important;
        line-height: 1.05 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      .m2-card.m2-signal .asfx-stat-blur {
        filter: blur(2.4px) !important;
        opacity: .72 !important;
        user-select: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

injectMobileDashboardClearFinal();



/* ASFX MOBILE OUTER CARD GRID5 FIX */
function injectMobileOuterCardGrid5Fix() {
  if (document.getElementById("asfx-mobile-outer-card-grid5-fix")) return;

  const style = document.createElement("style");
  style.id = "asfx-mobile-outer-card-grid5-fix";
  style.textContent = `
    @media (max-width: 760px) {
      #dashboard .m2 {
        padding-left: 2px !important;
        padding-right: 2px !important;
      }

      .m2-card.m2-signal {
        margin-left: 2px !important;
        margin-right: 2px !important;
      }

      .m2-chartbox {
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
    }
  `;
  document.head.appendChild(style);
}

injectMobileOuterCardGrid5Fix();

})();
