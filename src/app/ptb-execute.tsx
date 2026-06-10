"use client";

import { useCurrentAccount, useCurrentClient, useDAppKit } from "@mysten/dapp-kit-react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Send } from "lucide-react";
import { useState } from "react";

import {
  summarizePredictMintExecution,
  type PredictMintExecutionSummary,
} from "@/lib/predict/execution";
import {
  buildPredictHedgeTransactionPreview,
  type PredictHedgeMintInput,
  type PredictHedgePtbPlan,
} from "@/lib/ptb/hedgeTransaction";

export function PtbExecuteClient({
  input,
  plan,
  maxHedgeBudgetDusdc,
  onBudgetChange,
  onExecution,
}: {
  input: PredictHedgeMintInput;
  plan: PredictHedgePtbPlan;
  maxHedgeBudgetDusdc: number;
  onBudgetChange: (budget: number) => void;
  onExecution?: (execution: PredictMintExecutionSummary) => void;
}) {
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [execution, setExecution] = useState<PredictMintExecutionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disabled = pending || !account || !plan.readiness.canBuildTransaction;

  async function execute() {
    if (!account || !plan.readiness.canBuildTransaction) {
      return;
    }

    setPending(true);
    setExecution(null);
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
      const transaction = await client.core.waitForTransaction({
        digest: txDigest,
        include: {
          balanceChanges: true,
          effects: true,
          events: true,
        },
      });

      if (transaction.FailedTransaction) {
        throw new Error(
          transaction.FailedTransaction.status.error?.message ?? "Transaction failed on-chain",
        );
      }

      const summary = summarizePredictMintExecution(transaction.Transaction);
      setExecution(summary);
      onExecution?.(summary);
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
            Build a small live Predict mint probe and hand the Transaction instance to the
            connected wallet. Full hedge sizing stays simulated until live quote checks pass.
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

      <div className="mt-3 rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold text-[#17211d]">Max hedge budget</div>
            <p className="mt-1 text-xs leading-5 text-[#52615a]">
              Quote-aware sizing uses this budget minus a buffer to estimate quantity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 5, 10].map((budget) => (
              <button
                key={budget}
                type="button"
                onClick={() => onBudgetChange(budget)}
                className={`rounded-md border px-3 py-1 text-xs font-semibold transition ${
                  maxHedgeBudgetDusdc === budget
                    ? "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]"
                    : "border-[#dce3dd] bg-white text-[#52615a] hover:border-[#1f8a70]"
                }`}
              >
                {budget}
              </button>
            ))}
            <input
              type="number"
              min="0.5"
              max="50"
              step="0.5"
              value={maxHedgeBudgetDusdc}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next) && next > 0) {
                  onBudgetChange(next);
                }
              }}
              className="h-8 w-24 rounded-md border border-[#dce3dd] bg-white px-2 text-xs font-semibold text-[#17211d] outline-none focus:border-[#1f8a70]"
            />
            <span className="text-xs font-semibold text-[#52615a]">dUSDC</span>
          </div>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-xs text-[#52615a] sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-[#17211d]">Sizing mode</dt>
          <dd>{formatSizingMode(plan.inputs.sizingMode)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17211d]">Max budget</dt>
          <dd>{formatOptionalDusdc(plan.inputs.maxHedgeBudgetDusdc)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17211d]">Deposit</dt>
          <dd>{formatDusdcBaseUnits(plan.inputs.depositAmountMist)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17211d]">Quantity</dt>
          <dd>{formatDusdcBaseUnits(plan.inputs.quantityMist)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17211d]">Execution strike</dt>
          <dd>
            {plan.inputs.executionStrike
              ? plan.inputs.executionStrike.toLocaleString("en-US")
              : "Unavailable"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17211d]">Estimated cost</dt>
          <dd>{formatOptionalDusdc(plan.inputs.estimatedExecutionCostDusdc)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17211d]">Budget usage</dt>
          <dd>{formatOptionalPct(plan.inputs.budgetUsagePct)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17211d]">Cost / protection</dt>
          <dd>{formatOptionalPct(plan.inputs.costToProtectionRatio, true)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17211d]">Reference price</dt>
          <dd>
            {plan.inputs.oracleReferencePrice
              ? plan.inputs.oracleReferencePrice.toLocaleString("en-US")
              : "Unavailable"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17211d]">Oracle grid</dt>
          <dd>
            {plan.inputs.oracleMinStrike && plan.inputs.oracleTickSize
              ? `${plan.inputs.oracleMinStrike.toLocaleString("en-US")} / ${plan.inputs.oracleTickSize.toLocaleString("en-US")}`
              : "Unavailable"}
          </dd>
        </div>
      </dl>

      {error ? (
        <div className="mt-3 rounded-md border border-[#c75c48] bg-[#fff1ed] p-3 text-sm leading-6 text-[#8f3325]">
          {error}
        </div>
      ) : null}

      {execution ? (
        <div className="mt-3 rounded-md border border-[#1f8a70] bg-[#e8f4ef] p-3">
          <div className="text-sm font-semibold text-[#17211d]">Mint confirmed</div>
          <dl className="mt-2 grid gap-2 text-xs text-[#52615a] sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-[#17211d]">Position</dt>
              <dd>
                {execution.side ?? "Unknown"}{" "}
                {execution.strike ? execution.strike.toLocaleString("en-US") : "unknown strike"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[#17211d]">Quantity</dt>
              <dd>{formatOptionalDusdc(execution.quantityDusdc)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#17211d]">Actual cost</dt>
              <dd>{formatOptionalDusdc(execution.costDusdc)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#17211d]">Ask price</dt>
              <dd>{formatOptionalNumber(execution.askPrice, 9)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#17211d]">dUSDC wallet change</dt>
              <dd>{formatSignedDusdc(execution.dusdcBalanceChange)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#17211d]">Expiry</dt>
              <dd>{formatExpiry(execution.expiryMs)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-semibold text-[#17211d]">Manager</dt>
              <dd className="break-all">{execution.managerId ?? "Unavailable"}</dd>
            </div>
          </dl>
          <a
            href={`https://testnet.suivision.xyz/txblock/${execution.digest}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 break-all text-sm font-semibold text-[#1f8a70] underline-offset-4 hover:underline"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            View transaction digest
          </a>
        </div>
      ) : null}
    </div>
  );
}

function formatDusdcBaseUnits(value?: string) {
  if (!value) {
    return "Unavailable";
  }

  return `${(Number(value) / 1_000_000).toLocaleString("en-US", {
    maximumFractionDigits: 6,
  })} dUSDC`;
}

function formatOptionalDusdc(value?: number) {
  return value === undefined
    ? "Unavailable"
    : `${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} dUSDC`;
}

function formatSignedDusdc(value?: number) {
  if (value === undefined) {
    return "Unavailable";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} dUSDC`;
}

function formatOptionalNumber(value?: number, maximumFractionDigits = 6) {
  return value === undefined
    ? "Unavailable"
    : value.toLocaleString("en-US", { maximumFractionDigits });
}

function formatOptionalPct(value?: number, valueIsRatio = false) {
  if (value === undefined) {
    return "Unavailable";
  }

  const pct = valueIsRatio ? value * 100 : value;
  return `${pct.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

function formatSizingMode(value?: "probe" | "quote-aware") {
  return value === "quote-aware" ? "Quote-aware" : "Probe";
}

function formatExpiry(value?: string) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(Number(value));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US");
}
