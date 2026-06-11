# Judge Demo Script

## Purpose

This document is the short judge-facing script for PredictGuard. It should help
the presenter explain the product quickly and verify the end-to-end flow without
opening many planning documents.

## One-Minute Pitch

PredictGuard is the risk and hedge workflow for DeepBook Predict PLPs, LPs, and
vault builders.

DeepBook Predict gives Sui a native binary option and PLP liquidity primitive.
But serious liquidity providers need to understand tail risk before allocating
dUSDC. PredictGuard makes that risk visible, recommends a hedge, executes a
wallet-signed Predict mint on testnet, then reads the resulting manager
inventory back from chain.

The product loop is:

```text
risk identification
  -> hedge recommendation
  -> wallet-signed Predict mint
  -> execution-adjusted risk
  -> manager inventory readback
  -> exportable risk report
```

## Demo Path

1. Open the app at `http://localhost:3000`.
2. Start with `Demo Flow`.
   - Show that the product is organized as a workflow, not a generic dashboard.
3. Review `PLP Overview`.
   - Explain TVL, utilization, risk score, max payout liability, and worst
     scenario PnL.
4. Review `Exposure Heatmap`.
   - Explain where PLP payout risk is concentrated by strike and expiry.
5. Review `Scenario Simulator`.
   - Select a tail scenario and compare unhedged vs hedged PnL.
6. Review `Hedge Recommendation`.
   - Explain side, strike, expiry, notional, estimated cost, and tail-loss
     reduction.
7. Review `PTB`.
   - Confirm wallet readiness, PredictManager, dUSDC coin, live oracle, scaled
     strike, and sizing mode.
8. Click `Sign PTB` only when readiness is `ready-to-sign`.
   - The wallet signs a Sui `Transaction` instance, not a mocked action.
9. After confirmation, show:
   - SuiVision digest link
   - execution-adjusted risk
   - decoded manager/account summary
   - active position quantity
   - position statuses
10. Review `Report`.
    - Export the Markdown report as the final artifact.

## What To Emphasize

- PredictGuard is for PLP and vault risk management, not casual prediction
  betting.
- The app uses DeepBook Predict concepts directly:
  - `PLP`
  - `dUSDC`
  - `PredictManager`
  - `OracleSVI`
  - `MarketKey`
  - `PTB`
  - wallet-signed `predict::mint`
- The app reads manager state back from Sui, decodes `MarketKey`, and classifies
  positions as active, expired, zero quantity, or unknown.
- The exported report links the business problem, risk analysis, hedge
  recommendation, execution evidence, and manager readback.

## Current Verified Chain Evidence

The local test wallet has demonstrated:

- a connected Sui testnet wallet
- dUSDC manager deposit
- wallet-approved Predict mint
- SuiVision digest links
- direct `PredictManager` object readback through Sui gRPC
- decoded positions:
  - `YES 62,151`, quantity `0 dUSDC`, status `Zero quantity`
  - `YES 63,187`, quantity `10.31435 dUSDC`, status `Active`

The exact values may change as new testnet mints are executed.

## Fallback Demo Path

If the public Predict testnet server, wallet, or faucet is unavailable:

1. Run the app locally.
2. Show the deterministic PLP risk workflow.
3. Show the PTB preview and missing readiness inputs.
4. Show the exported Markdown report.
5. Explain that live chain evidence is already recorded in the project log and
   can be reproduced when testnet dependencies are available.

This fallback keeps the product understandable without pretending that testnet
infrastructure is always stable.

## Known Limitations

- PLP exposure and scenario data are still deterministic demo inputs.
- Quote-aware sizing uses available ask-price evidence but is not yet a full
  live quote engine.
- Settlement-aware reconstruction v1 classifies active, expired, zero, and
  unknown positions. It does not yet compute final settlement outcome, winning
  side, claimable amount, or claimed amount.
- DeepBook Predict is still a testnet surface. Package IDs, object IDs, and
  entrypoints must be verified late before final submission.

## Next Depth Targets

1. Add final settlement outcome reconstruction when official data surfaces are
   sufficient.
2. Replace deterministic exposure inputs with deeper live Predict exposure
   reconstruction or a focused custom indexer.
3. Add historical replay or stress-test presets for several market regimes.
4. Polish final submission video and screenshots.
