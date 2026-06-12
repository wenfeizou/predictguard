import { NextResponse } from "next/server";

import {
  DEFAULT_REDEEM_EVIDENCE_DIGEST,
  fetchPredictRedeemEvidenceReadback,
} from "@/lib/predict/redeemReadback";
import type { PredictRedeemEvidenceMatch } from "@/lib/predict/execution";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const digest = searchParams.get("digest")?.trim() || DEFAULT_REDEEM_EVIDENCE_DIGEST;
  const managerId = searchParams.get("manager")?.trim();
  const oracleId = searchParams.get("oracle")?.trim();
  const sideParam = searchParams.get("side")?.trim().toUpperCase();
  const side: PredictRedeemEvidenceMatch["side"] =
    sideParam === "YES" || sideParam === "NO" ? sideParam : undefined;
  const strikeParam = searchParams.get("strike")?.trim();
  const strike = strikeParam ? Number(strikeParam) : undefined;
  const match: PredictRedeemEvidenceMatch | undefined =
    managerId || oracleId || side || Number.isFinite(strike)
    ? {
        managerId: managerId || undefined,
        oracleId: oracleId || undefined,
        side,
        strike: Number.isFinite(strike) ? strike : undefined,
      }
    : undefined;

  try {
    return NextResponse.json(
      await fetchPredictRedeemEvidenceReadback(digest, match),
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
