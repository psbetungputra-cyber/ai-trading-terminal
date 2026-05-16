/* AiSignalFx PRO - Mobile Dashboard Photo Direction V1 */
(function () {
  const STYLE_ID = "mobile-dashboard-photo-v1-style";

  function isMobile() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function activeDashboard() {
    const dash = document.getElementById("dashboard");
    return dash && dash.classList.contains("active");
  }

  function go(page) {
    if (typeof window.v4Go === "function") return window.v4Go(page);
    if (typeof window.showPageById === "function") return window.showPageById(page);
    if (typeof window.showPage === "function") return window.showPage(page);
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width: 760px) {
        #dashboard .mphoto {
          display: grid;
          gap: 18px;
          padding: 18px 14px 100px;
          color: #e5eefc;
        }

        #dashboard .mphoto * {
          box-sizing: border-box;
        }

        #dashboard .m-card {
          border: 1px solid rgba(96, 165, 250, .18);
          background:
            radial-gradient(circle at 80% 20%, rgba(37,99,235,.16), transparent 35%),
            linear-gradient(145deg, #08111f, #050c16);
          border-radius: 24px;
          box-shadow: 0 18px 44px rgba(0,0,0,.28);
        }

        #dashboard .m-signal {
          padding: 16px;
        }

        #dashboard .m-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
        }

        #dashboard .m-title {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        #dashboard .m-title b {
          color: #60a5fa;
          font-size: 16px;
          font-weight: 900;
          white-space: nowrap;
        }

        #dashboard .m-title span {
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
        }

        #dashboard .m-live {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #4ade80;
          background: rgba(34,197,94,.12);
          border: 1px solid rgba(34,197,94,.22);
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 900;
        }

        #dashboard .m-live i {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 12px rgba(34,197,94,.8);
        }

        #dashboard .m-signal-body {
          display: grid;
          grid-template-columns: 0.74fr 1.26fr;
          gap: 12px;
          align-items: stretch;
        }

        #dashboard .m-price {
          border-right: 1px solid rgba(148,163,184,.12);
          padding-right: 10px;
        }

        #dashboard .m-price strong {
          display: block;
          color: #22c55e;
          font-size: 24px;
          line-height: 1;
          margin-bottom: 8px;
        }

        #dashboard .m-price h2 {
          margin: 0 0 16px;
          color: #fff;
          font-size: 26px;
          line-height: 1;
        }

        #dashboard .m-stat {
          margin-top: 11px;
        }

        #dashboard .m-stat small {
          display: block;
          color: #94a3b8;
          font-size: 11px;
          margin-bottom: 3px;
        }

        #dashboard .m-stat b {
          color: #fff;
          font-size: 16px;
        }

        #dashboard .m-stat b.green {
          color: #4ade80;
        }

        #dashboard .m-stat b.red {
          color: #f87171;
        }

        #dashboard .m-chartbox {
          min-height: 210px;
          background: rgba(2,6,23,.58);
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 18px;
          overflow: hidden;
        }

        #dashboard .m-chart {
          display: block;
          width: 100%;
          height: 210px;
        }

        #dashboard .m-chart .grid line {
          stroke: rgba(148,163,184,.12);
          stroke-width: 1;
        }

        #dashboard .m-chart .line {
          fill: none;
          stroke: #2f7cff;
          stroke-width: 4;
        }

        #dashboard .m-chart .tp {
          stroke: rgba(34,197,94,.72);
          stroke-width: 2;
          stroke-dasharray: 7 7;
        }

        #dashboard .m-chart .sl {
          stroke: rgba(239,68,68,.78);
          stroke-width: 2;
          stroke-dasharray: 7 7;
        }

        #dashboard .m-chart text {
          font-size: 14px;
          font-weight: 900;
        }

        #dashboard .m-chart .green {
          fill: #22c55e;
        }

        #dashboard .m-chart .red {
          fill: #ef4444;
        }

        #dashboard .m-chart .price-tag {
          fill: #2f7cff;
        }

        #dashboard .m-chart .price-text {
          fill: #fff;
          font-size: 13px;
        }

        #dashboard .m-explore {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background:
            radial-gradient(circle at 10% 50%, rgba(59,130,246,.28), transparent 28%),
            linear-gradient(135deg, #0b1f3a, #082047 55%, #0e7490);
        }

        #dashboard .m-radar {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          color: #60a5fa;
          border: 1px solid rgba(96,165,250,.35);
          font-size: 28px;
        }

        #dashboard .m-explore h3 {
          margin: 0;
          color: #fff;
          font-size: 18px;
        }

        #dashboard .m-explore p {
          margin: 3px 0 0;
          color: #a8b6cc;
          font-size: 12px;
        }

        #dashboard .m-arrow {
          color: #7dd3fc;
          font-size: 34px;
          line-height: 1;
        }

        #dashboard .m-panel {
          padding: 16px;
        }

        #dashboard .m-panel-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        #dashboard .m-panel-title h3 {
          margin: 0;
          color: #fff;
          font-size: 19px;
        }

        #dashboard .m-panel-title span {
          color: #94a3b8;
          font-size: 13px;
        }

        #dashboard .m-panel-title b {
          color: #4ade80;
          margin-left: 6px;
        }

        #dashboard .m-sent-row {
          display: grid;
          grid-template-columns: 72px 1fr 42px;
          gap: 10px;
          align-items: center;
          margin-top: 12px;
        }

        #dashboard .m-sent-row label {
          color: #e5eefc;
          font-size: 14px;
        }

        #dashboard .m-sent-row b {
          text-align: right;
          font-size: 14px;
        }

        #dashboard .m-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(148,163,184,.15);
          overflow: hidden;
        }

        #dashboard .m-track i {
          display: block;
          height: 100%;
          border-radius: inherit;
        }

        #dashboard .m-track .bull {
          width: 62%;
          background: #22c55e;
        }

        #dashboard .m-track .neu {
          width: 23%;
          background: #94a3b8;
        }

        #dashboard .m-track .bear {
          width: 15%;
          background: #ef4444;
        }

        #dashboard .m-sessions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        #dashboard .m-session {
          background: rgba(15,23,42,.7);
          border: 1px solid rgba(148,163,184,.13);
          border-radius: 14px;
          padding: 10px 8px;
          text-align: center;
          min-width: 0;
        }

        #dashboard .m-session.active {
          border-color: rgba(59,130,246,.85);
          background: rgba(37,99,235,.18);
        }

        #dashboard .m-session span {
          display: block;
          font-size: 22px;
          line-height: 1;
          margin-bottom: 7px;
        }

        #dashboard .m-session b {
          display: block;
          color: #fff;
          font-size: 12px;
          white-space: nowrap;
        }

        #dashboard .m-session small {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.35;
          margin-top: 5px;
        }

        #dashboard .m-timeline {
          height: 4px;
          margin-top: 18px;
          border-radius: 999px;
          background: rgba(148,163,184,.22);
          position: relative;
        }

        #dashboard .m-timeline::after {
          content: "";
          position: absolute;
          left: 57%;
          top: 50%;
          width: 14px;
          height: 14px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: #3b82f6;
          box-shadow: 0 0 16px rgba(59,130,246,.7);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function chartSvg() {
    return `
      <svg class="m-chart" viewBox="0 0 420 260" preserveAspectRatio="none">
        <g class="grid">
          <line x1="0" y1="52" x2="420" y2="52"/>
          <line x1="0" y1="104" x2="420" y2="104"/>
          <line x1="0" y1="156" x2="420" y2="156"/>
          <line x1="0" y1="208" x2="420" y2="208"/>
          <line x1="80" y1="0" x2="80" y2="260"/>
          <line x1="160" y1="0" x2="160" y2="260"/>
          <line x1="240" y1="0" x2="240" y2="260"/>
          <line x1="320" y1="0" x2="320" y2="260"/>
        </g>

        <line class="tp" x1="0" y1="52" x2="390" y2="52"/>
        <line class="tp" x1="0" y1="104" x2="390" y2="104"/>
        <line class="sl" x1="0" y1="190" x2="390" y2="190"/>

        <text x="28" y="43" class="green">TP2 2360.00</text>
        <text x="28" y="95" class="green">TP1 2352.00</text>
        <text x="42" y="206" class="red">SL 2330.00</text>

        <polyline class="line" points="12,204 34,188 58,175 82,182 106,156 130,160 154,145 178,166 202,140 226,116 250,134 274,130 298,146 322,110 346,94 370,76 390,70"/>
        <circle cx="390" cy="70" r="7" fill="#2f7cff"/>
        <rect class="price-tag" x="386" y="101" width="62" height="28" rx="8"/>
        <text class="price-text" x="393" y="120">2345.67</text>
      </svg>
    `;
  }

  function renderMobileDashboard() {
    if (!isMobile() || !activeDashboard()) return;

    injectStyle();

    const dash = document.getElementById("dashboard");
    dash.innerHTML = `
      <div class="mphoto">
        <section class="m-card m-signal">
          <div class="m-head">
            <div class="m-title">
              <b>XAUUSD</b>
              <span>Active Signal Preview</span>
            </div>
            <div class="m-live"><i></i> LIVE</div>
          </div>

          <div class="m-signal-body">
            <div class="m-price">
              <strong>BUY</strong>
              <h2>2,345.67</h2>

              <div class="m-stat">
                <small>Strength</small>
                <b class="green">85%</b>
              </div>

              <div class="m-stat">
                <small>Target 1</small>
                <b>2,352.00</b>
              </div>

              <div class="m-stat">
                <small>Target 2</small>
                <b>2,360.00</b>
              </div>

              <div class="m-stat">
                <small>Stop Loss</small>
                <b class="red">2,330.00</b>
              </div>
            </div>

            <div class="m-chartbox">
              ${chartSvg()}
            </div>
          </div>
        </section>

        <section class="m-card m-explore" onclick="v4Go('scanner')">
          <div class="m-radar">◎</div>
          <div>
            <h3>Explore Signal Scanner</h3>
            <p>Find high-probability setups in real time</p>
          </div>
          <div class="m-arrow">›</div>
        </section>

        <section class="m-card m-panel">
          <div class="m-panel-title">
            <h3>Market Sentiment</h3>
            <span>Overall <b>BULLISH</b></span>
          </div>

          <div class="m-sent-row">
            <label>🐂 Bullish</label>
            <div class="m-track"><i class="bull"></i></div>
            <b class="green">62%</b>
          </div>

          <div class="m-sent-row">
            <label>– Neutral</label>
            <div class="m-track"><i class="neu"></i></div>
            <b>23%</b>
          </div>

          <div class="m-sent-row">
            <label>🐻 Bearish</label>
            <div class="m-track"><i class="bear"></i></div>
            <b class="red">15%</b>
          </div>
        </section>

        <section class="m-card m-panel">
          <div class="m-panel-title">
            <h3>Market Sessions</h3>
            <span>Current: <b>London</b></span>
          </div>

          <div class="m-sessions">
            <div class="m-session">
              <span>🌆</span>
              <b>Sydney</b>
              <small>01:00 - 10:00<br>GMT+0</small>
            </div>
            <div class="m-session">
              <span>🗼</span>
              <b>Tokyo</b>
              <small>02:00 - 11:00<br>GMT+0</small>
            </div>
            <div class="m-session active">
              <span>🏛️</span>
              <b>London</b>
              <small>07:00 - 16:00<br>GMT+0</small>
            </div>
            <div class="m-session">
              <span>🗽</span>
              <b>New York</b>
              <small>12:00 - 21:00<br>GMT+0</small>
            </div>
          </div>

          <div class="m-timeline"></div>
        </section>
      </div>
    `;
  }

  function schedule() {
    setTimeout(renderMobileDashboard, 80);
    setTimeout(renderMobileDashboard, 500);
    setTimeout(renderMobileDashboard, 1300);
    setTimeout(renderMobileDashboard, 2300);
    setTimeout(renderMobileDashboard, 4200);
  }

  document.addEventListener("DOMContentLoaded", schedule);
  window.addEventListener("resize", schedule);

  const oldShowPage = window.showPage;
  window.showPage = function () {
    const result = oldShowPage ? oldShowPage.apply(this, arguments) : undefined;
    if (String(arguments[0]).toLowerCase() === "dashboard") schedule();
    return result;
  };

  const oldShowPageById = window.showPageById;
  window.showPageById = function () {
    const result = oldShowPageById ? oldShowPageById.apply(this, arguments) : undefined;
    if (String(arguments[0]).toLowerCase() === "dashboard") schedule();
    return result;
  };


  // V4 Core bisa render ulang dashboard setelah refresh.
  // Observer ini memastikan versi mobile photo tetap menang di HP.
  let mphotoRendering = false;

  function watchDashboardMobilePhoto() {
    const dash = document.getElementById("dashboard");
    if (!dash || dash.dataset.mphotoObserver === "ready") return;

    dash.dataset.mphotoObserver = "ready";

    const observer = new MutationObserver(function () {
      if (!isMobile()) return;
      if (!dash.classList.contains("active")) return;
      if (dash.querySelector(".mphoto")) return;
      if (mphotoRendering) return;

      mphotoRendering = true;
      setTimeout(function () {
        renderMobileDashboard();
        mphotoRendering = false;
      }, 160);
    });

    observer.observe(dash, { childList: true });
  }

  document.addEventListener("DOMContentLoaded", watchDashboardMobilePhoto);
  setTimeout(watchDashboardMobilePhoto, 300);
  setTimeout(watchDashboardMobilePhoto, 1400);


  schedule();
})();
