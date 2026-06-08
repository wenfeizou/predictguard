# Data and Simulation Model

## Simulation-First Strategy

Build a complete simulated product first. Then replace simulated adapters with real DeepBook Predict data where possible.

Why:

- DeepBook Predict is testnet and integration details may change.
- A complete product demo should not depend on perfect testnet data availability.
- The track accepts proper simulation results for vault strategies.

## Core Types

```ts
type MarketState = {
  spotPrice: number;
  timestamp: number;
  expiries: Expiry[];
  strikes: Strike[];
  positions: PositionExposure[];
  plp: PlpState;
};

type Expiry = {
  id: string;
  timestamp: number;
  label: string;
};

type Strike = {
  value: number;
};

type BinaryMarket = {
  expiryId: string;
  strike: number;
  yesPrice: number;
  noPrice: number;
  impliedVol?: number;
  liquidity?: number;
};

type PositionExposure = {
  expiryId: string;
  strike: number;
  side: "YES" | "NO";
  notional: number;
  premiumCollected: number;
};

type PlpState = {
  tvl: number;
  utilization: number;
  availableLiquidity: number;
};

type Scenario = {
  name: string;
  spotMovePct: number;
  volShockPct?: number;
};
```

## Simplified PnL Model

For a binary market:

```text
YES pays 1 if spot_at_expiry > strike, else 0
NO pays 1 if spot_at_expiry <= strike, else 0
```

For PLP exposure as counterparty:

```text
PLP PnL = premium_collected - payout_liability
```

If PLP sold YES exposure:

```text
if scenario_spot > strike:
  payout = notional
else:
  payout = 0
```

If hedge buys YES:

```text
hedge_pnl = payout - hedge_cost
```

Hedged result:

```text
hedged_pnl = unhedged_plp_pnl + hedge_pnl
```

## Risk Metrics

Minimum:

- max payout liability
- worst scenario PnL
- tail-loss reduction
- hedge cost
- hedge cost as % of TVL
- risk score 0-100

Risk score simple model:

```text
risk_score =
  40 * utilization_score
  + 30 * concentration_score
  + 20 * tail_loss_score
  + 10 * near_expiry_score
```

## Sample Scenario Set

```ts
const scenarios = [
  { name: "BTC +5%", spotMovePct: 5 },
  { name: "BTC -5%", spotMovePct: -5 },
  { name: "BTC +3 sigma", spotMovePct: 8 },
  { name: "BTC -3 sigma", spotMovePct: -8 },
  { name: "Vol spike", spotMovePct: 0, volShockPct: 30 },
  { name: "Near-expiry upside shock", spotMovePct: 3 },
];
```

## Data Labels

The UI must clearly show:

- `Live testnet data`
- `Simulated market data`
- `Mixed: live prices + simulated exposure`

This avoids overclaiming.

