import type { CommercialReport } from "@/lib/report/commercial";
import type { MonitoringRuleResult } from "@/lib/risk/monitoring";
import type { LifecycleQueueItem } from "@/lib/risk/lifecycle";

export type ProductSnapshot = {
  schemaVersion: "predictguard.snapshot.v1";
  id: string;
  exportedAt: string;
  reportTitle: string;
  dataMode: string;
  riskScore?: string;
  workflowStatus: CommercialReport["workflowStatus"];
  riskSnapshot: CommercialReport["riskSnapshot"];
  monitoring: MonitoringRuleResult[];
  lifecycleQueue: LifecycleQueueItem[];
  assumptions: string[];
  residualRisks: string[];
  nextActions: string[];
};

export function buildProductSnapshot(input: {
  report: CommercialReport;
  monitoring: MonitoringRuleResult[];
  lifecycleQueue: LifecycleQueueItem[];
}): ProductSnapshot {
  const riskScore = input.report.riskSnapshot.find((row) => row.label === "Risk score");

  return {
    schemaVersion: "predictguard.snapshot.v1",
    id: `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exportedAt: new Date().toISOString(),
    reportTitle: input.report.title,
    dataMode: input.report.mode,
    riskScore: riskScore?.value,
    workflowStatus: input.report.workflowStatus,
    riskSnapshot: input.report.riskSnapshot,
    monitoring: input.monitoring,
    lifecycleQueue: input.lifecycleQueue,
    assumptions: input.report.assumptions,
    residualRisks: input.report.residualRisks,
    nextActions: input.report.nextActions,
  };
}

export function stringifySnapshot(snapshot: ProductSnapshot) {
  return JSON.stringify(snapshot, null, 2);
}

const SNAPSHOT_HISTORY_KEY = "predictguard:snapshot-history:v1";
const SNAPSHOT_HISTORY_LIMIT = 20;
export const SNAPSHOT_HISTORY_EVENT = "predictguard:snapshot-history-updated";

export function loadSnapshotHistory(): ProductSnapshot[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SNAPSHOT_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isProductSnapshot);
  } catch {
    return [];
  }
}

export function saveSnapshotToHistory(snapshot: ProductSnapshot) {
  if (typeof window === "undefined") {
    return [];
  }

  const next = [
    snapshot,
    ...loadSnapshotHistory().filter((item) => item.id !== snapshot.id),
  ].slice(0, SNAPSHOT_HISTORY_LIMIT);
  window.localStorage.setItem(SNAPSHOT_HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SNAPSHOT_HISTORY_EVENT));

  return next;
}

export function replaceSnapshotHistory(snapshots: ProductSnapshot[]) {
  if (typeof window === "undefined") {
    return [];
  }

  const next = snapshots.filter(isProductSnapshot).slice(0, SNAPSHOT_HISTORY_LIMIT);
  window.localStorage.setItem(SNAPSHOT_HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SNAPSHOT_HISTORY_EVENT));

  return next;
}

export function deleteSnapshotFromHistory(id: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const next = loadSnapshotHistory().filter((snapshot) => snapshot.id !== id);
  window.localStorage.setItem(SNAPSHOT_HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SNAPSHOT_HISTORY_EVENT));

  return next;
}

export function clearSnapshotHistory() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SNAPSHOT_HISTORY_KEY);
  window.dispatchEvent(new Event(SNAPSHOT_HISTORY_EVENT));
}

export function parseSnapshotHistoryJson(raw: string): ProductSnapshot[] {
  const parsed = JSON.parse(raw);
  const candidates = Array.isArray(parsed) ? parsed : [parsed];

  return candidates.filter(isProductSnapshot);
}

function isProductSnapshot(value: unknown): value is ProductSnapshot {
  return Boolean(
    value &&
      typeof value === "object" &&
      "schemaVersion" in value &&
      value.schemaVersion === "predictguard.snapshot.v1" &&
      "id" in value &&
      typeof value.id === "string" &&
      "exportedAt" in value &&
      typeof value.exportedAt === "string",
  );
}
