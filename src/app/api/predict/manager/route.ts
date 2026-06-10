import { NextResponse } from "next/server";
import { z } from "zod";

import { predictTestnetConfig } from "@/lib/predict/config";

export const dynamic = "force-dynamic";

const managerSchema = z.object({
  manager_id: z.string(),
  owner: z.string(),
  checkpoint_timestamp_ms: z.number(),
});

const managersSchema = z.array(managerSchema);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner")?.toLowerCase();

  if (!owner) {
    return NextResponse.json(
      { managerFound: false, error: "Missing owner query parameter" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${predictTestnetConfig.apiBaseUrl}/managers`, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Predict server returned ${response.status}`);
    }

    const managers = managersSchema.parse(await response.json());
    const candidates = managers
      .filter((manager) => manager.owner.toLowerCase() === owner)
      .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms);
    const latest = candidates[0];

    return NextResponse.json({
      managerFound: Boolean(latest),
      managerObjectId: latest?.manager_id,
      candidateCount: candidates.length,
    });
  } catch (error) {
    return NextResponse.json({
      managerFound: false,
      error: error instanceof Error ? error.message : "Unknown manager lookup error",
    });
  }
}
