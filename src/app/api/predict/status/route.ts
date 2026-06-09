import { NextResponse } from "next/server";

import { fetchPredictLiveSnapshot } from "@/lib/predict/client";

export async function GET() {
  const snapshot = await fetchPredictLiveSnapshot();

  return NextResponse.json(snapshot, {
    status: snapshot.reachable ? 200 : 502,
  });
}
