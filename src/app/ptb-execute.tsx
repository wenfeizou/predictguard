"use client";

import { useCurrentAccount, useCurrentClient, useDAppKit } from "@mysten/dapp-kit-react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Send } from "lucide-react";
import { useState } from "react";

import {
  buildPredictHedgeTransactionPreview,
  type PredictHedgeMintInput,
  type PredictHedgePtbPlan,
} from "@/lib/ptb/hedgeTransaction";

export function PtbExecuteClient({
  input,
  plan,
}: {
  input: PredictHedgeMintInput;
  plan: PredictHedgePtbPlan;
}) {
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [digest, setDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disabled = pending || !account || !plan.readiness.canBuildTransaction;

  async function execute() {
    if (!account || !plan.readiness.canBuildTransaction) {
      return;
    }

    setPending(true);
    setDigest(null);
    setError(null);

    try {
      const preview = buildPredictHedgeTransactionPreview(input);
      if (!preview.transaction) {
        throw new Error("Transaction is not ready. Check missing PTB inputs.");
      }

      const result = await dAppKit.signAndExecuteTransaction({
        transaction: preview.transaction,
      });

      if (result.FailedTransaction) {
        throw new Error(
          result.FailedTransaction.status.error?.message ?? "Transaction failed",
        );
      }

      const txDigest = result.Transaction.digest;
      await client.core.waitForTransaction({ digest: txDigest });
      setDigest(txDigest);
      await queryClient.invalidateQueries({ queryKey: ["dusdc-coins", account.address] });
      await queryClient.invalidateQueries({ queryKey: ["predict-manager", account.address] });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown transaction error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[#17211d]">Wallet execution</div>
          <p className="mt-1 text-sm leading-6 text-[#52615a]">
            Build the current Predict hedge PTB and hand the Transaction instance to the
            connected wallet.
          </p>
        </div>
        <button
          type="button"
          onClick={execute}
          disabled={disabled}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#17211d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f8a70] disabled:cursor-not-allowed disabled:bg-[#aeb8b2]"
        >
          <Send className="h-4 w-4" />
          {pending ? "Waiting" : plan.readiness.canBuildTransaction ? "Sign PTB" : "Blocked"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-md border border-[#c75c48] bg-[#fff1ed] p-3 text-sm leading-6 text-[#8f3325]">
          {error}
        </div>
      ) : null}

      {digest ? (
        <a
          href={`https://testnet.suivision.xyz/txblock/${digest}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#1f8a70] underline-offset-4 hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          View transaction digest
        </a>
      ) : null}
    </div>
  );
}
