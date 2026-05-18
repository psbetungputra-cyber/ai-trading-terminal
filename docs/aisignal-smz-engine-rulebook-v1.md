# AiSignal SMZ Engine Rulebook V1

## Mission

AiSignalFx PRO is not a normal trading website. It is designed as an institutional-style AI trading intelligence platform.

The signal engine must not generate random BUY or SELL signals from price movement alone. Every signal must be built from structured technical logic, zone validation, risk control, and multi-timeframe context.

Core flow:

Chart / Candle Data
→ SMZ Engine
→ Risk Guard
→ AI Insight
→ Final Signal Plan

---

## Core Engine Name

AiSignal SMZ Engine

SMZ means Smart Money Zone.

The engine combines:

- Market Structure
- Smart Money Concept
- Liquidity
- FVG / Imbalance
- Order Block
- Supply and Demand Zone
- Multi-Timeframe Trend
- Indicator Confirmation
- Risk Guard
- AiSignal Packet
- AI Insight
- Final Signal Plan

---

## Timeframe Logic

User may choose M1, M5, M15, H1, or H4.

The engine must always read higher-timeframe context before validating lower-timeframe entries.

### M1 Mode

H1 = major direction  
M15 = setup zone  
M5 = confirmation  
M1 = timing entry  

### M5 Mode

H4 = major direction  
H1 = trend context  
M15 = setup zone  
M5 = confirmation entry  

### M15 Mode

H4 = major direction  
H1 = trend context  
M15 = main setup  
M5 = extra confirmation  

---

## Market Structure

The engine must detect:

- HH: Higher High
- HL: Higher Low
- LH: Lower High
- LL: Lower Low
- BOS: Break of Structure
- CHoCH: Change of Character

Basic logic:

- HH + HL = bullish structure
- LH + LL = bearish structure
- BOS with trend = continuation
- CHoCH = possible reversal or transition

Structure states:

- Bullish
- Bearish
- Mixed
- Transition
- No Structure

---

## Liquidity Logic

The engine must detect liquidity areas:

- Equal High
- Equal Low
- Previous High
- Previous Low
- Liquidity Sweep
- Stop Hunt
- Liquidity Grab

SELL setup example:

Price sweeps high
→ fails to continue
→ bearish rejection
→ bearish CHoCH
→ wait for supply or FVG retest

BUY setup example:

Price sweeps low
→ fails to continue
→ bullish rejection
→ bullish CHoCH
→ wait for demand or FVG retest

---

## Zone Engine

The engine must detect and score:

- Order Block
- Supply Zone
- Demand Zone
- FVG
- Imbalance
- Premium / Discount Area
- Minor Support / Resistance

Zone quality:

- Fresh zone = strong
- Untouched zone = strong
- Repeatedly touched zone = weak
- Aligned with higher timeframe = stronger
- Against higher timeframe = caution
- Near liquidity target = stronger
- Too far from current price = wait

---

## Indicator Confirmation

Indicators are support tools, not the main signal source.

Initial indicators:

- EMA 9 / EMA 21 for short momentum
- EMA 50 / EMA 200 for trend direction
- RSI for momentum strength
- ATR for volatility and SL distance
- Volume for pressure confirmation

Future indicators:

- VWAP
- Bollinger Band
- Session filter
- News filter

Rule:

SMZ / structure / zone first.  
Indicators confirm after.

Never use simple logic like:

RSI oversold = BUY

Use combined logic like:

Liquidity sweep
+ bullish CHoCH
+ demand zone
+ RSI recovery
+ safe risk
= valid BUY setup

---

## Signal State

AiSignal must not only show BUY or SELL.

Required states:

- NO SETUP
- WAITING ZONE
- ZONE TOUCHED
- CONFIRMATION WAIT
- SIGNAL ACTIVE
- MISSED ENTRY
- INVALID
- CLOSED

Definitions:

NO SETUP:
No clear opportunity.

WAITING ZONE:
Bias and zone exist, but price has not reached the valid area.

ZONE TOUCHED:
Price has entered the zone, but confirmation is not complete.

CONFIRMATION WAIT:
Waiting for rejection, CHoCH, displacement, or momentum confirmation.

SIGNAL ACTIVE:
Entry setup is valid.

MISSED ENTRY:
Price has moved too far from the valid zone. Do not chase.

INVALID:
The setup is no longer valid.

CLOSED:
Signal has reached TP, SL, expired, or manually closed.

---

## Risk Guard

Risk Guard must run before Signal Active.

Risk Guard checks:

- Is price too far from entry zone?
- Has entry already been missed?
- Is SL distance logical?
- Is ATR too high?
- Is risk/reward healthy?
- Is the zone fresh or weak?
- Is higher timeframe conflicting?
- Is market too volatile?

Risk Guard can reject a signal.

Example:

Bias: SELL  
But price is already too far from supply zone.  
Status: MISSED ENTRY  
Action: Do not chase. Wait for next pullback.

---

## AiSignal Packet

AiSignal Packet is the central data object behind Signal Room.

Example packet:

Pair: BTCUSDT  
Mode: M15  
Current Price: 76850  

HTF Trend: Bearish  
Structure: LH / LL  
Liquidity: High swept  
Zone: Supply + FVG  
Status: Waiting Zone  

Bias: SELL  
Confidence: 72%  
Risk: Medium  

Entry Zone: VIP locked  
SL: VIP locked  
TP1: VIP locked  
TP2: VIP locked  
Invalidation: VIP locked  

AI Insight:
Market remains bearish, but entry is not active yet because price has not returned to the valid supply zone.

---

## Signal Room Flow

Final room layout:

Chart | Risk | AI Insight | Signal

VIP is not a tab. VIP is access permission.

### Chart

Shows:

- Live candle
- Live price
- Future SMZ zones
- Market status

### Risk

Shows:

- Risk level
- Distance to zone
- Entry chasing warning
- Volatility
- Risk/reward health

### AI Insight

Explains:

- Why the bias exists
- What to wait for
- What the danger is
- Whether entry is late or still valid

### Signal

Shows final plan:

- Bias
- Status
- Entry Zone
- SL
- TP1 / TP2
- Invalidation
- Full reason
- Confidence breakdown

---

## Public vs VIP Access

VIP is access, not a separate tab.

### Free / Public

Can see:

- Bias
- Status
- Risk
- Broad zone
- Short AI summary

Cannot see:

- Exact entry
- SL
- TP
- Invalidation detail
- Full reasoning
- Signal history

### VIP

Can see:

- Entry Zone
- SL
- TP1
- TP2
- Invalidation
- Risk plan
- Full AI reasoning
- Confidence breakdown
- Signal history

### Owner / Admin

Owner and admin should always unlock full detail.

Temporary owner bypass:

?owner=1

Future Firebase roles:

- owner
- admin
- vip
- free

---

## Learning Loop

Every signal must be saved and evaluated.

Flow:

Signal created
→ market moves
→ result checked
→ win / loss / missed / invalid classified
→ error reason stored
→ rules reviewed
→ backtest repeated
→ admin approves improvement

Error categories:

- Trend conflict
- Weak zone
- Late entry
- ATR too high
- News spike
- Weak confirmation
- Liquidity fakeout

The engine must learn from history, but it must not change live signal rules randomly without review.

---

## Development Rule

No random UI patches.

Build in this order:

1. Candle Packet
2. Timeframe Context
3. Basic Structure Detector
4. Zone Detector
5. Risk Guard
6. AiSignal Packet
7. Signal Room Display
8. Backtest and Learning Loop
9. Python / pandas advanced engine

