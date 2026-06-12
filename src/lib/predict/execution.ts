import type { SuiClientTypes } from "@mysten/sui/client";

import { predictTestnetConfig } from "@/lib/predict/config";

const DUSDC_DECIMALS = 1_000_000;
const ORACLE_PRICE_DECIMALS = 1_000_000_000;
const EXECUTION_STORAGE_KEY = "predictguard.latestMintExecution";
const EXECUTION_HISTORY_STORAGE_KEY = "predictguard.mintExecutionHistory";
const MAX_STORED_EXECUTIONS = 20;

type TransactionWithExecutionData = SuiClientTypes.Transaction<{
  events: true;
  balanceChanges: true;
  effects: true;
}>;

export type PredictMintExecutionSummary = {
  digest: string;
  status: "success" | "failed";
  error?: string;
  trader?: string;
  managerId?: string;
  oracleId?: string;
  predictId?: string;
  quoteAsset?: string;
  side?: "YES" | "NO";
  expiryMs?: string;
  strike?: number;
  quantityDusdc?: number;
  costDusdc?: number;
  askPrice?: number;
  dusdcBalanceChange?: number;
  gasMist?: string;
};

export type PredictRedeemExecutionSummary = {
  digest: string;
  status: "success" | "failed";
  error?: string;
  eventIndex?: number;
  eventSequence?: string;
  eventType?: string;
  owner?: string;
  executor?: string;
  managerId?: string;
  oracleId?: string;
  predictId?: string;
  quoteAsset?: string;
  side?: "YES" | "NO";
  expiryMs?: string;
  strike?: number;
  quantityDusdc?: number;
  payoutDusdc?: number;
  bidPrice?: number;
  isSettled?: boolean;
  dusdcBalanceChange?: number;
  gasMist?: string;
};

export type PredictRedeemEvidenceMatch = {
  managerId?: string;
  oracleId?: string;
  side?: "YES" | "NO";
  strike?: number;
};

export type ExecutionAdjustedRiskSummary = {
  recommendedNotionalDusdc: number;
  executedQuantityDusdc: number;
  executedGapDusdc: number;
  coverageRatioPct: number;
  actualCostDusdc?: number;
  actualCostRatioPct?: number;
  maxBudgetDusdc: number;
  budgetUsagePct?: number;
  depositedDusdc?: number;
  estimatedManagerRemainingDusdc?: number;
};

export type ManagerExecutionHistorySummary = {
  managerId?: string;
  executionCount: number;
  totalQuantityDusdc: number;
  totalActualCostDusdc: number;
  totalDepositedDusdc: number;
  estimatedManagerRemainingDusdc: number;
  latestDigest?: string;
};

export function buildExecutionAdjustedRiskSummary(input: {
  execution?: PredictMintExecutionSummary | null;
  recommendedNotionalDusdc?: number;
  maxBudgetDusdc: number;
}): ExecutionAdjustedRiskSummary | undefined {
  const executedQuantityDusdc = input.execution?.quantityDusdc;
  const recommendedNotionalDusdc = input.recommendedNotionalDusdc;

  if (!input.execution || !executedQuantityDusdc || !recommendedNotionalDusdc) {
    return undefined;
  }

  const actualCostDusdc = input.execution.costDusdc;
  const depositedDusdc = input.execution.dusdcBalanceChange === undefined
    ? undefined
    : Math.abs(Math.min(input.execution.dusdcBalanceChange, 0));
  const estimatedManagerRemainingDusdc =
    depositedDusdc === undefined || actualCostDusdc === undefined
      ? undefined
      : Math.max(0, depositedDusdc - actualCostDusdc);

  return {
    recommendedNotionalDusdc,
    executedQuantityDusdc,
    executedGapDusdc: Math.max(0, recommendedNotionalDusdc - executedQuantityDusdc),
    coverageRatioPct: (executedQuantityDusdc / recommendedNotionalDusdc) * 100,
    actualCostDusdc,
    actualCostRatioPct: actualCostDusdc === undefined
      ? undefined
      : (actualCostDusdc / recommendedNotionalDusdc) * 100,
    maxBudgetDusdc: input.maxBudgetDusdc,
    budgetUsagePct: actualCostDusdc === undefined
      ? undefined
      : (actualCostDusdc / input.maxBudgetDusdc) * 100,
    depositedDusdc,
    estimatedManagerRemainingDusdc,
  };
}

export function loadStoredMintExecution(): PredictMintExecutionSummary | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(EXECUTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PredictMintExecutionSummary;
    return parsed.digest ? parsed : null;
  } catch {
    return null;
  }
}

export function loadStoredMintExecutionHistory(): PredictMintExecutionSummary[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(EXECUTION_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as PredictMintExecutionSummary[];
    return Array.isArray(parsed)
      ? parsed.filter((execution) => Boolean(execution.digest))
      : [];
  } catch {
    return [];
  }
}

export function storeMintExecution(execution: PredictMintExecutionSummary) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(EXECUTION_STORAGE_KEY, JSON.stringify(execution));
  const nextHistory = [
    execution,
    ...loadStoredMintExecutionHistory().filter((item) => item.digest !== execution.digest),
  ].slice(0, MAX_STORED_EXECUTIONS);
  window.localStorage.setItem(
    EXECUTION_HISTORY_STORAGE_KEY,
    JSON.stringify(nextHistory),
  );
}

export function clearStoredMintExecution() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(EXECUTION_STORAGE_KEY);
  window.localStorage.removeItem(EXECUTION_HISTORY_STORAGE_KEY);
}

export function buildManagerExecutionHistorySummary(
  history: PredictMintExecutionSummary[],
): ManagerExecutionHistorySummary | undefined {
  if (history.length === 0) {
    return undefined;
  }

  const latest = history[0];
  const totals = history.reduce(
    (sum, execution) => {
      const depositedDusdc = execution.dusdcBalanceChange === undefined
        ? 0
        : Math.abs(Math.min(execution.dusdcBalanceChange, 0));

      return {
        quantity: sum.quantity + (execution.quantityDusdc ?? 0),
        cost: sum.cost + (execution.costDusdc ?? 0),
        deposited: sum.deposited + depositedDusdc,
      };
    },
    { quantity: 0, cost: 0, deposited: 0 },
  );

  return {
    managerId: latest.managerId,
    executionCount: history.length,
    totalQuantityDusdc: totals.quantity,
    totalActualCostDusdc: totals.cost,
    totalDepositedDusdc: totals.deposited,
    estimatedManagerRemainingDusdc: Math.max(0, totals.deposited - totals.cost),
    latestDigest: latest.digest,
  };
}

export function summarizePredictMintExecution(
  transaction: TransactionWithExecutionData,
): PredictMintExecutionSummary {
  const positionEvent = transaction.events?.find((event) =>
    event.eventType.endsWith("::predict::PositionMinted"),
  );
  const fields = positionEvent?.json ?? {};

  return {
    digest: transaction.digest,
    status: transaction.status.success ? "success" : "failed",
    error: transaction.status.error?.message,
    trader: readString(fields.trader),
    managerId: readString(fields.manager_id),
    oracleId: readString(fields.oracle_id),
    predictId: readString(fields.predict_id),
    quoteAsset: readString(fields.quote_asset),
    side: readBoolean(fields.is_up) === undefined
      ? undefined
      : readBoolean(fields.is_up)
        ? "YES"
        : "NO",
    expiryMs: readString(fields.expiry),
    strike: scaleNumber(fields.strike, ORACLE_PRICE_DECIMALS),
    quantityDusdc: scaleNumber(fields.quantity, DUSDC_DECIMALS),
    costDusdc: scaleNumber(fields.cost, DUSDC_DECIMALS),
    askPrice: scaleNumber(fields.ask_price, ORACLE_PRICE_DECIMALS),
    dusdcBalanceChange: getDusdcBalanceChange(transaction.balanceChanges),
    gasMist: getGasMist(transaction.effects?.gasUsed),
  };
}

export function summarizePredictRedeemExecution(
  transaction: TransactionWithExecutionData,
  match?: PredictRedeemEvidenceMatch,
): PredictRedeemExecutionSummary | undefined {
  const summaries = summarizePredictRedeemExecutions(transaction);

  return match ? findMatchingRedeemExecution(summaries, match) : summaries[0];
}

export function summarizePredictRedeemExecutions(
  transaction: TransactionWithExecutionData,
): PredictRedeemExecutionSummary[] {
  const positionEvents = (transaction.events ?? [])
    .map((event, eventIndex) => ({ event, eventIndex }))
    .filter(({ event }) => event.eventType.endsWith("::predict::PositionRedeemed"));

  return positionEvents.map(({ event, eventIndex }) => {
    const fields = event.json ?? {};

    return {
      digest: transaction.digest,
      status: transaction.status.success ? "success" : "failed",
      error: transaction.status.error?.message,
      eventIndex,
      eventSequence: readEventSequence(event),
      eventType: event.eventType,
      owner: readString(fields.owner),
      executor: readString(fields.executor),
      managerId: readString(fields.manager_id),
      oracleId: readString(fields.oracle_id),
      predictId: readString(fields.predict_id),
      quoteAsset: readString(fields.quote_asset),
      side: readBoolean(fields.is_up) === undefined
        ? undefined
        : readBoolean(fields.is_up)
          ? "YES"
          : "NO",
      expiryMs: readString(fields.expiry),
      strike: scaleNumber(fields.strike, ORACLE_PRICE_DECIMALS),
      quantityDusdc: scaleNumber(fields.quantity, DUSDC_DECIMALS),
      payoutDusdc: scaleNumber(fields.payout, DUSDC_DECIMALS),
      bidPrice: scaleNumber(fields.bid_price, ORACLE_PRICE_DECIMALS),
      isSettled: readBoolean(fields.is_settled),
      dusdcBalanceChange: getDusdcBalanceChange(transaction.balanceChanges),
      gasMist: getGasMist(transaction.effects?.gasUsed),
    };
  });
}

export function findMatchingRedeemExecution(
  summaries: PredictRedeemExecutionSummary[],
  match: PredictRedeemEvidenceMatch,
) {
  return summaries.find((summary) => {
    if (match.managerId && !sameObjectId(summary.managerId, match.managerId)) {
      return false;
    }

    if (match.oracleId && !sameObjectId(summary.oracleId, match.oracleId)) {
      return false;
    }

    if (match.side && summary.side !== match.side) {
      return false;
    }

    if (match.strike !== undefined && summary.strike !== match.strike) {
      return false;
    }

    return true;
  });
}

function getDusdcBalanceChange(balanceChanges?: SuiClientTypes.BalanceChange[]) {
  const total = balanceChanges
    ?.filter((change) => normalizeType(change.coinType) === normalizeType(predictTestnetConfig.dusdcType))
    .reduce((sum, change) => sum + BigInt(change.amount), BigInt(0));

  return total === undefined ? undefined : Number(total) / DUSDC_DECIMALS;
}

function getGasMist(gasUsed?: SuiClientTypes.GasCostSummary) {
  if (!gasUsed) {
    return undefined;
  }

  const total =
    BigInt(gasUsed.computationCost) +
    BigInt(gasUsed.storageCost) -
    BigInt(gasUsed.storageRebate);

  return total.toString();
}

function scaleNumber(value: unknown, scale: number) {
  const raw = readString(value);
  return raw === undefined ? undefined : Number(raw) / scale;
}

function readString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }

  return undefined;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeType(value: string) {
  return value.startsWith("0x") ? value.slice(2) : value;
}

function sameObjectId(left?: string, right?: string) {
  if (!left || !right) {
    return false;
  }

  return normalizeType(left).toLowerCase() === normalizeType(right).toLowerCase();
}

function readEventSequence(event: SuiClientTypes.Event) {
  const candidate = event as SuiClientTypes.Event & {
    eventSeq?: string;
    eventSequence?: string;
    sequenceNumber?: string;
  };

  return candidate.eventSeq ?? candidate.eventSequence ?? candidate.sequenceNumber;
}
