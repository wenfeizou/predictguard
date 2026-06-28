export type MonitoringPresetId = "conservative" | "balanced" | "aggressive";

export type MonitoringPreset = {
  id: MonitoringPresetId;
  label: string;
  description: string;
  utilizationWatchPct: number;
  utilizationBreachPct: number;
  liabilityWatchPct: number;
  liabilityBreachPct: number;
  hedgeGapWatchPct: number;
};

export const monitoringPresets: MonitoringPreset[] = [
  {
    id: "conservative",
    label: "Conservative",
    description: "Lower thresholds for vaults that prioritize capital preservation and early review.",
    utilizationWatchPct: 45,
    utilizationBreachPct: 65,
    liabilityWatchPct: 15,
    liabilityBreachPct: 28,
    hedgeGapWatchPct: 30,
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Default operating policy for routine LP and vault monitoring.",
    utilizationWatchPct: 55,
    utilizationBreachPct: 75,
    liabilityWatchPct: 20,
    liabilityBreachPct: 35,
    hedgeGapWatchPct: 50,
  },
  {
    id: "aggressive",
    label: "Aggressive",
    description: "Higher thresholds for teams willing to tolerate more utilization before review.",
    utilizationWatchPct: 68,
    utilizationBreachPct: 85,
    liabilityWatchPct: 30,
    liabilityBreachPct: 48,
    hedgeGapWatchPct: 70,
  },
];

export function getMonitoringPreset(id: MonitoringPresetId) {
  return monitoringPresets.find((preset) => preset.id === id) ?? monitoringPresets[1];
}
