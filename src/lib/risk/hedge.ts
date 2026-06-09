import { buildExposureMatrix, getMarketPrice, runScenarioSet } from "@/lib/risk/engine";
import type {
  HedgeCandidate,
  HedgeConstraints,
  HedgeRecommendation,
  MarketState,
  Scenario,
  Side,
} from "@/lib/types";

const defaultConstraints: HedgeConstraints = {
  maxCostPctOfTvl: 0.0025,
  targetLossReductionPct: 35,
  preferSameExpiry: true,
};

export function rankHedgeCandidates(
  market: MarketState,
  scenarios: Scenario[],
  constraints: HedgeConstraints = defaultConstraints,
): HedgeCandidate[] {
  const unhedgedResults = runScenarioSet(market, scenarios);
  const worst = unhedgedResults.reduce((current, result) =>
    result.unhedgedPnl < current.unhedgedPnl ? result : current,
  );
  const worstScenario = scenarios.find((scenario) => scenario.id === worst.scenarioId);
  const side: Side = (worstScenario?.spotMovePct ?? 0) >= 0 ? "YES" : "NO";
  const largestCell = buildExposureMatrix(market).reduce((largest, cell) =>
    cell.maxPayoutLiability > largest.maxPayoutLiability ? cell : largest,
  );
  const targetExpiryId = constraints.preferSameExpiry
    ? largestCell.expiryId
    : market.expiries[0]?.id;

  const strikePool = market.strikes
    .map((strike) => strike.value)
    .filter((strike) =>
      side === "YES" ? strike > market.spotPrice : strike < market.spotPrice,
    );
  const notionals = [25, 50, 75, 100, 125, 150];

  const candidates = strikePool.flatMap((strike) =>
    notionals.map((notional) => {
      const estimatedCost =
        getMarketPrice(market, targetExpiryId, strike, side) * notional;
      const candidate: HedgeCandidate = {
        side,
        strike,
        expiryId: targetExpiryId,
        notional,
        estimatedCost,
        expectedLossReduction: 0,
        lossReductionPct: 0,
        score: 0,
      };
      const hedgedWorst = Math.min(
        ...runScenarioSet(market, scenarios, candidate).map(
          (result) => result.hedgedPnl ?? result.unhedgedPnl,
        ),
      );
      const expectedLossReduction = Math.max(0, hedgedWorst - worst.unhedgedPnl);
      const lossReductionPct =
        worst.unhedgedPnl < 0
          ? (expectedLossReduction / Math.abs(worst.unhedgedPnl)) * 100
          : 0;

      return {
        ...candidate,
        estimatedCost: Number(estimatedCost.toFixed(2)),
        expectedLossReduction: Number(expectedLossReduction.toFixed(2)),
        lossReductionPct: Number(lossReductionPct.toFixed(1)),
        score: Number((expectedLossReduction / Math.max(1, estimatedCost)).toFixed(2)),
      };
    }),
  );

  const costCap = market.plp.tvl * constraints.maxCostPctOfTvl;
  const underCap = candidates.filter((candidate) => candidate.estimatedCost <= costCap);
  const pool = underCap.length > 0 ? underCap : candidates;

  return pool
    .filter((candidate) => candidate.expectedLossReduction > 0)
    .sort((a, b) => b.score - a.score || b.lossReductionPct - a.lossReductionPct);
}

export function selectRecommendedHedge(
  market: MarketState,
  scenarios: Scenario[],
): HedgeCandidate | undefined {
  return rankHedgeCandidates(market, scenarios)[0];
}

export function buildHedgeRecommendation(
  market: MarketState,
  scenarios: Scenario[],
): HedgeRecommendation {
  const hedge = selectRecommendedHedge(market, scenarios);
  const unhedgedResults = runScenarioSet(market, scenarios);
  const unhedgedMaxLoss = Math.min(
    ...unhedgedResults.map((result) => result.unhedgedPnl),
  );

  if (!hedge) {
    return {
      shouldHedge: false,
      riskSummary: "No hedge candidate materially improves the simulated tail loss.",
      expectedEffect: {
        unhedgedMaxLoss,
        hedgedMaxLoss: unhedgedMaxLoss,
        tailLossReductionPct: 0,
      },
      tradeoffs: ["No hedge cost is paid, but tail exposure remains unchanged."],
      assumptions: market.assumptions,
      plainEnglishExplanation:
        "PredictGuard did not find a cost-effective OTM binary hedge under the current deterministic constraints.",
    };
  }

  const hedgedResults = runScenarioSet(market, scenarios, hedge);
  const hedgedMaxLoss = Math.min(
    ...hedgedResults.map((result) => result.hedgedPnl ?? result.unhedgedPnl),
  );
  const tailLossReductionPct =
    unhedgedMaxLoss < 0
      ? ((hedgedMaxLoss - unhedgedMaxLoss) / Math.abs(unhedgedMaxLoss)) * 100
      : 0;

  return {
    shouldHedge: true,
    riskSummary:
      "PLP exposure is concentrated in short-dated upside strikes, so an OTM YES hedge reduces the largest simulated tail loss.",
    recommendedHedge: hedge,
    expectedEffect: {
      unhedgedMaxLoss: Number(unhedgedMaxLoss.toFixed(2)),
      hedgedMaxLoss: Number(hedgedMaxLoss.toFixed(2)),
      tailLossReductionPct: Number(tailLossReductionPct.toFixed(1)),
    },
    tradeoffs: [
      "The hedge lowers simulated tail loss but reduces retained premium if the tail event does not happen.",
      "This is a deterministic risk heuristic, not a directional BTC forecast.",
    ],
    assumptions: market.assumptions,
    plainEnglishExplanation: `The vault has concentrated short ${hedge.side} exposure near ${hedge.strike.toLocaleString("en-US")} for the ${hedge.expiryId} expiry. Buying a smaller OTM ${hedge.side} binary hedge costs about ${hedge.estimatedCost.toFixed(2)} dUSDC and reduces the worst simulated loss by ${hedge.lossReductionPct.toFixed(1)}%.`,
  };
}
