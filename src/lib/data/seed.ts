import type { BinaryMarket, MarketState, PositionExposure } from "@/lib/types";

const timestamp = Date.UTC(2026, 5, 9, 3, 30, 0);

const expiries = [
  { id: "15m", timestamp: timestamp + 15 * 60_000, label: "15m", minutesToExpiry: 15 },
  { id: "30m", timestamp: timestamp + 30 * 60_000, label: "30m", minutesToExpiry: 30 },
  { id: "60m", timestamp: timestamp + 60 * 60_000, label: "60m", minutesToExpiry: 60 },
];

const strikes = [66_000, 68_000, 70_000, 72_000, 73_000, 75_000].map(
  (value) => ({
    value,
    label: value.toLocaleString("en-US"),
  }),
);

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function makeMarket(expiryId: string, strike: number, expiryIndex: number): BinaryMarket {
  const distance = (70_000 - strike) / 1_650;
  const timeLift = expiryIndex * 0.025;
  const yesPrice = Math.min(0.88, Math.max(0.08, sigmoid(distance) + timeLift));

  return {
    expiryId,
    strike,
    yesPrice: Number(yesPrice.toFixed(3)),
    noPrice: Number((1 - yesPrice).toFixed(3)),
    impliedVol: Number((0.42 + expiryIndex * 0.035 + Math.abs(strike - 70_000) / 180_000).toFixed(3)),
    liquidity: 1_200 - Math.abs(strike - 70_000) / 18 + expiryIndex * 120,
  };
}

const markets = expiries.flatMap((expiry, expiryIndex) =>
  strikes.map((strike) => makeMarket(expiry.id, strike.value, expiryIndex)),
);

const exposures: PositionExposure[] = [
  { expiryId: "15m", strike: 68_000, side: "NO", notional: 78, premiumCollected: 44 },
  { expiryId: "15m", strike: 70_000, side: "YES", notional: 92, premiumCollected: 48 },
  { expiryId: "15m", strike: 72_000, side: "YES", notional: 122, premiumCollected: 38 },
  { expiryId: "15m", strike: 73_000, side: "YES", notional: 175, premiumCollected: 43 },
  { expiryId: "15m", strike: 75_000, side: "YES", notional: 58, premiumCollected: 9 },
  { expiryId: "30m", strike: 68_000, side: "NO", notional: 96, premiumCollected: 49 },
  { expiryId: "30m", strike: 70_000, side: "YES", notional: 104, premiumCollected: 53 },
  { expiryId: "30m", strike: 72_000, side: "YES", notional: 118, premiumCollected: 41 },
  { expiryId: "30m", strike: 73_000, side: "YES", notional: 132, premiumCollected: 36 },
  { expiryId: "60m", strike: 66_000, side: "NO", notional: 70, premiumCollected: 25 },
  { expiryId: "60m", strike: 70_000, side: "YES", notional: 88, premiumCollected: 45 },
  { expiryId: "60m", strike: 75_000, side: "YES", notional: 62, premiumCollected: 11 },
];

export const seedMarketState: MarketState = {
  id: "predictguard-demo-btc",
  dataSource: "simulated",
  spotSymbol: "BTC",
  quoteAsset: "dUSDC",
  spotPrice: 70_000,
  timestamp,
  expiries,
  strikes,
  markets,
  exposures,
  plp: {
    tvl: 10_000,
    utilization: 0.42,
    availableLiquidity: 5_800,
    maxPayoutCoverage: 0.76,
  },
  assumptions: [
    "Sample data is deterministic and simulated for the first demo path.",
    "Binary YES pays when settlement is above strike; NO pays when settlement is at or below strike.",
    "Vol spike scenario uses a simplified mark-to-market stress, not a full SVI repricing engine.",
    "Hedge selection is a risk reduction heuristic, not financial advice or a profit guarantee.",
  ],
};
