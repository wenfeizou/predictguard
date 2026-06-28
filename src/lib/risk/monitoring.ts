import type { NormalizedPredictLiveContext } from "@/lib/predict/normalize";
import type { PredictManagerInventoryReadback } from "@/lib/predict/managerReadback";
import type { HedgeRecommendation, MarketState, RiskMetrics } from "@/lib/types";
import { getMonitoringPreset, type MonitoringPresetId } from "@/lib/risk/monitoringPresets";

export type MonitoringRuleSeverity = "info" | "warning" | "critical";
export type MonitoringRuleStatus = "pass" | "watch" | "breach" | "unknown";

export type MonitoringRuleResult = {
  id: string;
  label: string;
  status: MonitoringRuleStatus;
  severity: MonitoringRuleSeverity;
  value: string;
  threshold: string;
  detail: string;
  commercialUse: string;
};

export function evaluateMonitoringRules(input: {
  market: MarketState;
  metrics: RiskMetrics;
  recommendation: HedgeRecommendation;
  liveContext?: NormalizedPredictLiveContext;
  inventory?: PredictManagerInventoryReadback;
  presetId?: MonitoringPresetId;
}) {
  const { market, metrics, recommendation, liveContext, inventory } = input;
  const preset = getMonitoringPreset(input.presetId ?? "balanced");
  const maxLiabilityPct = metrics.maxPayoutLiability / Math.max(1, metrics.tvl);
  const activeQuantity = inventory?.directActivePositionQuantityDusdc;
  const hedgeGap = recommendation.recommendedHedge
    ? Math.max(0, recommendation.recommendedHedge.notional - (activeQuantity ?? 0))
    : 0;

  return [
    {
      id: "utilization",
      label: "PLP utilization",
      status: metrics.utilization >= preset.utilizationBreachPct / 100
        ? "breach"
        : metrics.utilization >= preset.utilizationWatchPct / 100
          ? "watch"
          : "pass",
      severity: metrics.utilization >= preset.utilizationBreachPct / 100 ? "critical" : "warning",
      value: `${(metrics.utilization * 100).toFixed(1)}%`,
      threshold: `Watch >= ${preset.utilizationWatchPct}%, breach >= ${preset.utilizationBreachPct}%`,
      detail: "High utilization reduces the liquidity buffer available for payout shocks.",
      commercialUse: "Alert LPs before vault utilization becomes uncomfortable.",
    },
    {
      id: "tail-liability",
      label: "Max payout liability",
      status: maxLiabilityPct >= preset.liabilityBreachPct / 100
        ? "breach"
        : maxLiabilityPct >= preset.liabilityWatchPct / 100
          ? "watch"
          : "pass",
      severity: maxLiabilityPct >= preset.liabilityBreachPct / 100 ? "critical" : "warning",
      value: `${(maxLiabilityPct * 100).toFixed(1)}% of TVL`,
      threshold: `Watch >= ${preset.liabilityWatchPct}%, breach >= ${preset.liabilityBreachPct}%`,
      detail: "Gross payout liability is compared with TVL to identify concentrated vault risk.",
      commercialUse: "Help vault teams set risk limits before accepting more flow.",
    },
    {
      id: "oracle-freshness",
      label: "Oracle freshness",
      status: liveContext
        ? liveContext.activeOracleCount > 0
          ? "pass"
          : "watch"
        : "unknown",
      severity: "warning",
      value: liveContext ? `${liveContext.activeOracleCount} active BTC oracles` : "N/A",
      threshold: "At least one active quoteable BTC oracle",
      detail: "Quote and lifecycle confidence drops when no active oracle context is available.",
      commercialUse: "Warn operators when execution or monitoring should not rely on stale context.",
    },
    {
      id: "settlement-readiness",
      label: "Settlement readiness",
      status: inventory
        ? inventory.positionEntries.some((entry) => entry.lifecycle.requiresRedeemEvidence)
          ? "watch"
          : "pass"
        : "unknown",
      severity: "info",
      value: inventory ? `${inventory.positionEntries.length} decoded positions` : "No manager readback",
      threshold: "All expired or zero-quantity positions need evidence review",
      detail: "Expired and zero-quantity positions require settlement and redeem evidence before payout can be claimed as proven.",
      commercialUse: "Turn lifecycle uncertainty into a review queue for vault operators.",
    },
    {
      id: "hedge-drift",
      label: "Hedge drift",
      status: recommendation.recommendedHedge
        ? hedgeGap > recommendation.recommendedHedge.notional * (preset.hedgeGapWatchPct / 100)
          ? "watch"
          : "pass"
        : "unknown",
      severity: "warning",
      value: recommendation.recommendedHedge
        ? `${hedgeGap.toLocaleString("en-US", { maximumFractionDigits: 6 })} dUSDC gap`
        : "No hedge target",
      threshold: `Watch when executed active quantity is less than ${100 - preset.hedgeGapWatchPct}% of target`,
      detail: "Compares recommended hedge notional with manager active position quantity when readback exists.",
      commercialUse: "Flag when a vault's executed protection no longer matches the policy target.",
    },
    {
      id: "data-mode",
      label: "Data mode",
      status: market.dataSource === "mixed-live-and-simulated" || liveContext
        ? "watch"
        : "unknown",
      severity: "info",
      value: liveContext?.dataSource ?? market.dataSource,
      threshold: "Production reports should identify simulated assumptions",
      detail: "Commercial reports must make data provenance explicit before being shared externally.",
      commercialUse: "Prevent teams from confusing demo assumptions with production-grade indexing.",
    },
  ] satisfies MonitoringRuleResult[];
}
