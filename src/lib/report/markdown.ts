import type {
  HedgeRecommendation,
  MarketState,
  RiskMetrics,
  Scenario,
  ScenarioResult,
} from "@/lib/types";

export function buildMarkdownReport(input: {
  market: MarketState;
  metrics: RiskMetrics;
  scenarios: Scenario[];
  results: ScenarioResult[];
  recommendation: HedgeRecommendation;
}): string {
  const { market, metrics, scenarios, results, recommendation } = input;

  return [
    "# PredictGuard Risk Report",
    "",
    `Generated: ${new Date(market.timestamp).toISOString()}`,
    `Data source: ${market.dataSource}`,
    `Spot: ${market.spotPrice.toLocaleString("en-US")} ${market.quoteAsset}`,
    "",
    "## Summary",
    "",
    recommendation.plainEnglishExplanation,
    "",
    "## Metrics",
    "",
    `- TVL: ${metrics.tvl.toLocaleString("en-US")} dUSDC`,
    `- Utilization: ${(metrics.utilization * 100).toFixed(1)}%`,
    `- Risk score: ${metrics.riskScore}/100`,
    `- Max payout liability: ${metrics.maxPayoutLiability.toFixed(2)} dUSDC`,
    `- Worst scenario PnL: ${metrics.worstScenarioPnl.toFixed(2)} dUSDC`,
    `- Largest risk: BTC > ${metrics.largestRiskStrike.toLocaleString("en-US")} / ${metrics.largestRiskExpiryId}`,
    "",
    "## Scenario Results",
    "",
    "| Scenario | Unhedged PnL | Hedged PnL | Tail-loss reduction |",
    "| --- | ---: | ---: | ---: |",
    ...results.map((result) => {
      const scenario = scenarios.find((item) => item.id === result.scenarioId);
      return `| ${scenario?.name ?? result.scenarioId} | ${result.unhedgedPnl.toFixed(2)} | ${(result.hedgedPnl ?? result.unhedgedPnl).toFixed(2)} | ${(result.tailLossReductionPct ?? 0).toFixed(1)}% |`;
    }),
    "",
    "## Hedge Recommendation",
    "",
    recommendation.recommendedHedge
      ? `Buy ${recommendation.recommendedHedge.notional} ${recommendation.recommendedHedge.side} notional at strike ${recommendation.recommendedHedge.strike.toLocaleString("en-US")} for expiry ${recommendation.recommendedHedge.expiryId}. Estimated cost: ${recommendation.recommendedHedge.estimatedCost.toFixed(2)} dUSDC.`
      : "No hedge recommended.",
    "",
    "## Assumptions",
    "",
    ...recommendation.assumptions.map((assumption) => `- ${assumption}`),
  ].join("\n");
}
