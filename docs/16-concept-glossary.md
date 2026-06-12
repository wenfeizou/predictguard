# Concept Glossary

This document records PredictGuard concepts, English terms, protocol terms, and
plain-language explanations. Update it whenever a new concept appears in
planning, implementation, testing, or demo preparation.

## How To Use This Document

- Use English terms as stable anchors, because code, SDK docs, and protocol docs
  usually use English.
- Add the Chinese explanation in the PredictGuard context, not only a dictionary
  translation.
- Treat each entry as a Chinese-English cross reference: the heading is the
  English anchor, the `Chinese:` line gives the Chinese name, and the body
  explains how the term is used in PredictGuard.
- When a concept changes after implementation, update the existing entry instead
  of creating a duplicate.

## Current Development Concepts

### Mint

Chinese: 铸造、创建仓位。

In PredictGuard, `mint` means creating a DeepBook Predict position on-chain. It
does not mean issuing a new token for the project. For example, when the user
buys a YES or NO prediction position for a BTC strike and expiry, the app calls
`predict::mint`.

Why it matters: a successful `mint` proves that the app can execute a real
DeepBook Predict transaction, not only display a simulation.

### DeepBook Predict

Chinese: DeepBook Predict，DeepBook 的预测/二元仓位协议模块。

`DeepBook Predict` is the Sui testnet protocol surface PredictGuard integrates
with. In this project, it provides Predict managers, binary positions, oracles,
pricing, vault context, and mint entrypoints.

In Chinese, PredictGuard is not a generic prediction-market UI. It is a risk
management workflow built around DeepBook Predict primitives.

### Binary Market

Chinese: 二元市场、二元结果市场。

A `binary market` has two possible sides, usually represented as `YES` and
`NO`. The position value depends on whether the market condition is true at
expiry.

Example:

```text
YES 62,151
NO 62,151
```

In Chinese, this means the market is centered around a strike such as `62,151`,
and the user chooses the side that matches the risk they want to hedge.

### YES / NO

Chinese: YES / NO 方向，是/否方向。

`YES` and `NO` are the two sides of a binary Predict market.

- `YES`: the condition is expected to be true at settlement.
- `NO`: the condition is expected to be false at settlement.

In PredictGuard, these are not only speculative directions. They are used as
hedge instruments. For example, a PLP exposed to a specific tail event may buy
the side that pays in that adverse scenario.

### Position

Chinese: 持仓、仓位。

A `position` is what the user owns after a successful Predict mint. It records
the direction, strike, expiry, quantity, and market key of the prediction
exposure.

PredictGuard should display positions after execution so the user can see what
was actually bought.

### Manager / PredictManager

Chinese: Predict 协议里的用户交易管理对象。

`PredictManager` is a shared on-chain object that manages a user's DeepBook
Predict balances and positions. It is similar to a protocol sub-account for
Predict trading.

PredictGuard first checks whether the connected wallet already has a manager.
If not, it can create one through `predict::create_manager`.

### Account Readiness

Chinese: 账户准备状态。

`Account readiness` means whether the connected wallet has the objects and
balances required before PredictGuard can build a transaction.

Current checks include:

- wallet connected
- wallet on Sui testnet
- enough dUSDC
- available dUSDC coin object
- existing `PredictManager`, or ability to create one

In Chinese, this is the app's pre-flight checklist before allowing a real
wallet-signed Predict mint.

### Readback

Chinese: 读回、回读链上状态。

`Readback` means querying the chain or official Predict server after a
transaction to show updated state in the UI.

Example: after mint succeeds, the app should read back the manager and position
state instead of only showing a transaction digest.

### Post-Mint Readback

Chinese: mint 后读回、铸造后读取结果。

`Post-mint readback` means waiting for the confirmed transaction and extracting
what was actually minted: side, strike, expiry, quantity, cost, manager, oracle,
and digest.

This is stronger than "transaction submitted" because it tells the user what
the chain accepted and recorded.

### Probe

Chinese: 探针、小额试单。

A `probe` is a deliberately small transaction used to verify that the protocol
path works. The current live mint probe deposits `2 dUSDC` and mints `1 dUSDC`
of quantity.

Why it matters: a probe reduces risk while confirming wallet, manager, dUSDC,
oracle, market key, and mint wiring.

### Quote

Chinese: 报价。

A `quote` is the current price or cost to buy or sell a position. In the
successful live mint probe, the `ask_price` was `232220614`, and the actual cost
was about `0.232220 dUSDC`.

PredictGuard needs quotes to avoid blindly choosing transaction size.

### Quote-Aware

Chinese: 感知报价、基于报价决策。

`Quote-aware` means the app checks the live price or cost before deciding
whether and how much to buy.

Without quote awareness, the app may submit a transaction that fails protocol
checks such as `assert_mintable_ask`, or it may buy protection at a bad price.

In PredictGuard, `quote-aware sizing` means:

```text
available budget = max hedge budget - safety buffer
quantity = available budget / ask price
```

Current v1 example:

```text
max budget = 2 dUSDC
safety buffer = 0.25 dUSDC
available budget = 1.75 dUSDC
ask price ~= 0.24
quantity ~= 7.3 dUSDC
```

Why it matters: this is the first step from "always mint a fixed 1 dUSDC probe"
to "choose trade size from price and budget."

Important limitation: v1 uses the most recent successful mint's ask price as a
practical quote estimate. A later version should use a direct live quote or
market pricing source when available.

### Quote Source

Chinese: 报价来源。

`Quote source` explains where the ask price used for sizing comes from.

Current labels:

- `Last executed ask`: the ask price observed in the latest successful wallet
  mint.
- `No quote`: no usable ask price is available, so PredictGuard uses probe mode.

Important: `Last executed ask` is real execution evidence, but it is not the
same as a guaranteed live quote.

### Quote Freshness

Chinese: 报价新鲜度。

`Quote freshness` indicates whether PredictGuard has usable quote evidence for
sizing.

Current labels:

- `Available`: a previous ask price is available and can drive quote-aware
  sizing.
- `Unavailable`: no ask price is available, so sizing falls back to a fixed
  probe.

Future versions should distinguish live quote, stale quote, and simulated quote
more precisely.

### Safety Buffer

Chinese: 安全缓冲、预算缓冲。

`Safety buffer` is the part of the selected budget that PredictGuard does not
plan to spend when estimating quote-aware quantity.

Example:

```text
max budget = 2 dUSDC
safety buffer = 0.25 dUSDC
available budget = 1.75 dUSDC
```

In Chinese, this leaves room for price movement between planning and wallet
execution.

### Hedge

Chinese: 对冲。

A `hedge` is a trade that reduces downside risk from another position. In
PredictGuard, the user may have PLP or vault exposure, and the app recommends a
Predict position to reduce tail loss.

Example: if a vault is exposed to BTC downside, PredictGuard may recommend a
position that pays when BTC falls below or fails to exceed a strike.

### Hedge Sizing

Chinese: 对冲规模计算。

`Hedge sizing` means deciding how large the hedge should be. It should depend on
the user's risk exposure, available balance, quote price, expected protection,
and maximum acceptable cost.

Current state: PredictGuard uses a fixed small probe for live execution. The
next deeper version should calculate real hedge size from quotes and risk
reduction.

Current updated state: PredictGuard now has quote-aware sizing v1. If no quote
is available, it falls back to probe mode. If a recent ask price is available,
it estimates quantity from max budget and ask price.

### Max Hedge Budget

Chinese: 最大对冲预算。

`Max hedge budget` is the user's selected spending cap for a hedge execution.
It limits how much dUSDC PredictGuard should plan to use when building a mint.

It is different from recommended notional:

```text
recommended notional = how much exposure to protect
max hedge budget = how much the user is willing to spend
```

### Deposit

Chinese: 存入、充值到 PredictManager。

In PredictGuard's mint PTB, `deposit` is the amount of dUSDC split from the
wallet coin and moved into `PredictManager` before minting.

Deposit is not the same as trading cost. For example:

```text
deposit = 2 dUSDC
actual cost = 1.782642 dUSDC
```

The remaining amount is expected to stay on the manager side as available
balance, subject to protocol accounting.

### Actual Cost

Chinese: 实际成交成本。

`Actual cost` is the amount of dUSDC consumed by the mint, parsed from the
`PositionMinted` event. It may differ slightly from `estimated cost` because the
app estimates from the last known quote while the chain computes the current
mint price at execution time.

Example:

```text
quantity = 1 dUSDC
ask price = 0.398901165
actual cost = 0.398901 dUSDC
```

In Chinese, this means the user received `1 dUSDC` of Predict position exposure
and actually paid about `0.398901 dUSDC` for that mint.

### Estimated Cost

Chinese: 预估成本。

`Estimated cost` is the app's pre-signing cost estimate. In quote-aware sizing
v1, it is based on:

```text
estimated cost = planned quantity * latest known ask price
```

It is a planning number, not a guaranteed final chain result.

### Error Handling

Chinese: 错误处理。

`Error handling` means catching failures and showing useful guidance.

Examples:

- wallet not connected
- wrong network
- no dUSDC
- missing `PredictManager`
- user rejects wallet request
- Move abort such as `assert_mintable_ask`
- insufficient balance
- stale oracle or quote

Good error handling translates raw protocol errors into actions the user can
take.

### Move Abort

Chinese: Move 合约中止、链上合约主动报错。

`MoveAbort` means a Sui Move function rejected the transaction during execution.
It is not a frontend exception; it is an on-chain contract check failing.

Examples seen in PredictGuard:

- `assert_mintable_ask`: the requested mint price or parameters are outside the
  acceptable ask boundary.
- `assert_live_oracle`: the oracle passed into the transaction is not accepted
  as a live oracle by the contract.

In Chinese, a Move abort usually means the transaction was constructed and sent
to the wallet, but the protocol refused one of its assumptions.

### assert_mintable_ask

Chinese: 检查是否可按当前 ask 报价 mint。

`assert_mintable_ask` is a DeepBook Predict contract check. If it aborts, the
mint request does not match a currently acceptable ask price or market
condition.

PredictGuard mitigates this by moving from fixed probe assumptions toward
quote-aware sizing.

### assert_live_oracle

Chinese: 检查 oracle 是否仍然是 live 状态。

`assert_live_oracle` is a DeepBook Predict contract check that rejects a stale,
expired, or otherwise non-live oracle.

PredictGuard mitigates this by disabling status caching, refreshing Predict
status before signing, and rebuilding the transaction with the latest eligible
active oracle.

### User Explanation

Chinese: 给用户看的解释。

`User explanation` is the plain-language message that explains what happened.
It should not expose only raw technical errors.

Example: instead of only showing `MoveAbort code 7`, explain that the selected
mint price is outside the live ask boundary and the user should refresh or use a
smaller/updated trade.

### Risk Report

Chinese: 风险报告。

A `risk report` explains the user's current exposure, likely loss scenarios,
recommended hedge, estimated cost, and expected protection.

For the competition demo, this report should connect simulated risk analysis
with real on-chain execution evidence.

### On-Chain Transaction Result

Chinese: 链上交易结果。

An `on-chain transaction result` is the final result recorded by Sui. Important
fields include digest, success/failure status, gas cost, emitted events, object
changes, and balance changes.

Example successful digest:
`2N7TpuBGod9sebHQBpQT5YtSKujWZqFLpf9HcR5hLGag`.

### Digest

Chinese: 交易摘要、交易哈希。

A `digest` uniquely identifies a Sui transaction. It is the value shown in
SuiVision or returned by `signAndExecuteTransaction`.

Digest alone is not enough; the app should also check whether the transaction
status is `success`.

### SuiVision

Chinese: SuiVision 区块浏览器。

`SuiVision` is a Sui block explorer. PredictGuard links to SuiVision so the
user or judge can inspect the transaction digest, effects, events, and object
changes independently from the app.

In Chinese, it is the external proof link for "this actually happened on
testnet."

### Demo

Chinese: 演示流程。

A `demo` is the short flow shown to judges or users. It should make the product
value obvious quickly.

PredictGuard's desired demo flow:

1. identify risk
2. recommend hedge
3. connect wallet
4. execute Predict mint
5. show position and updated risk report

### Risk Identification

Chinese: 风险识别。

`Risk identification` means finding where the user's position or vault can lose
money. In PredictGuard, this includes PLP tail loss, directional exposure, and
scenario-based PnL.

### Hedge Recommendation

Chinese: 对冲建议。

A `hedge recommendation` tells the user what Predict position to buy and why.
It should include direction, strike, expiry, estimated cost, and expected risk
reduction.

### Execution

Chinese: 执行。

`Execution` means turning the recommendation into an actual wallet-signed Sui
transaction. In this project, execution uses a Sui `Transaction` PTB passed to
`dAppKit.signAndExecuteTransaction`.

### Wallet Connection

Chinese: 钱包连接。

`Wallet connection` means the browser app asks a Sui wallet, such as Slush, for
permission to see the user's account address and supported chains.

Connection does not spend funds. It only lets the app read the selected wallet
account and prepare wallet-gated actions.

### Wallet Signing

Chinese: 钱包签名。

`Wallet signing` means the connected wallet asks the user to approve a
transaction. In PredictGuard, the wallet receives a Sui `Transaction` instance
and signs and executes it through dApp Kit.

The app cannot hard-code a private key into browser wallet execution. The user
must approve through the wallet UI.

### dApp Kit

Chinese: Mysten dApp Kit，Sui 前端钱包连接工具包。

`dApp Kit` is the Mysten frontend library PredictGuard uses to connect wallets
and submit transactions. In code, this appears as
`@mysten/dapp-kit-react` and `signAndExecuteTransaction`.

### Transaction Instance

Chinese: Transaction 实例、Sui SDK 交易对象。

A `Transaction instance` is the object built with the Sui TypeScript SDK before
wallet signing. PredictGuard builds this object from manager, dUSDC, oracle,
market key, quantity, and deposit inputs.

The wallet signs the transaction instance. The app should not treat a text
preview as enough for execution.

### PTB Readiness

Chinese: PTB 准备状态、交易块可执行状态。

`PTB readiness` is PredictGuard's status for whether a transaction can be built
and handed to the wallet.

Current labels include:

- `no-hedge`: no hedge recommendation exists.
- `preview-ready`: the app can explain the transaction, but required execution
  inputs are missing.
- `ready-to-sign`: all required inputs are present, so `Sign PTB` can be
  enabled.
- `blocked`: the UI action is disabled because something required is missing.

In Chinese, readiness is the bridge between "we have a plan" and "the wallet
can safely sign."

### Sign PTB

Chinese: 签名 PTB、提交可编程交易块给钱包签名。

`Sign PTB` is the UI action that passes the built Sui `Transaction` to the
connected wallet. If the user approves, the wallet signs and executes it.

This is the point where the demo moves from simulated recommendation to real
testnet execution.

### Result Display

Chinese: 结果展示。

`Result display` means showing what happened after execution: success status,
digest, minted position, cost, manager state, and updated risk report.

### Execution-Adjusted Risk

Chinese: 执行后修正风险、按实际执行结果调整后的风险。

`Execution-adjusted risk` compares the original hedge recommendation with the
actual on-chain result. It answers:

- How much protection did PredictGuard recommend?
- How much was actually minted on-chain?
- How much risk is still uncovered?
- How much did the executed hedge actually cost?
- How much of the selected budget was used?

Example:

```text
recommended notional = 100 dUSDC
executed quantity = 1 dUSDC
actual cost = 0.398901 dUSDC
coverage ratio = 1.00%
executed gap = 99 dUSDC
```

In Chinese, this means the app recommended protecting `100 dUSDC` of risk, but
the current wallet-signed mint only covered `1 dUSDC`. The remaining uncovered
gap is therefore `99 dUSDC`.

This metric is important because it moves PredictGuard from "show a recommended
trade" to "show what really happened after execution."

### Coverage Ratio

Chinese: 覆盖比例、风险覆盖率。

`Coverage ratio` measures how much of the recommended hedge size was actually
executed.

```text
coverage ratio = executed quantity / recommended notional
```

Example:

```text
executed quantity = 1 dUSDC
recommended notional = 100 dUSDC
coverage ratio = 1.00%
```

This does not mean the transaction failed. It means the user only executed a
small part of the recommended protection, often because the current step is a
probe, the budget is small, or the user intentionally capped the hedge size.

### Executed Gap

Chinese: 执行缺口、未覆盖缺口。

`Executed gap` is the difference between recommended hedge size and actual
executed quantity.

```text
executed gap = recommended notional - executed quantity
```

Example:

```text
recommended notional = 100 dUSDC
executed quantity = 1 dUSDC
executed gap = 99 dUSDC
```

In Chinese, this means the hedge is still short by `99 dUSDC` compared with the
recommended protection size.

### Budget Usage

Chinese: 预算使用率。

`Budget usage` compares actual hedge cost with the user's selected maximum
budget.

```text
budget usage = actual cost / max hedge budget
```

Example:

```text
max hedge budget = 2 dUSDC
actual cost = 0.398901 dUSDC
budget usage = 19.95%
```

This tells the user whether the hedge used most of the allowed budget or only a
small part of it.

### Recommended Notional

Chinese: 建议保护名义金额、建议对冲规模。

`Recommended notional` is the amount of risk exposure that PredictGuard
recommends protecting. It is not the same as the trading cost.

Example:

```text
recommended notional = 100 dUSDC
```

In Chinese, this means the app thinks the user should protect `100 dUSDC` worth
of exposure. The actual cost may be much lower because Predict positions are
priced below or above `1 dUSDC` depending on probability, strike, expiry, and
market state.

### Executed Quantity

Chinese: 实际执行数量、实际 mint 数量。

`Executed quantity` is the Predict position quantity actually minted on-chain.

Example:

```text
executed quantity = 1 dUSDC
```

This is the actual position size, not the amount paid. The amount paid is
`actual cost`.

### Manager / Account Summary

Chinese: Manager / 账户摘要。

`Manager/account summary` summarizes the user's local PredictGuard execution
history for the connected PredictManager. It currently includes:

- local execution count
- total minted quantity
- total deposited dUSDC
- total actual cost
- estimated manager remaining
- latest transaction digest
- manager object ID

This helps the user understand what has happened after wallet execution.

Important limitation: the current summary is still based on local execution
history. It should later be upgraded to direct on-chain manager and position
inventory readback.

### Local Execution History

Chinese: 本地执行历史。

`Local execution history` is execution evidence saved by the browser after
successful wallet-signed mints. It is useful for a fast MVP because it can show
recent execution results immediately.

However, it is not the chain's full source of truth. If the user changes
browser, clears storage, or executes elsewhere, local history can be incomplete.

### Estimated Manager Remaining

Chinese: 估算的 manager 剩余金额。

`Estimated manager remaining` estimates how much dUSDC remains on the manager
side after deposits and mint costs.

Current calculation:

```text
estimated manager remaining = total deposited - total actual cost
```

Example:

```text
deposited = 2 dUSDC
actual cost = 0.398901 dUSDC
estimated manager remaining = 1.601099 dUSDC
```

This is an estimate from local execution history. The deeper implementation
target is direct manager inventory readback from on-chain state.

### Direct Manager Inventory Readback

Chinese: 直接读取 manager 链上库存。

`Direct manager inventory readback` means querying the real on-chain
PredictManager state to show:

- remaining dUSDC balance
- minted positions
- position direction
- strike
- expiry
- quantity
- settlement status, when available

This is stronger than local execution history because it uses chain state as
the source of truth.

### README

Chinese: 项目说明文档。

`README` is the main repository document. It should explain what PredictGuard
does, how to run it, how it uses DeepBook Predict, and what the demo proves.

### Pitch

Chinese: 路演介绍、项目表达。

A `pitch` is the concise explanation used to present the project. It should
answer:

- What problem does PredictGuard solve?
- Why is DeepBook Predict the right primitive?
- What did the team build?
- Why is it valuable?

### Judge-Facing Story

Chinese: 面向评委的项目叙事。

`Judge-facing story` means the version of the project explanation optimized for
hackathon judges. It should be simple, credible, and evidence-driven.

It is different from developer documentation. It should focus on problem,
solution, protocol depth, demo proof, and potential impact.

### PTB

Chinese: 可编程交易块。

`PTB` means Programmable Transaction Block. It is Sui's transaction format for
combining multiple commands into one atomic transaction.

PredictGuard's live mint PTB currently does:

1. split dUSDC coin
2. deposit dUSDC into `PredictManager`
3. create `MarketKey`
4. call `predict::mint`

### MarketKey

Chinese: 市场键、预测市场标识。

`MarketKey` identifies a specific Predict market. It is built from oracle ID,
expiry, strike, and direction.

If any part is wrong, the mint may target the wrong market or fail protocol
checks.

In the current DeepBook Predict testnet source, `MarketKey` is stored as:

- `oracle_id`: oracle object ID
- `expiry`: expiry timestamp in milliseconds
- `strike`: strike price scaled by `1_000_000_000`
- `direction`: `UP = 0`, `DOWN = 1`

PredictGuard decodes manager position table keys from this structure, then
shows them as readable entries such as `YES 63,187`, expiry time, oracle ID, and
quantity.

### Position Entry

Chinese: 仓位条目。

A `position entry` is one row inside the `PredictManager.positions` table. It is
stored as:

`MarketKey -> quantity`

This means the table key says "which market this position belongs to", and the
value says "how much quantity the manager holds for that market".

### Dynamic Field Name BCS

Chinese: 动态字段名称的 BCS 编码。

Sui `Table` entries are implemented through dynamic fields. For the positions
table, the dynamic field name is the BCS-encoded `MarketKey`.

PredictGuard reads these bytes and decodes them into:

- oracle ID
- expiry
- strike
- UP/DOWN direction

This turns low-level chain storage into a human-readable manager inventory.

### UP / DOWN Direction

Chinese: UP / DOWN 方向。

DeepBook Predict's `MarketKey` stores direction as protocol values:

- `UP = 0`: price settles above the strike
- `DOWN = 1`: price settles at or below the strike

PredictGuard maps these into product language:

- `UP` is shown as `YES`
- `DOWN` is shown as `NO`

### Oracle

Chinese: 预言机。

An `oracle` provides the market reference data used by Predict, such as expiry,
strike grid, and settlement/reference price.

PredictGuard uses the active oracle to choose an execution strike that fits the
live market grid.

### Live Oracle

Chinese: live oracle，仍处于可用状态的预言机。

A `live oracle` is an oracle object the Predict contract currently accepts for
minting. It has not expired or settled, and the protocol considers it valid for
new markets.

PredictGuard must use a live oracle when building a mint PTB.

### Stale Oracle

Chinese: stale oracle，过期或陈旧的预言机。

A `stale oracle` is an oracle reference that may have been valid earlier but is
no longer safe to use. It can happen when the frontend caches status too long
or the user waits on the page while the oracle approaches expiry.

A stale oracle can trigger `assert_live_oracle`.

### Fresh Oracle Guard

Chinese: 新鲜 oracle 保护、签名前刷新预言机保护。

`Fresh oracle guard` is PredictGuard's mitigation for stale oracle failures. It
fetches the latest Predict status, selects an active oracle, and rebuilds the
transaction immediately before wallet signing.

In Chinese, it reduces the chance that a transaction is built from an expired
oracle snapshot.

### Oracle Grid

Chinese: oracle 价格网格、预言机可用价格档位。

`Oracle grid` means the valid strike range and step size defined by the oracle.
PredictGuard uses it to align the execution strike.

The page currently shows:

```text
Oracle grid = min strike / tick size
```

For example:

```text
50,000 / 1
```

This means valid strikes start from `50,000` and move in increments of `1`.

### Reference Price

Chinese: 参考价格。

`Reference price` is the latest price context used by PredictGuard to choose or
display an execution strike. It is not the same as final settlement price.

In Chinese, it is the current pricing reference used before expiry.

### Strike

Chinese: 行权价、判断价格。

`Strike` is the price level used by a Predict market. For example, BTC
`63,187` means the prediction is based on whether BTC is above or below that
level at expiry.

### Expiry

Chinese: 到期时间。

`Expiry` is the time when the prediction market settles. After expiry, the
market result can be determined.

### Ask Price

Chinese: 卖方报价、买入价。

`Ask price` is the price the user pays to buy a position from available market
liquidity.

The earlier `assert_mintable_ask` failure happened because the submitted mint
parameters were outside the acceptable ask boundary.

The ask price can change between transactions. After a quote-aware mint
succeeds, PredictGuard uses the new executed ask price to recalculate the next
plan. That is why the "planned quantity" shown after a successful transaction
can differ from the quantity that was just minted.

### Ask Bounds

Chinese: ask 报价边界、可 mint 买入价格边界。

`Ask bounds` are protocol-side limits around what ask prices or mint conditions
are acceptable. If a transaction falls outside these bounds, the contract can
abort with `assert_mintable_ask`.

In Chinese, this is one reason PredictGuard cannot rely only on stale or fixed
price assumptions.

### Implied Volatility

Chinese: 隐含波动率。

`Implied volatility` is the volatility level implied by option-like market
prices. Predict markets use pricing inputs that can reflect volatility
expectations.

PredictGuard uses volatility concepts to explain why some strikes or expiries
are more expensive or risky than others.

### Volatility Surface

Chinese: 波动率曲面。

`Volatility surface` means the shape of implied volatility across strikes and
expiries. It helps explain pricing, skew, and risk concentration.

In a final demo, showing the surface can make PredictGuard look more like a
risk tool and less like a simple execution frontend.

### SVI

Chinese: SVI 波动率参数模型。

`SVI` stands for Stochastic Volatility Inspired. It is a common model family
for representing implied volatility smiles or surfaces.

In DeepBook Predict context, SVI-related data helps describe how market prices
vary across strikes. PredictGuard should explain it as a pricing/risk surface
input, not as a user-facing trading command.

### dUSDC

Chinese: DeepBook Predict 测试网使用的 USDC 类测试资产。

`dUSDC` is the quote asset used by the current DeepBook Predict testnet
environment. It is not real mainnet USDC.

PredictGuard uses dUSDC for manager deposits and Predict mint costs.

### PLP

Chinese: Passive Liquidity Provider，被动流动性提供者。

`PLP` refers to liquidity providers exposed to market risk while earning fees or
spreads. PredictGuard's product story focuses on helping PLPs understand and
hedge tail risk.

### LP

Chinese: Liquidity Provider，流动性提供者。

`LP` is a broader term for liquidity provider. A PLP is a specific passive LP
role in the PredictGuard story.

In Chinese, LPs provide liquidity and can earn fees, but they also carry market
and payout risk.

### Vault

Chinese: 金库、策略金库。

A `vault` is a pooled strategy or account structure that manages funds under a
defined strategy. In PredictGuard, a vault builder may want to supply liquidity,
measure PLP exposure, and hedge tail risk with Predict positions.

### Vault Builder

Chinese: 金库构建者、策略金库开发者。

A `vault builder` is the developer or team designing a vault strategy.
PredictGuard targets this user because they need risk reports, hedge logic, and
execution evidence before deploying a strategy.

### TVL

Chinese: Total Value Locked，总锁仓价值。

`TVL` measures the total value controlled by a protocol, vault, or liquidity
pool. PredictGuard uses TVL to size risk and cap hedge cost.

Example:

```text
max hedge cost = TVL * maxCostPctOfTvl
```

### Utilization

Chinese: 资金利用率。

`Utilization` measures how much available liquidity or vault capacity is being
used by active risk or obligations.

In PredictGuard, high utilization can mean less room to absorb adverse market
moves or payout obligations.

### Payout Liability

Chinese: 赔付负债、潜在赔付责任。

`Payout liability` is the amount the liquidity side may need to pay if
positions settle against it.

PredictGuard uses payout liability to identify where PLP or vault risk is
concentrated.

### Max Payout Liability

Chinese: 最大赔付负债、最大潜在赔付责任。

`Max payout liability` is the worst payout obligation under the modeled
positions or scenarios.

It is one of the core risk metrics because it shows how bad the obligation can
be if the adverse side wins.

### Premium Collected

Chinese: 已收权利金、已收保费。

`Premium collected` is the income received for taking the other side of market
risk. PLPs may collect premium, but that income comes with payout liability.

PredictGuard's hedge logic should compare premium income against tail-loss
risk.

### PnL

Chinese: Profit and Loss，盈亏。

`PnL` means profit and loss. PredictGuard uses PnL to compare unhedged and
hedged outcomes under scenarios.

Example:

```text
unhedged PnL = outcome without hedge
hedged PnL = outcome after including hedge cost and payoff
```

### Unhedged / Hedged PnL

Chinese: 未对冲盈亏 / 已对冲盈亏。

`Unhedged PnL` is the result before applying the recommended hedge.
`Hedged PnL` is the result after including hedge cost and potential hedge
payoff.

In Chinese, this comparison answers whether the hedge actually improves the
risk profile.

### OTM

Chinese: Out Of The Money，价外。

`OTM` means a strike is away from the current spot price and would only pay in a
more extreme scenario.

PredictGuard often discusses OTM binary hedges because they can be cheaper
tail-risk protection.

### Spot Price

Chinese: 现货价格。

`Spot price` is the current reference price of the underlying asset, such as
BTC. PredictGuard compares strike prices to spot price when choosing hedge
candidates.

### Underlying Asset

Chinese: 标的资产。

`Underlying asset` is the asset the Predict market is based on. In the current
demo, the underlying asset is BTC.

### Quote Asset

Chinese: 计价资产、报价资产。

`Quote asset` is the asset used to price and pay for Predict positions. In the
current testnet integration, the quote asset is dUSDC.

## Product Depth Concepts

### Product Positioning

Chinese: 产品定位。

PredictGuard's current product positioning:

> PredictGuard is a DeepBook Predict risk management workflow for PLP
> providers, LPs, vault builders, and strategy developers. It identifies
> Predict exposure, recommends hedges, executes on-chain Predict positions, and
> shows whether risk improves after execution.

In Chinese:

> PredictGuard 是一个面向 PLP / LP / vault builder / strategy developer 的
> DeepBook Predict 风险管理工作流：识别风险，推荐 hedge，执行链上 Predict
> 仓位，并展示执行后风险是否改善。

This positioning is stronger than "dashboard" or "trading frontend" because it
connects risk analysis, hedge reasoning, wallet execution, and post-trade review.

### Protocol Integration Depth

Chinese: 协议集成深度。

This means how deeply PredictGuard uses and explains DeepBook Predict protocol
primitives. A shallow integration only calls `mint`. A deeper integration can
show and explain manager, position, market key, oracle, vault, pricing, and
settlement state.

For the competition, protocol depth is important because judges need to see
that PredictGuard is built around DeepBook Predict rather than using it as a
single button.

### Risk Model Depth

Chinese: 风险模型深度。

This means how seriously PredictGuard measures risk and chooses hedges. A
shallow model says "buy YES" or "buy NO" from simple rules. A deeper model
explains the user's exposure, tail loss, strike/expiry choice, estimated cost,
and expected risk reduction.

Risk model depth is what turns PredictGuard from an execution demo into a risk
management product.

### Data Adapter

Chinese: 数据适配器。

`Data adapter` is the module that fetches and normalizes data from live Predict
APIs, local seed data, or future indexers.

In Chinese, it keeps the rest of the app from depending directly on raw API
shapes.

### Normalized Market State

Chinese: 标准化市场状态。

`Normalized market state` is the internal data format PredictGuard uses after
adapting raw market data. It contains spot price, expiries, strikes, markets,
exposures, and PLP/vault state in one consistent shape.

### Risk Engine

Chinese: 风险引擎。

`Risk engine` is the logic that turns market state and scenarios into metrics
such as worst PnL, max payout liability, risk score, and tail-loss reduction.

### Exposure Matrix

Chinese: 风险敞口矩阵。

`Exposure matrix` groups exposure by expiry and strike. It helps the user see
where YES/NO notional, premium, and payout liability are concentrated.

### Scenario Simulator

Chinese: 场景模拟器。

`Scenario simulator` computes outcomes under predefined market moves, such as
BTC falling, staying flat, or rising.

In Chinese, it is how PredictGuard turns "what if BTC moves?" into concrete
PnL and risk metrics.

### Hedge Optimizer

Chinese: 对冲优化器。

`Hedge optimizer` ranks possible hedge candidates by cost, expected loss
reduction, expiry, strike, side, and user constraints.

The current version is deterministic and rule-based. A deeper version can use
more realistic live quotes and historical/stress data.

### AI Hedge Copilot

Chinese: AI 对冲助手。

`AI Hedge Copilot` is the explanation layer that translates risk metrics and
hedge recommendations into user-facing language.

In the current project, it is part of the product vision and report narrative;
future implementation can make it more interactive.

### Risk Score

Chinese: 风险评分。

`Risk score` compresses multiple risk signals into a simple number for quick
scanning. It should not replace detailed metrics, but it helps the user compare
states.

### Tail-Loss Reduction

Chinese: 尾部亏损降低幅度。

`Tail-loss reduction` measures how much a hedge improves the worst simulated
loss.

Example:

```text
tail-loss reduction = (hedged max loss - unhedged max loss) / abs(unhedged max loss)
```

In Chinese, it tells whether the hedge meaningfully reduces extreme downside.

### Product Loop Depth

Chinese: 产品闭环深度。

This means whether the user can complete the full workflow:

1. diagnose risk
2. receive a hedge recommendation
3. execute through wallet signing
4. confirm the minted position
5. review the updated risk report

Without this loop, the app may prove one technical step but still feel
unfinished as a product.

### Rule-Based Recommendation

Chinese: 规则驱动推荐。

A `rule-based recommendation` is generated from fixed logic rather than a
statistical or financial model. It is acceptable for an MVP, but it may feel
too simple for a competitive final demo unless the rules are clearly justified
and connected to real risk metrics.

### Risk Metric

Chinese: 风控指标。

A `risk metric` is a number used to describe or compare risk. Examples for
PredictGuard may include max loss, expected hedge cost, tail-loss reduction,
cost-to-protection ratio, scenario PnL, and hedge coverage ratio.

These metrics make PLP and LP risk operational instead of only descriptive.

### Scenario Comparison

Chinese: 多场景比较。

`Scenario comparison` means comparing outcomes under different market
conditions. For example, BTC down 5%, BTC flat, BTC up 5%, or high volatility
versus low volatility.

It helps judges see that the hedge recommendation is not arbitrary.

### Historical Backtest

Chinese: 历史回测。

A `historical backtest` applies the strategy to past market data to estimate
how it would have performed. In a hackathon MVP, this can be lightweight, such
as replaying a few historical volatility or price paths.

Backtesting is a depth feature, not required for the first working on-chain
loop, but it can improve credibility.

### Stress Test

Chinese: 压力测试、极端行情测试。

A `stress test` checks what happens in severe market moves, such as a fast BTC
drop, liquidity shortage, high volatility, or stale quote. It helps explain
whether a hedge still protects the user in tail scenarios.

### Executed Stress Comparison

Chinese: 执行后压力测试对比。

`Executed stress comparison` compares three versions of scenario PnL:

- unhedged PLP result
- recommended hedge result
- latest wallet-executed hedge result

This matters because the recommended hedge may be larger than the actually
minted testnet position. PredictGuard uses the latest executed quantity and cost
to show how much protection was actually achieved across multiple scenarios.

### Worst-Case Improvement

Chinese: 最差情形改善值。

`Worst-case improvement` compares the worst unhedged scenario PnL with the worst
executed-hedge scenario PnL.

If the value is positive, the executed hedge improved the simulated worst case.
If it is small, the app is showing that the executed mint covered only part of
the recommended protection.

### Tail Loss

Chinese: 尾部亏损、极端情形下的大额亏损。

`Tail loss` is loss in rare but severe market scenarios. PredictGuard's main
product value is reducing or explaining this type of risk for PLPs and vaults.

### Cost-To-Protection Ratio

Chinese: 保护成本比。

`Cost-to-protection ratio` compares how much the hedge costs against how much
loss it may reduce. It answers the question: "Is this protection worth paying
for?"

### Settlement

Chinese: 结算。

`Settlement` is the process that determines the final outcome of a Predict
market after expiry. For a full product loop, PredictGuard should eventually
explain whether a position won or lost after settlement and how that affected
the user's risk report.

### Settlement-Aware Position Reconstruction

Chinese: 考虑结算状态的仓位重建。

`Settlement-aware position reconstruction` means PredictGuard does not stop at
"there is a position entry". It tries to classify whether that position is still
active, already expired, zero quantity, or unknown.

Current v1 status labels:

- `Active`: quantity is greater than zero and expiry is still in the future.
- `Expired`: quantity is greater than zero but expiry is in the past.
- `Zero quantity`: the manager table still has this market key, but quantity is
  zero.
- `Unknown`: PredictGuard cannot decode enough fields to classify it safely.

This is not the same as full settlement accounting. Full settlement would also
read or infer the final market result, whether the YES/NO side won, and how much
value was claimed or remains claimable.

### Full Settlement Accounting

Chinese: 完整结算核算。

`Full settlement accounting` means reconstructing the complete post-expiry
state of a position:

- final settlement price
- winning side
- claimable amount
- claimed amount
- unclaimed amount
- redeemed transaction history

PredictGuard does not implement full settlement accounting yet. The current MVP
implements settlement-aware status classification, direct vault settled-oracle
evidence for target oracle IDs, and documents the remaining data requirements.

### PositionRedeemed Event

Chinese: PositionRedeemed 事件、仓位赎回事件。

`PositionRedeemed` is emitted by DeepBook Predict when a position is redeemed.
It contains quantity, payout, bid price, and whether the redemption happened
against a settled oracle.

PredictGuard needs this event history, plus oracle/vault settlement readback, to
move from settlement-aware v1 to full settlement accounting.

Current implementation note:

PredictGuard has a defensive `PositionRedeemed` parser. When a transaction with
this event is available, the parser can normalize:

- owner
- executor
- manager
- oracle
- side
- expiry
- strike
- quantity
- payout
- bid price
- `is_settled`

This parser is lifecycle evidence infrastructure. It does not by itself prove
that every expired position is redeemable.

### Lifecycle Readiness

Chinese: 生命周期准备状态。

`Lifecycle readiness` is PredictGuard's read-only classification for what should
happen after a position is minted and later reaches expiry.

Current lifecycle states:

- `Active, not redeem-ready`: the position has non-zero quantity and future
  expiry.
- `Expired, needs settlement check`: expiry is in the past, but PredictGuard
  still needs oracle/vault settlement state or redeem events before claiming it
  is redeemable.
- `Zero quantity, redeem evidence needed`: the manager table quantity is zero,
  but `PositionRedeemed` history is needed to prove payout.
- `Unknown lifecycle`: fields are missing or undecodable.

This is intentionally conservative. It helps users understand what needs
follow-up without pretending to be a full settlement engine.

### Redeem Evidence

Chinese: 赎回证据。

`Redeem evidence` is proof that a position was redeemed. In PredictGuard, the
primary redeem evidence is a confirmed `PositionRedeemed` event.

Important fields:

- payout: amount received by the manager
- bid price: per-unit redeem price
- `is_settled`: whether the redeem used settled oracle behavior
- owner and executor: who owned the manager and who submitted the transaction

Redeem evidence is needed to calculate realized hedge result after expiry.

### Redeemability

Chinese: 可赎回性。

`Redeemability` means whether a position can safely be redeemed now.

PredictGuard does not yet claim full redeemability. A safe redeem decision needs
more than manager position status:

- decoded `MarketKey`
- non-zero quantity
- oracle quoteable or settled state
- vault settlement state for settled redemptions
- correct redeem PTB inputs

Until those checks are implemented, PredictGuard uses read-only lifecycle
readiness instead of enabling wallet-signed redeem.

Current evidence status:

- PredictGuard can match a decoded position's oracle ID against the Predict
  public API oracle summary.
- The app can display oracle status and settlement price evidence when present.
- The app can read the live Predict object, find the vault's
  `settled_oracles` Table, and scan it for the candidate oracle ID.
- This can prove target-oracle `vault settled evidence` as `present`, `absent`,
  `unknown`, or `unavailable`.
- Wallet-signed redeem remains disabled because the project still needs a live
  redeemable test path, final guarded PTB checks, and `PositionRedeemed`
  validation.

### Guarded Redeem Readiness

Chinese: 受保护的赎回准备状态、赎回安全门槛清单。

`Guarded redeem readiness` is PredictGuard's checklist before any future
wallet-signed redeem action can be enabled.

It is stricter than `Redeem PTB preview`. A preview can show the call shape, but
guarded readiness asks whether signing would be safe.

Current guard checks:

- wallet owns the `PredictManager`
- decoded redeem candidate exists
- quantity is greater than zero
- expiry has been reached
- oracle is quoteable or settled
- vault settled evidence is present when needed
- wallet signing is still disabled until live validation

UI statuses:

- `pass`: this guard is satisfied.
- `fail`: this guard is known to be false and should block redeem.
- `pending`: more time, readback, or live validation is needed.

Important limitation: `Guarded redeem readiness` is still read-only. It explains
why a redeem action is or is not safe, but it does not submit a redeem
transaction yet.

### Vault Settled Evidence

Chinese: 金库结算证据。

`Vault settled evidence` means evidence that the DeepBook Predict vault has
recorded settled state for a specific oracle.

In protocol terms, this is related to the check commonly discussed as:

```text
vault.has_settled_oracle(oracle_id)
```

In PredictGuard, this is now read directly from the live Predict object:

1. Read the Predict object through Sui gRPC.
2. Extract `vault.settled_oracles.id`.
3. Scan that Table's dynamic fields.
4. Decode each dynamic-field name as an oracle object ID.
5. Match the decoded IDs against the selected position's oracle.

UI meanings:

- `present`: the candidate oracle ID exists in `vault.settled_oracles`.
- `absent`: the table was scanned and the candidate oracle ID was not found.
- `unknown`: the scan hit the page limit before proving absence.
- `unavailable`: the app has not loaded vault settlement readback for this
  candidate.

Why it matters: a settled oracle summary alone tells us the oracle has a
settlement state. Vault settled evidence tells us the Predict vault has also
recorded settled state for that oracle, which is a stronger precondition before
moving toward redeem execution.

Important limitation: this is still not full settlement accounting. It does not
compute claimable payout, prove a redeem transaction succeeded, or enable wallet
signing by itself.

### Redeem PTB Preview

Chinese: 赎回 PTB 预览。

`Redeem PTB preview` is a read-only transaction skeleton showing how
PredictGuard would call `predict::redeem` or `predict::redeem_permissionless`
for a decoded manager position.

The preview includes:

- target function
- manager object
- oracle object
- rebuilt `MarketKey`
- quantity
- lifecycle state
- oracle status and settlement evidence
- direct vault settled-oracle evidence when available
- guardrails explaining why signing is disabled

This is not wallet execution. It is a safe intermediate step before implementing
real redeem signing.

### Active Position Quantity

Chinese: 活跃仓位数量。

`Active position quantity` is the sum of manager position quantities that are
still non-zero and not expired at read time.

PredictGuard uses it as a conservative view of current hedge coverage. Zero or
expired positions are shown for transparency, but they are not counted as active
risk protection.

### Zero Quantity Position

Chinese: 零数量仓位。

A `zero quantity position` is a position table entry whose `MarketKey` still
exists, but whose stored quantity is `0`.

This can happen when the protocol keeps the table key even after quantity was
cleared or consumed. PredictGuard displays it but does not count it as active
hedge coverage.

### Expired Position

Chinese: 已到期仓位。

An `expired position` has a non-zero quantity but an expiry timestamp in the
past. It may still be useful for audit or settlement review, but PredictGuard
does not treat it as current active protection until deeper settlement
reconstruction is implemented.

### Indexer

Chinese: 索引器。

An `indexer` reads on-chain data and events into a query-friendly database or
API. PredictGuard may need an indexer or official Predict server endpoint to
reconstruct full position and manager history.

### Event Parsing

Chinese: 事件解析。

`Event parsing` means reading emitted transaction events, such as
`PositionMinted`, to understand what the contract did.

PredictGuard currently uses event parsing for post-mint execution readback.

### PositionMinted Event

Chinese: PositionMinted 事件、仓位铸造事件。

`PositionMinted` is the event emitted by DeepBook Predict when a mint creates a
position. PredictGuard parses it to display side, strike, quantity, cost,
manager, oracle, and expiry.

### Balance Changes

Chinese: 余额变化。

`Balance changes` are the token balance deltas returned with a Sui transaction.
PredictGuard uses them to show wallet-side dUSDC changes after execution.

### Object Changes

Chinese: 对象变化。

`Object changes` describe which Sui objects were created, mutated, transferred,
or deleted by a transaction.

PredictGuard can use object changes later to improve manager and position
readback.

### Dynamic Fields

Chinese: 动态字段。

`Dynamic fields` are Sui object-attached storage entries. Protocols can use
them to store collections or child state under an object.

PredictGuard may need to inspect manager dynamic fields to reconstruct direct
position inventory.

### Shared Object

Chinese: 共享对象。

A `shared object` is a Sui object that multiple users or transactions can
access through consensus. DeepBook Predict protocol objects are often shared
because many users interact with the same market or protocol state.

### Owned Object

Chinese: 地址拥有对象。

An `owned object` is controlled by a specific address. Wallet dUSDC coin
objects are examples of owned objects before they are used in a transaction.

### Coin Object

Chinese: Coin 对象、代币对象。

A `coin object` is the Sui object representing a token balance. PredictGuard
needs a dUSDC coin object to split and deposit into PredictManager.

### Testnet

Chinese: 测试网。

`Testnet` is a non-mainnet Sui network used for development and competition
integration. The current DeepBook Predict integration uses testnet dUSDC and
testnet package/object IDs.

Testnet assets and object IDs can change. PredictGuard should verify official
contract information late before final submission.

### Package ID

Chinese: 包 ID、Move 合约包地址。

`Package ID` identifies a published Move package on Sui. PredictGuard uses the
DeepBook Predict package ID to build calls such as `predict::mint`.

### Object ID

Chinese: 对象 ID。

`Object ID` identifies a Sui object, such as a Predict object, oracle object,
manager object, or coin object.

Wrong object IDs can cause PTB readiness failures or Move aborts.

### LocalStorage

Chinese: 浏览器本地存储。

`localStorage` is browser storage used by PredictGuard to persist recent
execution evidence across refreshes.

It is useful for demo continuity but is not a chain source of truth.
