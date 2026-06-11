# Depth Roadmap

This document tracks the depth areas PredictGuard should strengthen before the
final competition submission. It focuses on why the project may otherwise look
too simple, what to build, and how each item improves competitiveness.

## Current Concern

PredictGuard progressed quickly because the core architecture is intentionally
compact:

- one main risk workflow page
- no full vault contract
- no production backend
- no automated market-making bot
- no custom pricing engine

This is not automatically bad. The project already proves meaningful DeepBook
Predict integration: wallet signing, dUSDC, `PredictManager`, PTB construction,
live mint, `PositionMinted` readback, quote-aware sizing, and risk report
binding.

The remaining risk is perception: if the final demo only shows "dashboard plus
mint button", judges may view the project as useful but not deep enough. The
goal is to show protocol depth, risk model depth, and product-loop depth without
turning the project into a large unfocused system.

## Depth Direction 1: Manager And Position Inventory

Status: v1 completed.

Why this matters:

- Current readback explains the latest mint transaction.
- It does not yet show the user's complete current Predict state.
- Judges may ask: "Where is the position now? What else does the manager hold?"

How to strengthen it:

- Completed:
  - read manager state through Sui gRPC
  - show remaining manager-side dUSDC balance
  - decode `MarketKey` table entries into oracle, expiry, strike, and direction
  - classify positions as active, expired, zero quantity, or unknown
  - distinguish local transaction evidence from direct manager object readback
- Remaining:
  - reconstruct final settlement outcome and claimable/claimed amounts
  - improve historical position lifecycle across old transactions or indexer data

Expected demo improvement:

The app can say not only "this transaction succeeded", but also "this is the
current Predict account state after execution."

## Depth Direction 2: Execution-Adjusted Risk Metrics

Status: v1 completed.

Why this matters:

- Current report records the executed position and cost.
- It does not yet quantify how much of the recommended hedge was actually
  covered.
- Risk management products need metrics, not only transaction evidence.

How to strengthen it:

- Completed:
  - compare recommended hedge notional with executed quantity
  - show `coverage ratio`
  - show `executed gap`
  - show `actual cost ratio`
  - show `budget usage`
  - estimate manager-side remaining dUSDC from local execution evidence
- Remaining:
  - update multi-scenario before/after charts with the actual executed position
  - reconcile local execution history with direct manager readback after every
    wallet action

Candidate metrics:

```text
coverage ratio = executed quantity / recommended hedge notional
executed cost ratio = actual cost / recommended hedge notional
budget usage = actual cost / selected max budget
```

Expected demo improvement:

The app can answer: "We recommended this hedge, executed this much of it, paid
this cost, and covered this percentage of the target protection."

## Depth Direction 3: Quote Source Upgrade

Status: v1 completed with last executed ask price; deeper source pending.

Why this matters:

- Current quote-aware sizing uses the last successful mint's ask price.
- This is practical and demo-safe, but not a full live quote engine.
- Judges may expect current pricing rather than previous execution pricing.

How to strengthen it:

- Investigate whether the Predict public API exposes market pricing or ask data.
- Investigate whether market pricing can be read from on-chain state or
  simulated with available oracle/volatility inputs.
- Add a clear label:
  - `Last executed ask`
  - `Live quote`
  - `Simulated quote`
- Keep probe mode as fallback when quote data is missing or stale.

Expected demo improvement:

The sizing logic becomes easier to defend: it is based on an explicit quote
source, not an implicit previous trade.

## Depth Direction 4: Scenario And Stress Depth

Status: partially implemented with deterministic scenarios.

Why this matters:

- The current scenario simulator is useful, but still relatively simple.
- More scenario depth helps judges feel the risk model is intentional.

How to strengthen it:

- Add a small scenario comparison table for:
  - BTC up
  - BTC down
  - volatility spike
  - near-expiry shock
- Show executed hedge impact across multiple scenarios.
- Add a "worst case before vs after execution" summary.
- Add one lightweight stress test narrative rather than many complex models.

Expected demo improvement:

Judges can see that the hedge is not arbitrary; it changes downside behavior
across scenarios.

## Depth Direction 5: Lightweight Backtest Or Replay

Status: optional.

Why this matters:

- Backtests increase credibility, but can expand scope quickly.
- A lightweight replay may be enough for a hackathon demo.

How to strengthen it:

- Use a small deterministic set of historical-like BTC paths.
- Replay the current recommendation logic over those paths.
- Show simple output:
  - unhedged max drawdown
  - hedged max drawdown
  - hedge cost
  - number of protected scenarios

Expected demo improvement:

The project looks more like risk infrastructure and less like a single static
dashboard.

## Depth Direction 6: Demo And Judge-Facing Story

Status: v1 completed; final media pending.

Why this matters:

- A technically sound project can lose impact if judges cannot understand it
  quickly.
- The demo should emphasize risk workflow, not raw feature count.

How to strengthen it:

- Completed:
  - added a `Demo Flow` panel in the UI
  - added a README judge demo section
  - added `docs/18-judge-demo-script.md`
  - added workflow status to exported Markdown reports
- Remaining:
  - add screenshots for each step
  - record the 5-7 minute final demo video
  - verify official contract information shortly before submission

Expected demo improvement:

The final submission reads as a complete DeepBook Predict risk management
workflow rather than a collection of technical pieces.

## Depth Direction 7: Position Lifecycle And Redeem Evidence

Status: planned.

Why this matters:

- PredictGuard currently proves mint, manager readback, and position status.
- A complete risk workflow should eventually explain what happens after expiry:
  whether a position is redeemable, redeemed, or still missing settlement
  evidence.
- This strengthens the project without changing its positioning, as long as
  settlement/redeem is framed as hedge lifecycle tracking rather than a separate
  keeper product.

How to strengthen it:

- Add a settlement readiness panel for decoded manager positions.
- Parse `PositionRedeemed` events.
- Add a guarded redeem PTB preview.
- Enable wallet-signed redeem only when readiness is clear.
- Add post-settlement realized result reporting.

Expected demo improvement:

The app can tell a fuller story: "We diagnosed risk, minted a hedge, confirmed
the position, tracked its lifecycle, and recorded realized settlement evidence."

## Priority Recommendation

Highest priority:

1. Final submission media
2. Position lifecycle and redeem evidence
3. Scenario and stress depth

Medium priority:

4. Quote source upgrade
5. Historical manager/indexer depth

Optional if time allows:

6. Lightweight backtest or replay

## Completion Criteria

PredictGuard should feel deep enough for competition when it can demonstrate:

- a real wallet-signed Predict mint: completed
- readable manager/position evidence: v1 completed
- quote-aware sizing with explicit quote source: v1 completed with last
  executed ask price; live quote source pending
- executed-vs-recommended risk metrics: v1 completed
- scenario comparison showing before/after impact: partially completed
- a clear judge-facing story: v1 completed
- position lifecycle / redeem evidence: planned

At that point, the project does not need to be a large system. It needs to be a
focused, credible, DeepBook Predict-native risk workflow.
