import { SuiGrpcClient } from "@mysten/sui/grpc";

import {
  findMatchingRedeemExecution,
  summarizePredictRedeemExecutions,
  summarizePredictRedeemExecution,
  type PredictRedeemEvidenceMatch,
  type PredictRedeemExecutionSummary,
} from "@/lib/predict/execution";

export const DEFAULT_REDEEM_EVIDENCE_DIGEST =
  "FxhZD6PLrPKDhgsiJAXZBvoTrMVS6YhWVZC7D5drvhps";

export const LEGACY_REDEEM_EVIDENCE_DIGEST =
  "57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5";

export const DEFAULT_REDEEM_EVIDENCE_MATCH: PredictRedeemEvidenceMatch = {
  managerId: "0x3cfb9e6c6f1102ef28d20e3beed73ac20bbe0e1451eeb86cecd28e52e3fc77e2",
  oracleId: "0x5ff5bc47f6f97c440316862e33e40d6c328b67f180a6aa280b60223e953db880",
  side: "YES",
  strike: 63317,
};

export type PredictRedeemEvidenceReadback = {
  source: "sui-grpc";
  digest: string;
  fetchedAtIso: string;
  summary?: PredictRedeemExecutionSummary;
  summaries: PredictRedeemExecutionSummary[];
  match?: PredictRedeemEvidenceMatch;
  matchStatus: "matched" | "unmatched" | "not-requested";
  eventCount: number;
  permissionlessExecution?: boolean;
  notes: string[];
};

export async function fetchPredictRedeemEvidenceReadback(
  digest = DEFAULT_REDEEM_EVIDENCE_DIGEST,
  match?: PredictRedeemEvidenceMatch,
): Promise<PredictRedeemEvidenceReadback> {
  const client = new SuiGrpcClient({
    network: "testnet",
    baseUrl: "https://fullnode.testnet.sui.io:443",
  });
  const transaction = await client.core.waitForTransaction({
    digest,
    include: {
      balanceChanges: true,
      effects: true,
      events: true,
    },
  });

  if (transaction.FailedTransaction) {
    throw new Error(
      transaction.FailedTransaction.status.error?.message ??
        "Redeem evidence transaction failed",
    );
  }

  const summaries = summarizePredictRedeemExecutions(transaction.Transaction);
  const activeMatch = match ?? (
    digest === DEFAULT_REDEEM_EVIDENCE_DIGEST ? DEFAULT_REDEEM_EVIDENCE_MATCH : undefined
  );
  const summary = activeMatch
    ? findMatchingRedeemExecution(summaries, activeMatch)
    : summarizePredictRedeemExecution(transaction.Transaction);
  const matchStatus = activeMatch ? summary ? "matched" : "unmatched" : "not-requested";
  const permissionlessExecution = summary?.owner && summary.executor
    ? normalizeObjectId(summary.owner) !== normalizeObjectId(summary.executor)
    : undefined;

  return {
    source: "sui-grpc",
    digest,
    fetchedAtIso: new Date().toISOString(),
    summary,
    summaries,
    match: activeMatch,
    matchStatus,
    eventCount: summaries.length,
    permissionlessExecution,
    notes: summary
      ? [
          "Read a historical DeepBook Predict redeem transaction through Sui gRPC.",
          summaries.length > 1
            ? `Parsed ${summaries.length} official predict::PositionRedeemed events and selected the matching evidence.`
            : "Parsed the official predict::PositionRedeemed event with the existing PredictGuard parser.",
          permissionlessExecution
            ? "Owner and executor differ, which indicates a permissionless redeem submitted by an external executor for the manager owner."
            : "Owner and executor match or are unavailable, so this evidence does not show an external permissionless executor.",
        ]
      : [
          "The transaction was fetched, but no official predict::PositionRedeemed event was found.",
          matchStatus === "unmatched"
            ? "PositionRedeemed events exist, but none matched the requested manager/oracle/side/strike filter."
            : "No matching redeem evidence was requested.",
        ],
  };
}

function normalizeObjectId(value: string) {
  return value.startsWith("0x") ? value.slice(2).toLowerCase() : value.toLowerCase();
}
