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
  reconstructedAtMs: string;
  reconstructedAtIso: string;
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
  directActivePositionQuantityDusdc?: number;
  positionEntries: PredictManagerPositionEntry[];
  notes: string[];
};

export type PredictManagerPositionEntry = {
  fieldId: string;
  marketKeyType?: string;
  valueType?: string;
  quantityDusdc?: number;
  marketKey?: PredictMarketKeyReadback;
  status: PredictPositionStatusReadback;
  lifecycle: PredictPositionLifecycleReadiness;
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

export type PredictPositionStatusReadback = {
  code: "active" | "expired" | "zero" | "unknown";
  label: string;
  explanation: string;
  countedInActiveRisk: boolean;
};

export type PredictPositionLifecycleReadiness = {
  code:
    | "active"
    | "expired-needs-settlement-check"
    | "redeem-candidate"
    | "redeemed-evidence-missing"
    | "unknown";
  label: string;
  explanation: string;
  requiresRedeemEvidence: boolean;
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
  const reconstructedAtMs = Date.now();
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
  const positionEntries = (positionFields?.dynamicFields ?? []).map((field) => {
    const quantityDusdc = field.valueType === "u64"
      ? readDynamicFieldU64(field) / DUSDC_DECIMALS
      : undefined;
    const marketKey = decodeMarketKey(field);
    const status = reconstructPositionStatus({
      marketKey,
      quantityDusdc,
      nowMs: reconstructedAtMs,
    });

    return {
      fieldId: field.fieldId,
      marketKeyType: field.name.type,
      valueType: field.valueType,
      quantityDusdc,
      marketKey,
      status,
      lifecycle: reconstructPositionLifecycleReadiness({
        status,
        marketKey,
        quantityDusdc,
      }),
    };
  });
  const directPositionQuantityDusdc = positionEntries.reduce(
    (sum, entry) => sum + (entry.quantityDusdc ?? 0),
    0,
  );
  const directActivePositionQuantityDusdc = positionEntries.reduce(
    (sum, entry) => (
      entry.status.countedInActiveRisk ? sum + (entry.quantityDusdc ?? 0) : sum
    ),
    0,
  );

  return {
    source: "sui-grpc",
    managerObjectId,
    reconstructedAtMs: reconstructedAtMs.toString(),
    reconstructedAtIso: new Date(reconstructedAtMs).toISOString(),
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
    directActivePositionQuantityDusdc,
    positionEntries,
    notes: [
      "Read directly from the live Sui manager object and its Table dynamic fields.",
      "Position quantities are parsed from u64 dynamic-field values.",
      "MarketKey dynamic-field names are decoded as oracle ID, expiry, strike, and UP/DOWN direction.",
      "Position status is reconstructed from decoded expiry, quantity, and current read time.",
      "Lifecycle readiness is read-only and does not prove redeemability without PositionRedeemed history plus oracle/vault settlement state.",
      "Full settlement accounting still requires PositionRedeemed event history plus oracle and vault settlement readback.",
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

function reconstructPositionStatus(input: {
  marketKey?: PredictMarketKeyReadback;
  quantityDusdc?: number;
  nowMs: number;
}): PredictPositionStatusReadback {
  if (input.quantityDusdc === undefined || !input.marketKey) {
    return {
      code: "unknown",
      label: "Unknown",
      explanation: "PredictGuard could not decode enough chain fields to classify this position.",
      countedInActiveRisk: false,
    };
  }

  if (input.quantityDusdc <= 0) {
    return {
      code: "zero",
      label: "Zero quantity",
      explanation: "The manager table still has this market key, but the stored quantity is zero, so it is not counted as active hedge coverage.",
      countedInActiveRisk: false,
    };
  }

  const expiryMs = Number(input.marketKey.expiryMs);

  if (!Number.isFinite(expiryMs)) {
    return {
      code: "unknown",
      label: "Unknown",
      explanation: "The position has quantity, but the expiry timestamp could not be interpreted reliably.",
      countedInActiveRisk: false,
    };
  }

  if (expiryMs <= input.nowMs) {
    return {
      code: "expired",
      label: "Expired",
      explanation: "The position still has quantity, but its expiry is in the past; it needs settlement-aware follow-up before counting it as current risk protection.",
      countedInActiveRisk: false,
    };
  }

  return {
    code: "active",
    label: "Active",
    explanation: "The position has non-zero quantity and its expiry is still in the future, so PredictGuard counts it as active hedge coverage.",
    countedInActiveRisk: true,
  };
}

function reconstructPositionLifecycleReadiness(input: {
  status: PredictPositionStatusReadback;
  marketKey?: PredictMarketKeyReadback;
  quantityDusdc?: number;
}): PredictPositionLifecycleReadiness {
  if (!input.marketKey || input.quantityDusdc === undefined) {
    return {
      code: "unknown",
      label: "Unknown lifecycle",
      explanation: "PredictGuard cannot decode enough chain fields to reason about this position lifecycle.",
      requiresRedeemEvidence: true,
    };
  }

  if (input.status.code === "active") {
    return {
      code: "active",
      label: "Active, not redeem-ready",
      explanation: "This position is still before expiry. It remains part of active hedge coverage and is not a redeem candidate yet.",
      requiresRedeemEvidence: false,
    };
  }

  if (input.status.code === "expired") {
    return {
      code: "expired-needs-settlement-check",
      label: "Expired, needs settlement check",
      explanation: "The position is past expiry, but PredictGuard still needs oracle/vault settlement state or redeem events before claiming it is redeemable.",
      requiresRedeemEvidence: true,
    };
  }

  if (input.status.code === "zero") {
    return {
      code: "redeemed-evidence-missing",
      label: "Zero quantity, redeem evidence needed",
      explanation: "The stored position quantity is zero. This may mean it was redeemed or otherwise decreased, but PositionRedeemed history is needed to prove payout.",
      requiresRedeemEvidence: true,
    };
  }

  return {
    code: "unknown",
    label: "Unknown lifecycle",
    explanation: "PredictGuard cannot safely classify this lifecycle state from the decoded fields.",
    requiresRedeemEvidence: true,
  };
}
