/* AiSignalFx PRO - Dashboard Visual Compact Layer */
(function(){
  function byTitle(text){
    return Array.from(document.querySelectorAll(".card")).find(card => {
      const h = card.querySelector("h3,h2");
      return h && h.textContent.trim().toLowerCase().includes(text.toLowerCase());
    });
  }

  function miniLine(className = ""){
    return `
      <div class="dash-mini-chart ${className}">
        <svg viewBox="0 0 300 90" preserveAspectRatio="none">
          <path class="dash-grid-line" d="M0 65 H300 M0 42 H300 M0 20 H300"></path>
          <path class="dash-line" d="M0 70 L40 63 L80 66 L120 44 L160 50 L200 28 L240 35 L300 22"></path>
          <path class="dash-fill" d="M0 70 L40 63 L80 66 L120 44 L160 50 L200 28 L240 35 L300 22 L300 90 L0 90 Z"></path>
        </svg>
      </div>
    `;
  }

  function enhanceActiveSignal(){
    const card = byTitle("Active Signal Preview");
    if (!card || card.dataset.compactReady === "1") return;
    card.dataset.compactReady = "1";
    card.classList.add("dashboard-visual-card");

    card.insertAdjacentHTML("beforeend", `
      <div class="dash-signal-visual">
        <div>
          <span class="dash-kicker">Scanner V2.1 Layer</span>
          <h4>XAUUSD / BTCUSDT Watchlist</h4>
          <p>Valid setup hanya muncul saat trend, macro, momentum, dan risk selaras.</p>
        </div>
        ${miniLine("blue")}
      </div>

      <div class="dash-chip-row">
        <span>WAIT CONFIRMATION</span>
        <span>Risk Filter Active</span>
        <span>Educational Analysis</span>
      </div>
    `);
  }

  function enhanceSentiment(){
    const card = byTitle("Market Sentiment");
    if (!card || card.dataset.compactReady === "1") return;
    card.dataset.compactReady = "1";
    card.classList.add("dashboard-visual-card");

    card.insertAdjacentHTML("beforeend", `
      <div class="dash-sentiment-box">
        <div class="dash-meter-label">
          <span>Long 58%</span>
          <span>Short 42%</span>
        </div>
        <div class="dash-meter"><i style="width:58%"></i></div>
        <div class="dash-session-grid">
          <div><b>Asia</b><small>Calm</small></div>
          <div><b>London</b><small>Watch</small></div>
          <div><b>NY</b><small>Active</small></div>
        </div>
      </div>
    `);
  }

  function enhanceTopMapper(){
    const card = document.querySelector(".community-spotlight-card");
    if (!card || card.dataset.compactReady === "1") return;
    card.dataset.compactReady = "1";
    card.classList.add("dashboard-visual-card");

    const feature = card.querySelector(".top-mapper-feature");
    if (feature && !feature.querySelector(".dash-mini-chart")) {
      feature.insertAdjacentHTML("beforeend", `
        ${miniLine("cyan")}
        <div class="dash-chip-row">
          <span>Top Mapper</span>
          <span>8.4K Likes</span>
          <span>34 Posts</span>
        </div>
      `);
    }
  }

  function enhanceCryptoPulse(){
    const card = byTitle("Crypto Market Pulse");
    if (!card || card.dataset.compactReady === "1") return;
    card.dataset.compactReady = "1";
    card.classList.add("dashboard-visual-card");

    const box = document.getElementById("crypto-market-preview");
    if (box && !box.querySelector(".dash-pulse-head")) {
      box.insertAdjacentHTML("beforebegin", `
        <div class="dash-pulse-head">
          <span>Real Crypto Feed</span>
          <b>Binance Public API</b>
        </div>
      `);
    }
  }

  function enhanceFyp(){
    const card = document.querySelector(".dashboard-fyp");
    if (!card || card.dataset.compactReady === "1") return;
    card.dataset.compactReady = "1";
    card.classList.add("dashboard-visual-card");
  }

  function run(){
    enhanceActiveSignal();
    enhanceSentiment();
    enhanceTopMapper();
    enhanceCryptoPulse();
    enhanceFyp();
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(run, 500);
    setTimeout(run, 1600);
    setTimeout(run, 3200);
  });

  window.enhanceDashboardCompact = run;
})();
