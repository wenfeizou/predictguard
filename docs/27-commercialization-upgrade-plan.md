# Commercialization Upgrade Plan

Date: 2026-06-28

This plan turns PredictGuard from a hackathon-grade DeepBook Predict workflow into a productized risk operations layer for prediction-market liquidity, vaults, and structured DeFi strategies.

## Product North Star

PredictGuard should become the evidence-backed risk layer for prediction-market liquidity.

The product should help teams answer:

- Where is risk concentrated?
- What happens under tail scenarios?
- Which hedge reduces loss, and what does it cost?
- What actually happened on-chain after execution?
- Can this be explained to LPs, partners, or internal reviewers?

## Authorization Boundaries

Safe to automate locally:

- product copy
- docs
- sample reports
- frontend presentation
- deterministic risk model improvements
- tests, lint, build

Needs owner action:

- wallet signing
- production deploy
- DNS changes
- GitHub secrets
- paid API signup
- customer outreach from personal accounts
- mainnet or testnet transactions

## 16 Development Rounds

### Round 1: Product Positioning

Define PredictGuard as `RiskOps for prediction-market liquidity`.

Deliverables:

- homepage positioning update
- README summary update
- clear non-custodial and not-trading-advice boundary

### Round 2: Public Website Product Layer

Add a commercial-facing layer above the existing demo workflow.

Deliverables:

- product direction section
- productized roadmap section
- clear primary user and workflow signals

### Round 3: Sample Risk Report

Create a static report that can be shared without requiring wallet connection.

Deliverables:

- sample LP/vault risk report
- assumptions section
- evidence section
- next actions section

### Round 4: Report Export Quality

Improve report readability and business usefulness.

Deliverables:

- executive summary
- risk table
- assumptions table
- execution evidence table
- residual risk section

### Round 5: Adapter Boundary

Separate DeepBook Predict-specific data from generic prediction-market risk concepts.

Deliverables:

- market adapter interface
- normalized position shape
- normalized market quote shape
- docs explaining future Polymarket / Hyperliquid-style adapters

### Round 6: Data Persistence

Move local-only execution history toward persistent storage.

Deliverables:

- storage abstraction
- local storage adapter
- server-side persistence design
- migration note

### Round 7: Multi-Manager Portfolio

Support multiple wallets, managers, or vault accounts in one view.

Deliverables:

- portfolio aggregation model
- account selector
- manager list
- consolidated exposure summary

### Round 8: Scenario Library

Turn hardcoded scenarios into a reusable stress testing library.

Deliverables:

- scenario definitions file
- scenario categories
- tail move presets
- custom scenario input design

### Round 9: Risk Score V2

Improve risk scoring so it is explainable and less demo-specific.

Deliverables:

- score components
- utilization weight
- tail liability weight
- liquidity buffer weight
- oracle freshness weight
- score explanation UI

### Round 10: Monitoring And Alerts

Add a monitoring model before adding real notification infrastructure.

Deliverables:

- alert rule schema
- sample alert rules
- UI for threshold states
- manual alert runbook

### Round 11: Lifecycle Reconciliation

Strengthen settlement, redeem, and claimed/unclaimed accounting.

Deliverables:

- lifecycle state machine
- evidence confidence levels
- reconciliation summary
- missing-evidence warnings

### Round 12: Risk Copilot

Add an AI explanation layer only after the deterministic evidence is clear.

Deliverables:

- prompt templates
- report explanation mode
- LP-facing summary
- internal risk memo mode
- strict assumptions and no-trading-advice guardrails

### Round 13: Team Workspace Design

Design the paid workspace without implementing billing yet.

Deliverables:

- workspace model
- projects/vaults/accounts model
- role concepts
- team report sharing flow

### Round 14: API And SDK Surface

Prepare PredictGuard for builder integrations.

Deliverables:

- `/api/risk/report` design
- `/api/risk/scenario` design
- TypeScript SDK sketch
- example integration snippet

### Round 15: Pricing And Packaging

Create a product packaging plan.

Deliverables:

- Free
- Pro
- Team
- Enterprise / ecosystem integration
- feature gates

### Round 16: Product Validation

Prepare for customer discovery.

Deliverables:

- 10 interview questions
- target persona list
- demo script for vault builders
- success metrics
- follow-up email template

## First Automated Upgrade Completed

This repository now includes the first commercial upgrade layer:

- homepage product positioning
- commercial signals
- productized roadmap
- sample risk report
- README commercial direction

## Manual Next Steps

When the owner returns:

1. Review the homepage copy.
2. Run the deployed website after a normal deploy.
3. Decide whether to publish the sample report as a web page.
4. Choose whether to prioritize adapter architecture or report quality next.
5. Contact 3-5 Sui / DeFi builders for feedback.

## Continued Backlog

The next autonomous planning pass is documented here:

- [Next Commercialization Backlog](29-next-commercialization-backlog.md)

It continues the roadmap from round 17 through round 34 and keeps the same
authorization boundaries: local code, docs, and validation are safe to progress;
wallet signing, deployment, secrets, and external account actions require owner
approval.
