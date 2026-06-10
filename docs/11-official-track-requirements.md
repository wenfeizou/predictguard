# Official Track Requirements

Source reviewed:

- Sui Overflow 2026 Hackathon Participant Handbook: <https://mystenlabs.notion.site/overflow-2026-handbook>
- DeepBook Predict Problem Statement: <https://mystenlabs.notion.site/deepbook-predict-problem-statement>
- Sui DeepBook Predict docs: <https://docs.sui.io/onchain-finance/deepbook-predict/>
- Sui DeepBook Predict contract information: <https://docs.sui.io/onchain-finance/deepbook-predict/contract-information>
- Sui DeepBook Predict design docs: <https://docs.sui.io/onchain-finance/deepbook-predict/design>

Date reviewed: 2026-06-09.

## Hackathon-Level Requirements

The Sui Overflow 2026 handbook frames the hackathon around meaningful products, real-world applications, and long-term ecosystem growth. For PredictGuard, this means the submission should look like a product that can continue after the hackathon, not only a throwaway demo.

Confirmed handbook timeline, in Pacific Time:

| Date | Event | PredictGuard implication |
| --- | --- | --- |
| May 7 | Official launch, track reveal, prize pool announcement | Track requirements are available and should be reflected in the README. |
| May 7-June 21 | Building period | Primary implementation and demo recording must happen in this window. |
| June 21 | Submission deadline | Changes after this date may not be reflected in shortlisting. |
| July 8 | Shortlisted teams announcement | Submission must be clear enough to stand without live explanation. |
| July 20-21 | Demo Day | Shortlisted teams present live virtually to judges. |
| August 27 | Winners announcement | Winners are invited to pitch during Sui Basecamp 2026. |

Confirmed DeepBook specialized track prizes:

- 1st Prize: `$35,000`
- 2nd Prize: `$15,000`
- 3rd Prize: `$7,500`
- 4th Prize: `$5,000`
- Additional notable honorable mentions or special awards: `$7,500` total pool

Award structure:

- 50% of the prize is awarded when winners are announced.
- 50% is awarded after successful mainnet deployment.
- If a winning team is already deployed to mainnet by the winners announcement, it receives 100% upfront.
- Mainnet deployment must meet minimum functional requirements defined by Sui and/or track sponsors.

Submission process:

- Create a DeepSurge profile.
- Register for Overflow 2026.
- Submit through DeepSurge Hackathons by selecting Overflow 2026 and clicking `Submit Project`.
- The detailed submission guide exists as a linked page in the handbook.

Readability note: the public Notion API exposed the handbook timeline, prizes, award structure, track descriptions, and submission guide headings. It exposed FAQ question titles, including judging criteria, video/presentation, GitHub privacy, mainnet deployment, and post-deadline work, but did not expose the full FAQ answers in the fetched content. Treat exact scoring weights and full FAQ answers as items to confirm manually in the browser or DeepSurge interface.

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
- current official testnet package ID `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138`

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

## Fit Against Handbook Judging Signals

The handbook says Overflow is focused on meaningful products, real-world applications, and long-term ecosystem growth. It also states that builders should review judging criteria, timelines, and submission requirements, and that shortlisted teams will present live to judges.

Because the exact scoring weights were not exposed through the public Notion fetch, use these confirmed signals as the practical judging frame:

| Judging signal from handbook / track docs | PredictGuard fit | Required proof in submission |
| --- | --- | --- |
| Meaningful product | Helps PLP providers and vault builders understand downside before allocating dUSDC. | Demo should start with the LP risk problem, not UI features. |
| Real-world application | Risk dashboards, stress tests, hedge workflows, and reports are credible needs for serious liquidity providers. | Show deterministic risk numbers and assumptions. |
| Long-term ecosystem growth | Makes DeepBook Predict safer to adopt by making PLP economics and tail risk legible. | Explain how the adapter can switch from simulated data to live Predict server data. |
| DeepBook track relevance | Uses PLP, binary positions, rolling expiries, SVI/IV, dUSDC, PredictManager, and PTB concepts. | README and demo must name these protocol primitives explicitly. |
| Functional application | Current MVP already runs end to end with simulated data. | Protect the offline flow and add live/testnet adapter where feasible. |
| Product or analytics category | Fits analytics/developer tooling and PLP risk dashboard categories. | Present as "PLP risk and hedge workflow", not generic analytics. |
| Vault strategy simulation | Simulates PLP + hedge behavior and before/after PnL. | Include reproducible sample data and scenario assumptions. |
| Testnet Predict contract integration | Official minimum requirement says integrate DeepBook Predict contract on testnet. | Add config, Sui SDK skeleton, public API adapter, and ideally one real testnet tx digest. |
| Mainnet deployment incentive | Prize payout is tied partly to successful mainnet deployment. | Keep IDs configurable and document the path to mainnet redeploy. |
| Demo Day readiness | Shortlisted teams present live to judges. | Prepare a 5-7 minute script around exposure -> stress -> hedge -> PTB -> report. |

Current assessment:

- Strong conceptual fit.
- Strong product narrative.
- MVP now proves an end-to-end simulated workflow.
- Biggest remaining scoring risk is the official minimum testnet integration requirement.

Therefore the next implementation priority is not more UI polish. It is:

1. Add a public Predict server adapter.
2. Add Sui SDK PTB builder placeholders using `@mysten/sui`.
3. Add config-driven testnet IDs.
4. Attempt a tiny real testnet mint/supply/redeem or clearly document blockers.
5. Prepare submission assets: README, demo script, screenshots, video, and assumptions.

## Current Gaps Against Official Requirements

The current repository now has a simulation-first MVP. Against the official requirements and handbook signals, the biggest remaining gaps are:

1. No testnet Predict contract integration yet.
2. No public Predict server adapter yet.
3. No real package IDs, object IDs, or `dUSDC` configuration yet.
4. No verified Sui SDK transaction against current Predict entrypoints yet.
5. No real testnet transaction digest yet.
6. No final submission README, demo script, screenshots, or recorded end-to-end video yet.

The concept and first MVP are aligned, but the implementation must still prove official testnet integration.

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

- Previous planning-only state: 5-10%.
- Current simulation-first MVP with no testnet contract call: 25-35%.
- Current MVP plus public API data and Sui SDK PTB skeleton: 40-55%.
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
