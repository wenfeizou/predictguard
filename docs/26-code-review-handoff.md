# Code Review Handoff

This document is the review-oriented summary for PredictGuard. Use it before
manual code review to understand what has been built, where it lives, what is
known to be incomplete, and which assumptions deserve scrutiny.

## Current Completion

| Area | Status | Review Meaning |
| --- | --- | --- |
| Competition MVP / judge demo | About `99%` | Core user journey is implemented and explainable. |
| DeepBook Predict lifecycle extension | About `98%` | Mint, readback, redeem evidence, history discovery, and settlement accounting are present. |
| Commercial production product | About `55-65%` | Needs full indexer, persistence, institutional risk model, monitoring, and multi-account workflows. |

## Product Scope

PredictGuard is the PLP / LP / vault-builder risk workflow for DeepBook
Predict.

It should be reviewed as:

```text
risk diagnosis
-> hedge recommendation
-> wallet execution
-> manager readback
-> redeem evidence
-> settlement accounting
-> report export
```

It should not be reviewed as a generic prediction market dashboard.

## Completed Feature Inventory

### Risk Dashboard

Completed:

- PLP overview with TVL, utilization, risk score, max payout liability, and
  worst scenario PnL.
- Exposure heatmap by strike and expiry.
- Volatility surface / IV heatmap.
- Stress scenario simulator.
- Unhedged, recommended, and executed stress comparison.

Key files:

- `src/lib/risk/engine.ts`
- `src/lib/risk/hedge.ts`
- `src/lib/risk/executedStress.ts`
- `src/lib/data/seed.ts`
- `src/app/page.tsx`

Review focus:

- Confirm risk calculations are presented as competition-grade simulation, not
  institutional production VaR.
- Confirm seeded/simulated data boundaries are clear in UI and report.

### Hedge Recommendation And Sizing

Completed:

- Hedge recommendation with side, strike, expiry, notional, cost, and expected
  tail-loss reduction.
- Demo controls for side, oracle/expiry, sizing mode, and max budget.
- Probe sizing and quote-aware sizing.
- Budget usage and cost/protection display.

Key files:

- `src/lib/risk/hedge.ts`
- `src/lib/ptb/hedgeTransaction.ts`
- `src/app/ptb-execute.tsx`
- `src/app/page.tsx`

Review focus:

- Quote-aware sizing currently uses available ask-price evidence, not a full
  live quote book.
- Probe mode is intentionally conservative.

### Wallet And PTB Execution

Completed:

- Sui testnet wallet connection through `@mysten/dapp-kit-react`.
- Wallet readiness checks for network, dUSDC, dUSDC coin, and
  `PredictManager`.
- Real Sui `Transaction` instance passed to
  `dAppKit.signAndExecuteTransaction({ transaction })`.
- Wallet execution status path: building, wallet review, submitted, confirmed,
  failed.
- SuiVision digest link after successful execution.

Key files:

- `src/app/wallet-readiness.tsx`
- `src/app/ptb-execute.tsx`
- `src/lib/ptb/hedgeTransaction.ts`
- `src/lib/predict/config.ts`

Review focus:

- The app must pass the `Transaction` instance to the wallet; it should not
  pre-build transaction bytes for normal wallet execution.
- Confirm failure states remain clear for Move aborts and wallet rejection.

### DeepBook Predict Mint Readback

Completed:

- Parse `PositionMinted` event after wallet execution.
- Display side, strike, quantity, cost, ask price, manager, oracle, digest.
- Store recent local mint execution history in browser localStorage.
- Compare recommended hedge vs actually executed hedge.

Key files:

- `src/lib/predict/execution.ts`
- `src/app/ptb-execute.tsx`
- `src/app/page.tsx`
- `src/lib/report/markdown.ts`

Review focus:

- localStorage is demo continuity, not chain source of truth.
- Mint cost for realized PnL depends on local history until broader mint
  history discovery is implemented.

### Manager Inventory Readback

Completed:

- Direct Sui gRPC read of `PredictManager`.
- Dynamic-field readback for balances and positions tables.
- Decode `MarketKey` into oracle ID, expiry, strike, direction, and side.
- Classify positions as active, expired, zero quantity, or unknown.

Key files:

- `src/lib/predict/managerReadback.ts`
- `src/app/api/predict/manager/route.ts`
- `src/app/wallet-readiness.tsx`
- `src/app/page.tsx`

Review focus:

- `MarketKey` BCS decoding is protocol-layout dependent.
- DeepBook Predict is testnet; object layout and package IDs can change.

### Redeem Evidence And Permissionless Redeem

Completed:

- Parse `PositionRedeemed` events.
- Support transactions with multiple `PositionRedeemed` events.
- Match evidence by manager/oracle/side/strike.
- Explain `owner != executor` as external executor / permissionless redeem,
  not theft.
- Display payout, quantity, bid price, settled flag, owner, executor, digest.

Key files:

- `src/lib/predict/execution.ts`
- `src/lib/predict/redeemReadback.ts`
- `src/app/api/predict/redeem-evidence/route.ts`
- `src/app/page.tsx`
- `docs/24-redeem-investigation-log.md`
- `docs/25-redeem-strategy-tradeoff.md`

Review focus:

- Confirm the UI does not imply executor owns the payout.
- Confirm multi-event transactions cannot attribute another manager's event to
  the current user.

### Redeem History Discovery

Completed:

- Bounded Sui GraphQL event scan for recent `PositionRedeemed` events.
- Filter event JSON by `manager_id`.
- Collect matching digests.
- Refetch matching transactions through Sui gRPC.
- Reuse normalized redeem parser.
- Current manager discovery found two digests during validation:
  - `FxhZD6PLrPKDhgsiJAXZBvoTrMVS6YhWVZC7D5drvhps`
  - `57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5`

Key files:

- `src/lib/predict/redeemHistoryReadback.ts`
- `src/app/api/predict/redeem-history/route.ts`
- `src/app/page.tsx`
- `src/lib/report/markdown.ts`

Review focus:

- This is not a production indexer.
- Scan is bounded by page size and max pages.
- Review assumptions around GraphQL event ordering, event JSON shape, and
  `manager_id` field reliability.
- Confirm fallback digest behavior is acceptable for demo.

### Settlement Accounting

Completed:

- Summary counts:
  - active positions
  - expired positions
  - zero-quantity positions
  - redeemed positions with linked evidence
  - evidence-missing positions
  - external executor redeems
- Totals:
  - current quantity
  - redeemed quantity
  - redeemed payout
  - claimed payout from loaded evidence
  - unresolved quantity
  - local minted quantity
  - local mint cost
  - realized hedge PnL
- Report output for settlement accounting and redeem history discovery.

Key files:

- `src/app/page.tsx`
- `src/lib/report/markdown.ts`
- `src/lib/predict/redeemHistoryReadback.ts`
- `src/lib/predict/execution.ts`

Review focus:

- Realized hedge PnL currently equals:

```text
redeemed payout - local mint cost
```

- This is valid only for loaded evidence and local mint history.
- `unclaimed payout` remains `Unknown`.
- Full claim/unclaim reconciliation is not implemented.

### Markdown Report

Completed:

- Exportable report includes:
  - workflow status
  - live testnet context
  - risk metrics
  - scenario results
  - sizing evidence
  - on-chain execution
  - manager/account summary
  - settlement accounting
  - redeem history discovery
  - lifecycle / redeem evidence
  - redeem PTB preview

Key files:

- `src/lib/report/markdown.ts`
- `src/app/page.tsx`

Review focus:

- Report should distinguish proved chain evidence from unknown or bounded
  evidence.
- Report should not overclaim production completeness.

## Known Boundaries

1. **No production indexer yet**

   Redeem history discovery is a bounded GraphQL scan. It is stronger than one
   hardcoded digest, but older history can still be missed.

2. **Mint history is local**

   Browser localStorage records current-browser mint executions. A full product
   needs chain/indexer-backed mint history.

3. **Realized PnL is evidence-scoped**

   PnL only reflects loaded redeem payout and local mint cost.

4. **Unclaimed payout is unknown**

   PredictGuard v1 does not fully reconcile claimed vs unclaimed payout.

5. **Wallet-signed redeem is stretch**

   DeepBook Predict allows `redeem_permissionless`, so external executors can
   redeem settled positions before a user manually signs. Product focus moved
   to lifecycle evidence and accounting.

6. **Risk model is not institutional-grade**

   The current model is sufficient for competition demo and product direction,
   but not a production risk engine.

7. **Testnet dependencies can change**

   DeepBook Predict package IDs, object IDs, layouts, and entrypoints are
   versioned dependencies and must be rechecked before final submission.

## Suggested Code Review Order

1. `README.md`
2. `docs/21-concept-map-cn-en.md`
3. `src/lib/predict/config.ts`
4. `src/lib/ptb/hedgeTransaction.ts`
5. `src/app/ptb-execute.tsx`
6. `src/lib/predict/execution.ts`
7. `src/lib/predict/managerReadback.ts`
8. `src/lib/predict/redeemHistoryReadback.ts`
9. `src/app/page.tsx`
10. `src/lib/report/markdown.ts`

## Review Questions

- Does every UI claim have either chain evidence, simulation evidence, or a
  clear boundary label?
- Does redeem event matching prevent false attribution across managers?
- Is bounded GraphQL discovery enough for competition, or should final demo
  mention that a custom indexer is the production path?
- Does the settlement accounting panel make `Unknown` states clear enough?
- Are wallet execution failures understandable to a user?
- Does the README communicate the project as a DeepBook Predict risk workflow,
  not a generic dashboard?

## Validation Commands

Run before final review:

```sh
bun run lint
bun run typecheck
bun run build
```

Optional live check:

```sh
bun -e \"import { fetchPredictRedeemHistoryReadback } from './src/lib/predict/redeemHistoryReadback.ts'; const r = await fetchPredictRedeemHistoryReadback('0x3cfb9e6c6f1102ef28d20e3beed73ac20bbe0e1451eeb86cecd28e52e3fc77e2'); console.log(JSON.stringify({ digests: r.digests, scan: r.scan }, null, 2));\"
```
