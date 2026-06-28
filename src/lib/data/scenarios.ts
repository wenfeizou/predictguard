import type { Scenario } from "@/lib/types";

export const scenarios: Scenario[] = [
  {
    id: "btc-up-5",
    name: "BTC +5%",
    category: "baseline",
    severity: "medium",
    spotMovePct: 5,
    description:
      "Upside stress where short YES exposure can become payout liability.",
    operationalUse: "Baseline upside move for daily LP risk review.",
  },
  {
    id: "btc-down-5",
    name: "BTC -5%",
    category: "baseline",
    severity: "medium",
    spotMovePct: -5,
    description:
      "Downside stress where short NO exposure can become payout liability.",
    operationalUse: "Baseline downside move for daily LP risk review.",
  },
  {
    id: "btc-up-3sigma",
    name: "BTC +3 sigma",
    category: "tail",
    severity: "critical",
    spotMovePct: 8,
    description: "Large upside tail move based on simplified demo volatility.",
    operationalUse: "Tail review for concentrated short YES exposure.",
  },
  {
    id: "btc-down-3sigma",
    name: "BTC -3 sigma",
    category: "tail",
    severity: "critical",
    spotMovePct: -8,
    description: "Large downside tail move based on simplified demo volatility.",
    operationalUse: "Tail review for concentrated short NO exposure.",
  },
  {
    id: "vol-spike",
    name: "Vol spike",
    category: "volatility",
    severity: "high",
    spotMovePct: 0,
    volShockPct: 30,
    description: "Volatility repricing stress with unchanged spot.",
    operationalUse: "Volatility surface monitoring and hedge drift review.",
  },
  {
    id: "near-expiry-up",
    name: "Near-expiry upside shock",
    category: "near-expiry",
    severity: "high",
    spotMovePct: 3,
    description:
      "Short-dated move where gamma-like binary payout risk is concentrated.",
    operationalUse: "Short-dated expiry risk and last-mile rebalance review.",
  },
];
