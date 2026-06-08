# AI Hedge Copilot

## Role

The AI should not pretend to predict BTC direction. Its job is risk explanation and hedge reasoning.

Good:

> The vault has concentrated short upside exposure near the next expiry. A small OTM YES hedge can reduce tail loss under a +5% move.

Bad:

> BTC will go up, buy this.

## Inputs

The copilot receives structured data:

- market snapshot
- PLP metrics
- exposure matrix
- scenario results
- candidate hedges
- selected hedge
- assumptions

## Output Schema

```ts
type HedgeRecommendation = {
  shouldHedge: boolean;
  riskSummary: string;
  recommendedHedge?: {
    side: "YES" | "NO";
    strike: number;
    expiryId: string;
    notional: number;
    estimatedCost: number;
  };
  expectedEffect: {
    unhedgedMaxLoss: number;
    hedgedMaxLoss: number;
    tailLossReductionPct: number;
  };
  tradeoffs: string[];
  assumptions: string[];
  plainEnglishExplanation: string;
};
```

## Prompt Requirements

The prompt should enforce:

- no profit guarantee
- explain assumptions
- explain hedge cost
- explain residual risk
- use plain language
- produce output in JSON plus user-facing summary

## Example Explanation

> PLP exposure is concentrated in short-dated upside strikes. In the BTC +5% stress case, payout liability increases sharply because several YES positions finish in-the-money. Buying a smaller OTM YES hedge reduces the vault's short-upside exposure. The hedge costs 12 dUSDC and reduces simulated max loss from 180 dUSDC to 95 dUSDC, but it also lowers expected premium income if the tail event does not happen.

## Guardrails

The AI must not:

- claim guaranteed profit
- recommend leverage in MVP
- hide data source assumptions
- issue financial advice language
- execute transactions without explicit user confirmation

