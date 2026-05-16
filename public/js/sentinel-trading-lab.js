(function () {
  const STORAGE_KEY = "aisignalfx_lab_journal_v1";

  const labContent = {
    risk: `
      <div class="lab-upgrade-card">
        <span class="badge free">RISK DESK</span>
        <h3>Risk & Model Control</h3>
        <p class="muted">Gunakan panel ini untuk menjaga disiplin risk sebelum entry. Fokus utama: lot size, batas loss harian, risk reward, dan validasi setup.</p>

        <div class="lab-info-grid">
          <div><b>Max Risk</b><span>1% - 2% per setup</span></div>
          <div><b>Daily Stop</b><span>2 - 3 loss beruntun</span></div>
          <div><b>Minimum RR</b><span>1:2 ideal</span></div>
          <div><b>Entry Rule</b><span>Tunggu konfirmasi candle</span></div>
        </div>

        <p class="muted">Catatan: risk model ini edukasi. Nanti bisa kita upgrade jadi kalkulator lot size otomatis.</p>
      </div>
    `,
    academy: `
      <div class="lab-upgrade-card">
        <span class="badge free">SMC ACADEMY</span>
        <h3>Smart Money Concept Module</h3>
        <div class="lab-module-list">
          <div><b>Market Structure</b><span>HH, HL, LH, LL, BOS, dan CHoCH.</span></div>
          <div><b>Order Block</b><span>Area reaksi institusional setelah displacement.</span></div>
          <div><b>Liquidity</b><span>Equal high/low, inducement, sweep, dan stop hunt.</span></div>
          <div><b>Entry Model</b><span>Mapping H4/M30, eksekusi M15/M5/M1.</span></div>
        </div>
      </div>
    `,
    library: `
      <div class="lab-upgrade-card">
        <span class="badge free">TECHNICAL LIBRARY</span>
        <h3>Technical Library</h3>
        <div class="lab-module-list">
          <div><b>Trend Reading</b><span>Baca arah utama sebelum cari entry.</span></div>
          <div><b>Support & Resistance</b><span>Gunakan sebagai area reaksi, bukan entry buta.</span></div>
          <div><b>Break & Retest</b><span>Tunggu retest dan candle valid.</span></div>
          <div><b>Session Timing</b><span>London dan New York biasanya lebih aktif.</span></div>
        </div>
      </div>
    `,
    newslearn: `
      <div class="lab-upgrade-card">
        <span class="badge free">NEWS LEARNING</span>
        <h3>Fundamental News Learning</h3>
        <div class="lab-module-list">
          <div><b>Actual vs Forecast</b><span>Actual lebih besar/kecil dari forecast bisa menggerakkan currency.</span></div>
          <div><b>High Impact News</b><span>CPI, NFP, FOMC, Interest Rate, GDP, dan Jobless Claims.</span></div>
          <div><b>Safe Rule</b><span>Hindari entry mepet news besar. Tunggu spread normal dan arah jelas.</span></div>
          <div><b>Pair Impact</b><span>USD news berdampak besar ke XAUUSD, EURUSD, GBPUSD, USDJPY, dan index.</span></div>
        </div>
      </div>
    `
  };

  function getJournalList() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function setJournalList(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 30)));
  }

  function field(id) {
    return document.getElementById(id);
  }

  function ensureJournalTools() {
    const panel = document.getElementById("lab-journal");
    if (!panel || panel.dataset.ready === "1") return;

    panel.dataset.ready = "1";

    const tools = document.createElement("div");
    tools.className = "lab-journal-tools";
    tools.innerHTML = `
      <button class="small-btn" type="button" onclick="saveLabJournal()">Save Journal</button>
      <button class="small-btn muted-btn" type="button" onclick="clearLabJournalForm()">Clear Form</button>
    `;
    panel.appendChild(tools);

    const history = document.createElement("div");
    history.id = "journal-history";
    history.className = "journal-history";
    panel.appendChild(history);

    renderJournalHistory();
  }

  window.saveLabJournal = function () {
    const row = {
      time: new Date().toLocaleString("id-ID"),
      pair: field("journal-pair")?.value?.trim() || "-",
      bias: field("journal-bias")?.value?.trim() || "-",
      entry: field("journal-entry")?.value?.trim() || "-",
      sl: field("journal-sl")?.value?.trim() || "-",
      tp: field("journal-tp")?.value?.trim() || "-",
      result: field("journal-result")?.value?.trim() || "-",
      note: field("journal-note")?.value?.trim() || "-"
    };

    const rows = [row, ...getJournalList()];
    setJournalList(rows);
    renderJournalHistory();
    if (window.showToast) window.showToast("Journal saved");
  };

  window.clearLabJournalForm = function () {
    ["journal-pair", "journal-bias", "journal-entry", "journal-sl", "journal-tp", "journal-result", "journal-note"].forEach(id => {
      const el = field(id);
      if (el) el.value = "";
    });
  };

  window.renderJournalHistory = function () {
    const box = document.getElementById("journal-history");
    if (!box) return;

    const rows = getJournalList();

    if (!rows.length) {
      box.innerHTML = `
        <div class="lab-empty-state">
          <b>Belum ada journal tersimpan.</b>
          <span>Isi form di atas lalu tekan Save Journal.</span>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <h3>Journal History</h3>
      <div class="lab-history-list">
        ${rows.map(x => `
          <div class="lab-journal-card">
            <div>
              <b>${x.pair}</b>
              <span>${x.time}</span>
            </div>
            <p><b>Bias:</b> ${x.bias} · <b>Entry:</b> ${x.entry} · <b>SL:</b> ${x.sl} · <b>TP:</b> ${x.tp}</p>
            <p><b>Result:</b> ${x.result}</p>
            <p>${x.note}</p>
          </div>
        `).join("")}
      </div>
    `;
  };

  window.showLabTab = function (tab) {
    const target = String(tab || "journal").toLowerCase();

    document.querySelectorAll(".lab-panel").forEach(panel => {
      panel.classList.remove("active");
      panel.style.display = "none";
    });

    document.querySelectorAll("[onclick^='showLabTab']").forEach(btn => {
      btn.classList.remove("active");
    });

    const clicked = document.querySelector(`[onclick="showLabTab('${target}')"]`);
    if (clicked) clicked.classList.add("active");

    const existing = document.getElementById(`lab-${target}`);
    if (existing) {
      existing.classList.add("active");
      existing.style.display = "";
      if (target === "journal") ensureJournalTools();
      return;
    }

    const lab = document.querySelector("#lab .card") || document.querySelector("[id*='lab']");
    if (!lab) return;

    let panel = document.getElementById(`lab-${target}`);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = `lab-${target}`;
      panel.className = "lab-panel active";
      lab.appendChild(panel);
    }

    panel.innerHTML = labContent[target] || labContent.academy;
    panel.style.display = "";
  };

  document.addEventListener("DOMContentLoaded", function () {
    ensureJournalTools();
    window.showLabTab("journal");
  });
})();
