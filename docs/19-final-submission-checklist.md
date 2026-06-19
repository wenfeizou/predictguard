# Final Submission Checklist

PredictGuard is final-submission ready for the competition MVP / judge-demo
target. The remaining work is mostly upload/submission packaging and late
verification of external testnet surfaces.

## Required Before Submission

1. Run final engineering checks:
   - `bun run typecheck`
   - `bun run lint`
   - `bun run build`
2. Verify official DeepBook Predict contract information:
   - package ID
   - Predict object ID
   - dUSDC type
   - current testnet branch or release note
3. Run the local app:
   - `bun run dev`
   - open `http://localhost:3000`
4. Complete a manual browser walkthrough:
   - Demo Flow
   - PLP Overview
   - Exposure Heatmap
   - Scenario Simulator
   - Hedge Recommendation
   - PTB Preview
   - Wallet readiness
   - optional Sign PTB
   - execution-adjusted risk
   - manager/account summary
   - report export
5. Confirm there are no browser console errors that affect the demo.
6. Export a fresh Markdown risk report.
7. Capture screenshots.
8. Confirm the prepared about 4-minute demo video still matches the latest
   README evidence and demo path.
9. Confirm the prepared PDF demo deck still matches the latest README evidence.
10. Prepare final submission text from the README and judge demo script.

## Screenshot List

Capture these views:

1. Hero + Demo Flow
2. PLP Overview
3. Exposure Heatmap
4. Scenario Simulator with before/after PnL
5. Hedge Recommendation
6. PTB Preview and readiness
7. Wallet execution result with digest
8. Manager/account summary with decoded positions
9. Risk Report export preview

## Video Script Outline

1. Problem:
   - DeepBook Predict PLPs earn premium but need tail-risk visibility.
2. Product:
   - PredictGuard is a PLP risk and hedge workflow, not a generic dashboard.
3. Risk:
   - Show exposure concentration and scenario loss.
4. Recommendation:
   - Show hedge side, strike, expiry, cost, and expected reduction.
5. Execution:
   - Show PTB readiness and wallet-signed Predict mint.
6. Readback:
   - Show transaction digest, execution-adjusted risk, manager inventory, and
     decoded positions.
7. Report:
   - Export the Markdown report as the durable risk artifact.
8. Roadmap:
   - Mention live exposure reconstruction, full settlement accounting, and
     historical replay as post-MVP depth.

## Demo Risk Controls

- If testnet or wallet is unavailable, use the fallback demo path in
  `docs/18-judge-demo-script.md`.
- Do not claim production profitability or complete settlement accounting.
- State clearly that PLP exposure is still deterministic demo input while
  Predict testnet context, wallet execution, and manager readback are live.
- Verify all official object IDs late because DeepBook Predict is still a
  testnet integration surface.

## Remaining Product Depth

Highest value after the final submission package:

1. Scenario and stress depth using executed hedge impact across all scenarios.
2. Better quote source labeling or live quote lookup.
3. Full settlement reconstruction for expired positions.
4. Historical replay or lightweight backtest.
