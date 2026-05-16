/* AiSignalFx PRO - Premium Dashboard V2
   One-file dashboard override with injected CSS.
   Keeps old engine/features safe. */
(function () {
  const STYLE_ID = "aisignalfx-dashboard-v2-style";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #dashboard .dp2,
      #dashboard .dp2 * {
        box-sizing: border-box;
      }

      #dashboard .dp2 {
        width: 100%;
        max-width: 1440px;
        margin: 0 auto;
        padding: 20px;
        color: #e5eefc;
        display: grid;
        gap: 18px;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #dashboard .dp2 button {
        appearance: none;
        border: 0;
        font: inherit;
        cursor: pointer;
      }

      #dashboard .dp2-card,
      #dashboard .dp2-hero,
      #dashboard .dp2-spotlight,
      #dashboard .dp2-pulse,
      #dashboard .dp2-quick {
        background: #08111f;
        border: 1px solid rgba(96, 165, 250, 0.16);
        border-radius: 24px;
        box-shadow: 0 22px 52px rgba(0,0,0,.24);
      }

      #dashboard .dp2-hero {
        min-height: 176px;
        padding: 24px;
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) 320px;
        align-items: center;
        gap: 20px;
        background:
          radial-gradient(circle at 86% 30%, rgba(14, 165, 233, .18), transparent 30%),
          linear-gradient(135deg, #07111f, #0b1728 62%, #07111f);
      }

      #dashboard .dp2-kicker {
        display: inline-flex;
        color: #60a5fa;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .14em;
        text-transform: uppercase;
        margin-bottom: 10px;
      }

      #dashboard .dp2 h1,
      #dashboard .dp2 h2,
      #dashboard .dp2 h3,
      #dashboard .dp2 p {
        margin: 0;
      }

      #dashboard .dp2 h1 {
        color: #fff;
        font-size: clamp(32px, 4vw, 58px);
        letter-spacing: -0.05em;
        line-height: .95;
      }

      #dashboard .dp2-hero p {
        color: #94a3b8;
        max-width: 760px;
        font-size: 15px;
        line-height: 1.65;
        margin-top: 14px;
      }

      #dashboard .dp2-actions,
      #dashboard .dp2-inline-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      #dashboard .dp2-btn,
      #dashboard .dp2-wide-btn,
      #dashboard .dp2-small-btn {
        border-radius: 14px;
        background: linear-gradient(135deg, #2563eb, #06b6d4);
        color: #fff;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .06em;
        text-transform: uppercase;
        padding: 12px 16px;
      }

      #dashboard .dp2-btn.secondary,
      #dashboard .dp2-small-btn {
        background: #050c16;
        color: #93c5fd;
        border: 1px solid rgba(96,165,250,.24);
      }

      #dashboard .dp2-bias {
        background: #050c16;
        border: 1px solid rgba(96, 165, 250, .16);
        border-radius: 20px;
        padding: 18px;
      }

      #dashboard .dp2-bias small,
      #dashboard .dp2 small {
        color: #94a3b8;
        display: block;
      }

      #dashboard .dp2-bias strong {
        display: block;
        color: #4ade80;
        font-size: 38px;
        line-height: 1;
        margin: 7px 0;
      }

      #dashboard .dp2-meter {
        height: 9px;
        border-radius: 999px;
        background: rgba(148, 163, 184, .14);
        overflow: hidden;
        margin-top: 14px;
      }

      #dashboard .dp2-meter i {
        display: block;
        height: 100%;
        width: 72%;
        border-radius: inherit;
        background: linear-gradient(90deg, #22c55e, #22d3ee);
      }

      #dashboard .dp2-main {
        display: grid;
        grid-template-columns: minmax(0, 1.28fr) minmax(330px, .72fr);
        gap: 18px;
      }

      #dashboard .dp2-card {
        padding: 18px;
      }

      #dashboard .dp2-head,
      #dashboard .dp2-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      #dashboard .dp2-head {
        margin-bottom: 16px;
      }

      #dashboard .dp2-head strong {
        color: #fff;
        font-size: 18px;
      }

      #dashboard .dp2-live {
        display: inline-flex;
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: #22c55e;
        margin-right: 8px;
        box-shadow: 0 0 0 6px rgba(34, 197, 94, .12);
      }

      #dashboard .dp2-signal-title h2 {
        color: #fff;
        font-size: 30px;
        line-height: 1;
        margin-bottom: 8px;
      }

      #dashboard .dp2-badge {
        display: inline-flex;
        color: #7dd3fc;
        border: 1px solid rgba(96,165,250,.24);
        background: rgba(37, 99, 235, .18);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
      }

      #dashboard .dp2-confidence {
        text-align: right;
      }

      #dashboard .dp2-confidence b {
        color: #4ade80;
        font-size: 28px;
      }

      #dashboard .dp2-chartbox {
        margin-top: 16px;
        background: #050c16;
        border: 1px solid rgba(96,165,250,.12);
        border-radius: 18px;
        overflow: hidden;
      }

      #dashboard .dp2-chart {
        width: 100%;
        height: 250px;
        display: block;
      }

      #dashboard .dp2-chart .grid line,
      #dashboard .dp2-mini-chart .grid line {
        stroke: rgba(148, 163, 184, .12);
        stroke-width: 1;
      }

      #dashboard .dp2-chart .line {
        fill: none;
        stroke: url(#dp2Line);
        stroke-width: 4;
      }

      #dashboard .dp2-chart .dot {
        fill: #38bdf8;
        filter: drop-shadow(0 0 8px rgba(56,189,248,.7));
      }

      #dashboard .dp2-chart .tp,
      #dashboard .dp2-chart .entry,
      #dashboard .dp2-chart .sl {
        stroke-width: 2;
        stroke-dasharray: 8 8;
      }

      #dashboard .dp2-chart .tp { stroke: rgba(34,197,94,.65); }
      #dashboard .dp2-chart .entry { stroke: rgba(59,130,246,.72); }
      #dashboard .dp2-chart .sl { stroke: rgba(248,113,113,.72); }

      #dashboard .dp2-chart text {
        font-size: 18px;
        font-weight: 900;
      }

      #dashboard .dp2-chart .tpt { fill: #4ade80; }
      #dashboard .dp2-chart .ent { fill: #60a5fa; }
      #dashboard .dp2-chart .slt { fill: #f87171; }

      #dashboard .dp2-levels {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 14px;
      }

      #dashboard .dp2-levels div {
        text-align: center;
        background: #050c16;
        border: 1px solid rgba(148, 163, 184, .12);
        border-radius: 14px;
        padding: 13px 10px;
      }

      #dashboard .dp2-levels b {
        display: block;
        margin-top: 5px;
        font-size: 18px;
      }

      #dashboard .blue { color: #60a5fa !important; }
      #dashboard .green { color: #4ade80 !important; }
      #dashboard .red { color: #f87171 !important; }

      #dashboard .dp2-wide-btn {
        width: 100%;
        margin-top: 14px;
      }

      #dashboard .dp2-side {
        display: grid;
        gap: 18px;
        align-content: start;
      }

      #dashboard .dp2-sentiment-line {
        display: flex;
        justify-content: space-between;
        color: #e5eefc;
        margin-bottom: 10px;
      }

      #dashboard .dp2-bar {
        height: 10px;
        border-radius: 999px;
        background: rgba(148, 163, 184, .14);
        overflow: hidden;
      }

      #dashboard .dp2-bar i {
        display: block;
        height: 100%;
        width: 59%;
        border-radius: inherit;
        background: linear-gradient(90deg, #22c55e 0 59%, #ef4444 59% 100%);
      }

      #dashboard .dp2-session {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 16px;
      }

      #dashboard .dp2-session div {
        background: #050c16;
        border: 1px solid rgba(148,163,184,.12);
        border-radius: 14px;
        padding: 12px 10px;
        text-align: center;
      }

      #dashboard .dp2-session b,
      #dashboard .dp2-session span {
        display: block;
      }

      #dashboard .dp2-session span {
        margin-top: 4px;
        color: #94a3b8;
        font-size: 12px;
      }

      #dashboard .dp2-quick {
        padding: 18px;
      }

      #dashboard .dp2-quick-list {
        display: grid;
        gap: 10px;
      }

      #dashboard .dp2-quick-list button {
        text-align: left;
        color: #e5eefc;
        background: #050c16;
        border: 1px solid rgba(148,163,184,.12);
        border-radius: 14px;
        padding: 13px 14px;
        font-weight: 800;
      }

      #dashboard .dp2-spotlight {
        padding: 18px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 260px;
        gap: 16px;
      }

      #dashboard .dp2-map {
        display: grid;
        grid-template-columns: 290px minmax(0, 1fr);
        gap: 18px;
        align-items: center;
      }

      #dashboard .dp2-map-thumb {
        background: #050c16;
        border: 1px solid rgba(96,165,250,.14);
        border-radius: 18px;
        overflow: hidden;
        min-height: 170px;
      }

      #dashboard .dp2-mini-chart {
        width: 100%;
        height: 170px;
        display: block;
      }

      #dashboard .dp2-map h3 {
        color: #fff;
        font-size: 28px;
        line-height: 1.05;
        margin: 4px 0 10px;
      }

      #dashboard .dp2-map p {
        color: #94a3b8;
        line-height: 1.5;
      }

      #dashboard .dp2-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        color: #94a3b8;
        margin-top: 12px;
      }

      #dashboard .dp2-inline-actions button {
        background: #050c16;
        color: #cbd5e1;
        border: 1px solid rgba(148,163,184,.14);
        border-radius: 999px;
        padding: 9px 13px;
        font-weight: 800;
      }

      #dashboard .dp2-mini-maps {
        display: grid;
        gap: 12px;
      }

      #dashboard .dp2-mini-maps div {
        background: #050c16;
        border: 1px solid rgba(148,163,184,.12);
        border-radius: 16px;
        padding: 18px;
      }

      #dashboard .dp2-mini-maps b,
      #dashboard .dp2-mini-maps span {
        display: block;
      }

      #dashboard .dp2-mini-maps b {
        color: #fff;
      }

      #dashboard .dp2-mini-maps span {
        color: #94a3b8;
        margin-top: 6px;
      }

      #dashboard .dp2-pulse {
        padding: 18px;
      }

      #dashboard .dp2-pulse-list {
        display: grid;
        gap: 8px;
      }

      #dashboard .dp2-pulse-list div {
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
        gap: 14px;
        background: #050c16;
        border: 1px solid rgba(148,163,184,.1);
        border-radius: 13px;
        padding: 11px 13px;
      }

      #dashboard .dp2-pulse-list b { color: #fff; }
      #dashboard .dp2-pulse-list em {
        color: #94a3b8;
        font-style: normal;
      }

      @media (max-width: 760px) {
        #dashboard .dp2 {
          padding: 16px;
          gap: 14px;
          padding-bottom: 90px;
        }

        #dashboard .dp2-hero,
        #dashboard .dp2-main,
        #dashboard .dp2-spotlight {
          grid-template-columns: 1fr;
        }

        #dashboard .dp2-hero {
          min-height: unset;
          padding: 18px;
        }

        #dashboard .dp2 h1 {
          font-size: 36px;
        }

        #dashboard .dp2-hero p {
          font-size: 13px;
        }

        #dashboard .dp2-bias {
          padding: 15px;
        }

        #dashboard .dp2-bias strong {
          font-size: 30px;
        }

        #dashboard .dp2-card,
        #dashboard .dp2-spotlight,
        #dashboard .dp2-pulse,
        #dashboard .dp2-quick {
          border-radius: 22px;
          padding: 16px;
        }

        #dashboard .dp2-head strong {
          font-size: 17px;
        }

        #dashboard .dp2-signal-title h2 {
          font-size: 28px;
        }

        #dashboard .dp2-confidence b {
          font-size: 22px;
        }

        #dashboard .dp2-chart {
          height: 218px;
        }

        #dashboard .dp2-chart text {
          font-size: 15px;
        }

        #dashboard .dp2-levels {
          gap: 8px;
        }

        #dashboard .dp2-levels div {
          padding: 11px 7px;
        }

        #dashboard .dp2-levels small {
          font-size: 10px;
        }

        #dashboard .dp2-levels b {
          font-size: 14px;
        }

        #dashboard .dp2-map {
          grid-template-columns: 1fr;
        }

        #dashboard .dp2-map-thumb,
        #dashboard .dp2-mini-chart {
          min-height: 160px;
          height: 160px;
        }

        #dashboard .dp2-map h3 {
          font-size: 24px;
        }

        #dashboard .dp2-mini-maps {
          grid-template-columns: repeat(2, 1fr);
        }

        #dashboard .dp2-mini-maps div {
          padding: 14px;
        }

        #dashboard .dp2-pulse-list div {
          grid-template-columns: 1fr auto;
        }

        #dashboard .dp2-pulse-list em {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function go(page) {
    if (typeof window.showPageById === "function") {
      window.showPageById(page);
    } else if (typeof window.showPage === "function") {
      window.showPage(page);
    } else {
      document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
      document.getElementById(page)?.classList.add("active");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.dashboardV2Go = go;

  function signalChart() {
    return `
      <svg class="dp2-chart" viewBox="0 0 760 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dp2Line" x1="0" x2="1">
            <stop offset="0%" stop-color="#2563eb"/>
            <stop offset="100%" stop-color="#22d3ee"/>
          </linearGradient>
        </defs>

        <g class="grid">
          <line x1="0" y1="60" x2="760" y2="60"/>
          <line x1="0" y1="120" x2="760" y2="120"/>
          <line x1="0" y1="180" x2="760" y2="180"/>
          <line x1="0" y1="240" x2="760" y2="240"/>
          <line x1="120" y1="0" x2="120" y2="300"/>
          <line x1="240" y1="0" x2="240" y2="300"/>
          <line x1="360" y1="0" x2="360" y2="300"/>
          <line x1="480" y1="0" x2="480" y2="300"/>
          <line x1="600" y1="0" x2="600" y2="300"/>
        </g>

        <line class="tp" x1="30" y1="62" x2="720" y2="62"/>
        <line class="entry" x1="30" y1="150" x2="720" y2="150"/>
        <line class="sl" x1="30" y1="235" x2="720" y2="235"/>

        <text x="610" y="54" class="tpt">TP 2365.00</text>
        <text x="610" y="142" class="ent">ENTRY 2345.12</text>
        <text x="610" y="227" class="slt">SL 2331.20</text>

        <polyline class="line" points="30,220 70,205 110,215 150,180 190,195 230,160 270,170 310,135 350,145 390,115 430,125 470,88 510,105 550,82 590,70 630,78 670,58 720,62"/>
        <circle cx="720" cy="62" r="7" class="dot"/>
      </svg>
    `;
  }

  function miniChart() {
    return `
      <svg class="dp2-mini-chart" viewBox="0 0 320 180" preserveAspectRatio="none">
        <g class="grid">
          <line x1="0" y1="45" x2="320" y2="45"/>
          <line x1="0" y1="90" x2="320" y2="90"/>
          <line x1="0" y1="135" x2="320" y2="135"/>
          <line x1="80" y1="0" x2="80" y2="180"/>
          <line x1="160" y1="0" x2="160" y2="180"/>
          <line x1="240" y1="0" x2="240" y2="180"/>
        </g>
        <path d="M20 135 L55 120 L90 126 L125 95 L160 105 L195 78 L230 84 L270 54 L300 63" fill="none" stroke="#38bdf8" stroke-width="4"/>
        <path d="M20 145 L300 72" fill="none" stroke="#2563eb" stroke-width="2.5"/>
        <path d="M20 115 L300 42" fill="none" stroke="#2563eb" stroke-width="2" opacity=".7"/>
      </svg>
    `;
  }

  function renderDashboard() {
    injectStyle();

    const dash = document.getElementById("dashboard");
    if (!dash) return;

    dash.innerHTML = `
      <div class="dp2">
        <section class="dp2-hero">
          <div>
            <span class="dp2-kicker">COMMAND CENTER</span>
            <h1>AiSignalFx PRO</h1>
            <p>Terminal trading AI untuk membaca market, scanner setup, dan mapping komunitas dalam satu ekosistem.</p>

            <div class="dp2-actions">
              <button class="dp2-btn" onclick="dashboardV2Go('scanner')">Open Scanner</button>
              <button class="dp2-btn secondary" onclick="dashboardV2Go('mapping')">View Community</button>
            </div>
          </div>

          <div class="dp2-bias">
            <small>Market Bias</small>
            <strong>Bullish</strong>
            <span>XAUUSD session view</span>
            <div class="dp2-meter"><i></i></div>
          </div>
        </section>

        <section class="dp2-main">
          <article class="dp2-card">
            <div class="dp2-head">
              <div><span class="dp2-live"></span><strong>Active Signal Preview</strong></div>
              <button class="dp2-small-btn" onclick="dashboardV2Go('scanner')">Scanner</button>
            </div>

            <div class="dp2-row">
              <div class="dp2-signal-title">
                <h2>XAUUSD</h2>
                <span class="dp2-badge">BUY</span>
              </div>
              <div class="dp2-confidence">
                <small>Confidence</small>
                <b>72%</b>
              </div>
            </div>

            <div class="dp2-chartbox">${signalChart()}</div>

            <div class="dp2-levels">
              <div><small>Entry</small><b class="blue">2345.12</b></div>
              <div><small>Stop Loss</small><b class="red">2331.20</b></div>
              <div><small>Take Profit</small><b class="green">2365.00</b></div>
            </div>

            <button class="dp2-wide-btn" onclick="dashboardV2Go('scanner')">Open Signal Scanner</button>
          </article>

          <aside class="dp2-side">
            <article class="dp2-card">
              <div class="dp2-head">
                <strong>Market Sentiment</strong>
                <span class="dp2-badge">XAUUSD</span>
              </div>
              <div class="dp2-sentiment-line">
                <span>Long <b class="green">59%</b></span>
                <span>Short <b class="red">41%</b></span>
              </div>
              <div class="dp2-bar"><i></i></div>

              <div class="dp2-session">
                <div><b>Asia</b><span>Calm</span></div>
                <div><b>London</b><span>Watch</span></div>
                <div><b>NY</b><span>Active</span></div>
              </div>
            </article>

            <article class="dp2-quick">
              <div class="dp2-head"><strong>Quick Access</strong></div>
              <div class="dp2-quick-list">
                <button onclick="dashboardV2Go('scanner')">Signal Scanner</button>
                <button onclick="dashboardV2Go('mapping')">Sentinel Community</button>
                <button onclick="dashboardV2Go('lab')">Trading Lab</button>
                <button onclick="dashboardV2Go('vip')">VIP Access</button>
              </div>
            </article>
          </aside>
        </section>

        <section class="dp2-spotlight">
          <div>
            <div class="dp2-head">
              <strong>Sentinel Mapping Spotlight</strong>
              <button class="dp2-small-btn" onclick="dashboardV2Go('mapping')">View All</button>
            </div>

            <div class="dp2-map">
              <div class="dp2-map-thumb">${miniChart()}</div>
              <div>
                <span class="dp2-kicker">TOP MAPPER</span>
                <h3>Romadon Saputra</h3>
                <p>XAUUSD Bullish Channel. Price masih menghormati area channel dan menunggu konfirmasi candle.</p>

                <div class="dp2-meta">
                  <span>Bias: <b class="green">Bullish</b></span>
                  <span>Confidence: <b class="green">78%</b></span>
                </div>

                <div class="dp2-inline-actions">
                  <button>♡ 128</button>
                  <button>💬 24</button>
                  <button>🔖 Save</button>
                </div>
              </div>
            </div>
          </div>

          <div class="dp2-mini-maps">
            <div><b>#2 BTCUSDT</b><span>Breakout watch</span></div>
            <div><b>#3 EURUSD</b><span>Range reaction</span></div>
          </div>
        </section>

        <section class="dp2-pulse">
          <div class="dp2-head">
            <strong>Market Pulse</strong>
            <span class="dp2-badge">Live Watchlist</span>
          </div>

          <div class="dp2-pulse-list">
            <div><b>XAUUSD</b><span class="green">2345.12</span><em>Bullish</em></div>
            <div><b>BTCUSDT</b><span class="red">78,161.22</span><em>Bearish</em></div>
            <div><b>EURUSD</b><span class="green">1.0854</span><em>Bullish</em></div>
            <div><b>GBPUSD</b><span class="green">1.2643</span><em>Bullish</em></div>
          </div>
        </section>
      </div>
    `;
  }

  function scheduleRender() {
    setTimeout(renderDashboard, 100);
    setTimeout(renderDashboard, 700);
    setTimeout(renderDashboard, 1600);
  }

  document.addEventListener("DOMContentLoaded", scheduleRender);
  scheduleRender();

  const oldShowPage = window.showPage;
  window.showPage = function () {
    const result = oldShowPage ? oldShowPage.apply(this, arguments) : undefined;
    if (String(arguments[0]).toLowerCase() === "dashboard") setTimeout(renderDashboard, 80);
    return result;
  };

  const oldShowPageById = window.showPageById;
  window.showPageById = function () {
    const result = oldShowPageById ? oldShowPageById.apply(this, arguments) : undefined;
    if (String(arguments[0]).toLowerCase() === "dashboard") setTimeout(renderDashboard, 80);
    return result;
  };
})();
