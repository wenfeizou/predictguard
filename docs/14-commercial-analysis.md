# Commercial Analysis

This document tracks PredictGuard's commercial value, target users, market assumptions, monetization paths, differentiation, and business risks. Update it as DeepBook Predict adoption, testnet data access, and user feedback change.

Date created: 2026-06-09.

## Executive View

PredictGuard has medium-high commercial potential if DeepBook Predict grows real trading volume and PLP TVL.

The project is not a broad consumer prediction app. It is closer to professional DeFi risk infrastructure for liquidity providers, vault builders, market makers, and strategy teams.

Core commercial thesis:

```text
DeepBook Predict can attract more serious liquidity when PLP risk is visible, stress-tested, hedgeable, and reportable.
```

PredictGuard creates value by turning opaque PLP risk into an actionable workflow:

```text
PLP exposure
  -> scenario loss
  -> hedge recommendation
  -> PTB preview / execution path
  -> risk report
```

## Target Users

Primary users:

- PLP liquidity providers
- vault builders
- structured product builders
- market makers
- strategy developers
- DeFi risk teams
- funds and professional LPs
- DeepBook ecosystem teams

Secondary users:

- traders who want to understand volatility surface risk
- protocol teams designing Predict-based products
- analysts monitoring Predict liquidity and risk
- builders who need embeddable risk reports or analytics

## User Problems

PLP providers and vault builders need answers before allocating capital:

- Where is PLP risk concentrated by strike and expiry?
- What is the maximum payout liability?
- What happens if BTC moves sharply before expiry?
- Does premium income justify tail risk?
- Which OTM binary hedge reduces downside most efficiently?
- What is the cost of hedge protection?
- How can the hedge be represented as a Sui PTB?
- How can risk be explained to users, LPs, or partners?

The key pain is not chart access. The key pain is confidence:

```text
Can I supply dUSDC to PLP or build a vault on top of Predict without hiding tail risk from myself or my users?
```

## Market Opportunity

Short-term market:

- DeepBook Predict hackathon teams
- testnet builders
- DeepBook ecosystem contributors
- early PLP and vault strategy designers

Medium-term market:

- mainnet PLP liquidity providers
- structured product teams
- professional DeFi market makers
- analytics and risk teams
- vault managers seeking risk reports

Long-term market:

- on-chain options and prediction-market risk tooling
- binary option vault risk infrastructure
- volatility-surface monitoring
- automated hedge orchestration
- report and compliance infrastructure for DeFi vaults

Market size depends heavily on DeepBook Predict adoption:

| DeepBook Predict adoption | PredictGuard commercial value |
| --- | --- |
| Low testnet activity only | Hackathon / ecosystem tool value |
| Moderate mainnet usage | Useful analytics and risk dashboard |
| Significant PLP TVL | Professional risk layer with clear monetization |
| Active vault ecosystem | Infrastructure / API / automation opportunity |

## Monetization Paths

### 1. Pro Dashboard

Offer advanced analytics and reporting for PLP providers, vault managers, and market makers.

Potential pricing:

- small teams: `$99-$499/month`
- professional users / funds: `$1k+/month`

Paid features could include:

- live exposure dashboard
- historical drawdown replay
- risk alerts
- exportable institutional reports
- strategy comparison
- custom assumptions and stress scenarios

### 2. Vault Risk Infrastructure

Provide SDK/API components for teams building Predict-based vaults or structured products.

Revenue options:

- API subscription
- SDK license
- managed dashboard fee
- integration fee
- revenue share with vault products

### 3. Hedge Automation

Extend the current PTB preview into keeper/bot workflows that execute or rebalance hedges.

Revenue options:

- execution fee
- basis-point fee on hedged AUM
- performance-neutral risk management fee

Important: avoid presenting this as profit-seeking trading advice. Position it as risk automation.

### 4. Ecosystem Grant / Strategic Partnership

PredictGuard can be valuable to the DeepBook ecosystem if it helps increase serious PLP participation.

Potential support:

- hackathon prize
- Sui / DeepBook ecosystem grant
- integration partnership
- audit credits or post-hackathon support
- official analytics tooling collaboration

## Differentiation

PredictGuard should not compete as a generic dashboard.

Differentiation:

- DeepBook Predict-native PLP risk model
- strike x expiry exposure heatmap
- SVI / IV surface interpretation
- scenario-based PLP PnL simulation
- OTM binary hedge recommendation
- Sui PTB preview
- exportable risk report

Strong positioning:

```text
PredictGuard is the PLP risk and hedge workflow for DeepBook Predict.
```

Weak positioning:

```text
AI trading dashboard.
```

The strongest product loop is:

```text
Observe risk
  -> quantify tail loss
  -> select hedge
  -> preview execution
  -> report assumptions
```

## Business Risks

### Protocol Adoption Risk

If DeepBook Predict does not attract volume or PLP TVL, PredictGuard has limited commercial demand.

Mitigation:

- keep the product useful for builders and judging even with simulation
- design adapters so the risk engine can support other binary / options-like markets later
- position as reusable on-chain prediction-market risk infrastructure

### Data Availability Risk

If public APIs do not expose enough vault, exposure, SVI, or manager data, analytics quality may suffer.

Mitigation:

- integrate official Predict server first
- fall back to documented simulation
- isolate adapters
- document missing fields and reconstruction assumptions
- use direct onchain reads for confirmation-critical flows

### Model Credibility Risk

Professional users will not trust a simplistic risk model indefinitely.

Mitigation roadmap:

- deterministic sample data for demo
- live exposure data
- historical replay
- proper SVI repricing
- realized volatility calibration
- backtesting
- sensitivity analysis
- explicit assumptions in every report

### Execution Risk

If PredictGuard remains only a dashboard, monetization may be limited.

Mitigation:

- build PTB preview
- add Sui SDK transaction skeleton
- attempt real testnet mint/supply/redeem
- later add keeper or hedge automation

### Competition Risk

Other teams may build Predict Surface Studio, PLP dashboards, or vault strategies.

Mitigation:

- emphasize the full risk workflow, not only analytics
- connect exposure, stress loss, hedge, PTB, and report
- make the demo narrative concrete and easy to judge

### Regulatory / Messaging Risk

The product can be misunderstood as financial advice or an AI trading recommender.

Mitigation:

- avoid guaranteed profit language
- avoid directional BTC predictions
- label outputs as simulation and risk analysis
- include assumptions and residual risk
- position AI as explanation, not autonomous trading

## Current Commercial Readiness

As of 2026-06-09:

| Dimension | Score | Notes |
| --- | ---: | --- |
| Track fit | 9/10 | Strong DeepBook Predict alignment. |
| User pain clarity | 8/10 | PLP tail risk is a real professional concern. |
| Current product maturity | 4.5/10 | Simulation-first MVP exists; live integration missing. |
| Monetization potential now | 5/10 | Mostly ecosystem / hackathon value until Predict adoption grows. |
| Monetization potential if Predict grows | 8/10 | Risk tooling becomes valuable with real PLP TVL. |
| Technical differentiation now | 6/10 | Good workflow; needs live data and execution. |
| Long-term extensibility | 8/10 | Can expand into risk infrastructure and automation. |
| Main business dependency | High | Depends on DeepBook Predict adoption and data access. |

## Tracking Metrics

Track these during and after the hackathon:

- DeepBook Predict TVL
- PLP TVL
- daily Predict trading volume
- number of active markets / expiries
- public API completeness
- number of vault builders using Predict
- number of teams asking for risk data
- demo users who understand PLP risk after viewing PredictGuard
- successful testnet transaction count
- report exports during demos

## Open Commercial Questions

- Will DeepBook Predict expose enough public data for credible PLP risk dashboards?
- Will serious LPs prefer a standalone dashboard or embedded vault risk reports?
- Are teams willing to pay for risk tooling before Predict reaches meaningful mainnet TVL?
- Is hedge automation a better business than analytics?
- Can PredictGuard generalize beyond DeepBook Predict if needed?
- What mainnet functional requirements must be met to unlock the second 50% of prize payout?

## Near-Term Commercial Priorities

Before submission:

1. Prove the risk workflow with a polished demo.
2. Add live Predict server data if available.
3. Add Sui SDK PTB skeleton.
4. Attempt one real testnet transaction.
5. Prepare a clear README and demo script.
6. Emphasize why PLP risk legibility helps DeepBook Predict attract serious liquidity.

After submission:

1. Interview Predict builders and PLP candidates.
2. Validate whether risk reports are useful to vault builders.
3. Add historical replay and live exposure.
4. Explore grant or ecosystem partnership paths.
5. Decide whether to focus on analytics, vault risk infrastructure, or hedge automation.
