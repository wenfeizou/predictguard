import { predictTestnetConfig, type PredictTestnetConfig } from "@/lib/predict/config";
import type {
  PredictManagerInventoryReadback,
  PredictManagerPositionEntry,
} from "@/lib/predict/managerReadback";

export type PredictRedeemPreviewMode = "owner-redeem" | "permissionless-redeem";

export type PredictRedeemPreviewInput = {
  inventory?: PredictManagerInventoryReadback;
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
  const missing = getMissingInputs(input.inventory, candidate);
  const canPreview = missing.length === 0;

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

function dusdcToMist(amountDusdc: number): string {
  return Math.floor(amountDusdc * 1_000_000).toString();
}
