import { BriefcaseBusiness, Layers, Network, ShieldCheck } from "lucide-react";

import { buildDeepBookPortfolio, buildDeepBookSampleMarkets } from "@/lib/adapters/deepbook";
import { ProductNav } from "@/app/product-nav";

const portfolio = buildDeepBookPortfolio({});
const markets = buildDeepBookSampleMarkets();

export default function PortfolioPage() {
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
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-3 py-1 text-sm font-medium text-[#1f8a70]">
                <BriefcaseBusiness className="h-4 w-4" />
                Portfolio workspace preview
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
                Multi-manager risk workspace
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#52615a]">
                PredictGuard is moving from a single connected wallet flow to a
                normalized portfolio model that can support multiple managers,
                accounts, and future market adapters.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Accounts" value={String(portfolio.summary.accountCount)} />
              <Metric label="Positions" value={String(portfolio.summary.positionCount)} />
              <Metric label="Executions" value={String(portfolio.summary.executionCount)} />
              <Metric label="Adapter" value={portfolio.venue} />
            </div>
          </div>
        </div>
      </section>
      <ProductNav active="Portfolio" />

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Panel title="Accounts" icon={<Network className="h-5 w-5" />}>
            <div className="space-y-3">
              {portfolio.accounts.map((account) => (
                <div key={account.accountId} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{account.label}</div>
                      <div className="mt-1 break-all text-xs text-[#52615a]">
                        {account.managerId ?? account.accountId}
                      </div>
                    </div>
                    <span className="rounded-full border border-[#1f8a70] bg-[#e8f4ef] px-2 py-0.5 text-xs font-semibold text-[#1f8a70]">
                      {account.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Adapter Coverage" icon={<Layers className="h-5 w-5" />}>
            <div className="grid gap-3 md:grid-cols-3">
              <AdapterCard title="DeepBook Predict" status="active model" detail="Current first adapter and testnet execution surface." />
              <AdapterCard title="Polymarket" status="planned" detail="Future event-market exposure and reporting adapter." />
              <AdapterCard title="Hyperliquid" status="planned" detail="Future perp/vault risk monitoring adapter." />
            </div>
          </Panel>
        </section>

        <Panel title="Normalized Position Surface" icon={<ShieldCheck className="h-5 w-5" />}>
          {portfolio.positions.length === 0 ? (
            <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-5 text-sm leading-6 text-[#52615a]">
              No connected manager inventory in this static workspace preview.
              The normalized model is ready to receive DeepBook manager readback
              and future adapter positions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-[#dce3dd] text-left text-xs uppercase text-[#52615a]">
                    <th className="py-3 pr-4">Market</th>
                    <th className="py-3 pr-4">Side</th>
                    <th className="py-3 pr-4 text-right">Notional</th>
                    <th className="py-3 pr-4">Lifecycle</th>
                    <th className="py-3">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.positions.map((position) => (
                    <tr key={position.positionId} className="border-b border-[#edf1ee]">
                      <td className="py-3 pr-4">{position.marketId}</td>
                      <td className="py-3 pr-4">{position.side}</td>
                      <td className="py-3 pr-4 text-right">{position.notional}</td>
                      <td className="py-3 pr-4">{position.lifecycle}</td>
                      <td className="py-3">{position.evidenceStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Market Adapter Inventory" icon={<Layers className="h-5 w-5" />}>
          <div className="grid gap-3 md:grid-cols-2">
            {markets.map((market) => (
              <div key={market.marketId} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
                <div className="text-sm font-semibold">{market.marketId}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#52615a]">
                  <span>{market.asset} / {market.quoteAsset}</span>
                  <span>{market.status}</span>
                  <span>{market.venue}</span>
                  <span>{market.dataSource}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <span className="text-[#1f8a70]">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
      <div className="text-xs font-semibold uppercase text-[#52615a]">{label}</div>
      <div className="mt-2 break-words text-base font-semibold">{value}</div>
    </div>
  );
}

function AdapterCard({
  title,
  status,
  detail,
}: {
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 w-fit rounded-full border border-[#dce3dd] bg-white px-2 py-0.5 text-xs font-semibold text-[#52615a]">
        {status}
      </div>
      <p className="mt-3 text-sm leading-6 text-[#52615a]">{detail}</p>
    </div>
  );
}
