# AiSignalFx PRO - Technical Engine Blueprint

## Core Direction

AiSignalFx PRO signal engine is not purely SMC. The engine uses a hybrid technical approach based on classic market structure, support/resistance, trendline, supply-demand, and selected SMC confirmations.

The purpose of the engine is to help filter setups, reduce overtrading, and produce structured educational signal plans. It must not claim guaranteed profit.

## Main Method Foundation

### 1. Higher Timeframe Direction

Primary direction should be read from:

- H4
- H1
- M30

Main components:

- H4 support and resistance zones
- RBS / SBR behavior
- Trendline on H4 / H1 / M30
- Repeated price reactions or bounces
- Breakout and pullback structure
- Big round numbers / BRN

H4 SNR is not a single level. It can be multiple horizontal reaction areas created from repeated touches, rejections, liquidity buildup, and failed breakouts.

### 2. Supply and Demand Context

Supply-demand should be read multi-timeframe:

- Start from H4
- Refine on H1 / M30
- Final actionable zones on M15 / M5

Supply-demand base concepts:

- RBR
- DBD
- DBR
- RBD

The engine should treat supply-demand as a practical zone context, not decorative boxes.

### 3. SMC as Supporting Confirmation

SMC is important, but not the only core.

SMC components used as support:

- FVG / imbalance
- liquidity sweep / grab
- BOS / CHoCH
- order block style reaction area
- premium / discount context
- demand / supply refinement

SMC must support the classic method, not replace it.

## Timeframe Module

### Scalping Mode

Use:

- H1 for major intraday bias
- M30 for main zone mapping
- M15 for setup structure
- M5 for refinement and entry preparation
- M1 only as optional precision trigger because it is risky/noisy

### Intraday Mode

Use:

- H4 for major market direction
- H1 for trend and structure
- M30 for main zones
- M15 for setup validation
- M5 for entry refinement

Do not simplify this module into "M15 bias, M5 zone, M1 trigger". That is not the intended engine structure.

## Entry Logic Direction

The engine should not force entries.

For BUY context:

- price near valid support/demand
- bullish rejection
- breakout-pullback confirmation
- sweep then recovery
- FVG/imbalance support if available
- SL below demand/support invalidation
- TP near next supply/resistance/BRN

For SELL context:

- price near valid resistance/supply
- bearish rejection
- breakdown-pullback confirmation
- sweep then rejection
- FVG/imbalance support if available
- SL above supply/resistance invalidation
- TP near next demand/support/BRN

For WAIT context:

- price in middle range
- unclear structure
- high-risk session/candle condition
- no clean reaction
- overtrade risk active

## Risk and Guard Modules

### Overtrade Guard

The engine must reduce low-quality trades.

Avoid or warn when:

- price is in the middle of range
- no clean reaction zone
- repeated weak signals appear
- setup appears only because user wants entry
- market has not broken or reacted clearly from H4 SNR
- risk/reward is not clean

### Session / Candle Change Guard

Market can become aggressive around session changes and H4 candle changes.

The engine should:

- warn during high volatility windows
- wait for candle confirmation
- avoid careless entry near candle turnover
- mark risk as higher when needed

## Public vs VIP

Public users may see:

- bias preview
- broad zone/status
- general risk note
- educational explanation

VIP / owner may see:

- entry zone
- stop loss guide
- TP1 / TP2 guide
- invalidation level
- full reasoning
- risk plan
- signal snapshot/history

## Final Principle

AiSignalFx PRO should act like a structured trading assistant, not a gambling signal machine.

The system should prioritize:

- clean setup
- patience
- zone reaction
- risk control
- anti-overtrade behavior
- educational signal planning
