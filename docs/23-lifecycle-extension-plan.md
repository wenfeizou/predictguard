# Lifecycle Extension Plan

This document records the next positioning and development plan for extending
PredictGuard with settlement and redeem lifecycle capabilities.

## Updated Positioning

Current concise positioning:

> PredictGuard is the DeepBook Predict position risk lifecycle manager for PLPs,
> LPs, vault builders, and strategy developers.

Chinese positioning:

> PredictGuard 是面向 PLP、LP、vault builder 和策略开发者的 DeepBook Predict
> 仓位风险生命周期管理工具。

The project remains a risk management workflow. Settlement and redeem support do
not turn PredictGuard into a generic keeper bot. They complete the risk loop
after a hedge is minted.

## Product Boundary

PredictGuard should own this flow:

```text
risk identification
  -> hedge recommendation
  -> wallet-signed mint
  -> manager readback
  -> expiry / settlement status
  -> redeem evidence
  -> post-settlement risk review
```

PredictGuard should not become:

- a standalone all-market redeem keeper
- a fully automated production bot
- a batch liquidation or MEV system
- a generic prediction market frontend
- a replacement for DeepBook Predict protocol UI

The right framing is:

> Settlement and redeem are lifecycle evidence for the hedge, not the product's
> new center of gravity.

## Why This Extension Fits

PredictGuard already answers:

- What risk exists?
- Which hedge is recommended?
- Can the hedge be minted on-chain?
- What position did the wallet actually mint?
- What does the manager currently hold?
- How does the executed hedge affect stress scenarios?

The remaining lifecycle questions are:

- Has the position expired?
- Is it redeemable?
- Was it redeemed?
- What payout was received?
- Did the hedge improve realized risk after settlement?

These questions are directly aligned with PLP and vault-builder risk management.

## Current Progress Assessment

Competition MVP / judge-demo target:

- Current completion: about `95%`
- Current strength: working risk-to-mint-to-readback-to-report loop
- Remaining before final submission:
  - official contract/object verification
  - final browser walkthrough
  - screenshots
  - 5-minute demo video
  - submission packaging

Lifecycle extension target:

- Current completion: about `35-40%`
- Already completed:
  - manager position readback
  - `MarketKey` decoding
  - active / expired / zero / unknown status reconstruction
  - settlement feasibility analysis
- Missing:
  - redeemable status inference
  - `PositionRedeemed` parsing
  - redeem PTB preview
  - wallet-signed redeem
  - post-settlement realized result report

Commercial product target:

- Current completion: about `25-35%`
- Major missing pieces:
  - backend persistence
  - indexer-backed lifecycle history
  - live quote source
  - full settlement accounting
  - alerts and scheduled snapshots
  - team accounts and saved reports

## Development Plan

### Round 1: Settlement Readiness Panel

Status: completed as read-only v1.

Goal:

- Extend manager readback from active/expired/zero status into a clearer
  lifecycle readiness view.

Build:

- Add lifecycle labels for each decoded position:
  - `Active`
  - `Expired`
  - `Redeem candidate`
  - `Redeemed evidence missing`
  - `Unknown`
- Add short explanations in the UI and report.
- Keep this read-only. Do not execute redeem in this round.

Acceptance:

- A user can see which positions are still active and which need settlement or
  redeem investigation.
- The report explains that redeemability requires deeper oracle/vault or event
  evidence.

Risk:

- Low. This builds on existing manager readback and status reconstruction.

Expected completion gain:

- Competition MVP: `95% -> 96%`
- Lifecycle extension: `35-40% -> 45%`

### Round 2: PositionRedeemed Event Parser

Status: completed as defensive parser v1.

Goal:

- Parse DeepBook Predict `PositionRedeemed` events the same way we currently
  parse `PositionMinted`.

Build:

- Add a normalized redeem execution summary.
- Parse:
  - manager
  - owner
  - executor
  - oracle
  - expiry
  - strike
  - side
  - quantity
  - payout
  - bid price
  - `is_settled`
- Add report support for redeem evidence.

Acceptance:

- Given a transaction that contains `predict::PositionRedeemed`, PredictGuard
  can display and export the realized redeem result.

Risk:

- Medium. Needs access to a redeem transaction for live validation. The parser
  exists, but no live redeem flow is enabled yet.

Expected completion gain:

- Competition MVP: `96% -> 97%`
- Lifecycle extension: `45% -> 55%`

### Round 3: Redeem PTB Preview

Status: completed as read-only preview v1.

Goal:

- Prepare the transaction path for redeem without enabling wallet signing by
  default.

Build:

- Completed:
  - add a redeem transaction preview for a selected decoded position
  - show required objects:
  - `Predict`
  - `PredictManager`
  - `OracleSVI`
  - `MarketKey`
  - `Clock`
  - show why signing is blocked while redeemability is uncertain

Acceptance:

- Completed:
  - the UI can explain what would be redeemed and what protocol state is needed
  - no wallet action is exposed

Risk:

- Reduced from medium to low-medium for preview. Still high for real execution
  because redeemability and live testnet validation are unresolved.

Expected completion gain:

- Competition MVP: `97% -> 98%`
- Lifecycle extension: `55% -> 65%`

### Round 4: Wallet-Signed Redeem

Goal:

- Execute a real redeem transaction when a position is safely redeemable.

Build:

- Enable a guarded `Redeem` button when readiness is sufficient.
- Hand the redeem `Transaction` instance to the wallet.
- Wait for transaction indexing.
- Parse `PositionRedeemed`.
- Refresh manager readback.

Acceptance:

- If a live redeemable testnet position exists, PredictGuard can redeem it and
  show digest, payout, and manager state update.
- If no redeemable position exists, the app stays safely blocked and explains
  why.

Risk:

- High. Testnet oracle lifecycle, vault compacting, and timing may block a live
  redeem demo.

Expected completion gain:

- Competition MVP: `98% -> 99%` if verified live, otherwise still useful as
  guarded depth.
- Lifecycle extension: `65% -> 80%`

### Round 5: Post-Settlement Risk Report

Goal:

- Close the full hedge lifecycle in the exported report.

Build:

- Add realized hedge result:
  - mint cost
  - redeem payout
  - net result
  - settlement state
  - realized risk improvement note
- Reconcile mint and redeem evidence where available.

Acceptance:

- A judge can read one report and understand the full lifecycle from risk
  diagnosis to realized settlement result.

Risk:

- Medium. Full accuracy depends on redeem event availability and historical
  indexing.

Expected completion gain:

- Competition MVP: `99% -> 100%` for lifecycle story completeness if verified.
- Lifecycle extension: `80% -> 90%`

## Current Implementation Checkpoint

Round 1 and Round 2 have started as conservative v1 work.

Completed:

1. Completed: add lifecycle readiness concepts to `docs/16-concept-glossary.md`
   and `docs/21-concept-map-cn-en.md`.
2. Completed: add a read-only settlement readiness section to manager/account
   readback.
3. Completed: add a defensive `PositionRedeemed` parser.
4. Completed: extend Markdown report with lifecycle readiness and redeem
   evidence when present.

Next:

- Investigate live redeemability checks and a realistic redeemable-position test
  path before enabling wallet-signed redeem.
- Run:

```bash
bun run typecheck
bun run lint
bun run build
```

Do not start with wallet-signed redeem tomorrow unless the read-only lifecycle
state and parser are already clean.

## Demo Story After Extension

Updated demo story:

> PredictGuard identifies PLP risk, recommends a hedge, executes a DeepBook
> Predict mint, reads the manager state back from chain, decodes the position,
> tracks whether the position is active or moving toward settlement, and can
> record redeem evidence for realized risk review.

This keeps the product story focused while making the protocol depth stronger.
