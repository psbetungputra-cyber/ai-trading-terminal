# AiSignalFx PRO - Signal Logic & Packet Blueprint

## Purpose

This document defines how AiSignalFx PRO converts technical analysis into a structured signal packet.

The system must not work as a gambling signal machine. It should work as a structured trading assistant that filters conditions, manages risk, and gives educational signal plans.

## Signal Logic Flow

The signal engine should follow this order:

1. Read market data
2. Detect market context
3. Detect structure
4. Detect major zones
5. Detect risk condition
6. Build signal readiness
7. Generate signal packet
8. Send packet to Signal Room UI
9. Save snapshot/history when Firebase is ready

## Market Data Input

Each analysis payload should include:

- pair / symbol
- timeframe
- current price
- candles / OHLCV history
- market type: crypto live or forex/gold reference
- session context if available

Crypto data should use Binance live/reference data first.

Forex/gold should remain clearly labeled as reference mode until a real provider is integrated.

## Core Analysis Logic

The engine should combine:

- H4 / H1 / M30 trendline and direction
- H4 support/resistance zones
- RBS / SBR behavior
- supply-demand areas
- RBR / DBD / DBR / RBD base pattern context
- breakout-pullback confirmation
- BRN / round-number levels
- FVG / imbalance as supporting confirmation
- liquidity sweep / grab
- BOS / CHoCH when useful
- multi-timeframe context
- overtrade guard
- session / H4 candle change guard

SMC is a supporting component, not the only core logic.

## Signal Status

The engine should use clear signal status labels:

- Observation
- Waiting Zone
- Zone Watch
- Zone Touched
- Signal Preview
- Signal Active
- Risk Watch
- Risk Alert
- Invalid

## Bias Logic

Bias can be:

- BUY
- SELL
- WAIT

BUY requires supportive context such as:

- price reacting from support/demand
- bullish rejection
- breakout-pullback
- sweep then recovery
- bullish structure or momentum confirmation

SELL requires supportive context such as:

- price reacting from resistance/supply
- bearish rejection
- breakdown-pullback
- sweep then rejection
- bearish structure or momentum confirmation

WAIT is used when:

- price is in middle range
- structure is unclear
- no clean zone reaction
- risk is too high
- overtrade guard is active
- candle/session condition is unsafe

## Risk Logic

Risk can be:

- Low
- Medium
- High

Risk should increase when:

- price is far from clean zone
- price is in middle range
- candle is too aggressive
- volatility is too high
- market is near session change
- market is near H4 candle change
- repeated weak signals appear
- setup has no clean invalidation

## Entry Logic

The engine should produce entry guidance only when context is acceptable.

For BUY:

- Entry Zone Guide: near demand/support/retest area
- Stop Loss Guide: below demand/support invalidation
- TP1 Guide: nearest resistance/supply/BRN
- TP2 Guide: extended next resistance/supply/BRN

For SELL:

- Entry Zone Guide: near supply/resistance/retest area
- Stop Loss Guide: above supply/resistance invalidation
- TP1 Guide: nearest demand/support/BRN
- TP2 Guide: extended next demand/support/BRN

For WAIT:

- Entry Zone Guide: Waiting valid zone
- Stop Loss Guide: Waiting invalidation level
- TP1 Guide: Waiting target area
- TP2 Guide: Waiting extended target

## Signal Packet Standard

Every final signal packet should use this structure:

```js
{
  version: "SignalPacketStandardV1",

  pair: "BTCUSDT",
  symbol: "BTCUSDT",
  timeframe: "15m",
  tf: "15m",

  market: "crypto_live_binance",
  source: "asfx-signal-engine",

  price: 0,
  currentPrice: 0,

  bias: "WAIT",
  risk: "Medium",
  confidence: 0,
  score: 0,

  structure: "Structure reading",
  demandZone: "Calculating",
  supplyZone: "Calculating",
  activeZone: "Waiting valid zone",
  zoneState: "Waiting Zone",
  distanceToZone: "Waiting distance",
  distanceToZoneText: "Waiting distance",

  liquidity: "Waiting confirmation",
  imbalance: "Waiting",

  signalStatus: "Waiting Zone",
  actionStatus: "Observation",
  setupType: "Waiting Zone",
  phase: "Observation",
  smzPhase: "Observation",

  entryZone: "Waiting valid zone",
  entryGuide: "Waiting valid zone",
  slGuide: "Waiting invalidation level",
  stopLossGuide: "Waiting invalidation level",
  tp1Guide: "Waiting target area",
  tp2Guide: "Waiting extended target",
  invalidationLevel: "Waiting zone invalidation",

  reason: "Reading market context.",
  statusDetail: "Reading market context.",
  executionNote: "Educational analysis only. Execution remains user responsibility.",

  candleCount: 0,
  accessLevel: "vip",
  publicMode: false,

  lastUpdated: "ISO_DATE"
}
