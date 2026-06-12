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
  PredictRedeemExecutionSummary,
} from "@/lib/predict/execution";
import type { PredictManagerInventoryReadback } from "@/lib/predict/managerReadback";
import type { ExecutedStressSummary } from "@/lib/risk/executedStress";

export function buildMarkdownReport(input: {
  market: MarketState;
  metrics: RiskMetrics;
  scenarios: Scenario[];
  results: ScenarioResult[];
  recommendation: HedgeRecommendation;
  liveContext?: NormalizedPredictLiveContext;
  mintExecution?: PredictMintExecutionSummary | null;
  redeemExecution?: PredictRedeemExecutionSummary | null;
  executionRiskSummary?: ExecutionAdjustedRiskSummary;
  managerHistorySummary?: ManagerExecutionHistorySummary;
  managerInventoryReadback?: PredictManagerInventoryReadback;
  redeemEvidenceLinks?: {
    entryFieldId: string;
    evidence: PredictRedeemExecutionSummary;
    confidence: string;
  }[];
  executedStressSummary?: ExecutedStressSummary;
  ptbPlan?: {
    inputs: {
      sizingMode?: string;
      side?: string;
      oracleObjectId?: string;
      oracleExpiryMs?: number;
      quoteSource?: string;
      quoteFreshness?: string;
      quoteAskPrice?: number;
      quoteExplanation?: string;
    };
  };
  redeemPreviewPlan?: {
    target: string;
    mode: string;
    readiness: {
      status: string;
      canSign: boolean;
      missing: string[];
      guards?: {
        id: string;
        label: string;
        status: string;
        detail: string;
      }[];
      warnings: string[];
    };
    inputs: {
      managerObjectId?: string;
      oracleObjectId?: string;
      oracleExpiryMs?: string;
      strike?: number;
      side?: string;
      quantityDusdc?: number;
      lifecycle?: string;
      oracleStatus?: string;
      settlementPrice?: number;
      settledAt?: number;
    };
    evidence: {
      oracleMatched: boolean;
      oracleQuoteable: boolean;
      oracleSettled: boolean;
      vaultSettledEvidence: string;
      redeemability: string;
      notes: string[];
    };
  };
}): string {
  const {
    market,
    metrics,
    scenarios,
    results,
    recommendation,
    liveContext,
    mintExecution,
    redeemExecution,
    executionRiskSummary,
    managerHistorySummary,
    managerInventoryReadback,
    redeemEvidenceLinks,
    executedStressSummary,
    ptbPlan,
    redeemPreviewPlan,
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
    "## Workflow Status",
    "",
    `- Risk identification: ${metrics.riskScore > 0 ? "complete" : "blocked"} (${metrics.riskScore}/100)`,
    `- Hedge recommendation: ${recommendation.recommendedHedge ? "complete" : "blocked"}`,
    `- Demo execution side: ${ptbPlan?.inputs.side ?? "N/A"}`,
    `- Demo oracle: ${ptbPlan?.inputs.oracleObjectId ?? "N/A"}`,
    `- Demo oracle expiry: ${ptbPlan?.inputs.oracleExpiryMs ?? "N/A"}`,
    `- Demo sizing mode: ${ptbPlan?.inputs.sizingMode ?? "N/A"}`,
    `- Wallet execution: ${mintExecution ? "complete" : "pending"}`,
    `- Manager readback: ${managerInventoryReadback ? "complete" : "pending"}`,
    `- Lifecycle readiness: ${managerInventoryReadback ? "read-only" : "pending"}`,
    `- Redeem evidence: ${redeemExecution ? "available" : "not captured"}`,
    `- Active position quantity: ${formatDusdc(managerInventoryReadback?.directActivePositionQuantityDusdc)}`,
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
    "## Executed Stress Comparison",
    "",
    ...(executedStressSummary
      ? [
          `- Source: ${executedStressSummary.source}`,
          `- Executed hedge: ${executedStressSummary.executedHedge ? `${executedStressSummary.executedHedge.side} ${executedStressSummary.executedHedge.strike.toLocaleString("en-US")} / ${formatDusdc(executedStressSummary.executedHedge.notional)}` : "N/A"}`,
          `- Worst unhedged PnL: ${formatDusdc(executedStressSummary.worstUnhedgedPnl)}`,
          `- Worst executed PnL: ${formatDusdc(executedStressSummary.worstExecutedPnl)}`,
          `- Worst-case improvement: ${formatDusdc(executedStressSummary.executedWorstCaseImprovementDusdc)}`,
          "",
          "| Scenario | Unhedged | Recommended | Executed | Executed reduction |",
          "| --- | ---: | ---: | ---: | ---: |",
          ...executedStressSummary.comparisons.map((comparison) =>
            `| ${comparison.scenarioName} | ${comparison.unhedgedPnl.toFixed(2)} | ${comparison.recommendedHedgedPnl?.toFixed(2) ?? "N/A"} | ${comparison.executedHedgedPnl?.toFixed(2) ?? "N/A"} | ${comparison.executedTailLossReductionPct?.toFixed(1) ?? "N/A"}% |`
          ),
        ]
      : ["- Executed stress comparison not available."]),
    "",
    "## Hedge Recommendation",
    "",
    recommendation.recommendedHedge
      ? `Buy ${recommendation.recommendedHedge.notional} ${recommendation.recommendedHedge.side} notional at strike ${recommendation.recommendedHedge.strike.toLocaleString("en-US")} for expiry ${recommendation.recommendedHedge.expiryId}. Estimated cost: ${recommendation.recommendedHedge.estimatedCost.toFixed(2)} dUSDC.`
      : "No hedge recommended.",
    "",
    "## On-Chain Execution",
    "",
    "### Sizing Evidence",
    "",
    `- Sizing mode: ${ptbPlan?.inputs.sizingMode ?? "N/A"}`,
    `- Quote source: ${ptbPlan?.inputs.quoteSource ?? "N/A"}`,
    `- Quote freshness: ${ptbPlan?.inputs.quoteFreshness ?? "N/A"}`,
    `- Ask price input: ${ptbPlan?.inputs.quoteAskPrice?.toLocaleString("en-US", { maximumFractionDigits: 9 }) ?? "N/A"}`,
    `- Quote note: ${ptbPlan?.inputs.quoteExplanation ?? "N/A"}`,
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
          `- Active position quantity: ${formatDusdc(managerInventoryReadback.directActivePositionQuantityDusdc)}`,
          `- Reconstructed at: ${managerInventoryReadback.reconstructedAtIso}`,
          `- Lifecycle readiness: read-only`,
          `- Redeem evidence links: ${redeemEvidenceLinks?.length ?? 0}`,
          `- Balances table: ${managerInventoryReadback.balancesTableId ?? "N/A"}`,
          `- Positions table: ${managerInventoryReadback.positionsTableId ?? "N/A"}`,
          "- Decoded positions:",
          ...formatDecodedPositions(managerInventoryReadback, redeemEvidenceLinks ?? []),
          "- Note: lifecycle readiness does not prove redeemability without PositionRedeemed history plus oracle/vault settlement state.",
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
    "## Lifecycle / Redeem Evidence",
    "",
    ...(redeemExecution
      ? [
          `- Status: ${redeemExecution.status}`,
          `- Digest: ${redeemExecution.digest}`,
          `- SuiVision: https://testnet.suivision.xyz/txblock/${redeemExecution.digest}`,
          `- Position: ${redeemExecution.side ?? "N/A"} ${redeemExecution.strike?.toLocaleString("en-US") ?? "N/A"}`,
          `- Quantity: ${formatDusdc(redeemExecution.quantityDusdc)}`,
          `- Payout: ${formatDusdc(redeemExecution.payoutDusdc)}`,
          `- Bid price: ${redeemExecution.bidPrice?.toLocaleString("en-US", { maximumFractionDigits: 9 }) ?? "N/A"}`,
          `- Is settled: ${redeemExecution.isSettled === undefined ? "N/A" : redeemExecution.isSettled ? "yes" : "no"}`,
          `- Event sequence: ${redeemExecution.eventSequence ?? "N/A"}`,
          `- Manager: ${redeemExecution.managerId ?? "N/A"}`,
          `- Oracle: ${redeemExecution.oracleId ?? "N/A"}`,
          `- Owner: ${redeemExecution.owner ?? "N/A"}`,
          `- Executor: ${redeemExecution.executor ?? "N/A"}`,
          `- Permissionless executor: ${isExternalRedeemExecutor(redeemExecution) ? "yes" : "no"}`,
          ...(isExternalRedeemExecutor(redeemExecution)
            ? [
                "- Note: owner and executor differ, which means an external executor submitted the permissionless redeem while payout remains credited to the owner's PredictManager.",
              ]
            : []),
        ]
      : [
          "- No PositionRedeemed evidence has been captured in this browser session.",
          "- Current lifecycle readiness is read-only and based on manager position status.",
        ]),
    "",
    "### Redeem PTB Preview",
    "",
    ...(redeemPreviewPlan
      ? [
          `- Target: ${redeemPreviewPlan.target}`,
          `- Mode: ${redeemPreviewPlan.mode}`,
          `- Readiness: ${redeemPreviewPlan.readiness.status}`,
          `- Signing enabled: ${redeemPreviewPlan.readiness.canSign ? "yes" : "no"}`,
          `- Position: ${redeemPreviewPlan.inputs.side ?? "N/A"} ${redeemPreviewPlan.inputs.strike?.toLocaleString("en-US") ?? "N/A"}`,
          `- Quantity: ${formatDusdc(redeemPreviewPlan.inputs.quantityDusdc)}`,
          `- Lifecycle: ${redeemPreviewPlan.inputs.lifecycle ?? "N/A"}`,
          `- Oracle status: ${redeemPreviewPlan.inputs.oracleStatus ?? "N/A"}`,
          `- Oracle matched: ${redeemPreviewPlan.evidence.oracleMatched ? "yes" : "no"}`,
          `- Oracle quoteable evidence: ${redeemPreviewPlan.evidence.oracleQuoteable ? "yes" : "no"}`,
          `- Oracle settled evidence: ${redeemPreviewPlan.evidence.oracleSettled ? "yes" : "no"}`,
          `- Vault settled evidence: ${redeemPreviewPlan.evidence.vaultSettledEvidence}`,
          `- Redeemability: ${redeemPreviewPlan.evidence.redeemability}`,
          `- Manager: ${redeemPreviewPlan.inputs.managerObjectId ?? "N/A"}`,
          `- Oracle: ${redeemPreviewPlan.inputs.oracleObjectId ?? "N/A"}`,
          ...(redeemPreviewPlan.readiness.guards ?? []).map((guard) =>
            `- Guard ${guard.label}: ${guard.status} - ${guard.detail}`
          ),
          ...redeemPreviewPlan.evidence.notes.map((note) => `- Evidence note: ${note}`),
          ...(redeemPreviewPlan.readiness.missing.length > 0
            ? [`- Missing: ${redeemPreviewPlan.readiness.missing.join(", ")}`]
            : []),
          "- Note: redeem preview is intentionally read-only until redeemability checks and live validation are complete.",
        ]
      : ["- Redeem PTB preview not available."]),
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

function isExternalRedeemExecutor(redeemExecution: PredictRedeemExecutionSummary) {
  return Boolean(
    redeemExecution.owner &&
    redeemExecution.executor &&
    normalizeObjectId(redeemExecution.owner) !== normalizeObjectId(redeemExecution.executor),
  );
}

function normalizeObjectId(value: string) {
  return value.startsWith("0x") ? value.slice(2).toLowerCase() : value.toLowerCase();
}

function formatDecodedPositions(
  readback: PredictManagerInventoryReadback,
  redeemEvidenceLinks: {
    entryFieldId: string;
    evidence: PredictRedeemExecutionSummary;
    confidence: string;
  }[],
) {
  if (readback.positionEntries.length === 0) {
    return ["  - None"];
  }

  return readback.positionEntries.slice(0, 6).map((entry) => {
    const redeemLink = redeemEvidenceLinks.find((link) => link.entryFieldId === entry.fieldId);

    if (!entry.marketKey) {
      return `  - Undecoded MarketKey: ${formatDusdc(entry.quantityDusdc)}`;
    }

    return [
      `  - ${entry.marketKey.side} ${entry.marketKey.strike.toLocaleString("en-US", {
        maximumFractionDigits: 6,
      })}`,
      `quantity ${formatDusdc(entry.quantityDusdc)}`,
      `status ${entry.status.label}`,
      `lifecycle ${entry.lifecycle.label}`,
      `expiry ${entry.marketKey.expiryIso}`,
      `oracle ${entry.marketKey.oracleId}`,
      redeemLink
        ? `redeem linked payout ${formatDusdc(redeemLink.evidence.payoutDusdc)} via ${redeemLink.confidence}`
        : "redeem linked none",
    ].join("; ");
  });
}
