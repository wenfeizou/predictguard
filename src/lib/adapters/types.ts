import type { Side } from "@/lib/types";

export type RiskVenueId = "deepbook-predict" | "polymarket" | "hyperliquid" | "custom";

export type NormalizedMarket = {
  venue: RiskVenueId;
  marketId: string;
  asset: string;
  quoteAsset: string;
  expiryIso?: string;
  strike?: number;
  side?: Side | "UNKNOWN";
  status: "active" | "expired" | "settled" | "unknown";
  dataSource: string;
};

export type NormalizedPosition = {
  venue: RiskVenueId;
  accountId: string;
  positionId: string;
  marketId: string;
  asset: string;
  side: Side | "UNKNOWN";
  strike?: number;
  expiryIso?: string;
  quantity: number;
  notional: number;
  lifecycle:
    | "active"
    | "expired"
    | "redeem-candidate"
    | "redeemed"
    | "evidence-needed"
    | "unknown";
  evidenceStatus: "complete" | "partial" | "missing" | "not-required";
  sourceRef?: string;
};

export type NormalizedExecution = {
  venue: RiskVenueId;
  accountId: string;
  digest?: string;
  marketId?: string;
  side?: Side | "UNKNOWN";
  strike?: number;
  quantity?: number;
  cost?: number;
  status: "success" | "failed" | "unknown";
  executedAtIso?: string;
};

export type NormalizedPortfolio = {
  id: string;
  label: string;
  venue: RiskVenueId;
  accounts: NormalizedPortfolioAccount[];
  positions: NormalizedPosition[];
  executions: NormalizedExecution[];
  summary: NormalizedPortfolioSummary;
};

export type NormalizedPortfolioAccount = {
  accountId: string;
  label: string;
  managerId?: string;
  venue: RiskVenueId;
  status: "connected" | "sample" | "needs-wallet" | "unknown";
};

export type NormalizedPortfolioSummary = {
  accountCount: number;
  positionCount: number;
  activeNotional: number;
  evidenceMissingCount: number;
  executionCount: number;
};

