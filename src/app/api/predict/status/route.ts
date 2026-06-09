import { NextResponse } from "next/server";

import { fetchPredictLiveSnapshot } from "@/lib/predict/client";
import { normalizePredictLiveContext } from "@/lib/predict/normalize";

export async function GET() {
  const snapshot = await fetchPredictLiveSnapshot();
  const liveContext = normalizePredictLiveContext(snapshot);

  return NextResponse.json(
    {
      ...snapshot,
      liveContext,
    },
    {
    status: snapshot.reachable ? 200 : 502,
    },
  );
}
