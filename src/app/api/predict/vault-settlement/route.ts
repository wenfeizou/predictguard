import { NextResponse } from "next/server";

import { fetchPredictVaultSettlementReadback } from "@/lib/predict/vaultSettlementReadback";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oracleParam = searchParams.get("oracles") ?? "";
  const oracleIds = oracleParam
    .split(",")
    .map((oracleId) => oracleId.trim())
    .filter(Boolean);

  if (oracleIds.length === 0) {
    return NextResponse.json(
      { error: "Missing oracles query parameter" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await fetchPredictVaultSettlementReadback(oracleIds),
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
          : "Unknown vault settlement readback error",
      },
      { status: 502 },
    );
  }
}
