const BINANCE_BASE = "https://api.binance.com/api/v3";

const allowedIntervals = new Set([
  "1m", "3m", "5m", "15m", "30m",
  "1h", "4h", "1d", "1w"
]);

function setHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

function cleanSymbol(value) {
  const symbol = String(value || "BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return symbol || "BTCUSDT";
}

function cleanInterval(value) {
  const interval = String(value || "15m").toLowerCase();
  return allowedIntervals.has(interval) ? interval : "15m";
}

function cleanLimit(value) {
  const n = Number(value || 80);
  if (!Number.isFinite(n)) return 80;
  return Math.max(10, Math.min(500, Math.floor(n)));
}

function resolveEndpoint(req, forcedEndpoint) {
  const query = req.query || {};
  const raw = String(forcedEndpoint || query.endpoint || query.type || query.path || "").toLowerCase();

  if (raw.includes("klines")) return "klines";
  if (raw.includes("24hr")) return "ticker/24hr";
  if (raw.includes("ticker") || raw.includes("price")) return "ticker/price";

  return "ticker/price";
}

async function handler(req, res, forcedEndpoint) {
  setHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const endpoint = resolveEndpoint(req, forcedEndpoint);
    const query = req.query || {};
    const symbol = cleanSymbol(query.symbol);

    let url;

    if (endpoint === "klines") {
      const interval = cleanInterval(query.interval);
      const limit = cleanLimit(query.limit);
      url = `${BINANCE_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    } else if (endpoint === "ticker/24hr") {
      url = `${BINANCE_BASE}/ticker/24hr?symbol=${symbol}`;
    } else {
      url = `${BINANCE_BASE}/ticker/price?symbol=${symbol}`;
    }

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "AiSignalFxPRO/1.0"
      }
    });

    const text = await response.text();

    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");

    return res.send(text);
  } catch (error) {
    return res.status(500).json({
      error: "Binance proxy failed",
      message: error && error.message ? error.message : String(error)
    });
  }
}

module.exports = { handler };
