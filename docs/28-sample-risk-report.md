# PredictGuard Sample Risk Report

Report type: sample commercial-facing report

Status: illustrative, based on the current demo workflow and public testnet evidence

Date: 2026-06-28

## Executive Summary

PredictGuard identifies concentrated short-dated prediction-market exposure, estimates tail loss under scenario moves, compares unhedged and hedged outcomes, and records wallet-confirmed execution evidence when available.

This sample report shows how PredictGuard can help a liquidity provider, vault builder, or risk reviewer explain:

- where the exposure sits
- how severe the tail scenario is
- what hedge was selected
- what execution evidence exists
- what residual risk remains

This report is not trading advice. It is a risk operations artifact.

## Portfolio Context

| Field | Value |
| --- | --- |
| Product | DeepBook Predict risk workflow |
| Network | Sui testnet |
| Asset | BTC prediction market exposure |
| Settlement asset | dUSDC |
| Primary user | PLP provider / vault builder |
| Report mode | mixed live testnet context plus deterministic demo exposure |

## Risk Snapshot

| Metric | Sample Value | Interpretation |
| --- | ---: | --- |
| PLP TVL | 100,000 dUSDC | Demo liquidity base used for scenario analysis |
| Utilization | 54.8% | Portion of liquidity exposed to active prediction positions |
| Max payout liability | 54,800 dUSDC | Worst gross payout obligation before offsets |
| Worst scenario PnL | -180 dUSDC | Estimated loss under the selected deterministic stress case |
| Largest risk strike | BTC 62,500 / short expiry | Main concentration zone |

## Recommended Hedge

| Field | Value |
| --- | --- |
| Hedge side | YES |
| Reference strike | 62,543 |
| Sizing mode | quote-aware |
| Budget | 2 dUSDC |
| Estimated cost | 1.75 dUSDC in demo sizing view |
| Live probe cost | 0.044707 dUSDC |
| Live probe quantity | 1 dUSDC |

The hedge is designed to reduce exposure to an upside tail move near the concentrated strike. It lowers simulated tail loss, but it also spends premium if the tail event does not happen.

## Execution Evidence

Latest final-demo evidence captured with Slush wallet on Sui testnet:

| Field | Value |
| --- | --- |
| Owner wallet | `0xbecd4d29007221dea8e2e9c533c6255259226509bda18ca65c1e0d537d3cce0d` |
| PredictManager | `0x6ad31bd894103c4087920d460b3d4360f40bb96175012b405b69cec0fc1ce43f` |
| Transaction digest | `61A8wjnTkdjxTsonobvDzmQcnQ5eXwF2hTKZ9V7JT6Sx` |
| Mint result | YES 62,543 |
| Quantity | 1 dUSDC |
| Actual cost | 0.044707 dUSDC |
| Manager remaining | 1.955293 dUSDC |
| Lifecycle state | active hedge coverage, not redeem-ready |

Transaction explorer:

<https://testnet.suivision.xyz/txblock/61A8wjnTkdjxTsonobvDzmQcnQ5eXwF2hTKZ9V7JT6Sx>

## Residual Risk

PredictGuard still reports residual risk after a hedge:

- the hedge may not fully cover the largest tail scenario
- execution price can differ from the displayed quote
- oracle, vault, and settlement data can change before expiry
- missing historical mint or redeem events can affect realized PnL
- testnet package/object IDs may change
- deterministic scenarios are not an institutional risk model

## Assumptions

| Assumption | Current Handling |
| --- | --- |
| DeepBook Predict is available | Checked through public testnet status adapter |
| Wallet owns execution | PredictGuard passes a Transaction instance to the connected wallet |
| PLP exposure exists | Demo exposure is deterministic until complete live exposure data is available |
| Quote evidence exists | Latest successful mint can seed quote-aware sizing |
| Redeem evidence is discoverable | Bounded GraphQL and gRPC readback, not a production indexer |
| Risk report is explainable | Markdown export with assumptions and execution evidence |

## Productized Next Actions

For a real vault or LP team, PredictGuard should continue with:

1. Connect all relevant manager accounts.
2. Reconstruct complete mint, redeem, deposit, and withdrawal history.
3. Run a full scenario library across expiries and strikes.
4. Define acceptable max payout liability thresholds.
5. Set alert rules for utilization, oracle freshness, settlement readiness, and hedge drift.
6. Export a weekly LP-facing risk report.

