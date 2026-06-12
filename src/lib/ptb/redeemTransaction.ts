import { predictTestnetConfig, type PredictTestnetConfig } from "@/lib/predict/config";
import type { PredictOracleSummary } from "@/lib/predict/client";
import type {
  PredictManagerInventoryReadback,
  PredictManagerPositionEntry,
} from "@/lib/predict/managerReadback";
import type { PredictVaultSettlementReadback } from "@/lib/predict/vaultSettlementReadback";

export type PredictRedeemPreviewMode = "owner-redeem" | "permissionless-redeem";

export type PredictRedeemGuardStatus = "pass" | "fail" | "pending";

export type PredictRedeemGuard = {
  id: string;
  label: string;
  status: PredictRedeemGuardStatus;
  detail: string;
};

export type PredictRedeemPreviewInput = {
  inventory?: PredictManagerInventoryReadback;
  oracles?: PredictOracleSummary[];
  vaultSettlement?: PredictVaultSettlementReadback;
  walletAddress?: string;
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
    status: "blocked" | "waiting" | "preview-ready" | "guarded-ready";
    canPreview: boolean;
    canSign: false;
    missing: string[];
    guards: PredictRedeemGuard[];
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
  const guards = buildRedeemGuards({
    inventory: input.inventory,
    candidate,
    oracleEvidence,
    vaultEvidence,
    walletAddress: input.walletAddress,
    mode,
  });
  const readinessStatus = getReadinessStatus({ canPreview, guards });

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
      status: readinessStatus,
      canPreview,
      canSign: false,
      missing,
      guards,
      warnings: [
        "Redeem readiness is still read-only. Wallet-signed redeem remains disabled until a live redeemable test path is verified.",
        "The guard checklist is intentionally stricter than the preview skeleton: it requires wallet ownership, non-zero quantity, expiry, oracle quoteability, and settled-vault evidence when relevant.",
        "Permissionless redeem uses settled-oracle evidence; owner redeem still needs final guarded transaction validation before signing can be enabled.",
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
    "Run guarded readiness checks for wallet owner, quantity, expiry, oracle state, and vault settlement evidence.",
    `Preview predict::${mode === "permissionless-redeem" ? "redeem_permissionless" : "redeem"} with the current manager, oracle, quantity, and Clock.`,
    canPreview
      ? "Keep signing disabled until live wallet-signed redeem is validated."
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

function buildRedeemGuards(input: {
  inventory?: PredictManagerInventoryReadback;
  candidate?: PredictManagerPositionEntry;
  oracleEvidence: ReturnType<typeof getOracleEvidence>;
  vaultEvidence: ReturnType<typeof getVaultSettlementEvidence>;
  walletAddress?: string;
  mode: PredictRedeemPreviewMode;
}): PredictRedeemGuard[] {
  const quantityDusdc = input.candidate?.quantityDusdc;
  const expiryMs = Number(input.candidate?.marketKey?.expiryMs);
  const nowMs = Date.now();
  const owner = normalizeObjectId(input.inventory?.owner);
  const walletAddress = normalizeObjectId(input.walletAddress);
  const walletOwnerMatches =
    Boolean(owner && walletAddress && owner === walletAddress);
  const expired = Number.isFinite(expiryMs) && expiryMs <= nowMs;
  const active = Number.isFinite(expiryMs) && expiryMs > nowMs;
  const needsVaultEvidence =
    input.mode === "permissionless-redeem" || input.oracleEvidence.settled || expired;

  return [
    {
      id: "wallet-owner",
      label: "Wallet owns manager",
      status: walletOwnerMatches ? "pass" : owner && walletAddress ? "fail" : "pending",
      detail: walletOwnerMatches
        ? "Connected wallet matches the manager owner."
        : owner && walletAddress
          ? "Connected wallet does not match the manager owner."
          : "Connect the manager owner wallet to prove owner redeem authority.",
    },
    {
      id: "manager-position",
      label: "Redeem candidate",
      status: input.candidate?.marketKey ? "pass" : "pending",
      detail: input.candidate?.marketKey
        ? "Decoded MarketKey and position entry are available."
        : "No decoded non-zero position candidate is available.",
    },
    {
      id: "quantity",
      label: "Non-zero quantity",
      status: quantityDusdc === undefined ? "pending" : quantityDusdc > 0 ? "pass" : "fail",
      detail: quantityDusdc === undefined
        ? "Position quantity is not available."
        : quantityDusdc > 0
          ? `${quantityDusdc.toLocaleString("en-US", { maximumFractionDigits: 6 })} dUSDC is available for the preview candidate.`
          : "Position quantity is zero, so it cannot be redeemed again.",
    },
    {
      id: "expiry",
      label: "Expiry reached",
      status: expired ? "pass" : active ? "pending" : "pending",
      detail: expired
        ? "The candidate position has reached expiry."
        : active
          ? `Waiting until ${new Date(expiryMs).toLocaleString("en-US", { timeZone: "Asia/Shanghai" })} Asia/Shanghai.`
          : "Expiry is not available from the decoded MarketKey.",
    },
    {
      id: "oracle",
      label: "Oracle quoteable",
      status: input.oracleEvidence.quoteable ? "pass" : input.oracleEvidence.oracle ? "fail" : "pending",
      detail: input.oracleEvidence.quoteable
        ? `Oracle status is ${input.oracleEvidence.oracle?.status ?? "available"}.`
        : input.oracleEvidence.oracle
          ? `Oracle status is ${input.oracleEvidence.oracle.status}; redeem should stay blocked.`
          : "No matching oracle summary is loaded for this candidate.",
    },
    {
      id: "vault",
      label: "Vault settled evidence",
      status: !needsVaultEvidence
        ? "pending"
        : input.vaultEvidence.status === "present"
          ? "pass"
          : input.vaultEvidence.status === "absent"
            ? "fail"
            : "pending",
      detail: !needsVaultEvidence
        ? "Vault settled evidence is not required until the candidate is expired or settled."
        : input.vaultEvidence.status === "present"
          ? "vault.settled_oracles contains the candidate oracle ID."
          : input.vaultEvidence.status === "absent"
            ? "vault.settled_oracles was scanned and did not contain the candidate oracle ID."
            : "Waiting for vault settled-oracle evidence.",
    },
    {
      id: "signing",
      label: "Wallet signing",
      status: "pending",
      detail: "Signing is intentionally disabled until a live redeemable test path is validated.",
    },
  ];
}

function getReadinessStatus(input: {
  canPreview: boolean;
  guards: PredictRedeemGuard[];
}): PredictRedeemPreviewPlan["readiness"]["status"] {
  if (!input.canPreview) {
    return "blocked";
  }

  if (input.guards.some((guard) => guard.status === "fail")) {
    return "blocked";
  }

  if (input.guards.some((guard) => guard.status === "pending")) {
    return "waiting";
  }

  return "guarded-ready";
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
