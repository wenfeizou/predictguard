export type Side = "YES" | "NO";

export type DataSourceMode =
  | "simulated"
  | "live-testnet"
  | "mixed-live-and-simulated";

export type MarketState = {
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

export type Expiry = {
  id: string;
  timestamp: number;
  label: string;
  minutesToExpiry: number;
};

export type Strike = {
  value: number;
  label: string;
};

export type BinaryMarket = {
  expiryId: string;
  strike: number;
  yesPrice: number;
  noPrice: number;
  impliedVol: number;
  liquidity: number;
};

export type PositionExposure = {
  expiryId: string;
  strike: number;
  side: Side;
  notional: number;
  premiumCollected: number;
};

export type PlpState = {
  tvl: number;
  utilization: number;
  availableLiquidity: number;
  maxPayoutCoverage: number;
};

export type Scenario = {
  id: string;
  name: string;
  spotMovePct: number;
  volShockPct?: number;
  description: string;
};

export type HedgeCandidate = {
  side: Side;
  strike: number;
  expiryId: string;
  notional: number;
  estimatedCost: number;
  expectedLossReduction: number;
  lossReductionPct: number;
  score: number;
};

export type ScenarioResult = {
  scenarioId: string;
  scenarioSpot: number;
  unhedgedPnl: number;
  hedgedPnl?: number;
  hedgeCost?: number;
  hedgePnl?: number;
  tailLossReductionPct?: number;
  payoutLiability: number;
};

export type RiskMetrics = {
  tvl: number;
  utilization: number;
  maxPayoutLiability: number;
  worstScenarioPnl: number;
  largestRiskStrike: number;
  largestRiskExpiryId: string;
  riskScore: number;
};

export type ExposureCell = {
  expiryId: string;
  expiryLabel: string;
  strike: number;
  yesNotional: number;
  noNotional: number;
  netDirectionalNotional: number;
  premiumCollected: number;
  maxPayoutLiability: number;
};

export type HedgeConstraints = {
  maxCostPctOfTvl: number;
  targetLossReductionPct: number;
  preferSameExpiry: boolean;
};

export type HedgeRecommendation = {
  shouldHedge: boolean;
  riskSummary: string;
  recommendedHedge?: HedgeCandidate;
  expectedEffect: {
    unhedgedMaxLoss: number;
    hedgedMaxLoss: number;
    tailLossReductionPct: number;
  };
  tradeoffs: string[];
  assumptions: string[];
  plainEnglishExplanation: string;
};
