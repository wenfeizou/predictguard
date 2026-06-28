# PredictGuard

## English

**PredictGuard is RiskOps for prediction-market liquidity.**

It started as a DeepBook Predict risk and hedge lifecycle workflow for PLPs,
LPs, and vault builders. The product direction is broader: help prediction
market and structured DeFi teams inspect exposure, stress tail scenarios,
simulate hedges, and produce evidence-backed risk reports.

It is not a generic prediction market dashboard and it is not a black-box
trading bot. PredictGuard helps a liquidity provider understand tail risk,
choose a hedge, execute a wallet-confirmed Predict position, read the manager
state back from Sui, discover redeem evidence, and explain whether the hedge
lifecycle improved risk.

### Competition Summary

PredictGuard targets the **DeepBook Predict** track. The project combines protocol integration, risk analysis, wallet execution, manager inventory readback, settlement evidence, and exportable reports.

Current status:

- Judge-demo / competition MVP: final submission-ready.
- DeepBook Predict lifecycle extension: about `98%` complete.
- Commercial production product: about `55-65%` complete.

Final submission assets prepared outside this repository:

- about 4-minute demo video with English voiceover and sentence-level captions
- PDF demo deck
- live mint evidence notes and screenshots

Submission links:

- Website: <https://predictguard.xyz>
- Demo video: <https://youtu.be/uWlxX22DnEQ>
- Demo deck: [docs/submission/predictguard-demo-deck.pdf](docs/submission/predictguard-demo-deck.pdf)
- DeepSurge: <https://www.deepsurge.xyz/projects/6286f8e9-e868-4cdc-87c4-3ea27a08a582>

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

Latest final-demo evidence, captured on 2026-06-19 with Slush wallet on Sui
testnet:

- Owner wallet: `0xbecd4d29007221dea8e2e9c533c6255259226509bda18ca65c1e0d537d3cce0d`
- Manager: `0x6ad31bd894103c4087920d460b3d4360f40bb96175012b405b69cec0fc1ce43f`
- Transaction digest: `61A8wjnTkdjxTsonobvDzmQcnQ5eXwF2hTKZ9V7JT6Sx`
- Mint result: `YES 62,543`
- Quantity: `1 dUSDC`
- Actual cost: `0.044707 dUSDC`
- Ask price: `0.044707452`
- Manager remaining dUSDC after readback: `1.955293 dUSDC`
- Lifecycle status: active hedge coverage, not redeem-ready

Earlier development evidence:

- Predict object: `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a`
- Redeem digest for `YES 63,317`: `FxhZD6PLrPKDhgsiJAXZBvoTrMVS6YhWVZC7D5drvhps`
- Redeem digest for `YES 62,151`: `57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5`

SuiVision links:

- <https://testnet.suivision.xyz/txblock/61A8wjnTkdjxTsonobvDzmQcnQ5eXwF2hTKZ9V7JT6Sx>
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

PredictGuard's commercial wedge is risk reporting and monitoring for
prediction-market liquidity. DeepBook Predict is the first adapter and proof
point.

A commercial PredictGuard could become the risk layer for prediction-market
capital allocators:

- Full historical indexer for all manager mints, redeems, supplies, withdrawals, and PLP changes.
- Multi-manager and multi-account portfolio view.
- Production settlement accounting with claimed/unclaimed reconciliation.
- PLP risk alerts for utilization, tail exposure, stale oracles, and abnormal volatility surface changes.
- Vault-builder dashboard for strategy reporting and allocation decisions.
- Automated hedge policy engine with approval controls.
- Keeper integration for monitoring and redeem automation.
- Team and institutional reporting workflows.
- Adapter architecture for additional prediction-market or options-like venues.

First product packages:

- Free: single wallet demo, sample risk report, limited scenario set.
- Pro: saved reports, multi-manager tracking, alert rules, and advanced scenarios.
- Team: shared vault dashboard, branded reports, API access, and monitoring.
- Enterprise / ecosystem: custom adapters, integrations, and managed risk dashboards.

### Product Pages

The post-hackathon product now has multiple commercial surfaces:

- `/` - live dashboard, wallet workflow, monitoring rules, lifecycle queue, exports
- `/report/sample` - wallet-free sample commercial risk report
- `/reports` - locally saved snapshot history and snapshot comparison
- `/monitoring` - monitoring rule library and policy presets
- `/portfolio` - multi-manager and adapter workspace preview
- `/adapters` - adapter strategy for DeepBook Predict and future venues
- `/copilot` - AI risk copilot guardrails
- `/pricing` - Free / Pro / Team / Enterprise packaging draft

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

### Production Docker Deployment

The live deployment at <https://predictguard.xyz> runs the Next.js standalone
server in Docker behind an existing nginx reverse proxy.

Build and run on a Docker host:

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml up -d --build
```

The compose file expects an external Docker network named `app` so the existing
nginx container can proxy to `http://predictguard:3000`.

Reference nginx behavior:

- `https://predictguard.xyz` serves the app.
- `https://www.predictguard.xyz` permanently redirects to the apex domain.
- HTTP requests redirect to HTTPS, while `/.well-known/acme-challenge/` remains
  available for certbot webroot renewal.

### Judge Demo Path

Recommended 4-5 minute path:

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
- [Commercialization Upgrade Plan](docs/27-commercialization-upgrade-plan.md)
- [Sample Risk Report](docs/28-sample-risk-report.md)
- [Next Commercialization Backlog](docs/29-next-commercialization-backlog.md)
- [Commercial Product Design Principles](docs/30-commercial-product-design-principles.md)
- [Commercialization Progress Report](docs/31-commercialization-progress-2026-06-28.md)
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

- 评审演示 / 比赛 MVP：已准备为最终提交版本。
- DeepBook Predict 生命周期扩展：约 `98%` 完成。
- 商业级生产产品：约 `55-65%` 完成。

最终提交材料已在本仓库外的比赛材料目录准备：

- 约 4 分钟 demo 视频，包含英文旁白和句级字幕
- PDF demo deck
- 真实 mint 证据记录和截图

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

最终演示使用的最新证据，2026-06-19 通过 Slush 钱包在 Sui testnet 捕获：

- Owner wallet: `0xbecd4d29007221dea8e2e9c533c6255259226509bda18ca65c1e0d537d3cce0d`
- Manager: `0x6ad31bd894103c4087920d460b3d4360f40bb96175012b405b69cec0fc1ce43f`
- Transaction digest: `61A8wjnTkdjxTsonobvDzmQcnQ5eXwF2hTKZ9V7JT6Sx`
- Mint result: `YES 62,543`
- Quantity: `1 dUSDC`
- Actual cost: `0.044707 dUSDC`
- Ask price: `0.044707452`
- Manager readback remaining dUSDC: `1.955293 dUSDC`
- Lifecycle status: active hedge coverage, not redeem-ready

开发过程中还验证过的历史证据：

- Predict object: `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a`
- `YES 63,317` redeem digest: `FxhZD6PLrPKDhgsiJAXZBvoTrMVS6YhWVZC7D5drvhps`
- `YES 62,151` redeem digest: `57uSyj5qZNpeQwNWrjzuFh7Dwhc7u3atfmi1bjSfata5`

SuiVision 链接：

- <https://testnet.suivision.xyz/txblock/61A8wjnTkdjxTsonobvDzmQcnQ5eXwF2hTKZ9V7JT6Sx>
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

### 生产 Docker 部署

线上站点 <https://predictguard.xyz> 使用 Docker 运行 Next.js standalone
server，并由现有 nginx 容器做反向代理。

在 Docker 服务器上构建和启动：

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml up -d --build
```

`docker-compose.prod.yml` 默认使用名为 `app` 的外部 Docker network，方便现有
nginx 容器反代到 `http://predictguard:3000`。

参考 nginx 行为：

- `https://predictguard.xyz` 访问应用。
- `https://www.predictguard.xyz` 永久跳转到裸域。
- HTTP 请求跳转到 HTTPS，但 `/.well-known/acme-challenge/` 保持可访问，用于
  certbot webroot 续签。

### 评审演示路径

建议 4-5 分钟演示路径：

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
