# Redeem Strategy Tradeoff

This document records the product and engineering decision made after the
short-expiry `YES 63,317` position was redeemed by an external executor before
PredictGuard could test wallet-signed redeem.

## Decision

Wallet-signed redeem remains valuable, but it is no longer a blocking mainline
task for the competition MVP.

It is now a stretch goal.

The mainline settlement/redeem work becomes:

```text
mint
-> manager position readback
-> expiry / settlement evidence
-> PositionRedeemed evidence
-> permissionless executor explanation
-> payout / lifecycle accounting
-> reportable result
```

## Why

DeepBook Predict supports `predict::redeem_permissionless` for settled
positions. After settlement, an external executor can submit the redeem
transaction even when the manager owner does not click a redeem button.

The `YES 63,317` test proved this in practice:

```text
digest: FxhZD6PLrPKDhgsiJAXZBvoTrMVS6YhWVZC7D5drvhps
owner: 0x5e2a28ff382ab6858588dba9d5ed8e21fc59908c295ced2124f87b1cdb4cefb6
executor: 0x49c56cac0bc31ba361c546aaa0289e45b82e9cf108ac73fde136fad4fbfc8e55
position: YES 63,317
payout: 3.100818 dUSDC
```

Because the external executor can act quickly after settlement, testing a
manual wallet-signed redeem path is timing-sensitive and unreliable as a
blocking milestone.

## Product Interpretation

This is not a failure case.

For a PLP / LP / vault-builder risk workflow, the product should answer:

- Has the hedge position expired?
- Was it settled?
- Was it redeemed?
- Who submitted the redeem transaction?
- Did payout evidence exist?
- How much payout was recorded?
- Does the position still require follow-up?

Those questions are more stable and more useful than requiring the user to be
the address that personally submits every redeem transaction.

## Updated Priorities

1. Build settlement accounting v1.
2. Link manager positions to redeem evidence.
3. Explain external executor / permissionless redeem clearly in UI and report.
4. Keep wallet-signed redeem guarded and disabled until a live path is proven.
5. Treat wallet-signed redeem as a stretch goal if a suitable redeemable
   position is available before an external executor redeems it.

## Target Progress For This Round

Push lifecycle extension progress from about `87%` toward `95%` by adding:

- settlement accounting summary
- position lifecycle counts
- redeemed payout totals from loaded evidence
- evidence missing counts
- report output for settlement status
- documentation for the new tradeoff and accounting concepts

## Remaining After 95%

- Broader redeem history discovery beyond one default digest.
- Full historical indexer or query path for all manager mints/redeems.
- Production-grade settlement accounting across multiple digests.
- Final README / pitch / video script and submission artifacts.
