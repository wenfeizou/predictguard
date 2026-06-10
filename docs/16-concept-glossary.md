# Concept Glossary

This document records PredictGuard concepts, English terms, protocol terms, and
plain-language explanations. Update it whenever a new concept appears in
planning, implementation, testing, or demo preparation.

## How To Use This Document

- Use English terms as stable anchors, because code, SDK docs, and protocol docs
  usually use English.
- Add the Chinese explanation in the PredictGuard context, not only a dictionary
  translation.
- When a concept changes after implementation, update the existing entry instead
  of creating a duplicate.

## Current Development Concepts

### Mint

Chinese: 铸造、创建仓位。

In PredictGuard, `mint` means creating a DeepBook Predict position on-chain. It
does not mean issuing a new token for the project. For example, when the user
buys an UP or DOWN prediction position for a BTC strike and expiry, the app
calls `predict::mint`.

Why it matters: a successful `mint` proves that the app can execute a real
DeepBook Predict transaction, not only display a simulation.

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

### Readback

Chinese: 读回、回读链上状态。

`Readback` means querying the chain or official Predict server after a
transaction to show updated state in the UI.

Example: after mint succeeds, the app should read back the manager and position
state instead of only showing a transaction digest.

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

### Result Display

Chinese: 结果展示。

`Result display` means showing what happened after execution: success status,
digest, minted position, cost, manager state, and updated risk report.

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

### Oracle

Chinese: 预言机。

An `oracle` provides the market reference data used by Predict, such as expiry,
strike grid, and settlement/reference price.

PredictGuard uses the active oracle to choose an execution strike that fits the
live market grid.

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
