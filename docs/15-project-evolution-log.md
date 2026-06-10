# Project Evolution Log

This document records PredictGuard's development narrative, completed rounds,
key concept explanations, technical decisions, and next steps. Keep updating it
after each meaningful planning or implementation round so the project history is
understandable without rereading the chat.

## Current Status Snapshot

As of the latest implementation round, PredictGuard is roughly 60-63% complete
against the final hackathon target. The main technical risk dropped after a
successful wallet-signed DeepBook Predict testnet mint probe, but product depth
still needs position readback, quote-aware sizing, and demo/report polish.

Completed:

- Product positioning and track alignment
- Planning and commercial analysis docs
- Simulation-first risk dashboard
- Live DeepBook Predict public server adapter
- Normalized live testnet context
- Project-level Sui skills and agent rules
- Typed PTB readiness preview
- PTB builder aligned with the official `predict-testnet-4-16` `predict::mint`
  signature
- Sui wallet connection through dApp Kit
- Connected-account dUSDC coin detection
- Connected-account `PredictManager` discovery through the Predict testnet
  server
- Signable PTB execution control through dApp Kit when readiness reaches
  `ready-to-sign`
- Connected-account `PredictManager` creation
- Wallet-signed DeepBook Predict mint probe
- Verified successful transaction digest:
  `2N7TpuBGod9sebHQBpQT5YtSKujWZqFLpf9HcR5hLGag`
- Project concept glossary

Still missing before the 70% milestone:

- dUSDC faucet/acquisition guidance when the user has no coin object
- post-mint position and manager readback
- transaction evidence linked into the risk report

Still missing before the 75%+ competitive target:

- quote-aware hedge sizing instead of fixed probe sizing
- richer PLP/LP risk metrics
- lightweight scenario comparison, backtest, or stress-test depth
- Final UI polish, video, and submission package

## Development Rounds Completed

### Round 0: Initial Planning Docs

Commit: `a314f37 Add PredictGuard project planning docs`

Outcome:

- Created the original project planning documentation set.
- Established PredictGuard as a DeepBook Predict-native PLP risk workflow, not a
  generic prediction market dashboard.

Key idea:

PredictGuard should help liquidity providers and vault builders understand
where PLP risk is concentrated, how tail scenarios affect vault economics, and
what hedge PTB could reduce downside.

### Round 1: Official Track And MVP Specs

Commit: `e5a481c docs: add official track and mvp implementation specs`

Outcome:

- Added official track requirement analysis.
- Added MVP implementation specification.
- Recorded the official Sui Overflow 2026 handbook and DeepBook Predict problem
  statement links.

Key decision:

The MVP must remain simulation-first, but it needs a credible DeepBook Predict
testnet integration path. A static dashboard is not enough for this track.

### Round 2: Simulation-First MVP

Commit: `62e6597 feat: scaffold simulation-first PredictGuard MVP`

Outcome:

- Built the first usable frontend MVP.
- Added deterministic market seed data.
- Added PLP exposure matrix, scenario simulator, hedge recommendation logic,
  PTB preview, and Markdown risk report export.

Key concept:

The hedge recommendation is a risk-reduction heuristic, not a BTC price
prediction. It compares tail loss reduction versus hedge cost.

### Round 3: Handbook Fit And Commercial Analysis

Commit: `14dc00d docs: add handbook fit and commercial analysis`

Outcome:

- Added Sui Overflow handbook fit analysis.
- Added commercial value, user market, risks, monetization, and tracking
  metrics.

Commercial thesis:

PredictGuard has medium-high commercial potential if DeepBook Predict grows real
volume and PLP TVL. Its strongest user segment is professional DeFi liquidity
providers, vault builders, market makers, and DeepBook ecosystem teams.

### Round 4: Predict Testnet Status Adapter

Commit: `7146e56 feat: add Predict testnet status adapter`

Outcome:

- Added `/api/predict/status`.
- Connected to the public DeepBook Predict server.
- Fetched server health, vault summary, oracle list, and protocol state.

Key concept:

This created `mixed-live-and-simulated` mode: live Predict context plus
deterministic simulated exposure.

### Round 5: Normalized Live Predict Context

Commit: `ec50fbe feat: normalize live Predict context`

Outcome:

- Normalized live testnet data into UI/report-friendly fields.
- Displayed live vault value, utilization, max payout, active oracles, and
  latest active oracle.

Key decision:

Risk calculations still use deterministic exposure until live exposure
reconstruction is implemented. The UI must be explicit about this mixed mode.

### Round 6: Official Package ID Alignment

Commit: `cce12b1 chore: align Predict testnet package config`

Outcome:

- Rechecked Sui official DeepBook Predict Contract Information docs.
- Updated the default package ID to:
  `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138`
- Added the official Contract Information link to README/docs.

Key decision:

DeepBook Predict testnet IDs are provisional dependencies. Always verify them
late before transaction execution work.

### Round 7: Sui Agent Skills

Commit: `b481783 chore: add Sui agent skills`

Outcome:

- Installed official Sui agent skills from `MystenLabs/skills` using `bunx`.
- Committed `.agents/skills` and `skills-lock.json` as project-level context.

Relevant skills:

- `ptbs`
- `sui-sdks`
- `frontend-apps`
- `accessing-data`
- `sui-client`
- `sui-object-model`

Concept: `evals.json`

`evals.json` files are skill evaluation fixtures. They contain prompts,
reference sources, expected outputs, and checklist expectations used to test
whether an agent applies a skill correctly. They are not PredictGuard runtime
dependencies.

### Round 8: Project-Level Agent Rules And PTB Readiness

Commit: `5020b94 feat: add Predict hedge PTB readiness`

Outcome:

- Added project-level `AGENTS.md`.
- Added `src/lib/ptb/hedgeTransaction.ts`.
- Added structured PTB readiness state.
- Added page UI for readiness status, missing inputs, guardrails, target, and
  object IDs.

Important convention:

The project-level `AGENTS.md` does not duplicate global collaboration rules. It
only records PredictGuard-specific Sui, DeepBook, Tailwind, and verification
rules.

Readiness concept:

PTB readiness means the UI explicitly shows whether a transaction can be built
or signed. It checks for required inputs such as hedge recommendation,
`PredictManager`, `OracleSVI`, oracle expiry, dUSDC coin object, and wallet
state. Missing inputs are shown instead of pretending execution is ready.

### Round 9: Official `predict::mint` Signature Alignment

Commit: `232ac40 feat: align Predict mint PTB signature`

Outcome:

- Read official `predict.move`, `predict_manager.move`, `oracle.move`, and
  `market_key.move` from the `predict-testnet-4-16` branch.
- Found that the initial PTB skeleton assumption was wrong.
- Corrected the builder to match the actual protocol flow.

Verified official signature:

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

Correct PTB flow:

```text
predict_manager::deposit<dUSDC>
  -> market_key::new
  -> predict::mint<dUSDC>
```

Key correction:

`predict::mint` does not take a dUSDC coin object or max-cost argument directly.
It withdraws cost from the user's `PredictManager` balance. Therefore, the PTB
preview must deposit dUSDC into the manager first, then construct `MarketKey`,
then mint.

## Concept Explanations Captured

### PLP

PLP is the DeepBook Predict liquidity provider share token. LPs supply accepted
quote assets such as dUSDC into the shared vault and receive PLP shares. PLP is
a claim on vault value, but it bears payout and tail-risk exposure from minted
positions.

Official docs do provide PLP and `predict::supply`.

### Oracle / OracleSVI

In DeepBook Predict, an oracle is not just a price feed. `OracleSVI` is a market
state object for an underlying and expiry. It tracks:

- underlying asset
- expiry timestamp
- spot and forward prices
- SVI volatility surface parameters
- lifecycle status
- settlement price after expiry

Predict pricing and outcome logic depend on this oracle state.

### MarketKey

`MarketKey` identifies a binary position:

- oracle ID
- expiry
- strike
- direction: UP or DOWN

`predict::mint` receives a `MarketKey`, not raw side/strike/expiry fields.

### PTB

A Sui Programmable Transaction Block is the transaction itself. It can compose
multiple commands atomically. PredictGuard's intended hedge mint PTB composes:

- a manager deposit
- a key construction call
- a mint call

### dUSDC

dUSDC is the current DeepBook Predict testnet quote asset. It is not official
USDC. It must be treated as a testnet asset.

### `mixed-live-and-simulated`

This mode means live Predict testnet status, vault, and oracle context are used
for display and report context, while exposure/risk calculations still use
deterministic simulated data.

## Competitive Assessment Notes

Earlier comparison against 50 DeepBook ideas concluded:

- Highest completion-probability idea: `021 Settled-Redeem Keeper`
- Highest upside/commercial ideas include PLP vaults, margin loops, range ladder
  vaults, vol-arb, and SDK/infrastructure ideas
- PredictGuard's strongest final positioning is a PLP Risk + Hedge Execution
  Layer, combining analytics, simulation, and transaction preparation

Current estimated completion:

- Before PTB signature alignment: about 25%
- After official signature alignment: about 30-32%
- After wallet connection plus user dUSDC/manager detection: about 38-40%
- After wallet-gated PTB signing control: about 45-48%
- After successful live mint probe: about 60-63%

Milestone estimates:

- 55%: wallet connection, user object readiness, dUSDC/manager detection, and a
  signable transaction preview
- 60-65%: at least one real testnet transaction digest and `PositionMinted`
  evidence
- 70-75%: position readback, quote-aware sizing, and report/demo integration
- 75-90%: polished demo flow, video, submission assets, and robust UX

## Roadmap To 55%

### Round A: Official Entry Point Alignment

Status: completed.

Commit: `232ac40 feat: align Predict mint PTB signature`

### Round B: Wallet Connection

Goal:

- Connect Sui testnet wallet.
- Show connected address and network readiness.
- Block execution on wrong network.

Acceptance:

- Readiness shows wallet missing when disconnected.
- Readiness improves after connecting a testnet wallet.

Current partial progress:

- `src/lib/ptb/hedgeTransaction.ts` now accepts wallet readiness input:
  connected state, wallet address, and network name.
- The PTB readiness model now lists `Sui wallet connection` and `Sui testnet
  network` as explicit missing inputs.
- The PTB page shows a Wallet Readiness panel, currently disconnected by design.
- `@mysten/dapp-kit-react` and `@tanstack/react-query` are installed.
- The app is wrapped with `createDAppKit` + `DAppKitProvider`.
- The PTB page reads real connected account and current network through dApp Kit.
- The wallet panel renders the official `ConnectButton`.
- Wallet hooks and `ConnectButton` are isolated in a dynamic client-only component
  to avoid Next.js prerender failures.

Build note:

- `next build` passes. dApp Kit still prints a non-fatal prerender warning:
  `Skipping wallet initializer: "ReferenceError: document is not defined"`.
  This is from wallet detection in a server build context and does not fail the
  build. If it becomes noisy or problematic, further lazy-load the provider.

Next implementation step:

- Query the connected account for dUSDC coin candidates and `PredictManager`
  objects, then feed real object IDs into the PTB plan.

### Round C: User Object And dUSDC Detection

Status: completed.

Commit: current round commit `feat: add Predict account readiness checks`

Goal:

- Query user owned objects / coins.
- Detect dUSDC coin candidates.
- Detect or guide creation/loading of `PredictManager`.

Acceptance:

- UI shows dUSDC balance / selected coin object.
- UI shows `PredictManager` found or missing.
- PTB skeleton uses real object IDs when available.

Implementation outcome:

- Added `/api/predict/manager` to query the public Predict testnet server's
  `/managers` endpoint and select the latest manager for a connected owner.
- Added connected-account dUSDC lookup through the Sui gRPC Core client via
  `client.core.listCoins`.
- Selected the largest detected dUSDC coin as the default deposit candidate.
- Fed detected dUSDC coin ID, dUSDC balance, and `PredictManager` object ID into
  the PTB readiness model.
- Updated the wallet panel to show account readiness below the wallet connect
  button.

Important nuance:

`PredictManager` is treated as protocol account state and can be a shared object,
so plain owned-object lookup is not sufficient. PredictGuard currently uses the
Predict public server's indexed `/managers` view for discovery. dUSDC coin
objects are still owned by the user, so the Sui client coin query is appropriate
there.

Remaining gap:

If the user has no manager or no dUSDC, the UI can now identify the missing
state, but it does not yet provide a one-click manager creation or testnet dUSDC
acquisition flow.

### Round D: Signable Transaction Preparation

Status: completed.

Commit: current round commit `feat: add wallet-gated Predict PTB execution`

Goal:

- Combine hedge, live oracle, wallet, manager, and dUSDC coin into final PTB
  input.
- Show `Ready to sign` when all conditions are met.

Acceptance:

- `buildPredictHedgeTransactionPreview()` returns a `Transaction` when all
  required inputs are present.
- UI clearly blocks signing when any required input is missing.

Implementation outcome:

- Added `src/app/ptb-execute.tsx` as a client-only wallet execution component.
- It rebuilds the current Predict hedge `Transaction` from the same PTB input
  used by the readiness panel.
- It calls `dAppKit.signAndExecuteTransaction({ transaction })`, leaving gas
  selection and final confirmation to the user's wallet.
- It checks wallet failure responses, waits for transaction indexing through
  `client.core.waitForTransaction`, invalidates dUSDC/manager queries, and shows
  a SuiVision testnet digest link on success.
- The button remains disabled unless readiness reaches `ready-to-sign`.

Important nuance:

This round creates a signable path, but it does not prove the protocol call
succeeds on-chain. The next meaningful milestone is a real testnet attempt with
an actual connected wallet that has dUSDC and an existing `PredictManager`.

### Round E: Wallet Setup And PredictManager Creation

Status: completed.

Commit: current round commit `feat: add PredictManager creation readiness`

Goal:

- Get a browser wallet connected through Slush extension.
- Detect dUSDC and `PredictManager` for the connected account.
- Create a `PredictManager` from the app when missing.
- Fix manager lookup so the UI reflects newly indexed managers quickly.

Implementation outcome:

- Imported the local testnet key into Slush so the browser wallet controls the
  address with dUSDC.
- Added a temporary wallet diagnostics panel that appears when no account is
  connected or a detected wallet exposes zero accounts.
- Added a `Create PredictManager` button when the connected testnet wallet has
  dUSDC but no manager.
- The button calls the official public entry point:
  `predict::create_manager(ctx): ID`.
- Changed `/api/predict/manager` to dynamic, no-store fetching so it does not
  serve stale manager data after creation.
- Added short manager-query polling after manager creation.

Verified testnet evidence:

- Wallet address:
  `0x5e2a28ff382ab6858588dba9d5ed8e21fc59908c295ced2124f87b1cdb4cefb6`
- dUSDC coin:
  `0x54b1b826e57038cb0de56d1b5b1e5ed518d9b003052554a0688b05f90f5b7e26`
- Manager creation digest:
  `8FYwweyfCm42Ar6rhGYzp6bNMRCjpH4xuGipgh213zaT`
- Created `PredictManager`:
  `0x3cfb9e6c6f1102ef28d20e3beed73ac20bbe0e1451eeb86cecd28e52e3fc77e2`

Important nuance:

The `PredictManager` is created by `predict::create_manager`, while the lower
`predict_manager::new` function is `public(package)` and cannot be called
directly from the dApp.

Next implementation step:

- Attempt the actual hedge mint PTB with the connected wallet, dUSDC coin,
  manager, and live oracle. Capture either a success digest or the exact
  protocol/runtime error.

### Round F: Live Predict Mint Probe

Status: completed.

Commit: pending for this round.

Goal:

- Turn the previously signable PTB into a real testnet Predict mint that can
  pass protocol checks.
- Diagnose and fix the `assert_mintable_ask` abort observed during the first
  full-size hedge attempt.

Problem found:

- The first signed PTB reached `predict::mint`, but failed with Move abort code
  `7` in `predict::assert_mintable_ask`.
- This proved wallet connection, `PredictManager`, dUSDC deposit, and
  `MarketKey` construction were structurally valid, but the mint parameters
  were outside the live ask boundary.

Implementation outcome:

- Changed wallet execution from full simulated hedge sizing to a small live
  mint probe.
- Split the selected dUSDC coin before deposit, so only `2 dUSDC` is deposited
  into the manager instead of moving the whole selected coin.
- Mint quantity now defaults to `1 dUSDC` base unit scale for the live probe.
- Execution strike is selected from the latest reference price and aligned to
  the active oracle grid using the oracle's min strike and tick size.
- The wallet execution panel now shows deposit, quantity, execution strike,
  reference price, and oracle grid before signing.
- The SDK skeleton uses the same execution inputs as the real wallet
  transaction.

Verified testnet evidence:

- Successful mint transaction:
  `2N7TpuBGod9sebHQBpQT5YtSKujWZqFLpf9HcR5hLGag`
- Sui effects status: `success`
- Emitted event: `predict::PositionMinted`
- Wallet:
  `0x5e2a28ff382ab6858588dba9d5ed8e21fc59908c295ced2124f87b1cdb4cefb6`
- Manager:
  `0x3cfb9e6c6f1102ef28d20e3beed73ac20bbe0e1451eeb86cecd28e52e3fc77e2`
- Oracle used:
  `0x195833aeee071530d2bdcd2e03916b7458d57c81ed540b82d6e1cb594bdf41f2`
- Probe values:
  - deposit: `2 dUSDC`
  - quantity: `1 dUSDC`
  - execution strike: `63,187`
  - ask price: `232220614`
  - cost: `0.232220 dUSDC`

Important nuance:

The MVP now has a proven wallet-signed, on-chain DeepBook Predict mint path.
This is still a probe path, not final production hedge sizing. The next step is
to read back the manager/position state and graduate from fixed small probe
execution to quote-aware sizing.

Updated estimate:

- Project completion toward final competition target: about `62-65%`.

Next implementation step:

- Add post-mint position/readiness display by reading the manager or minted
  market position state after a successful transaction.

## Documentation Maintenance Rule

After each meaningful implementation or planning round:

1. Add the round to this file.
2. Record the commit hash if one was created.
3. Explain any new protocol concept in plain language.
4. Update the current percentage estimate when progress meaningfully changes.
5. Record the next concrete task.
