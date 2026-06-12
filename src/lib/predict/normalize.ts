import type {
  PredictOracleSummary,
  PredictProtocolState,
  PredictServerStatus,
  PredictVaultSummary,
} from "@/lib/predict/client";
import type { DataSourceMode } from "@/lib/types";

const MIN_EXECUTION_ORACLE_LIFETIME_MS = 5 * 60 * 1000;

export type NormalizedPredictLiveContext = {
  dataSource: DataSourceMode;
  reachable: boolean;
  fetchedAt: string;
  serverStatus?: string;
  maxCheckpointLag?: number;
  maxTimeLagSeconds?: number;
  activeOracleCount: number;
  activeOracles: {
    oracleId: string;
    underlyingAsset: string;
    expiry: number;
    minutesToExpiry: number;
    minStrike: number;
    tickSize: number;
    referencePrice?: number;
    status: string;
  }[];
  latestActiveOracle?: {
    oracleId: string;
    underlyingAsset: string;
    expiry: number;
    minutesToExpiry: number;
    minStrike: number;
    tickSize: number;
    referencePrice?: number;
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
    .filter((oracle) => oracle.status === "active" && oracle.expiry > now)
    .sort((a, b) => a.expiry - b.expiry);
  const executableActiveOracles = activeOracles.filter(
    (oracle) => oracle.expiry - now > MIN_EXECUTION_ORACLE_LIFETIME_MS,
  );
  const latestActiveOracle = executableActiveOracles[0] ?? activeOracles[0];
  const latestReferencePrice = (input.oracles ?? [])
    .filter((oracle) => oracle.settlement_price)
    .sort((a, b) => (b.settled_at ?? 0) - (a.settled_at ?? 0))[0]?.settlement_price;

  const normalizedActiveOracles = activeOracles.map((oracle) => ({
    oracleId: oracle.oracle_id,
    underlyingAsset: oracle.underlying_asset,
    expiry: oracle.expiry,
    minutesToExpiry: Math.max(
      0,
      Math.round((oracle.expiry - now) / 60_000),
    ),
    minStrike: oracle.min_strike / 1_000_000_000,
    tickSize: oracle.tick_size / 1_000_000_000,
    referencePrice: latestReferencePrice
      ? latestReferencePrice / 1_000_000_000
      : undefined,
    status: oracle.status,
  }));

  return {
    dataSource: input.reachable ? "mixed-live-and-simulated" : "simulated",
    reachable: input.reachable,
    fetchedAt: input.fetchedAt,
    serverStatus: input.status?.status,
    maxCheckpointLag: input.status?.max_checkpoint_lag,
    maxTimeLagSeconds: input.status?.max_time_lag_seconds,
    activeOracleCount: activeOracles.length,
    activeOracles: normalizedActiveOracles,
    latestActiveOracle: latestActiveOracle
      ? normalizedActiveOracles.find((oracle) => oracle.oracleId === latestActiveOracle.oracle_id)
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
