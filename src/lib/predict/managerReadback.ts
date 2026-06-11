import { SuiGrpcClient } from "@mysten/sui/grpc";

import { predictTestnetConfig } from "@/lib/predict/config";

const DUSDC_DECIMALS = 1_000_000;
const ORACLE_PRICE_DECIMALS = 1_000_000_000;
const MARKET_KEY_BCS_LENGTH = 49;
const MARKET_KEY_DIRECTION_UP = 0;
const MARKET_KEY_DIRECTION_DOWN = 1;

export type PredictManagerInventoryReadback = {
  source: "sui-grpc";
  managerObjectId: string;
  objectVersion?: string;
  objectDigest?: string;
  objectType?: string;
  previousTransaction?: string;
  owner?: string;
  balanceManagerId?: string;
  balancesTableId?: string;
  positionsTableId?: string;
  rangePositionsTableId?: string;
  balanceEntryCount?: number;
  positionEntryCount?: number;
  rangePositionEntryCount?: number;
  directDusdcBalance?: number;
  directPositionQuantityDusdc?: number;
  positionEntries: PredictManagerPositionEntry[];
  notes: string[];
};

export type PredictManagerPositionEntry = {
  fieldId: string;
  marketKeyType?: string;
  valueType?: string;
  quantityDusdc?: number;
  marketKey?: PredictMarketKeyReadback;
};

export type PredictMarketKeyReadback = {
  oracleId: string;
  expiryMs: string;
  expiryIso: string;
  rawStrike: string;
  strike: number;
  directionCode: number;
  direction: "UP" | "DOWN" | "UNKNOWN";
  side: "YES" | "NO" | "UNKNOWN";
  rawBytesHex: string;
};

type ManagerJson = {
  owner?: string;
  balance_manager?: {
    id?: string;
    balances?: {
      id?: string;
      size?: string;
    };
  };
  positions?: {
    id?: string;
    size?: string;
  };
  range_positions?: {
    id?: string;
    size?: string;
  };
};

export async function fetchPredictManagerInventoryReadback(
  managerObjectId: string,
): Promise<PredictManagerInventoryReadback> {
  const client = new SuiGrpcClient({
    network: predictTestnetConfig.network,
    baseUrl: "https://fullnode.testnet.sui.io:443",
  });

  const { object } = await client.core.getObject({
    objectId: managerObjectId,
    include: {
      json: true,
      previousTransaction: true,
    },
  });
  const managerJson = object.json as ManagerJson | undefined;
  const balancesTableId = managerJson?.balance_manager?.balances?.id;
  const positionsTableId = managerJson?.positions?.id;
  const rangePositionsTableId = managerJson?.range_positions?.id;
  const balanceFields = balancesTableId
    ? await client.listDynamicFields({
        parentId: balancesTableId,
        limit: 20,
        include: {
          value: true,
        },
      })
    : undefined;
  const positionFields = positionsTableId
    ? await client.listDynamicFields({
        parentId: positionsTableId,
        limit: 20,
        include: {
          value: true,
        },
      })
    : undefined;
  const rangePositionFields = rangePositionsTableId
    ? await client.listDynamicFields({
        parentId: rangePositionsTableId,
        limit: 20,
        include: {
          value: true,
        },
      })
    : undefined;
  const directDusdcBalance = balanceFields?.dynamicFields
    .filter((field) => field.valueType.includes(predictTestnetConfig.dusdcType))
    .map((field) => readDynamicFieldU64(field) / DUSDC_DECIMALS)
    .find((value) => Number.isFinite(value));
  const positionEntries = (positionFields?.dynamicFields ?? []).map((field) => ({
    fieldId: field.fieldId,
    marketKeyType: field.name.type,
    valueType: field.valueType,
    quantityDusdc: field.valueType === "u64"
      ? readDynamicFieldU64(field) / DUSDC_DECIMALS
      : undefined,
    marketKey: decodeMarketKey(field),
  }));
  const directPositionQuantityDusdc = positionEntries.reduce(
    (sum, entry) => sum + (entry.quantityDusdc ?? 0),
    0,
  );

  return {
    source: "sui-grpc",
    managerObjectId,
    objectVersion: object.version,
    objectDigest: object.digest,
    objectType: object.type,
    previousTransaction: object.previousTransaction ?? undefined,
    owner: managerJson?.owner,
    balanceManagerId: managerJson?.balance_manager?.id,
    balancesTableId,
    positionsTableId,
    rangePositionsTableId,
    balanceEntryCount: balanceFields?.dynamicFields.length,
    positionEntryCount: positionFields?.dynamicFields.length,
    rangePositionEntryCount: rangePositionFields?.dynamicFields.length,
    directDusdcBalance,
    directPositionQuantityDusdc,
    positionEntries,
    notes: [
      "Read directly from the live Sui manager object and its Table dynamic fields.",
      "Position quantities are parsed from u64 dynamic-field values.",
      "MarketKey dynamic-field names are decoded as oracle ID, expiry, strike, and UP/DOWN direction.",
      "This readback is stronger than local execution history, but settlement-aware position reconstruction still needs deeper protocol parsing.",
    ],
  };
}

function readDynamicFieldU64(field: {
  value?: {
    bcs?: unknown;
  };
}) {
  const bytes = readBcsRecordBytes(field.value?.bcs);

  if (bytes.length < 8) {
    return 0;
  }

  return Number(readU64Le(bytes.slice(0, 8)));
}

function decodeMarketKey(field: {
  name?: {
    bcs?: unknown;
  };
}): PredictMarketKeyReadback | undefined {
  const bytes = readBcsRecordBytes(field.name?.bcs);

  if (bytes.length !== MARKET_KEY_BCS_LENGTH) {
    return undefined;
  }

  const oracleId = `0x${bytes
    .slice(0, 32)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
  const expiryMs = readU64Le(bytes.slice(32, 40));
  const rawStrike = readU64Le(bytes.slice(40, 48));
  const directionCode = bytes[48];
  const direction =
    directionCode === MARKET_KEY_DIRECTION_UP
      ? "UP"
      : directionCode === MARKET_KEY_DIRECTION_DOWN
        ? "DOWN"
        : "UNKNOWN";
  const side =
    direction === "UP"
      ? "YES"
      : direction === "DOWN"
        ? "NO"
        : "UNKNOWN";

  return {
    oracleId,
    expiryMs: expiryMs.toString(),
    expiryIso: new Date(Number(expiryMs)).toISOString(),
    rawStrike: rawStrike.toString(),
    strike: Number(rawStrike) / ORACLE_PRICE_DECIMALS,
    directionCode,
    direction,
    side,
    rawBytesHex: bytes.map((byte) => byte.toString(16).padStart(2, "0")).join(""),
  };
}

function readBcsRecordBytes(bcs?: unknown): number[] {
  if (!bcs || typeof bcs !== "object") {
    return [];
  }

  return Object.entries(bcs as Record<string, unknown>)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([, byte]) => byte)
    .filter((byte): byte is number => (
      typeof byte === "number"
      && Number.isInteger(byte)
      && byte >= 0
      && byte <= 255
    ));
}

function readU64Le(bytes: number[]) {
  return bytes.reduce(
    (sum, byte, index) => sum + (BigInt(byte) << BigInt(index * 8)),
    BigInt(0),
  );
}
