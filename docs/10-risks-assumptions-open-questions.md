# Risks, Assumptions, and Open Questions

## Key Assumptions

- DeepBook Predict testnet remains available during development.
- Public API/indexer data can be accessed or approximated.
- dUSDC can be requested for testnet execution.
- The hackathon accepts simulation results for strategy-like projects.
- PTB preview is valuable even if full execution is stretch.

## Major Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Predict integration changes | High | Keep IDs and entrypoints in config; verify docs late. |
| Sparse testnet data | Medium | Use deterministic simulator and label data clearly. |
| Financial concepts confuse judges | High | Use before/after PnL charts and plain-English AI explanations. |
| Project looks like generic dashboard | High | Include hedge recommendation, PTB preview, and risk report. |
| Scope expands into full vault | High | Keep vault execution as future work. |
| AI overclaims strategy quality | Medium | Add guardrails and assumptions. |

## Open Questions

Need to confirm:

- latest Predict package ID
- latest Predict object IDs
- exact `mint` / hedge position entrypoint signatures
- PredictManager creation flow
- dUSDC acquisition flow
- public API response schemas
- whether PLP exposure can be read directly or must be reconstructed
- best way to represent PTB preview in judging demo

## Fallback Strategy

If testnet integration is blocked, the project still ships:

- documented simulation
- risk dashboard
- vol surface / IV heatmap
- stress simulator
- AI hedge recommendation
- PTB preview skeleton
- risk report

Position fallback honestly:

> The risk layer is complete with simulation-backed analysis. Live testnet integration is isolated behind adapters and can be switched on once package/object IDs are confirmed.

## Final Submission Message

Do not say:

> We made an AI trading dashboard.

Say:

> We built the risk layer for DeepBook Predict: a PLP exposure dashboard, stress simulator, AI hedge copilot, and PTB preview system that helps LPs and vault builders understand and manage vol-surface-driven tail risk.

