import type { SuiClientTypes } from "@mysten/sui/client";

import { predictTestnetConfig } from "@/lib/predict/config";

const DUSDC_DECIMALS = 1_000_000;
const ORACLE_PRICE_DECIMALS = 1_000_000_000;

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
