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
    return `
      <svg class="m2-chart" viewBox="0 0 420 260" preserveAspectRatio="none">
        <defs>
          <linearGradient id="m2Line" x1="0" x2="1">
            <stop offset="0%" stop-color="#2563eb"/>
            <stop offset="100%" stop-color="#22d3ee"/>
          </linearGradient>
        </defs>

        <g class="grid">
          <line x1="0" y1="52" x2="420" y2="52"/>
          <line x1="0" y1="104" x2="420" y2="104"/>
          <line x1="0" y1="156" x2="420" y2="156"/>
          <line x1="0" y1="208" x2="420" y2="208"/>
          <line x1="70" y1="0" x2="70" y2="260"/>
          <line x1="140" y1="0" x2="140" y2="260"/>
          <line x1="210" y1="0" x2="210" y2="260"/>
          <line x1="280" y1="0" x2="280" y2="260"/>
          <line x1="350" y1="0" x2="350" y2="260"/>
        </g>

        <line class="tp" x1="20" y1="54" x2="390" y2="54"/>
        <line class="tp" x1="20" y1="104" x2="390" y2="104"/>
        <line class="entry" x1="20" y1="142" x2="390" y2="142"/>
        <line class="sl" x1="20" y1="194" x2="390" y2="194"/>

        <text x="26" y="45" class="green">TP2 2360.00</text>
        <text x="26" y="95" class="green">TP1 2352.00</text>
        <text x="300" y="134" class="blue">ENTRY 2345.67</text>
        <text x="26" y="210" class="red">SL 2330.00</text>

        <path class="area" d="M18 206 L45 188 L72 194 L98 166 L124 172 L150 146 L176 162 L202 128 L228 116 L254 132 L280 126 L306 148 L332 104 L358 82 L386 70 L386 260 L18 260 Z"/>
        <polyline class="line" points="18,206 45,188 72,194 98,166 124,172 150,146 176,162 202,128 228,116 254,132 280,126 306,148 332,104 358,82 386,70" stroke="url(#m2Line)"/>
        <circle cx="386" cy="70" r="7" fill="#2f7cff"/>
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
              <h2><span>XAUUSD</span>Active Signal</h2>
              <p>BUY setup • Strength 85%</p>
            </div>
            <div class="m2-live"><i></i> LIVE</div>
          </div>

          <div class="m2-chartbox">
            ${chartSvg()}
          </div>

          <div class="m2-stats">
            <div><small>Bias</small><b class="buy">BUY</b></div>
            <div><small>Entry</small><b class="blue">2345.67</b></div>
            <div><small>Stop Loss</small><b class="red">2330.00</b></div>
            <div><small>Target</small><b class="green">2360.00</b></div>
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
})();
