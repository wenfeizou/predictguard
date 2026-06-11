import { SuiGrpcClient } from "@mysten/sui/grpc";

import { predictTestnetConfig } from "@/lib/predict/config";

const DUSDC_DECIMALS = 1_000_000;

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
      "Position quantities are parsed from u64 dynamic-field values; MarketKey decoding remains a follow-up task.",
      "This readback is stronger than local execution history, but settlement-aware position reconstruction still needs deeper protocol parsing.",
    ],
  };
}

function readDynamicFieldU64(field: {
  value?: {
    bcs?: unknown;
  };
}) {
  const bytes = Object.entries((field.value?.bcs ?? {}) as Record<string, number>)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([, byte]) => byte);

  if (bytes.length < 8) {
    return 0;
  }

  return Number(
    bytes.slice(0, 8).reduce(
      (sum, byte, index) => sum + (BigInt(byte) << BigInt(index * 8)),
      BigInt(0),
    ),
  );
}
