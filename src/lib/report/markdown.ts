import type {
  HedgeRecommendation,
  MarketState,
  RiskMetrics,
  Scenario,
  ScenarioResult,
} from "@/lib/types";
import type { NormalizedPredictLiveContext } from "@/lib/predict/normalize";
import type {
  ExecutionAdjustedRiskSummary,
  ManagerExecutionHistorySummary,
  PredictMintExecutionSummary,
} from "@/lib/predict/execution";
import type { PredictManagerInventoryReadback } from "@/lib/predict/managerReadback";

export function buildMarkdownReport(input: {
  market: MarketState;
  metrics: RiskMetrics;
  scenarios: Scenario[];
  results: ScenarioResult[];
  recommendation: HedgeRecommendation;
  liveContext?: NormalizedPredictLiveContext;
  mintExecution?: PredictMintExecutionSummary | null;
  executionRiskSummary?: ExecutionAdjustedRiskSummary;
  managerHistorySummary?: ManagerExecutionHistorySummary;
  managerInventoryReadback?: PredictManagerInventoryReadback;
}): string {
  const {
    market,
    metrics,
    scenarios,
    results,
    recommendation,
    liveContext,
    mintExecution,
    executionRiskSummary,
    managerHistorySummary,
    managerInventoryReadback,
  } = input;

  return [
    "# PredictGuard Risk Report",
    "",
    `Generated: ${new Date(market.timestamp).toISOString()}`,
    `Data source: ${liveContext?.dataSource ?? market.dataSource}`,
    `Spot: ${market.spotPrice.toLocaleString("en-US")} ${market.quoteAsset}`,
    liveContext?.reachable
      ? `Live Predict server: ${liveContext.serverStatus ?? "unknown"}`
      : "Live Predict server: unavailable",
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
    "## Live Testnet Context",
    "",
    ...(liveContext
      ? [
          `- Source mode: ${liveContext.dataSource}`,
          `- Fetched at: ${liveContext.fetchedAt}`,
          `- Server status: ${liveContext.serverStatus ?? "N/A"}`,
          `- Max checkpoint lag: ${liveContext.maxCheckpointLag ?? "N/A"}`,
          `- Active BTC oracles: ${liveContext.activeOracleCount}`,
          `- Live vault value: ${liveContext.vault ? liveContext.vault.valueDUsdc.toFixed(2) : "N/A"} dUSDC`,
          `- Live vault utilization: ${liveContext.vault ? (liveContext.vault.utilization * 100).toFixed(3) : "N/A"}%`,
          `- Live total max payout: ${liveContext.vault ? liveContext.vault.totalMaxPayoutDUsdc.toFixed(2) : "N/A"} dUSDC`,
          `- Quote assets: ${liveContext.quoteAssets.length > 0 ? liveContext.quoteAssets.join(", ") : "N/A"}`,
        ]
      : ["- Live context not loaded in this report render."]),
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
    "## On-Chain Execution",
    "",
    ...(mintExecution
      ? [
          `- Status: ${mintExecution.status}`,
          `- Digest: ${mintExecution.digest}`,
          `- SuiVision: https://testnet.suivision.xyz/txblock/${mintExecution.digest}`,
          `- Position: ${mintExecution.side ?? "N/A"} ${mintExecution.strike?.toLocaleString("en-US") ?? "N/A"}`,
          `- Quantity: ${formatDusdc(mintExecution.quantityDusdc)}`,
          `- Actual cost: ${formatDusdc(mintExecution.costDusdc)}`,
          `- Ask price: ${mintExecution.askPrice?.toLocaleString("en-US", { maximumFractionDigits: 9 }) ?? "N/A"}`,
          `- Manager: ${mintExecution.managerId ?? "N/A"}`,
          `- Oracle: ${mintExecution.oracleId ?? "N/A"}`,
          ...(executionRiskSummary
            ? [
                `- Recommended notional: ${formatDusdc(executionRiskSummary.recommendedNotionalDusdc)}`,
                `- Coverage ratio: ${executionRiskSummary.coverageRatioPct.toFixed(2)}%`,
                `- Executed gap: ${formatDusdc(executionRiskSummary.executedGapDusdc)}`,
                `- Actual cost ratio: ${executionRiskSummary.actualCostRatioPct?.toFixed(2) ?? "N/A"}%`,
                `- Budget usage: ${executionRiskSummary.budgetUsagePct?.toFixed(2) ?? "N/A"}%`,
                `- Deposited: ${formatDusdc(executionRiskSummary.depositedDusdc)}`,
                `- Estimated manager remaining: ${formatDusdc(executionRiskSummary.estimatedManagerRemainingDusdc)}`,
              ]
            : []),
          "- Note: current execution uses latest available sizing evidence; full manager inventory remains pending.",
        ]
      : [
          "- No wallet-signed Predict mint has been executed in this browser session.",
          "- Latest verified testnet evidence is tracked in the project evolution log.",
        ]),
    "",
    "## Manager / Account Summary",
    "",
    ...(managerInventoryReadback
      ? [
          `- Direct manager readback source: ${managerInventoryReadback.source}`,
          `- Manager object: ${managerInventoryReadback.managerObjectId}`,
          `- Object version: ${managerInventoryReadback.objectVersion ?? "N/A"}`,
          `- Object digest: ${managerInventoryReadback.objectDigest ?? "N/A"}`,
          `- On-chain dUSDC balance: ${formatDusdc(managerInventoryReadback.directDusdcBalance)}`,
          `- On-chain position entries: ${managerInventoryReadback.positionEntryCount ?? "N/A"}`,
          `- On-chain position quantity: ${formatDusdc(managerInventoryReadback.directPositionQuantityDusdc)}`,
          `- Balances table: ${managerInventoryReadback.balancesTableId ?? "N/A"}`,
          `- Positions table: ${managerInventoryReadback.positionsTableId ?? "N/A"}`,
          "- Note: direct readback currently parses manager object and Table entries; full MarketKey decoding remains pending.",
          "",
        ]
      : [
          "- Direct manager inventory readback not loaded.",
          "",
        ]),
    ...(managerHistorySummary
      ? [
          `- Manager: ${managerHistorySummary.managerId ?? "N/A"}`,
          `- Local execution count: ${managerHistorySummary.executionCount}`,
          `- Total minted quantity: ${formatDusdc(managerHistorySummary.totalQuantityDusdc)}`,
          `- Total deposited: ${formatDusdc(managerHistorySummary.totalDepositedDusdc)}`,
          `- Total actual cost: ${formatDusdc(managerHistorySummary.totalActualCostDusdc)}`,
          `- Estimated manager remaining: ${formatDusdc(managerHistorySummary.estimatedManagerRemainingDusdc)}`,
          `- Latest digest: ${managerHistorySummary.latestDigest ?? "N/A"}`,
          "- Note: this is a local event-history estimate until direct manager inventory readback is implemented.",
        ]
      : ["- No local manager execution history available."]),
    "",
    "## Assumptions",
    "",
    ...recommendation.assumptions.map((assumption) => `- ${assumption}`),
    ...(liveContext?.assumptions ?? []).map((assumption) => `- ${assumption}`),
  ].join("\n");
}

function formatDusdc(value?: number) {
  return value === undefined
    ? "N/A"
    : `${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} dUSDC`;
}
