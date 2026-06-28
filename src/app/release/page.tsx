import { CheckCircle2, Rocket, ShieldCheck } from "lucide-react";

import { ProductNav } from "@/app/product-nav";

const completed = [
  "Commercial product positioning",
  "Structured risk report builder",
  "Sample report page",
  "Saved reports and snapshot comparison",
  "Monitoring rule library and policy export",
  "Lifecycle review queue",
  "Normalized DeepBook adapter model",
  "Portfolio workspace preview",
  "Team workspace draft",
  "Pricing and packaging draft",
  "Adapter strategy page",
  "AI copilot guardrails",
  "Customer discovery page",
  "Integrations/API surface",
  "Production readiness checklist",
];

const next = [
  "Production deploy to predictguard.xyz",
  "Real manager readback in portfolio workspace",
  "Persistent team workspace backend",
  "Production indexer for historical events",
  "External alert delivery",
  "First user interviews with vault builders and LPs",
];

export default function ReleasePage() {
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211d]">
      <section className="border-b border-[#dce3dd] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <a href="/" className="text-sm font-semibold text-[#1f8a70] transition hover:text-[#17211d]">
            Back to dashboard
          </a>
          <div className="mt-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-3 py-1 text-sm font-medium text-[#1f8a70]">
              <Rocket className="h-4 w-4" />
              Product milestone
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
              PredictGuard commercial prototype milestone
            </h1>
            <p className="mt-4 text-base leading-7 text-[#52615a]">
              This milestone turns the hackathon workflow into a multi-page
              commercial product prototype with reports, monitoring, adapters,
              team workflows, packaging, and deployment readiness.
            </p>
          </div>
        </div>
      </section>
      <ProductNav />

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title="Completed product surfaces">
            <List items={completed} />
          </Panel>
          <Panel title="Next milestone">
            <List items={next} />
          </Panel>
        </section>

        <section className="rounded-md border border-[#dce3dd] bg-white p-5">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-[#1f8a70]" />
            Release criteria
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Criteria label="Build passes" />
            <Criteria label="Navigation complete" />
            <Criteria label="Reports usable" />
            <Criteria label="Monitoring configurable" />
            <Criteria label="Commercial packaging visible" />
            <Criteria label="Deployment checklist ready" />
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-6">
      {items.map((item) => (
        <li key={item} className="flex gap-2 rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1f8a70]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Criteria({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4 text-sm font-semibold">
      {label}
    </div>
  );
}
