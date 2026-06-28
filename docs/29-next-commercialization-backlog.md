# Next Commercialization Backlog

Date: 2026-06-28

This backlog continues the commercialization work after the first product-positioning upgrade. It is designed for autonomous local development first, while leaving wallet signing, production deployment, paid services, and external outreach to the project owner.

All rounds must follow the commercial product design principles in
[Commercial Product Design Principles](30-commercial-product-design-principles.md).
PredictGuard should evolve toward professional risk software for repeated use,
not toward a more elaborate hackathon demo.

## Execution Rules

Autonomous work is allowed for:

- local code changes
- docs and sample artifacts
- type-safe model extraction
- deterministic risk engine improvements
- UI copy and navigation
- tests, lint, and build checks

Owner approval is required for:

- wallet transactions
- production deployment
- DNS or nginx changes
- secrets and paid API keys
- publishing announcements
- contacting customers from personal accounts
- changing submitted hackathon records

## Next 18 Rounds

### Round 17: Adapter Domain Model

Goal: define the generic prediction-market risk vocabulary that sits above DeepBook Predict.

Deliverables:

- `NormalizedMarket`
- `NormalizedPosition`
- `NormalizedExecution`
- `NormalizedSettlement`
- `RiskDataSource`
- docs that explain which fields are DeepBook-specific and which are universal

Why it matters:

PredictGuard should not be trapped as one protocol dashboard. A clean domain model lets it later support other prediction-market or options-like venues.

### Round 18: DeepBook Adapter Extraction

Goal: move DeepBook-specific mapping into one adapter boundary.

Deliverables:

- adapter folder
- mapping functions from Predict readback to normalized positions
- explicit package/object dependency notes
- adapter test fixtures

Why it matters:

The current app is credible because it integrates DeepBook Predict. It becomes commercial infrastructure when DeepBook becomes one adapter, not the whole product.

### Round 19: Report Builder V2

Goal: turn the Markdown report into a product asset.

Deliverables:

- executive summary block
- risk snapshot table
- scenario comparison table
- hedge recommendation table
- execution evidence table
- residual risk and assumptions block
- report version metadata

Why it matters:

Reports are likely the first paid surface. A good report can be shared with LPs, partners, and internal reviewers.

### Round 20: Static Sample Report Page

Goal: make the sample report visible on the website without wallet connection.

Deliverables:

- `/report/sample` route
- responsive report layout
- link from homepage
- printable layout notes

Why it matters:

Investors, hiring managers, ecosystem reviewers, and potential users should understand the product without connecting a wallet.

### Round 21: Risk Score Explainability

Goal: make the risk score auditable instead of decorative.

Deliverables:

- score components
- scoring weights
- explanation UI
- edge-case handling
- docs with example calculation

Why it matters:

Professional users trust models when they can see what drives the output.

### Round 22: Scenario Library Refactor

Goal: move stress scenarios toward a reusable library.

Deliverables:

- scenario categories
- standard tail move presets
- expiry-aware assumptions
- user-editable custom scenario design
- deterministic fixtures

Why it matters:

Scenario quality is central to risk tooling. It also helps with future AI explanations.

### Round 23: Lifecycle State Machine

Goal: normalize active, expired, redeemed, unknown, and missing-evidence states.

Deliverables:

- state definitions
- transition rules
- confidence levels
- UI labels
- docs for settlement and redeem ambiguity

Why it matters:

The lifecycle view is one of PredictGuard's strongest differentiators. It should become a formal product concept.

### Round 24: Monitoring Rule Schema

Goal: define alerts before adding real notification infrastructure.

Deliverables:

- alert rule type
- utilization alert
- tail liability alert
- oracle freshness alert
- settlement readiness alert
- hedge drift alert
- sample alert evaluation output

Why it matters:

Monitoring is a natural Pro/Team feature and does not require full automation at first.

### Round 25: Local Snapshot Store

Goal: prepare for historical analysis without committing to a production database yet.

Deliverables:

- snapshot schema
- local storage adapter
- import/export JSON
- migration notes toward server persistence

Why it matters:

Historical snapshots enable trend charts, report comparison, and alert evaluation.

### Round 26: Multi-Manager Design

Goal: support the mental model of a team watching more than one manager or vault.

Deliverables:

- portfolio aggregation spec
- manager selector UI design
- consolidated exposure model
- docs for account ownership and permissions

Why it matters:

One-wallet demos are useful, but teams usually manage multiple accounts, vaults, or strategies.

### Round 27: Pricing Page Draft

Goal: sketch the commercial packaging in product language.

Deliverables:

- Free
- Pro
- Team
- Enterprise / ecosystem
- feature matrix
- pricing caveats

Why it matters:

Pricing forces clarity about what the product is actually selling.

### Round 28: Product Analytics Plan

Goal: define what to measure before adding analytics code.

Deliverables:

- activation events
- report export event
- wallet readiness event
- risk scenario event
- sample report view event
- privacy notes

Why it matters:

The product should measure user learning and report value, not just page views.

### Round 29: Customer Discovery Kit

Goal: prepare lightweight outreach material for when the owner is ready.

Deliverables:

- 10 interview questions
- target persona list
- one-page demo script
- follow-up email template
- feedback scorecard

Why it matters:

Commercial risk is mostly demand risk. Early conversations should guide the next build rounds.

### Round 30: AI Copilot Guardrails

Goal: prepare the AI layer without letting it become unsafe trading advice.

Deliverables:

- prompt guardrails
- assumptions-first response format
- report explanation mode
- risk reviewer mode
- disallowed claims list

Why it matters:

AI can make PredictGuard easier to understand, but the product must remain evidence-first.

### Round 31: External Venue Research Notes

Goal: document how the same RiskOps model might apply beyond DeepBook Predict.

Deliverables:

- Polymarket adapter research note
- Hyperliquid risk-monitoring research note
- adapter feasibility matrix
- brand-fit analysis

Why it matters:

This protects the product from being dependent on one venue while keeping DeepBook as the first proof point.

### Round 32: Trust And Compliance Page

Goal: create clear trust boundaries for users.

Deliverables:

- non-custodial explanation
- no-trading-advice notice
- data-source transparency
- wallet signing boundary
- testnet/mainnet status note

Why it matters:

Risk products need explicit boundaries. This improves trust and reduces misunderstanding.

### Round 33: Demo-To-Product Cleanup

Goal: separate judge/demo language from product language.

Deliverables:

- demo mode labels
- product mode labels
- README cleanup
- docs index
- post-hackathon status note

Why it matters:

The repository should remain honest about the hackathon origin while looking like a continuing product.

### Round 34: Release Candidate Review

Goal: prepare a clean post-hackathon product milestone.

Deliverables:

- lint/typecheck/build
- manual QA checklist
- screenshots checklist
- deploy checklist
- changelog draft
- tag suggestion

Why it matters:

The next milestone should be reviewable, deployable, and useful as a portfolio artifact.

## Suggested Build Order

The best next build order is:

1. Round 19: Report Builder V2
2. Round 20: Static Sample Report Page
3. Round 21: Risk Score Explainability
4. Round 23: Lifecycle State Machine
5. Round 24: Monitoring Rule Schema
6. Round 17 and Round 18: Adapter model and DeepBook extraction

This order improves visible product value before deeper architecture work.

## Stop Conditions

Stop and ask the owner before:

- changing production deployment files
- changing wallet execution behavior
- sending transactions
- adding paid services
- adding external analytics scripts
- making legal/compliance promises
- committing or pushing without explicit approval
