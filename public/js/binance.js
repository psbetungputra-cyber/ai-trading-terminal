const BINANCE_TOP_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
  "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "TONUSDT"
];

async function fetchBinanceTicker24h(symbols = BINANCE_TOP_SYMBOLS){
  const url = "https://api.binance.com/api/v3/ticker/24hr";
  const response = await fetch(url);
  if(!response.ok) throw new Error("Binance market data unavailable");
  const data = await response.json();
  const allowed = new Set(symbols);
  return data
    .filter(item => allowed.has(item.symbol))
    .sort((a,b) => symbols.indexOf(a.symbol) - symbols.indexOf(b.symbol));
}

function buildCryptoSignal(item){
  const change = Number(item.priceChangePercent || 0);
  const volume = Number(item.quoteVolume || 0);
  let bias = "WAIT";
  if(change > 1.2) bias = "BUY";
  if(change < -1.2) bias = "SELL";

  const confidence = Math.min(92, Math.max(52, Math.round(Math.abs(change) * 8 + (volume > 100000000 ? 12 : 0) + 55)));

  return {
    symbol: item.symbol,
    price: Number(item.lastPrice),
    change,
    volume,
    high: Number(item.highPrice),
    low: Number(item.lowPrice),
    bias,
    confidence,
    note: bias === "BUY"
      ? "Momentum positif. Tunggu pullback dan konfirmasi sebelum entry."
      : bias === "SELL"
        ? "Tekanan bearish aktif. Waspadai retest sebelum continuation."
        : "Market belum bersih. Tunggu struktur lebih jelas."
  };
}

window.AiSignalBinance = {
  symbols: BINANCE_TOP_SYMBOLS,
  fetchBinanceTicker24h,
  buildCryptoSignal
};

/* AiSignalFx PRO - Binance Scanner Upgrade */
(function(){
  const TOP = [
    "BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT",
    "DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","TONUSDT"
  ];

  const HOSTS = [
    "https://api.binance.com",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com",
    "https://data-api.binance.vision"
  ];

  async function fetchAllTickers(){
    let lastError;

    for (const host of HOSTS) {
      try {
        const res = await fetch(host + "/api/v3/ticker/24hr", { cache: "no-store" });
        if (!res.ok) throw new Error("Binance response " + res.status);
        const data = await res.json();
        const allowed = new Set(TOP);

        return data
          .filter(x => allowed.has(x.symbol))
          .sort((a, b) => TOP.indexOf(a.symbol) - TOP.indexOf(b.symbol));
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("Binance market data unavailable");
  }

  function buildSignal(item){
    const symbol = item.symbol;
    const price = Number(item.lastPrice || 0);
    const change = Number(item.priceChangePercent || 0);
    const volume = Number(item.quoteVolume || item.volume || 0);
    const high = Number(item.highPrice || price);
    const low = Number(item.lowPrice || price);
    const volatility = price ? Math.abs((high - low) / price) * 100 : 0;

    let bias = "WAIT";
    if (change > 1.1) bias = "BUY";
    if (change < -1.1) bias = "SELL";

    const confidence = Math.min(
      94,
      Math.max(
        54,
        Math.round(58 + Math.abs(change) * 5 + Math.min(volatility, 8) * 2 + (volume > 100000000 ? 8 : 0))
      )
    );

    const risk = volatility > 6 ? "High" : volatility > 3 ? "Medium" : "Low";
    const momentum = change > 1.1 ? "Bullish" : change < -1.1 ? "Bearish" : "Neutral";

    let note = "Market masih menunggu struktur lebih jelas.";
    if (bias === "BUY") note = "Momentum crypto positif. Tunggu pullback dan konfirmasi sebelum entry.";
    if (bias === "SELL") note = "Tekanan bearish aktif. Waspadai retest sebelum continuation.";

    return {
      symbol,
      market: "crypto",
      bias,
      confidence,
      price,
      change,
      volume,
      high,
      low,
      risk,
      momentum,
      note
    };
  }

  async function getCryptoSignals(){
    const rows = await fetchAllTickers();
    return rows.map(buildSignal);
  }

  window.AiSignalBinance = {
    symbols: TOP,
    fetchBinanceTicker24h: fetchAllTickers,
    buildCryptoSignal: buildSignal,
    getCryptoSignals
  };
})();


/* AiSignalFx PRO - Binance fast cache layer */
(function () {
  const TOP = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
    "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "TONUSDT"
  ];

  const HOSTS = [
    "https://api.binance.com",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com",
    "https://data-api.binance.vision"
  ];

  const CACHE_KEY = "aisignalfx_binance_24h_cache_v2";
  const CACHE_MS = 120000;
  let inflight = null;

  function readCache(allowStale = true) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!cached || !Array.isArray(cached.rows)) return null;
      const fresh = Date.now() - Number(cached.time || 0) < CACHE_MS;
      return fresh || allowStale ? cached.rows : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(rows) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        time: Date.now(),
        rows
      }));
    } catch (e) {}
  }

  function normalizeRows(rows) {
    const allowed = new Set(TOP);
    return rows
      .filter(x => allowed.has(x.symbol))
      .sort((a, b) => TOP.indexOf(a.symbol) - TOP.indexOf(b.symbol));
  }

  function timeoutFetch(url, ms = 1700) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);

    return fetch(url, {
      cache: "no-store",
      signal: ctrl.signal
    }).finally(() => clearTimeout(timer));
  }

  async function fetchHost(host) {
    const res = await timeoutFetch(host + "/api/v3/ticker/24hr");
    if (!res.ok) throw new Error("Binance response " + res.status);
    const data = await res.json();
    return normalizeRows(data);
  }

  async function fetchFreshTickers() {
    if (inflight) return inflight;

    inflight = Promise.any(HOSTS.map(fetchHost))
      .then(rows => {
        if (rows && rows.length) {
          writeCache(rows);
          window.AisignalBinanceLastRows = rows;
          window.dispatchEvent(new CustomEvent("aisignalfx:binance-ready", { detail: rows }));
        }
        return rows;
      })
      .finally(() => {
        inflight = null;
      });

    return inflight;
  }

  async function fetchFastTickers(options = {}) {
    const cached = readCache(true);

    if (cached && !options.force) {
      fetchFreshTickers().catch(() => {});
      return cached;
    }

    try {
      return await fetchFreshTickers();
    } catch (err) {
      const stale = readCache(true);
      if (stale) return stale;
      throw err;
    }
  }

  function buildSignal(item) {
    const symbol = item.symbol;
    const price = Number(item.lastPrice || 0);
    const change = Number(item.priceChangePercent || 0);
    const volume = Number(item.quoteVolume || item.volume || 0);
    const high = Number(item.highPrice || price);
    const low = Number(item.lowPrice || price);
    const volatility = price ? Math.abs((high - low) / price) * 100 : 0;

    let bias = "WAIT";
    if (change > 1.1) bias = "BUY";
    if (change < -1.1) bias = "SELL";

    const confidence = Math.min(
      94,
      Math.max(
        54,
        Math.round(58 + Math.abs(change) * 5 + Math.min(volatility, 8) * 2 + (volume > 100000000 ? 8 : 0))
      )
    );

    const risk = volatility > 6 ? "High" : volatility > 3 ? "Medium" : "Low";
    const momentum = change > 1.1 ? "Bullish" : change < -1.1 ? "Bearish" : "Neutral";

    let note = "Market masih menunggu struktur lebih jelas.";
    if (bias === "BUY") note = "Momentum crypto positif. Tunggu pullback dan konfirmasi sebelum entry.";
    if (bias === "SELL") note = "Tekanan bearish aktif. Waspadai retest sebelum continuation.";

    return {
      symbol,
      market: "crypto",
      bias,
      confidence,
      price,
      change,
      volume,
      high,
      low,
      risk,
      momentum,
      note
    };
  }

  async function getCryptoSignals() {
    const rows = await fetchFastTickers();
    return rows.map(buildSignal);
  }

  window.AisignalBinance = Object.assign({}, window.AisignalBinance || {}, {
    symbols: TOP,
    fetchBinanceTicker24h: fetchFastTickers,
    buildCryptoSignal: buildSignal,
    getCryptoSignals,
    refresh: function () {
      return fetchFastTickers({ force: true });
    }
  });

  fetchFreshTickers().catch(() => {});
})();

