# Commercial Product Design Principles

Date: 2026-06-28

PredictGuard should be designed as a real commercial risk product, not as a hackathon demo page. Future work should optimize for trust, repeat use, and buyer clarity.

## Product Standard

PredictGuard is a professional RiskOps product for prediction-market liquidity, vaults, and structured DeFi strategies.

Every new feature or page should answer one of these commercial questions:

- Does this help a team understand risk faster?
- Does this help a vault, LP, or strategy team make a safer operational decision?
- Does this create a report, alert, workflow, or integration that someone could pay for?
- Does this increase trust through evidence, assumptions, and lifecycle traceability?
- Does this reduce the product's dependence on one-off demo data?

## Functional Priorities

Prioritize commercial product functions in this order:

1. Risk visibility: exposure, liability, scenario loss, hedge effect.
2. Evidence: wallet execution, manager readback, digest, lifecycle state, data source.
3. Reporting: shareable, exportable, LP-facing, reviewer-friendly risk reports.
4. Monitoring: thresholds, alerts, freshness, settlement readiness, hedge drift.
5. Team workflow: multi-manager, saved reports, workspace, review history.
6. Integrations: API, SDK, adapter model, external venue support.
7. AI explanations: only after deterministic evidence and assumptions are clear.

Avoid feature work that mainly looks impressive in a demo but does not improve repeatable professional use.

## Page Architecture

Commercial pages should use this hierarchy:

1. Product value: what this helps a professional user do.
2. User role: LP, vault builder, risk reviewer, strategy team.
3. Workflow: observe risk, simulate scenarios, evaluate hedge, verify execution, export report.
4. Evidence: chain data, digest, manager state, assumptions, freshness.
5. Action: export, save, monitor, compare, share, or connect wallet.

Do not make a marketing landing page the main product experience. The first screen should still feel like a usable risk product.

## Visual Style

The UI should feel like professional DeFi risk software:

- calm, dense, and scannable
- clear hierarchy
- dashboard-first, not hero-first
- restrained color
- no decorative visual noise
- cards only for actual repeated items or framed tools
- tables and compact panels for operational information
- status badges for data freshness and lifecycle state
- explicit warning states for assumptions and missing evidence

Avoid:

- oversized hackathon hero sections
- decorative gradients
- marketing-only copy
- vague AI claims
- one-note color palettes
- visual elements that do not support risk review

## Copywriting Rules

Use product language, not hype language.

Good:

- "Inspect exposure"
- "Stress tail scenarios"
- "Review execution evidence"
- "Export LP-facing risk report"
- "Monitor settlement readiness"
- "Assumptions and residual risk"

Avoid:

- "AI predicts the market"
- "Guaranteed protection"
- "Automated profit"
- "One-click risk-free hedge"
- "Institutional-grade" unless backed by a real model and validation

PredictGuard should be explicit that it is non-custodial, evidence-first, and not trading advice.

## Commercial Feature Gate

Before implementing a new feature, classify it:

| Class | Definition | Default action |
| --- | --- | --- |
| Core | Improves risk visibility, evidence, reporting, monitoring, or team workflow | Build |
| Enabler | Supports adapters, storage, tests, or reliability | Build when it unlocks Core work |
| Demo-only | Helps video/demo but not repeat use | Avoid unless needed for acquisition |
| Speculative | Could matter later but no user or buyer is clear | Document, do not build yet |

## Buyer-Facing Product Packages

Design features so they can eventually map to packages:

| Package | Product promise |
| --- | --- |
| Free | Understand one wallet or sample risk report |
| Pro | Save reports, monitor one or more managers, configure scenarios |
| Team | Shared vault dashboard, branded reports, API access, alert review |
| Enterprise / ecosystem | Custom adapters, managed monitoring, integration support |

## Implementation Implication

The next engineering work should favor:

- sample report page
- report builder V2
- risk score explanation
- lifecycle state machine
- monitoring rule schema
- adapter boundary

These are more commercially valuable than adding more one-off demo controls.

