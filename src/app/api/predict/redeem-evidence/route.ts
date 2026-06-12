import { NextResponse } from "next/server";

import {
  DEFAULT_REDEEM_EVIDENCE_DIGEST,
  fetchPredictRedeemEvidenceReadback,
} from "@/lib/predict/redeemReadback";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const digest = searchParams.get("digest")?.trim() || DEFAULT_REDEEM_EVIDENCE_DIGEST;

  try {
    return NextResponse.json(
      await fetchPredictRedeemEvidenceReadback(digest),
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Unknown redeem evidence readback error",
      },
      { status: 502 },
    );
  }
}
