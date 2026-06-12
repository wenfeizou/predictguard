# Redeem Investigation Log

This document records concrete DeepBook Predict redeem evidence discovered
during PredictGuard development.

## 2026-06-12 Redeem Probe

第一步探查完成，结论比较清楚：

当前 `PredictManager` 没有“现在就能再次 redeem”的非零到期仓位。

当前 manager：

```text
0x3cfb9e6c6f1102ef28d20e3beed73ac20bbe0e1451eeb86cecd28e52e3fc77e2
```

有 2 个 position：

```text
1. YES 62,151
   quantity: 0 dUSDC
   expiry: 2026-06-11 09:45 北京时间
   状态: 已经被 redeem，manager 里只剩零数量 entry

2. YES 63,187
   quantity: 10.31435 dUSDC
   expiry: 2026-06-12 16:00 北京时间
   状态: active，还未到期，不能作为当前 redeem 测试对象
```

关键发现：第一个零数量仓位确实已经发生过真实 redeem。

交易：

```text
57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5
```

SuiVision:

```text
https://testnet.suivision.xyz/txblock/57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5
```

链上内容：

```text
function: predict::redeem_permissionless
status: success
position: YES 62,151
quantity: 1 dUSDC
payout: 1 dUSDC
bid price: 1
is_settled: true
owner: 0x5e2a28ff382ab6858588dba9d5ed8e21fc59908c295ced2124f87b1cdb4cefb6
executor: 0xd04ad92fc5fae447a53b0b4ef7a38b606fe383de4f58c8017e86e9378497a035
oracle: 0x7681a180a95fd9957cf581941a08f9e4a4b6a182c1f5d1f05e9333ed47023c43
```

Parser validation:

```text
summarizePredictRedeemExecution()
```

can correctly parse this `PositionRedeemed` event:

```text
digest: 57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5
status: success
side: YES
strike: 62151
quantityDusdc: 1
payoutDusdc: 1
bidPrice: 1
isSettled: true
gasMist: 1205200
```

Current conclusion:

```text
没有可立即再次 redeem 的非零仓位；
但已经有一笔真实历史 redeem，可用于产品展示、报告、parser 验证和演示证据。
```

Next actions:

1. 接入这笔历史 `PositionRedeemed` digest 到页面/报告，形成
   `Redeem evidence readback`。
2. 等当前 `YES 63,187` 仓位到 `2026-06-12 16:00` 后，再检查
   oracle/vault settlement 是否满足 redeem。
3. 如果时间不合适，就 mint 一个更短 expiry 的小额仓位，等它结算后走完整
   wallet-signed redeem 验证。

## 2026-06-12 Short-Expiry Mint For Redeem Validation

User-created short-expiry test position:

```text
Position: YES 63,317
Quantity: 1.880164 dUSDC
Actual cost: 1.155218 dUSDC
Ask price: 0.614424521
dUSDC wallet change: -1 dUSDC
Expiry: 2026-06-12 10:00:00 Beijing time
Manager: 0x3cfb9e6c6f1102ef28d20e3beed73ac20bbe0e1451eeb86cecd28e52e3fc77e2
```

Direct manager readback confirmed the position:

```text
Latest manager transaction: 2YpU6kWodtkh1tnm6zwQLLZGX2z1bPLeW7rWPYj2spBL
Oracle: 0x5ff5bc47f6f97c440316862e33e40d6c328b67f180a6aa280b60223e953db880
Expiry ISO: 2026-06-12T02:00:00.000Z
Strike: 63,317
Side: YES
Quantity: 1.880164 dUSDC
Status: active at readback time
Lifecycle: active
```

Next action:

- After expiry and oracle/vault settlement evidence are available, use this
  position to validate guarded redeem readiness and then wallet-signed redeem.
