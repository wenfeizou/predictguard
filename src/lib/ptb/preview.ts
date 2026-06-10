import type { HedgeCandidate } from "@/lib/types";
import {
  buildPredictHedgeSdkSkeleton,
  type PredictHedgePtbPlan,
} from "@/lib/ptb/hedgeTransaction";

export function buildPtbPreviewSteps(hedge?: HedgeCandidate): string[] {
  if (!hedge) {
    return ["No hedge selected. Run the simulator to generate a PTB preview."];
  }

  return [
    "Select dUSDC coin for hedge cost.",
    "Load or create the user's PredictManager.",
    `Call predict::mint for an OTM ${hedge.side} binary position.`,
    `Set strike to ${hedge.strike.toLocaleString("en-US")}, expiry to ${hedge.expiryId}, notional to ${hedge.notional}.`,
    `Set max cost to ${hedge.estimatedCost.toFixed(2)} dUSDC.`,
    "Return hedge position quantity to the PredictManager.",
    "Refresh indexed market, vault, and manager state after confirmation.",
  ];
}

export function buildSuiSdkSkeleton(hedge?: HedgeCandidate): string {
  return buildPredictHedgeSdkSkeleton({ hedge });
}

export function formatPtbReadinessLabel(plan: PredictHedgePtbPlan): string {
  switch (plan.readiness.status) {
    case "no-hedge":
      return "No hedge";
    case "blocked":
      return "Blocked";
    case "preview-ready":
      return "Preview ready";
    case "ready-to-sign":
      return "Ready to sign";
  }
}
