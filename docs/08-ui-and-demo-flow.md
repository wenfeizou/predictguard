# UI and Demo Flow

## UI Pages

### 1. Overview

Show:

- data source label
- BTC spot
- PLP TVL
- utilization
- risk score
- largest exposure
- recommended action

### 2. Exposure

Show:

- strike x expiry heatmap
- max payout liability
- YES/NO exposure breakdown
- concentration warnings

### 3. Vol Surface

Show:

- IV heatmap or 3D surface
- smile chart by expiry
- highlighted abnormal regions
- plain-English explanation

### 4. Scenario Simulator

Show:

- scenario selector
- unhedged PnL
- hedged PnL
- tail-loss reduction
- before/after chart

### 5. AI Hedge Copilot

Show:

- risk summary
- recommended hedge
- cost
- expected effect
- tradeoffs
- assumptions

### 6. PTB Preview

Show:

- step-by-step transaction preview
- required objects/assets
- max cost
- expected output
- execution status if real testnet tx works

### 7. Risk Report

Show:

- executive summary
- metrics table
- charts
- recommendation
- assumptions
- export button

## Demo Script

1. Open overview and introduce PredictGuard as the risk layer.
2. Show PLP exposure concentration.
3. Open vol surface and explain current risk region.
4. Run BTC +5% stress scenario.
5. Show unhedged max loss.
6. Ask AI hedge copilot for recommendation.
7. Show OTM hedge recommendation.
8. Compare unhedged vs hedged PnL.
9. Open PTB preview.
10. Export risk report.

## Example Demo Numbers

Use deterministic sample data:

- TVL: `10,000 dUSDC`
- utilization: `42%`
- largest exposure: `BTC > 73,000 / 15m`
- unhedged max loss: `-180 dUSDC`
- hedge cost: `12 dUSDC`
- hedged max loss: `-95 dUSDC`
- tail-loss reduction: `47%`

## Visual Priority

The three most important visuals:

1. exposure heatmap
2. before/after stress PnL
3. PTB preview

If time is limited, prioritize these over fancy 3D charts.

