import { z } from "zod";

import { predictTestnetConfig } from "@/lib/predict/config";
import type { NormalizedPredictLiveContext } from "@/lib/predict/normalize";

const pipelineSchema = z.object({
  pipeline: z.string(),
  checkpoint_lag: z.number(),
  time_lag_seconds: z.number(),
  latest_onchain_checkpoint: z.number(),
  is_backfill: z.boolean(),
});

const statusSchema = z.object({
  status: z.string(),
  latest_onchain_checkpoint: z.number(),
  current_time_ms: z.number(),
  max_lag_pipeline: z.string(),
  max_checkpoint_lag: z.number(),
  max_time_lag_seconds: z.number(),
  pipelines: z.array(pipelineSchema),
});

const vaultSummarySchema = z.object({
  predict_id: z.string(),
  quote_assets: z.array(z.string()),
  vault_balance: z.number(),
  vault_value: z.number(),
  total_mtm: z.number(),
  total_max_payout: z.number(),
  available_liquidity: z.number(),
  available_withdrawal: z.number(),
  plp_total_supply: z.number(),
  plp_share_price: z.number(),
  utilization: z.number(),
  max_payout_utilization: z.number(),
  net_deposits: z.number(),
  total_supplied: z.number(),
  total_withdrawn: z.number(),
});

const oracleSummarySchema = z.object({
  predict_id: z.string(),
  oracle_id: z.string(),
  oracle_cap_id: z.string(),
  underlying_asset: z.string(),
  expiry: z.number(),
  min_strike: z.number(),
  tick_size: z.number(),
  status: z.string(),
  activated_at: z.number().nullable(),
  settlement_price: z.number().nullable(),
  settled_at: z.number().nullable(),
  created_checkpoint: z.number(),
});

const protocolStateSchema = z.object({
  predict_id: z.string(),
  pricing: z.unknown().nullable(),
  risk: z.unknown().nullable(),
  trading_paused: z.boolean().nullable(),
  quote_assets: z.array(z.string()),
});

export type PredictServerStatus = z.infer<typeof statusSchema>;
export type PredictVaultSummary = z.infer<typeof vaultSummarySchema>;
export type PredictOracleSummary = z.infer<typeof oracleSummarySchema>;
export type PredictProtocolState = z.infer<typeof protocolStateSchema>;

export type PredictLiveSnapshot = {
  reachable: boolean;
  fetchedAt: string;
  config: typeof predictTestnetConfig;
  status?: PredictServerStatus;
  vaultSummary?: PredictVaultSummary;
  oracles?: PredictOracleSummary[];
  protocolState?: PredictProtocolState;
  liveContext?: NormalizedPredictLiveContext;
  error?: string;
};

export async function fetchPredictLiveSnapshot(): Promise<PredictLiveSnapshot> {
  try {
    const [status, vaultSummary, oracles, protocolState] = await Promise.all([
      fetchJson(`${predictTestnetConfig.apiBaseUrl}/status`, statusSchema),
      fetchJson(
        `${predictTestnetConfig.apiBaseUrl}/predicts/${predictTestnetConfig.predictObjectId}/vault/summary`,
        vaultSummarySchema,
      ),
      fetchJson(
        `${predictTestnetConfig.apiBaseUrl}/predicts/${predictTestnetConfig.predictObjectId}/oracles`,
        z.array(oracleSummarySchema),
      ),
      fetchJson(
        `${predictTestnetConfig.apiBaseUrl}/predicts/${predictTestnetConfig.predictObjectId}/state`,
        protocolStateSchema,
      ),
    ]);

    return {
      reachable: true,
      fetchedAt: new Date().toISOString(),
      config: predictTestnetConfig,
      status,
      vaultSummary,
      oracles: oracles
        .filter((oracle) => oracle.underlying_asset === "BTC")
        .sort((a, b) => b.expiry - a.expiry)
        .slice(0, 32),
      protocolState,
    };
  } catch (error) {
    return {
      reachable: false,
      fetchedAt: new Date().toISOString(),
      config: predictTestnetConfig,
      error: error instanceof Error ? error.message : "Unknown Predict server error",
    };
  }
}

async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
    next: {
      revalidate: 30,
    },
  });

  if (!response.ok) {
    throw new Error(`Predict server returned ${response.status} for ${url}`);
  }

  return schema.parse(await response.json());
}
