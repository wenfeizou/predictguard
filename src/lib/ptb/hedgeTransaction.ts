import { Transaction } from "@mysten/sui/transactions";

import { predictTestnetConfig, type PredictTestnetConfig } from "@/lib/predict/config";
import type { HedgeCandidate, Side } from "@/lib/types";

const OBJECT_ID_PATTERN = /^0x[a-fA-F0-9]{64}$/;

export type PredictHedgeMintInput = {
  hedge?: HedgeCandidate;
  wallet?: WalletReadinessInput;
  account?: PredictAccountReadinessInput;
  managerObjectId?: string;
  oracleObjectId?: string;
  oracleExpiryMs?: number;
  dusdcCoinObjectId?: string;
  recipientAddress?: string;
  depositAmountMist?: string;
  quantityMist?: string;
  config?: PredictTestnetConfig;
};

export type WalletReadinessInput = {
  address?: string;
  network?: string;
  connected?: boolean;
  account?: PredictAccountReadinessInput;
};

export type PredictAccountReadinessInput = {
  dusdcCoinObjectId?: string;
  dusdcBalanceMist?: string;
  managerObjectId?: string;
  managerFound?: boolean;
};

export type PtbReadinessStatus = "no-hedge" | "blocked" | "preview-ready" | "ready-to-sign";

export type PtbReadiness = {
  status: PtbReadinessStatus;
  canBuildTransaction: boolean;
  executionBlocked: boolean;
  missing: string[];
  warnings: string[];
};

export type PredictHedgePtbPlan = {
  target: string;
  readiness: PtbReadiness;
  config: PredictTestnetConfig;
  inputs: {
    walletAddress?: string;
    walletNetwork?: string;
    walletConnected?: boolean;
    dusdcBalanceMist?: string;
    managerFound?: boolean;
    side?: Side;
    strike?: number;
    expiryId?: string;
    notional?: number;
    estimatedCostDusdc?: number;
    managerObjectId?: string;
    oracleObjectId?: string;
    oracleExpiryMs?: number;
    dusdcCoinObjectId?: string;
    recipientAddress?: string;
    depositAmountMist?: string;
    quantityMist?: string;
    strikeScaled?: string;
    isUp?: boolean;
  };
  steps: string[];
};

export type PredictHedgeTransactionPreview = PredictHedgePtbPlan & {
  transaction?: Transaction;
};

export function buildPredictHedgeTransactionPreview(
  input: PredictHedgeMintInput,
): PredictHedgeTransactionPreview {
  const config = input.config ?? predictTestnetConfig;
  const target = `${config.packageId}::predict::mint`;
  const readiness = getPtbReadiness(input);
  const plan = buildPredictHedgePtbPlan(input, target, readiness, config);

  if (!readiness.canBuildTransaction || !input.hedge) {
    return plan;
  }

  const managerObjectId = input.managerObjectId ?? input.account?.managerObjectId;
  const oracleObjectId = input.oracleObjectId;
  const dusdcCoinObjectId = input.dusdcCoinObjectId ?? input.account?.dusdcCoinObjectId;
  const oracleExpiryMs = input.oracleExpiryMs;
  const depositAmountMist = input.depositAmountMist ?? dusdcToMist(input.hedge.estimatedCost);
  const quantityMist = input.quantityMist ?? dusdcToMist(input.hedge.notional);

  if (!managerObjectId || !oracleObjectId || !dusdcCoinObjectId || !oracleExpiryMs) {
    return plan;
  }

  const transaction = new Transaction();
  const isUp = input.hedge.side === "YES";
  const strikeScaled = priceToOracleScale(input.hedge.strike);

  transaction.moveCall({
    target: `${config.packageId}::predict_manager::deposit`,
    typeArguments: [config.dusdcType],
    arguments: [
      transaction.object(managerObjectId),
      transaction.object(dusdcCoinObjectId),
    ],
  });

  const marketKey = transaction.moveCall({
    target: `${config.packageId}::market_key::new`,
    arguments: [
      transaction.pure.id(oracleObjectId),
      transaction.pure.u64(oracleExpiryMs),
      transaction.pure.u64(strikeScaled),
      transaction.pure.bool(isUp),
    ],
  });

  transaction.moveCall({
    target,
    typeArguments: [config.dusdcType],
    arguments: [
      transaction.object(config.predictObjectId),
      transaction.object(managerObjectId),
      transaction.object(oracleObjectId),
      marketKey,
      transaction.pure.u64(quantityMist),
      transaction.object.clock(),
    ],
  });

  return {
    ...plan,
    transaction,
  };
}

export function buildPredictHedgePtbPlan(
  input: PredictHedgeMintInput,
  target = `${predictTestnetConfig.packageId}::predict::mint`,
  readiness = getPtbReadiness(input),
  config = input.config ?? predictTestnetConfig,
): PredictHedgePtbPlan {
  const hedge = input.hedge;
  const managerObjectId = input.managerObjectId ?? input.account?.managerObjectId;
  const dusdcCoinObjectId = input.dusdcCoinObjectId ?? input.account?.dusdcCoinObjectId;
  const strikeScaled = hedge ? priceToOracleScale(hedge.strike) : undefined;
  const quantityMist = hedge ? (input.quantityMist ?? dusdcToMist(hedge.notional)) : undefined;
  const depositAmountMist = hedge
    ? (input.depositAmountMist ?? dusdcToMist(hedge.estimatedCost))
    : undefined;

  return {
    target,
    readiness,
    config,
    inputs: {
      side: hedge?.side,
      walletAddress: input.wallet?.address,
      walletNetwork: input.wallet?.network,
      walletConnected: input.wallet?.connected,
      dusdcBalanceMist: input.account?.dusdcBalanceMist,
      managerFound: input.account?.managerFound,
      strike: hedge?.strike,
      expiryId: hedge?.expiryId,
      notional: hedge?.notional,
      estimatedCostDusdc: hedge?.estimatedCost,
      managerObjectId,
      oracleObjectId: input.oracleObjectId,
      oracleExpiryMs: input.oracleExpiryMs,
      dusdcCoinObjectId,
      recipientAddress: input.recipientAddress,
      depositAmountMist,
      quantityMist,
      strikeScaled,
      isUp: hedge ? hedge.side === "YES" : undefined,
    },
    steps: buildExecutionSteps(input, readiness),
  };
}

export function buildPredictHedgeSdkSkeleton(input: PredictHedgeMintInput): string {
  const config = input.config ?? predictTestnetConfig;
  const hedge = input.hedge;

  if (!hedge) {
    return "Select a hedge to generate a Sui SDK transaction skeleton.";
  }

  const depositAmountMist = input.depositAmountMist ?? dusdcToMist(hedge.estimatedCost);
  const quantityMist = input.quantityMist ?? dusdcToMist(hedge.notional);
  const strikeScaled = priceToOracleScale(hedge.strike);
  const isUp = hedge.side === "YES";

  return `import { Transaction } from "@mysten/sui/transactions";

const tx = new Transaction();

const predictConfig = ${JSON.stringify(config, null, 2)};

tx.moveCall({
  target: \`\${predictConfig.packageId}::predict_manager::deposit\`,
  typeArguments: [predictConfig.dusdcType],
  arguments: [
    tx.object(managerObjectId),
    tx.object(dusdcCoinObjectId),
  ],
});

const marketKey = tx.moveCall({
  target: \`\${predictConfig.packageId}::market_key::new\`,
  arguments: [
    tx.pure.id(oracleObjectId),
    tx.pure.u64(oracleExpiryMs),
    tx.pure.u64("${strikeScaled}"),
    tx.pure.bool(${isUp}),
  ],
});

tx.moveCall({
  target: \`\${predictConfig.packageId}::predict::mint\`,
  typeArguments: [predictConfig.dusdcType],
  arguments: [
    tx.object(predictConfig.predictObjectId),
    tx.object(managerObjectId),
    tx.object(oracleObjectId),
    marketKey,
    tx.pure.u64("${quantityMist}"),
    tx.object.clock(),
  ],
});

// Deposit amount preview: ${depositAmountMist} dUSDC base units.
// Wallet flow: pass the Transaction instance to signAndExecuteTransaction.
// Do not set gas budget, gas price, or gas payment in the app.
// This signature is aligned with predict-testnet-4-16:
// mint<Quote>(&mut Predict, &mut PredictManager, &OracleSVI, MarketKey, u64, &Clock).`;
}

export function dusdcToMist(amountDusdc: number): string {
  return Math.ceil(amountDusdc * 1_000_000).toString();
}

export function priceToOracleScale(price: number): string {
  return Math.round(price * 1_000_000_000).toString();
}

function getPtbReadiness(input: PredictHedgeMintInput): PtbReadiness {
  const missing: string[] = [];
  const warnings = [
    "Predict mint signature is aligned with predict-testnet-4-16, but package IDs remain provisional until mainnet.",
    "Wallet connection, PredictManager discovery, and dUSDC coin selection are not wired in the UI yet.",
  ];

  if (!input.hedge) {
    return {
      status: "no-hedge",
      canBuildTransaction: false,
      executionBlocked: true,
      missing: ["hedge recommendation"],
      warnings,
    };
  }

  if (!input.wallet?.connected || !input.wallet.address) {
    missing.push("Sui wallet connection");
  }

  if (input.wallet?.connected && input.wallet.network !== "testnet") {
    missing.push("Sui testnet network");
  }

  const managerObjectId = input.managerObjectId ?? input.account?.managerObjectId;
  const dusdcCoinObjectId = input.dusdcCoinObjectId ?? input.account?.dusdcCoinObjectId;

  if (!isObjectId(managerObjectId)) {
    missing.push("PredictManager object ID");
  }

  if (!isObjectId(input.oracleObjectId)) {
    missing.push("OracleSVI object ID");
  }

  if (!input.oracleExpiryMs) {
    missing.push("oracle expiry timestamp");
  }

  if (!isObjectId(dusdcCoinObjectId)) {
    missing.push("dUSDC coin object ID for manager deposit");
  }

  if (!input.depositAmountMist && !input.hedge.estimatedCost) {
    missing.push("deposit amount in dUSDC base units");
  }

  if (missing.length > 0) {
    return {
      status: "preview-ready",
      canBuildTransaction: false,
      executionBlocked: true,
      missing,
      warnings,
    };
  }

  return {
    status: "ready-to-sign",
    canBuildTransaction: true,
    executionBlocked: true,
    missing,
    warnings,
  };
}

function buildExecutionSteps(input: PredictHedgeMintInput, readiness: PtbReadiness): string[] {
  if (!input.hedge) {
    return ["No hedge selected. Run the simulator to generate a PTB preview."];
  }

  return [
    input.wallet?.connected
      ? "Use the connected Sui testnet wallet as transaction sender."
      : "Connect a Sui testnet wallet.",
    "Load an existing PredictManager for the connected wallet.",
    "Select an active OracleSVI object for the target expiry and strike.",
    "Deposit selected dUSDC into the PredictManager.",
    "Construct a MarketKey with oracle ID, expiry, scaled strike, and direction.",
    `Call predict::mint for ${input.hedge.side} ${input.hedge.notional} notional at ${input.hedge.strike.toLocaleString("en-US")}.`,
    readiness.canBuildTransaction
      ? "Hand the Transaction instance to the wallet for signing."
      : "Keep execution blocked and show the missing inputs before wallet signing.",
    "Refresh Predict server manager, market, and vault data after confirmation.",
  ];
}

function isObjectId(value?: string): value is string {
  return Boolean(value && OBJECT_ID_PATTERN.test(value));
}
