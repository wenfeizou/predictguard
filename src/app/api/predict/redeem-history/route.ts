import { NextResponse } from "next/server";

import { fetchPredictRedeemHistoryReadback } from "@/lib/predict/redeemHistoryReadback";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const manager = searchParams.get("manager")?.trim();

  if (!manager) {
    return NextResponse.json(
      { error: "Missing manager query parameter" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await fetchPredictRedeemHistoryReadback(manager),
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
          : "Unknown redeem history readback error",
      },
      { status: 502 },
    );
  }
}
