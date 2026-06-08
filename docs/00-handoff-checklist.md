# Handoff Checklist

Use this checklist when starting development on another computer.

## First 30 Minutes

1. Read `README.md`.
2. Read `docs/01-product-brief.md`.
3. Read `docs/03-mvp-scope.md`.
4. Read `docs/05-data-and-simulation-model.md`.
5. Start with a simulation-first app. Do not start with chain integration.

## First Build Target

Build this first:

```text
seed market data
  -> exposure heatmap
  -> scenario simulator
  -> unhedged vs hedged PnL
```

Only after this works, add:

```text
AI hedge explanation
  -> PTB preview
  -> risk report
```

## Do Not Start With

- full vault contract
- real trading bot
- cross-protocol margin strategy
- complicated external data integrations
- production-grade wallet flow

## Minimum Demo To Protect

The demo must always work even if testnet integration is blocked:

1. show PLP exposure by strike and expiry
2. run stress scenario
3. show unhedged max loss
4. generate hedge recommendation
5. show hedged max loss and tail-loss reduction
6. generate PTB preview
7. export risk report

## Stretch Order

1. live Predict API data
2. Sui SDK transaction skeleton
3. real testnet object IDs
4. real dUSDC hedge mint

