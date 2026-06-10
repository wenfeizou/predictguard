# Track Alignment

## DeepBook Predict Themes

The DeepBook Predict track rewards projects around:

- DeepBook Predict contract integration
- dUSDC quote asset
- binary positions
- rolling expiries
- volatility surface / SVI pricing
- PLP supply and LP economics
- vault strategies
- bots, keepers, and analytics
- simulation results for strategy/vault projects

## Why PredictGuard Fits

| Track requirement/theme | PredictGuard answer |
| --- | --- |
| Build around DeepBook Predict | Uses Predict markets, PLP risk, strike/expiry positions, and dUSDC-denominated exposure. |
| Vault strategies | Simulates PLP + hedge vault behavior without requiring a full vault contract first. |
| PLP risk dashboard | Shows utilization, exposure, tail loss, and scenario results. |
| Volatility surface | Uses surface/smile data to explain pricing and risk concentration. |
| Bots/tools | AI copilot recommends hedge actions. |
| Simulation result | Compares unhedged vs hedged PnL under stress scenarios. |
| Composability/PTB | Generates and executes wallet-signed PTBs for minting hedge positions. |

## Source Ideas Combined

PredictGuard combines:

- `002 PLP + Hedge Vault`: PLP yield plus OTM hedge strategy
- `037 Predict Surface Studio`: volatility surface visualization
- `038 PLP Risk Dashboard`: PLP exposure, utilization, and stress dashboard
- `047 Strategy Backtest Framework`: before/after simulation and metrics

This is deliberately scoped below a full automated vault. It is an actionable
risk management workflow first: identify risk, recommend a hedge, execute an
on-chain Predict position, and show whether the resulting position improves the
risk profile.

## Why This Can Win

PredictGuard answers a real protocol adoption problem:

> Serious LPs will not provide liquidity just because APY is high. They need exposure, stress tests, hedge cost, and risk reports.

The project is stronger than a single dashboard because it connects:

```text
surface data -> PLP exposure -> stress loss -> hedge recommendation -> PTB execution -> position readback -> risk report
```

That chain demonstrates understanding of DeepBook Predict's financial primitive, not just UI skill.
