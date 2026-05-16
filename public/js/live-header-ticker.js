/* AiSignalFx PRO - Live Header Ticker V1 */
(function(){
  const CRYPTO = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT"];
  const REFERENCE = [
    { symbol:"EURUSD", price:"1.0854", type:"up" },
    { symbol:"GBPUSD", price:"1.2643", type:"up" },
    { symbol:"USDJPY", price:"156.23", type:"down" },
    { symbol:"GBPJPY", price:"199.45", type:"wait" },
    { symbol:"XAUUSD", price:"2345.12", type:"up" },
    { symbol:"NAS100", price:"18422", type:"up" },
    { symbol:"US30", price:"38790", type:"down" }
  ];

  const HOSTS = [
    "https://api.binance.com",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com",
    "https://data-api.binance.vision"
  ];

  function track(){
    return document.querySelector(".ticker-track");
  }

  function fmtPrice(symbol, value){
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("en-US", {
      maximumFractionDigits: n > 100 ? 2 : 4
    });
  }

  async function fetchJson(path){
    let lastErr;
    for (const host of HOSTS){
      try {
        const res = await fetch(host + path, { cache: "no-store" });
        if (!res.ok) throw new Error("Binance " + res.status);
        return await res.json();
      } catch(err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Binance unavailable");
  }

  async function getCrypto(){
    const encoded = encodeURIComponent(JSON.stringify(CRYPTO));
    const rows = await fetchJson(`/api/v3/ticker/24hr?symbols=${encoded}`);
    const map = new Map(rows.map(x => [x.symbol, x]));
    return CRYPTO.map(symbol => {
      const row = map.get(symbol);
      const change = Number(row?.priceChangePercent || 0);
      return {
        symbol,
        price: fmtPrice(symbol, row?.lastPrice),
        type: change >= 0 ? "up" : "down",
        change
      };
    });
  }

  function itemHTML(x, isCrypto){
    const cls = x.type === "up" ? "green" : x.type === "down" ? "red" : "yellow";
    const change = isCrypto && Number.isFinite(x.change)
      ? `<small class="${cls}">${x.change.toFixed(2)}%</small>`
      : "";

    return `
      <span class="live-ticker-item ${isCrypto ? "crypto-live" : "reference"}">
        <b>${x.symbol}</b>
        <strong class="${cls}">${x.price}</strong>
        ${change}
      </span>
    `;
  }

  function render(cryptoRows, fallback = false){
    const box = track();
    if (!box) return;

    const cryptoHTML = cryptoRows.map(x => itemHTML(x, true)).join("");
    const refHTML = REFERENCE.map(x => itemHTML(x, false)).join("");

    box.innerHTML = `
      <span class="live-ticker-status">
        <i></i>${fallback ? "Crypto fallback" : "Crypto live"} · Forex reference
      </span>
      ${cryptoHTML}
      ${refHTML}
      ${cryptoHTML}
      ${refHTML}
    `;
  }

  async function load(){
    try {
      const crypto = await getCrypto();
      render(crypto, false);
    } catch(e) {
      render([
        { symbol:"BTCUSDT", price:"Loading", type:"wait", change:0 },
        { symbol:"ETHUSDT", price:"Loading", type:"wait", change:0 }
      ], true);
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(load, 700);
    setInterval(load, 25000);
  });

  window.refreshLiveHeaderTicker = load;
})();
