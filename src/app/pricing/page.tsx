import { BriefcaseBusiness, CheckCircle2, ShieldCheck } from "lucide-react";

const packages = [
  {
    name: "Free",
    audience: "Solo reviewers and demo users",
    price: "$0",
    promise: "Understand one wallet or sample portfolio.",
    features: [
      "Live dashboard preview",
      "Sample risk report",
      "Markdown export",
      "Snapshot JSON export",
    ],
  },
  {
    name: "Pro",
    audience: "Independent LPs and strategy builders",
    price: "$49/mo target",
    promise: "Save reports and monitor one or more managers.",
    features: [
      "Saved report history",
      "Monitoring policy presets",
      "Scenario library",
      "Lifecycle review queue",
    ],
  },
  {
    name: "Team",
    audience: "Vault teams and market makers",
    price: "$299/mo target",
    promise: "Shared vault risk workspace and branded reports.",
    features: [
      "Multi-manager portfolio",
      "Team review workflow",
      "Branded LP-facing reports",
      "API-ready risk snapshots",
    ],
  },
  {
    name: "Enterprise",
    audience: "Protocols and ecosystem partners",
    price: "Custom",
    promise: "Custom adapters, monitoring, and integration support.",
    features: [
      "Custom venue adapter",
      "Production indexer integration",
      "Alert delivery routes",
      "Managed risk dashboards",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211d]">
      <section className="border-b border-[#dce3dd] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <a
            href="/"
            className="text-sm font-semibold text-[#1f8a70] transition hover:text-[#17211d]"
          >
            Back to dashboard
          </a>
          <div className="mt-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-3 py-1 text-sm font-medium text-[#1f8a70]">
              <BriefcaseBusiness className="h-4 w-4" />
              Product packaging draft
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
              Commercial packages for prediction-market RiskOps
            </h1>
            <p className="mt-4 text-base leading-7 text-[#52615a]">
              Pricing is a product design artifact at this stage. The goal is to
              map PredictGuard features to buyer value before billing, team auth,
              and production infrastructure are added.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-4">
          {packages.map((item) => (
            <article key={item.name} className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <ShieldCheck className="h-5 w-5 text-[#1f8a70]" />
              </div>
              <div className="mt-3 text-2xl font-semibold">{item.price}</div>
              <div className="mt-1 text-sm text-[#52615a]">{item.audience}</div>
              <p className="mt-4 text-sm leading-6 text-[#52615a]">{item.promise}</p>
              <ul className="mt-5 space-y-3 text-sm leading-6">
                {item.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1f8a70]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-md border border-[#dce3dd] bg-white p-5">
          <h2 className="text-lg font-semibold">Packaging assumptions</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Assumption title="Reports sell first" detail="Exportable evidence and monitoring history are easier to validate than full automation." />
            <Assumption title="Teams need trust" detail="Lifecycle, assumptions, and residual risk should remain visible in paid reports." />
            <Assumption title="Adapters create upside" detail="DeepBook Predict is the proof point; the model should support more venues later." />
          </div>
        </section>
      </div>
    </main>
  );
}

function Assumption({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[#52615a]">{detail}</p>
    </div>
  );
}
