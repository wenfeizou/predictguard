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
import type { PredictRedeemHistoryReadback } from "@/lib/predict/redeemHistoryReadback";
import type { ExecutedStressSummary } from "@/lib/risk/executedStress";

export type CommercialReportInput = {
  market: MarketState;
  metrics: RiskMetrics;
  scenarios: Scenario[];
  results: ScenarioResult[];
  recommendation: HedgeRecommendation;
  liveContext?: NormalizedPredictLiveContext;
  mintExecution?: PredictMintExecutionSummary | null;
  redeemExecution?: PredictRedeemExecutionSummary | null;
  redeemHistoryReadback?: PredictRedeemHistoryReadback | null;
  executionRiskSummary?: ExecutionAdjustedRiskSummary;
  managerHistorySummary?: ManagerExecutionHistorySummary;
  managerInventoryReadback?: PredictManagerInventoryReadback;
  redeemEvidenceLinks?: {
    entryFieldId: string;
    evidence: PredictRedeemExecutionSummary;
    confidence: string;
  }[];
  settlementAccounting?: {
    totalPositions: number;
    activePositions: number;
    expiredPositions: number;
    zeroQuantityPositions: number;
    redeemedPositions: number;
    evidenceMissingPositions: number;
    totalCurrentQuantityDusdc: number;
    totalRedeemedQuantityDusdc: number;
    totalPayoutDusdc: number;
    totalUnresolvedQuantityDusdc: number;
    externalExecutorRedeems: number;
    totalMintedQuantityDusdc: number;
    totalMintCostDusdc: number;
    realizedHedgePnlDusdc?: number;
    claimedPayoutDusdc: number;
    unclaimedPayoutDusdc?: number;
    accountingScope: string;
    status: string;
    explanation: string;
  };
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
};

export type CommercialReport = {
  title: string;
  generatedAt: string;
  mode: string;
  executiveSummary: string[];
  workflowStatus: ReportRow[];
  riskSnapshot: ReportRow[];
  riskScoreRows: ReportRow[];
  scenarioRows: ScenarioReportRow[];
  hedgeRows: ReportRow[];
  executionRows: ReportRow[];
  lifecycleRows: ReportRow[];
  assumptions: string[];
  residualRisks: string[];
  nextActions: string[];
};

export type ReportRow = {
  label: string;
  value: string;
  note?: string;
};

export type ScenarioReportRow = {
  scenario: string;
  unhedgedPnl: string;
  hedgedPnl: string;
  reduction: string;
};

export function buildCommercialReport(input: CommercialReportInput): CommercialReport {
  const {
    market,
    metrics,
    scenarios,
    results,
    recommendation,
    liveContext,
    mintExecution,
    redeemExecution,
    redeemHistoryReadback,
    executionRiskSummary,
    managerHistorySummary,
    managerInventoryReadback,
    redeemEvidenceLinks,
    settlementAccounting,
    executedStressSummary,
    ptbPlan,
    redeemPreviewPlan,
  } = input;

  const sourceMode = liveContext?.dataSource ?? market.dataSource;
  const hasExecution = Boolean(mintExecution);
  const hasReadback = Boolean(managerInventoryReadback);
  const activeQuantity = managerInventoryReadback?.directActivePositionQuantityDusdc;

  return {
    title: "PredictGuard Risk Report",
    generatedAt: new Date(market.timestamp).toISOString(),
    mode: sourceMode,
    executiveSummary: [
      "PredictGuard reviews prediction-market liquidity risk by connecting exposure, scenario stress, hedge selection, wallet-confirmed execution evidence, and lifecycle readback.",
      recommendation.plainEnglishExplanation,
      "This report is non-custodial and evidence-first. It is designed for LPs, vault builders, and risk reviewers, not as directional trading advice.",
    ],
    workflowStatus: [
      row("Risk identification", `${metrics.riskScore}/100`, "Complete when exposure and scenario data are available."),
      row("Hedge recommendation", recommendation.recommendedHedge ? "Complete" : "Not recommended"),
      row("Wallet execution", hasExecution ? "Complete" : "Pending"),
      row("Manager readback", hasReadback ? "Complete" : "Pending"),
      row("Lifecycle readiness", hasReadback ? "Read-only evidence" : "Pending"),
      row("Redeem history discovery", redeemHistoryReadback ? "Bounded scan complete" : "Single evidence fallback"),
    ],
    riskSnapshot: [
      row("TVL", formatDusdc(metrics.tvl)),
      row("Utilization", `${(metrics.utilization * 100).toFixed(1)}%`),
      row("Risk score", `${metrics.riskScore}/100`),
      row("Max payout liability", formatDusdc(metrics.maxPayoutLiability)),
      row("Worst scenario PnL", formatDusdc(metrics.worstScenarioPnl)),
      row("Largest risk", `BTC > ${metrics.largestRiskStrike.toLocaleString("en-US")} / ${metrics.largestRiskExpiryId}`),
      row("Active position quantity", formatDusdc(activeQuantity)),
      row("Live server", liveContext?.reachable ? liveContext.serverStatus ?? "reachable" : "unavailable"),
    ],
    riskScoreRows: metrics.riskScoreComponents.map((component) =>
      row(
        component.label,
        `${component.contribution.toFixed(1)} / ${component.weight}`,
        component.explanation,
      )
    ),
    scenarioRows: results.map((result) => {
      const scenario = scenarios.find((item) => item.id === result.scenarioId);
      return {
        scenario: scenario?.name ?? result.scenarioId,
        unhedgedPnl: formatDusdc(result.unhedgedPnl),
        hedgedPnl: formatDusdc(result.hedgedPnl ?? result.unhedgedPnl),
        reduction: `${(result.tailLossReductionPct ?? 0).toFixed(1)}%`,
      };
    }),
    hedgeRows: recommendation.recommendedHedge
      ? [
          row("Side", recommendation.recommendedHedge.side),
          row("Strike", recommendation.recommendedHedge.strike.toLocaleString("en-US")),
          row("Expiry", recommendation.recommendedHedge.expiryId),
          row("Notional", formatDusdc(recommendation.recommendedHedge.notional)),
          row("Estimated cost", formatDusdc(recommendation.recommendedHedge.estimatedCost)),
          row("Expected loss reduction", formatDusdc(recommendation.recommendedHedge.expectedLossReduction)),
          row("Reduction", `${recommendation.recommendedHedge.lossReductionPct.toFixed(1)}%`),
        ]
      : [row("Recommendation", "No hedge recommended")],
    executionRows: [
      row("Sizing mode", ptbPlan?.inputs.sizingMode ?? "N/A"),
      row("Quote source", ptbPlan?.inputs.quoteSource ?? "N/A"),
      row("Quote freshness", ptbPlan?.inputs.quoteFreshness ?? "N/A"),
      row("Ask price input", formatOptionalNumber(ptbPlan?.inputs.quoteAskPrice, 9)),
      ...(mintExecution
        ? [
            row("Execution status", mintExecution.status),
            row("Digest", mintExecution.digest),
            row("Position", `${mintExecution.side ?? "N/A"} ${mintExecution.strike?.toLocaleString("en-US") ?? "N/A"}`),
            row("Quantity", formatDusdc(mintExecution.quantityDusdc)),
            row("Actual cost", formatDusdc(mintExecution.costDusdc)),
            row("Ask price", formatOptionalNumber(mintExecution.askPrice, 9)),
            row("Manager", mintExecution.managerId ?? "N/A"),
            row("Coverage ratio", executionRiskSummary ? `${executionRiskSummary.coverageRatioPct.toFixed(2)}%` : "N/A"),
            row("Budget usage", executionRiskSummary?.budgetUsagePct === undefined ? "N/A" : `${executionRiskSummary.budgetUsagePct.toFixed(2)}%`),
          ]
        : [
            row("Execution status", "No wallet-signed mint in this browser session"),
          ]),
    ],
    lifecycleRows: [
      ...(managerInventoryReadback
        ? [
            row("Manager object", managerInventoryReadback.managerObjectId),
            row("On-chain dUSDC", formatDusdc(managerInventoryReadback.directDusdcBalance)),
            row("Position entries", String(managerInventoryReadback.positionEntryCount ?? "N/A")),
            row("Active quantity", formatDusdc(managerInventoryReadback.directActivePositionQuantityDusdc)),
            row("Reconstructed at", managerInventoryReadback.reconstructedAtIso),
            row("Redeem evidence links", String(redeemEvidenceLinks?.length ?? 0)),
          ]
        : [row("Manager readback", "Not loaded")]),
      ...(managerHistorySummary
        ? [
            row("Local executions", String(managerHistorySummary.executionCount)),
            row("Total minted", formatDusdc(managerHistorySummary.totalQuantityDusdc)),
            row("Total actual cost", formatDusdc(managerHistorySummary.totalActualCostDusdc)),
            row("Latest digest", managerHistorySummary.latestDigest ?? "N/A"),
          ]
        : []),
      ...(settlementAccounting
        ? [
            row("Settlement status", settlementAccounting.status),
            row("Active positions", String(settlementAccounting.activePositions)),
            row("Redeemed positions", String(settlementAccounting.redeemedPositions)),
            row("Evidence missing", String(settlementAccounting.evidenceMissingPositions)),
            row("Realized hedge PnL", formatDusdc(settlementAccounting.realizedHedgePnlDusdc)),
            row("Accounting scope", settlementAccounting.accountingScope),
          ]
        : [row("Settlement accounting", "Not available")]),
      ...(redeemExecution
        ? [
            row("Latest redeem digest", redeemExecution.digest),
            row("Redeem payout", formatDusdc(redeemExecution.payoutDusdc)),
          ]
        : []),
      ...(redeemPreviewPlan
        ? [
            row("Redeem preview", redeemPreviewPlan.readiness.status),
            row("Redeemability", redeemPreviewPlan.evidence.redeemability),
          ]
        : []),
    ],
    assumptions: [
      ...recommendation.assumptions,
      ...(liveContext?.assumptions ?? []),
    ],
    residualRisks: [
      "Scenario results are deterministic and do not replace a production-grade risk model.",
      "Execution prices, liquidity, oracle state, and settlement evidence can change before expiry.",
      "Bounded event scans can miss older history until a production indexer is added.",
      "Hedge recommendations reduce selected scenario loss but do not guarantee profit or full protection.",
      executedStressSummary
        ? `Executed stress source: ${executedStressSummary.source}.`
        : "Executed stress comparison is unavailable until a mint execution exists.",
    ],
    nextActions: [
      "Review risk score drivers and tail scenario assumptions.",
      "Confirm manager readback and execution evidence before sharing the report externally.",
      "Define monitoring thresholds for utilization, max payout liability, oracle freshness, and settlement readiness.",
      "Export the report for LP, vault, or internal risk review.",
    ],
  };
}

function row(label: string, value: string, note?: string): ReportRow {
  return { label, value, note };
}

export function formatDusdc(value?: number) {
  return value === undefined
    ? "N/A"
    : `${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} dUSDC`;
}

function formatOptionalNumber(value?: number, maximumFractionDigits = 6) {
  return value === undefined
    ? "N/A"
    : value.toLocaleString("en-US", { maximumFractionDigits });
}
