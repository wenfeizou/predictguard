# PTB and DeepBook Integration

## Integration Principle

The project should be useful even before full testnet execution works. Build in this order:

1. PTB preview with documented placeholders.
2. Sui SDK transaction skeleton.
3. Testnet package/object IDs wired by config.
4. Optional real hedge mint.

## Official References

- DeepBook Predict docs: <https://docs.sui.io/onchain-finance/deepbook-predict/>
- Predict package branch: <https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict>

Important notes from official materials:

- Predict is on Sui testnet.
- dUSDC is the quote asset for Predict testnet and is not official USDC.
- Public server/API is referenced by the track problem statement.
- Official docs warn that package IDs, object IDs, and entrypoints may change before mainnet.

## Config File

Create a config file like:

```ts
export const predictConfig = {
  network: "testnet",
  packageId: "TODO",
  predictObjectId: "TODO",
  dusdcType: "TODO",
  managerObjectId: "TODO",
  apiBaseUrl: "https://predict-server.testnet.mystenlabs.com",
};
```

Do not hardcode mutable IDs throughout the app.

## PTB Preview

The MVP PTB preview should be human-readable:

```text
1. Select dUSDC coin for hedge cost.
2. Load user's PredictManager.
3. Mint OTM YES binary:
   - strike: 73,000
   - expiry: 15m
   - notional: 100
   - max cost: 12 dUSDC
4. Return hedge position to manager.
5. Show expected risk effect in report.
```

## Sui SDK Skeleton

Pseudo-code:

```ts
import { Transaction } from "@mysten/sui/transactions";

export function buildHedgePreviewTx(input: HedgeTxInput) {
  const tx = new Transaction();

  // TODO: wire real Predict entrypoints after confirming current package API.
  tx.moveCall({
    target: `${input.packageId}::predict::mint`,
    arguments: [
      tx.object(input.predictObjectId),
      tx.object(input.managerObjectId),
      tx.pure.u64(input.strike),
      tx.pure.u64(input.expiryTimestamp),
      tx.pure.u64(input.notional),
      tx.object(input.dusdcCoinObjectId),
    ],
  });

  return tx;
}
```

Treat this as a skeleton until function signatures are verified from the current branch/docs.

## Real Execution Stretch Checklist

- Join DeepBook builder group if needed.
- Request dUSDC through the official form.
- Confirm latest package IDs and object IDs.
- Create or load a PredictManager.
- Execute a tiny mint transaction on testnet.
- Capture transaction digest.
- Link transaction in the PTB preview/report.

## Fallback

If real execution is blocked:

- ship PTB preview
- show code skeleton
- show config placeholders
- document exact integration blockers
- keep the risk simulator and report fully functional

