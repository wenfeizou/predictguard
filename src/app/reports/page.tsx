"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ClipboardList, FileText, ShieldCheck, Trash2 } from "lucide-react";

import {
  clearSnapshotHistory,
  loadSnapshotHistory,
  SNAPSHOT_HISTORY_EVENT,
  type ProductSnapshot,
} from "@/lib/report/snapshot";

const emptySnapshots: ProductSnapshot[] = [];

export default function ReportsPage() {
  const externalSnapshots = useSyncExternalStore(
    subscribeSnapshotHistory,
    loadSnapshotHistory,
    getServerSnapshotHistory,
  );
  const [cleared, setCleared] = useState(false);
  const snapshots = useMemo(
    () => cleared ? [] : externalSnapshots,
    [cleared, externalSnapshots],
  );
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? snapshots[0],
    [selectedSnapshotId, snapshots],
  );
  const previousSnapshot = useMemo(
    () =>
      selectedSnapshot
        ? snapshots.find((snapshot) => snapshot.id !== selectedSnapshot.id)
        : undefined,
    [selectedSnapshot, snapshots],
  );

  const summary = useMemo(() => summarizeSnapshots(snapshots), [snapshots]);

  function clearHistory() {
    clearSnapshotHistory();
    setCleared(true);
  }

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
                <ClipboardList className="h-4 w-4" />
                Saved risk snapshots
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
                Report history for repeat risk review
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#52615a]">
                Saved snapshots turn PredictGuard from a one-time dashboard into
                a repeatable review workflow. Operators can keep dated risk
                evidence, monitoring states, lifecycle queues, and assumptions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Snapshots" value={String(snapshots.length)} />
              <Metric label="Watch rules" value={String(summary.watchRules)} />
              <Metric label="Breaches" value={String(summary.breaches)} danger={summary.breaches > 0} />
              <Metric label="Lifecycle queue" value={String(summary.lifecycleItems)} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Snapshot history</h2>
              <p className="mt-1 text-sm leading-6 text-[#52615a]">
                Stored locally in this browser. Production storage should move to
                a team workspace with permissions and audit history.
              </p>
            </div>
            <button
              type="button"
              onClick={clearHistory}
              className="inline-flex w-fit items-center gap-2 rounded-md border border-[#dce3dd] bg-white px-3 py-2 text-sm font-semibold text-[#17211d] transition hover:border-[#c75c48] hover:text-[#c75c48]"
            >
              <Trash2 className="h-4 w-4" />
              Clear history
            </button>
          </div>

          {snapshots.length === 0 ? (
            <div className="mt-6 rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-5 text-sm leading-6 text-[#52615a]">
              No saved snapshots yet. Return to the dashboard and use
              <span className="font-semibold text-[#17211d]"> Save Snapshot </span>
              in the Risk Report panel.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {snapshots.map((snapshot) => (
                <SnapshotCard
                  key={snapshot.id}
                  snapshot={snapshot}
                  selected={selectedSnapshot?.id === snapshot.id}
                  onSelect={() => setSelectedSnapshotId(snapshot.id)}
                />
              ))}
            </div>
          )}
        </section>

        {selectedSnapshot ? (
          <>
            <SnapshotDetail snapshot={selectedSnapshot} />
            <SnapshotCompare current={selectedSnapshot} previous={previousSnapshot} />
          </>
        ) : null}
      </div>
    </main>
  );
}

function SnapshotCompare({
  current,
  previous,
}: {
  current: ProductSnapshot;
  previous?: ProductSnapshot;
}) {
  const currentRisk = parseRiskScore(current.riskScore);
  const previousRisk = parseRiskScore(previous?.riskScore);
  const currentBreaches = current.monitoring.filter((rule) => rule.status === "breach").length;
  const previousBreaches = previous?.monitoring.filter((rule) => rule.status === "breach").length;
  const currentQueue = current.lifecycleQueue.reduce((total, item) => total + item.count, 0);
  const previousQueue = previous?.lifecycleQueue.reduce((total, item) => total + item.count, 0);

  return (
    <section className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
      <h2 className="text-lg font-semibold">Snapshot comparison</h2>
      <p className="mt-1 text-sm leading-6 text-[#52615a]">
        Compare the selected snapshot against the next saved snapshot in local
        history. This is the local prototype for report-to-report risk drift.
      </p>
      {previous ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <CompareMetric
            label="Risk score"
            current={current.riskScore ?? "N/A"}
            previous={previous.riskScore ?? "N/A"}
            delta={formatDelta(currentRisk, previousRisk)}
          />
          <CompareMetric
            label="Breaches"
            current={String(currentBreaches)}
            previous={String(previousBreaches ?? 0)}
            delta={formatDelta(currentBreaches, previousBreaches)}
          />
          <CompareMetric
            label="Lifecycle queue"
            current={String(currentQueue)}
            previous={String(previousQueue ?? 0)}
            delta={formatDelta(currentQueue, previousQueue)}
          />
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4 text-sm leading-6 text-[#52615a]">
          Save at least two snapshots to compare risk drift over time.
        </div>
      )}
    </section>
  );
}

function CompareMetric({
  label,
  current,
  previous,
  delta,
}: {
  label: string;
  current: string;
  previous: string;
  delta: string;
}) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4">
      <div className="text-xs font-semibold uppercase text-[#52615a]">{label}</div>
      <div className="mt-2 text-base font-semibold">{current}</div>
      <div className="mt-1 text-xs text-[#52615a]">Previous: {previous}</div>
      <div className="mt-3 w-fit rounded-full border border-[#dce3dd] bg-white px-2 py-0.5 text-xs font-semibold text-[#52615a]">
        Delta {delta}
      </div>
    </div>
  );
}

function SnapshotCard({
  snapshot,
  selected,
  onSelect,
}: {
  snapshot: ProductSnapshot;
  selected: boolean;
  onSelect: () => void;
}) {
  const watchCount = snapshot.monitoring.filter((rule) => rule.status === "watch").length;
  const breachCount = snapshot.monitoring.filter((rule) => rule.status === "breach").length;
  const queueCount = snapshot.lifecycleQueue.reduce((total, item) => total + item.count, 0);

  return (
    <article className={`rounded-md border p-4 ${
      selected ? "border-[#1f8a70] bg-[#e8f4ef]" : "border-[#dce3dd] bg-[#f5f7f4]"
    }`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#1f8a70] bg-[#e8f4ef] px-2 py-0.5 text-xs font-semibold text-[#1f8a70]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {snapshot.dataMode}
            </span>
            <span className="rounded-full border border-[#dce3dd] bg-white px-2 py-0.5 text-xs font-semibold text-[#52615a]">
              {new Date(snapshot.exportedAt).toLocaleString()}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold">{snapshot.reportTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-[#52615a]">
            {snapshot.nextActions[0] ?? "Review saved risk state and monitoring evidence."}
          </p>
          <button
            type="button"
            onClick={onSelect}
            className="mt-3 inline-flex rounded-md border border-[#1f8a70] bg-white px-3 py-2 text-xs font-semibold text-[#1f8a70] transition hover:bg-[#e8f4ef]"
          >
            Review detail
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          <Metric label="Risk score" value={snapshot.riskScore ?? "N/A"} />
          <Metric label="Watch" value={String(watchCount)} />
          <Metric label="Breach" value={String(breachCount)} danger={breachCount > 0} />
          <Metric label="Queue" value={String(queueCount)} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-[#dce3dd] bg-white p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-[#1f8a70]" />
            Monitoring
          </div>
          <div className="mt-3 space-y-2">
            {snapshot.monitoring.slice(0, 3).map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-[#52615a]">{rule.label}</span>
                <span className="font-semibold text-[#17211d]">{rule.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-[#dce3dd] bg-white p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-[#1f8a70]" />
            Lifecycle
          </div>
          <div className="mt-3 space-y-2">
            {snapshot.lifecycleQueue.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-[#52615a]">{item.label}</span>
                <span className="font-semibold text-[#17211d]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function SnapshotDetail({ snapshot }: { snapshot: ProductSnapshot }) {
  return (
    <section className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Selected snapshot detail</h2>
          <p className="mt-1 text-sm leading-6 text-[#52615a]">
            {new Date(snapshot.exportedAt).toLocaleString()} · {snapshot.schemaVersion}
          </p>
        </div>
        <span className="w-fit rounded-full border border-[#1f8a70] bg-[#e8f4ef] px-3 py-1 text-xs font-semibold text-[#1f8a70]">
          {snapshot.dataMode}
        </span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <DetailPanel title="Risk Snapshot">
          <Rows rows={snapshot.riskSnapshot} />
        </DetailPanel>
        <DetailPanel title="Workflow Status">
          <Rows rows={snapshot.workflowStatus} />
        </DetailPanel>
        <DetailPanel title="Monitoring Rules">
          <div className="space-y-2">
            {snapshot.monitoring.map((rule) => (
              <div key={rule.id} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold">{rule.label}</span>
                  <span>{rule.status}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#52615a]">{rule.commercialUse}</p>
              </div>
            ))}
          </div>
        </DetailPanel>
        <DetailPanel title="Lifecycle Queue">
          <div className="space-y-2">
            {snapshot.lifecycleQueue.map((item) => (
              <div key={item.id} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold">{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#52615a]">{item.operatorAction}</p>
              </div>
            ))}
          </div>
        </DetailPanel>
      </div>
    </section>
  );
}

function DetailPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-white p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Rows({
  rows,
}: {
  rows: ProductSnapshot["riskSnapshot"];
}) {
  return (
    <dl className="divide-y divide-[#edf1ee]">
      {rows.map((row) => (
        <div key={`${row.label}-${row.value}`} className="grid gap-1 py-2 sm:grid-cols-[160px_1fr]">
          <dt className="text-xs font-medium text-[#52615a]">{row.label}</dt>
          <dd className="break-words text-xs font-semibold text-[#17211d]">{row.value}</dd>
        </div>
      ))}
    </dl>
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
    <div className="rounded-md border border-[#dce3dd] bg-white p-3">
      <div className="text-xs font-semibold uppercase text-[#52615a]">{label}</div>
      <div className={`mt-2 text-base font-semibold ${danger ? "text-[#c75c48]" : "text-[#17211d]"}`}>
        {value}
      </div>
    </div>
  );
}

function summarizeSnapshots(snapshots: ProductSnapshot[]) {
  return snapshots.reduce(
    (summary, snapshot) => ({
      watchRules:
        summary.watchRules +
        snapshot.monitoring.filter((rule) => rule.status === "watch").length,
      breaches:
        summary.breaches +
        snapshot.monitoring.filter((rule) => rule.status === "breach").length,
      lifecycleItems:
        summary.lifecycleItems +
        snapshot.lifecycleQueue.reduce((total, item) => total + item.count, 0),
    }),
    { watchRules: 0, breaches: 0, lifecycleItems: 0 },
  );
}

function parseRiskScore(value?: string) {
  if (!value) {
    return undefined;
  }

  const [score] = value.split("/");
  const parsed = Number(score);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDelta(current?: number, previous?: number) {
  if (current === undefined || previous === undefined) {
    return "N/A";
  }

  const delta = current - previous;

  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`;
}

function subscribeSnapshotHistory(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SNAPSHOT_HISTORY_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SNAPSHOT_HISTORY_EVENT, onStoreChange);
  };
}

function getServerSnapshotHistory() {
  return emptySnapshots;
}
