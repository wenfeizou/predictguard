import type { CommercialReport } from "@/lib/report/commercial";
import type { MonitoringRuleResult } from "@/lib/risk/monitoring";
import type { LifecycleQueueItem } from "@/lib/risk/lifecycle";

export type ProductSnapshot = {
  schemaVersion: "predictguard.snapshot.v1";
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
