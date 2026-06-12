# PredictGuard

## English

**PredictGuard is the risk and hedge lifecycle workflow for DeepBook Predict PLPs, LPs, and vault builders.**

It is not a generic prediction market dashboard. PredictGuard helps a liquidity provider understand tail risk, choose a hedge, execute a DeepBook Predict position, read the manager state back from Sui, discover redeem evidence, and explain whether the hedge lifecycle improved risk.

### Competition Summary

PredictGuard targets the **DeepBook Predict** track. The project combines protocol integration, risk analysis, wallet execution, manager inventory readback, settlement evidence, and exportable reports.

Current status:

- Judge-demo / competition MVP: about `99%` complete.
- DeepBook Predict lifecycle extension: about `98%` complete.
- Commercial production product: about `55-65%` complete.

### What Is Completed

Core product workflow:

```text
Risk diagnosis
  -> hedge recommendation
  -> wallet readiness
  -> Predict mint execution
  -> manager inventory readback
  -> redeem history discovery
  -> settlement accounting
  -> Markdown risk report
```

Implemented capabilities:

- PLP risk overview: TVL, utilization, risk score, max payout liability, worst scenario PnL.
- Exposure heatmap by strike and expiry.
- Volatility surface / IV heatmap visualization.
- Stress scenario simulator and executed stress comparison.
- Hedge recommendation with side, strike, expiry, notional, cost, and tradeoffs.
- Demo execution controls for oracle/expiry, YES/NO side, sizing mode, and budget.
- Wallet readiness with Sui testnet, dUSDC, dUSDC coin, and PredictManager checks.
- Real wallet-signed DeepBook Predict mint through `dAppKit.signAndExecuteTransaction({ transaction })`.
- Quote-aware sizing using available ask-price evidence and budget buffer.
- Post-mint readback from `PositionMinted` events.
- Direct manager inventory readback from Sui gRPC dynamic fields.
- `MarketKey` decoding into oracle, expiry, strike, and side.
- Position lifecycle classification: active, expired, zero quantity, unknown.
- Oracle and vault settlement evidence readback.
- `PositionRedeemed` parser with multi-event transaction support.
- Permissionless redeem / external executor explanation.
- Redeem history discovery through bounded Sui GraphQL event scan plus Sui gRPC transaction readback.
- Redeem evidence linking by manager/oracle/side/strike.
- Settlement accounting: active, expired, redeemed, evidence missing, redeemed quantity, claimed payout, realized hedge PnL.
- Exportable Markdown report for judges and users.
- Bilingual concept documentation and project evolution log.

### Live Testnet Evidence

Known testnet objects and evidence used during development:

- Manager: `0x3cfb9e6c6f1102ef28d20e3beed73ac20bbe0e1451eeb86cecd28e52e3fc77e2`
- Owner wallet: `0x5e2a28ff382ab6858588dba9d5ed8e21fc59908c295ced2124f87b1cdb4cefb6`
- Predict object: `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a`
- Redeem digest for `YES 63,317`: `FxhZD6PLrPKDhgsiJAXZBvoTrMVS6YhWVZC7D5drvhps`
- Redeem digest for `YES 62,151`: `57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5`

SuiVision links:

- <https://testnet.suivision.xyz/txblock/FxhZD6PLrPKDhgsiJAXZBvoTrMVS6YhWVZC7D5drvhps>
- <https://testnet.suivision.xyz/txblock/57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5>

### Technical Depth

PredictGuard demonstrates more than a basic UI:

- It builds real Sui `Transaction` instances and hands them to the wallet.
- It uses DeepBook Predict testnet package/object IDs as versioned dependencies.
- It reads Sui manager object dynamic fields directly.
- It decodes `MarketKey` bytes into user-readable positions.
- It parses `PositionMinted` and `PositionRedeemed` events.
- It handles transactions containing multiple `PositionRedeemed` events.
- It distinguishes `owner` from `executor` for permissionless redeem.
- It discovers manager-specific redeem history with a bounded GraphQL scan.
- It links manager positions to redeem evidence and reports settlement accounting.

### Current Boundaries

These boundaries are intentional and should be clear to judges and reviewers:

- Redeem history discovery is a bounded GraphQL scan, not a production indexer.
- Older redeem history can still be missed if it falls outside the scan window.
- Realized hedge PnL uses loaded redeem payout minus local mint cost; mint cost can be incomplete if the mint happened in another browser.
- Unclaimed payout is currently shown as `Unknown`.
- Wallet-signed redeem is a stretch goal because external executors can redeem settled positions through `predict::redeem_permissionless` before the user manually signs.
- The risk model is competition-grade, not institutional-grade.
- Production deployment would need persistence, indexing, monitoring, and stronger multi-account portfolio support.

### Commercial Product Roadmap

A commercial PredictGuard could become the risk layer for DeepBook Predict capital allocators:

- Full historical indexer for all manager mints, redeems, supplies, withdrawals, and PLP changes.
- Multi-manager and multi-account portfolio view.
- Production settlement accounting with claimed/unclaimed reconciliation.
- PLP risk alerts for utilization, tail exposure, stale oracles, and abnormal volatility surface changes.
- Vault-builder dashboard for strategy reporting and allocation decisions.
- Automated hedge policy engine with approval controls.
- Keeper integration for monitoring and redeem automation.
- Team and institutional reporting workflows.

### Local Development

Requirements:

- Node.js 24+
- Bun 1.3+
- Sui wallet browser extension for wallet readiness testing

Run:

```bash
bun install
bun run dev
```

Open <http://localhost:3000>.

Quality checks:

```bash
bun run lint
bun run typecheck
bun run build
```

### Judge Demo Path

Recommended 5-minute path:

1. Open the app and show `Demo Flow`.
2. Explain PLP risk, exposure, volatility surface, and stress scenarios.
3. Show the hedge recommendation and sizing controls.
4. Connect a Sui testnet wallet with dUSDC and a PredictManager.
5. Show wallet readiness and PTB readiness.
6. Execute or inspect a Predict mint.
7. Show manager inventory readback and decoded positions.
8. Show redeem history discovery and settlement accounting.
9. Export the Markdown report.

### Key Documents

Read these first:

- [Product Brief](docs/01-product-brief.md)
- [Concept Map CN/EN](docs/21-concept-map-cn-en.md)
- [Concept Glossary](docs/16-concept-glossary.md)
- [Judge Demo Script](docs/18-judge-demo-script.md)
- [Technical Deep Dive](docs/22-technical-deep-dive.md)
- [Redeem Strategy Tradeoff](docs/25-redeem-strategy-tradeoff.md)
- [Code Review Handoff](docs/26-code-review-handoff.md)
- [Project Evolution Log](docs/15-project-evolution-log.md)
- [Final Submission Checklist](docs/19-final-submission-checklist.md)

### Official References

- Sui Overflow 2026 handbook: <https://mystenlabs.notion.site/overflow-2026-handbook>
- DeepBook Predict problem statement: <https://mystenlabs.notion.site/deepbook-predict-problem-statement>
- DeepBook Predict docs: <https://docs.sui.io/onchain-finance/deepbook-predict/>
- DeepBook Predict contract information: <https://docs.sui.io/onchain-finance/deepbook-predict/contract-information>
- DeepBook Predict source branch: <https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict>

DeepBook Predict is a testnet integration surface. Package IDs, object IDs, object layouts, and entrypoints may change before mainnet.

---

## 中文

**PredictGuard 是面向 DeepBook Predict 的 PLP、LP 和 vault builder 的风险管理与对冲生命周期工作流。**

它不是普通预测市场看板。PredictGuard 帮助流动性提供者理解尾部风险，选择对冲，执行 DeepBook Predict 仓位，从 Sui 读回 manager 状态，发现 redeem 证据，并解释这个对冲生命周期是否改善了风险。

### 比赛摘要

PredictGuard 面向 **DeepBook Predict** 赛道。项目把协议集成、风险分析、钱包执行、manager 持仓读回、结算证据和可导出的报告串成一个完整产品闭环。

当前状态：

- 评审演示 / 比赛 MVP：约 `99%` 完成。
- DeepBook Predict 生命周期扩展：约 `98%` 完成。
- 商业级生产产品：约 `55-65%` 完成。

### 已完成功能

核心产品流程：

```text
风险诊断
  -> 对冲建议
  -> 钱包准备状态
  -> Predict 链上 mint
  -> manager 持仓读回
  -> redeem 历史发现
  -> 结算核算
  -> Markdown 风险报告
```

已实现能力：

- PLP 风险总览：TVL、utilization、risk score、max payout liability、worst scenario PnL。
- 按 strike 和 expiry 展示风险暴露热力图。
- Volatility surface / IV heatmap 可视化。
- 压力场景模拟器和执行后压力测试对比。
- 对冲建议：side、strike、expiry、notional、cost、tradeoffs。
- 演示执行控制：oracle/expiry、YES/NO side、sizing mode、budget。
- 钱包准备检查：Sui testnet、dUSDC、dUSDC coin、PredictManager。
- 通过 `dAppKit.signAndExecuteTransaction({ transaction })` 真实执行 DeepBook Predict mint。
- 基于 ask price 证据和预算缓冲的 quote-aware sizing。
- 从 `PositionMinted` event 读回 mint 结果。
- 通过 Sui gRPC 直接读取 manager dynamic fields。
- 将 `MarketKey` 解码为 oracle、expiry、strike、side。
- 仓位生命周期分类：active、expired、zero quantity、unknown。
- oracle 和 vault settlement evidence 读回。
- `PositionRedeemed` parser，支持一笔交易多个 redeem event。
- 解释 permissionless redeem / external executor。
- 通过 bounded Sui GraphQL event scan + Sui gRPC transaction readback 发现 redeem 历史。
- 按 manager/oracle/side/strike 关联 redeem evidence。
- Settlement accounting：active、expired、redeemed、evidence missing、redeemed quantity、claimed payout、realized hedge PnL。
- 导出 Markdown 风险报告。
- 中英文概念文档和项目演进日志。

### 真实 Testnet 证据

开发过程中使用和验证过的 testnet 对象与交易：

- Manager: `0x3cfb9e6c6f1102ef28d20e3beed73ac20bbe0e1451eeb86cecd28e52e3fc77e2`
- Owner wallet: `0x5e2a28ff382ab6858588dba9d5ed8e21fc59908c295ced2124f87b1cdb4cefb6`
- Predict object: `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a`
- `YES 63,317` redeem digest: `FxhZD6PLrPKDhgsiJAXZBvoTrMVS6YhWVZC7D5drvhps`
- `YES 62,151` redeem digest: `57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5`

SuiVision 链接：

- <https://testnet.suivision.xyz/txblock/FxhZD6PLrPKDhgsiJAXZBvoTrMVS6YhWVZC7D5drvhps>
- <https://testnet.suivision.xyz/txblock/57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5>

### 技术深度

PredictGuard 不只是基础 UI：

- 构建真实 Sui `Transaction` 实例，并交给钱包签名执行。
- 使用 DeepBook Predict testnet package/object IDs 作为版本化依赖。
- 直接读取 Sui manager object dynamic fields。
- 解码 `MarketKey` bytes，转成人可读仓位。
- 解析 `PositionMinted` 和 `PositionRedeemed` events。
- 处理一笔交易中多个 `PositionRedeemed` events。
- 区分 `owner` 和 `executor`，解释 permissionless redeem。
- 通过 bounded GraphQL scan 发现 manager-specific redeem history。
- 将 manager positions 与 redeem evidence 关联，并输出 settlement accounting。

### 当前边界

这些边界需要对评委和代码审查者说清楚：

- Redeem history discovery 是 bounded GraphQL scan，不是生产级 indexer。
- 如果 redeem 历史太老，可能超出扫描窗口而漏掉。
- Realized hedge PnL 使用已加载 redeem payout 减去本地 mint cost；如果 mint 发生在另一个浏览器，本地成本可能不完整。
- Unclaimed payout 当前显示为 `Unknown`。
- Wallet-signed redeem 是 stretch goal，因为外部 executor 可以通过 `predict::redeem_permissionless` 抢先赎回已结算仓位。
- 当前风险模型是比赛级，不是机构级量化风控引擎。
- 生产级部署还需要持久化、索引、监控和更强的多账户/多组合支持。

### 商业级产品规划

商业化版本的 PredictGuard 可以成为 DeepBook Predict 资金提供者的风险层：

- 为所有 manager mints、redeems、supplies、withdrawals 和 PLP changes 建完整历史 indexer。
- 多 manager / 多账户 portfolio view。
- 生产级 settlement accounting，支持 claimed/unclaimed reconciliation。
- PLP 风险告警：utilization、tail exposure、stale oracle、异常 volatility surface。
- Vault builder dashboard，用于策略报告和资金配置决策。
- 自动化 hedge policy engine，并带审批控制。
- Keeper integration，用于监控和 redeem 自动化。
- 团队和机构级 reporting workflow。

### 本地开发

要求：

- Node.js 24+
- Bun 1.3+
- 用于 wallet readiness 测试的 Sui 钱包浏览器插件

运行：

```bash
bun install
bun run dev
```

打开 <http://localhost:3000>。

质量检查：

```bash
bun run lint
bun run typecheck
bun run build
```

### 评审演示路径

建议 5 分钟演示路径：

1. 打开应用，先讲 `Demo Flow`。
2. 解释 PLP risk、exposure、volatility surface、stress scenarios。
3. 展示 hedge recommendation 和 sizing controls。
4. 连接有 dUSDC 和 PredictManager 的 Sui testnet 钱包。
5. 展示 wallet readiness 和 PTB readiness。
6. 执行或检查 Predict mint。
7. 展示 manager inventory readback 和 decoded positions。
8. 展示 redeem history discovery 和 settlement accounting。
9. 导出 Markdown report。

### 关键文档

建议优先阅读：

- [Product Brief](docs/01-product-brief.md)
- [Concept Map CN/EN](docs/21-concept-map-cn-en.md)
- [Concept Glossary](docs/16-concept-glossary.md)
- [Judge Demo Script](docs/18-judge-demo-script.md)
- [Technical Deep Dive](docs/22-technical-deep-dive.md)
- [Redeem Strategy Tradeoff](docs/25-redeem-strategy-tradeoff.md)
- [Code Review Handoff](docs/26-code-review-handoff.md)
- [Project Evolution Log](docs/15-project-evolution-log.md)
- [Final Submission Checklist](docs/19-final-submission-checklist.md)

### 官方参考

- Sui Overflow 2026 handbook: <https://mystenlabs.notion.site/overflow-2026-handbook>
- DeepBook Predict problem statement: <https://mystenlabs.notion.site/deepbook-predict-problem-statement>
- DeepBook Predict docs: <https://docs.sui.io/onchain-finance/deepbook-predict/>
- DeepBook Predict contract information: <https://docs.sui.io/onchain-finance/deepbook-predict/contract-information>
- DeepBook Predict source branch: <https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict>

DeepBook Predict 仍是 testnet integration surface。Package IDs、object IDs、object layouts 和 entrypoints 在 mainnet 前都可能变化。
