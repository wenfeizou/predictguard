import { Transaction } from "@mysten/sui/transactions";

import { predictTestnetConfig, type PredictTestnetConfig } from "@/lib/predict/config";
import type { PredictManagerInventoryReadback } from "@/lib/predict/managerReadback";
import type { HedgeCandidate, Side } from "@/lib/types";

const OBJECT_ID_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const PROBE_DEPOSIT_DUSDC = 2;
const PROBE_QUANTITY_DUSDC = 1;
const DEFAULT_MAX_HEDGE_BUDGET_DUSDC = 2;
const DEPOSIT_BUFFER_DUSDC = 0.25;

export type QuoteSource = "last-executed-ask" | "none";

export type QuoteFreshness = "available" | "unavailable";

export type SizingModeOverride = "auto" | "probe" | "quote-aware";

export type PredictHedgeMintInput = {
  hedge?: HedgeCandidate;
  wallet?: WalletReadinessInput;
  account?: PredictAccountReadinessInput;
  managerObjectId?: string;
  oracleObjectId?: string;
  oracleExpiryMs?: number;
  oracleMinStrike?: number;
  oracleTickSize?: number;
  oracleReferencePrice?: number;
  quoteAskPrice?: number;
  sizingModeOverride?: SizingModeOverride;
  maxHedgeBudgetDusdc?: number;
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
  managerInventory?: PredictManagerInventoryReadback;
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
    oracleMinStrike?: number;
    oracleTickSize?: number;
    oracleReferencePrice?: number;
    quoteAskPrice?: number;
    quoteSource?: QuoteSource;
    quoteFreshness?: QuoteFreshness;
    quoteExplanation?: string;
    maxHedgeBudgetDusdc?: number;
    dusdcCoinObjectId?: string;
    recipientAddress?: string;
    depositAmountMist?: string;
    quantityMist?: string;
    sizingMode?: "probe" | "quote-aware";
    estimatedExecutionCostDusdc?: number;
    budgetUsagePct?: number;
    costToProtectionRatio?: number;
    executionStrike?: number;
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
  const sizing = getExecutionSizing(input);
  const depositAmountMist = input.depositAmountMist ?? dusdcToMist(sizing.depositDusdc);
  const quantityMist = input.quantityMist ?? dusdcToMist(sizing.quantityDusdc);
  const executionStrike = getExecutionStrike(input);

  if (
    !managerObjectId ||
    !oracleObjectId ||
    !dusdcCoinObjectId ||
    !oracleExpiryMs ||
    !executionStrike
  ) {
    return plan;
  }

  const transaction = new Transaction();
  const isUp = input.hedge.side === "YES";
  const strikeScaled = priceToOracleScale(executionStrike);

  const [depositCoin] = transaction.splitCoins(transaction.object(dusdcCoinObjectId), [
    transaction.pure.u64(depositAmountMist),
  ]);

  transaction.moveCall({
    target: `${config.packageId}::predict_manager::deposit`,
    typeArguments: [config.dusdcType],
    arguments: [
      transaction.object(managerObjectId),
      depositCoin,
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
  const executionStrike = getExecutionStrike(input);
  const strikeScaled = executionStrike ? priceToOracleScale(executionStrike) : undefined;
  const sizing = getExecutionSizing(input);
  const quoteEvidence = getQuoteEvidence(input);
  const quantityMist = hedge ? (input.quantityMist ?? dusdcToMist(sizing.quantityDusdc)) : undefined;
  const depositAmountMist = hedge
    ? (input.depositAmountMist ?? dusdcToMist(sizing.depositDusdc))
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
      oracleMinStrike: input.oracleMinStrike,
      oracleTickSize: input.oracleTickSize,
      oracleReferencePrice: input.oracleReferencePrice,
      quoteAskPrice: input.quoteAskPrice,
      quoteSource: quoteEvidence.source,
      quoteFreshness: quoteEvidence.freshness,
      quoteExplanation: quoteEvidence.explanation,
      maxHedgeBudgetDusdc: input.maxHedgeBudgetDusdc ?? DEFAULT_MAX_HEDGE_BUDGET_DUSDC,
      dusdcCoinObjectId,
      recipientAddress: input.recipientAddress,
      depositAmountMist,
      quantityMist,
      sizingMode: hedge ? sizing.mode : undefined,
      estimatedExecutionCostDusdc: hedge ? sizing.estimatedCostDusdc : undefined,
      budgetUsagePct: hedge ? sizing.budgetUsagePct : undefined,
      costToProtectionRatio: hedge ? sizing.costToProtectionRatio : undefined,
      executionStrike,
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

  const sizing = getExecutionSizing(input);
  const depositAmountMist = input.depositAmountMist ?? dusdcToMist(sizing.depositDusdc);
  const quantityMist = input.quantityMist ?? dusdcToMist(sizing.quantityDusdc);
  const executionStrike = getExecutionStrike(input) ?? hedge.strike;
  const strikeScaled = priceToOracleScale(executionStrike);
  const isUp = hedge.side === "YES";
  const quoteEvidence = getQuoteEvidence(input);

  return `import { Transaction } from "@mysten/sui/transactions";

const tx = new Transaction();

const predictConfig = ${JSON.stringify(config, null, 2)};

const [depositCoin] = tx.splitCoins(tx.object(dusdcCoinObjectId), [
  tx.pure.u64("${depositAmountMist}"),
]);

tx.moveCall({
  target: \`\${predictConfig.packageId}::predict_manager::deposit\`,
  typeArguments: [predictConfig.dusdcType],
  arguments: [
    tx.object(managerObjectId),
    depositCoin,
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

// Sizing mode: ${sizing.mode}.
// Quote source: ${quoteEvidence.source}.
// Quote note: ${quoteEvidence.explanation}
// Estimated execution cost: ${sizing.estimatedCostDusdc.toLocaleString("en-US")} dUSDC.
// Split selected dUSDC coin by ${depositAmountMist} base units before deposit.
// Execution strike: ${executionStrike.toLocaleString("en-US")}.
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

function getExecutionSizing(input: PredictHedgeMintInput) {
  const maxBudgetDusdc = input.maxHedgeBudgetDusdc ?? DEFAULT_MAX_HEDGE_BUDGET_DUSDC;
  const askPrice = input.sizingModeOverride === "probe"
    ? undefined
    : input.quoteAskPrice;

  if (
    input.sizingModeOverride === "probe" ||
    askPrice === undefined ||
    askPrice <= 0 ||
    maxBudgetDusdc <= 0
  ) {
    return {
      mode: "probe" as const,
      maxBudgetDusdc,
      quantityDusdc: PROBE_QUANTITY_DUSDC,
      depositDusdc: PROBE_DEPOSIT_DUSDC,
      estimatedCostDusdc: PROBE_QUANTITY_DUSDC,
      budgetUsagePct: undefined,
      costToProtectionRatio: input.hedge
        ? PROBE_QUANTITY_DUSDC / input.hedge.notional
        : undefined,
    };
  }

  const spendableBudgetDusdc = Math.max(0.000001, maxBudgetDusdc - DEPOSIT_BUFFER_DUSDC);
  const quantityDusdc = Math.max(
    0.000001,
    Math.floor((spendableBudgetDusdc / askPrice) * 1_000_000) / 1_000_000,
  );
  const estimatedCostDusdc = quantityDusdc * askPrice;
  const depositDusdc = Math.min(
    maxBudgetDusdc,
    Math.max(estimatedCostDusdc + DEPOSIT_BUFFER_DUSDC, estimatedCostDusdc),
  );

  return {
    mode: "quote-aware" as const,
    maxBudgetDusdc,
    quantityDusdc,
    depositDusdc,
    estimatedCostDusdc,
    budgetUsagePct: (estimatedCostDusdc / maxBudgetDusdc) * 100,
    costToProtectionRatio: input.hedge
      ? estimatedCostDusdc / input.hedge.notional
      : undefined,
  };
}

function getQuoteEvidence(input: PredictHedgeMintInput): {
  source: QuoteSource;
  freshness: QuoteFreshness;
  explanation: string;
} {
  if (input.quoteAskPrice !== undefined && input.quoteAskPrice > 0) {
    return {
      source: "last-executed-ask",
      freshness: "available",
      explanation: "Sizing uses the ask price observed in the latest successful wallet mint. This is execution evidence, not a guaranteed live quote.",
    };
  }

  return {
    source: "none",
    freshness: "unavailable",
    explanation: "No usable ask price is available, so PredictGuard falls back to a fixed small probe quantity.",
  };
}

function getExecutionStrike(input: PredictHedgeMintInput): number | undefined {
  if (!input.hedge) {
    return undefined;
  }

  const minStrike = input.oracleMinStrike;
  const tickSize = input.oracleTickSize;
  const targetStrike = input.oracleReferencePrice ?? input.hedge.strike;

  if (!minStrike || !tickSize || tickSize <= 0) {
    return targetStrike;
  }

  const ticksFromMin = Math.round((targetStrike - minStrike) / tickSize);
  const aligned = minStrike + Math.max(0, ticksFromMin) * tickSize;
  return Number(aligned.toFixed(8));
}

function getPtbReadiness(input: PredictHedgeMintInput): PtbReadiness {
  const missing: string[] = [];
  const warnings = [
    "Predict mint signature is aligned with predict-testnet-4-16, but package IDs remain provisional until mainnet.",
    "Wallet execution is user-gated; the wallet owns gas selection and must confirm before submission.",
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
  const sizing = getExecutionSizing(input);
  const depositAmountMist = input.depositAmountMist ?? dusdcToMist(sizing.depositDusdc);
  const executionStrike = getExecutionStrike(input);

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

  if (!depositAmountMist) {
    missing.push("deposit amount in dUSDC base units");
  }

  if (input.account?.dusdcBalanceMist && BigInt(input.account.dusdcBalanceMist) < BigInt(depositAmountMist)) {
    missing.push("sufficient dUSDC balance for hedge cost");
  }

  const maxBudgetMist = dusdcToMist(sizing.maxBudgetDusdc);
  if (input.account?.dusdcBalanceMist && BigInt(input.account.dusdcBalanceMist) < BigInt(maxBudgetMist)) {
    missing.push("sufficient dUSDC balance for selected max budget");
  }

  if (!executionStrike) {
    missing.push("execution strike aligned to live oracle grid");
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
