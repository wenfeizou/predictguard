# Concept Map CN/EN

This document reorganizes the main PredictGuard concepts into a bilingual
Chinese-English map. Use it before reading the full glossary in
`docs/16-concept-glossary.md`.

## How To Read

- `English`: the term used in code, UI, protocol docs, or judge-facing material.
- `Chinese`: the Chinese explanation used in this project.
- `Where`: where the concept appears in the product.
- `Why it matters`: why the user or judge should care.

## Product Positioning

| English | Chinese | Where | Why it matters |
| --- | --- | --- | --- |
| PredictGuard | PredictGuard，DeepBook Predict 风险管理工作流 | README, page title, demo script | The product is not a generic prediction market dashboard. It is a PLP risk and hedge workflow. |
| Risk Layer | 风险层 | README, pitch | Describes PredictGuard as infrastructure around DeepBook Predict risk, not a trading toy. |
| PLP | Predict Liquidity Provider，Predict 流动性提供者 | PLP Overview, pitch | Core user. PLPs earn premium but take tail payout risk. |
| LP | Liquidity Provider，流动性提供者 | README, pitch | Broader DeFi audience that understands capital allocation and risk. |
| Vault Builder | 金库/策略构建者 | README, commercial analysis | User who may build structured PLP products and needs risk reports. |
| Hedge Workflow | 对冲工作流 | Demo Flow, Hedge Recommendation | The app moves from diagnosis to recommendation to execution to readback. |
| Judge Demo | 评审演示 | README, docs/18 | The 5-minute story for competition judges. |

## DeepBook Predict Protocol

| English | Chinese | Where | Why it matters |
| --- | --- | --- | --- |
| DeepBook Predict | DeepBook Predict 协议模块 | README, Testnet panel, PTB | The official protocol surface PredictGuard integrates with. |
| Binary Market | 二元市场 | Scenario, Hedge, Manager readback | Market with YES/NO outcomes around a strike and expiry. |
| YES / NO | 是/否方向 | Hedge, Position, Manager readback | Product-facing side labels. YES maps to protocol UP; NO maps to DOWN. |
| UP / DOWN | 上/下方向 | MarketKey decoding | Protocol direction values: `UP = 0`, `DOWN = 1`. |
| dUSDC | 测试网美元稳定币 | Wallet readiness, PTB, Manager summary | Quote asset used for deposits, mint cost, and manager balances. |
| PLP Token | PLP 份额代币 | Docs, roadmap | Represents liquidity provider shares in the Predict vault. |
| PredictManager | Predict 用户管理对象 | Wallet readiness, Manager/account summary | On-chain manager storing user balances and positions. |
| BalanceManager | 余额管理器 | Manager readback docs | Inner DeepBook balance container inside PredictManager. |
| OracleSVI | SVI 预言机对象 | Testnet, PTB, Manager readback | Provides expiry, reference price, strike grid, and pricing curve context. |
| Oracle | 预言机 | Testnet, PTB | Source of market reference data and settlement state. |
| Live Oracle | 可用于 mint 的当前预言机 | Wallet execution | Required for new mint transactions. |
| Stale Oracle | 过期或陈旧预言机 | Wallet execution errors | Can cause `assert_live_oracle` aborts. |
| MarketKey | 市场键 | PTB, Manager readback | Canonical market identity: oracle, expiry, strike, direction. |
| RangeKey | 区间仓位键 | Docs/roadmap | Used by range positions; not central to current UI. |
| PositionMinted | 仓位铸造事件 | Wallet execution, report | Event proving what the chain accepted after mint. |
| PositionRedeemed | 仓位赎回事件 | Settlement feasibility, report | Needed for full settlement accounting and redeemed payout history. |

## Sui And Wallet Execution

| English | Chinese | Where | Why it matters |
| --- | --- | --- | --- |
| Sui Testnet | Sui 测试网 | Testnet panel, wallet readiness | Current network for DeepBook Predict integration. |
| Wallet Connection | 钱包连接 | Wallet readiness | Required before signing a real transaction. |
| Slush Wallet | Slush 钱包插件 | Manual testing | Browser wallet used to approve connection and transactions. |
| PTB | Programmable Transaction Block，可编程交易块 | PTB Preview | Sui transaction format combining multiple commands atomically. |
| Transaction Instance | Transaction 实例 | Wallet execution | The app passes a real SDK `Transaction` to the wallet. |
| signAndExecuteTransaction | 钱包签名并执行交易 | Wallet execution code | Wallet-owned approval path for the Predict mint. |
| SuiVision Digest | SuiVision 交易哈希链接 | Mint confirmed, report | External explorer proof that the testnet transaction happened. |
| Object ID | 对象 ID | Config, PTB, Manager readback | Identifies Predict, manager, oracle, and coin objects. |
| Package ID | 合约包 ID | Config, README | Identifies the DeepBook Predict Move package. |
| Shared Object | 共享对象 | Docs, protocol model | Predict protocol objects can be touched by many users. |
| Owned Object | 地址拥有对象 | Coin object, wallet | Wallet coin objects are owned before being used in PTBs. |
| Coin Object | Coin 对象 | Wallet readiness | dUSDC coin object is split and deposited during execution. |
| Dynamic Field | 动态字段 | Manager readback | Sui storage mechanism behind manager position tables. |
| Table Entry | 表项 | Manager readback | Positions are stored as `MarketKey -> quantity`. |

## Risk Model

| English | Chinese | Where | Why it matters |
| --- | --- | --- | --- |
| Risk Score | 风险评分 | PLP Overview, Demo Flow | Fast summary of simulated PLP risk. |
| TVL | Total Value Locked，总锁仓价值 | PLP Overview | Capital base for utilization and cost context. |
| Utilization | 资金利用率 | PLP Overview | Higher utilization can mean less buffer against payouts. |
| Max Payout Liability | 最大赔付责任 | PLP Overview, Exposure | Worst payout obligation if exposed markets pay out. |
| Worst Scenario PnL | 最差场景盈亏 | PLP Overview, Scenario | Shows downside under stress. |
| Exposure | 风险暴露 | Exposure Heatmap | Amount of PLP liability by strike and expiry. |
| Exposure Heatmap | 风险暴露热力图 | Exposure page section | Makes concentration visible. |
| Strike | 行权价/触发价格 | Exposure, Hedge, PTB | Price threshold for YES/NO payout. |
| Expiry | 到期时间 | Exposure, Hedge, Manager readback | Market settlement time. |
| Scenario | 压力场景 | Scenario Simulator | Hypothetical market move used for risk analysis. |
| Stress Test | 压力测试 | Scenario Simulator | Evaluates severe moves, volatility shocks, or near-expiry risk. |
| Tail Loss | 尾部亏损 | Hedge, report | Rare but severe loss PredictGuard tries to reduce. |
| Tail-Loss Reduction | 尾部亏损降低比例 | Scenario, Hedge | Shows how much downside improves with a hedge. |
| Unhedged PnL | 未对冲盈亏 | Scenario Simulator | Baseline result before hedge. |
| Hedged PnL | 对冲后盈亏 | Scenario Simulator | Result after applying recommended or executed hedge. |
| Executed Stress Comparison | 执行后压力测试对比 | Scenario Simulator, report | Compares unhedged, recommended, and actually executed hedge impact. |
| Worst-Case Improvement | 最差情形改善值 | Scenario Simulator, report | Difference between worst unhedged and worst executed result. |

## Hedge And Sizing

| English | Chinese | Where | Why it matters |
| --- | --- | --- | --- |
| Hedge | 对冲 | Hedge Recommendation | A position bought to reduce PLP downside. |
| Hedge Recommendation | 对冲建议 | Hedge section | Suggests side, strike, expiry, notional, and expected effect. |
| Notional | 名义本金/保护规模 | Hedge Recommendation | Target protection size. |
| Quantity | 仓位数量 | Wallet execution, Manager readback | Actual amount minted on-chain. |
| Estimated Cost | 预估成本 | PTB, report | Pre-signing expected cost. |
| Actual Cost | 实际成本 | Mint confirmed, report | Cost parsed from `PositionMinted`. |
| Ask Price | 卖价/买入价格 | Mint confirmed, quote-aware sizing | Per-unit cost used for mint pricing. |
| Bid Price | 买价/赎回价格 | Settlement docs | Used when redeeming a position. |
| Quote | 报价 | PTB, sizing | Price evidence for sizing. |
| Quote-Aware Sizing | 基于报价的仓位规模计算 | Wallet execution | Uses ask price and budget to estimate quantity. |
| Probe Mode | 探针模式 | Wallet execution | Fixed small mint when no quote evidence exists. |
| Max Hedge Budget | 最大对冲预算 | Wallet execution | User-selected budget cap for sizing. |
| Safety Buffer | 安全缓冲 | Wallet execution | Budget kept aside to avoid over-spending. |
| Budget Usage | 预算使用率 | Wallet execution, report | Actual or estimated cost divided by selected budget. |
| Cost / Protection | 保护成本比 | Wallet execution | Cost relative to recommended protection size. |
| Quote Source | 报价来源 | Wallet execution, report | Explains whether sizing uses last executed ask or no quote. |
| Quote Freshness | 报价新鲜度 | Wallet execution, report | Explains whether usable quote evidence exists. |
| Last Executed Ask | 最近一次执行得到的 ask price | Wallet execution | Real execution evidence, but not a guaranteed live quote. |

## Readback And Position State

| English | Chinese | Where | Why it matters |
| --- | --- | --- | --- |
| Readback | 链上读回 | Manager/account summary | Queries chain state after transaction. |
| Post-Mint Readback | mint 后读回 | Mint confirmed | Parses executed side, strike, quantity, cost, and digest. |
| Manager Inventory | Manager 持仓/余额库存 | Manager/account summary | Direct view of current manager state. |
| Position Entry | 仓位条目 | Manager readback | One table row: `MarketKey -> quantity`. |
| Decoded Position | 解码后的仓位 | Manager/account summary | Human-readable position such as `YES 63,187`. |
| Active Position | 活跃仓位 | Manager/account summary | Non-zero quantity and future expiry; counted as active coverage. |
| Expired Position | 已到期仓位 | Manager/account summary | Past expiry; not counted as current protection. |
| Zero Quantity Position | 零数量仓位 | Manager/account summary | Table key remains but quantity is zero. |
| Unknown Position | 未知状态仓位 | Manager/account summary | Not enough decoded data to classify safely. |
| Active Position Quantity | 活跃仓位数量 | Manager/account summary, report | Sum of active, non-expired hedge quantity. |
| Settlement-Aware Reconstruction | 考虑结算状态的仓位重建 | Manager/account summary | Classifies positions without claiming full settlement accounting. |
| Full Settlement Accounting | 完整结算核算 | Settlement feasibility doc | Future work: winning side, claimable, claimed, unclaimed amount. |
| Claimed / Unclaimed | 已领取/未领取 | Settlement roadmap | Needed after redeem history and settlement state are available. |
| Lifecycle Readiness | 生命周期准备状态 | Manager/account summary, report | Read-only state explaining whether a position is active, expired, zero, or needs redeem evidence. |
| Redeem Evidence | 赎回证据 | Report, lifecycle roadmap | Confirmed PositionRedeemed data used to prove payout and realized result. |
| Redeemability | 可赎回性 | Lifecycle roadmap | Stronger future claim that a position can safely be redeemed now. |

## Page Sections

| English | Chinese | Where | Why it matters |
| --- | --- | --- | --- |
| Demo Flow | 演示流程 | Top page section | Shows product status from risk to readback. |
| PLP Overview | PLP 总览 | Overview | Shows TVL, utilization, risk score, and core metrics. |
| DeepBook Predict Testnet | DeepBook Predict 测试网状态 | Testnet | Shows live/mixed protocol context. |
| Exposure Breakdown | 风险暴露拆解 | Exposure | Lists largest risk cells. |
| Volatility Surface | 波动率曲面 | Vol Surface | Current UI uses IV heatmap plus selected expiry curve. |
| IV Heatmap | 隐含波动率热力图 | Vol Surface | 2D view of strike/expiry volatility. |
| Scenario Simulator | 场景模拟器 | Simulator | Selects market stress scenario. |
| Recommended Action | 推荐动作 | Overview | Condensed hedge suggestion. |
| Tradeoffs | 取舍说明 | Hedge | Explains hedge cost and limitations. |
| PTB Preview | PTB 预览 | PTB | Shows readiness, transaction skeleton, and execution controls. |
| Wallet Readiness | 钱包准备状态 | PTB | Checks wallet, testnet, dUSDC, manager. |
| Execution Readiness | 执行准备状态 | PTB | Shows whether a signable PTB can be built. |
| Wallet Execution | 钱包执行 | PTB | Sign button, budget, quote evidence, and mint result. |
| Execution-Adjusted Risk | 执行后校正风险 | PTB | Compares recommendation with actual executed quantity/cost. |
| Manager/account Summary | Manager/账户摘要 | PTB | Shows direct manager inventory and decoded positions. |
| Lifecycle / Redeem Readiness | 生命周期/赎回准备状态 | Manager/account summary | Explains post-expiry follow-up without enabling unsafe redeem actions. |
| Sui SDK Transaction | Sui SDK 交易代码 | PTB | Human-readable transaction skeleton. |
| Risk Report | 风险报告 | Report | Exportable Markdown evidence for the demo. |

## Reports And Submission

| English | Chinese | Where | Why it matters |
| --- | --- | --- | --- |
| Markdown Risk Report | Markdown 风险报告 | Report | Exported artifact tying together risk, execution, and readback. |
| Workflow Status | 工作流状态 | Report | Shows completion of risk, hedge, execution, and readback. |
| Sizing Evidence | 仓位规模计算依据 | Report | Documents quote source and sizing mode. |
| Judge-Facing Story | 面向评委的叙事 | README, docs/18 | Makes protocol depth understandable in 5 minutes. |
| Final Submission Checklist | 最终提交清单 | docs/19 | Tracks screenshots, video, checks, and official ID verification. |
| Official Contract Verification | 官方合约信息复核 | README, docs/19 | Necessary because DeepBook Predict testnet IDs may change. |
| Fallback Demo Path | 备用演示路径 | docs/18 | Keeps demo viable if testnet or wallet is unavailable. |

## Technology Stack

| English | Chinese | Where | Why it matters |
| --- | --- | --- | --- |
| Next.js | React 全栈框架 | App runtime | Provides app routing and build system. |
| React | 前端 UI 框架 | App components | Used for interactive dashboard panels. |
| TypeScript | 类型化 JavaScript | Source code | Keeps protocol data and UI props safer. |
| Tailwind CSS v4 | Tailwind CSS 第 4 版 | Styling | Project rule: Tailwind utilities only, no custom/native CSS. |
| Bun | JS runtime/package manager | Local development | Used for install, dev, lint, typecheck, build. |
| @mysten/dapp-kit-react | Sui dApp 钱包库 | Wallet integration | Connects wallet and signs transactions. |
| @mysten/sui | Sui TypeScript SDK | PTB and gRPC reads | Builds transactions and reads Sui state. |
| Sui gRPC | Sui gRPC 数据接口 | Manager readback | Preferred live read path; JSON-RPC is avoided for new code. |
| Recharts | 图表库 | Charts | Renders bar/line charts. |
| lucide-react | 图标库 | UI buttons/panels | Provides consistent icons. |

## Current Completion Meaning

| English | Chinese | Meaning |
| --- | --- | --- |
| 95% MVP/Judge Demo Complete | MVP/评审演示约 95% 完成 | Core product loop is implemented and explainable. |
| Not Production Complete | 不是生产级 100% | Still lacks final settlement accounting, full live exposure reconstruction, and final submission assets. |
| Remaining 5% | 剩余 5% | Official contract re-check, final validation, screenshots, video, submission text. |
