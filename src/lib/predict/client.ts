import { z } from "zod";

import { predictTestnetConfig } from "@/lib/predict/config";

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

export type PredictServerStatus = z.infer<typeof statusSchema>;
export type PredictVaultSummary = z.infer<typeof vaultSummarySchema>;

export type PredictLiveSnapshot = {
  reachable: boolean;
  fetchedAt: string;
  config: typeof predictTestnetConfig;
  status?: PredictServerStatus;
  vaultSummary?: PredictVaultSummary;
  error?: string;
};

export async function fetchPredictLiveSnapshot(): Promise<PredictLiveSnapshot> {
  try {
    const [status, vaultSummary] = await Promise.all([
      fetchJson(`${predictTestnetConfig.apiBaseUrl}/status`, statusSchema),
      fetchJson(
        `${predictTestnetConfig.apiBaseUrl}/predicts/${predictTestnetConfig.predictObjectId}/vault/summary`,
        vaultSummarySchema,
      ),
    ]);

    return {
      reachable: true,
      fetchedAt: new Date().toISOString(),
      config: predictTestnetConfig,
      status,
      vaultSummary,
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
