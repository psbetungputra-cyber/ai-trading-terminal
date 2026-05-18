const BINANCE_BASES = [
  "https://data-api.binance.vision/api/v3",
  "https://api-gcp.binance.com/api/v3",
  "https://api.binance.com/api/v3"
];

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

function buildPath(endpoint, query) {
  const symbol = cleanSymbol(query.symbol);

  if (endpoint === "klines") {
    const interval = cleanInterval(query.interval);
    const limit = cleanLimit(query.limit);
    return `/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  }

  if (endpoint === "ticker/24hr") {
    return `/ticker/24hr?symbol=${symbol}`;
  }

  return `/ticker/price?symbol=${symbol}`;
}

function isRestrictedResponse(text) {
  return /restricted location|service unavailable from a restricted/i.test(String(text || ""));
}

async function requestMarketData(path) {
  let last = {
    status: 502,
    contentType: "application/json",
    text: JSON.stringify({ error: "No Binance market endpoint responded" })
  };

  for (const base of BINANCE_BASES) {
    const url = `${base}${path}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "AiSignalFxPRO/1.0"
        }
      });

      const text = await response.text();
      const contentType = response.headers.get("content-type") || "application/json";

      last = {
        status: response.status,
        contentType,
        text
      };

      if (response.ok && !isRestrictedResponse(text)) {
        return last;
      }

      if (isRestrictedResponse(text)) {
        continue;
      }
    } catch (error) {
      last = {
        status: 502,
        contentType: "application/json",
        text: JSON.stringify({
          error: "Binance market endpoint failed",
          message: error && error.message ? error.message : String(error)
        })
      };
    }
  }

  return last;
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
    const path = buildPath(endpoint, req.query || {});
    const result = await requestMarketData(path);

    res.status(result.status);
    res.setHeader("Content-Type", result.contentType);

    return res.send(result.text);
  } catch (error) {
    return res.status(500).json({
      error: "Binance proxy failed",
      message: error && error.message ? error.message : String(error)
    });
  }
}

module.exports = { handler };
