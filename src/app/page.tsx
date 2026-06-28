"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  Bot,
  BriefcaseBusiness,
  ClipboardList,
  CheckCircle2,
  Download,
  FileText,
  Layers,
  LineChart as LineChartIcon,
  Network,
  Rocket,
  ShieldCheck,
  Signal,
  Users,
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
  type PredictRedeemExecutionSummary,
} from "@/lib/predict/execution";
import type {
  PredictManagerInventoryReadback,
  PredictManagerPositionEntry,
} from "@/lib/predict/managerReadback";
import type { PredictRedeemEvidenceReadback } from "@/lib/predict/redeemReadback";
import type { PredictRedeemHistoryReadback } from "@/lib/predict/redeemHistoryReadback";
import type { PredictVaultSettlementReadback } from "@/lib/predict/vaultSettlementReadback";
import type { SizingModeOverride } from "@/lib/ptb/hedgeTransaction";
import { buildPredictHedgePtbPlan, buildPredictHedgeSdkSkeleton } from "@/lib/ptb/hedgeTransaction";
import {
  buildPredictRedeemPreviewPlan,
  buildPredictRedeemSdkSkeleton,
  type PredictRedeemPreviewPlan,
} from "@/lib/ptb/redeemTransaction";
import { formatPtbReadinessLabel } from "@/lib/ptb/preview";
import type { PredictHedgePtbPlan, WalletReadinessInput } from "@/lib/ptb/hedgeTransaction";
import { buildMarkdownReport } from "@/lib/report/markdown";
import { buildCommercialReport } from "@/lib/report/commercial";
import {
  buildProductSnapshot,
  saveSnapshotToHistory,
  stringifySnapshot,
} from "@/lib/report/snapshot";
import { buildLifecycleReviewQueue } from "@/lib/risk/lifecycle";
import { buildExposureMatrix, computeRiskMetrics, runScenarioSet } from "@/lib/risk/engine";
import {
  buildExecutedStressSummary,
  type ExecutedStressSummary,
} from "@/lib/risk/executedStress";
import { buildHedgeRecommendation } from "@/lib/risk/hedge";
import { evaluateMonitoringRules } from "@/lib/risk/monitoring";
import type { HedgeCandidate, Side } from "@/lib/types";

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
  { label: "Product", href: "#product", sectionId: "product" },
  { label: "Demo", href: "#workflow", sectionId: "workflow" },
  { label: "Risk", href: "#overview", sectionId: "overview" },
  { label: "Hedge", href: "#hedge", sectionId: "hedge" },
  { label: "Execute", href: "#ptb", sectionId: "ptb" },
  { label: "Readback", href: "#readback", sectionId: "readback" },
  { label: "Report", href: "#report", sectionId: "report" },
];

const commercialSignals = [
  {
    label: "Primary user",
    value: "Predict LPs and vault builders",
    detail: "Teams that need to explain tail risk before allocating capital.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Core workflow",
    value: "Exposure -> hedge -> evidence",
    detail: "A risk operations loop, not a directional trading assistant.",
    icon: <Network className="h-5 w-5" />,
  },
  {
    label: "Commercial wedge",
    value: "Risk reports and monitoring",
    detail: "Exportable evidence, alerts, and team dashboards are the first paid surface.",
    icon: <BriefcaseBusiness className="h-5 w-5" />,
  },
];

const productRoadmapItems = [
  {
    title: "Risk dashboard",
    detail: "Multi-manager exposure, max payout liability, active/expired positions, and scenario PnL.",
    icon: <LineChartIcon className="h-5 w-5" />,
  },
  {
    title: "Risk copilot",
    detail: "Plain-English explanations, assumptions, residual risk, and LP-facing report copy.",
    icon: <Bot className="h-5 w-5" />,
  },
  {
    title: "Monitoring",
    detail: "Oracle freshness, utilization, lifecycle, settlement, and hedge threshold alerts.",
    icon: <BellRing className="h-5 w-5" />,
  },
  {
    title: "Execution evidence",
    detail: "Wallet-confirmed PTBs, digest tracking, manager readback, and settlement reconciliation.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
];

type RedeemEvidenceLink = {
  entryFieldId: string;
  evidence: PredictRedeemExecutionSummary;
  confidence: "matched-manager-oracle-side-strike";
};

type SettlementAccountingSummary = {
  totalPositions: number;
  activePositions: number;
  expiredPositions: number;
  zeroQuantityPositions: number;
  redeemedPositions: number;
  evidenceMissingPositions: number;
  totalCurrentQuantityDusdc: number;
  totalRedeemedQuantityDusdc: number;
  totalPayoutDusdc: number;
  totalUnresolvedQuantityDusdc: number;
  externalExecutorRedeems: number;
  totalMintedQuantityDusdc: number;
  totalMintCostDusdc: number;
  realizedHedgePnlDusdc?: number;
  claimedPayoutDusdc: number;
  unclaimedPayoutDusdc?: number;
  accountingScope: "loaded-history" | "local-and-loaded-history" | "none";
  status: "no-manager" | "needs-evidence" | "partial-evidence" | "evidence-linked";
  explanation: string;
};

function overrideHedgeSide(
  hedge: HedgeCandidate | undefined,
  side: Side,
): HedgeCandidate | undefined {
  return hedge ? { ...hedge, side } : undefined;
}

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
  const [redeemEvidenceReadback, setRedeemEvidenceReadback] =
    useState<PredictRedeemEvidenceReadback | null>(null);
  const [redeemHistoryReadback, setRedeemHistoryReadback] =
    useState<PredictRedeemHistoryReadback | null>(null);
  const [vaultSettlementReadback, setVaultSettlementReadback] =
    useState<PredictVaultSettlementReadback | null>(null);
  const [maxHedgeBudgetDusdc, setMaxHedgeBudgetDusdc] = useState(2);
  const [selectedOracleId, setSelectedOracleId] = useState<string | null>(null);
  const [executionSide, setExecutionSide] = useState<Side>("YES");
  const [sizingModeOverride, setSizingModeOverride] =
    useState<SizingModeOverride>("auto");
  const [activeSectionId, setActiveSectionId] = useState("workflow");
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0];

  const exposureMatrix = useMemo(() => buildExposureMatrix(market), []);
  const metrics = useMemo(() => computeRiskMetrics(market, scenarios), []);
  const recommendation = useMemo(() => buildHedgeRecommendation(market, scenarios), []);
  const activeOracleOptions = useMemo(
    () => liveSnapshot?.liveContext?.activeOracles ?? [],
    [liveSnapshot?.liveContext?.activeOracles],
  );
  const selectedOracle = useMemo(
    () =>
      activeOracleOptions.find((oracle) => oracle.oracleId === selectedOracleId) ??
      liveSnapshot?.liveContext?.latestActiveOracle,
    [activeOracleOptions, liveSnapshot?.liveContext?.latestActiveOracle, selectedOracleId],
  );
  const executionHedge = useMemo(
    () => overrideHedgeSide(recommendation.recommendedHedge, executionSide),
    [recommendation.recommendedHedge, executionSide],
  );
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
      hedge: executionHedge,
      wallet: walletReadiness,
      account: walletReadiness.account,
      oracleObjectId: selectedOracle?.oracleId,
      oracleExpiryMs: selectedOracle?.expiry,
      oracleMinStrike: selectedOracle?.minStrike,
      oracleTickSize: selectedOracle?.tickSize,
      oracleReferencePrice: selectedOracle?.referencePrice,
      quoteAskPrice: mintExecution?.askPrice,
      sizingModeOverride,
      maxHedgeBudgetDusdc,
    }),
    [
      executionHedge,
      walletReadiness,
      selectedOracle?.expiry,
      selectedOracle?.minStrike,
      selectedOracle?.oracleId,
      selectedOracle?.referencePrice,
      selectedOracle?.tickSize,
      mintExecution?.askPrice,
      sizingModeOverride,
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
  const redeemEvidenceReadbacks = useMemo(
    () =>
      redeemHistoryReadback?.readbacks.length
        ? redeemHistoryReadback.readbacks
        : redeemEvidenceReadback
          ? [redeemEvidenceReadback]
          : [],
    [redeemEvidenceReadback, redeemHistoryReadback],
  );
  const redeemExecution = redeemEvidenceReadbacks[0]?.summary ?? null;
  const redeemSummaries = useMemo(
    () => dedupeRedeemSummaries(
      redeemEvidenceReadbacks.flatMap((readback) => readback.summaries),
    ),
    [redeemEvidenceReadbacks],
  );
  const redeemEvidenceLinks = useMemo(
    () => buildRedeemEvidenceLinks(managerInventoryReadback, redeemSummaries),
    [managerInventoryReadback, redeemSummaries],
  );
  const settlementAccounting = useMemo(
    () => buildSettlementAccountingSummary(
      managerInventoryReadback,
      redeemEvidenceLinks,
      mintExecutionHistory,
    ),
    [managerInventoryReadback, mintExecutionHistory, redeemEvidenceLinks],
  );
  const lifecycleQueue = useMemo(
    () => buildLifecycleReviewQueue(managerInventoryReadback),
    [managerInventoryReadback],
  );
  const monitoringRules = useMemo(
    () =>
      evaluateMonitoringRules({
        market,
        metrics,
        recommendation,
        liveContext: liveSnapshot?.liveContext,
        inventory: managerInventoryReadback,
      }),
    [metrics, recommendation, liveSnapshot?.liveContext, managerInventoryReadback],
  );
  const redeemOracleIds = useMemo(
    () =>
      Array.from(
        new Set(
          managerInventoryReadback?.positionEntries
            .map((entry) => entry.marketKey?.oracleId)
            .filter((oracleId): oracleId is string => Boolean(oracleId)) ?? [],
        ),
      ),
    [managerInventoryReadback],
  );
  const redeemOracleIdsKey = redeemOracleIds.join(",");
  const redeemPreviewPlan = useMemo(
    () =>
      buildPredictRedeemPreviewPlan({
        inventory: managerInventoryReadback,
        oracles: liveSnapshot?.oracles,
        vaultSettlement: redeemOracleIds.length > 0
          ? vaultSettlementReadback ?? undefined
          : undefined,
        walletAddress: walletReadiness.address,
      }),
    [
      managerInventoryReadback,
      liveSnapshot?.oracles,
      redeemOracleIds.length,
      vaultSettlementReadback,
      walletReadiness.address,
    ],
  );
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
        redeemExecution,
        redeemHistoryReadback,
        executionRiskSummary,
        managerHistorySummary,
        managerInventoryReadback,
        redeemEvidenceLinks,
        settlementAccounting,
        redeemPreviewPlan,
        executedStressSummary,
        ptbPlan,
        monitoringRules,
        lifecycleQueue,
      }),
    [
      metrics,
      allResults,
      recommendation,
      liveSnapshot?.liveContext,
      mintExecution,
      redeemExecution,
      redeemHistoryReadback,
      executionRiskSummary,
      managerHistorySummary,
      managerInventoryReadback,
      redeemEvidenceLinks,
      settlementAccounting,
      redeemPreviewPlan,
      executedStressSummary,
      ptbPlan,
      monitoringRules,
      lifecycleQueue,
    ],
  );
  const commercialReport = useMemo(
    () =>
      buildCommercialReport({
        market,
        metrics,
        scenarios,
        results: allResults,
        recommendation,
        liveContext: liveSnapshot?.liveContext,
        mintExecution,
        redeemExecution,
        redeemHistoryReadback,
        executionRiskSummary,
        managerHistorySummary,
        managerInventoryReadback,
        redeemEvidenceLinks,
        settlementAccounting,
        redeemPreviewPlan,
        executedStressSummary,
        ptbPlan,
        monitoringRules,
        lifecycleQueue,
      }),
    [
      metrics,
      allResults,
      recommendation,
      liveSnapshot?.liveContext,
      mintExecution,
      redeemExecution,
      redeemHistoryReadback,
      executionRiskSummary,
      managerHistorySummary,
      managerInventoryReadback,
      redeemEvidenceLinks,
      settlementAccounting,
      redeemPreviewPlan,
      executedStressSummary,
      ptbPlan,
      monitoringRules,
      lifecycleQueue,
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

  useEffect(() => {
    const controller = new AbortController();
    const managerId = managerInventoryReadback?.managerObjectId;

    async function loadRedeemEvidence() {
      try {
        const response = managerId
          ? await fetch(
              `/api/predict/redeem-history?manager=${encodeURIComponent(managerId)}`,
              {
                cache: "no-store",
                signal: controller.signal,
              },
            )
          : await fetch("/api/predict/redeem-evidence", {
              cache: "no-store",
              signal: controller.signal,
            });

        if (!response.ok) {
          throw new Error(`Redeem evidence readback returned ${response.status}`);
        }

        if (managerId) {
          const readback = (await response.json()) as PredictRedeemHistoryReadback;

          setRedeemHistoryReadback(readback);
          setRedeemEvidenceReadback(readback.readbacks[0] ?? null);
          return;
        }

        const readback = (await response.json()) as PredictRedeemEvidenceReadback;
        setRedeemHistoryReadback(null);
        setRedeemEvidenceReadback(readback);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setRedeemHistoryReadback(null);
        setRedeemEvidenceReadback(null);
      }
    }

    void loadRedeemEvidence();

    return () => controller.abort();
  }, [managerInventoryReadback?.managerObjectId]);

  useEffect(() => {
    if (redeemOracleIds.length === 0) {
      const frame = window.requestAnimationFrame(() => {
        setVaultSettlementReadback(null);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const controller = new AbortController();

    async function loadVaultSettlementReadback() {
      try {
        const response = await fetch(
          `/api/predict/vault-settlement?oracles=${encodeURIComponent(redeemOracleIdsKey)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Vault settlement readback returned ${response.status}`);
        }

        setVaultSettlementReadback(
          (await response.json()) as PredictVaultSettlementReadback,
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setVaultSettlementReadback(null);
      }
    }

    void loadVaultSettlementReadback();

    return () => controller.abort();
  }, [redeemOracleIds.length, redeemOracleIdsKey]);

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

  function exportSnapshot() {
    const snapshot = buildProductSnapshot({
      report: commercialReport,
      monitoring: monitoringRules,
      lifecycleQueue,
    });
    const blob = new Blob([stringifySnapshot(snapshot)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "predictguard-risk-snapshot.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function saveSnapshot() {
    const snapshot = buildProductSnapshot({
      report: commercialReport,
      monitoring: monitoringRules,
      lifecycleQueue,
    });
    saveSnapshotToHistory(snapshot);
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
              <div className="flex items-center gap-4">
                <img
                  src="/logo.png"
                  alt="PredictGuard logo"
                  className="h-16 w-16 shrink-0 rounded-2xl border border-[#dce3dd] bg-[#17211d] object-cover shadow-[0_12px_28px_rgba(23,33,29,0.14)] md:h-20 md:w-20"
                />
                <h1 className="text-4xl font-semibold tracking-normal text-[#17211d] md:text-6xl">
                  PredictGuard
                </h1>
              </div>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#52615a] md:text-lg">
                RiskOps for prediction-market liquidity. Inspect exposure, stress
                tail events, simulate hedges, and produce evidence-backed risk
                reports for DeepBook Predict and future prediction-market adapters.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="#workflow"
                  className="inline-flex items-center gap-2 rounded-md bg-[#17211d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f8a70]"
                >
                  <Rocket className="h-4 w-4" />
                  Open live workflow
                </a>
                <a
                  href="/report/sample"
                  className="inline-flex items-center gap-2 rounded-md border border-[#dce3dd] bg-white px-4 py-2 text-sm font-semibold text-[#17211d] transition hover:border-[#1f8a70] hover:text-[#1f8a70]"
                >
                  <FileText className="h-4 w-4" />
                  Review sample report
                </a>
                <a
                  href="/reports"
                  className="inline-flex items-center gap-2 rounded-md border border-[#dce3dd] bg-white px-4 py-2 text-sm font-semibold text-[#17211d] transition hover:border-[#1f8a70] hover:text-[#1f8a70]"
                >
                  <ClipboardList className="h-4 w-4" />
                  Saved reports
                </a>
                <a
                  href="/monitoring"
                  className="inline-flex items-center gap-2 rounded-md border border-[#dce3dd] bg-white px-4 py-2 text-sm font-semibold text-[#17211d] transition hover:border-[#1f8a70] hover:text-[#1f8a70]"
                >
                  <BellRing className="h-4 w-4" />
                  Monitoring
                </a>
              </div>
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

      <div className="mx-auto grid max-w-7xl min-w-0 gap-6 px-5 py-6 lg:px-8">
        <section id="product" className="scroll-mt-24 grid min-w-0 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel title="Commercial Product Direction" icon={<BriefcaseBusiness className="h-5 w-5" />}>
            <div className="grid gap-3">
              {commercialSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#52615a]">
                    <span className="text-[#1f8a70]">{signal.icon}</span>
                    {signal.label}
                  </div>
                  <div className="mt-2 text-base font-semibold text-[#17211d]">
                    {signal.value}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#52615a]">
                    {signal.detail}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Productized Roadmap" icon={<Rocket className="h-5 w-5" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              {productRoadmapItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-md border border-[#dce3dd] bg-white p-4"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#17211d]">
                    <span className="text-[#1f8a70]">{item.icon}</span>
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#52615a]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4 text-sm leading-6 text-[#52615a]">
              PredictGuard remains non-custodial and evidence-first. It prepares
              risk analysis and transaction shapes, while the connected wallet owns
              signing, gas selection, and final execution.
            </div>
          </Panel>
        </section>

        <section id="overview" className="scroll-mt-24 grid min-w-0 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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

        <section id="risk-score" className="scroll-mt-24 min-w-0">
          <Panel title="Risk Score Drivers" icon={<Signal className="h-5 w-5" />}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {metrics.riskScoreComponents.map((component) => (
                <div
                  key={component.id}
                  className="rounded-md border border-[#dce3dd] bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[#17211d]">
                      {component.label}
                    </div>
                    <div className="text-sm font-semibold text-[#1f8a70]">
                      {component.contribution.toFixed(1)} / {component.weight}
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8f4ef]">
                    <div
                      className="h-full rounded-full bg-[#1f8a70]"
                      style={{ width: `${Math.min(100, component.score * 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#52615a]">
                    {component.explanation}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section id="workflow" className="scroll-mt-24 min-w-0">
          <DemoFlowPanel steps={demoFlowSteps} />
        </section>

        <section id="testnet" className="scroll-mt-24 min-w-0">
          <TestnetStatusPanel snapshot={liveSnapshot} loading={liveLoading} />
        </section>

        <section id="exposure" className="scroll-mt-24 grid min-w-0 gap-6 lg:grid-cols-[1fr_360px]">
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

        <section id="vol-surface" className="scroll-mt-24 min-w-0">
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

        <section id="scenario-library" className="scroll-mt-24 min-w-0">
          <Panel title="Scenario Library" icon={<ClipboardList className="h-5 w-5" />}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={`rounded-md border p-4 text-left transition ${
                    selectedScenarioId === scenario.id
                      ? "border-[#1f8a70] bg-[#e8f4ef]"
                      : "border-[#dce3dd] bg-white hover:border-[#1f8a70]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#17211d]">
                        {scenario.name}
                      </div>
                      <div className="mt-1 text-xs uppercase text-[#52615a]">
                        {scenario.category.replace("-", " ")}
                      </div>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getScenarioSeverityClass(scenario.severity)}`}>
                      {scenario.severity}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#52615a]">
                    {scenario.operationalUse}
                  </p>
                </button>
              ))}
            </div>
          </Panel>
        </section>

        <section id="simulator" className="scroll-mt-24 grid min-w-0 gap-6 lg:grid-cols-[360px_1fr]">
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

        <section id="hedge" className="scroll-mt-24 grid min-w-0 gap-6 lg:grid-cols-[1fr_0.8fr]">
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

        <section id="ptb" className="scroll-mt-24 grid min-w-0 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Panel title="PTB Preview" icon={<WalletCards className="h-5 w-5" />}>
            <WalletReadinessPanel plan={ptbPlan} onChange={setWalletReadiness} />
            <PtbReadinessPanel plan={ptbPlan} />
            <PtbExecuteClient
              input={ptbInput}
              plan={ptbPlan}
              maxHedgeBudgetDusdc={maxHedgeBudgetDusdc}
              onBudgetChange={setMaxHedgeBudgetDusdc}
              oracleOptions={activeOracleOptions}
              selectedOracleId={selectedOracle?.oracleId}
              onOracleChange={setSelectedOracleId}
              executionSide={executionSide}
              onExecutionSideChange={setExecutionSide}
              sizingModeOverride={sizingModeOverride}
              onSizingModeChange={setSizingModeOverride}
              onExecution={handleExecution}
            />
            <ExecutionAdjustedRiskPanel summary={executionRiskSummary} />
            <div id="readback" className="scroll-mt-24 min-w-0">
              <ManagerExecutionSummaryPanel
                summary={managerHistorySummary}
                inventory={managerInventoryReadback}
                redeemLinks={redeemEvidenceLinks}
                settlementAccounting={settlementAccounting}
              />
              <RedeemEvidencePanel
                historyReadback={redeemHistoryReadback}
                readbacks={redeemEvidenceReadbacks}
              />
              <RedeemPreviewPanel plan={redeemPreviewPlan} />
            </div>
            <LifecycleQueuePanel items={lifecycleQueue} />
            <MonitoringRulesPanel rules={monitoringRules} />
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
                quoteAskPrice: ptbInput.quoteAskPrice,
                sizingModeOverride: ptbInput.sizingModeOverride,
                maxHedgeBudgetDusdc: ptbInput.maxHedgeBudgetDusdc,
              })}
            </pre>
          </Panel>
        </section>

        <section id="report" className="scroll-mt-24 min-w-0">
          <Panel
            title="Risk Report"
            icon={<FileText className="h-5 w-5" />}
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportSnapshot}
                  className="inline-flex items-center gap-2 rounded-md border border-[#dce3dd] bg-white px-3 py-2 text-sm font-semibold text-[#17211d] transition hover:border-[#1f8a70] hover:text-[#1f8a70]"
                >
                  <Download className="h-4 w-4" />
                  Export Snapshot
                </button>
                <button
                  type="button"
                  onClick={saveSnapshot}
                  className="inline-flex items-center gap-2 rounded-md border border-[#dce3dd] bg-white px-3 py-2 text-sm font-semibold text-[#17211d] transition hover:border-[#1f8a70] hover:text-[#1f8a70]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save Snapshot
                </button>
                <button
                  type="button"
                  onClick={exportReport}
                  className="inline-flex items-center gap-2 rounded-md bg-[#17211d] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1f8a70]"
                >
                  <Download className="h-4 w-4" />
                  Export Markdown
                </button>
              </div>
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

function LifecycleQueuePanel({
  items,
}: {
  items: ReturnType<typeof buildLifecycleReviewQueue>;
}) {
  return (
    <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
      <div className="text-sm font-semibold text-[#17211d]">
        Lifecycle review queue
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#17211d]">{item.label}</div>
                <div className="mt-1 text-xs text-[#52615a]">{item.detail}</div>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getLifecycleQueueStatusClass(item.status)}`}>
                {item.count}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#52615a]">
              {item.operatorAction}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonitoringRulesPanel({
  rules,
}: {
  rules: ReturnType<typeof evaluateMonitoringRules>;
}) {
  return (
    <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
      <div className="text-sm font-semibold text-[#17211d]">
        Monitoring rules
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#17211d]">{rule.label}</div>
                <div className="mt-1 text-xs text-[#52615a]">{rule.threshold}</div>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getMonitoringRuleStatusClass(rule.status)}`}>
                {rule.status}
              </span>
            </div>
            <div className="mt-3 text-sm font-semibold text-[#17211d]">{rule.value}</div>
            <p className="mt-2 text-xs leading-5 text-[#52615a]">{rule.detail}</p>
            <p className="mt-2 text-xs leading-5 text-[#1f8a70]">{rule.commercialUse}</p>
          </div>
        ))}
      </div>
    </div>
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

function getScenarioSeverityClass(severity: string) {
  if (severity === "critical") {
    return "border-[#c75c48] bg-[#fff1ed] text-[#c75c48]";
  }

  if (severity === "high") {
    return "border-[#c98220] bg-[#fff7ea] text-[#9a5d0a]";
  }

  return "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]";
}

function getLifecycleQueueStatusClass(status: string) {
  if (status === "complete") {
    return "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]";
  }

  if (status === "active") {
    return "border-[#1f8a70] bg-white text-[#1f8a70]";
  }

  if (status === "review") {
    return "border-[#c98220] bg-[#fff7ea] text-[#9a5d0a]";
  }

  return "border-[#c75c48] bg-[#fff1ed] text-[#c75c48]";
}

function getMonitoringRuleStatusClass(status: string) {
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
  redeemLinks,
  settlementAccounting,
}: {
  summary?: ManagerExecutionHistorySummary;
  inventory?: PredictManagerInventoryReadback;
  redeemLinks: RedeemEvidenceLink[];
  settlementAccounting: SettlementAccountingSummary;
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
                {inventory.positionEntries.slice(0, 4).map((entry) => {
                  const redeemLink = redeemLinks.find((link) => link.entryFieldId === entry.fieldId);

                  return (
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
                          <div className="mt-1 flex flex-wrap gap-1">
                            <div className={`w-fit rounded-full border px-2 py-0.5 font-semibold ${getPositionStatusClass(entry.status.code)}`}>
                              {entry.status.label}
                            </div>
                            <div className={`w-fit rounded-full border px-2 py-0.5 font-semibold ${getLifecycleStatusClass(entry.lifecycle.code)}`}>
                              {entry.lifecycle.label}
                            </div>
                            {redeemLink ? (
                              <div className="w-fit rounded-full border border-[#1f8a70] bg-[#e8f4ef] px-2 py-0.5 font-semibold text-[#1f8a70]">
                                Redeem evidence linked
                              </div>
                            ) : null}
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
                      <p className="mt-2 leading-5">
                        {entry.lifecycle.explanation}
                      </p>
                      {redeemLink ? (
                        <div className="mt-3 rounded-md border border-[#cfe2d8] bg-white p-3">
                          <div className="text-xs font-semibold text-[#17211d]">
                            Matched redeem evidence
                          </div>
                          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                            <ConfigRow label="Payout" value={formatDusdcValue(redeemLink.evidence.payoutDusdc)} />
                            <ConfigRow label="Quantity" value={formatDusdcValue(redeemLink.evidence.quantityDusdc)} />
                            <ConfigRow label="Executor" value={shortObjectId(redeemLink.evidence.executor)} />
                            <ConfigRow label="Match" value="manager/oracle/side/strike" />
                          </dl>
                          <a
                            href={`https://testnet.suivision.xyz/txblock/${redeemLink.evidence.digest}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex w-fit rounded-md border border-[#1f8a70] px-3 py-2 text-xs font-semibold text-[#1f8a70] hover:bg-[#e8f4ef]"
                          >
                            View matched redeem
                          </a>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="mt-4 rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#52615a]">
              Lifecycle / redeem readiness
            </div>
            <p className="mt-2 text-xs leading-5 text-[#52615a]">
              PredictGuard now classifies each decoded position for lifecycle
              follow-up. This is read-only evidence: expired or zero-quantity
              entries still need PositionRedeemed history plus oracle/vault
              settlement state before the app can prove payout or redeemability.
            </p>
          </div>
          <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#52615a]">
                  Settlement accounting
                </div>
                <p className="mt-2 text-xs leading-5 text-[#52615a]">
                  {settlementAccounting.explanation}
                </p>
              </div>
              <div className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getSettlementAccountingStatusClass(settlementAccounting.status)}`}>
                {formatSettlementAccountingStatus(settlementAccounting.status)}
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <SummaryTile
                label="Redeemed linked"
                value={String(settlementAccounting.redeemedPositions)}
              />
              <SummaryTile
                label="Evidence missing"
                value={String(settlementAccounting.evidenceMissingPositions)}
              />
              <SummaryTile
                label="Redeemed payout"
                value={formatDusdcValue(settlementAccounting.totalPayoutDusdc)}
              />
              <SummaryTile
                label="External redeems"
                value={String(settlementAccounting.externalExecutorRedeems)}
              />
              <SummaryTile
                label="Realized hedge PnL"
                value={formatDusdcValue(settlementAccounting.realizedHedgePnlDusdc)}
              />
              <SummaryTile
                label="Mint cost"
                value={formatDusdcValue(settlementAccounting.totalMintCostDusdc)}
              />
            </div>
            <dl className="mt-3 grid gap-2 text-xs text-[#52615a] sm:grid-cols-2">
              <ConfigRow label="Active positions" value={String(settlementAccounting.activePositions)} />
              <ConfigRow label="Expired positions" value={String(settlementAccounting.expiredPositions)} />
              <ConfigRow label="Zero quantity" value={String(settlementAccounting.zeroQuantityPositions)} />
              <ConfigRow label="Minted quantity" value={formatDusdcValue(settlementAccounting.totalMintedQuantityDusdc)} />
              <ConfigRow label="Current quantity" value={formatDusdcValue(settlementAccounting.totalCurrentQuantityDusdc)} />
              <ConfigRow label="Redeemed quantity" value={formatDusdcValue(settlementAccounting.totalRedeemedQuantityDusdc)} />
              <ConfigRow label="Claimed payout" value={formatDusdcValue(settlementAccounting.claimedPayoutDusdc)} />
              <ConfigRow label="Unclaimed payout" value={settlementAccounting.unclaimedPayoutDusdc === undefined ? "Unknown" : formatDusdcValue(settlementAccounting.unclaimedPayoutDusdc)} />
              <ConfigRow label="Unresolved quantity" value={formatDusdcValue(settlementAccounting.totalUnresolvedQuantityDusdc)} />
              <ConfigRow label="Scope" value={settlementAccounting.accountingScope} />
            </dl>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#52615a]">
            Direct chain readback via Sui gRPC. MarketKey is decoded from Table
            dynamic-field names. Lifecycle readiness is read-only and does not
            prove redeemability without PositionRedeemed history plus oracle/vault
            settlement state.
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

function RedeemEvidencePanel({
  historyReadback,
  readbacks,
}: {
  historyReadback?: PredictRedeemHistoryReadback | null;
  readbacks: PredictRedeemEvidenceReadback[];
}) {
  const readback = readbacks[0] ?? null;
  const evidence = readback?.summary ?? null;

  if (!evidence) {
    return (
      <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
        <div className="text-sm font-semibold text-[#17211d]">
          Redeem evidence readback
        </div>
        <p className="mt-2 text-sm leading-6 text-[#52615a]">
          No historical PositionRedeemed evidence has been loaded yet. The
          current active position still needs expiry and settlement checks before
          live redeem execution.
        </p>
        {readback ? (
          <dl className="mt-3 grid gap-2 text-xs text-[#52615a] sm:grid-cols-2">
            <ConfigRow label="Digest" value={readback.digest} />
            <ConfigRow label="Events found" value={readback.eventCount.toString()} />
            <ConfigRow label="Match status" value={readback.matchStatus} />
          </dl>
        ) : null}
        {historyReadback ? (
          <RedeemHistoryScanSummary history={historyReadback} />
        ) : null}
      </div>
    );
  }

  const permissionlessLabel = readback?.permissionlessExecution
    ? "External executor"
    : "Owner executor";

  return (
    <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[#17211d]">
            Redeem evidence readback
          </div>
          <p className="mt-2 text-sm leading-6 text-[#52615a]">
            Historical DeepBook Predict redeem transaction parsed from the
            official PositionRedeemed event.
          </p>
          {readback?.permissionlessExecution ? (
            <p className="mt-2 text-sm leading-6 text-[#52615a]">
              This is a permissionless redeem: an external executor submitted
              the transaction, while the payout is credited to the owner&apos;s
              PredictManager.
            </p>
          ) : null}
          {historyReadback ? (
            <p className="mt-2 text-sm leading-6 text-[#52615a]">
              Redeem history discovery scanned recent PositionRedeemed events
              and loaded {historyReadback.readbacks.length} matching digest
              {historyReadback.readbacks.length === 1 ? "" : "s"} for this
              manager.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-fit rounded-full border border-[#1f8a70] bg-[#e8f4ef] px-3 py-1 text-xs font-semibold text-[#1f8a70]">
            {evidence.status}
          </div>
          <div className="w-fit rounded-full border border-[#d0a13a] bg-[#fff8e7] px-3 py-1 text-xs font-semibold text-[#8a6416]">
            {permissionlessLabel}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SummaryTile
          label="Redeemed position"
          value={`${evidence.side ?? "N/A"} ${evidence.strike?.toLocaleString("en-US") ?? "N/A"}`}
        />
        <SummaryTile
          label="Payout"
          value={
            evidence.payoutDusdc === undefined
              ? "N/A"
              : `${evidence.payoutDusdc.toLocaleString("en-US", {
                  maximumFractionDigits: 6,
                })} dUSDC`
          }
        />
        <SummaryTile
          label="Quantity"
          value={
            evidence.quantityDusdc === undefined
              ? "N/A"
              : `${evidence.quantityDusdc.toLocaleString("en-US", {
                  maximumFractionDigits: 6,
                })} dUSDC`
          }
        />
        <SummaryTile
          label="Settled redeem"
          value={evidence.isSettled === undefined ? "N/A" : evidence.isSettled ? "Yes" : "No"}
        />
      </div>

      <dl className="mt-3 grid gap-2 text-xs text-[#52615a] sm:grid-cols-2">
        <ConfigRow label="Bid price" value={evidence.bidPrice?.toLocaleString("en-US", { maximumFractionDigits: 9 })} />
        <ConfigRow label="Events in tx" value={readback?.eventCount.toString()} />
        <ConfigRow label="Match status" value={readback?.matchStatus} />
        <ConfigRow label="Loaded digests" value={historyReadback?.digests.length.toString()} />
        <ConfigRow label="Event sequence" value={evidence.eventSequence} />
        <ConfigRow
          label="Expiry"
          value={
            evidence.expiryMs
              ? formatIsoDateTime(new Date(Number(evidence.expiryMs)).toISOString())
              : undefined
          }
        />
        <ConfigRow label="Digest" value={evidence.digest} />
        <ConfigRow label="Gas" value={evidence.gasMist ? `${evidence.gasMist} MIST` : undefined} />
        <div className="sm:col-span-2">
          <ConfigRow label="Manager" value={evidence.managerId} />
        </div>
        <div className="sm:col-span-2">
          <ConfigRow label="Oracle" value={evidence.oracleId} />
        </div>
        <div className="sm:col-span-2">
          <ConfigRow label="Owner" value={evidence.owner} />
        </div>
        <div className="sm:col-span-2">
          <ConfigRow label="Executor" value={evidence.executor} />
        </div>
      </dl>

      {historyReadback ? (
        <RedeemHistoryScanSummary history={historyReadback} />
      ) : null}

      {readback?.summaries && readback.summaries.length > 1 ? (
        <div className="mt-3 rounded-md border border-[#dce3dd] bg-[#f6f8f5] p-3">
          <div className="text-xs font-semibold text-[#17211d]">
            Other redeem events in this transaction
          </div>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-[#52615a]">
            {readback.summaries
              .filter((summary) => summary.eventSequence !== evidence.eventSequence)
              .slice(0, 4)
              .map((summary) => (
                <li key={`${summary.digest}-${summary.eventSequence ?? summary.eventIndex}`}>
                  {summary.side ?? "N/A"} {summary.strike?.toLocaleString("en-US") ?? "N/A"} /
                  {" "}{formatDusdcValue(summary.quantityDusdc)} /
                  manager {shortObjectId(summary.managerId)}
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <a
        href={`https://testnet.suivision.xyz/txblock/${evidence.digest}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex w-fit rounded-md border border-[#1f8a70] px-3 py-2 text-xs font-semibold text-[#1f8a70] hover:bg-[#e8f4ef]"
      >
        View redeem digest
      </a>
    </div>
  );
}

function RedeemHistoryScanSummary({ history }: { history: PredictRedeemHistoryReadback }) {
  return (
    <div className="mt-3 rounded-md border border-[#dce3dd] bg-[#f6f8f5] p-3">
      <div className="text-xs font-semibold text-[#17211d]">
        Redeem history discovery
      </div>
      <dl className="mt-2 grid gap-2 text-xs text-[#52615a] sm:grid-cols-2">
        <ConfigRow label="Source" value={history.source} />
        <ConfigRow label="Unique digests" value={String(history.scan.uniqueDigests)} />
        <ConfigRow label="Events scanned" value={String(history.scan.eventsScanned)} />
        <ConfigRow label="Matching events" value={String(history.scan.matchingEvents)} />
        <ConfigRow label="Pages read" value={`${history.scan.pagesRead}/${history.scan.maxPages}`} />
        <ConfigRow label="Truncated" value={history.scan.truncated ? "Yes" : "No"} />
      </dl>
      <p className="mt-2 text-xs leading-5 text-[#52615a]">
        This is a bounded GraphQL event scan plus gRPC transaction readback. It
        improves coverage over a single default digest, but it is still not a
        production indexer.
      </p>
    </div>
  );
}

function RedeemPreviewPanel({ plan }: { plan: PredictRedeemPreviewPlan }) {
  return (
    <div className="mt-4 rounded-md border border-[#dce3dd] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[#17211d]">Redeem PTB preview</div>
          <p className="mt-2 text-sm leading-6 text-[#52615a]">
            Preview the DeepBook Predict redeem call shape from decoded manager
            positions. Signing remains disabled until redeemability checks and a
            live redeemable test path are verified.
          </p>
        </div>
        <div className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
          plan.readiness.status === "blocked"
            ? "border-[#c94f4f] bg-[#fff1ed] text-[#c75c48]"
            : "border-[#d0a13a] bg-[#fff8e7] text-[#8a6416]"
        }`}
        >
          {plan.readiness.status === "blocked" ? "Blocked" : "Waiting"}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-xs text-[#52615a] sm:grid-cols-2">
        <ConfigRow label="Target" value={plan.target} />
        <ConfigRow label="Mode" value={plan.mode} />
        <ConfigRow label="Oracle status" value={plan.inputs.oracleStatus} />
        <ConfigRow
          label="Oracle settled"
          value={plan.evidence.oracleSettled ? "Yes" : "No"}
        />
        <ConfigRow
          label="Vault settled evidence"
          value={plan.evidence.vaultSettledEvidence}
        />
        <ConfigRow label="Redeemability" value={plan.evidence.redeemability} />
        <ConfigRow label="Manager" value={plan.inputs.managerObjectId} />
        <ConfigRow label="Oracle" value={plan.inputs.oracleObjectId} />
        <ConfigRow label="Expiry" value={plan.inputs.oracleExpiryMs} />
        <ConfigRow
          label="Position"
          value={
            plan.inputs.side && plan.inputs.strike !== undefined
              ? `${plan.inputs.side} ${plan.inputs.strike.toLocaleString("en-US", {
                  maximumFractionDigits: 6,
                })}`
              : undefined
          }
        />
        <ConfigRow
          label="Quantity"
          value={
            plan.inputs.quantityDusdc === undefined
              ? undefined
              : `${plan.inputs.quantityDusdc.toLocaleString("en-US", {
                  maximumFractionDigits: 6,
                })} dUSDC`
          }
        />
        <ConfigRow label="Lifecycle" value={plan.inputs.lifecycle} />
      </dl>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-normal text-[#17211d]">
          Guarded redeem readiness
        </div>
        <div className="mt-2 grid gap-2">
          {plan.readiness.guards.map((guard) => (
            <div
              key={guard.id}
              className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3 text-xs"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-semibold text-[#17211d]">{guard.label}</div>
                  <p className="mt-1 leading-5 text-[#52615a]">{guard.detail}</p>
                </div>
                <span className={`w-fit rounded-full border px-2 py-0.5 font-semibold ${getGuardStatusClass(guard.status)}`}>
                  {guard.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {plan.readiness.missing.length > 0 ? (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-normal text-[#17211d]">
            Missing preview inputs
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
          Evidence and guardrails
        </div>
        <ul className="mt-2 space-y-2 text-xs leading-5 text-[#52615a]">
          {plan.evidence.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
          {plan.readiness.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>

      <pre className="mt-4 max-h-72 overflow-auto rounded-md bg-[#17211d] p-4 text-xs leading-5 text-[#e8f4ef]">
        {buildPredictRedeemSdkSkeleton(plan)}
      </pre>
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
    <section className="min-w-0 rounded-md border border-[#dce3dd] bg-[#ffffff] p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
      <div className="mb-5 flex min-w-0 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 text-lg font-semibold text-[#17211d]">
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
    <div className="min-w-0 rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
      <div className="flex min-w-0 items-center gap-2 text-xs font-medium uppercase text-[#52615a]">
        {icon ? <span className="text-[#1f8a70]">{icon}</span> : null}
        {label}
      </div>
      <div className={`mt-3 break-words text-lg font-semibold ${danger ? "text-[#c75c48]" : "text-[#17211d]"}`}>
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

function buildRedeemEvidenceLinks(
  inventory?: PredictManagerInventoryReadback,
  summaries: PredictRedeemExecutionSummary[] = [],
): RedeemEvidenceLink[] {
  if (!inventory || summaries.length === 0) {
    return [];
  }

  return inventory.positionEntries.flatMap((entry) => {
    const evidence = findRedeemEvidenceForEntry(
      inventory,
      entry,
      summaries,
    );

    return evidence
      ? [{
          entryFieldId: entry.fieldId,
          evidence,
          confidence: "matched-manager-oracle-side-strike" as const,
        }]
      : [];
  });
}

function dedupeRedeemSummaries(summaries: PredictRedeemExecutionSummary[]) {
  const seen = new Set<string>();

  return summaries.filter((summary) => {
    const key = [
      summary.digest,
      summary.eventSequence ?? summary.eventIndex ?? "unknown",
      summary.managerId ?? "unknown-manager",
      summary.oracleId ?? "unknown-oracle",
      summary.side ?? "unknown-side",
      summary.strike ?? "unknown-strike",
    ].join(":");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildSettlementAccountingSummary(
  inventory?: PredictManagerInventoryReadback,
  redeemLinks: RedeemEvidenceLink[] = [],
  mintHistory: PredictMintExecutionSummary[] = [],
): SettlementAccountingSummary {
  const mintTotals = mintHistory.reduce(
    (sum, execution) => ({
      quantity: sum.quantity + (execution.quantityDusdc ?? 0),
      cost: sum.cost + (execution.costDusdc ?? 0),
    }),
    { quantity: 0, cost: 0 },
  );

  if (!inventory) {
    return {
      totalPositions: 0,
      activePositions: 0,
      expiredPositions: 0,
      zeroQuantityPositions: 0,
      redeemedPositions: 0,
      evidenceMissingPositions: 0,
      totalCurrentQuantityDusdc: 0,
      totalRedeemedQuantityDusdc: 0,
      totalPayoutDusdc: 0,
      totalUnresolvedQuantityDusdc: 0,
      externalExecutorRedeems: 0,
      totalMintedQuantityDusdc: mintTotals.quantity,
      totalMintCostDusdc: mintTotals.cost,
      realizedHedgePnlDusdc: undefined,
      claimedPayoutDusdc: 0,
      unclaimedPayoutDusdc: undefined,
      accountingScope: mintHistory.length > 0 ? "local-and-loaded-history" : "none",
      status: "no-manager",
      explanation: "Manager inventory has not been loaded yet.",
    };
  }

  const linkedFieldIds = new Set(redeemLinks.map((link) => link.entryFieldId));
  const totals = inventory.positionEntries.reduce(
    (sum, entry) => {
      const linked = linkedFieldIds.has(entry.fieldId);
      const currentQuantity = entry.quantityDusdc ?? 0;
      const needsEvidence =
        !linked &&
        (
          entry.lifecycle.requiresRedeemEvidence ||
          entry.status.code === "expired" ||
          entry.status.code === "zero"
        );

      return {
        active: sum.active + (entry.status.code === "active" ? 1 : 0),
        expired: sum.expired + (entry.status.code === "expired" ? 1 : 0),
        zero: sum.zero + (entry.status.code === "zero" ? 1 : 0),
        redeemed: sum.redeemed + (linked ? 1 : 0),
        evidenceMissing: sum.evidenceMissing + (needsEvidence ? 1 : 0),
        currentQuantity: sum.currentQuantity + currentQuantity,
        unresolvedQuantity: sum.unresolvedQuantity + (needsEvidence ? currentQuantity : 0),
      };
    },
    {
      active: 0,
      expired: 0,
      zero: 0,
      redeemed: 0,
      evidenceMissing: 0,
      currentQuantity: 0,
      unresolvedQuantity: 0,
    },
  );
  const redeemedTotals = redeemLinks.reduce(
    (sum, link) => ({
      quantity: sum.quantity + (link.evidence.quantityDusdc ?? 0),
      payout: sum.payout + (link.evidence.payoutDusdc ?? 0),
      externalExecutors: sum.externalExecutors + (
        link.evidence.owner &&
        link.evidence.executor &&
        !sameObjectId(link.evidence.owner, link.evidence.executor)
          ? 1
          : 0
      ),
    }),
    { quantity: 0, payout: 0, externalExecutors: 0 },
  );
  const realizedHedgePnlDusdc = redeemedTotals.payout > 0 || mintTotals.cost > 0
    ? redeemedTotals.payout - mintTotals.cost
    : undefined;
  const status = totals.evidenceMissing > 0
    ? redeemLinks.length > 0
      ? "partial-evidence"
      : "needs-evidence"
    : redeemLinks.length > 0
      ? "evidence-linked"
      : "needs-evidence";

  return {
    totalPositions: inventory.positionEntries.length,
    activePositions: totals.active,
    expiredPositions: totals.expired,
    zeroQuantityPositions: totals.zero,
    redeemedPositions: totals.redeemed,
    evidenceMissingPositions: totals.evidenceMissing,
    totalCurrentQuantityDusdc: totals.currentQuantity,
    totalRedeemedQuantityDusdc: redeemedTotals.quantity,
    totalPayoutDusdc: redeemedTotals.payout,
    totalUnresolvedQuantityDusdc: totals.unresolvedQuantity,
    externalExecutorRedeems: redeemedTotals.externalExecutors,
    totalMintedQuantityDusdc: mintTotals.quantity,
    totalMintCostDusdc: mintTotals.cost,
    realizedHedgePnlDusdc,
    claimedPayoutDusdc: redeemedTotals.payout,
    unclaimedPayoutDusdc: undefined,
    accountingScope: mintHistory.length > 0
      ? "local-and-loaded-history"
      : "loaded-history",
    status,
    explanation: buildSettlementAccountingExplanation(status),
  };
}

function buildSettlementAccountingExplanation(status: SettlementAccountingSummary["status"]) {
  if (status === "evidence-linked") {
    return "Loaded manager positions have matching redeem evidence where follow-up evidence is required.";
  }

  if (status === "partial-evidence") {
    return "Some manager positions are linked to redeem evidence, while others still need broader history discovery.";
  }

  if (status === "needs-evidence") {
    return "Manager positions are loaded, but settlement/redeem evidence is incomplete.";
  }

  return "Manager inventory has not been loaded yet.";
}

function findRedeemEvidenceForEntry(
  inventory: PredictManagerInventoryReadback,
  entry: PredictManagerPositionEntry,
  summaries: PredictRedeemExecutionSummary[],
) {
  const key = entry.marketKey;

  if (!key) {
    return undefined;
  }

  return summaries.find((summary) =>
    sameObjectId(summary.managerId, inventory.managerObjectId) &&
    sameObjectId(summary.oracleId, key.oracleId) &&
    summary.side === key.side &&
    summary.strike === key.strike
  );
}

function formatDusdcValue(value?: number) {
  return value === undefined
    ? "N/A"
    : `${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} dUSDC`;
}

function shortObjectId(value?: string) {
  return value && value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value ?? "N/A";
}

function sameObjectId(left?: string, right?: string) {
  if (!left || !right) {
    return false;
  }

  return normalizeObjectId(left) === normalizeObjectId(right);
}

function normalizeObjectId(value: string) {
  return value.startsWith("0x") ? value.slice(2).toLowerCase() : value.toLowerCase();
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

function getLifecycleStatusClass(status: string) {
  if (status === "active") {
    return "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]";
  }

  if (status === "expired-needs-settlement-check" || status === "redeem-candidate") {
    return "border-[#c78b2d] bg-[#fff7e6] text-[#8b5d14]";
  }

  if (status === "redeemed-evidence-missing") {
    return "border-[#7b6fd6] bg-[#f0efff] text-[#4f45a3]";
  }

  return "border-[#dce3dd] bg-white text-[#52615a]";
}

function getSettlementAccountingStatusClass(status: SettlementAccountingSummary["status"]) {
  if (status === "evidence-linked") {
    return "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]";
  }

  if (status === "partial-evidence") {
    return "border-[#d0a13a] bg-[#fff8e7] text-[#8a6416]";
  }

  if (status === "needs-evidence") {
    return "border-[#c78b2d] bg-[#fff7e6] text-[#8b5d14]";
  }

  return "border-[#dce3dd] bg-white text-[#52615a]";
}

function formatSettlementAccountingStatus(status: SettlementAccountingSummary["status"]) {
  if (status === "evidence-linked") {
    return "Evidence linked";
  }

  if (status === "partial-evidence") {
    return "Partial evidence";
  }

  if (status === "needs-evidence") {
    return "Needs evidence";
  }

  return "No manager";
}

function getGuardStatusClass(status: string) {
  if (status === "pass") {
    return "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]";
  }

  if (status === "fail") {
    return "border-[#c94f4f] bg-[#fff1ed] text-[#c75c48]";
  }

  return "border-[#d0a13a] bg-[#fff8e7] text-[#8a6416]";
}
