/* AiSignalFx PRO - Premium Dashboard V3
   Drop-in dashboard redesign.
   Safe: only overrides #dashboard content.
   Chart is custom SVG, no TradingView dependency.
*/
(function () {
  const VERSION = "3.0.0";

  function pageGo(page) {
    const id = String(page || "").trim();
    if (!id) return;

    if (typeof window.showPageById === "function") {
      window.showPageById(id);
    } else if (typeof window.showPage === "function") {
      window.showPage(id);
    } else {
      document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
      document.getElementById(id)?.classList.add("active");
    }

    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 60);
  }

  window.AiSignalFxDashboardV3 = {
    version: VERSION,
    go: pageGo,
    rerender: renderDashboardV3
  };

  window.dashboardV3Go = pageGo;

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, function (m) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m];
    });
  }

  function getCryptoSnapshot() {
    try {
      if (Array.isArray(window.cryptoCards) && window.cryptoCards.length) return window.cryptoCards;
      if (Array.isArray(window.cryptoData) && window.cryptoData.length) return window.cryptoData;
    } catch (e) {}
    return [];
  }

  function getCommunityPosts() {
    try {
      if (typeof window.communityLatestPosts === "function") return window.communityLatestPosts();
      if (Array.isArray(window.demoCommunityPosts)) return window.demoCommunityPosts;
    } catch (e) {}
    return [];
  }

  function pickSpotlight() {
    const posts = getCommunityPosts();
    const withImage = posts.find((p) => p && p.image);
    const any = posts[0];

    return withImage || any || {
      user: "Romadon Saputra",
      pair: "XAUUSD",
      bias: "BULLISH",
      title: "XAUUSD Bullish Channel",
      caption: "Price masih menghormati area channel dan menunggu konfirmasi candle.",
      likes: 128,
      comments: 24,
      image: ""
    };
  }

  function marketRows() {
    const live = getCryptoSnapshot();
    const fallback = [
      { symbol: "XAUUSD", price: "2345.12", change: 0.64, bias: "Bullish" },
      { symbol: "BTCUSDT", price: "78,161.22", change: -1.07, bias: "Bearish" },
      { symbol: "ETHUSDT", price: "2,179.01", change: -1.85, bias: "Bearish" },
      { symbol: "EURUSD", price: "1.0854", change: 0.12, bias: "Bullish" },
      { symbol: "GBPUSD", price: "1.2643", change: 0.29, bias: "Bullish" }
    ];

    if (!live.length) return fallback;

    return live.slice(0, 5).map((x) => {
      const symbol = x.symbol || x.pair || "BTCUSDT";
      const price = x.price || x.lastPrice || x.value || "-";
      const change = Number(x.change ?? x.priceChangePercent ?? 0);
      return {
        symbol,
        price: typeof price === "number" ? price.toLocaleString("en-US", { maximumFractionDigits: 4 }) : String(price),
        change,
        bias: change >= 0 ? "Bullish" : "Bearish"
      };
    });
  }

  function signalChartSvg() {
    return `
      <svg class="v3-chart" viewBox="0 0 760 300" preserveAspectRatio="none" aria-label="Custom signal chart">
        <defs>
          <linearGradient id="v3LineGrad" x1="0" x2="1">
            <stop offset="0%" stop-color="#2563eb"/>
            <stop offset="100%" stop-color="#22d3ee"/>
          </linearGradient>
          <linearGradient id="v3AreaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#2563eb" stop-opacity=".28"/>
            <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
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

        <line class="tp" x1="30" y1="58" x2="720" y2="58"/>
        <line class="entry" x1="30" y1="150" x2="720" y2="150"/>
        <line class="sl" x1="30" y1="236" x2="720" y2="236"/>

        <text x="594" y="49" class="tpt">TP 2365.00</text>
        <text x="594" y="141" class="ent">ENTRY 2345.12</text>
        <text x="594" y="227" class="slt">SL 2331.20</text>

        <path class="area" d="M30 220 L70 205 L110 215 L150 180 L190 195 L230 160 L270 170 L310 135 L350 145 L390 115 L430 125 L470 88 L510 105 L550 82 L590 70 L630 78 L670 58 L720 62 L720 300 L30 300 Z"/>
        <polyline class="line" points="30,220 70,205 110,215 150,180 190,195 230,160 270,170 310,135 350,145 390,115 430,125 470,88 510,105 550,82 590,70 630,78 670,58 720,62"/>
        <circle cx="720" cy="62" r="7" class="dot"/>
      </svg>
    `;
  }

  function mappingMiniChartSvg() {
    return `
      <svg class="v3-mini-chart" viewBox="0 0 360 210" preserveAspectRatio="none" aria-label="Mapping chart">
        <g class="grid">
          <line x1="0" y1="52" x2="360" y2="52"/>
          <line x1="0" y1="105" x2="360" y2="105"/>
          <line x1="0" y1="157" x2="360" y2="157"/>
          <line x1="90" y1="0" x2="90" y2="210"/>
          <line x1="180" y1="0" x2="180" y2="210"/>
          <line x1="270" y1="0" x2="270" y2="210"/>
        </g>
        <path d="M22 159 L60 142 L98 148 L136 112 L175 122 L214 88 L250 96 L300 60 L338 74" fill="none" stroke="#38bdf8" stroke-width="5"/>
        <path d="M20 168 L340 80" fill="none" stroke="#2563eb" stroke-width="3"/>
        <path d="M20 132 L340 44" fill="none" stroke="#2563eb" stroke-width="2.4" opacity=".75"/>
      </svg>
    `;
  }

  function renderSpotlightImage(post) {
    const img = post.image ? String(post.image) : "";
    if (img) {
      return `<img src="${esc(img)}" alt="Mapping chart" loading="lazy">`;
    }
    return mappingMiniChartSvg();
  }

  function renderDashboardV3() {
    const dash = document.getElementById("dashboard");
    if (!dash) return;

    const post = pickSpotlight();
    const pair = esc(post.pair || "XAUUSD");
    const bias = esc((post.bias || "BULLISH").toUpperCase());
    const title = esc(post.title || `${pair} Mapping Setup`);
    const user = esc(post.user || "Romadon Saputra");
    const caption = esc(post.caption || "Price masih menghormati area channel dan menunggu konfirmasi candle.");
    const likes = Number(post.likes || 128).toLocaleString("id-ID");
    const comments = Number(post.comments || 24).toLocaleString("id-ID");

    const rows = marketRows();

    dash.classList.add("dashboard-v3-mounted");
    dash.innerHTML = `
      <div class="dashboard-v3">
        <section class="v3-hero">
          <div class="v3-hero-text">
            <span class="v3-kicker">COMMAND CENTER</span>
            <h1>AiSignalFx PRO</h1>
            <p>Terminal trading AI untuk membaca market, scanner setup, dan mapping komunitas dalam satu ekosistem.</p>
            <div class="v3-hero-actions">
              <button class="v3-btn" onclick="dashboardV3Go('scanner')">Open Scanner</button>
              <button class="v3-btn secondary" onclick="dashboardV3Go('mapping')">View Community</button>
            </div>
          </div>

          <div class="v3-bias-card">
            <small>Market Bias</small>
            <strong>Bullish</strong>
            <span>XAUUSD session view</span>
            <div class="v3-meter"><i></i></div>
          </div>
        </section>

        <section class="v3-main-grid">
          <article class="v3-card v3-signal-card">
            <div class="v3-card-head">
              <div><span class="v3-live-dot"></span><strong>Active Signal Preview</strong></div>
              <button class="v3-chip-btn" onclick="dashboardV3Go('scanner')">Scanner</button>
            </div>

            <div class="v3-signal-top">
              <div>
                <h2>XAUUSD</h2>
                <span class="v3-badge buy">BUY</span>
              </div>
              <div class="v3-confidence">
                <small>Confidence</small>
                <b>72%</b>
              </div>
            </div>

            <div class="v3-chart-wrap">
              ${signalChartSvg()}
            </div>

            <div class="v3-levels">
              <div><small>Entry</small><b class="blue">2345.12</b></div>
              <div><small>Stop Loss</small><b class="red">2331.20</b></div>
              <div><small>Take Profit</small><b class="green">2365.00</b></div>
            </div>

            <button class="v3-wide-btn" onclick="dashboardV3Go('scanner')">Open Signal Scanner</button>
          </article>

          <aside class="v3-side-stack">
            <article class="v3-card">
              <div class="v3-card-head">
                <strong>Market Sentiment</strong>
                <span class="v3-pill">XAUUSD</span>
              </div>
              <div class="v3-sentiment-line">
                <span>Long <b class="green">59%</b></span>
                <span>Short <b class="red">41%</b></span>
              </div>
              <div class="v3-bar"><i></i></div>
              <div class="v3-session-strip">
                <div><b>Asia</b><span>Calm</span></div>
                <div><b>London</b><span>Watch</span></div>
                <div><b>NY</b><span>Active</span></div>
              </div>
            </article>

            <article class="v3-quick-card">
              <div class="v3-card-head"><strong>Quick Access</strong></div>
              <div class="v3-quick-list">
                <button onclick="dashboardV3Go('scanner')">Signal Scanner</button>
                <button onclick="dashboardV3Go('mapping')">Sentinel Community</button>
                <button onclick="dashboardV3Go('lab')">Trading Lab</button>
                <button onclick="dashboardV3Go('vip')">VIP Access</button>
              </div>
            </article>
          </aside>
        </section>

        <section class="v3-spotlight">
          <div class="v3-spotlight-main">
            <div class="v3-card-head">
              <strong>Sentinel Mapping Spotlight</strong>
              <button class="v3-chip-btn" onclick="dashboardV3Go('mapping')">View All</button>
            </div>

            <div class="v3-map-feature">
              <div class="v3-map-thumb">${renderSpotlightImage(post)}</div>
              <div class="v3-map-copy">
                <span class="v3-kicker">TOP MAPPER</span>
                <h3>${user}</h3>
                <p>${title}. ${caption}</p>
                <div class="v3-meta-row">
                  <span>Pair: <b>${pair}</b></span>
                  <span>Bias: <b class="green">${bias}</b></span>
                  <span>Confidence: <b class="green">78%</b></span>
                </div>
                <div class="v3-inline-actions">
                  <button>♡ ${likes}</button>
                  <button>💬 ${comments}</button>
                  <button>🔖 Save</button>
                </div>
              </div>
            </div>
          </div>

          <div class="v3-mini-maps">
            <div><b>#2 BTCUSDT</b><span>Breakout watch</span></div>
            <div><b>#3 EURUSD</b><span>Range reaction</span></div>
          </div>
        </section>

        <section class="v3-pulse">
          <div class="v3-card-head">
            <strong>Market Pulse</strong>
            <span class="v3-pill">Live Watchlist</span>
          </div>
          <div class="v3-pulse-list">
            ${rows.map((r) => `
              <div>
                <b>${esc(r.symbol)}</b>
                <span class="${Number(r.change) >= 0 ? "green" : "red"}">${esc(r.price)}</span>
                <em>${esc(r.bias)}</em>
              </div>
            `).join("")}
          </div>
        </section>
      </div>
    `;
  }

  function boot() {
    renderDashboardV3();
    setTimeout(renderDashboardV3, 500);
    setTimeout(renderDashboardV3, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  const oldShowPage = window.showPage;
  window.showPage = function () {
    const result = oldShowPage ? oldShowPage.apply(this, arguments) : undefined;
    if (String(arguments[0]).toLowerCase() === "dashboard") setTimeout(renderDashboardV3, 80);
    return result;
  };

  const oldShowPageById = window.showPageById;
  window.showPageById = function () {
    const result = oldShowPageById ? oldShowPageById.apply(this, arguments) : undefined;
    if (String(arguments[0]).toLowerCase() === "dashboard") setTimeout(renderDashboardV3, 80);
    return result;
  };
})();
