import type { Scenario } from "@/lib/types";

export const scenarios: Scenario[] = [
  {
    id: "btc-up-5",
    name: "BTC +5%",
    spotMovePct: 5,
    description:
      "Upside stress where short YES exposure can become payout liability.",
  },
  {
    id: "btc-down-5",
    name: "BTC -5%",
    spotMovePct: -5,
    description:
      "Downside stress where short NO exposure can become payout liability.",
  },
  {
    id: "btc-up-3sigma",
    name: "BTC +3 sigma",
    spotMovePct: 8,
    description: "Large upside tail move based on simplified demo volatility.",
  },
  {
    id: "btc-down-3sigma",
    name: "BTC -3 sigma",
    spotMovePct: -8,
    description: "Large downside tail move based on simplified demo volatility.",
  },
  {
    id: "vol-spike",
    name: "Vol spike",
    spotMovePct: 0,
    volShockPct: 30,
    description: "Volatility repricing stress with unchanged spot.",
  },
  {
    id: "near-expiry-up",
    name: "Near-expiry upside shock",
    spotMovePct: 3,
    description:
      "Short-dated move where gamma-like binary payout risk is concentrated.",
  },
];
