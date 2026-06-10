"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  ClipboardList,
  Download,
  FileText,
  Layers,
  ShieldCheck,
  Signal,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { scenarios } from "@/lib/data/scenarios";
import { seedMarketState } from "@/lib/data/seed";
import type { PredictLiveSnapshot } from "@/lib/predict/client";
import { buildPredictHedgePtbPlan, buildPredictHedgeSdkSkeleton } from "@/lib/ptb/hedgeTransaction";
import { formatPtbReadinessLabel } from "@/lib/ptb/preview";
import type { PredictHedgePtbPlan, WalletReadinessInput } from "@/lib/ptb/hedgeTransaction";
import { buildMarkdownReport } from "@/lib/report/markdown";
import { buildExposureMatrix, computeRiskMetrics, runScenarioSet } from "@/lib/risk/engine";
import { buildHedgeRecommendation } from "@/lib/risk/hedge";

const market = seedMarketState;
const WalletReadinessClient = dynamic(
  () => import("@/app/wallet-readiness").then((mod) => mod.WalletReadinessClient),
  {
    ssr: false,
    loading: () => (
      <div className="w-fit rounded-full border border-[#dce3dd] bg-white px-3 py-1 text-xs font-semibold text-[#52615a]">
        Loading wallet
      </div>
    ),
  },
);

export default function Home() {
  const [walletReadiness, setWalletReadiness] = useState<WalletReadinessInput>({
    connected: false,
    network: "testnet",
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState("btc-up-5");
  const [liveSnapshot, setLiveSnapshot] = useState<PredictLiveSnapshot | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0];

  const exposureMatrix = useMemo(() => buildExposureMatrix(market), []);
  const metrics = useMemo(() => computeRiskMetrics(market, scenarios), []);
  const recommendation = useMemo(() => buildHedgeRecommendation(market, scenarios), []);
  const selectedResult = useMemo(
    () => runScenarioSet(market, [selectedScenario], recommendation.recommendedHedge)[0],
    [selectedScenario, recommendation.recommendedHedge],
  );
  const allResults = useMemo(
    () => runScenarioSet(market, scenarios, recommendation.recommendedHedge),
    [recommendation.recommendedHedge],
  );
  const ptbPlan = useMemo(
    () =>
      buildPredictHedgePtbPlan({
        hedge: recommendation.recommendedHedge,
        wallet: walletReadiness,
        oracleObjectId: liveSnapshot?.liveContext?.latestActiveOracle?.oracleId,
        oracleExpiryMs: liveSnapshot?.liveContext?.latestActiveOracle?.expiry,
      }),
    [
      recommendation.recommendedHedge,
      walletReadiness,
      liveSnapshot?.liveContext?.latestActiveOracle?.expiry,
      liveSnapshot?.liveContext?.latestActiveOracle?.oracleId,
    ],
  );
  const markdownReport = useMemo(
    () =>
      buildMarkdownReport({
        market,
        metrics,
        scenarios,
        results: allResults,
        recommendation,
        liveContext: liveSnapshot?.liveContext,
      }),
    [metrics, allResults, recommendation, liveSnapshot?.liveContext],
  );

  useEffect(() => {
    let active = true;

    fetch("/api/predict/status")
      .then(async (response) => {
        const snapshot = (await response.json()) as PredictLiveSnapshot;
        if (active) {
          setLiveSnapshot(snapshot);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLiveSnapshot({
            reachable: false,
            fetchedAt: new Date().toISOString(),
            config: {
              network: "testnet",
              apiBaseUrl: "https://predict-server.testnet.mystenlabs.com",
              packageId: "unavailable",
              predictObjectId: "unavailable",
              dusdcType: "unavailable",
              plpType: "unavailable",
            },
            error: error instanceof Error ? error.message : "Failed to load testnet status",
          });
        }
      })
      .finally(() => {
        if (active) {
          setLiveLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function exportReport() {
    const blob = new Blob([markdownReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "predictguard-risk-report.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen">
      <section className="border-b border-[#dce3dd] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 lg:px-8">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-3 py-1 text-sm font-medium text-[#1f8a70]">
                <ShieldCheck className="h-4 w-4" />
                {liveSnapshot?.liveContext?.dataSource === "mixed-live-and-simulated"
                  ? "Mixed: live testnet context + simulated exposure"
                  : "Simulated market data"}
              </div>
              <h1 className="text-4xl font-semibold tracking-normal text-[#17211d] md:text-6xl">
                PredictGuard
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#52615a] md:text-lg">
                The PLP risk and hedge workflow for DeepBook Predict. Inspect
                exposure, stress tail moves, compare hedged outcomes, and preview
                the PTB that would mint the hedge.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
              <MetricCard label="BTC spot" value={formatUsd(market.spotPrice)} />
              <MetricCard label="PLP TVL" value={`${formatNumber(metrics.tvl)} dUSDC`} />
              <MetricCard label="Utilization" value={formatPct(metrics.utilization)} />
              <MetricCard label="Risk score" value={`${metrics.riskScore}/100`} tone="risk" />
            </div>
          </header>
          <nav className="flex gap-2 overflow-x-auto pb-1 text-sm font-medium">
            {[
              "Overview",
              "Testnet",
              "Exposure",
              "Vol Surface",
              "Simulator",
              "Hedge",
              "PTB",
              "Report",
            ].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="whitespace-nowrap rounded-md border border-[#dce3dd] bg-white px-3 py-2 text-[#52615a] transition hover:border-[#1f8a70] hover:text-[#1f8a70]"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section id="overview" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="PLP Overview" icon={<Activity className="h-5 w-5" />}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile
                label="Max payout liability"
                value={`${metrics.maxPayoutLiability.toFixed(0)} dUSDC`}
                icon={<WalletCards className="h-5 w-5" />}
              />
              <SummaryTile
                label="Worst scenario PnL"
                value={`${metrics.worstScenarioPnl.toFixed(0)} dUSDC`}
                icon={<ArrowDownRight className="h-5 w-5" />}
                danger
              />
              <SummaryTile
                label="Largest risk strike"
                value={`${formatUsd(metrics.largestRiskStrike)} / ${metrics.largestRiskExpiryId}`}
                icon={<AlertTriangle className="h-5 w-5" />}
              />
              <SummaryTile
                label="Available liquidity"
                value={`${formatNumber(market.plp.availableLiquidity)} dUSDC`}
                icon={<Layers className="h-5 w-5" />}
              />
            </div>
          </Panel>
          <Panel title="Recommended Action" icon={<Bot className="h-5 w-5" />}>
            <p className="text-sm leading-6 text-[#52615a]">
              {recommendation.riskSummary}
            </p>
            {recommendation.recommendedHedge ? (
              <div className="mt-4 rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
                <div className="text-sm font-semibold text-[#17211d]">
                  Buy {recommendation.recommendedHedge.notional}{" "}
                  {recommendation.recommendedHedge.side} notional
                </div>
                <div className="mt-1 text-sm text-[#52615a]">
                  Strike {formatUsd(recommendation.recommendedHedge.strike)} ·
                  Expiry {recommendation.recommendedHedge.expiryId} · Cost{" "}
                  {recommendation.recommendedHedge.estimatedCost.toFixed(2)} dUSDC
                </div>
              </div>
            ) : null}
          </Panel>
        </section>

        <section id="testnet">
          <TestnetStatusPanel snapshot={liveSnapshot} loading={liveLoading} />
        </section>

        <section id="exposure" className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Panel title="Exposure Heatmap" icon={<Layers className="h-5 w-5" />}>
            <Heatmap cells={exposureMatrix} />
          </Panel>
          <Panel title="Exposure Breakdown" icon={<ClipboardList className="h-5 w-5" />}>
            <div className="space-y-3">
              {topExposure(exposureMatrix).map((cell) => (
                <div
                  key={`${cell.expiryId}-${cell.strike}`}
                  className="rounded-md border border-[#dce3dd] bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">
                      {formatUsd(cell.strike)} / {cell.expiryLabel}
                    </div>
                    <div className="text-sm text-[#c75c48]">
                      {cell.maxPayoutLiability.toFixed(0)} dUSDC
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#52615a]">
                    <span>YES {cell.yesNotional.toFixed(0)}</span>
                    <span>NO {cell.noNotional.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section id="vol-surface">
          <Panel title="Volatility Surface" icon={<ArrowUpRight className="h-5 w-5" />}>
            <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
              <IvHeatmap />
              <ChartFrame>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={market.markets.filter((item) => item.expiryId === "15m")}
                    margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid stroke="#dce3dd" strokeDasharray="3 3" />
                    <XAxis dataKey="strike" tickFormatter={(value) => `${value / 1000}k`} />
                    <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                    <Tooltip
                      formatter={(value) => `${Number(value).toFixed(1)}%`}
                      labelFormatter={(value) => `Strike ${formatUsd(Number(value))}`}
                    />
                    <Line
                      type="monotone"
                      dataKey={(item) => item.impliedVol * 100}
                      name="15m IV"
                      stroke="#1f8a70"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartFrame>
            </div>
          </Panel>
        </section>

        <section id="simulator" className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Panel title="Scenario Simulator" icon={<Activity className="h-5 w-5" />}>
            <div className="space-y-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${
                    selectedScenarioId === scenario.id
                      ? "border-[#1f8a70] bg-[#e8f4ef] text-[#17211d]"
                      : "border-[#dce3dd] bg-white text-[#52615a] hover:border-[#1f8a70]"
                  }`}
                >
                  <span className="block font-semibold">{scenario.name}</span>
                  <span className="mt-1 block text-xs leading-5">{scenario.description}</span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title={`${selectedScenario.name} Result`} icon={<ArrowDownRight className="h-5 w-5" />}>
            <div className="grid gap-4 sm:grid-cols-4">
              <SummaryTile label="Scenario spot" value={formatUsd(selectedResult.scenarioSpot)} />
              <SummaryTile
                label="Unhedged PnL"
                value={`${selectedResult.unhedgedPnl.toFixed(0)} dUSDC`}
                danger={selectedResult.unhedgedPnl < 0}
              />
              <SummaryTile
                label="Hedged PnL"
                value={`${(selectedResult.hedgedPnl ?? selectedResult.unhedgedPnl).toFixed(0)} dUSDC`}
                danger={(selectedResult.hedgedPnl ?? selectedResult.unhedgedPnl) < 0}
              />
              <SummaryTile
                label="Tail-loss reduction"
                value={`${(selectedResult.tailLossReductionPct ?? 0).toFixed(1)}%`}
              />
            </div>
            <ChartFrame className="mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Unhedged", pnl: selectedResult.unhedgedPnl },
                    {
                      name: "Hedged",
                      pnl: selectedResult.hedgedPnl ?? selectedResult.unhedgedPnl,
                    },
                  ]}
                  margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
                >
                  <CartesianGrid stroke="#dce3dd" strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)} dUSDC`} />
                  <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                    <Cell fill={selectedResult.unhedgedPnl < 0 ? "#c75c48" : "#1f8a70"} />
                    <Cell
                      fill={
                        (selectedResult.hedgedPnl ?? selectedResult.unhedgedPnl) < 0
                          ? "#c98220"
                          : "#1f8a70"
                      }
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </Panel>
        </section>

        <section id="hedge" className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Panel title="Hedge Recommendation" icon={<Bot className="h-5 w-5" />}>
            <p className="text-sm leading-6 text-[#52615a]">
              {recommendation.plainEnglishExplanation}
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <SummaryTile
                label="Unhedged max loss"
                value={`${recommendation.expectedEffect.unhedgedMaxLoss.toFixed(0)} dUSDC`}
                danger
              />
              <SummaryTile
                label="Hedged max loss"
                value={`${recommendation.expectedEffect.hedgedMaxLoss.toFixed(0)} dUSDC`}
                danger
              />
              <SummaryTile
                label="Reduction"
                value={`${recommendation.expectedEffect.tailLossReductionPct.toFixed(1)}%`}
              />
            </div>
          </Panel>
          <Panel title="Tradeoffs" icon={<AlertTriangle className="h-5 w-5" />}>
            <ul className="space-y-3 text-sm leading-6 text-[#52615a]">
              {recommendation.tradeoffs.map((tradeoff) => (
                <li key={tradeoff} className="rounded-md border border-[#dce3dd] bg-white p-3">
                  {tradeoff}
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <section id="ptb" className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Panel title="PTB Preview" icon={<WalletCards className="h-5 w-5" />}>
            <WalletReadinessPanel plan={ptbPlan} onChange={setWalletReadiness} />
            <PtbReadinessPanel plan={ptbPlan} />
            <ol className="mt-5 space-y-3 text-sm text-[#52615a]">
              {ptbPlan.steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#17211d] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="leading-6">{step}</span>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Sui SDK Transaction" icon={<FileText className="h-5 w-5" />}>
            <div className="mb-4 grid gap-3 text-xs text-[#52615a] md:grid-cols-2">
              <ConfigRow label="Target" value={ptbPlan.target} />
              <ConfigRow label="Oracle" value={ptbPlan.inputs.oracleObjectId} />
              <ConfigRow
                label="Oracle expiry"
                value={
                  ptbPlan.inputs.oracleExpiryMs
                    ? String(ptbPlan.inputs.oracleExpiryMs)
                    : undefined
                }
              />
              <ConfigRow label="Manager" value={ptbPlan.inputs.managerObjectId} />
              <ConfigRow label="dUSDC coin" value={ptbPlan.inputs.dusdcCoinObjectId} />
              <ConfigRow label="Strike scaled" value={ptbPlan.inputs.strikeScaled} />
            </div>
            <pre className="max-h-96 overflow-auto rounded-md bg-[#17211d] p-4 text-xs leading-5 text-[#e8f4ef]">
              {buildPredictHedgeSdkSkeleton({
                hedge: recommendation.recommendedHedge,
                oracleObjectId: ptbPlan.inputs.oracleObjectId,
                oracleExpiryMs: ptbPlan.inputs.oracleExpiryMs,
              })}
            </pre>
          </Panel>
        </section>

        <section id="report">
          <Panel
            title="Risk Report"
            icon={<FileText className="h-5 w-5" />}
            action={
              <button
                type="button"
                onClick={exportReport}
                className="inline-flex items-center gap-2 rounded-md bg-[#17211d] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1f8a70]"
              >
                <Download className="h-4 w-4" />
                Export Markdown
              </button>
            }
          >
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md border border-[#dce3dd] bg-white p-4 text-sm leading-6 text-[#52615a]">
              {markdownReport}
            </pre>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function TestnetStatusPanel({
  snapshot,
  loading,
}: {
  snapshot: PredictLiveSnapshot | null;
  loading: boolean;
}) {
  const statusTone = loading
    ? "border-[#dce3dd] bg-[#f5f7f4] text-[#52615a]"
    : snapshot?.reachable
      ? "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]"
      : "border-[#c75c48] bg-[#fff1ed] text-[#c75c48]";
  const liveContext = snapshot?.liveContext;

  return (
    <Panel title="DeepBook Predict Testnet" icon={<Signal className="h-5 w-5" />}>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${statusTone}`}
        >
          <Signal className="h-4 w-4" />
          {loading
            ? "Checking live testnet"
            : snapshot?.reachable
              ? "Live testnet reachable"
              : "Live testnet unavailable"}
        </div>
        <div className="text-sm text-[#52615a]">
          Risk model mode:{" "}
          <span className="font-semibold text-[#17211d]">
            {liveContext?.dataSource === "mixed-live-and-simulated"
              ? "mixed live context + simulated exposure"
              : "simulated fallback"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          label="Server status"
          value={snapshot?.status?.status ?? (loading ? "Checking" : "Unavailable")}
        />
        <SummaryTile
          label="Checkpoint lag"
          value={
            snapshot?.status
              ? `${snapshot.status.max_checkpoint_lag} checkpoints`
              : "N/A"
          }
        />
        <SummaryTile
          label="Live vault value"
          value={
            liveContext?.vault
              ? `${formatNumber(liveContext.vault.valueDUsdc)} dUSDC`
              : "N/A"
          }
        />
        <SummaryTile
          label="Live utilization"
          value={liveContext?.vault ? formatPct(liveContext.vault.utilization) : "N/A"}
        />
        <SummaryTile
          label="Active BTC oracles"
          value={liveContext ? String(liveContext.activeOracleCount) : "N/A"}
        />
        <SummaryTile
          label="Live max payout"
          value={
            liveContext?.vault
              ? `${formatNumber(liveContext.vault.totalMaxPayoutDUsdc)} dUSDC`
              : "N/A"
          }
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
          <div className="text-sm font-semibold text-[#17211d]">Official testnet config</div>
          <dl className="mt-3 space-y-2 text-xs text-[#52615a]">
            <ConfigRow label="API" value={snapshot?.config.apiBaseUrl} />
            <ConfigRow label="Predict object" value={snapshot?.config.predictObjectId} />
            <ConfigRow label="Package" value={snapshot?.config.packageId} />
            <ConfigRow label="dUSDC" value={snapshot?.config.dusdcType} />
            <ConfigRow label="PLP" value={snapshot?.config.plpType} />
          </dl>
        </div>
        <div className="rounded-md border border-[#dce3dd] bg-white p-4">
          <div className="text-sm font-semibold text-[#17211d]">Mixed data context</div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#52615a]">
            <li>Public Predict server adapter is active.</li>
            <li>Status, vault summary, protocol state, and oracle list are validated with Zod.</li>
            <li>PLP risk simulation still uses deterministic fallback exposure.</li>
            <li>
              Latest active oracle:{" "}
              {liveContext?.latestActiveOracle
                ? `${liveContext.latestActiveOracle.underlyingAsset} / ${liveContext.latestActiveOracle.minutesToExpiry}m to expiry`
                : "N/A"}
            </li>
            <li>
              Quote assets:{" "}
              {liveContext && liveContext.quoteAssets.length > 0
                ? liveContext.quoteAssets.length
                : "N/A"}
            </li>
            <li>Next step: wire live data into scenario assumptions and PTB builder inputs.</li>
            {snapshot?.error ? (
              <li className="text-[#c75c48]">Error: {snapshot.error}</li>
            ) : null}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function PtbReadinessPanel({ plan }: { plan: PredictHedgePtbPlan }) {
  const tone =
    plan.readiness.status === "ready-to-sign"
      ? "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]"
      : "border-[#d0a13a] bg-[#fff8e7] text-[#8a6416]";

  return (
    <div className="rounded-md border border-[#dce3dd] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[#17211d]">Execution readiness</div>
          <p className="mt-2 text-sm leading-6 text-[#52615a]">
            PredictGuard can build the transaction shape, but keeps execution gated until wallet,
            coin, manager, and current package signature checks are satisfied.
          </p>
        </div>
        <div className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
          {formatPtbReadinessLabel(plan)}
        </div>
      </div>

      {plan.readiness.missing.length > 0 ? (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-normal text-[#17211d]">
            Missing inputs
          </div>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs text-[#52615a]">
            {plan.readiness.missing.map((item) => (
              <li key={item} className="rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-3 py-1">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-normal text-[#17211d]">
          Guardrails
        </div>
        <ul className="mt-2 space-y-2 text-xs leading-5 text-[#52615a]">
          {plan.readiness.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function WalletReadinessPanel({
  plan,
  onChange,
}: {
  plan: PredictHedgePtbPlan;
  onChange: (wallet: WalletReadinessInput) => void;
}) {
  const connected = Boolean(plan.inputs.walletConnected && plan.inputs.walletAddress);

  return (
    <div className="mb-4 rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[#17211d]">Wallet readiness</div>
          <p className="mt-2 text-sm leading-6 text-[#52615a]">
            Connect a Sui wallet on testnet before building a signable Predict hedge PTB.
            The wallet owns gas selection; PredictGuard passes the Transaction instance.
          </p>
        </div>
        <WalletReadinessClient onChange={onChange} />
      </div>
      <dl className="mt-4 grid gap-3 text-xs text-[#52615a] sm:grid-cols-2">
        <ConfigRow label="Address" value={plan.inputs.walletAddress} />
        <ConfigRow label="Network" value={plan.inputs.walletNetwork} />
      </dl>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="font-semibold text-[#17211d]">{label}</dt>
      <dd className="mt-1 break-all">{value ?? "Unavailable"}</dd>
    </div>
  );
}

function ChartFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`flex h-72 items-center justify-center rounded-md border border-[#dce3dd] bg-[#f5f7f4] text-sm text-[#52615a] ${className}`}
      >
        Loading chart
      </div>
    );
  }

  return <div className={`h-72 min-h-72 min-w-0 ${className}`}>{children}</div>;
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "risk";
}) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
      <div className="text-xs font-medium uppercase text-[#52615a]">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${tone === "risk" ? "text-[#c75c48]" : "text-[#17211d]"}`}>
        {value}
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-[#dce3dd] bg-[#ffffff] p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-[#17211d]">
          <span className="text-[#1f8a70]">{icon}</span>
          {title}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SummaryTile({
  label,
  value,
  icon,
  danger,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-[#52615a]">
        {icon ? <span className="text-[#1f8a70]">{icon}</span> : null}
        {label}
      </div>
      <div className={`mt-3 text-lg font-semibold ${danger ? "text-[#c75c48]" : "text-[#17211d]"}`}>
        {value}
      </div>
    </div>
  );
}

function Heatmap({ cells }: { cells: ReturnType<typeof buildExposureMatrix> }) {
  const max = Math.max(...cells.map((cell) => cell.maxPayoutLiability));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-[110px_repeat(6,1fr)] gap-2">
        <div />
        {market.strikes.map((strike) => (
          <div key={strike.value} className="text-center text-xs font-semibold text-[#52615a]">
            {strike.label}
          </div>
        ))}
        {market.expiries.map((expiry) => (
          <div key={expiry.id} className="contents">
            <div className="flex items-center text-sm font-semibold text-[#17211d]">
              {expiry.label}
            </div>
            {market.strikes.map((strike) => {
              const cell = cells.find(
                (item) => item.expiryId === expiry.id && item.strike === strike.value,
              );
              const intensity = (cell?.maxPayoutLiability ?? 0) / max;
              const color =
                intensity > 0.72
                  ? "bg-[#c75c48] text-white"
                  : intensity > 0.42
                    ? "bg-[#c98220] text-white"
                    : intensity > 0.12
                      ? "bg-[#e8f4ef] text-[#17211d]"
                      : "bg-[#f5f7f4] text-[#52615a]";

              return (
                <div
                  key={`${expiry.id}-${strike.value}`}
                  className={`flex aspect-[1.65] items-center justify-center rounded-md border border-[#dce3dd] text-sm font-semibold ${color}`}
                >
                  {(cell?.maxPayoutLiability ?? 0).toFixed(0)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function IvHeatmap() {
  const max = Math.max(...market.markets.map((item) => item.impliedVol));
  const min = Math.min(...market.markets.map((item) => item.impliedVol));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-[110px_repeat(6,1fr)] gap-2">
        <div />
        {market.strikes.map((strike) => (
          <div key={strike.value} className="text-center text-xs font-semibold text-[#52615a]">
            {strike.label}
          </div>
        ))}
        {market.expiries.map((expiry) => (
          <div key={expiry.id} className="contents">
            <div className="flex items-center text-sm font-semibold text-[#17211d]">
              {expiry.label}
            </div>
            {market.strikes.map((strike) => {
              const item = market.markets.find(
                (entry) => entry.expiryId === expiry.id && entry.strike === strike.value,
              );
              const normalized = ((item?.impliedVol ?? min) - min) / Math.max(0.01, max - min);
              const color =
                normalized > 0.7
                  ? "bg-[#6b5fb5] text-white"
                  : normalized > 0.38
                    ? "bg-[#1f8a70] text-white"
                    : "bg-[#e8f4ef] text-[#17211d]";

              return (
                <div
                  key={`${expiry.id}-${strike.value}`}
                  className={`flex aspect-[1.65] items-center justify-center rounded-md border border-[#dce3dd] text-sm font-semibold ${color}`}
                >
                  {((item?.impliedVol ?? 0) * 100).toFixed(1)}%
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function topExposure(cells: ReturnType<typeof buildExposureMatrix>) {
  return [...cells]
    .sort((a, b) => b.maxPayoutLiability - a.maxPayoutLiability)
    .slice(0, 5);
}

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
