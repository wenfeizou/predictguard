# PredictGuard Agent Notes

This file contains project-specific rules only. Global Codex collaboration rules
still apply and should not be duplicated here.

## Project Identity

- Product name: `PredictGuard`
- Package and repository name: `predictguard`
- Positioning: the PLP risk and hedge workflow for `DeepBook Predict`
- Do not describe the project as a generic prediction market dashboard.

## Sui And DeepBook Sources

- Prefer official Sui and Mysten sources before making protocol assumptions.
- DeepBook Predict docs: https://docs.sui.io/onchain-finance/deepbook-predict/
- DeepBook Predict contract information: https://docs.sui.io/onchain-finance/deepbook-predict/contract-information
- DeepBook Predict source branch: https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict
- Sui docs LLM index: https://docs.sui.io/llms.txt
- Move Book LLM index: https://move-book.com/llms.txt
- Sui MCP server, when available: https://sui.mcp.kapa.ai

DeepBook Predict is still a testnet integration surface. Package IDs, object IDs,
object layouts, and entrypoints are versioned dependencies and may change before
mainnet. Verify them late before building transaction execution flows.

## Installed Sui Skills

Project-level Sui skills are installed in `.agents/skills`.

Use the relevant skill before editing:

- `ptbs` for Sui `Transaction` construction and PTB review
- `sui-sdks` for `@mysten/*` SDK usage
- `frontend-apps` for wallet and dApp Kit integration patterns
- `accessing-data` for indexed data, RPC, events, and object reads
- `sui-object-model` for owned, shared, immutable, and dynamic object rules

Every `@mysten/*` package can include LLM docs under
`node_modules/@mysten/*/docs/`. Check `docs/llms-index.md` first when the SDK API
is uncertain.

## Frontend And Styling

- Tailwind CSS v4 only.
- Do not add `tailwind.config.ts` unless a real Tailwind v4 requirement appears.
- Do not add custom/native CSS. Keep styling in Tailwind utility classes.
- `src/app/globals.css` should stay minimal and only import Tailwind unless the
  project explicitly changes styling policy.
- Use lucide icons for common UI controls when icons are needed.

## Predict Testnet Defaults

Current defaults live in `src/lib/predict/config.ts` and can be overridden with
`NEXT_PUBLIC_PREDICT_*` environment variables. Keep README and `.env.example`
aligned with that file.

The current official package ID should match Sui's DeepBook Predict Contract
Information page before PTB work proceeds.

## Engineering Checks

Run these before committing implementation changes:

```sh
bun run lint
bun run typecheck
bun run build
```

Use small commits for independent milestones, especially config, docs, Sui
integration, and UI changes.

## Project Evolution Log

Maintain `docs/15-project-evolution-log.md` after each meaningful planning or
implementation round.

When updating it, record:

- completed task or round
- commit hash, if a commit was created
- key protocol or product concepts explained during the work
- important technical decisions or corrected assumptions
- updated completion estimate, when meaningful
- next concrete task
