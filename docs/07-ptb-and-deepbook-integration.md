# PTB and DeepBook Integration

## Integration Principle

The project should be useful even before full testnet execution works. Build in this order:

1. PTB preview with documented placeholders.
2. Sui SDK transaction skeleton.
3. Testnet package/object IDs wired by config.
4. Wallet-gated manager and dUSDC readiness.
5. Small real hedge mint probe.
6. Position and manager readback.

Current implementation status:

- `src/lib/ptb/hedgeTransaction.ts` builds a typed Predict hedge mint transaction preview using `@mysten/sui/transactions`.
- The UI shows readiness state, missing inputs, guardrails, live oracle candidate, and the target `package::module::function`.
- The builder is aligned with `predict-testnet-4-16`: `predict_manager::deposit<dUSDC>`, `market_key::new`, then `predict::mint<dUSDC>`.
- The builder can return a `Transaction` only when hedge, `PredictManager`, `OracleSVI`, oracle expiry, and dUSDC coin object inputs are present.
- Wallet signing is enabled when readiness reaches `ready-to-sign`.
- A live testnet mint probe has succeeded on-chain.
- Current execution deliberately uses a small probe size while quote-aware hedge
  sizing remains future work.

Verified live mint probe:

- digest: `2N7TpuBGod9sebHQBpQT5YtSKujWZqFLpf9HcR5hLGag`
- effects status: `success`
- event: `predict::PositionMinted`
- deposit: `2 dUSDC`
- quantity: `1 dUSDC`
- execution strike: `63,187`
- cost: about `0.232220 dUSDC`

## Official References

- DeepBook Predict docs: <https://docs.sui.io/onchain-finance/deepbook-predict/>
- DeepBook Predict contract information: <https://docs.sui.io/onchain-finance/deepbook-predict/contract-information>
- Predict package branch: <https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict>

Important notes from official materials:

- Predict is on Sui testnet.
- dUSDC is the quote asset for Predict testnet and is not official USDC.
- Public server/API is referenced by the track problem statement.
- Official docs warn that package IDs, object IDs, and entrypoints may change before mainnet.

## Config File

The current config lives in `src/lib/predict/config.ts` and is mirrored by `.env.example`.
Do not hardcode mutable IDs throughout the app. Package IDs, object IDs, and coin types
must remain configurable through `NEXT_PUBLIC_PREDICT_*` values.

## PTB Preview

The MVP PTB preview should be human-readable:

```text
1. Select dUSDC coin for manager deposit.
2. Load user's PredictManager.
3. Build MarketKey:
   - oracle ID
   - expiry timestamp
   - strike: 73,000
   - side: UP
4. Mint OTM YES binary:
   - notional: 100
   - quantity: 100 dUSDC base units
5. Position quantity is recorded in PredictManager.
6. Show expected risk effect in report.
```

## Sui SDK Transaction Preview

Current preview shape:

```ts
import { Transaction } from "@mysten/sui/transactions";

export function buildHedgePreviewTx(input: HedgeTxInput): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${input.packageId}::predict_manager::deposit`,
    typeArguments: [input.dusdcType],
    arguments: [
      tx.object(input.managerObjectId),
      tx.object(input.dusdcCoinObjectId),
    ],
  });

  const key = tx.moveCall({
    target: `${input.packageId}::market_key::new`,
    arguments: [
      tx.pure.id(input.oracleObjectId),
      tx.pure.u64(input.oracleExpiryMs),
      tx.pure.u64(input.strikeScaled),
      tx.pure.bool(input.isUp),
    ],
  });

  tx.moveCall({
    target: `${input.packageId}::predict::mint`,
    typeArguments: [input.dusdcType],
    arguments: [
      tx.object(input.predictObjectId),
      tx.object(input.managerObjectId),
      tx.object(input.oracleObjectId),
      key,
      tx.pure.u64(input.quantity),
      tx.object.clock(),
    ],
  });

  return tx;
}
```

This signature is verified from `predict-testnet-4-16`:

```move
public fun mint<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    key: MarketKey,
    quantity: u64,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

## Real Execution Stretch Checklist

Completed:

- Confirmed current package IDs and object IDs from official docs.
- Imported a testnet wallet with dUSDC into Slush.
- Created and discovered a `PredictManager`.
- Executed a tiny mint transaction on testnet.
- Captured transaction digest and `PositionMinted` event.

Still needed:

- Read back minted position and manager balances after execution.
- Replace fixed probe sizing with quote-aware hedge sizing.
- Link transaction and position evidence into the risk report.

## Fallback For Future Testnet Breakage

Real execution currently works at the small probe level. If a future DeepBook
Predict testnet package, object, or API change blocks execution:

- ship PTB preview
- show code skeleton
- show config placeholders
- document exact integration blockers
- keep the risk simulator and report fully functional
