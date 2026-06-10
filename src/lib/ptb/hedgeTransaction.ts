import { Transaction } from "@mysten/sui/transactions";

import { predictTestnetConfig, type PredictTestnetConfig } from "@/lib/predict/config";
import type { HedgeCandidate, Side } from "@/lib/types";

const OBJECT_ID_PATTERN = /^0x[a-fA-F0-9]{64}$/;

export type PredictHedgeMintInput = {
  hedge?: HedgeCandidate;
  managerObjectId?: string;
  oracleObjectId?: string;
  dusdcCoinObjectId?: string;
  recipientAddress?: string;
  maxCostMist?: string;
  config?: PredictTestnetConfig;
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
    side?: Side;
    strike?: number;
    expiryId?: string;
    notional?: number;
    estimatedCostDusdc?: number;
    managerObjectId?: string;
    oracleObjectId?: string;
    dusdcCoinObjectId?: string;
    recipientAddress?: string;
    maxCostMist?: string;
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

  const managerObjectId = input.managerObjectId;
  const oracleObjectId = input.oracleObjectId;
  const dusdcCoinObjectId = input.dusdcCoinObjectId;
  const maxCostMist = input.maxCostMist;

  if (!managerObjectId || !oracleObjectId || !dusdcCoinObjectId || !maxCostMist) {
    return plan;
  }

  const transaction = new Transaction();

  transaction.moveCall({
    target,
    arguments: [
      transaction.object(config.predictObjectId),
      transaction.object(managerObjectId),
      transaction.object(oracleObjectId),
      transaction.pure.u64(input.hedge.strike),
      transaction.pure.string(input.hedge.expiryId),
      transaction.pure.string(input.hedge.side),
      transaction.pure.u64(input.hedge.notional),
      transaction.pure.u64(maxCostMist),
      transaction.object(dusdcCoinObjectId),
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

  return {
    target,
    readiness,
    config,
    inputs: {
      side: hedge?.side,
      strike: hedge?.strike,
      expiryId: hedge?.expiryId,
      notional: hedge?.notional,
      estimatedCostDusdc: hedge?.estimatedCost,
      managerObjectId: input.managerObjectId,
      oracleObjectId: input.oracleObjectId,
      dusdcCoinObjectId: input.dusdcCoinObjectId,
      recipientAddress: input.recipientAddress,
      maxCostMist: input.maxCostMist,
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

  const maxCostMist = input.maxCostMist ?? dusdcToMist(hedge.estimatedCost);

  return `import { Transaction } from "@mysten/sui/transactions";

const tx = new Transaction();

const predictConfig = ${JSON.stringify(config, null, 2)};

tx.moveCall({
  target: \`\${predictConfig.packageId}::predict::mint\`,
  arguments: [
    tx.object(predictConfig.predictObjectId),
    tx.object(managerObjectId),
    tx.object(oracleObjectId),
    tx.pure.u64(${hedge.strike}),
    tx.pure.string("${hedge.expiryId}"),
    tx.pure.string("${hedge.side}"),
    tx.pure.u64(${hedge.notional}),
    tx.pure.u64("${maxCostMist}"),
    tx.object(dusdcCoinObjectId),
  ],
});

// Wallet flow: pass the Transaction instance to signAndExecuteTransaction.
// Do not set gas budget, gas price, or gas payment in the app.
// Execution remains blocked until the current Predict mint signature is
// verified against the predict-testnet-4-16 package source.`;
}

export function dusdcToMist(amountDusdc: number): string {
  return Math.ceil(amountDusdc * 1_000_000).toString();
}

function getPtbReadiness(input: PredictHedgeMintInput): PtbReadiness {
  const missing: string[] = [];
  const warnings = [
    "Predict mint entrypoint signature still needs final verification against the current testnet package.",
    "Wallet connection and dUSDC coin selection are not wired in the UI yet.",
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

  if (!isObjectId(input.managerObjectId)) {
    missing.push("PredictManager object ID");
  }

  if (!isObjectId(input.oracleObjectId)) {
    missing.push("OracleSVI object ID");
  }

  if (!isObjectId(input.dusdcCoinObjectId)) {
    missing.push("dUSDC coin object ID");
  }

  if (!input.maxCostMist) {
    missing.push("max cost in dUSDC base units");
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
    "Connect a Sui testnet wallet.",
    "Load or create the user's PredictManager.",
    "Select an active OracleSVI object for the target expiry and strike.",
    "Select a dUSDC coin object that covers the hedge max cost.",
    `Build a Predict mint PTB for ${input.hedge.side} ${input.hedge.notional} notional at ${input.hedge.strike.toLocaleString("en-US")}.`,
    readiness.canBuildTransaction
      ? "Hand the Transaction instance to the wallet for signing after signature verification."
      : "Keep execution blocked and show the missing inputs before wallet signing.",
    "Refresh Predict server manager, market, and vault data after confirmation.",
  ];
}

function isObjectId(value?: string): value is string {
  return Boolean(value && OBJECT_ID_PATTERN.test(value));
}
