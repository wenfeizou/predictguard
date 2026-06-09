import type {
  PredictOracleSummary,
  PredictProtocolState,
  PredictServerStatus,
  PredictVaultSummary,
} from "@/lib/predict/client";
import type { DataSourceMode } from "@/lib/types";

export type NormalizedPredictLiveContext = {
  dataSource: DataSourceMode;
  reachable: boolean;
  fetchedAt: string;
  serverStatus?: string;
  maxCheckpointLag?: number;
  maxTimeLagSeconds?: number;
  activeOracleCount: number;
  latestActiveOracle?: {
    oracleId: string;
    underlyingAsset: string;
    expiry: number;
    minutesToExpiry: number;
    minStrike: number;
    tickSize: number;
    status: string;
  };
  vault?: {
    valueDUsdc: number;
    balanceDUsdc: number;
    availableLiquidityDUsdc: number;
    totalMaxPayoutDUsdc: number;
    totalMtmDUsdc: number;
    plpSharePrice: number;
    utilization: number;
    maxPayoutUtilization: number;
  };
  quoteAssets: string[];
  assumptions: string[];
};

export function normalizePredictLiveContext(input: {
  reachable: boolean;
  fetchedAt: string;
  status?: PredictServerStatus;
  vaultSummary?: PredictVaultSummary;
  oracles?: PredictOracleSummary[];
  protocolState?: PredictProtocolState;
}): NormalizedPredictLiveContext {
  const now = Date.now();
  const activeOracles = (input.oracles ?? [])
    .filter((oracle) => oracle.status === "active")
    .sort((a, b) => a.expiry - b.expiry);
  const latestActiveOracle = activeOracles[0];

  return {
    dataSource: input.reachable ? "mixed-live-and-simulated" : "simulated",
    reachable: input.reachable,
    fetchedAt: input.fetchedAt,
    serverStatus: input.status?.status,
    maxCheckpointLag: input.status?.max_checkpoint_lag,
    maxTimeLagSeconds: input.status?.max_time_lag_seconds,
    activeOracleCount: activeOracles.length,
    latestActiveOracle: latestActiveOracle
      ? {
          oracleId: latestActiveOracle.oracle_id,
          underlyingAsset: latestActiveOracle.underlying_asset,
          expiry: latestActiveOracle.expiry,
          minutesToExpiry: Math.max(
            0,
            Math.round((latestActiveOracle.expiry - now) / 60_000),
          ),
          minStrike: latestActiveOracle.min_strike / 1_000_000_000,
          tickSize: latestActiveOracle.tick_size / 1_000_000_000,
          status: latestActiveOracle.status,
        }
      : undefined,
    vault: input.vaultSummary
      ? {
          valueDUsdc: toDUsdc(input.vaultSummary.vault_value),
          balanceDUsdc: toDUsdc(input.vaultSummary.vault_balance),
          availableLiquidityDUsdc: toDUsdc(input.vaultSummary.available_liquidity),
          totalMaxPayoutDUsdc: toDUsdc(input.vaultSummary.total_max_payout),
          totalMtmDUsdc: toDUsdc(input.vaultSummary.total_mtm),
          plpSharePrice: input.vaultSummary.plp_share_price,
          utilization: input.vaultSummary.utilization,
          maxPayoutUtilization: input.vaultSummary.max_payout_utilization,
        }
      : undefined,
    quoteAssets:
      input.protocolState?.quote_assets ?? input.vaultSummary?.quote_assets ?? [],
    assumptions: [
      input.reachable
        ? "Live DeepBook Predict testnet status and vault summary are included for context."
        : "Live DeepBook Predict testnet context was unavailable during this report.",
      "PLP exposure and scenario simulation remain deterministic until live exposure reconstruction is implemented.",
      "Mixed mode uses live protocol context plus simulated exposure and hedge calculations.",
    ],
  };
}

function toDUsdc(value: number): number {
  return value / 1_000_000;
}
