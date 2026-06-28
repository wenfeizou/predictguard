import type { PredictMintExecutionSummary } from "@/lib/predict/execution";
import type { PredictManagerInventoryReadback } from "@/lib/predict/managerReadback";
import type {
  NormalizedExecution,
  NormalizedMarket,
  NormalizedPortfolio,
  NormalizedPosition,
} from "@/lib/adapters/types";

export function buildDeepBookPortfolio(input: {
  owner?: string;
  inventory?: PredictManagerInventoryReadback;
  executions?: PredictMintExecutionSummary[];
}): NormalizedPortfolio {
  const accountId = input.owner ?? input.inventory?.owner ?? "sample-account";
  const managerId = input.inventory?.managerObjectId;
  const positions = (input.inventory?.positionEntries ?? []).map((entry): NormalizedPosition => {
    const marketId = entry.marketKey
      ? `${entry.marketKey.oracleId}:${entry.marketKey.expiryMs}:${entry.marketKey.strike}:${entry.marketKey.side}`
      : entry.fieldId;

    return {
      venue: "deepbook-predict",
      accountId,
      positionId: entry.fieldId,
      marketId,
      asset: "BTC",
      side: entry.marketKey?.side ?? "UNKNOWN",
      strike: entry.marketKey?.strike,
      expiryIso: entry.marketKey?.expiryIso,
      quantity: entry.quantityDusdc ?? 0,
      notional: entry.quantityDusdc ?? 0,
      lifecycle: mapLifecycle(entry.lifecycle.code),
      evidenceStatus: entry.lifecycle.requiresRedeemEvidence ? "missing" : "not-required",
      sourceRef: managerId,
    };
  });
  const executions = (input.executions ?? []).map((execution): NormalizedExecution => ({
    venue: "deepbook-predict",
    accountId,
    digest: execution.digest,
    marketId: execution.oracleId,
    side: execution.side ?? "UNKNOWN",
    strike: execution.strike,
    quantity: execution.quantityDusdc,
    cost: execution.costDusdc,
    status: execution.status,
  }));

  return {
    id: managerId ?? accountId,
    label: managerId ? `DeepBook manager ${shortId(managerId)}` : "DeepBook sample portfolio",
    venue: "deepbook-predict",
    accounts: [
      {
        accountId,
        label: input.owner ? `Wallet ${shortId(input.owner)}` : "Sample account",
        managerId,
        venue: "deepbook-predict",
        status: input.inventory ? "connected" : "sample",
      },
    ],
    positions,
    executions,
    summary: {
      accountCount: 1,
      positionCount: positions.length,
      activeNotional: positions
        .filter((position) => position.lifecycle === "active")
        .reduce((total, position) => total + position.notional, 0),
      evidenceMissingCount: positions.filter((position) => position.evidenceStatus === "missing").length,
      executionCount: executions.length,
    },
  };
}

export function buildDeepBookSampleMarkets(): NormalizedMarket[] {
  return [
    {
      venue: "deepbook-predict",
      marketId: "btc-short-dated-sample",
      asset: "BTC",
      quoteAsset: "dUSDC",
      status: "active",
      dataSource: "deterministic-demo",
    },
  ];
}

function mapLifecycle(
  lifecycle: string,
): NormalizedPosition["lifecycle"] {
  if (lifecycle === "active") {
    return "active";
  }

  if (lifecycle === "expired-needs-settlement-check") {
    return "expired";
  }

  if (lifecycle === "redeem-candidate") {
    return "redeem-candidate";
  }

  if (lifecycle === "redeemed-evidence-missing") {
    return "evidence-needed";
  }

  return "unknown";
}

function shortId(value: string) {
  return value.length <= 12 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}
