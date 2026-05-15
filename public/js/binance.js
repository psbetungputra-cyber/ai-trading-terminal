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
