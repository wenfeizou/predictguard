# Official Track Requirements

Source reviewed:

- DeepBook Predict Problem Statement: <https://mystenlabs.notion.site/deepbook-predict-problem-statement>
- Sui DeepBook Predict docs: <https://docs.sui.io/onchain-finance/deepbook-predict/>
- Sui DeepBook Predict design docs: <https://docs.sui.io/onchain-finance/deepbook-predict/design>

Date reviewed: 2026-06-09.

## Track Thesis

The DeepBook Predict track is about building around a programmable, volatility-surface-priced prediction protocol on Sui. The official problem statement frames current prediction markets as fragmented, shallow, slow to settle, narrowly binary, and unable to price strikes or ranges against a real volatility surface.

DeepBook Predict is positioned as infrastructure for:

- pricing every strike and expiry against a live volatility surface
- short rolling expiries, including sub-hour market cycles
- vault-backed liquidity where a shared vault takes the other side of trades
- auditable PLP economics
- composability with Sui DeFi, including margin, lending, structured vaults, and bots

## Current Official Surface

The official track statement and docs describe Predict as live on Sui testnet with:

- rolling sub-hour BTC oracles
- public indexed data at `predict-server.testnet.mystenlabs.com`
- `dUSDC` as the testnet quote asset
- `PredictManager` accounts for user balances and positions
- binary positions
- vertical ranges
- `OracleSVI` volatility-surface state
- shared vault liquidity and `PLP` shares
- public docs and source branch pinned to `predict-testnet-4-16`

Important: `dUSDC` is not official USDC. Package IDs, object IDs, and entrypoints are testnet integration targets and may change before mainnet.

## Minimum Qualification Requirements

The official minimum requirements are:

1. Integrate the DeepBook Predict contract on testnet.
2. If building a product, make the end-to-end flow work because judges will test the full flow.
3. If building a vault strategy, provide proper simulation results.

For PredictGuard, this means the MVP cannot be only a static dashboard. It needs at least a credible testnet integration path, and the simulator must be explicit, reproducible, and presented as strategy evidence.

## Suggested Project Categories

The official statement invites:

- user-facing apps and trading frontends
- vaults, structured products, and composable tokens
- bots, keepers, and arbitrage services
- developer tools, SDKs, and analytics dashboards

The examples most relevant to PredictGuard are:

- `PLP + Hedge Vault`: supply quote into `predict::supply`, earn `PLP`, and buy OTM binaries through `predict::mint` to cap tail drawdown.
- `Predict Surface Studio`: show live SVI volatility surfaces, replay updates, and flag anomalies.
- `PLP Risk Dashboard`: show vault utilization, withdrawal limiter state, exposure breakdown, and what-if PLP PnL under large BTC moves.
- `Vol-Arb Bot`: compare Predict's implied volatility surface against external venues and trade large discrepancies.
- `Settled-Redeem Keeper`: use `predict::redeem_permissionless` and the public event surface to redeem settled positions.

## PredictGuard Fit

PredictGuard is directionally well aligned because it combines several official idea-bank themes:

- PLP risk dashboard
- PLP + hedge vault analysis
- SVI / volatility surface visualization
- stress simulation
- risk reports for LPs and vault builders
- PTB preview for composable hedge execution

The strongest fit is:

```text
Predict market / vault state
  -> PLP exposure and utilization
  -> scenario-based loss analysis
  -> OTM binary hedge recommendation
  -> PTB preview or testnet transaction
  -> exportable risk report
```

This directly addresses the official "is PLP safe?" and "how do serious LPs reason about Predict vault risk?" problem.

## Current Gaps Against Official Requirements

The current repository is still planning-only. Against the official requirements, the biggest gaps are:

1. No working product flow yet.
2. No testnet Predict contract integration yet.
3. No public Predict server adapter yet.
4. No reproducible simulation artifact yet.
5. No Sui SDK transaction skeleton yet.
6. No real or placeholder config for package IDs, object IDs, and `dUSDC`.
7. No final submission README, demo script, or recorded end-to-end path yet.

The concept is highly aligned, but the implementation must prove that alignment.

## Winning Probability Assessment

Assessment as of 2026-06-09:

| State | Expected competitiveness |
| --- | --- |
| Planning docs only | Very low |
| Offline simulator + polished dashboard only | Medium-low |
| Simulator + risk engine + PTB preview + report | Medium |
| Above + Predict server data adapter | Medium-high |
| Above + working testnet mint/supply/redeem flow or tx digest | High |
| Above + strong demo narrative and clear README | High to very high |

Estimated probability bands:

- Current state: 5-10%.
- Complete simulation-first MVP with no testnet contract call: 25-35%.
- Complete MVP with public API data and Sui SDK PTB skeleton: 40-55%.
- Complete MVP with at least one real testnet Predict transaction: 60-75%.
- Complete MVP plus polished UX, risk report, and strong demo video: 70-85%.

These are relative estimates, not guarantees. Actual odds depend on competitor quality and judging emphasis.

## Required Execution Pivot

To become clearly competitive, PredictGuard should prioritize:

1. Build a working app immediately.
2. Implement deterministic strategy simulation.
3. Add a public Predict server adapter.
4. Add config-based testnet integration.
5. Implement at least one Sui SDK transaction skeleton.
6. Attempt a tiny testnet transaction late, after the demo works offline.
7. Make the submission narrative explicitly reference PLP risk, SVI surface, OTM hedge, `dUSDC`, `PredictManager`, and PTB composability.

## Recommended Submission Positioning

Use:

> PredictGuard is the PLP risk and hedge workflow for DeepBook Predict. It helps LPs and vault builders inspect vault exposure, simulate tail losses, compare unhedged and hedged outcomes, and turn an OTM binary hedge into a Sui PTB preview or testnet action.

Avoid:

> AI trading dashboard.

Avoid:

> Generic prediction market analytics.

The project should read as a DeepBook Predict-native risk layer, not a general crypto dashboard.
