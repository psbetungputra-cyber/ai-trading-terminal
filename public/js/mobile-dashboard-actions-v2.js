/* AiSignalFx PRO - Mobile Dashboard Quick Actions V2 Stable */
(function () {
  const STYLE_ID = "mobile-dashboard-actions-v2-style";

  function isMobile() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function go(page) {
    if (typeof window.v4Go === "function") return window.v4Go(page);
    if (typeof window.showPageById === "function") return window.showPageById(page);
    if (typeof window.showPage === "function") return window.showPage(page);
  }

  window.mobileDashGo = go;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width: 760px) {
        #dashboard .mphoto {
          padding-left: 8px !important;
          padding-right: 8px !important;
          overflow-x: hidden !important;
        }

        #dashboard .m-card {
          width: 100% !important;
          max-width: calc(100vw - 16px) !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }

        #dashboard .m-signal {
          padding: 14px !important;
        }

        #dashboard .m-signal-body {
          grid-template-columns: .78fr 1.22fr !important;
          gap: 10px !important;
        }

        #dashboard .m-price {
          padding-right: 8px !important;
        }

        #dashboard .m-chartbox {
          min-width: 0 !important;
        }

        #dashboard .m-quick-mini {
          padding: 12px;
          display: grid;
          gap: 10px;
        }

        #dashboard .m-quick-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        #dashboard .m-quick-title h3 {
          margin: 0;
          color: #fff;
          font-size: 15px;
          font-weight: 900;
        }

        #dashboard .m-quick-title span {
          color: #60a5fa;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        #dashboard .m-quick-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        #dashboard .m-quick-buttons button {
          border: 1px solid rgba(96, 165, 250, .22);
          background: rgba(8, 17, 31, .92);
          color: #bfdbfe;
          border-radius: 14px;
          padding: 11px 6px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        #dashboard .m-mini-pulse {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        #dashboard .m-pulse-chip {
          background: rgba(2, 6, 23, .55);
          border: 1px solid rgba(148, 163, 184, .12);
          border-radius: 14px;
          padding: 10px 8px;
        }

        #dashboard .m-pulse-chip b {
          display: block;
          color: #e5eefc;
          font-size: 11px;
          margin-bottom: 4px;
        }

        #dashboard .m-pulse-chip span {
          display: block;
          font-size: 12px;
          font-weight: 900;
        }

        #dashboard .m-pulse-chip .green { color: #4ade80; }
        #dashboard .m-pulse-chip .red { color: #f87171; }
      }
    `;
    document.head.appendChild(style);
  }

  function mount() {
    if (!isMobile()) return;

    const dash = document.getElementById("dashboard");
    if (!dash || !dash.classList.contains("active")) return;

    const explore = dash.querySelector(".m-explore");
    if (!explore) return;

    injectStyle();

    if (dash.querySelector(".m-quick-mini")) return;

    explore.insertAdjacentHTML("afterend", `
      <section class="m-card m-quick-mini">
        <div class="m-quick-title">
          <h3>Quick Access</h3>
          <span>Market Pulse</span>
        </div>

        <div class="m-quick-buttons">
          <button type="button" onclick="mobileDashGo('sentinel-signal')">Sentinel</button>
          <button type="button" onclick="mobileDashGo('mapping')">Community</button>
          <button type="button" onclick="mobileDashGo('lab')">Trading Lab</button>
        </div>

        <div class="m-mini-pulse">
          <div class="m-pulse-chip">
            <b>XAUUSD</b>
            <span class="green">2345.12</span>
          </div>
          <div class="m-pulse-chip">
            <b>BTCUSDT</b>
            <span class="red">67120</span>
          </div>
          <div class="m-pulse-chip">
            <b>EURUSD</b>
            <span class="green">1.0854</span>
          </div>
        </div>
      </section>
    `);
  }

  function schedule() {
    setTimeout(mount, 100);
    setTimeout(mount, 500);
    setTimeout(mount, 1200);
    setTimeout(mount, 2500);
    setTimeout(mount, 4200);
  }

  function watch() {
    const dash = document.getElementById("dashboard");
    if (!dash || dash.dataset.quickV2Observer === "ready") return;

    dash.dataset.quickV2Observer = "ready";

    const observer = new MutationObserver(function () {
      if (!isMobile()) return;
      if (!dash.classList.contains("active")) return;
      setTimeout(mount, 120);
    });

    observer.observe(dash, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    schedule();
    watch();
    setTimeout(watch, 800);
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
