import type { PredictMintExecutionSummary } from "@/lib/predict/execution";
import { runScenarioSet } from "@/lib/risk/engine";
import type {
  HedgeCandidate,
  MarketState,
  Scenario,
  ScenarioResult,
} from "@/lib/types";

export type ExecutedStressComparison = {
  scenarioId: string;
  scenarioName: string;
  scenarioSpot: number;
  unhedgedPnl: number;
  recommendedHedgedPnl?: number;
  executedHedgedPnl?: number;
  executedImprovementDusdc?: number;
  executedTailLossReductionPct?: number;
  recommendedTailLossReductionPct?: number;
};

export type ExecutedStressSummary = {
  source: "latest-wallet-execution";
  executedHedge?: HedgeCandidate;
  comparisons: ExecutedStressComparison[];
  worstUnhedgedPnl: number;
  worstRecommendedPnl?: number;
  worstExecutedPnl?: number;
  executedWorstCaseImprovementDusdc?: number;
};

export function buildExecutedStressSummary(input: {
  market: MarketState;
  scenarios: Scenario[];
  recommendedHedge?: HedgeCandidate;
  execution?: PredictMintExecutionSummary | null;
}): ExecutedStressSummary {
  const unhedgedResults = runScenarioSet(input.market, input.scenarios);
  const recommendedResults = runScenarioSet(
    input.market,
    input.scenarios,
    input.recommendedHedge,
  );
  const executedHedge = executionToHedgeCandidate(input.execution);
  const executedResults = executedHedge
    ? runScenarioSet(input.market, input.scenarios, executedHedge)
    : undefined;
  const comparisons = input.scenarios.map((scenario, index) => {
    const unhedged = unhedgedResults[index];
    const recommended = recommendedResults[index];
    const executed = executedResults?.[index];

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      scenarioSpot: unhedged.scenarioSpot,
      unhedgedPnl: unhedged.unhedgedPnl,
      recommendedHedgedPnl: recommended.hedgedPnl,
      executedHedgedPnl: executed?.hedgedPnl,
      executedImprovementDusdc: executed
        ? executed.hedgedPnl === undefined
          ? undefined
          : executed.hedgedPnl - unhedged.unhedgedPnl
        : undefined,
      executedTailLossReductionPct: executed?.tailLossReductionPct,
      recommendedTailLossReductionPct: recommended.tailLossReductionPct,
    };
  });
  const worstUnhedgedPnl = minPnl(unhedgedResults, "unhedgedPnl");
  const worstRecommendedPnl = input.recommendedHedge
    ? minPnl(recommendedResults, "hedgedPnl")
    : undefined;
  const worstExecutedPnl = executedResults
    ? minPnl(executedResults, "hedgedPnl")
    : undefined;

  return {
    source: "latest-wallet-execution",
    executedHedge,
    comparisons,
    worstUnhedgedPnl,
    worstRecommendedPnl,
    worstExecutedPnl,
    executedWorstCaseImprovementDusdc: worstExecutedPnl === undefined
      ? undefined
      : worstExecutedPnl - worstUnhedgedPnl,
  };
}

function executionToHedgeCandidate(
  execution?: PredictMintExecutionSummary | null,
): HedgeCandidate | undefined {
  if (
    !execution?.side ||
    execution.strike === undefined ||
    execution.quantityDusdc === undefined ||
    execution.costDusdc === undefined
  ) {
    return undefined;
  }

  return {
    side: execution.side,
    strike: execution.strike,
    expiryId: execution.expiryMs ?? "executed",
    notional: execution.quantityDusdc,
    estimatedCost: execution.costDusdc,
    expectedLossReduction: 0,
    lossReductionPct: 0,
    score: 0,
  };
}

function minPnl(
  results: ScenarioResult[],
  key: "unhedgedPnl" | "hedgedPnl",
) {
  return Math.min(
    ...results.map((result) =>
      key === "unhedgedPnl"
        ? result.unhedgedPnl
        : result.hedgedPnl ?? result.unhedgedPnl,
    ),
  );
}
