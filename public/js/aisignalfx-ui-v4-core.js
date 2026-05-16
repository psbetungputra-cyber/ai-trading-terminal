/* AiSignalFx PRO - Superpower UI V4 Core
   Major responsive UI shell + page redesign.
   Safe strategy: keeps old engine/data, overrides visual pages only.
   Includes: Dashboard V4, Scanner V4, Sentinel Signal Desk, Community V4, Trading Lab V4,
   mobile bottom nav, custom SVG chart system.
*/
(function () {
  "use strict";

  const V4 = {
    version: "4.0.0-superpower",
    activePair: "XAUUSD",
    activeMarket: "all",
    activeCommunityTab: "latest",
    communityPair: "all",
    communityBias: "all"
  };

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (m) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m];
    });
  }

  function norm(value) {
    return String(value || "").trim().toLowerCase();
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function go(page) {
    const id = String(page || "").trim();
    if (!id) return;

    if (typeof window.showPageById === "function") {
      window.showPageById(id);
    } else if (typeof window.showPage === "function") {
      window.showPage(id);
    } else {
      $all(".page").forEach((p) => p.classList.remove("active"));
      document.getElementById(id)?.classList.add("active");
    }

    updateBottomNav(id);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 60);
  }

  window.AiSignalFxV4 = V4;
  window.v4Go = go;
  window.dashboardV4Go = go;

  function ensurePage(id, title) {
    let page = document.getElementById(id);
    if (page) return page;

    page = document.createElement("section");
    page.id = id;
    page.className = "page";
    page.dataset.v4Created = "true";
    page.innerHTML = `
      <div class="v4-page-placeholder">
        <h2>${esc(title || id)}</h2>
        <p>AiSignalFx PRO V4 module.</p>
      </div>
    `;

    const main = document.querySelector("main") || document.querySelector(".main-content") || document.body;
    main.appendChild(page);
    return page;
  }

  function pairUniverse() {
    const crypto = [
      { symbol: "BTCUSDT", market: "crypto", price: 78161.22, change: -1.07, bias: "SELL", confidence: 73, risk: "Medium", setup: "Liquidity sweep", tf: "15M" },
      { symbol: "ETHUSDT", market: "crypto", price: 2179.01, change: -1.85, bias: "WAIT", confidence: 62, risk: "Medium", setup: "Retest area", tf: "30M" },
      { symbol: "BNBUSDT", market: "crypto", price: 652.62, change: -0.74, bias: "WAIT", confidence: 58, risk: "Low", setup: "Range", tf: "1H" },
      { symbol: "SOLUSDT", market: "crypto", price: 86.20, change: -2.30, bias: "SELL", confidence: 70, risk: "Medium", setup: "Breakdown", tf: "15M" },
      { symbol: "XRPUSDT", market: "crypto", price: 1.4103, change: -1.24, bias: "WAIT", confidence: 54, risk: "Low", setup: "Compression", tf: "1H" }
    ];

    const forex = [
      { symbol: "XAUUSD", market: "gold", price: 2345.12, change: 0.64, bias: "BUY", confidence: 72, risk: "Medium", setup: "Bullish channel", tf: "15M" },
      { symbol: "EURUSD", market: "forex", price: 1.0854, change: 0.12, bias: "BUY", confidence: 68, risk: "Low", setup: "Trend continuation", tf: "30M" },
      { symbol: "GBPUSD", market: "forex", price: 1.2643, change: 0.29, bias: "BUY", confidence: 66, risk: "Medium", setup: "Demand retest", tf: "1H" },
      { symbol: "USDJPY", market: "forex", price: 156.23, change: -0.28, bias: "SELL", confidence: 61, risk: "Medium", setup: "Supply reaction", tf: "30M" },
      { symbol: "GBPJPY", market: "forex", price: 199.45, change: 0.08, bias: "WAIT", confidence: 55, risk: "High", setup: "News caution", tf: "1H" }
    ];

    const live = [];
    try {
      if (Array.isArray(window.cryptoCards)) live.push(...window.cryptoCards);
      if (Array.isArray(window.cryptoData)) live.push(...window.cryptoData);
    } catch (e) {}

    if (!live.length) return [...forex, ...crypto];

    const mapped = live.slice(0, 8).map((x) => {
      const change = Number(x.change ?? x.priceChangePercent ?? 0);
      return {
        symbol: x.symbol || x.pair || "BTCUSDT",
        market: "crypto",
        price: Number(x.price || x.lastPrice || x.value || 0) || x.price || "-",
        change,
        bias: change > 0 ? "BUY" : change < 0 ? "SELL" : "WAIT",
        confidence: change === 0 ? 52 : clamp(Math.round(58 + Math.abs(change) * 5), 58, 88),
        risk: Math.abs(change) > 3 ? "High" : "Medium",
        setup: change > 0 ? "Momentum continuation" : "Pullback reaction",
        tf: "15M"
      };
    });

    return [...forex, ...mapped];
  }

  function selectedPairData() {
    return pairUniverse().find((x) => x.symbol === V4.activePair) || pairUniverse()[0];
  }

  function formatPrice(v) {
    if (typeof v === "number") {
      return v.toLocaleString("en-US", { maximumFractionDigits: v > 100 ? 2 : 5 });
    }
    return String(v);
  }

  function customSignalChart(opts = {}) {
    const bias = String(opts.bias || "BUY").toUpperCase();
    const bullish = bias !== "SELL";
    const lineColorA = bullish ? "#2563eb" : "#f97316";
    const lineColorB = bullish ? "#22d3ee" : "#ef4444";
    const points = bullish
      ? "30,220 70,205 110,215 150,180 190,195 230,160 270,170 310,135 350,145 390,115 430,125 470,88 510,105 550,82 590,70 630,78 670,58 720,62"
      : "30,80 70,98 110,88 150,120 190,110 230,140 270,132 310,166 350,150 390,182 430,172 470,205 510,195 550,224 590,216 630,238 670,230 720,242";

    const lastY = bullish ? 62 : 242;

    return `
      <svg class="v4-chart" viewBox="0 0 760 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="v4Line${bias}" x1="0" x2="1">
            <stop offset="0%" stop-color="${lineColorA}"/>
            <stop offset="100%" stop-color="${lineColorB}"/>
          </linearGradient>
          <linearGradient id="v4Area${bias}" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="${lineColorA}" stop-opacity=".24"/>
            <stop offset="100%" stop-color="${lineColorA}" stop-opacity="0"/>
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

        <path class="area" d="M${points.replace(/ /g, " L")} L720 300 L30 300 Z" fill="url(#v4Area${bias})"/>
        <polyline class="line" points="${points}" stroke="url(#v4Line${bias})"/>
        <circle cx="720" cy="${lastY}" r="7" class="dot"/>
      </svg>
    `;
  }

  function miniChart() {
    return `
      <svg class="v4-mini-chart" viewBox="0 0 360 210" preserveAspectRatio="none">
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

  function communityPosts() {
    try {
      if (typeof window.communityLatestPosts === "function") return window.communityLatestPosts();
      if (Array.isArray(window.demoCommunityPosts)) return window.demoCommunityPosts;
    } catch (e) {}
    return [
      { id: "demo-1", user: "Romadon Saputra", pair: "XAUUSD", bias: "BUY", title: "XAUUSD Bullish Channel", caption: "Price menghormati channel support, tunggu candle validasi.", likes: 128, comments: 24, image: "" },
      { id: "demo-2", user: "Crypto SMC", pair: "BTCUSDT", bias: "SELL", title: "BTCUSDT Liquidity Sweep", caption: "Sweep high lalu reject, tunggu retest.", likes: 84, comments: 12, image: "" }
    ];
  }

  function postCard(post, mini = false) {
    const pair = esc(post.pair || "XAUUSD");
    const bias = esc(post.bias || "WAIT");
    const user = esc(post.user || "Community Mapper");
    const title = esc(post.title || `${pair} Mapping`);
    const caption = esc(post.caption || "Mapping idea.");
    const likes = Number(post.likes || 0).toLocaleString("id-ID");
    const comments = Number(post.comments || 0).toLocaleString("id-ID");
    const img = post.image ? `<img src="${esc(post.image)}" alt="${pair} mapping" loading="lazy">` : miniChart();

    return `
      <article class="v4-post-card ${mini ? "mini" : ""}">
        <div class="v4-post-media">${img}</div>
        <div class="v4-post-body">
          <div class="v4-post-top">
            <div>
              <h3>${title}</h3>
              <p>${user} • ${pair} • ${bias}</p>
            </div>
            <button class="v4-follow" type="button" onclick="this.classList.toggle('active');this.textContent=this.classList.contains('active')?'Following':'Follow';">Follow</button>
          </div>
          <p class="v4-post-caption">${caption}</p>
          <div class="v4-post-actions">
            <button type="button" onclick="this.classList.toggle('active')">♡ <span>${likes}</span></button>
            <button type="button" onclick="this.closest('.v4-post-card').querySelector('.v4-comment').classList.toggle('show')">💬 <span>${comments}</span></button>
            <button type="button" onclick="this.classList.toggle('active')">🔖 Save</button>
          </div>
          <div class="v4-comment">
            <input placeholder="Tulis komentar lalu Enter...">
          </div>
        </div>
      </article>
    `;
  }

  function renderDashboard() {
    const dash = document.getElementById("dashboard");
    if (!dash) return;

    const pair = selectedPairData();
    const posts = communityPosts();
    const spotlight = posts.find((p) => p.image) || posts[0] || {};
    const rows = pairUniverse().slice(0, 5);

    dash.innerHTML = `
      <div class="v4-shell-page v4-dashboard">
        <section class="v4-hero">
          <div>
            <span class="v4-kicker">COMMAND CENTER</span>
            <h1>AiSignalFx PRO</h1>
            <p>Terminal trading AI untuk membaca market, scanner setup, dan mapping komunitas dalam satu ekosistem.</p>
            <div class="v4-actions">
              <button class="v4-btn" onclick="v4Go('scanner')">Open Scanner</button>
              <button class="v4-btn secondary" onclick="v4Go('sentinel-signal')">Sentinel Signal</button>
              <button class="v4-btn ghost" onclick="v4Go('mapping')">Community</button>
            </div>
          </div>
          <div class="v4-bias-box">
            <small>Market Bias</small>
            <strong>Bullish</strong>
            <span>XAUUSD session view</span>
            <div class="v4-meter"><i style="width:72%"></i></div>
          </div>
        </section>

        <section class="v4-dashboard-grid">
          <article class="v4-card v4-active-signal">
            <div class="v4-card-head">
              <div><span class="v4-dot"></span><strong>Active Signal Preview</strong></div>
              <button class="v4-chip-btn" onclick="v4Go('scanner')">Scanner</button>
            </div>

            <div class="v4-signal-row">
              <div>
                <h2>${esc(pair.symbol || "XAUUSD")}</h2>
                <span class="v4-badge ${norm(pair.bias)}">${esc(pair.bias || "BUY")}</span>
              </div>
              <div class="v4-confidence"><small>Confidence</small><b>${Number(pair.confidence || 72)}%</b></div>
            </div>

            <div class="v4-chart-wrap">${customSignalChart({ bias: pair.bias || "BUY" })}</div>

            <div class="v4-levels">
              <div><small>Entry</small><b class="blue">2345.12</b></div>
              <div><small>Stop Loss</small><b class="red">2331.20</b></div>
              <div><small>Take Profit</small><b class="green">2365.00</b></div>
            </div>

            <button class="v4-wide-btn" onclick="v4Go('scanner')">Open Signal Scanner</button>
          </article>

          <aside class="v4-side-stack">
            <article class="v4-card">
              <div class="v4-card-head">
                <strong>Market Sentiment</strong>
                <span class="v4-pill">XAUUSD</span>
              </div>
              <div class="v4-sentiment-line"><span>Long <b class="green">59%</b></span><span>Short <b class="red">41%</b></span></div>
              <div class="v4-bar"><i></i></div>
              <div class="v4-session-strip">
                <div><b>Asia</b><span>Calm</span></div>
                <div><b>London</b><span>Watch</span></div>
                <div><b>NY</b><span>Active</span></div>
              </div>
            </article>

            <article class="v4-card v4-quick">
              <div class="v4-card-head"><strong>Quick Access</strong></div>
              <button onclick="v4Go('scanner')">Signal Scanner</button>
              <button onclick="v4Go('sentinel-signal')">Sentinel Signal Desk</button>
              <button onclick="v4Go('mapping')">Sentinel Community</button>
              <button onclick="v4Go('lab')">Trading Lab</button>
            </article>
          </aside>
        </section>

        <section class="v4-spotlight">
          <div>
            <div class="v4-card-head">
              <strong>Sentinel Mapping Spotlight</strong>
              <button class="v4-chip-btn" onclick="v4Go('mapping')">View All</button>
            </div>
            ${postCard(spotlight, true)}
          </div>
          <div class="v4-mini-rank">
            <div><b>#2 BTCUSDT</b><span>Breakout watch</span></div>
            <div><b>#3 EURUSD</b><span>Range reaction</span></div>
          </div>
        </section>

        <section class="v4-card v4-pulse">
          <div class="v4-card-head">
            <strong>Market Pulse</strong>
            <span class="v4-pill">Live Watchlist</span>
          </div>
          <div class="v4-pulse-list">
            ${rows.map((x) => `
              <div>
                <b>${esc(x.symbol)}</b>
                <span class="${Number(x.change) >= 0 ? "green" : "red"}">${esc(formatPrice(x.price))}</span>
                <em>${esc(x.bias === "SELL" ? "Bearish" : x.bias === "BUY" ? "Bullish" : "Wait")}</em>
              </div>
            `).join("")}
          </div>
        </section>
      </div>
    `;
  }

  function renderScanner() {
    const page = ensurePage("scanner", "Signal Scanner");
    const pairs = pairUniverse();
    let rows = pairs;
    if (V4.activeMarket !== "all") rows = pairs.filter((x) => x.market === V4.activeMarket);
    const active = selectedPairData();

    page.innerHTML = `
      <div class="v4-shell-page v4-scanner">
        <section class="v4-page-head">
          <div>
            <span class="v4-kicker">SIGNAL SCANNER</span>
            <h1>Market Scanner</h1>
            <p>Scan crypto live dan forex/gold reference mode dengan custom chart aktif.</p>
          </div>
          <button class="v4-btn" onclick="v4Go('sentinel-signal')">Open Sentinel Signal</button>
        </section>

        <div class="v4-filter-row">
          ${["all", "crypto", "forex", "gold"].map((m) => `<button class="${V4.activeMarket === m ? "active" : ""}" onclick="AiSignalFxV4.activeMarket='${m}';AiSignalFxV4.renderScanner();">${m === "all" ? "All" : m.toUpperCase()}</button>`).join("")}
        </div>

        <div class="v4-pair-strip">
          ${rows.map((x) => `<button class="${V4.activePair === x.symbol ? "active" : ""}" onclick="AiSignalFxV4.activePair='${esc(x.symbol)}';AiSignalFxV4.renderScanner();">${esc(x.symbol)}</button>`).join("")}
        </div>

        <section class="v4-scanner-grid">
          <article class="v4-card">
            <div class="v4-card-head">
              <div><span class="v4-dot"></span><strong>${esc(active.symbol)} Focus</strong></div>
              <span class="v4-pill">${esc(active.market)}</span>
            </div>

            <div class="v4-signal-row">
              <div>
                <h2>${esc(active.symbol)}</h2>
                <span class="v4-badge ${norm(active.bias)}">${esc(active.bias)}</span>
              </div>
              <div class="v4-confidence"><small>Confidence</small><b>${Number(active.confidence)}%</b></div>
            </div>

            <div class="v4-chart-wrap">${customSignalChart({ bias: active.bias })}</div>

            <div class="v4-info-grid">
              <div><small>Trend</small><b>${active.bias === "SELL" ? "Bearish" : active.bias === "BUY" ? "Bullish" : "Neutral"}</b></div>
              <div><small>Risk</small><b>${esc(active.risk)}</b></div>
              <div><small>Setup</small><b>${esc(active.setup)}</b></div>
              <div><small>Timeframe</small><b>${esc(active.tf)}</b></div>
            </div>

            <p class="v4-reason">Reason: ${esc(active.setup)} dengan momentum ${active.bias === "SELL" ? "melemah" : active.bias === "BUY" ? "positif" : "belum valid"}. Tunggu konfirmasi candle sebelum entry.</p>
          </article>

          <aside class="v4-card v4-scanner-list">
            <div class="v4-card-head"><strong>Scanner Summary</strong></div>
            ${rows.slice(0, 8).map((x) => `
              <button onclick="AiSignalFxV4.activePair='${esc(x.symbol)}';AiSignalFxV4.renderScanner();" class="${V4.activePair === x.symbol ? "active" : ""}">
                <span><b>${esc(x.symbol)}</b><small>${esc(x.setup)}</small></span>
                <em class="${norm(x.bias)}">${esc(x.bias)}</em>
                <strong>${Number(x.confidence)}%</strong>
              </button>
            `).join("")}
          </aside>
        </section>
      </div>
    `;
  }

  function renderSentinelSignal() {
    const page = ensurePage("sentinel-signal", "Sentinel Signal");
    const active = selectedPairData();

    page.innerHTML = `
      <div class="v4-shell-page v4-signal-desk">
        <section class="v4-page-head">
          <div>
            <span class="v4-kicker">OFFICIAL SIGNAL DESK</span>
            <h1>Sentinel Signal</h1>
            <p>Setup resmi pilihan dari scanner dan admin signal desk.</p>
          </div>
          <span class="v4-status-pill">Waiting Confirmation</span>
        </section>

        <section class="v4-signal-desk-grid">
          <article class="v4-card">
            <div class="v4-card-head">
              <strong>${esc(active.symbol)} Official Setup</strong>
              <span class="v4-badge ${norm(active.bias)}">${esc(active.bias)}</span>
            </div>

            <div class="v4-chart-wrap">${customSignalChart({ bias: active.bias })}</div>

            <div class="v4-levels">
              <div><small>Entry Zone</small><b class="blue">2345.12</b></div>
              <div><small>Stop Loss</small><b class="red">2331.20</b></div>
              <div><small>TP 1</small><b class="green">2352.00</b></div>
              <div><small>TP 2</small><b class="green">2365.00</b></div>
            </div>
          </article>

          <aside class="v4-card">
            <div class="v4-card-head"><strong>Signal Detail</strong></div>
            <div class="v4-detail-list">
              <div><span>Status</span><b>Waiting Confirmation</b></div>
              <div><span>Confidence</span><b class="green">${Number(active.confidence)}%</b></div>
              <div><span>Risk</span><b>${esc(active.risk)}</b></div>
              <div><span>Session</span><b>London / NY</b></div>
              <div><span>Strategy</span><b>SMC + Liquidity</b></div>
            </div>
            <p class="v4-reason">Reason: liquidity sweep, validasi struktur kecil, dan reaksi pada area premium/discount. Tunggu candle konfirmasi, hindari entry saat news high impact.</p>
            <button class="v4-wide-btn" onclick="v4Go('scanner')">Compare with Scanner</button>
          </aside>
        </section>
      </div>
    `;
  }

  function renderCommunity() {
    const page = ensurePage("mapping", "Sentinel Community");
    const posts = communityPosts();

    const filtered = posts.filter((p) => {
      const pairOk = V4.communityPair === "all" || norm(p.pair) === norm(V4.communityPair);
      const biasOk = V4.communityBias === "all" || norm(p.bias) === norm(V4.communityBias);
      return pairOk && biasOk;
    });

    page.innerHTML = `
      <div class="v4-shell-page v4-community">
        <section class="v4-page-head">
          <div>
            <span class="v4-kicker">SENTINEL COMMUNITY</span>
            <h1>Mapping Feed</h1>
            <p>Upload chart, follow mapper, like, comment, save, dan lihat top mapper.</p>
          </div>
          <button class="v4-btn" onclick="document.getElementById('v4-upload-panel')?.classList.toggle('show')">Upload Mapping</button>
        </section>

        <section id="v4-upload-panel" class="v4-card v4-upload-panel">
          <div class="v4-card-head"><strong>Upload Mapping</strong><span class="v4-pill">Cloudinary/Firebase ready</span></div>
          <div class="v4-upload-grid">
            <input id="mapping-pair" placeholder="Pair, contoh XAUUSD / BTCUSDT">
            <input id="mapping-bias" placeholder="Bias, contoh BUY / SELL / WAIT">
            <input id="mapping-title" placeholder="Judul mapping">
            <input id="mapping-file" type="file" accept="image/*">
            <textarea id="mapping-caption" placeholder="Tulis caption, area penting, dan alasan mapping..."></textarea>
          </div>
          <button class="v4-wide-btn" onclick="if(typeof submitMappingPost==='function'){submitMappingPost()}else{document.getElementById('mapping-upload-status').innerText='Preview mode: upload engine belum aktif.'}">Post Mapping</button>
          <p id="mapping-upload-status" class="v4-muted"></p>
        </section>

        <div class="v4-community-controls">
          <div class="v4-filter-row">
            ${["latest", "trending", "top10"].map((tab) => `<button class="${V4.activeCommunityTab === tab ? "active" : ""}" onclick="AiSignalFxV4.activeCommunityTab='${tab}';AiSignalFxV4.renderCommunity();">${tab === "top10" ? "Top 10" : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>`).join("")}
          </div>
          <div class="v4-select-row">
            <select onchange="AiSignalFxV4.communityPair=this.value;AiSignalFxV4.renderCommunity();">
              ${["all", "XAUUSD", "BTCUSDT", "ETHUSDT", "EURUSD"].map((p) => `<option value="${p}" ${V4.communityPair === p ? "selected" : ""}>${p === "all" ? "All Pair" : p}</option>`).join("")}
            </select>
            <select onchange="AiSignalFxV4.communityBias=this.value;AiSignalFxV4.renderCommunity();">
              ${["all", "BUY", "SELL", "WAIT"].map((b) => `<option value="${b}" ${V4.communityBias === b ? "selected" : ""}>${b === "all" ? "All Bias" : b}</option>`).join("")}
            </select>
          </div>
        </div>

        <section class="v4-feed">
          ${filtered.map((post) => postCard(post)).join("") || `<div class="v4-card"><p class="v4-muted">Belum ada mapping untuk filter ini.</p></div>`}
        </section>
      </div>
    `;
  }

  function renderLab() {
    const page = ensurePage("lab", "Sentinel Trading Lab");
    page.innerHTML = `
      <div class="v4-shell-page v4-lab">
        <section class="v4-page-head">
          <div>
            <span class="v4-kicker">SENTINEL TRADING LAB</span>
            <h1>Education & Journal Hub</h1>
            <p>Belajar SMC, news impact, risk management, dan simpan jurnal trading.</p>
          </div>
        </section>

        <section class="v4-module-grid">
          ${[
            ["Journal Trading", "Catat entry, emosi, setup, dan hasil trade."],
            ["Risk Calculator", "Hitung lot, risk, SL, dan target dengan disiplin."],
            ["SMC Academy", "BOS, CHoCH, OB, FVG, liquidity, dan structure."],
            ["News Learning", "Belajar actual vs forecast, CPI, NFP, FOMC."],
            ["Trade Report", "Ringkasan performa dan evaluasi mingguan."],
            ["Economic Calendar", "Pantau high impact event tanpa memenuhi dashboard."]
          ].map((m) => `
            <article class="v4-card v4-module-card">
              <h3>${m[0]}</h3>
              <p>${m[1]}</p>
              <button class="v4-chip-btn">Open</button>
            </article>
          `).join("")}
        </section>
      </div>
    `;
  }

  function updateBottomNav(activeId) {
    $all(".v4-bottom-nav button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.page === activeId);
    });
  }

  function ensureBottomNav() {
    if ($(".v4-bottom-nav")) return;

    const nav = document.createElement("nav");
    nav.className = "v4-bottom-nav";
    nav.innerHTML = `
      <button data-page="dashboard" class="active" onclick="v4Go('dashboard')"><span>⌂</span><b>Home</b></button>
      <button data-page="scanner" onclick="v4Go('scanner')"><span>⌕</span><b>Scanner</b></button>
      <button data-page="mapping" onclick="v4Go('mapping')"><span>◎</span><b>Community</b></button>
      <button data-page="profile" onclick="v4Go('profile')"><span>♙</span><b>Profile</b></button>
    `;
    document.body.appendChild(nav);
  }

  function bindCommentEnter() {
    if (window.__v4CommentEnterBound) return;
    window.__v4CommentEnterBound = true;

    document.addEventListener("keydown", function (e) {
      const input = e.target.closest(".v4-comment input");
      if (!input || e.key !== "Enter") return;
      e.preventDefault();

      const value = input.value.trim();
      if (!value) return;

      const box = input.closest(".v4-comment");
      box.insertAdjacentHTML("beforeend", `<p><b>You:</b> ${esc(value)}</p>`);
      input.value = "";
    });
  }

  function boot() {
    ensureBottomNav();
    ensurePage("sentinel-signal", "Sentinel Signal");
    renderDashboard();

    V4.renderDashboard = renderDashboard;
    V4.renderScanner = renderScanner;
    V4.renderSentinelSignal = renderSentinelSignal;
    V4.renderCommunity = renderCommunity;
    V4.renderLab = renderLab;
    V4.customSignalChart = customSignalChart;

    bindCommentEnter();

    const current = document.querySelector(".page.active")?.id || "dashboard";
    updateBottomNav(current);

    if (document.getElementById("scanner")?.classList.contains("active")) renderScanner();
    if (document.getElementById("sentinel-signal")?.classList.contains("active")) renderSentinelSignal();
    if (document.getElementById("mapping")?.classList.contains("active")) renderCommunity();
    if (document.getElementById("lab")?.classList.contains("active")) renderLab();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  setTimeout(boot, 500);
  setTimeout(boot, 1600);

  const oldShowPage = window.showPage;
  window.showPage = function () {
    const result = oldShowPage ? oldShowPage.apply(this, arguments) : undefined;
    const id = String(arguments[0] || "").toLowerCase();
    setTimeout(() => {
      updateBottomNav(id);
      if (id === "dashboard") renderDashboard();
      if (id === "scanner") renderScanner();
      if (id === "sentinel-signal") renderSentinelSignal();
      if (id === "mapping") renderCommunity();
      if (id === "lab") renderLab();
    }, 80);
    return result;
  };

  const oldShowPageById = window.showPageById;
  window.showPageById = function () {
    const result = oldShowPageById ? oldShowPageById.apply(this, arguments) : undefined;
    const id = String(arguments[0] || "").toLowerCase();
    setTimeout(() => {
      updateBottomNav(id);
      if (id === "dashboard") renderDashboard();
      if (id === "scanner") renderScanner();
      if (id === "sentinel-signal") renderSentinelSignal();
      if (id === "mapping") renderCommunity();
      if (id === "lab") renderLab();
    }, 80);
    return result;
  };
})();
