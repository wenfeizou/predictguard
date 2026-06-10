# Handoff Checklist

Use this checklist when starting development on another computer.

## First 30 Minutes

1. Read `README.md`.
2. Read `docs/01-product-brief.md`.
3. Read `docs/03-mvp-scope.md`.
4. Read `docs/05-data-and-simulation-model.md`.
5. Read `docs/16-concept-glossary.md` for project terminology.
6. Confirm the local app still runs and the latest testnet config is current.

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

Current implementation has already moved beyond this first target by proving a
wallet-signed DeepBook Predict testnet mint probe. Protect the simulation-first
flow, but continue development from the live execution milestone.

## Do Not Start With

- full vault contract
- real trading bot
- cross-protocol margin strategy
- complicated external data integrations
- production-grade wallet flow
- full production hedge automation before quote-aware sizing and readback work
  are complete

## Minimum Demo To Protect

The demo must always work even if testnet integration is blocked:

1. show PLP exposure by strike and expiry
2. run stress scenario
3. show unhedged max loss
4. generate hedge recommendation
5. show hedged max loss and tail-loss reduction
6. generate PTB preview
7. optionally execute the wallet-signed Predict mint probe
8. show transaction digest or position/readback status
9. export risk report

## Stretch Order

1. live Predict API data
2. Sui SDK transaction skeleton
3. real testnet object IDs
4. real dUSDC hedge mint
5. post-mint position and manager readback
6. quote-aware hedge sizing
