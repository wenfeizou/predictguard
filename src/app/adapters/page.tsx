import { Layers, Network, ShieldCheck } from "lucide-react";

const adapters = [
  {
    name: "DeepBook Predict",
    status: "Implemented foundation",
    venue: "Sui",
    value: "First live execution and lifecycle evidence adapter.",
    normalized: ["Market", "Position", "Execution", "Portfolio"],
  },
  {
    name: "Polymarket",
    status: "Research target",
    venue: "Polygon / prediction markets",
    value: "Event-market exposure reports and market-maker risk review.",
    normalized: ["Market", "Position", "Fill", "Resolution"],
  },
  {
    name: "Hyperliquid",
    status: "Research target",
    venue: "Perps / vault risk",
    value: "Vault exposure, hedge drift, and liquidation-risk monitoring.",
    normalized: ["Account", "Position", "Execution", "Funding"],
  },
];

export default function AdaptersPage() {
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
              <Network className="h-4 w-4" />
              Adapter strategy
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
              One RiskOps model, multiple prediction venues
            </h1>
            <p className="mt-4 text-base leading-7 text-[#52615a]">
              PredictGuard should not stay trapped as a single-protocol dashboard.
              The adapter layer normalizes market, position, execution, and
              lifecycle evidence so reports and monitoring can expand beyond the
              first DeepBook Predict proof point.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-3">
          {adapters.map((adapter) => (
            <article key={adapter.name} className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{adapter.name}</h2>
                  <p className="mt-1 text-sm text-[#52615a]">{adapter.venue}</p>
                </div>
                <Layers className="h-5 w-5 text-[#1f8a70]" />
              </div>
              <div className="mt-4 w-fit rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-2 py-0.5 text-xs font-semibold text-[#52615a]">
                {adapter.status}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#52615a]">{adapter.value}</p>
              <div className="mt-5 grid gap-2">
                {adapter.normalized.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-[#1f8a70]" />
                    {item}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-md border border-[#dce3dd] bg-white p-5">
          <h2 className="text-lg font-semibold">Adapter contract</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <ContractItem title="Normalize" detail="Convert venue-specific positions into common risk objects." />
            <ContractItem title="Explain" detail="Preserve assumptions, data source, and confidence level." />
            <ContractItem title="Monitor" detail="Evaluate common rules such as liability, drift, and evidence gaps." />
            <ContractItem title="Report" detail="Feed the same report and snapshot builder across venues." />
          </div>
        </section>
      </div>
    </main>
  );
}

function ContractItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[#52615a]">{detail}</p>
    </div>
  );
}
