import { FileText, ShieldCheck, Signal, WalletCards } from "lucide-react";

import { scenarios } from "@/lib/data/scenarios";
import { seedMarketState } from "@/lib/data/seed";
import { buildCommercialReport, type CommercialReport } from "@/lib/report/commercial";
import { buildProductSnapshot } from "@/lib/report/snapshot";
import { buildHedgeRecommendation } from "@/lib/risk/hedge";
import { buildLifecycleReviewQueue } from "@/lib/risk/lifecycle";
import { evaluateMonitoringRules } from "@/lib/risk/monitoring";
import { computeRiskMetrics, runScenarioSet } from "@/lib/risk/engine";
import { ProductNav } from "@/app/product-nav";

const market = seedMarketState;
const metrics = computeRiskMetrics(market, scenarios);
const recommendation = buildHedgeRecommendation(market, scenarios);
const results = runScenarioSet(market, scenarios, recommendation.recommendedHedge);
const report = buildCommercialReport({
  market,
  metrics,
  scenarios,
  results,
  recommendation,
  ptbPlan: {
    inputs: {
      side: recommendation.recommendedHedge?.side,
      sizingMode: "quote-aware",
      quoteSource: "sample execution evidence",
      quoteFreshness: "illustrative",
      quoteAskPrice: recommendation.recommendedHedge
        ? recommendation.recommendedHedge.estimatedCost /
          Math.max(1, recommendation.recommendedHedge.notional)
        : undefined,
      quoteExplanation:
        "Sample report page uses deterministic demo data. Live reports should use wallet execution evidence and manager readback.",
    },
  },
});
const monitoringRules = evaluateMonitoringRules({
  market,
  metrics,
  recommendation,
});
const lifecycleQueue = buildLifecycleReviewQueue();
const snapshot = buildProductSnapshot({
  report,
  monitoring: monitoringRules,
  lifecycleQueue,
});

export default function SampleReportPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211d]">
      <section className="border-b border-[#dce3dd] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
          <a
            href="/"
            className="text-sm font-semibold text-[#1f8a70] transition hover:text-[#17211d]"
          >
            Back to PredictGuard
          </a>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-3 py-1 text-sm font-medium text-[#1f8a70]">
                <FileText className="h-4 w-4" />
                Sample commercial risk report
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
                Evidence-backed risk report for prediction-market liquidity
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#52615a]">
                This page shows the buyer-facing report format PredictGuard should
                produce for LPs, vault builders, and strategy teams. It uses
                deterministic demo data so reviewers can inspect the product
                without connecting a wallet.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ReportMetric label="Risk score" value={`${metrics.riskScore}/100`} />
              <ReportMetric
                label="Max liability"
                value={`${metrics.maxPayoutLiability.toFixed(0)} dUSDC`}
              />
              <ReportMetric
                label="Worst PnL"
                value={`${metrics.worstScenarioPnl.toFixed(0)} dUSDC`}
                danger
              />
              <ReportMetric
                label="Mode"
                value={report.mode.replaceAll("-", " ")}
              />
            </div>
          </div>
        </div>
      </section>
      <ProductNav />

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:px-8">
        <ReportPanel title="Executive Summary" icon={<ShieldCheck className="h-5 w-5" />}>
          <div className="grid gap-3">
            {report.executiveSummary.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-6 text-[#52615a]">
                {paragraph}
              </p>
            ))}
          </div>
        </ReportPanel>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <ReportPanel title="Workflow Status" icon={<Signal className="h-5 w-5" />}>
            <ReportRows rows={report.workflowStatus} />
          </ReportPanel>
          <ReportPanel title="Risk Snapshot" icon={<WalletCards className="h-5 w-5" />}>
            <ReportRows rows={report.riskSnapshot} />
          </ReportPanel>
        </div>

        <ReportPanel title="Risk Score Drivers" icon={<Signal className="h-5 w-5" />}>
          <ReportRows rows={report.riskScoreRows} />
        </ReportPanel>

        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <ReportPanel title="Hedge Recommendation" icon={<ShieldCheck className="h-5 w-5" />}>
            <ReportRows rows={report.hedgeRows} />
          </ReportPanel>
          <ReportPanel title="Scenario Comparison" icon={<Signal className="h-5 w-5" />}>
            <ScenarioTable report={report} />
          </ReportPanel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ReportPanel title="Execution Evidence" icon={<FileText className="h-5 w-5" />}>
            <ReportRows rows={report.executionRows} />
          </ReportPanel>
          <ReportPanel title="Lifecycle Evidence" icon={<ShieldCheck className="h-5 w-5" />}>
            <ReportRows rows={report.lifecycleRows} />
          </ReportPanel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ReportPanel title="Monitoring Rules" icon={<Signal className="h-5 w-5" />}>
            <RuleRows rules={monitoringRules} />
          </ReportPanel>
          <ReportPanel title="Lifecycle Review Queue" icon={<ShieldCheck className="h-5 w-5" />}>
            <QueueRows items={lifecycleQueue} />
          </ReportPanel>
        </div>

        <ReportPanel title="Portable Snapshot" icon={<FileText className="h-5 w-5" />}>
          <div className="grid gap-3 sm:grid-cols-3">
            <ReportMetric label="Schema" value={snapshot.schemaVersion} />
            <ReportMetric label="Data mode" value={snapshot.dataMode} />
            <ReportMetric label="Rules" value={String(snapshot.monitoring.length)} />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#52615a]">
            Product snapshots package workflow status, risk metrics, monitoring
            rules, lifecycle queues, assumptions, residual risks, and next actions
            into a portable JSON artifact for team review.
          </p>
        </ReportPanel>

        <div className="grid gap-6 lg:grid-cols-3">
          <ReportList title="Assumptions" items={report.assumptions} />
          <ReportList title="Residual Risks" items={report.residualRisks} />
          <ReportList title="Next Actions" items={report.nextActions} />
        </div>
      </div>
    </main>
  );
}

function RuleRows({ rules }: { rules: typeof monitoringRules }) {
  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div key={rule.id} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#17211d]">{rule.label}</div>
              <div className="mt-1 text-xs text-[#52615a]">{rule.threshold}</div>
            </div>
            <span className="rounded-full border border-[#dce3dd] bg-white px-2 py-0.5 text-xs font-semibold text-[#52615a]">
              {rule.status}
            </span>
          </div>
          <div className="mt-3 text-sm font-semibold text-[#17211d]">{rule.value}</div>
          <p className="mt-2 text-xs leading-5 text-[#52615a]">{rule.commercialUse}</p>
        </div>
      ))}
    </div>
  );
}

function QueueRows({ items }: { items: typeof lifecycleQueue }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#17211d]">{item.label}</div>
              <div className="mt-1 text-xs text-[#52615a]">{item.detail}</div>
            </div>
            <span className="rounded-full border border-[#dce3dd] bg-white px-2 py-0.5 text-xs font-semibold text-[#52615a]">
              {item.count}
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#52615a]">{item.operatorAction}</p>
        </div>
      ))}
    </div>
  );
}

function ReportMetric({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
      <div className="text-xs font-semibold uppercase text-[#52615a]">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${danger ? "text-[#c75c48]" : "text-[#17211d]"}`}>
        {value}
      </div>
    </div>
  );
}

function ReportPanel({
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

function ReportRows({ rows }: { rows: CommercialReport["riskSnapshot"] }) {
  return (
    <dl className="divide-y divide-[#dce3dd]">
      {rows.map((row) => (
        <div key={`${row.label}-${row.value}`} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
          <dt className="text-sm font-medium text-[#52615a]">{row.label}</dt>
          <dd className="min-w-0 break-words text-sm font-semibold text-[#17211d]">
            {row.value}
            {row.note ? (
              <span className="mt-1 block font-normal leading-5 text-[#52615a]">
                {row.note}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ScenarioTable({ report }: { report: CommercialReport }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#dce3dd] text-left text-xs uppercase text-[#52615a]">
            <th className="py-3 pr-4 font-semibold">Scenario</th>
            <th className="py-3 pr-4 text-right font-semibold">Unhedged</th>
            <th className="py-3 pr-4 text-right font-semibold">Hedged</th>
            <th className="py-3 text-right font-semibold">Reduction</th>
          </tr>
        </thead>
        <tbody>
          {report.scenarioRows.map((row) => (
            <tr key={row.scenario} className="border-b border-[#edf1ee]">
              <td className="py-3 pr-4 font-medium text-[#17211d]">{row.scenario}</td>
              <td className="py-3 pr-4 text-right text-[#c75c48]">{row.unhedgedPnl}</td>
              <td className="py-3 pr-4 text-right text-[#17211d]">{row.hedgedPnl}</td>
              <td className="py-3 text-right text-[#1f8a70]">{row.reduction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-md border border-[#dce3dd] bg-white p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-[#52615a]">
        {items.map((item) => (
          <li key={item} className="border-l-2 border-[#1f8a70] pl-3">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
