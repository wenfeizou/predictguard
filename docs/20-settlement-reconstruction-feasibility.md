# Settlement Reconstruction Feasibility

This document records what PredictGuard can and cannot reconstruct today from
DeepBook Predict testnet state.

## Current Status

PredictGuard has settlement-aware position reconstruction v1:

- decodes `MarketKey`
- reads position quantity from `PredictManager.positions`
- classifies positions as:
  - `Active`
  - `Expired`
  - `Zero quantity`
  - `Unknown`
- excludes zero and expired positions from active hedge coverage
- adds read-only lifecycle readiness labels for active, expired, zero, and
  unknown entries
- includes a defensive `PositionRedeemed` parser for future redeem transaction
  evidence

This is not full settlement accounting.

## Official Source Findings

From the DeepBook Predict `predict-testnet-4-16` source:

- `predict::mint` emits `PositionMinted`.
- `predict::redeem` and `predict::redeem_permissionless` emit
  `PositionRedeemed`.
- `PositionRedeemed` includes:
  - manager ID
  - owner
  - executor
  - oracle ID
  - expiry
  - strike
  - side
  - quantity
  - payout
  - bid price
  - `is_settled`
- Settled redemption is possible when:
  - the oracle is settled
  - the vault has compacted settled oracle state
- `predict_manager::decrease_position` reduces the stored position quantity but
  does not remove the `MarketKey` table entry. This explains zero-quantity
  position entries.

## What Is Feasible Now

Feasible with current reads:

- classify active vs expired based on `MarketKey.expiry`
- classify zero quantity based on manager table value
- show active position quantity
- show decoded position identity
- show manager dUSDC balance
- parse `PositionMinted` from the latest transaction
- match decoded position oracle ID against Predict public API oracle summaries
- show oracle `status`, `settlement_price`, and `settled_at` evidence when the
  oracle is present in the current API snapshot
- read the live Predict object's `vault.settled_oracles` Table ID
- scan `vault.settled_oracles` dynamic fields for target oracle IDs
- show whether the candidate position's oracle has direct vault settled-oracle
  evidence

Feasible with additional event/indexer work:

- parse historical `PositionRedeemed` events; latest-transaction parser exists
- reconstruct redeemed quantity and payout history
- show latest known claimed/redeemed amounts
- distinguish live redemption from settled redemption using `is_settled`

Feasible with deeper oracle/vault readback:

- read oracle settled state; public API summary now gives partial evidence
- read settlement price
- infer whether YES/NO won
- prove whether the Predict vault compacted settled oracle state; target-oracle
  proof is now implemented through `vault.settled_oracles` dynamic-field
  scanning
- compute theoretical payout for remaining quantity
- compare theoretical claimable amount with actual redeemed events

## Not Implemented In MVP

PredictGuard does not yet compute:

- final winning side
- final settlement price display
- claimable amount
- claimed amount
- unclaimed amount
- full historical position lifecycle
- wallet-signed redeem execution

## Product Decision

For the current competition MVP, PredictGuard should present this honestly:

> Settlement-aware v1 classifies manager positions as active, expired, zero, or
> unknown. Redeem preview now combines public oracle evidence with direct
> `vault.settled_oracles` proof for target oracle IDs. Full settlement
> accounting still requires redeemed-event history, claimable payout
> computation, and live redeem validation.

This is strong enough for judge-demo readiness because the app already proves:

- wallet-signed mint
- manager inventory readback
- decoded `MarketKey`
- active coverage accounting
- explicit limits around full settlement
- oracle evidence plus direct vault settled-oracle evidence for redeem preview,
  while keeping wallet-signed redeem disabled until a live redeemable path is
  verified

## Next Implementation Path

1. Add historical event lookup for manager ID when an indexer/API path is
   available.
2. Add final settlement price / winning-side display for expired positions.
3. Compute theoretical payout for remaining active/expired positions.
4. Reconcile theoretical payout with actual redeemed payout history.
5. Enable wallet-signed redeem only after a live redeemable test path is proven.
