# MVP Scope

## Must Build

### 1. Data Layer

Use real testnet data if available. If integration is blocked or sparse, use a documented simulator with realistic assumptions.

Minimum data fields:

- current BTC price
- expiry list
- strike list
- binary prices
- implied volatility or SVI-derived values
- PLP TVL or simulated TVL
- PLP exposure by strike and expiry

### 2. PLP Risk Dashboard

Show:

- TVL
- utilization
- max payout liability
- active expiries
- largest risk strike
- risk score
- exposure heatmap

### 3. Volatility Surface View

Minimum:

- IV heatmap by strike and expiry

Better:

- surface chart
- smile chart per expiry
- current high-risk region annotation

### 4. Scenario Simulator

Run:

- BTC +5%
- BTC -5%
- BTC +3 sigma
- BTC -3 sigma
- volatility spike
- near-expiry shock

Output:

- unhedged PLP PnL
- max loss
- hedge cost
- hedged PLP PnL
- tail-loss reduction

### 5. AI Hedge Recommendation

The AI should recommend:

- whether to hedge
- which OTM binary hedge to buy
- suggested hedge notional
- hedge cost
- expected loss reduction
- trade-off between lower APY and lower tail risk

### 6. PTB Preview And Execution

Minimum:

- human-readable PTB preview for minting the hedge
- wallet-gated execution state
- clear readiness checks for wallet, dUSDC, `PredictManager`, oracle, and coin
  inputs

Current live milestone:

- small wallet-signed DeepBook Predict testnet mint probe

Next required depth:

- post-mint position and manager readback
- quote-aware hedge sizing instead of a fixed probe

### 7. Risk Report

Export or render:

- current exposure
- stress scenarios
- hedge recommendation
- on-chain transaction result when available
- executed position summary when readback is available
- before/after PnL
- assumptions

## Should Build

- saved scenario reports
- downloadable Markdown risk report
- demo seed data generator
- deterministic sample dataset
- clear "simulated vs live" data labels

## Stretch

- real testnet Predict data from public API
- strategy backtest
- Polymarket / Hyperliquid comparison
- full vault share token
- settlement follow-up after expiry

## Avoid

- full automated vault
- production-grade market maker
- cross-protocol margin loop
- complex real-money trading claims
- profitability marketing
