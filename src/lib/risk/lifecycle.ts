import type { PredictManagerInventoryReadback } from "@/lib/predict/managerReadback";

export type LifecycleQueueItem = {
  id: string;
  label: string;
  status: "active" | "review" | "evidence-needed" | "complete";
  count: number;
  detail: string;
  operatorAction: string;
};

export function buildLifecycleReviewQueue(
  inventory?: PredictManagerInventoryReadback,
): LifecycleQueueItem[] {
  const entries = inventory?.positionEntries ?? [];
  const active = entries.filter((entry) => entry.status.code === "active");
  const expired = entries.filter((entry) => entry.status.code === "expired");
  const zero = entries.filter((entry) => entry.status.code === "zero");
  const unknown = entries.filter((entry) => entry.status.code === "unknown");
  const evidenceNeeded = entries.filter((entry) => entry.lifecycle.requiresRedeemEvidence);

  return [
    {
      id: "active-coverage",
      label: "Active hedge coverage",
      status: active.length > 0 ? "active" : "complete",
      count: active.length,
      detail: "Open positions that still count as active hedge coverage.",
      operatorAction: "Monitor expiry, oracle freshness, and hedge drift.",
    },
    {
      id: "expired-review",
      label: "Expired position review",
      status: expired.length > 0 ? "review" : "complete",
      count: expired.length,
      detail: "Expired positions need settlement and redeemability checks.",
      operatorAction: "Check oracle/vault settlement evidence before reporting payout.",
    },
    {
      id: "zero-quantity-evidence",
      label: "Zero-quantity evidence",
      status: zero.length > 0 ? "evidence-needed" : "complete",
      count: zero.length,
      detail: "Zero quantity may indicate redeem or position decrease, but payout still needs evidence.",
      operatorAction: "Link PositionRedeemed history or mark evidence missing.",
    },
    {
      id: "unknown-decoding",
      label: "Unknown lifecycle",
      status: unknown.length > 0 ? "evidence-needed" : "complete",
      count: unknown.length,
      detail: "Positions that cannot be safely classified from decoded fields.",
      operatorAction: "Inspect raw MarketKey/object data before sharing external reports.",
    },
    {
      id: "evidence-queue",
      label: "Evidence queue",
      status: evidenceNeeded.length > 0 ? "evidence-needed" : "complete",
      count: evidenceNeeded.length,
      detail: "Lifecycle entries that still require redeem or settlement evidence.",
      operatorAction: "Run broader event discovery or production indexer reconciliation.",
    },
  ];
}
