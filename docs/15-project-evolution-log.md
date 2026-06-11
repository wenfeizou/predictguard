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

## Next Priority Plan

Recorded before starting the next implementation round.

Recommended priority order:

1. **Post-mint position and manager readback.**
   After a wallet-signed mint, the page should show what the user actually
   bought: digest, minted position, strike, expiry, direction, quantity, cost,
   and manager evidence.
2. **Risk report binding.**
   The risk report should connect the simulated recommendation with the actual
   on-chain transaction result.
3. **Quote-aware sizing.**
   Replace the fixed small probe with sizing based on live ask/cost, max user
   budget, and expected risk reduction.
4. **Demo flow polish.**
   Make the story easy to follow: risk diagnosis, hedge recommendation, wallet
   execution, position confirmation, and risk report.

Current round selected:

- Round G: post-mint readback through transaction event parsing and execution
  result display.

### Round G: Post-Mint Execution Readback

Status: completed.

Commit: pending for this round.

Goal:

- Turn the wallet mint result from a plain digest link into a readable execution
  summary.
- Start binding the live chain result into the risk report.

Implementation outcome:

- Added `src/lib/predict/execution.ts` to normalize Sui transaction data into a
  `PredictMintExecutionSummary`.
- After `signAndExecuteTransaction`, the wallet execution component now waits
  for the transaction with events, effects, and balance changes included.
- The component parses the `predict::PositionMinted` event and displays:
  - side
  - strike
  - quantity
  - actual cost
  - ask price
  - dUSDC wallet balance change
  - expiry
  - manager object
  - SuiVision digest link
- The parsed execution summary is lifted into the page state.
- The Markdown risk report now includes an `On-Chain Execution` section when a
  mint has been executed in the browser session.

Concept explanation:

Post-mint readback means the app does not stop at "transaction submitted." It
reads the confirmed transaction and explains what position was minted. This is
the first product-loop step from wallet execution toward "did my risk actually
change?"

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`
- Browser verification confirmed the `Mint confirmed` panel and risk report
  `On-Chain Execution` section with digest:
  `C5GGJd33UhraMqUt3VWQk3XxHwdYFXVPXjAyC9JGXz7N`
- Verified parsed execution values:
  - position: `YES 63,187`
  - quantity: `1 dUSDC`
  - actual cost: `0.244788 dUSDC`
  - ask price: `0.244788469`
  - dUSDC wallet change: `-2 dUSDC`

Remaining gap:

This round reads the transaction event and wallet balance changes. It does not
yet reconstruct all open positions directly from manager dynamic fields or
Predict server indexes. Full manager/position inventory remains a later depth
task.

Next implementation step:

- Add a persistent execution evidence panel or report state so the latest known
  verified digest can be shown even after page refresh, then move to
  quote-aware sizing.

### Round H: Quote-Aware Sizing V1

Status: completed.

Goal:

- Replace the purely fixed `1 dUSDC` probe plan with a conservative sizing plan
  that can use a known ask price and max budget.

Implementation outcome so far:

- Added `quoteAskPrice` and `maxHedgeBudgetDusdc` inputs to the PTB plan.
- The latest successful mint ask price can feed the next execution plan.
- The plan now records:
  - sizing mode: `probe` or `quote-aware`
  - max budget
  - estimated execution cost
  - budget usage
  - cost-to-protection ratio
- If no quote is available, execution stays in safe `probe` mode.
- If a quote is available, execution uses budget-aware quantity sizing with a
  conservative buffer instead of spending the full budget.
- The wallet execution panel and SDK preview show the sizing mode and estimated
  execution cost.
- Browser verification confirmed a second wallet-signed mint in `quote-aware`
  mode:
  - max budget: `2 dUSDC`
  - planned estimated cost: `1.75 dUSDC`
  - planned budget usage: `87.5%`
  - minted position: `YES 63,187`
  - minted quantity: `7.31435 dUSDC`
  - actual cost: `1.782642 dUSDC`
  - resulting ask price: `0.243718479`

Important nuance:

This is quote-aware sizing v1, not a full live order book quote system. It uses
the most recent successful mint ask price as a practical estimate. The next
deeper version should query live market pricing directly when the Predict API or
contract read path exposes it reliably.

Concept explanation added after verification:

Quote-aware sizing means choosing the mint quantity from price and budget:

```text
available budget = max budget - safety buffer
quantity = available budget / ask price
```

The second `Sign PTB` proved that the calculation affected real chain execution:
the first probe minted `1 dUSDC`, while the quote-aware transaction minted
`7.31435 dUSDC`.

The planned numbers shown after the transaction can differ from the confirmed
mint numbers because the app updates the plan with the latest executed ask
price. In the verified case:

- confirmed mint quantity: `7.31435 dUSDC`
- confirmed actual cost: `1.782642 dUSDC`
- new ask price after execution: `0.243718479`
- next displayed planned quantity: `7.180415 dUSDC`

`Deposit` is also different from `actual cost`: the PTB deposited `2 dUSDC`
into `PredictManager`, while the mint consumed `1.782642 dUSDC`. The difference
is expected to remain as manager-side available balance, subject to protocol
accounting.

Next implementation step:

- Persist the latest execution digest and sizing evidence across refreshes, then
  expose the max hedge budget as a user-editable control.

### Round I: Persistent Execution Evidence And Budget Control

Status: completed.

Goal:

- Keep the latest verified mint evidence available after page refresh.
- Let the user edit the max hedge budget instead of relying on a hard-coded
  `2 dUSDC` value.

Implementation outcome:

- Added localStorage helpers for `PredictMintExecutionSummary`.
- The app now initializes the latest mint execution evidence from localStorage.
- Successful mints update both page state and localStorage.
- The risk report can include the latest stored execution evidence after a
  refresh.
- Added max hedge budget controls in the wallet execution panel:
  - preset buttons: `1`, `2`, `5`, `10`
  - numeric input with `0.5` dUSDC step
- The selected budget feeds the PTB plan and quote-aware sizing calculation.
- Readiness now checks both required deposit amount and selected max budget
  against the connected wallet's dUSDC balance.

Concept explanation:

Persistent execution evidence makes the demo more stable: a verified digest,
position, cost, and ask price survive refreshes in the same browser. Editable
budget makes quote-aware sizing user-directed instead of hard-coded.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- Add a small UI action to clear stored execution evidence, then improve manager
  balance/readback so leftover deposited dUSDC is visible.

### Round J: Execution-Adjusted Risk Metrics

Status: completed.

Goal:

- Convert the latest on-chain mint evidence into risk-management metrics instead
  of only showing digest and position details.

Implementation outcome:

- Added `ExecutionAdjustedRiskSummary` derived from latest mint execution,
  recommendation notional, and selected max hedge budget.
- Added metrics:
  - coverage ratio
  - executed quantity
  - executed gap
  - actual cost ratio
  - budget usage
  - deposited dUSDC
  - estimated manager-side remaining dUSDC
- Added an `Execution-adjusted risk` panel under PTB execution.
- Extended Markdown risk report with the same execution-adjusted metrics.

Concept explanation:

This round answers: "The app recommended a hedge, but how much did the actual
on-chain mint cover?" It turns execution evidence into a partial-risk-management
view. The manager remaining value is currently estimated from local event data:

```text
estimated manager remaining = deposited dUSDC - actual mint cost
```

This is useful for demo explanation, but full manager inventory still requires
direct manager/dynamic-field or indexer readback.

Verification:

- `bun run typecheck`
- `bun run lint`

Next implementation step:

- Implement a first manager/account summary: either direct manager balance
  readback if available, or a local execution-history summary if direct readback
  remains blocked.

### Round K: Manager Account Summary V1

Status: completed.

Goal:

- Give users a first explanation of where deposited-but-not-spent dUSDC is
  accounted for after one or more mint executions.

Implementation outcome:

- Extended local execution persistence from latest execution only to a recent
  execution history.
- Added `ManagerExecutionHistorySummary`.
- Added manager/account summary metrics:
  - local execution count
  - total minted quantity
  - total deposited dUSDC
  - total actual cost
  - estimated manager-side remaining dUSDC
  - latest digest
  - manager object ID
- Added a `Manager/account summary` panel below PTB execution.
- Added a `Manager / Account Summary` section to Markdown reports.

Concept explanation:

This is not direct manager dynamic-field inventory yet. It is a local
event-history estimate from confirmed wallet-signed mints:

```text
estimated manager remaining = sum(deposited dUSDC) - sum(actual mint costs)
```

This gives the demo a practical answer to "deposit is 2 dUSDC, actual cost is
lower, where is the rest?" while keeping direct protocol inventory as a deeper
follow-up.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- Add demo script v1 and submission story, then decide whether direct manager
  inventory or scenario/stress depth is the next best use of time.

### Round L: Fresh Oracle Guard For PTB Signing

Status: completed.

Problem:

- A new wallet signing attempt failed with Move abort code `3` in
  `oracle_config::assert_live_oracle`.
- This means the PTB reached `predict::mint`, but the oracle object used by the
  transaction was no longer accepted as live by the on-chain contract.

Implementation outcome:

- Disabled caching for Predict status fetches so `/api/predict/status` returns
  fresh oracle context.
- Marked the status route as dynamic and returned `cache-control: no-store`.
- Prioritized active oracle candidates with at least 5 minutes of remaining
  lifetime, with a fallback to the nearest still-unexpired active oracle.
- On `Sign PTB`, the execution component now fetches fresh Predict status and
  rebuilds the transaction with the latest eligible live oracle immediately
  before handing it to the wallet.
- The page now refreshes Predict testnet status every 60 seconds so a stale or
  expiring oracle can recover without a manual page reload.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`
- Local `/api/predict/status` currently selects a live BTC oracle with about 16
  minutes to expiry.
- Browser wallet verification succeeded after the fix:
  - digest:
    `B8SyuLtURpM6xYysApq3rKB1UEcrADFNHRMe7NeYQnZR`
  - position: `YES 62,151`
  - quantity: `1 dUSDC`
  - actual cost: `0.398901 dUSDC`
  - oracle:
    `0x7681a180a95fd9957cf581941a08f9e4a4b6a182c1f5d1f05e9333ed47023c43`
  - manager:
    `0x3cfb9e6c6f1102ef28d20e3beed73ac20bbe0e1451eeb86cecd28e52e3fc77e2`

Execution-adjusted risk result:

- Recommended notional: `100 dUSDC`
- Executed quantity: `1 dUSDC`
- Coverage ratio: `1.00%`
- Executed gap: `99 dUSDC`
- Budget usage: `19.95%`
- Estimated manager remaining: `1.601099 dUSDC`

Next implementation step:

- Direct manager inventory readback or scenario/stress depth is the next best
  implementation target.

### Round M: Execution Risk Concept Glossary Update

Status: completed.

Documentation outcome:

- Updated `docs/16-concept-glossary.md` with Chinese explanations for the
  newest execution-result concepts:
  - `Execution-adjusted risk`
  - `Coverage ratio`
  - `Executed gap`
  - `Budget usage`
  - `Recommended notional`
  - `Executed quantity`
  - `Manager/account summary`
  - `Local execution history`
  - `Estimated manager remaining`
  - `Direct manager inventory readback`

Concept decision:

- Keep English terms as stable anchors because code, protocol docs, and wallet
  surfaces use English.
- Explain each term in Chinese in the PredictGuard context so the user can map
  page labels to product meaning.

Next implementation step:

- Proceed to direct manager inventory readback after confirming the glossary is
  understandable.

### Round N: Full Concept Coverage Audit

Status: completed.

Goal:

- Re-audit concepts that have appeared across code, UI labels, reports,
  planning docs, and previous conversations.
- Ensure the glossary can be used as a Chinese-first learning map while keeping
  English terms as stable anchors for code and protocol docs.

Documentation outcome:

- Expanded `docs/16-concept-glossary.md` from execution-result concepts into a
  broader cross-reference covering:
  - DeepBook Predict basics: `DeepBook Predict`, `Binary Market`, `YES / NO`,
    `MarketKey`, `Oracle`, `Strike`, `Expiry`, `Ask Price`, `SVI`, volatility
    surface.
  - Wallet and PTB execution: `Wallet Connection`, `Wallet Signing`, `dApp Kit`,
    `Transaction Instance`, `PTB Readiness`, `Sign PTB`, `Move Abort`,
    `assert_mintable_ask`, `assert_live_oracle`.
  - Risk and finance: `TVL`, `Utilization`, `PnL`, `Unhedged / Hedged PnL`,
    `Payout Liability`, `Premium Collected`, `OTM`, `Tail-Loss Reduction`.
  - Data and Sui state: `Indexer`, `Event Parsing`, `PositionMinted Event`,
    `Balance Changes`, `Object Changes`, `Dynamic Fields`, `Shared Object`,
    `Owned Object`, `Coin Object`, `Package ID`, `Object ID`, `LocalStorage`.
  - Product architecture: `Data Adapter`, `Normalized Market State`,
    `Risk Engine`, `Exposure Matrix`, `Scenario Simulator`,
    `Hedge Optimizer`, `AI Hedge Copilot`.

Concept decision:

- Every glossary entry should have:
  - an English heading
  - a `Chinese:` line
  - a PredictGuard-specific explanation
- The glossary is now the primary place to study project concepts one by one.

Next implementation step:

- Continue with direct manager inventory readback after the glossary review is
  acceptable.

### Round O: Browser Warning Review

Status: completed.

Problem:

- Browser console showed Recharts warnings from `page.tsx`:
  `The width(-1) and height(-1) of chart should be greater than 0`.
- The warning came from `ResponsiveContainer` measuring before its parent chart
  frame had a stable width/height.
- Browser console also showed `Lit is in dev mode`, which comes from a
  development dependency/wallet UI path and is not a PredictGuard layout or
  transaction bug.

Implementation outcome:

- Updated `ChartFrame` with explicit `w-full`, `min-w-0`, fixed height, and
  overflow containment.
- Added `minWidth={0}` and `minHeight={288}` to both Recharts
  `ResponsiveContainer` instances.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- Browser-refresh and confirm the Recharts width/height warnings are gone.

### Round P: Hydration And Chart Measurement Fix

Status: completed.

Problem:

- Browser console showed a React hydration mismatch in
  `ExecutionAdjustedRiskPanel`.
- Root cause: server-rendered HTML had no local execution evidence, while the
  client initial render read `localStorage` before hydration and rendered the
  execution-adjusted metric grid.
- Recharts width/height warnings persisted because `ResponsiveContainer` could
  still measure the chart container before a valid width was available.

Implementation outcome:

- Initialized execution evidence state to empty values for both server and
  client first render.
- Deferred `localStorage` execution-history read until after hydration using
  `requestAnimationFrame`.
- Replaced Recharts `ResponsiveContainer` usage with `ChartFrame` width
  measurement through `ResizeObserver`.
- Chart components now render only after the measured width is greater than
  zero.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- Browser-refresh and confirm hydration mismatch and Recharts warnings are gone.

### Round Q: Direct Manager Inventory Readback V1

Status: completed.

Goal:

- Reduce reliance on local browser execution history by reading the connected
  `PredictManager` object directly from Sui testnet.

Implementation outcome:

- Added `src/lib/predict/managerReadback.ts`.
- Extended `/api/predict/manager` so a found manager also returns
  `inventoryReadback`.
- Read the manager object through Sui gRPC.
- Parsed manager object JSON for:
  - manager object version
  - object digest
  - owner
  - balance manager ID
  - balances table ID
  - positions table ID
  - range positions table ID
- Read Table dynamic fields for balances and positions.
- Parsed direct dUSDC manager balance from the balances table.
- Parsed u64 position quantities from the positions table.
- Added direct on-chain manager readback to the UI manager/account panel.
- Added direct manager readback evidence to the Markdown risk report.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`
- Local API check for wallet
  `0x5e2a28ff382ab6858588dba9d5ed8e21fc59908c295ced2124f87b1cdb4cefb6`
  returned:
  - manager:
    `0x3cfb9e6c6f1102ef28d20e3beed73ac20bbe0e1451eeb86cecd28e52e3fc77e2`
  - on-chain manager dUSDC balance: `8.102194 dUSDC`
  - position entries: `2`
  - total parsed position quantity: `10.31435 dUSDC`
  - balance entries: `1`

Concept note:

- This is direct manager inventory readback v1. It proves the app can read
  live manager object state and Table dynamic fields. It does not yet fully
  decode each `MarketKey` into oracle, expiry, strike, and side, so
  settlement-aware position reconstruction remains a follow-up.

Current completion estimate:

- About `76%`. This round closes a meaningful depth gap because the app now has
  direct on-chain manager evidence in addition to transaction-event evidence.

Next implementation step:

- Decode `MarketKey` entries or add a judge-facing demo script/README section
  that explains the full risk-to-execution-to-readback loop.

### Round R: MarketKey Position Decoding

Status: completed.

Goal:

- Turn manager position table entries from low-level dynamic-field rows into
  readable Predict positions.

Implementation outcome:

- Confirmed the official DeepBook Predict `MarketKey` source layout from
  `predict-testnet-4-16`:
  - `oracle_id: ID`
  - `expiry: u64`
  - `strike: u64`
  - `direction: u8`
- Confirmed protocol direction values:
  - `UP = 0`
  - `DOWN = 1`
- Added `MarketKey` BCS decoding to direct manager readback.
- Decoded each position entry into:
  - oracle ID
  - expiry timestamp and ISO time
  - raw scaled strike
  - readable strike
  - UP/DOWN direction
  - YES/NO product side
- Added decoded positions to the manager/account summary panel.
- Added decoded positions to exported Markdown risk reports.
- Updated the concept glossary with:
  - `MarketKey`
  - `Position Entry`
  - `Dynamic Field Name BCS`
  - `UP / DOWN Direction`

Concept note:

- A `position entry` is `MarketKey -> quantity`. The key identifies which
  Predict market the manager holds, and the value stores the quantity.
- A `MarketKey` is the canonical protocol identity for a Predict binary market.
  It combines oracle, expiry, strike, and direction.
- This closes a major readability gap: the app can now show positions such as
  `YES 63,187` directly from on-chain manager storage.

Current completion estimate:

- About `78%`. This improves product depth because manager readback is no
  longer just a count and total quantity; it now reconstructs real market
  identity from chain storage.

Verification:

- Local manager API returned decoded positions for wallet
  `0x5e2a28ff382ab6858588dba9d5ed8e21fc59908c295ced2124f87b1cdb4cefb6`:
  - `YES 62,151`, quantity `0 dUSDC`
  - `YES 63,187`, quantity `10.31435 dUSDC`
- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- Continue toward settlement-aware reconstruction or judge-facing demo polish.

### Round S: Settlement-Aware Position Status V1

Status: completed.

Goal:

- Move manager readback from raw decoded positions to status-aware position
  reconstruction.

Implementation outcome:

- Added a read timestamp to direct manager inventory reconstruction.
- Added status reconstruction for each decoded position:
  - `active`: quantity is greater than zero and expiry is still in the future
  - `expired`: quantity is greater than zero but expiry is in the past
  - `zero`: quantity is zero
  - `unknown`: missing or undecodable fields
- Added `directActivePositionQuantityDusdc` to distinguish all stored position
  quantity from active risk-protection quantity.
- Updated the manager/account summary UI to show:
  - reconstructed timestamp
  - active quantity
  - per-position status label
  - per-position status explanation
- Updated Markdown risk reports with active quantity and per-position status.
- Updated the concept glossary with:
  - `Settlement-Aware Position Reconstruction`
  - `Active Position Quantity`
  - `Zero Quantity Position`
  - `Expired Position`

Concept note:

- This is settlement-aware v1, not full settlement accounting. It classifies
  whether positions are active, expired, zero, or unknown based on decoded
  `MarketKey`, quantity, and read time.
- Full settlement would additionally determine final market outcome, winning
  side, claimable amount, and claimed amount.

Current completion estimate:

- About `82%`. This closes the first task in today's path toward `90%` by
  making chain readback more explainable and less likely to overstate current
  hedge coverage.

Verification:

- Local manager API returned:
  - `YES 62,151`, quantity `0 dUSDC`, status `Zero quantity`
  - `YES 63,187`, quantity `10.31435 dUSDC`, status `Active`
  - active position quantity `10.31435 dUSDC`
- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- Move to demo-flow polish.

### Round T: Risk-To-Execution-To-Readback Demo Flow

Status: completed.

Goal:

- Make the product loop visible as a single judge-facing workflow instead of
  scattered panels.

Implementation outcome:

- Added a `Demo Flow` panel near the top of the page.
- The flow tracks five steps:
  - risk identification
  - hedge recommendation
  - wallet/PTB readiness
  - wallet execution
  - manager readback
- Each step shows a compact status: `complete`, `ready`, or `blocked`.
- The readback step shows active position quantity when manager inventory is
  loaded.
- Added workflow status to the exported Markdown risk report.

Concept note:

- This turns PredictGuard from a collection of panels into a repeatable demo:
  `risk -> hedge -> wallet execution -> execution-adjusted risk -> manager
  readback`.

Current completion estimate:

- About `85%`. The chain integration depth is mostly present; this round
  improves judge-facing clarity and makes the core product loop easier to
  demonstrate.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- Verify build/UI, then create judge-facing README/pitch/demo script.

### Round U: Judge-Facing README And Demo Script

Status: completed.

Goal:

- Make the project understandable to judges without requiring them to read all
  planning documents.

Implementation outcome:

- Added a `Judge Demo` section to `README.md`.
- Added a short pitch, local demo path, and proof points to the README.
- Added `docs/18-judge-demo-script.md` with:
  - one-minute pitch
  - step-by-step demo path
  - points to emphasize
  - verified chain evidence
  - fallback demo path
  - known limitations
  - next depth targets
- Added the new judge demo script to the README document index.

Concept note:

- This is not a feature-heavy round, but it materially improves submission
  readiness. A project with real protocol work can still underperform if judges
  cannot quickly understand the product loop and verified evidence.

Current completion estimate:

- About `90%` for the competition MVP / judge-demo target. This does not mean
  production completeness; it means the current project has a coherent
  risk-to-execution-to-readback flow, direct testnet evidence, and a judge-facing
  story.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- Final manual browser walkthrough and final submission assets: screenshots,
  recorded demo, and any late official contract verification.

### Round V: Final Submission Readiness Documents

Status: completed.

Goal:

- Make the remaining `90% -> final submission` work explicit and avoid
  confusing completed depth work with pending media/submission tasks.

Implementation outcome:

- Updated `docs/17-depth-roadmap.md` to reflect current completed work:
  - manager and position inventory v1 completed
  - execution-adjusted risk metrics v1 completed
  - demo and judge-facing story v1 completed
- Added `docs/19-final-submission-checklist.md`.
- Added final submission checklist to the README document index.
- The checklist covers:
  - final engineering checks
  - official contract information verification
  - manual browser walkthrough
  - screenshot list
  - 5-7 minute video outline
  - demo risk controls
  - remaining product depth

Current completion estimate:

- Still about `90%` for competition MVP / judge-demo readiness. This round does
  not add core product features; it clarifies the last-mile work before final
  submission.

Next implementation step:

- Manual browser walkthrough or one targeted depth item such as scenario/stress
  improvement.

### Round W: Executed Stress Comparison

Status: completed.

Goal:

- Strengthen scenario and stress depth by showing how the latest wallet-executed
  hedge changes outcomes across multiple scenarios.

Implementation outcome:

- Added `src/lib/risk/executedStress.ts`.
- Converted the latest `PredictMintExecutionSummary` into a conservative
  executed hedge model when side, strike, quantity, and cost are available.
- Added an executed stress summary with:
  - unhedged PnL
  - recommended hedge PnL
  - executed hedge PnL
  - executed tail-loss reduction
  - worst unhedged PnL
  - worst executed PnL
  - worst-case improvement
- Added an `Executed stress comparison` table to the Scenario Simulator panel.
- Added executed stress comparison to Markdown risk reports.
- Updated the concept glossary with:
  - `Executed Stress Comparison`
  - `Worst-Case Improvement`

Concept note:

- This closes a visible depth gap: the product no longer only says "a hedge was
  recommended and minted"; it shows how the actually executed position affects
  several stress scenarios.
- Because the executed testnet hedge can be smaller than the recommended
  notional, this also makes partial coverage explicit.

Current completion estimate:

- About `93%`.

Verification:

- `bun run lint`
- `bun run build`
- `bun run typecheck`
- Note: one parallel `typecheck` attempt raced with `next build` generated
  `.next/types` output. A standalone rerun passed.

Next implementation step:

- Run checks, commit, then move to quote source labeling / freshness.

### Round X: Quote Source Labeling And Freshness

Status: completed.

Goal:

- Make quote-aware sizing easier to defend by showing where the quote evidence
  comes from and whether it is available.

Implementation outcome:

- Added quote evidence fields to the PTB plan:
  - quote source
  - quote freshness
  - quote explanation
- Current source labels:
  - `last-executed-ask`
  - `none`
- Current freshness labels:
  - `available`
  - `unavailable`
- Added quote source/freshness/ask price input to the wallet execution panel.
- Added quote evidence to the Sui SDK transaction skeleton comments.
- Added quote source/freshness to the PTB config area.
- Added sizing evidence to the Markdown risk report.
- Updated the concept glossary with:
  - `Quote Source`
  - `Quote Freshness`

Concept note:

- `Last executed ask` is real execution evidence from the latest successful
  wallet mint. It is not a guaranteed live quote. The UI now says this
  explicitly, which reduces the chance that judges misread v1 sizing as a full
  live quote engine.

Current completion estimate:

- About `94%`.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- Run checks, commit, then evaluate full settlement reconstruction feasibility.

### Round Y: Settlement Reconstruction Feasibility

Status: completed.

Goal:

- Evaluate whether full settlement reconstruction should be implemented now or
  documented as a deeper post-MVP path.

Implementation outcome:

- Reviewed official DeepBook Predict `predict-testnet-4-16` source:
  - `PositionRedeemed` event exists.
  - `redeem` and `redeem_permissionless` exist.
  - `PositionRedeemed` includes payout, bid price, and `is_settled`.
  - settled redemption requires settled oracle state and compacted vault state.
  - `predict_manager::decrease_position` reduces quantity but does not remove
    the `MarketKey` table entry, explaining zero-quantity entries.
- Added `docs/20-settlement-reconstruction-feasibility.md`.
- Added the settlement feasibility document to the README index.
- Updated manager readback notes to state that full settlement accounting
  requires redeemed-event history plus oracle/vault settlement readback.
- Updated the concept glossary with:
  - `Full Settlement Accounting`
  - `PositionRedeemed Event`

Product decision:

- Do not implement full settlement accounting in the current MVP. Keep
  settlement-aware v1 as the honest product behavior and document the deeper
  implementation path.

Current completion estimate:

- About `95%`. The remaining gap to `100%` is final official contract
  verification, manual final validation, screenshots/video, and submission
  packaging.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- Run checks, commit, then return to final validation/submission preparation.

### Round Z: Sticky Workflow Navigation

Status: completed.

Goal:

- Improve demo navigation without splitting the app into multiple pages.

Implementation outcome:

- Replaced the long hero navigation with a sticky compact workflow nav.
- New workflow nav items:
  - `Demo`
  - `Risk`
  - `Hedge`
  - `Execute`
  - `Readback`
  - `Report`
- Added scroll/resize tracking to highlight the currently nearest workflow
  section.
- Added a dedicated `readback` anchor around the manager/account summary.
- Kept the app as one continuous workflow page for demo storytelling.

Verification:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

Next implementation step:

- User visual review of the sticky nav in browser, then final validation or
  further small UI polish.

## Documentation Maintenance Rule

After each meaningful implementation or planning round:

1. Add the round to this file.
2. Record the commit hash if one was created.
3. Explain any new protocol concept in plain language.
4. Update the current percentage estimate when progress meaningfully changes.
5. Record the next concrete task.
