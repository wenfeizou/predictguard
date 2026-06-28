import { BellRing, ShieldCheck, Signal } from "lucide-react";

import { scenarios } from "@/lib/data/scenarios";
import { seedMarketState } from "@/lib/data/seed";
import { buildHedgeRecommendation } from "@/lib/risk/hedge";
import { evaluateMonitoringRules } from "@/lib/risk/monitoring";
import { computeRiskMetrics } from "@/lib/risk/engine";

const market = seedMarketState;
const metrics = computeRiskMetrics(market, scenarios);
const recommendation = buildHedgeRecommendation(market, scenarios);
const rules = evaluateMonitoringRules({
  market,
  metrics,
  recommendation,
});

export default function MonitoringPage() {
  const watchCount = rules.filter((rule) => rule.status === "watch").length;
  const breachCount = rules.filter((rule) => rule.status === "breach").length;

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
                <BellRing className="h-4 w-4" />
                Monitoring rule library
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
                Operational alerts for prediction-market risk
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#52615a]">
                PredictGuard monitoring translates utilization, liability, oracle
                freshness, lifecycle readiness, hedge drift, and data provenance
                into reviewable operating signals.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Rules" value={String(rules.length)} />
              <Metric label="Watch" value={String(watchCount)} />
              <Metric label="Breaches" value={String(breachCount)} danger={breachCount > 0} />
              <Metric label="Mode" value={market.dataSource} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-2">
          {rules.map((rule) => (
            <article key={rule.id} className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Signal className="h-5 w-5 text-[#1f8a70]" />
                    {rule.label}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#52615a]">{rule.detail}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getRuleClass(rule.status)}`}>
                  {rule.status}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric label="Current value" value={rule.value} />
                <Metric label="Severity" value={rule.severity} />
              </div>
              <div className="mt-4 rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
                <div className="text-xs font-semibold uppercase text-[#52615a]">Threshold</div>
                <div className="mt-2 text-sm font-semibold">{rule.threshold}</div>
                <p className="mt-3 text-sm leading-6 text-[#52615a]">{rule.commercialUse}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-md border border-[#dce3dd] bg-white p-5">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-[#1f8a70]" />
            Configuration roadmap
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <RoadmapItem title="Threshold presets" detail="Conservative, balanced, and aggressive policies per vault." />
            <RoadmapItem title="Notification routes" detail="Email, webhook, Telegram, or Discord delivery after production auth." />
            <RoadmapItem title="Review ownership" detail="Assign alerts to vault operators or risk reviewers in a team workspace." />
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
      <div className="text-xs font-semibold uppercase text-[#52615a]">{label}</div>
      <div className={`mt-2 break-words text-base font-semibold ${danger ? "text-[#c75c48]" : "text-[#17211d]"}`}>
        {value}
      </div>
    </div>
  );
}

function RoadmapItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[#52615a]">{detail}</p>
    </div>
  );
}

function getRuleClass(status: string) {
  if (status === "pass") {
    return "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]";
  }

  if (status === "watch") {
    return "border-[#c98220] bg-[#fff7ea] text-[#9a5d0a]";
  }

  if (status === "breach") {
    return "border-[#c75c48] bg-[#fff1ed] text-[#c75c48]";
  }

  return "border-[#dce3dd] bg-white text-[#52615a]";
}
