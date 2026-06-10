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

Status: not started.

Why this matters:

- Current readback explains the latest mint transaction.
- It does not yet show the user's complete current Predict state.
- Judges may ask: "Where is the position now? What else does the manager hold?"

How to strengthen it:

- Read manager state after execution.
- Show remaining manager-side dUSDC balance.
- Show open positions or a best-effort position inventory.
- Distinguish latest transaction evidence from total current exposure.
- If direct inventory is hard, document the protocol/indexing limitation and
  show the latest known on-chain event history as a fallback.

Expected demo improvement:

The app can say not only "this transaction succeeded", but also "this is the
current Predict account state after execution."

## Depth Direction 2: Execution-Adjusted Risk Metrics

Status: not started.

Why this matters:

- Current report records the executed position and cost.
- It does not yet quantify how much of the recommended hedge was actually
  covered.
- Risk management products need metrics, not only transaction evidence.

How to strengthen it:

- Compare recommended hedge notional with actual minted quantity.
- Add `coverage ratio`.
- Add `executed vs recommended gap`.
- Add `actual hedge cost`.
- Add `cost-to-protection ratio` using executed cost, not only estimated cost.
- Update before/after scenario results using actual minted quantity where
  possible.

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

Status: pending final submission work.

Why this matters:

- A technically sound project can lose impact if judges cannot understand it
  quickly.
- The demo should emphasize risk workflow, not raw feature count.

How to strengthen it:

- Prepare a 5-7 minute script:
  1. PLP risk problem
  2. exposure and stress loss
  3. hedge recommendation
  4. quote-aware sizing
  5. wallet execution
  6. position confirmation
  7. risk report evidence
- Add screenshots for each step.
- Add one concise pitch paragraph.
- Make simulated vs live testnet labels impossible to miss.

Expected demo improvement:

The final submission reads as a complete DeepBook Predict risk management
workflow rather than a collection of technical pieces.

## Priority Recommendation

Highest priority:

1. Manager and position inventory
2. Execution-adjusted risk metrics
3. Demo and judge-facing story

Medium priority:

4. Quote source upgrade
5. Scenario and stress depth

Optional if time allows:

6. Lightweight backtest or replay

## Completion Criteria

PredictGuard should feel deep enough for competition when it can demonstrate:

- a real wallet-signed Predict mint
- readable manager/position evidence
- quote-aware sizing with explicit quote source
- executed-vs-recommended risk metrics
- scenario comparison showing before/after impact
- a clear judge-facing story

At that point, the project does not need to be a large system. It needs to be a
focused, credible, DeepBook Predict-native risk workflow.
