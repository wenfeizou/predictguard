import { Code2, Network, Webhook } from "lucide-react";

import { ProductNav } from "@/app/product-nav";

const endpoints = [
  {
    method: "POST",
    path: "/api/risk/report",
    detail: "Generate a report from normalized portfolio, monitoring, and lifecycle inputs.",
  },
  {
    method: "POST",
    path: "/api/risk/scenario",
    detail: "Run scenario stress against provided market and exposure data.",
  },
  {
    method: "GET",
    path: "/api/workspaces/:id/snapshots",
    detail: "Fetch saved report snapshots for a team workspace.",
  },
  {
    method: "POST",
    path: "/api/alerts/evaluate",
    detail: "Evaluate monitoring rules and return watch/breach states.",
  },
];

const integrations = [
  "Vault dashboards",
  "LP-facing report portals",
  "Discord or Telegram alert bots",
  "Protocol ecosystem dashboards",
  "External data indexers",
  "Custom market adapters",
];

export default function IntegrationsPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211d]">
      <section className="border-b border-[#dce3dd] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <a href="/" className="text-sm font-semibold text-[#1f8a70] transition hover:text-[#17211d]">
            Back to dashboard
          </a>
          <div className="mt-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-3 py-1 text-sm font-medium text-[#1f8a70]">
              <Network className="h-4 w-4" />
              Integrations and API surface
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
              Make PredictGuard embeddable
            </h1>
            <p className="mt-4 text-base leading-7 text-[#52615a]">
              The API surface should let other teams generate reports, evaluate
              monitoring rules, and embed risk evidence without copying the full
              dashboard.
            </p>
          </div>
        </div>
      </section>
      <ProductNav />

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-2">
          {endpoints.map((endpoint) => (
            <article key={endpoint.path} className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Code2 className="h-5 w-5 text-[#1f8a70]" />
                <span className="rounded-md bg-[#17211d] px-2 py-1 text-xs text-white">
                  {endpoint.method}
                </span>
                <span>{endpoint.path}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#52615a]">{endpoint.detail}</p>
            </article>
          ))}
        </section>

        <section className="rounded-md border border-[#dce3dd] bg-white p-5">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Webhook className="h-5 w-5 text-[#1f8a70]" />
            Integration targets
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {integrations.map((item) => (
              <div key={item} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4 text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
