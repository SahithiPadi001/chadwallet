// GET /api/token?address=<mint_address>
// Returns token overview + recent trades from BirdEye
// Used by: /token/[address] page

import { NextRequest, NextResponse } from "next/server";
import { getTokenOverview, getTokenTrades, getOHLCV } from "@/lib/birdeye";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const resolution = req.nextUrl.searchParams.get("resolution") ?? "1H";

  if (!address) {
    return NextResponse.json({ error: "address param required" }, { status: 400 });
  }

  try {
    const [overview, trades, ohlcv] = await Promise.all([
      getTokenOverview(address),
      getTokenTrades(address, 20),
      getOHLCV(address, resolution, 100),
    ]);
    return NextResponse.json({ overview, trades, ohlcv });
  } catch (err) {
    console.error("Token API error:", err);
    return NextResponse.json({ error: "Failed to fetch token data" }, { status: 500 });
  }
}
