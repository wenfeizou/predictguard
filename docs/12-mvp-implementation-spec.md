# MVP Implementation Spec

This document turns the product and track planning into an implementation-ready first build. It intentionally scopes the first version to a working demo path before live testnet execution.

## First Build Scope

Build a single-page app with section navigation, not a multi-route product, unless routing falls out naturally from the framework.

First version must include:

1. Overview metrics
2. Exposure heatmap
3. Volatility / IV heatmap
4. Scenario simulator
5. Hedge recommendation panel
6. PTB preview panel
7. Risk report render and Markdown export

First version can defer:

- wallet connection
- real transaction signing
- persistent saved reports
- full vault share token
- external venue comparison
- strategy backtest beyond deterministic scenarios

## Demo Path To Protect

The demo must work with no wallet and no live data.

```text
Load deterministic sample market
  -> show PLP exposure by strike and expiry
  -> select BTC +5% stress
  -> compute unhedged PLP PnL
  -> recommend OTM YES hedge
  -> compare unhedged vs hedged PnL
  -> show PTB preview
  -> export Markdown report
```

## Data Source Modes

Every market snapshot must expose a data source label:

```ts
type DataSourceMode =
  | "simulated"
  | "live-testnet"
  | "mixed-live-and-simulated";
```

UI labels:

- `Simulated market data`
- `Live testnet data`
- `Mixed: live prices + simulated exposure`

Current implementation note:

- `mixed-live-and-simulated` is active through `/api/predict/status`.
- Live context currently includes public server health, vault summary, protocol state, quote assets, and active BTC oracle count.
- PLP exposure and scenario PnL still use deterministic simulated data until live exposure reconstruction is implemented.

## Core Types

Use these types as the first implementation contract.

```ts
type Side = "YES" | "NO";

type DataSourceMode = "simulated" | "live-testnet" | "mixed-live-and-simulated";

type MarketState = {
  id: string;
  dataSource: DataSourceMode;
  spotSymbol: "BTC";
  quoteAsset: "dUSDC";
  spotPrice: number;
  timestamp: number;
  expiries: Expiry[];
  strikes: Strike[];
  markets: BinaryMarket[];
  exposures: PositionExposure[];
  plp: PlpState;
  assumptions: string[];
};

type Expiry = {
  id: string;
  timestamp: number;
  label: string;
  minutesToExpiry: number;
};

type Strike = {
  value: number;
  label: string;
};

type BinaryMarket = {
  expiryId: string;
  strike: number;
  yesPrice: number;
  noPrice: number;
  impliedVol: number;
  liquidity: number;
};

type PositionExposure = {
  expiryId: string;
  strike: number;
  side: Side;
  notional: number;
  premiumCollected: number;
};

type PlpState = {
  tvl: number;
  utilization: number;
  availableLiquidity: number;
  maxPayoutCoverage: number;
};

type Scenario = {
  id: string;
  name: string;
  spotMovePct: number;
  volShockPct?: number;
  description: string;
};

type HedgeCandidate = {
  side: Side;
  strike: number;
  expiryId: string;
  notional: number;
  estimatedCost: number;
  expectedLossReduction: number;
  lossReductionPct: number;
  score: number;
};

type ScenarioResult = {
  scenarioId: string;
  scenarioSpot: number;
  unhedgedPnl: number;
  hedgedPnl?: number;
  hedgeCost?: number;
  hedgePnl?: number;
  tailLossReductionPct?: number;
  payoutLiability: number;
};

type RiskMetrics = {
  tvl: number;
  utilization: number;
  maxPayoutLiability: number;
  worstScenarioPnl: number;
  largestRiskStrike: number;
  largestRiskExpiryId: string;
  riskScore: number;
};
```

## Deterministic Sample Dataset

The first seed dataset should be generated in code and kept deterministic.

Required headline values:

- spot: `70,000 BTC/dUSDC`
- TVL: `10,000 dUSDC`
- utilization: `42%`
- active expiries: `15m`, `30m`, `60m`
- strikes: `66,000`, `68,000`, `70,000`, `72,000`, `73,000`, `75,000`
- largest exposure: `BTC > 73,000 / 15m`
- BTC +5% unhedged max loss near `-180 dUSDC`
- recommended hedge cost near `12 dUSDC`
- BTC +5% hedged max loss near `-95 dUSDC`
- tail-loss reduction near `47%`

The exact numbers may differ slightly if the deterministic formulas are consistent and documented in the report assumptions.

## Scenario Set

Ship these scenarios:

```ts
const scenarios: Scenario[] = [
  {
    id: "btc-up-5",
    name: "BTC +5%",
    spotMovePct: 5,
    description: "Upside stress where short YES exposure can become payout liability.",
  },
  {
    id: "btc-down-5",
    name: "BTC -5%",
    spotMovePct: -5,
    description: "Downside stress where short NO exposure can become payout liability.",
  },
  {
    id: "btc-up-3sigma",
    name: "BTC +3 sigma",
    spotMovePct: 8,
    description: "Large upside tail move based on simplified demo volatility.",
  },
  {
    id: "btc-down-3sigma",
    name: "BTC -3 sigma",
    spotMovePct: -8,
    description: "Large downside tail move based on simplified demo volatility.",
  },
  {
    id: "vol-spike",
    name: "Vol spike",
    spotMovePct: 0,
    volShockPct: 30,
    description: "Volatility repricing stress with unchanged spot.",
  },
  {
    id: "near-expiry-up",
    name: "Near-expiry upside shock",
    spotMovePct: 3,
    description: "Short-dated move where gamma-like binary payout risk is concentrated.",
  },
];
```

## Risk Engine Interface

Implement the risk engine as pure TypeScript functions. Avoid React dependencies inside the engine.

```ts
function getMarketPrice(
  market: MarketState,
  expiryId: string,
  strike: number,
  side: Side,
): number;

function buildExposureMatrix(market: MarketState): ExposureCell[];

function computeRiskMetrics(
  market: MarketState,
  scenarios: Scenario[],
): RiskMetrics;

function runScenario(
  market: MarketState,
  scenario: Scenario,
  hedge?: HedgeCandidate,
): ScenarioResult;

function runScenarioSet(
  market: MarketState,
  scenarios: Scenario[],
  hedge?: HedgeCandidate,
): ScenarioResult[];

function rankHedgeCandidates(
  market: MarketState,
  scenarios: Scenario[],
  constraints: HedgeConstraints,
): HedgeCandidate[];

function selectRecommendedHedge(
  market: MarketState,
  scenarios: Scenario[],
): HedgeCandidate | undefined;
```

Supporting types:

```ts
type ExposureCell = {
  expiryId: string;
  expiryLabel: string;
  strike: number;
  yesNotional: number;
  noNotional: number;
  netDirectionalNotional: number;
  premiumCollected: number;
  maxPayoutLiability: number;
};

type HedgeConstraints = {
  maxCostPctOfTvl: number;
  targetLossReductionPct: number;
  preferSameExpiry: boolean;
};
```

## Simplified PnL Rules

For MVP:

```text
YES pays 1 if scenario_spot > strike.
NO pays 1 if scenario_spot <= strike.
PLP PnL = premium_collected - payout_liability.
Hedge PnL = hedge_payout - hedge_cost.
Hedged PnL = unhedged PLP PnL + hedge PnL.
```

For `vol-spike`, do not pretend to model full option Greeks. Apply a deterministic liability penalty based on short-dated exposure and add an assumption line:

> Vol spike scenario uses a simplified mark-to-market stress, not a full SVI repricing engine.

## Hedge Optimizer Rules

First version should be deterministic:

1. Find the worst loss scenario.
2. Infer tail direction:
   - positive spot move: prefer OTM `YES`
   - negative spot move: prefer OTM `NO`
3. Prefer same expiry as the largest risk cell.
4. Try hedge notionals of `25`, `50`, `75`, `100`, `125`, `150`.
5. Estimate cost as `market side price * notional`.
6. Filter candidates where cost is greater than `0.25%` of TVL unless no candidate exists.
7. Rank by `expectedLossReduction / estimatedCost`.

The UI must show that this is a risk reduction heuristic, not a profit predictor.

## AI Copilot Fallback

The app must work without an LLM API key.

Default behavior:

- Generate deterministic hedge recommendation from structured metrics.
- Render a plain-English explanation from a local template.

Optional behavior:

- If `OPENAI_API_KEY` or compatible provider key is configured, send structured inputs to an API route and validate the response against the same output shape.

Never block the demo on AI availability.

## PTB Preview Scope

First version:

- human-readable PTB steps
- typed Sui SDK `Transaction` builder preview
- config placeholders for mutable IDs
- disabled or clearly labeled execution button

Current implementation:

- `src/lib/ptb/hedgeTransaction.ts` builds a structured PTB plan and can construct a `Transaction` when all required object inputs are supplied.
- `src/app/page.tsx` shows `preview-ready` versus `ready-to-sign` readiness, missing object inputs, and guardrails.
- `src/app/ptb-execute.tsx` hands the built `Transaction` instance to the connected wallet through `@mysten/dapp-kit-react`.
- Execution remains blocked by design while wallet, dUSDC coin, `PredictManager`, or oracle inputs are missing.
- Current `predict-testnet-4-16` flow is `predict_manager::deposit<dUSDC>`, `market_key::new`, then `predict::mint<dUSDC>`.

Create a config shape like:

```ts
type PredictConfig = {
  network: "testnet";
  packageId: string;
  predictObjectId: string;
  managerObjectId?: string;
  dusdcType: string;
  apiBaseUrl: string;
};
```

The preview must mention:

- `dUSDC`
- `PredictManager`
- `predict::mint`
- selected side, scaled strike, expiry, notional, and deposit amount
- expected risk effect

## UI Sections

### Overview

Show:

- data source label
- BTC spot
- PLP TVL
- utilization
- risk score
- max payout liability
- largest risk strike
- recommended action

### Exposure

Show:

- strike x expiry heatmap
- YES / NO notional split
- max payout liability
- concentration warning

### Vol Surface

Show:

- IV heatmap by strike and expiry
- one selected expiry smile chart if time allows
- annotation for high-risk region

### Scenario Simulator

Show:

- scenario selector
- scenario spot
- unhedged PnL
- hedged PnL
- tail-loss reduction
- before / after chart

### Hedge Recommendation

Show:

- should hedge or not
- selected side / strike / expiry / notional
- estimated cost
- expected loss reduction
- tradeoffs
- assumptions

### PTB Preview

Show:

- transaction steps
- required objects/assets
- max cost
- expected output
- skeleton code

### Risk Report

Show:

- executive summary
- metrics table
- scenario table
- selected hedge
- assumptions
- Markdown export button

## Suggested File Layout

This can be adjusted to the chosen framework, but keep the same boundaries.

```text
src/
  app/
    page.tsx
    api/
      hedge-explanation/route.ts
  components/
    overview/
    exposure/
    scenario/
    hedge/
    ptb/
    report/
    ui/
  lib/
    data/
      adapters.ts
      seed.ts
      scenarios.ts
    risk/
      engine.ts
      hedge.ts
      metrics.ts
    ptb/
      preview.ts
      config.ts
    report/
      markdown.ts
    types.ts
```

## Acceptance Checklist

Before moving to live integration:

- App starts locally from README instructions.
- Overview shows deterministic sample market.
- Exposure heatmap renders strike x expiry data.
- IV heatmap renders strike x expiry data.
- Scenario selector changes PnL outputs.
- BTC +5% scenario shows meaningful unhedged loss.
- Hedge recommendation reduces tail loss.
- PTB preview reflects the selected hedge.
- Risk report renders assumptions and can export Markdown.
- All views clearly label simulated vs live data.
- No flow requires wallet, API key, or testnet availability.

Before final submission:

- Add Predict server adapter or document why it is unavailable.
- Add Sui SDK PTB skeleton.
- Add config placeholders for current testnet IDs.
- Attempt one tiny testnet interaction if dUSDC and package IDs are available.
- Update README with demo script, architecture, assumptions, and official track alignment.

## Recommended Tech Stack

Recommended default:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or lightweight local UI primitives
- Recharts for charts
- `@mysten/sui` for Sui SDK / PTB skeleton
- Zod for runtime validation of AI/copilot output and adapter data
- local deterministic TypeScript seed data first
- optional OpenAI-compatible API route for hedge explanation

Why this stack:

- Fastest path to a polished web demo.
- TypeScript matches Sui SDK and the existing planned data model.
- Next.js API routes are enough for optional AI calls without adding a backend service.
- Recharts is sufficient for heatmaps, PnL charts, and simple line charts.
- Zod keeps live adapter and AI output failures contained.

Alternatives:

- Vite + React: simpler and faster dev server, but less convenient for optional API routes and server-side secrets.
- ECharts: better heatmaps and dense charting than Recharts, but a little heavier.
- Plotly: good for 3D surface charts, but overkill for MVP.
- SQLite: useful for saved reports later, unnecessary for the first demo.

Proposed decision:

Use Next.js + TypeScript + Tailwind + Recharts + Zod + `@mysten/sui`, with no database in the first version. Add ECharts only if Recharts heatmaps are not good enough.
