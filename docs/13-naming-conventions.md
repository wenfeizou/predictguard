# Naming Conventions

Use these conventions consistently across product copy, code, package metadata, environment variables, and submission materials.

## Product Name

Canonical product name:

```text
PredictGuard
```

Canonical English tagline:

```text
PredictGuard: The Risk Layer for DeepBook Predict
```

Canonical Chinese tagline:

```text
PredictGuard：DeepBook Predict 风险层
```

Do not use:

- `Predictguard`
- `predictGuard` in user-facing text
- `Predict Guard`
- `predict-guard` as the product name

## Casing Rules

| Context | Format | Example |
| --- | --- | --- |
| Brand / UI / README / docs prose | PascalCase | `PredictGuard` |
| npm package name | lowercase | `predictguard` |
| repository / directory name | lowercase | `predictguard` |
| React components | PascalCase | `PredictGuardShell` |
| TypeScript types | PascalCase | `PredictGuardReport` |
| TypeScript variables | camelCase | `predictGuardReport` |
| CSS/Tailwind utility composition names, if any | camelCase | `predictGuardPanel` |
| environment variables | uppercase snake case | `NEXT_PUBLIC_PREDICT_API_BASE_URL` |

## Technical Prefixes

Prefer these prefixes:

- `PredictGuard` for app-level components and exported types.
- `predictGuard` for local variables and helper values.
- `PREDICT` or `NEXT_PUBLIC_PREDICT` for DeepBook Predict integration settings.

Examples:

```ts
type PredictGuardReport = {
  generatedAt: number;
};

const predictGuardReport: PredictGuardReport = {
  generatedAt: Date.now(),
};
```

## DeepBook Predict Terms

Keep protocol terms exactly as written in official materials:

- `DeepBook Predict`
- `DeepBook`
- `Predict`
- `PredictManager`
- `OracleSVI`
- `PLP`
- `dUSDC`
- `Sui`
- `PTB`

Do not rewrite protocol terms for style. For example, use `dUSDC`, not `DUSDC`, except when quoting official text that uses another casing.

## Submission Language

Preferred one-line description:

```text
PredictGuard is the PLP risk and hedge workflow for DeepBook Predict.
```

Preferred longer description:

```text
PredictGuard helps LPs and vault builders inspect PLP exposure, simulate tail losses, compare unhedged and hedged outcomes, and turn an OTM binary hedge into a Sui PTB preview or testnet action.
```

Avoid positioning the project as:

- an AI trading dashboard
- a generic prediction market dashboard
- a guaranteed-profit strategy
- a full automated vault
