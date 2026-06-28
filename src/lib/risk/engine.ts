import type {
  ExposureCell,
  HedgeCandidate,
  MarketState,
  RiskMetrics,
  Scenario,
  ScenarioResult,
  Side,
} from "@/lib/types";

export function getMarketPrice(
  market: MarketState,
  expiryId: string,
  strike: number,
  side: Side,
): number {
  const binaryMarket = market.markets.find(
    (item) => item.expiryId === expiryId && item.strike === strike,
  );

  if (!binaryMarket) {
    return 0;
  }

  return side === "YES" ? binaryMarket.yesPrice : binaryMarket.noPrice;
}

export function buildExposureMatrix(market: MarketState): ExposureCell[] {
  return market.expiries.flatMap((expiry) =>
    market.strikes.map((strike) => {
      const matching = market.exposures.filter(
        (exposure) =>
          exposure.expiryId === expiry.id && exposure.strike === strike.value,
      );
      const yesNotional = sumBy(
        matching.filter((exposure) => exposure.side === "YES"),
        "notional",
      );
      const noNotional = sumBy(
        matching.filter((exposure) => exposure.side === "NO"),
        "notional",
      );
      const premiumCollected = sumBy(matching, "premiumCollected");

      return {
        expiryId: expiry.id,
        expiryLabel: expiry.label,
        strike: strike.value,
        yesNotional,
        noNotional,
        netDirectionalNotional: yesNotional - noNotional,
        premiumCollected,
        maxPayoutLiability: yesNotional + noNotional,
      };
    }),
  );
}

export function runScenario(
  market: MarketState,
  scenario: Scenario,
  hedge?: HedgeCandidate,
): ScenarioResult {
  const scenarioSpot = market.spotPrice * (1 + scenario.spotMovePct / 100);
  const premiumCollected = sumBy(market.exposures, "premiumCollected");
  let payoutLiability = market.exposures.reduce((total, exposure) => {
    const pays =
      exposure.side === "YES"
        ? scenarioSpot > exposure.strike
        : scenarioSpot <= exposure.strike;

    return total + (pays ? exposure.notional : 0);
  }, 0);

  if (scenario.volShockPct) {
    const shortDatedExposure = market.exposures
      .filter((exposure) => exposure.expiryId === "15m")
      .reduce((total, exposure) => total + exposure.notional, 0);
    payoutLiability += shortDatedExposure * (scenario.volShockPct / 100) * 0.28;
  }

  const unhedgedPnl = premiumCollected - payoutLiability;

  if (!hedge) {
    return {
      scenarioId: scenario.id,
      scenarioSpot,
      unhedgedPnl,
      payoutLiability,
    };
  }

  const hedgePays =
    hedge.side === "YES" ? scenarioSpot > hedge.strike : scenarioSpot <= hedge.strike;
  const hedgePnl = (hedgePays ? hedge.notional : 0) - hedge.estimatedCost;
  const hedgedPnl = unhedgedPnl + hedgePnl;
  const tailLossReductionPct =
    unhedgedPnl < 0
      ? Math.max(0, ((hedgedPnl - unhedgedPnl) / Math.abs(unhedgedPnl)) * 100)
      : 0;

  return {
    scenarioId: scenario.id,
    scenarioSpot,
    unhedgedPnl,
    hedgedPnl,
    hedgeCost: hedge.estimatedCost,
    hedgePnl,
    tailLossReductionPct,
    payoutLiability,
  };
}

export function runScenarioSet(
  market: MarketState,
  scenarios: Scenario[],
  hedge?: HedgeCandidate,
): ScenarioResult[] {
  return scenarios.map((scenario) => runScenario(market, scenario, hedge));
}

export function computeRiskMetrics(
  market: MarketState,
  scenarios: Scenario[],
): RiskMetrics {
  const exposureMatrix = buildExposureMatrix(market);
  const largestRiskCell = exposureMatrix.reduce((largest, cell) =>
    cell.maxPayoutLiability > largest.maxPayoutLiability ? cell : largest,
  );
  const scenarioResults = runScenarioSet(market, scenarios);
  const worstScenarioPnl = Math.min(
    ...scenarioResults.map((result) => result.unhedgedPnl),
  );
  const maxPayoutLiability = exposureMatrix.reduce(
    (total, cell) => total + cell.maxPayoutLiability,
    0,
  );

  const utilizationScore = clamp01(market.plp.utilization / 0.8);
  const concentrationScore = clamp01(
    largestRiskCell.maxPayoutLiability / Math.max(1, maxPayoutLiability),
  );
  const tailLossScore = clamp01(Math.abs(Math.min(0, worstScenarioPnl)) / 350);
  const nearExpiryScore = clamp01(
    exposureMatrix
      .filter((cell) => cell.expiryId === "15m")
      .reduce((total, cell) => total + cell.maxPayoutLiability, 0) /
      Math.max(1, maxPayoutLiability),
  );

  const riskScoreComponents = [
    {
      id: "utilization",
      label: "PLP utilization",
      score: utilizationScore,
      weight: 40,
      contribution: 40 * utilizationScore,
      explanation:
        "Higher utilization leaves less liquidity buffer when prediction positions pay out.",
    },
    {
      id: "concentration",
      label: "Strike concentration",
      score: concentrationScore,
      weight: 30,
      contribution: 30 * concentrationScore,
      explanation:
        "Risk rises when liability is concentrated in one strike and expiry bucket.",
    },
    {
      id: "tail-loss",
      label: "Scenario tail loss",
      score: tailLossScore,
      weight: 20,
      contribution: 20 * tailLossScore,
      explanation:
        "Worst-case deterministic scenario loss contributes directly to the risk score.",
    },
    {
      id: "near-expiry",
      label: "Near-expiry exposure",
      score: nearExpiryScore,
      weight: 10,
      contribution: 10 * nearExpiryScore,
      explanation:
        "Short-dated exposure receives extra weight because there is less time to rebalance.",
    },
  ];

  const riskScore = Math.round(
    riskScoreComponents.reduce((total, component) => total + component.contribution, 0),
  );

  return {
    tvl: market.plp.tvl,
    utilization: market.plp.utilization,
    maxPayoutLiability,
    worstScenarioPnl,
    largestRiskStrike: largestRiskCell.strike,
    largestRiskExpiryId: largestRiskCell.expiryId,
    riskScore,
    riskScoreComponents,
  };
}

function sumBy<T extends Record<K, number>, K extends keyof T>(
  items: T[],
  key: K,
): number {
  return items.reduce((total, item) => total + item[key], 0);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
