# Three-Week Build Plan

## Week 1: Simulation-First Product

Goal:

> A complete offline demo with seeded data.

Tasks:

- scaffold app
- create deterministic sample data
- implement risk engine
- implement exposure heatmap
- implement scenario simulator
- implement basic dashboard layout
- implement report page

Exit criteria:

- app shows PLP exposure
- stress scenarios produce before/after PnL
- demo can run without chain data

## Week 2: AI Copilot and PTB Preview

Goal:

> Turn dashboard into actionable risk workflow.

Tasks:

- implement hedge candidate ranking
- implement AI recommendation prompt and schema
- implement copilot panel
- implement PTB preview builder
- implement report export
- improve vol surface / IV heatmap
- add data source labels and assumptions

Exit criteria:

- AI explains risk and recommends hedge
- PTB preview displays transaction steps
- risk report is exportable or shareable

## Week 3: Real Integration and Polish

Goal:

> Add as much real DeepBook Predict integration as feasible and polish demo.

Tasks:

- confirm latest official Predict docs and package branch
- request dUSDC if needed
- wire config file for testnet IDs
- fetch public server data if available
- attempt tiny testnet hedge mint
- polish UI
- record demo
- write README and submission text
- prepare fallback demo path

Exit criteria:

- primary demo works even if testnet is flaky
- real data or real tx is included if feasible
- project has clear judging narrative

## Development Priorities

Do first:

- simulator
- risk engine
- dashboard
- AI recommendation
- PTB preview

Do later:

- live data
- real transaction
- advanced charts
- backtest

Do not do:

- full vault contract
- production trading bot
- complex margin integration

