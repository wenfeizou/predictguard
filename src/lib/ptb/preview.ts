import type { HedgeCandidate } from "@/lib/types";

export type PredictConfig = {
  network: "testnet";
  packageId: string;
  predictObjectId: string;
  managerObjectId?: string;
  dusdcType: string;
  apiBaseUrl: string;
};

export const predictConfig: PredictConfig = {
  network: "testnet",
  packageId: process.env.NEXT_PUBLIC_PREDICT_PACKAGE_ID ?? "TODO",
  predictObjectId: process.env.NEXT_PUBLIC_PREDICT_OBJECT_ID ?? "TODO",
  managerObjectId: undefined,
  dusdcType: process.env.NEXT_PUBLIC_PREDICT_DUSDC_TYPE ?? "TODO",
  apiBaseUrl:
    process.env.NEXT_PUBLIC_PREDICT_API_BASE_URL ??
    "https://predict-server.testnet.mystenlabs.com",
};

export function buildPtbPreviewSteps(hedge?: HedgeCandidate): string[] {
  if (!hedge) {
    return ["No hedge selected. Run the simulator to generate a PTB preview."];
  }

  return [
    "Select dUSDC coin for hedge cost.",
    "Load or create the user's PredictManager.",
    `Call predict::mint for an OTM ${hedge.side} binary position.`,
    `Set strike to ${hedge.strike.toLocaleString("en-US")}, expiry to ${hedge.expiryId}, notional to ${hedge.notional}.`,
    `Set max cost to ${hedge.estimatedCost.toFixed(2)} dUSDC.`,
    "Return hedge position quantity to the PredictManager.",
    "Refresh indexed market, vault, and manager state after confirmation.",
  ];
}

export function buildSuiSdkSkeleton(hedge?: HedgeCandidate): string {
  if (!hedge) {
    return "Select a hedge to generate a Sui SDK skeleton.";
  }

  return `import { Transaction } from "@mysten/sui/transactions";

const tx = new Transaction();

tx.moveCall({
  target: \`\${predictConfig.packageId}::predict::mint\`,
  arguments: [
    tx.object(predictConfig.predictObjectId),
    tx.object(managerObjectId),
    tx.pure.u64(${hedge.strike}),
    tx.pure.string("${hedge.expiryId}"),
    tx.pure.string("${hedge.side}"),
    tx.pure.u64(${hedge.notional}),
    tx.object(dusdcCoinObjectId),
  ],
});

// Entry point and argument order are placeholders until current testnet
// package signatures are verified from predict-testnet-4-16.`;
}
