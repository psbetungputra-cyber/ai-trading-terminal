/* AiSignalFx PRO - Scanner Pair Focus UI */
(function(){
  const KEY = "aisignalfx_scanner_focus_pair";
  let lastSymbols = "";

  function getGrid(){
    return document.getElementById("scanner-grid");
  }

  function getCards(){
    const grid = getGrid();
    if (!grid) return [];
    return Array.from(grid.querySelectorAll(".signal-card")).filter(card => card.querySelector("h3"));
  }

  function getSymbol(card){
    return card.querySelector("h3")?.textContent?.trim() || "";
  }

  function getSelected(cards){
    const saved = localStorage.getItem(KEY);
    const symbols = cards.map(getSymbol).filter(Boolean);
    if (saved === "ALL") return "ALL";
    if (saved && symbols.includes(saved)) return saved;
    return symbols[0] || "ALL";
  }

  function setSelected(symbol){
    localStorage.setItem(KEY, symbol);
    applyFocus(true);
  }

  function ensureControls(cards){
    const grid = getGrid();
    if (!grid || !cards.length) return;

    let box = document.querySelector(".scanner-pair-focus");
    const symbols = cards.map(getSymbol).filter(Boolean);
    const signature = symbols.join("|");

    if (box && lastSymbols === signature) return;
    if (box) box.remove();

    lastSymbols = signature;

    box = document.createElement("div");
    box.className = "scanner-pair-focus";
    box.innerHTML = `
      <div>
        <span class="scanner-focus-kicker">PAIR FOCUS MODE</span>
        <h3>Pilih market untuk detail scanner</h3>
        <p>Gunakan All Pairs jika ingin melihat semua hasil scanner.</p>
      </div>
      <div class="scanner-pair-chips">
        <button type="button" data-symbol="ALL">All Pairs</button>
        ${symbols.map(s => `<button type="button" data-symbol="${s}">${s}</button>`).join("")}
      </div>
    `;

    grid.parentNode.insertBefore(box, grid);

    box.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => setSelected(btn.dataset.symbol));
    });
  }

  function applyFocus(force = false){
    const grid = getGrid();
    const cards = getCards();
    if (!grid || !cards.length) return;

    ensureControls(cards);

    const selected = getSelected(cards);
    const controls = document.querySelector(".scanner-pair-focus");

    if (controls) {
      controls.querySelectorAll("button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.symbol === selected);
      });
    }

    grid.classList.toggle("scanner-focus-grid", selected !== "ALL");
    grid.classList.toggle("scanner-all-grid", selected === "ALL");

    cards.forEach(card => {
      const sym = getSymbol(card);
      const show = selected === "ALL" || sym === selected;
      card.classList.toggle("scanner-card-hidden", !show);
      card.classList.toggle("scanner-card-focused", selected !== "ALL" && sym === selected);
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(applyFocus, 800);
    setTimeout(applyFocus, 2500);
    setTimeout(applyFocus, 5000);
  });

  setInterval(applyFocus, 1600);

  window.setScannerPairFocus = setSelected;
})();
