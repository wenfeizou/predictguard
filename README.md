# PredictGuard

**PredictGuard: The Risk Layer for DeepBook Predict**

PredictGuard is a DeepBook Predict project for the Sui hackathon. It helps PLP providers, vault builders, and strategy developers understand Predict exposure, simulate tail events, and convert volatility-surface risk into hedge recommendations and PTB previews.

## Why This Project

DeepBook Predict creates new primitives: rolling expiries, binary positions, vol-surface pricing, dUSDC settlement, and PLP liquidity. But serious liquidity providers and vault builders still need a risk layer before they can allocate capital with confidence.

PredictGuard answers:

- Where is PLP risk concentrated?
- How much can PLP lose under a tail move?
- Which strike and expiry create the largest payout liability?
- Does the current volatility surface imply abnormal short-term risk?
- What hedge reduces downside without destroying premium income?
- What PTB would implement that hedge?

## MVP

The MVP is not a full vault and not a trading bot. It is a risk workflow:

```text
Observe exposure
  -> interpret surface risk
  -> run stress scenarios
  -> receive AI hedge recommendation
  -> preview hedge PTB
  -> export risk report
```

Must build:

- PLP risk dashboard
- strike x expiry exposure heatmap
- volatility surface or IV heatmap
- stress scenario simulator
- AI hedge recommendation
- human-readable PTB preview
- exportable risk report

Stretch:

- real DeepBook Predict testnet data
- real testnet hedge mint
- strategy backtest
- external vol comparison

## Local Development

Requirements:

- Node.js 24+
- Bun 1.3+
- A Sui wallet browser extension for wallet readiness testing

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

The current MVP path uses deterministic simulated market data and does not require a wallet, live testnet data, or an AI API key.

The app also includes a non-blocking DeepBook Predict testnet adapter at `/api/predict/status`. If the public Predict server is reachable, the UI enters `mixed-live-and-simulated` mode: live status, vault summary, protocol state, and oracle context are shown while PLP exposure and scenario calculations remain deterministic until live exposure reconstruction is implemented.

The PTB panel now uses a typed Sui `Transaction` builder preview in `src/lib/ptb/hedgeTransaction.ts`. It can show wallet readiness, the Predict mint target, live oracle candidate, missing wallet/manager/coin inputs, scaled strike, and an SDK transaction skeleton. Wallet state comes from `@mysten/dapp-kit-react` with gRPC clients. The preview is aligned with the `predict-testnet-4-16` flow: deposit dUSDC into `PredictManager`, construct `MarketKey`, then call `predict::mint<dUSDC>`. The wallet execution control stays blocked while inputs are missing and hands the `Transaction` instance to the connected wallet once readiness reaches `ready-to-sign`.

Project-specific agent rules live in `AGENTS.md`. Sui agent skills are vendored under `.agents/skills` with `skills-lock.json` for reproducible project-level context.

## Documents

Read in this order:

0. [Handoff Checklist](docs/00-handoff-checklist.md)
1. [Product Brief](docs/01-product-brief.md)
2. [Track Alignment](docs/02-track-alignment.md)
3. [MVP Scope](docs/03-mvp-scope.md)
4. [System Architecture](docs/04-system-architecture.md)
5. [Data and Simulation Model](docs/05-data-and-simulation-model.md)
6. [AI Hedge Copilot](docs/06-ai-hedge-copilot.md)
7. [PTB and DeepBook Integration](docs/07-ptb-and-deepbook-integration.md)
8. [UI and Demo Flow](docs/08-ui-and-demo-flow.md)
9. [Three-Week Build Plan](docs/09-three-week-build-plan.md)
10. [Risks, Assumptions, and Open Questions](docs/10-risks-assumptions-open-questions.md)
11. [Official Track Requirements](docs/11-official-track-requirements.md)
12. [MVP Implementation Spec](docs/12-mvp-implementation-spec.md)
13. [Naming Conventions](docs/13-naming-conventions.md)
14. [Commercial Analysis](docs/14-commercial-analysis.md)
15. [Project Evolution Log](docs/15-project-evolution-log.md)

## Current Official References

- Sui Overflow 2026 handbook: <https://mystenlabs.notion.site/overflow-2026-handbook>
- DeepBook Predict problem statement: <https://mystenlabs.notion.site/deepbook-predict-problem-statement>
- DeepBook Predict docs: <https://docs.sui.io/onchain-finance/deepbook-predict/>
- DeepBook Predict contract information: <https://docs.sui.io/onchain-finance/deepbook-predict/contract-information>
- DeepBook Predict code branch: <https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict>
- DeepBook v3 docs: <https://docs.sui.io/onchain-finance/deepbookv3/deepbook>
- DeepBook margin docs: <https://docs.sui.io/onchain-finance/deepbook-margin>

Important: official docs state that object IDs, package IDs, and entrypoints may change before mainnet. Treat all chain integration details as versioned dependencies.
