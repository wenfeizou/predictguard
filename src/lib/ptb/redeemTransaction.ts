import { predictTestnetConfig, type PredictTestnetConfig } from "@/lib/predict/config";
import type { PredictOracleSummary } from "@/lib/predict/client";
import type {
  PredictManagerInventoryReadback,
  PredictManagerPositionEntry,
} from "@/lib/predict/managerReadback";
import type { PredictVaultSettlementReadback } from "@/lib/predict/vaultSettlementReadback";

export type PredictRedeemPreviewMode = "owner-redeem" | "permissionless-redeem";

export type PredictRedeemPreviewInput = {
  inventory?: PredictManagerInventoryReadback;
  oracles?: PredictOracleSummary[];
  vaultSettlement?: PredictVaultSettlementReadback;
  mode?: PredictRedeemPreviewMode;
  config?: PredictTestnetConfig;
};

export type PredictRedeemPreviewPlan = {
  target: string;
  mode: PredictRedeemPreviewMode;
  config: PredictTestnetConfig;
  candidate?: PredictManagerPositionEntry;
  inputs: {
    managerObjectId?: string;
    oracleObjectId?: string;
    oracleExpiryMs?: string;
    strike?: number;
    strikeScaled?: string;
    side?: "YES" | "NO" | "UNKNOWN";
    isUp?: boolean;
    quantityMist?: string;
    quantityDusdc?: number;
    lifecycle?: string;
    oracleStatus?: string;
    settlementPrice?: number;
    settledAt?: number;
  };
  evidence: {
    oracleMatched: boolean;
    oracleQuoteable: boolean;
    oracleSettled: boolean;
    vaultSettledEvidence: "present" | "absent" | "unknown" | "unavailable";
    redeemability: "blocked" | "preview-live-oracle" | "preview-settled-vault-proven" | "needs-vault-evidence";
    notes: string[];
  };
  readiness: {
    status: "blocked" | "preview-ready";
    canPreview: boolean;
    canSign: false;
    missing: string[];
    warnings: string[];
  };
  steps: string[];
};

export function buildPredictRedeemPreviewPlan(
  input: PredictRedeemPreviewInput,
): PredictRedeemPreviewPlan {
  const config = input.config ?? predictTestnetConfig;
  const mode = input.mode ?? "owner-redeem";
  const target = `${config.packageId}::predict::${
    mode === "permissionless-redeem" ? "redeem_permissionless" : "redeem"
  }`;
  const candidate = selectRedeemCandidate(input.inventory);
  const oracleEvidence = getOracleEvidence(candidate, input.oracles);
  const vaultEvidence = getVaultSettlementEvidence(candidate, input.vaultSettlement);
  const missing = getMissingInputs(input.inventory, candidate);
  const canPreview = missing.length === 0;
  const redeemability = getRedeemability({ oracleEvidence, vaultEvidence });

  return {
    target,
    mode,
    config,
    candidate,
    inputs: {
      managerObjectId: input.inventory?.managerObjectId,
      oracleObjectId: candidate?.marketKey?.oracleId,
      oracleExpiryMs: candidate?.marketKey?.expiryMs,
      strike: candidate?.marketKey?.strike,
      strikeScaled: candidate?.marketKey?.rawStrike,
      side: candidate?.marketKey?.side,
      isUp: candidate?.marketKey?.direction === "UP"
        ? true
        : candidate?.marketKey?.direction === "DOWN"
          ? false
          : undefined,
      quantityMist: candidate?.quantityDusdc === undefined
        ? undefined
        : dusdcToMist(candidate.quantityDusdc),
      quantityDusdc: candidate?.quantityDusdc,
      lifecycle: candidate?.lifecycle.label,
      oracleStatus: oracleEvidence.oracle?.status,
      settlementPrice: oracleEvidence.oracle?.settlement_price ?? undefined,
      settledAt: oracleEvidence.oracle?.settled_at ?? undefined,
    },
    evidence: {
      oracleMatched: Boolean(oracleEvidence.oracle),
      oracleQuoteable: oracleEvidence.quoteable,
      oracleSettled: oracleEvidence.settled,
      vaultSettledEvidence: vaultEvidence.status,
      redeemability,
      notes: buildEvidenceNotes({ mode, oracleEvidence, vaultEvidence }),
    },
    readiness: {
      status: canPreview ? "preview-ready" : "blocked",
      canPreview,
      canSign: false,
      missing,
      warnings: [
        "Redeem preview is read-only. Wallet-signed redeem stays disabled until oracle/vault settlement checks are implemented.",
        "Owner redeem can work for quoteable or settled oracles, but PredictGuard has not yet built the final guarded transaction path.",
        "Permissionless redeem requires the oracle to be settled; use it only after settled-state verification.",
        "The preview now reads vault.settled_oracles evidence, but it still needs a live redeem test before enabling wallet signing.",
      ],
    },
    steps: buildRedeemSteps(mode, canPreview),
  };
}

export function buildPredictRedeemSdkSkeleton(plan: PredictRedeemPreviewPlan) {
  if (!plan.candidate?.marketKey || !plan.inputs.quantityMist) {
    return "Load a decoded manager position before generating a redeem PTB preview.";
  }

  const functionName =
    plan.mode === "permissionless-redeem" ? "redeem_permissionless" : "redeem";
  const marketKey = plan.candidate.marketKey;

  return `import { Transaction } from "@mysten/sui/transactions";

const tx = new Transaction();

const predictConfig = ${JSON.stringify(plan.config, null, 2)};

const marketKey = tx.moveCall({
  target: \`\${predictConfig.packageId}::market_key::new\`,
  arguments: [
    tx.pure.id("${marketKey.oracleId}"),
    tx.pure.u64("${marketKey.expiryMs}"),
    tx.pure.u64("${marketKey.rawStrike}"),
    tx.pure.bool(${marketKey.direction === "UP"}),
  ],
});

tx.moveCall({
  target: \`\${predictConfig.packageId}::predict::${functionName}\`,
  typeArguments: [predictConfig.dusdcType],
  arguments: [
    tx.object(predictConfig.predictObjectId),
    tx.object("${plan.inputs.managerObjectId}"),
    tx.object("${marketKey.oracleId}"),
    marketKey,
    tx.pure.u64("${plan.inputs.quantityMist}"),
    tx.object.clock(),
  ],
});

// Preview only. Do not hand this Transaction to the wallet yet.
// Official signature aligned with predict-testnet-4-16:
// ${functionName}<Quote>(&mut Predict, &mut PredictManager, &OracleSVI, MarketKey, u64, &Clock).
// Lifecycle state: ${plan.inputs.lifecycle ?? "Unavailable"}.
// Oracle status: ${plan.inputs.oracleStatus ?? "Unavailable"}.
// Oracle quoteable evidence: ${plan.evidence.oracleQuoteable ? "yes" : "no"}.
// Vault settled evidence: ${plan.evidence.vaultSettledEvidence}.
// Redeemability evidence: ${plan.evidence.redeemability}.
// Quantity: ${plan.inputs.quantityDusdc?.toLocaleString("en-US") ?? "Unavailable"} dUSDC.
// Wallet-signed redeem remains blocked until redeemability is proven.`;
}

function selectRedeemCandidate(
  inventory?: PredictManagerInventoryReadback,
): PredictManagerPositionEntry | undefined {
  return inventory?.positionEntries.find((entry) =>
    Boolean(
      entry.marketKey &&
        entry.quantityDusdc !== undefined &&
        entry.quantityDusdc > 0 &&
        entry.status.code !== "active",
    )
  ) ?? inventory?.positionEntries.find((entry) =>
    Boolean(entry.marketKey && entry.quantityDusdc !== undefined && entry.quantityDusdc > 0)
  );
}

function getMissingInputs(
  inventory?: PredictManagerInventoryReadback,
  candidate?: PredictManagerPositionEntry,
) {
  const missing: string[] = [];

  if (!inventory?.managerObjectId) {
    missing.push("PredictManager inventory readback");
  }

  if (!candidate) {
    missing.push("decoded non-zero position candidate");
  }

  if (candidate && !candidate.marketKey) {
    missing.push("decoded MarketKey");
  }

  if (candidate && (candidate.quantityDusdc === undefined || candidate.quantityDusdc <= 0)) {
    missing.push("non-zero redeem quantity");
  }

  return missing;
}

function buildRedeemSteps(mode: PredictRedeemPreviewMode, canPreview: boolean) {
  return [
    "Select a decoded manager position from direct Sui gRPC readback.",
    "Recreate the MarketKey from oracle ID, expiry, scaled strike, and direction.",
    `Preview predict::${mode === "permissionless-redeem" ? "redeem_permissionless" : "redeem"} with the current manager, oracle, quantity, and Clock.`,
    canPreview
      ? "Keep signing disabled until redeemability checks are implemented."
      : "Show missing readback inputs before constructing a redeem preview.",
    "After future execution, parse PositionRedeemed and refresh manager inventory.",
  ];
}

function getOracleEvidence(
  candidate?: PredictManagerPositionEntry,
  oracles?: PredictOracleSummary[],
) {
  const oracleId = candidate?.marketKey?.oracleId;
  const oracle = oracles?.find((item) => normalizeObjectId(item.oracle_id) === normalizeObjectId(oracleId));
  const settled = oracle?.status === "settled" || oracle?.settlement_price !== null;
  const active = oracle?.status === "active";
  const pendingSettlement = oracle?.status === "pending_settlement";
  const inactive = oracle?.status === "inactive";

  return {
    oracle,
    settled,
    active,
    pendingSettlement,
    inactive,
    quoteable: Boolean(oracle && (settled || active)),
  };
}

function getVaultSettlementEvidence(
  candidate?: PredictManagerPositionEntry,
  readback?: PredictVaultSettlementReadback,
) {
  const oracleId = normalizeObjectId(candidate?.marketKey?.oracleId);

  if (!oracleId || !readback) {
    return {
      status: "unavailable" as const,
      scannedEntryCount: readback?.scannedEntryCount,
      tableId: readback?.settledOraclesTableId,
      tableSize: readback?.settledOracleTableSize,
      scanLimitReached: readback?.scanLimitReached,
    };
  }

  const evidence = readback.evidence.find((item) => normalizeObjectId(item.oracleId) === oracleId);

  if (evidence?.present) {
    return {
      status: "present" as const,
      scannedEntryCount: readback.scannedEntryCount,
      tableId: readback.settledOraclesTableId,
      tableSize: readback.settledOracleTableSize,
      scanLimitReached: readback.scanLimitReached,
      fieldId: evidence.fieldId,
      valueType: evidence.valueType,
    };
  }

  return {
    status: readback.scanLimitReached ? "unknown" as const : "absent" as const,
    scannedEntryCount: readback.scannedEntryCount,
    tableId: readback.settledOraclesTableId,
    tableSize: readback.settledOracleTableSize,
    scanLimitReached: readback.scanLimitReached,
  };
}

function getRedeemability(input: {
  oracleEvidence: ReturnType<typeof getOracleEvidence>;
  vaultEvidence: ReturnType<typeof getVaultSettlementEvidence>;
}) {
  if (!input.oracleEvidence.quoteable) {
    return "blocked";
  }

  if (input.oracleEvidence.settled) {
    return input.vaultEvidence.status === "present"
      ? "preview-settled-vault-proven"
      : "needs-vault-evidence";
  }

  return "preview-live-oracle";
}

function buildEvidenceNotes(input: {
  mode: PredictRedeemPreviewMode;
  oracleEvidence: ReturnType<typeof getOracleEvidence>;
  vaultEvidence: ReturnType<typeof getVaultSettlementEvidence>;
}) {
  const notes: string[] = [];

  if (!input.oracleEvidence.oracle) {
    notes.push("No matching oracle summary was found in the current Predict server snapshot.");
  } else if (input.oracleEvidence.settled) {
    notes.push("Oracle summary indicates settled status or a settlement price.");
  } else if (input.oracleEvidence.active) {
    notes.push("Oracle summary indicates active status, which may support owner redeem against live quoteable pricing.");
  } else if (input.oracleEvidence.pendingSettlement) {
    notes.push("Oracle summary indicates pending settlement; protocol quoteable checks reject this gap.");
  } else if (input.oracleEvidence.inactive) {
    notes.push("Oracle summary indicates inactive status; protocol quoteable checks reject inactive oracles.");
  }

  if (input.mode === "permissionless-redeem" && !input.oracleEvidence.settled) {
    notes.push("Permissionless redeem requires a settled oracle.");
  }

  if (input.vaultEvidence.status === "present") {
    notes.push("Vault settled-oracle table contains the candidate oracle ID.");
  } else if (input.vaultEvidence.status === "absent") {
    notes.push("Vault settled-oracle table was scanned and did not contain the candidate oracle ID.");
  } else if (input.vaultEvidence.status === "unknown") {
    notes.push("Vault settled-oracle scan reached its page limit before proving the candidate absent.");
  } else {
    notes.push("Vault settled-oracle evidence has not been loaded for the candidate position yet.");
  }

  if (input.vaultEvidence.tableId) {
    notes.push(
      `Vault settlement table ${input.vaultEvidence.tableId} scanned ${input.vaultEvidence.scannedEntryCount ?? 0} entries.`,
    );
  }

  return notes;
}

function normalizeObjectId(value?: string) {
  return value?.toLowerCase();
}

function dusdcToMist(amountDusdc: number): string {
  return Math.floor(amountDusdc * 1_000_000).toString();
}
