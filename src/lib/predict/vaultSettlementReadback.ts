import { SuiGrpcClient } from "@mysten/sui/grpc";

import { predictTestnetConfig } from "@/lib/predict/config";

const ORACLE_ID_BCS_LENGTH = 32;
const SETTLED_ORACLE_PAGE_LIMIT = 200;
const SETTLED_ORACLE_MAX_PAGES = 30;

export type PredictVaultSettlementEvidence = {
  oracleId: string;
  present: boolean;
  fieldId?: string;
  valueType?: string;
};

export type PredictVaultSettlementReadback = {
  source: "sui-grpc";
  predictObjectId: string;
  settledOraclesTableId?: string;
  settledOracleTableSize?: number;
  checkedOracleIds: string[];
  matchedOracleIds: string[];
  evidence: PredictVaultSettlementEvidence[];
  scannedEntryCount: number;
  hasNextPage: boolean;
  scanLimitReached: boolean;
  reconstructedAtIso: string;
  notes: string[];
};

type PredictObjectJson = {
  vault?: {
    settled_oracles?: {
      id?: string;
      size?: string;
    };
  };
};

export async function fetchPredictVaultSettlementReadback(
  oracleIds: string[],
): Promise<PredictVaultSettlementReadback> {
  const checkedOracleIds = Array.from(
    new Set(oracleIds.map((oracleId) => normalizeObjectId(oracleId)).filter(Boolean)),
  );
  const client = new SuiGrpcClient({
    network: predictTestnetConfig.network,
    baseUrl: "https://fullnode.testnet.sui.io:443",
  });
  const { object } = await client.core.getObject({
    objectId: predictTestnetConfig.predictObjectId,
    include: {
      json: true,
    },
  });
  const predictJson = object.json as PredictObjectJson | undefined;
  const settledOraclesTableId = predictJson?.vault?.settled_oracles?.id;
  const settledOracleTableSize = Number(predictJson?.vault?.settled_oracles?.size);
  const notes = [
    "Read the live Predict object and its vault.settled_oracles Table through Sui gRPC.",
    "Dynamic-field names are decoded as oracle object IDs; values are kept as evidence metadata only.",
  ];

  if (checkedOracleIds.length === 0) {
    return {
      source: "sui-grpc",
      predictObjectId: predictTestnetConfig.predictObjectId,
      settledOraclesTableId,
      settledOracleTableSize: Number.isFinite(settledOracleTableSize)
        ? settledOracleTableSize
        : undefined,
      checkedOracleIds,
      matchedOracleIds: [],
      evidence: [],
      scannedEntryCount: 0,
      hasNextPage: false,
      scanLimitReached: false,
      reconstructedAtIso: new Date().toISOString(),
      notes: [...notes, "No oracle IDs were provided for vault settlement matching."],
    };
  }

  if (!settledOraclesTableId) {
    return {
      source: "sui-grpc",
      predictObjectId: predictTestnetConfig.predictObjectId,
      settledOraclesTableId,
      settledOracleTableSize: Number.isFinite(settledOracleTableSize)
        ? settledOracleTableSize
        : undefined,
      checkedOracleIds,
      matchedOracleIds: [],
      evidence: checkedOracleIds.map((oracleId) => ({ oracleId, present: false })),
      scannedEntryCount: 0,
      hasNextPage: false,
      scanLimitReached: false,
      reconstructedAtIso: new Date().toISOString(),
      notes: [...notes, "The Predict object did not expose vault.settled_oracles.id."],
    };
  }

  const remaining = new Set(checkedOracleIds);
  const evidenceByOracleId = new Map<string, PredictVaultSettlementEvidence>();
  let cursor: string | undefined;
  let hasNextPage = false;
  let scannedEntryCount = 0;
  let pages = 0;

  while (pages < SETTLED_ORACLE_MAX_PAGES && remaining.size > 0) {
    const page = await client.listDynamicFields({
      parentId: settledOraclesTableId,
      limit: SETTLED_ORACLE_PAGE_LIMIT,
      cursor,
      include: {
        value: true,
      },
    });

    pages += 1;
    scannedEntryCount += page.dynamicFields.length;
    hasNextPage = page.hasNextPage;
    cursor = page.cursor ?? undefined;

    for (const field of page.dynamicFields) {
      const oracleId = decodeOracleIdDynamicFieldName(field);

      if (oracleId && remaining.has(oracleId)) {
        evidenceByOracleId.set(oracleId, {
          oracleId,
          present: true,
          fieldId: field.fieldId,
          valueType: field.valueType,
        });
        remaining.delete(oracleId);
      }
    }

    if (!page.hasNextPage) {
      break;
    }
  }

  const scanLimitReached = hasNextPage && remaining.size > 0;
  const evidence = checkedOracleIds.map((oracleId) =>
    evidenceByOracleId.get(oracleId) ?? {
      oracleId,
      present: false,
    }
  );
  const matchedOracleIds = evidence.filter((item) => item.present).map((item) => item.oracleId);

  return {
    source: "sui-grpc",
    predictObjectId: predictTestnetConfig.predictObjectId,
    settledOraclesTableId,
    settledOracleTableSize: Number.isFinite(settledOracleTableSize)
      ? settledOracleTableSize
      : undefined,
    checkedOracleIds,
    matchedOracleIds,
    evidence,
    scannedEntryCount,
    hasNextPage,
    scanLimitReached,
    reconstructedAtIso: new Date().toISOString(),
    notes: [
      ...notes,
      scanLimitReached
        ? "Scan limit reached before every target oracle could be proven absent."
        : "Target oracle scan completed or stopped early after all targets were matched.",
    ],
  };
}

function decodeOracleIdDynamicFieldName(field: {
  name?: {
    bcs?: unknown;
  };
}) {
  const bytes = readBcsRecordBytes(field.name?.bcs);

  if (bytes.length !== ORACLE_ID_BCS_LENGTH) {
    return undefined;
  }

  return `0x${bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
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

function normalizeObjectId(value: string) {
  return value.trim().toLowerCase();
}
