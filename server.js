const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const BINANCE_BASE = "https://data-api.binance.vision/api/v3";
const cache = new Map();

function cleanSymbol(value) {
  return String(value || "BTCUSDT")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20) || "BTCUSDT";
}

function cleanInterval(value) {
  const v = String(value || "15m").toLowerCase();
  const allowed = new Set(["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]);
  return allowed.has(v) ? v : "15m";
}

function cleanLimit(value) {
  const n = Number.parseInt(value || "80", 10);
  if (!Number.isFinite(n)) return 80;
  return Math.max(1, Math.min(500, n));
}

function ttlFor(endpoint) {
  if (endpoint === "ticker/price") return 800;
  if (endpoint === "ticker/24hr") return 15000;
  if (endpoint === "klines") return 6000;
  return 5000;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AiSignalFx-PRO/1.0",
        "Accept": "application/json"
      }
    });

    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      text
    };
  } finally {
    clearTimeout(timer);
  }
}

async function proxyBinance(req, res, endpoint) {
  const symbol = cleanSymbol(req.query.symbol);
  const interval = cleanInterval(req.query.interval);
  const limit = cleanLimit(req.query.limit);

  let query = `symbol=${encodeURIComponent(symbol)}`;

  if (endpoint === "klines") {
    query += `&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  }

  const url = `${BINANCE_BASE}/${endpoint}?${query}`;
  const key = `${endpoint}:${query}`;
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.time < ttlFor(endpoint)) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-AiSignalFx-Cache", "fresh");
    res.type("application/json").send(cached.text);
    return;
  }

  try {
    const result = await fetchText(url);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}`);
    }

    cache.set(key, {
      time: Date.now(),
      text: result.text
    });

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-AiSignalFx-Cache", "live");
    res.type("application/json").send(result.text);
  } catch (error) {
    if (cached) {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-AiSignalFx-Cache", "stale");
      res.type("application/json").send(cached.text);
      return;
    }

    res.status(502).json({
      error: "binance_proxy_failed",
      endpoint,
      symbol,
      interval,
      detail: String(error.message || error)
    });
  }
}

app.get("/api/binance/ticker/price", (req, res) => {
  proxyBinance(req, res, "ticker/price");
});

app.get("/api/binance/ticker/24hr", (req, res) => {
  proxyBinance(req, res, "ticker/24hr");
});

app.get("/api/binance/klines", (req, res) => {
  proxyBinance(req, res, "klines");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AiSignalFx PRO running at http://localhost:${PORT}`);
});
