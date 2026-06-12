import { SuiGrpcClient } from "@mysten/sui/grpc";

import {
  summarizePredictRedeemExecution,
  type PredictRedeemExecutionSummary,
} from "@/lib/predict/execution";

export const DEFAULT_REDEEM_EVIDENCE_DIGEST =
  "57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5";

export type PredictRedeemEvidenceReadback = {
  source: "sui-grpc";
  digest: string;
  fetchedAtIso: string;
  summary?: PredictRedeemExecutionSummary;
  notes: string[];
};

export async function fetchPredictRedeemEvidenceReadback(
  digest = DEFAULT_REDEEM_EVIDENCE_DIGEST,
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

  const summary = summarizePredictRedeemExecution(transaction.Transaction);

  return {
    source: "sui-grpc",
    digest,
    fetchedAtIso: new Date().toISOString(),
    summary,
    notes: summary
      ? [
          "Read a historical DeepBook Predict redeem transaction through Sui gRPC.",
          "Parsed the official predict::PositionRedeemed event with the existing PredictGuard parser.",
        ]
      : [
          "The transaction was fetched, but no official predict::PositionRedeemed event was found.",
        ],
  };
}
