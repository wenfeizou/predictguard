# Technical Deep Dive

This document makes PredictGuard's technical depth explicit for judges,
reviewers, and future development. The page UI intentionally presents a simple
workflow, but the implementation already covers several DeepBook Predict-native
integration layers.

## Current Technical Thesis

PredictGuard is not a generic prediction market dashboard. Its technical value
is the full DeepBook Predict risk loop:

```text
simulate PLP risk
  -> recommend a hedge
  -> build a wallet-signed Predict PTB
  -> mint a real testnet position
  -> parse execution evidence
  -> read manager inventory from chain
  -> decode position identity
  -> compare executed hedge impact across scenarios
  -> export judge-readable evidence
```

The project stays compact on purpose. It does not add a custom vault contract,
production backend, or trading bot before the protocol workflow is credible.

## Layer 1: Protocol-Native PTB Construction

Relevant code:

- `src/lib/ptb/hedgeTransaction.ts`
- `src/app/ptb-execute.tsx`

PredictGuard builds a real Sui `Transaction` instead of showing a fake button.
The transaction follows the official DeepBook Predict testnet flow:

```text
split dUSDC coin
  -> predict_manager::deposit<dUSDC>
  -> market_key::new
  -> predict::mint<dUSDC>
```

Important implementation points:

- The app hands the `Transaction` instance to the connected wallet through
  `dAppKit.signAndExecuteTransaction({ transaction })`.
- The wallet owns signing, gas selection, and final user approval.
- The UI blocks signing until readiness reaches `ready-to-sign`.
- Readiness checks include wallet connection, testnet network, dUSDC balance,
  dUSDC coin object, `PredictManager`, oracle object, expiry, execution strike,
  and budget.
- Before signing, wallet execution refreshes Predict status and rebuilds the
  transaction from the newest oracle context to reduce stale-oracle failures.

Why this is technically meaningful:

- The app is integrated with the real DeepBook Predict contract surface.
- It respects Sui's wallet and PTB model.
- It proves the correct call sequence rather than relying on a mock execution.

## Layer 2: On-Chain Execution Evidence

Relevant code:

- `src/lib/predict/execution.ts`
- `src/app/ptb-execute.tsx`

After the wallet signs, PredictGuard waits for the transaction with events,
effects, and balance changes. It parses the `predict::PositionMinted` event into
a normalized `PredictMintExecutionSummary`.

Captured execution fields include:

- transaction digest
- manager object
- oracle object
- side
- strike
- expiry
- quantity
- actual cost
- ask price
- dUSDC wallet balance change

Why this is technically meaningful:

- The product does not stop at "transaction submitted".
- The confirmed event becomes product state, report evidence, and sizing input.
- The actual cost and ask price are read from chain execution, not invented by
  the frontend.

## Layer 3: Quote-Aware Sizing V1

Relevant code:

- `src/lib/ptb/hedgeTransaction.ts`

PredictGuard supports two sizing modes:

- `probe`: fixed small mint when there is no usable quote evidence.
- `quote-aware`: budget-aware quantity sizing when an ask price is available.

The current v1 sizing model uses the latest successful wallet mint's ask price:

```text
available budget = max hedge budget - safety buffer
quantity = available budget / ask price
estimated cost = quantity * ask price
```

The UI and report label quote evidence explicitly:

- quote source: `last-executed-ask` or `none`
- quote freshness: `available` or `unavailable`
- quote explanation: current source is execution evidence, not a guaranteed live
  quote

Why this is technically meaningful:

- The app has moved beyond a hard-coded demo quantity.
- It avoids pretending to have a live quote engine before one exists.
- It keeps probe mode as a safe fallback when quote evidence is missing.

Current limitation:

- This is not a full live quote engine. A deeper version should use a direct
  Predict pricing API, on-chain pricing read, or a carefully replicated pricing
  model when the reliable source is available.

## Layer 4: Direct Manager Inventory Readback

Relevant code:

- `src/lib/predict/managerReadback.ts`
- `src/app/api/predict/manager/route.ts`
- `src/app/wallet-readiness.tsx`

PredictGuard reads the connected user's `PredictManager` object directly from
Sui testnet through `SuiGrpcClient`.

It parses:

- manager object version
- object digest
- previous transaction
- manager owner
- balance manager ID
- balances table ID
- positions table ID
- range positions table ID
- dUSDC balance table entries
- position table entries
- range position table entry count

Why this is technically meaningful:

- The app has direct on-chain manager evidence, not only local browser history.
- It reads Sui dynamic fields, which are how the manager stores table entries.
- It can explain manager-side remaining dUSDC after a mint.

## Layer 5: MarketKey BCS Decoding

Relevant code:

- `src/lib/predict/managerReadback.ts`

Official DeepBook Predict `MarketKey` layout from the `predict-testnet-4-16`
source:

```text
oracle_id: ID
expiry: u64
strike: u64
direction: u8
```

PredictGuard decodes the BCS-encoded dynamic-field name into:

- oracle ID
- expiry timestamp
- raw scaled strike
- readable strike
- direction code
- direction: `UP`, `DOWN`, or `UNKNOWN`
- product side: `YES`, `NO`, or `UNKNOWN`
- raw bytes hex for auditability

Current constants:

- BCS length: `49` bytes
- oracle ID: `32` bytes
- expiry: `8` bytes
- strike: `8` bytes
- direction: `1` byte
- `UP = 0`
- `DOWN = 1`
- strike scale: `1e9`

Why this is technically meaningful:

- Manager positions are stored as low-level table rows:

```text
MarketKey -> quantity
```

- Without decoding, the app could only show an unreadable dynamic field.
- With decoding, the UI can reconstruct readable positions such as
  `YES 63,187`.

## Layer 6: Settlement-Aware Position Reconstruction V1

Relevant code:

- `src/lib/predict/managerReadback.ts`
- `docs/20-settlement-reconstruction-feasibility.md`

PredictGuard classifies decoded manager positions as:

- `active`: quantity is greater than zero and expiry is still in the future.
- `expired`: quantity is greater than zero and expiry is in the past.
- `zero`: quantity is zero.
- `unknown`: key or quantity cannot be decoded reliably.

Active quantity is separated from total stored quantity. This matters because
the official `predict_manager::decrease_position` reduces the stored quantity
but does not remove the `MarketKey` table entry, so zero-quantity entries can
remain visible in manager storage.

Why this is technically meaningful:

- The app avoids overstating current hedge coverage.
- It explains why old or zero positions remain visible in chain storage.
- It creates the first settlement-aware readback layer without claiming full
  settlement accounting.

Current limitation:

- Full settlement accounting is not implemented. It requires
  `PositionRedeemed` event history plus oracle and vault settlement readback.

## Layer 7: Executed Stress Comparison

Relevant code:

- `src/lib/risk/executedStress.ts`
- `src/lib/risk/engine.ts`

PredictGuard converts the latest wallet-executed mint into a conservative hedge
candidate and reruns scenario analysis.

It compares:

- unhedged PnL
- recommended hedge PnL
- executed hedge PnL
- executed tail-loss reduction
- worst unhedged PnL
- worst executed PnL
- worst-case improvement

Why this is technically meaningful:

- The product links a real chain transaction back to risk outcomes.
- It distinguishes recommended hedge notional from actually executed coverage.
- It shows partial coverage honestly instead of treating a small mint as a full
  hedge.

## Layer 8: Report And Judge Evidence

Relevant code:

- `src/lib/report/markdown.ts`

The exported report joins together:

- workflow status
- simulated PLP risk context
- scenario results
- executed stress comparison
- hedge recommendation
- PTB readiness and sizing evidence
- on-chain execution evidence
- direct manager readback evidence
- decoded position entries
- known limitations

Why this is technically meaningful:

- Judges can verify the end-to-end story from a single artifact.
- The report explains what is real, what is simulated, and what remains pending.
- It makes the project auditable instead of only visually impressive.

## Why The UI May Feel Simpler Than The System

The main page intentionally looks like a workflow:

```text
Demo -> Risk -> Hedge -> Execute -> Readback -> Report
```

That simplicity is product design, not lack of implementation depth. The deeper
work is hidden behind:

- PTB construction rules
- wallet readiness gating
- official contract flow alignment
- chain event parsing
- gRPC manager reads
- dynamic-field table traversal
- BCS decoding
- settlement-aware status reconstruction
- executed scenario comparison
- report evidence generation

## Remaining Technical Depth Opportunities

Highest-value next depth items:

1. Live quote source upgrade

   Replace `last-executed-ask` with a direct live quote when the Predict API,
   on-chain state, or replicated pricing model is reliable enough.

2. Full settlement accounting

   Reconstruct `PositionRedeemed` history, winning side, settlement price,
   claimable amount, claimed amount, and unclaimed amount.

3. Historical manager lifecycle

   Add indexer-backed history for all manager mints and redeems, not only latest
   transaction evidence and current manager state.

4. Lightweight replay or backtest

   Replay the current hedge logic over deterministic historical-like paths to
   show max drawdown, hedge cost, and protected scenarios.

5. Commercial alpha backend

   Add a database, indexer, authentication, saved reports, team accounts, alerts,
   and scheduled risk snapshots. This is a commercial-product step, not required
   for the current competition MVP.

## Current Assessment

Competition MVP / judge-demo target:

- Completion: about `95%`
- Strongest evidence: real wallet-signed Predict mint, direct manager readback,
  MarketKey decoding, settlement-aware position status, executed stress
  comparison, and judge-facing report.

Commercial production target:

- Completion: about `25-35%`
- Main missing pieces: backend persistence, indexer history, live quote source,
  production risk model, settlement accounting, alerts, multi-user workspace,
  and operational monitoring.

Key framing:

PredictGuard has enough technical depth for a focused hackathon MVP if the demo
emphasizes the protocol workflow and readback evidence. It should not be framed
as a finished institutional risk platform yet.
