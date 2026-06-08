# System Architecture

## Recommended Stack

Default:

- Next.js / React frontend
- TypeScript
- lightweight API routes
- local JSON or SQLite for saved reports
- charting with Recharts, ECharts, or Plotly
- Sui TypeScript SDK for PTB preview / testnet integration
- OpenAI or compatible LLM for hedge explanation

## Architecture

```text
Market / Predict Data
  -> Data Adapter
  -> Normalized Market State
  -> Risk Engine
      -> Exposure Matrix
      -> Scenario Simulator
      -> Hedge Optimizer
  -> AI Hedge Copilot
  -> PTB Preview Builder
  -> UI Dashboard
  -> Risk Report Exporter
```

## Modules

### Data Adapter

Responsibilities:

- fetch live Predict data when possible
- load simulated seed data when live data unavailable
- normalize strikes, expiries, prices, IV, exposure
- label data source clearly

### Risk Engine

Responsibilities:

- calculate exposure by strike and expiry
- calculate max payout liability
- estimate unhedged PnL under scenarios
- estimate hedged PnL
- compute tail-loss reduction
- produce risk score

### Hedge Optimizer

Responsibilities:

- find candidate OTM binary hedges
- rank by loss reduction per dUSDC cost
- respect simple constraints:
  - max hedge cost
  - target loss reduction
  - expiry match
  - liquidity availability

### AI Hedge Copilot

Responsibilities:

- explain risk in plain English
- explain why hedge is recommended or skipped
- summarize assumptions
- produce final report narrative

### PTB Preview Builder

Responsibilities:

- transform hedge recommendation into human-readable transaction steps
- show expected inputs and outputs
- include package/function placeholders
- optionally generate Sui SDK transaction code once integration details are confirmed

### UI Dashboard

Pages:

- Overview
- Exposure
- Vol Surface
- Scenario Simulator
- Hedge Copilot
- PTB Preview
- Risk Report

