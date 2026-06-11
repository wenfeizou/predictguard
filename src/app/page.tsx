"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  ClipboardList,
  CheckCircle2,
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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { scenarios } from "@/lib/data/scenarios";
import { seedMarketState } from "@/lib/data/seed";
import type { PredictLiveSnapshot } from "@/lib/predict/client";
import {
  buildExecutionAdjustedRiskSummary,
  buildManagerExecutionHistorySummary,
  type ExecutionAdjustedRiskSummary,
  type ManagerExecutionHistorySummary,
  loadStoredMintExecutionHistory,
  loadStoredMintExecution,
  storeMintExecution,
  type PredictMintExecutionSummary,
} from "@/lib/predict/execution";
import type { PredictManagerInventoryReadback } from "@/lib/predict/managerReadback";
import { buildPredictHedgePtbPlan, buildPredictHedgeSdkSkeleton } from "@/lib/ptb/hedgeTransaction";
import { formatPtbReadinessLabel } from "@/lib/ptb/preview";
import type { PredictHedgePtbPlan, WalletReadinessInput } from "@/lib/ptb/hedgeTransaction";
import { buildMarkdownReport } from "@/lib/report/markdown";
import { buildExposureMatrix, computeRiskMetrics, runScenarioSet } from "@/lib/risk/engine";
import {
  buildExecutedStressSummary,
  type ExecutedStressSummary,
} from "@/lib/risk/executedStress";
import { buildHedgeRecommendation } from "@/lib/risk/hedge";

const market = seedMarketState;
const PtbExecuteClient = dynamic(
  () => import("@/app/ptb-execute").then((mod) => mod.PtbExecuteClient),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4 text-sm text-[#52615a]">
        Loading wallet execution
      </div>
    ),
  },
);
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

const workflowNavItems = [
  { label: "Demo", href: "#workflow", sectionId: "workflow" },
  { label: "Risk", href: "#overview", sectionId: "overview" },
  { label: "Hedge", href: "#hedge", sectionId: "hedge" },
  { label: "Execute", href: "#ptb", sectionId: "ptb" },
  { label: "Readback", href: "#readback", sectionId: "readback" },
  { label: "Report", href: "#report", sectionId: "report" },
];

export default function Home() {
  const [walletReadiness, setWalletReadiness] = useState<WalletReadinessInput>({
    connected: false,
    network: "testnet",
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState("btc-up-5");
  const [liveSnapshot, setLiveSnapshot] = useState<PredictLiveSnapshot | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [mintExecution, setMintExecution] = useState<PredictMintExecutionSummary | null>(null);
  const [mintExecutionHistory, setMintExecutionHistory] = useState<
    PredictMintExecutionSummary[]
  >([]);
  const [maxHedgeBudgetDusdc, setMaxHedgeBudgetDusdc] = useState(2);
  const [activeSectionId, setActiveSectionId] = useState("workflow");
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
  const executedStressSummary = useMemo(
    () =>
      buildExecutedStressSummary({
        market,
        scenarios,
        recommendedHedge: recommendation.recommendedHedge,
        execution: mintExecution,
      }),
    [recommendation.recommendedHedge, mintExecution],
  );
  const ptbInput = useMemo(
    () => ({
      hedge: recommendation.recommendedHedge,
      wallet: walletReadiness,
      account: walletReadiness.account,
      oracleObjectId: liveSnapshot?.liveContext?.latestActiveOracle?.oracleId,
      oracleExpiryMs: liveSnapshot?.liveContext?.latestActiveOracle?.expiry,
      oracleMinStrike: liveSnapshot?.liveContext?.latestActiveOracle?.minStrike,
      oracleTickSize: liveSnapshot?.liveContext?.latestActiveOracle?.tickSize,
      oracleReferencePrice: liveSnapshot?.liveContext?.latestActiveOracle?.referencePrice,
      quoteAskPrice: mintExecution?.askPrice,
      maxHedgeBudgetDusdc,
    }),
    [
      recommendation.recommendedHedge,
      walletReadiness,
      liveSnapshot?.liveContext?.latestActiveOracle?.expiry,
      liveSnapshot?.liveContext?.latestActiveOracle?.minStrike,
      liveSnapshot?.liveContext?.latestActiveOracle?.oracleId,
      liveSnapshot?.liveContext?.latestActiveOracle?.referencePrice,
      liveSnapshot?.liveContext?.latestActiveOracle?.tickSize,
      mintExecution?.askPrice,
      maxHedgeBudgetDusdc,
    ],
  );
  const ptbPlan = useMemo(() => buildPredictHedgePtbPlan(ptbInput), [ptbInput]);
  const executionRiskSummary = useMemo(
    () =>
      buildExecutionAdjustedRiskSummary({
        execution: mintExecution,
        recommendedNotionalDusdc: recommendation.recommendedHedge?.notional,
        maxBudgetDusdc: maxHedgeBudgetDusdc,
      }),
    [mintExecution, recommendation.recommendedHedge?.notional, maxHedgeBudgetDusdc],
  );
  const managerHistorySummary = useMemo(
    () => buildManagerExecutionHistorySummary(mintExecutionHistory),
    [mintExecutionHistory],
  );
  const managerInventoryReadback = walletReadiness.account?.managerInventory;
  const demoFlowSteps = useMemo(
    () => buildDemoFlowSteps({
      riskScore: metrics.riskScore,
      hasRecommendation: Boolean(recommendation.recommendedHedge),
      readinessStatus: ptbPlan.readiness.status,
      hasExecution: Boolean(mintExecution),
      hasManagerReadback: Boolean(managerInventoryReadback),
      activeQuantityDusdc: managerInventoryReadback?.directActivePositionQuantityDusdc,
    }),
    [
      metrics.riskScore,
      recommendation.recommendedHedge,
      ptbPlan.readiness.status,
      mintExecution,
      managerInventoryReadback,
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
        mintExecution,
        executionRiskSummary,
        managerHistorySummary,
        managerInventoryReadback,
        executedStressSummary,
        ptbPlan,
      }),
    [
      metrics,
      allResults,
      recommendation,
      liveSnapshot?.liveContext,
      mintExecution,
      executionRiskSummary,
      managerHistorySummary,
      managerInventoryReadback,
      executedStressSummary,
      ptbPlan,
    ],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMintExecution(loadStoredMintExecution());
      setMintExecutionHistory(loadStoredMintExecutionHistory());
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const sectionIds = workflowNavItems.map((item) => item.sectionId);

    function updateActiveSection() {
      const current = sectionIds
        .map((sectionId) => {
          const element = document.getElementById(sectionId);
          if (!element) {
            return undefined;
          }

          return {
            sectionId,
            top: Math.abs(element.getBoundingClientRect().top - 120),
          };
        })
        .filter((item): item is { sectionId: string; top: number } => Boolean(item))
        .sort((left, right) => left.top - right.top)[0];

      if (current) {
        setActiveSectionId(current.sectionId);
      }
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPredictStatus() {
      try {
        const response = await fetch("/api/predict/status", {
          cache: "no-store",
        });
        const snapshot = (await response.json()) as PredictLiveSnapshot;
        if (active) {
          setLiveSnapshot(snapshot);
        }
      } catch (error: unknown) {
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
      } finally {
        if (active) {
          setLiveLoading(false);
        }
      }
    }

    void loadPredictStatus();
    const refreshTimer = window.setInterval(loadPredictStatus, 60_000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  function handleExecution(execution: PredictMintExecutionSummary) {
    setMintExecution(execution);
    storeMintExecution(execution);
    setMintExecutionHistory(loadStoredMintExecutionHistory());
  }

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
        </div>
      </section>

      <nav className="sticky top-0 z-30 border-b border-[#dce3dd] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-5 py-3 text-sm font-semibold lg:px-8">
          <div className="mr-2 hidden shrink-0 text-xs uppercase tracking-normal text-[#52615a] sm:block">
            Workflow
          </div>
          {workflowNavItems.map((item) => {
            const active = activeSectionId === item.sectionId;

            return (
              <a
                key={item.sectionId}
                href={item.href}
                className={`whitespace-nowrap rounded-md border px-3 py-2 transition ${
                  active
                    ? "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]"
                    : "border-[#dce3dd] bg-white text-[#52615a] hover:border-[#1f8a70] hover:text-[#1f8a70]"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>

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

        <section id="workflow">
          <DemoFlowPanel steps={demoFlowSteps} />
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
                {(chartWidth) => (
                  <LineChart
                    width={chartWidth}
                    height={288}
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
                )}
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
              {(chartWidth) => (
                <BarChart
                  width={chartWidth}
                  height={288}
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
              )}
            </ChartFrame>
            <ExecutedStressPanel summary={executedStressSummary} />
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
            <PtbExecuteClient
              input={ptbInput}
              plan={ptbPlan}
              maxHedgeBudgetDusdc={maxHedgeBudgetDusdc}
              onBudgetChange={setMaxHedgeBudgetDusdc}
              onExecution={handleExecution}
            />
            <ExecutionAdjustedRiskPanel summary={executionRiskSummary} />
            <div id="readback">
              <ManagerExecutionSummaryPanel
                summary={managerHistorySummary}
                inventory={managerInventoryReadback}
              />
            </div>
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
              <ConfigRow
                label="Execution strike"
                value={
                  ptbPlan.inputs.executionStrike
                    ? ptbPlan.inputs.executionStrike.toLocaleString("en-US")
                    : undefined
                }
              />
              <ConfigRow label="Strike scaled" value={ptbPlan.inputs.strikeScaled} />
              <ConfigRow label="Sizing mode" value={ptbPlan.inputs.sizingMode} />
              <ConfigRow label="Quote source" value={ptbPlan.inputs.quoteSource} />
              <ConfigRow label="Quote freshness" value={ptbPlan.inputs.quoteFreshness} />
              <ConfigRow
                label="Estimated cost"
                value={
                  ptbPlan.inputs.estimatedExecutionCostDusdc === undefined
                    ? undefined
                    : `${ptbPlan.inputs.estimatedExecutionCostDusdc.toLocaleString("en-US", {
                        maximumFractionDigits: 6,
                      })} dUSDC`
                }
              />
            </div>
            <pre className="max-h-96 overflow-auto rounded-md bg-[#17211d] p-4 text-xs leading-5 text-[#e8f4ef]">
              {buildPredictHedgeSdkSkeleton({
                hedge: ptbInput.hedge,
                account: ptbInput.account,
                oracleObjectId: ptbPlan.inputs.oracleObjectId,
                oracleExpiryMs: ptbPlan.inputs.oracleExpiryMs,
                oracleMinStrike: ptbPlan.inputs.oracleMinStrike,
                oracleTickSize: ptbPlan.inputs.oracleTickSize,
                oracleReferencePrice: ptbPlan.inputs.oracleReferencePrice,
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

type DemoFlowStep = {
  label: string;
  status: "complete" | "ready" | "blocked";
  value: string;
  detail: string;
};

function DemoFlowPanel({ steps }: { steps: DemoFlowStep[] }) {
  return (
    <Panel title="Demo Flow" icon={<CheckCircle2 className="h-5 w-5" />}>
      <div className="grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => (
          <a
            key={step.label}
            href={getDemoFlowHref(index)}
            className="rounded-md border border-[#dce3dd] bg-white p-3 transition hover:border-[#1f8a70]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-normal text-[#52615a]">
                {step.label}
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getDemoFlowStatusClass(step.status)}`}>
                {step.status}
              </span>
            </div>
            <div className="mt-3 text-lg font-semibold text-[#17211d]">
              {step.value}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#52615a]">
              {step.detail}
            </p>
          </a>
        ))}
      </div>
    </Panel>
  );
}

function ExecutedStressPanel({ summary }: { summary: ExecutedStressSummary }) {
  const visibleComparisons = summary.comparisons.slice(0, 4);

  return (
    <div className="mt-6 rounded-md border border-[#dce3dd] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[#17211d]">
            Executed stress comparison
          </div>
          <p className="mt-2 text-sm leading-6 text-[#52615a]">
            Compares the recommended hedge with the latest wallet-executed
            Predict position across multiple scenarios.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-[#52615a] sm:min-w-72">
          <SummaryTile
            label="Worst unhedged"
            value={`${summary.worstUnhedgedPnl.toFixed(0)} dUSDC`}
            danger
          />
          <SummaryTile
            label="Worst executed"
            value={
              summary.worstExecutedPnl === undefined
                ? "Pending"
                : `${summary.worstExecutedPnl.toFixed(0)} dUSDC`
            }
            danger={(summary.worstExecutedPnl ?? 0) < 0}
          />
        </div>
      </div>
      {summary.executedHedge ? (
        <div className="mt-3 grid gap-2 text-xs text-[#52615a] sm:grid-cols-3">
          <ConfigRow
            label="Executed hedge"
            value={`${summary.executedHedge.side} ${summary.executedHedge.strike.toLocaleString("en-US")}`}
          />
          <ConfigRow
            label="Executed quantity"
            value={`${summary.executedHedge.notional.toLocaleString("en-US", {
              maximumFractionDigits: 6,
            })} dUSDC`}
          />
          <ConfigRow
            label="Worst-case improvement"
            value={
              summary.executedWorstCaseImprovementDusdc === undefined
                ? undefined
                : `${summary.executedWorstCaseImprovementDusdc.toFixed(2)} dUSDC`
            }
          />
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-[#52615a]">
          Execute or load a wallet mint to compare actual hedge impact against
          the recommendation.
        </p>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-xs">
          <thead className="text-[#52615a]">
            <tr className="border-b border-[#dce3dd]">
              <th className="py-2 pr-3 font-semibold">Scenario</th>
              <th className="py-2 pr-3 font-semibold">Spot</th>
              <th className="py-2 pr-3 font-semibold">Unhedged</th>
              <th className="py-2 pr-3 font-semibold">Recommended</th>
              <th className="py-2 pr-3 font-semibold">Executed</th>
              <th className="py-2 pr-3 font-semibold">Executed reduction</th>
            </tr>
          </thead>
          <tbody>
            {visibleComparisons.map((comparison) => (
              <tr key={comparison.scenarioId} className="border-b border-[#eef2ee]">
                <td className="py-2 pr-3 font-semibold text-[#17211d]">
                  {comparison.scenarioName}
                </td>
                <td className="py-2 pr-3 text-[#52615a]">
                  {formatUsd(comparison.scenarioSpot)}
                </td>
                <td className="py-2 pr-3 text-[#c75c48]">
                  {comparison.unhedgedPnl.toFixed(0)}
                </td>
                <td className="py-2 pr-3 text-[#52615a]">
                  {comparison.recommendedHedgedPnl === undefined
                    ? "N/A"
                    : comparison.recommendedHedgedPnl.toFixed(0)}
                </td>
                <td className="py-2 pr-3 text-[#52615a]">
                  {comparison.executedHedgedPnl === undefined
                    ? "Pending"
                    : comparison.executedHedgedPnl.toFixed(0)}
                </td>
                <td className="py-2 pr-3 text-[#1f8a70]">
                  {comparison.executedTailLossReductionPct === undefined
                    ? "Pending"
                    : `${comparison.executedTailLossReductionPct.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildDemoFlowSteps(input: {
  riskScore: number;
  hasRecommendation: boolean;
  readinessStatus: string;
  hasExecution: boolean;
  hasManagerReadback: boolean;
  activeQuantityDusdc?: number;
}): DemoFlowStep[] {
  return [
    {
      label: "Risk",
      status: input.riskScore > 0 ? "complete" : "blocked",
      value: `${input.riskScore}/100`,
      detail: "PLP exposure and tail-loss risk are scored before recommending a hedge.",
    },
    {
      label: "Hedge",
      status: input.hasRecommendation ? "complete" : "blocked",
      value: input.hasRecommendation ? "Ready" : "None",
      detail: "PredictGuard selects a side, strike, expiry, and notional for protection.",
    },
    {
      label: "Wallet",
      status: input.readinessStatus === "ready-to-sign" ? "complete" : "ready",
      value: input.readinessStatus,
      detail: "PTB signing is gated by wallet, manager, coin, oracle, and package inputs.",
    },
    {
      label: "Execute",
      status: input.hasExecution ? "complete" : "ready",
      value: input.hasExecution ? "Minted" : "Pending",
      detail: "A wallet-approved Predict mint turns the recommendation into an on-chain position.",
    },
    {
      label: "Readback",
      status: input.hasManagerReadback ? "complete" : "ready",
      value:
        input.activeQuantityDusdc === undefined
          ? "Pending"
          : `${input.activeQuantityDusdc.toLocaleString("en-US", {
              maximumFractionDigits: 6,
            })} dUSDC`,
      detail: "Manager inventory is decoded into active, expired, zero, or unknown positions.",
    },
  ];
}

function getDemoFlowHref(index: number) {
  return ["#overview", "#hedge", "#ptb", "#ptb", "#ptb"][index] ?? "#overview";
}

function getDemoFlowStatusClass(status: DemoFlowStep["status"]) {
  if (status === "complete") {
    return "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]";
  }

  if (status === "ready") {
    return "border-[#d0a13a] bg-[#fff8e7] text-[#8a6416]";
  }

  return "border-[#c94f4f] bg-[#fff1ed] text-[#c75c48]";
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

function ExecutionAdjustedRiskPanel({
  summary,
}: {
  summary?: ExecutionAdjustedRiskSummary;
}) {
  if (!summary) {
    return (
      <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
        <div className="text-sm font-semibold text-[#17211d]">
          Execution-adjusted risk
        </div>
        <p className="mt-2 text-sm leading-6 text-[#52615a]">
          Execute a Predict mint to compare actual hedge quantity, cost, and
          coverage against the recommendation.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
      <div className="text-sm font-semibold text-[#17211d]">
        Execution-adjusted risk
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SummaryTile
          label="Coverage ratio"
          value={`${summary.coverageRatioPct.toFixed(2)}%`}
        />
        <SummaryTile
          label="Executed gap"
          value={`${summary.executedGapDusdc.toFixed(2)} dUSDC`}
        />
        <SummaryTile
          label="Actual cost ratio"
          value={
            summary.actualCostRatioPct === undefined
              ? "N/A"
              : `${summary.actualCostRatioPct.toFixed(2)}%`
          }
        />
        <SummaryTile
          label="Budget usage"
          value={
            summary.budgetUsagePct === undefined
              ? "N/A"
              : `${summary.budgetUsagePct.toFixed(2)}%`
          }
        />
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-[#52615a] sm:grid-cols-2">
        <ConfigRow
          label="Recommended notional"
          value={`${summary.recommendedNotionalDusdc.toLocaleString("en-US")} dUSDC`}
        />
        <ConfigRow
          label="Executed quantity"
          value={`${summary.executedQuantityDusdc.toLocaleString("en-US", {
            maximumFractionDigits: 6,
          })} dUSDC`}
        />
        <ConfigRow
          label="Deposited"
          value={
            summary.depositedDusdc === undefined
              ? undefined
              : `${summary.depositedDusdc.toLocaleString("en-US", {
                  maximumFractionDigits: 6,
                })} dUSDC`
          }
        />
        <ConfigRow
          label="Estimated manager remaining"
          value={
            summary.estimatedManagerRemainingDusdc === undefined
              ? undefined
              : `${summary.estimatedManagerRemainingDusdc.toLocaleString("en-US", {
                  maximumFractionDigits: 6,
                })} dUSDC`
          }
        />
      </dl>
    </div>
  );
}

function ManagerExecutionSummaryPanel({
  summary,
  inventory,
}: {
  summary?: ManagerExecutionHistorySummary;
  inventory?: PredictManagerInventoryReadback;
}) {
  if (!summary && !inventory) {
    return (
      <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
        <div className="text-sm font-semibold text-[#17211d]">
          Manager/account summary
        </div>
        <p className="mt-2 text-sm leading-6 text-[#52615a]">
          No local execution history yet. After minting, PredictGuard will
          estimate manager-side remaining dUSDC from deposited amount and actual
          mint cost.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
      <div className="text-sm font-semibold text-[#17211d]">
        Manager/account summary
      </div>
      {inventory ? (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <SummaryTile
              label="On-chain dUSDC"
              value={
                inventory.directDusdcBalance === undefined
                  ? "N/A"
                  : `${inventory.directDusdcBalance.toLocaleString("en-US", {
                      maximumFractionDigits: 6,
                    })} dUSDC`
              }
            />
            <SummaryTile
              label="On-chain positions"
              value={String(inventory.positionEntryCount ?? 0)}
            />
            <SummaryTile
              label="Position quantity"
              value={`${(inventory.directPositionQuantityDusdc ?? 0).toLocaleString("en-US", {
                maximumFractionDigits: 6,
              })} dUSDC`}
            />
            <SummaryTile
              label="Active quantity"
              value={`${(inventory.directActivePositionQuantityDusdc ?? 0).toLocaleString("en-US", {
                maximumFractionDigits: 6,
              })} dUSDC`}
            />
          </div>
          <dl className="mt-3 grid gap-2 text-xs text-[#52615a] sm:grid-cols-2">
            <ConfigRow label="Reconstructed at" value={formatIsoDateTime(inventory.reconstructedAtIso)} />
            <ConfigRow label="Balance entries" value={String(inventory.balanceEntryCount ?? 0)} />
            <ConfigRow label="Object version" value={inventory.objectVersion} />
            <ConfigRow label="Object digest" value={inventory.objectDigest} />
            <ConfigRow label="Positions table" value={inventory.positionsTableId} />
            <ConfigRow label="Balances table" value={inventory.balancesTableId} />
            <div className="sm:col-span-2">
              <ConfigRow label="Manager" value={inventory.managerObjectId} />
            </div>
          </dl>
          {inventory.positionEntries.length > 0 ? (
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#52615a]">
                Decoded positions
              </div>
              <div className="mt-2 space-y-2">
                {inventory.positionEntries.slice(0, 4).map((entry) => (
                  <div
                    key={entry.fieldId}
                    className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3 text-xs text-[#52615a]"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-semibold text-[#17211d]">
                          {entry.marketKey
                            ? `${entry.marketKey.side} ${entry.marketKey.strike.toLocaleString("en-US", {
                                maximumFractionDigits: 6,
                              })}`
                            : "Undecoded MarketKey"}
                        </div>
                        <div className={`mt-1 w-fit rounded-full border px-2 py-0.5 font-semibold ${getPositionStatusClass(entry.status.code)}`}>
                          {entry.status.label}
                        </div>
                      </div>
                      <div>
                        {(entry.quantityDusdc ?? 0).toLocaleString("en-US", {
                          maximumFractionDigits: 6,
                        })}{" "}
                        dUSDC
                      </div>
                    </div>
                    <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                      <ConfigRow
                        label="Expiry"
                        value={
                          entry.marketKey
                            ? formatIsoDateTime(entry.marketKey.expiryIso)
                            : undefined
                        }
                      />
                      <ConfigRow
                        label="Direction"
                        value={
                          entry.marketKey
                            ? `${entry.marketKey.direction} (${entry.marketKey.directionCode})`
                            : undefined
                        }
                      />
                      <div className="sm:col-span-2">
                        <ConfigRow label="Oracle" value={entry.marketKey?.oracleId} />
                      </div>
                    </dl>
                    <p className="mt-2 leading-5">
                      {entry.status.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <p className="mt-3 text-xs leading-5 text-[#52615a]">
            Direct chain readback via Sui gRPC. MarketKey is decoded from Table
            dynamic-field names; settlement-aware position reconstruction
            remains a follow-up task.
          </p>
        </>
      ) : null}
      {summary ? (
        <>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#52615a]">
            Local execution evidence
          </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SummaryTile
          label="Local executions"
          value={String(summary.executionCount)}
        />
        <SummaryTile
          label="Total minted"
          value={`${summary.totalQuantityDusdc.toLocaleString("en-US", {
            maximumFractionDigits: 6,
          })} dUSDC`}
        />
        <SummaryTile
          label="Total actual cost"
          value={`${summary.totalActualCostDusdc.toLocaleString("en-US", {
            maximumFractionDigits: 6,
          })} dUSDC`}
        />
        <SummaryTile
          label="Est. manager remaining"
          value={`${summary.estimatedManagerRemainingDusdc.toLocaleString("en-US", {
            maximumFractionDigits: 6,
          })} dUSDC`}
        />
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-[#52615a] sm:grid-cols-2">
        <ConfigRow
          label="Total deposited"
          value={`${summary.totalDepositedDusdc.toLocaleString("en-US", {
            maximumFractionDigits: 6,
          })} dUSDC`}
        />
        <ConfigRow label="Latest digest" value={summary.latestDigest} />
        <div className="sm:col-span-2">
          <ConfigRow label="Manager" value={summary.managerId} />
        </div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-[#52615a]">
        Local event-history estimate retained for comparison with direct
        manager object readback.
      </p>
        </>
      ) : null}
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
        <ConfigRow label="dUSDC balance" value={plan.inputs.dusdcBalanceMist} />
        <ConfigRow
          label="PredictManager"
          value={
            plan.inputs.managerFound === undefined
              ? undefined
              : plan.inputs.managerFound
                ? "Found"
                : "Missing"
          }
        />
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
  children: (width: number) => React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(0);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mounted || !frameRef.current) {
      return;
    }

    const target = frameRef.current;
    const updateWidth = () => {
      setWidth(Math.max(0, Math.floor(target.getBoundingClientRect().width)));
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(target);

    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) {
    return (
      <div
        className={`flex h-72 items-center justify-center rounded-md border border-[#dce3dd] bg-[#f5f7f4] text-sm text-[#52615a] ${className}`}
      >
        Loading chart
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className={`h-72 min-h-72 w-full min-w-0 overflow-hidden ${className}`}
    >
      {width > 0 ? (
        children(width)
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-[#52615a]">
          Loading chart
        </div>
      )}
    </div>
  );
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

function formatIsoDateTime(value: string) {
  return value.replace("T", " ").replace(".000Z", " UTC");
}

function getPositionStatusClass(status: string) {
  if (status === "active") {
    return "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]";
  }

  if (status === "expired") {
    return "border-[#d0a13a] bg-[#fff8e7] text-[#8a6416]";
  }

  if (status === "zero") {
    return "border-[#dce3dd] bg-white text-[#52615a]";
  }

  return "border-[#c94f4f] bg-[#fff1f1] text-[#9a2f2f]";
}
