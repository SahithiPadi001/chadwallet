// GET /api/trending?filter=trending|new
// Returns trending or newly-listed Solana tokens from BirdEye
// Used by: TokenListColumn

import { NextRequest, NextResponse } from "next/server";
import { getTrendingTokens, getNewListings } from "@/lib/birdeye";

export async function GET(req: NextRequest) {
  const filter = req.nextUrl.searchParams.get("filter") ?? "trending";

  try {
    if (filter === "new") {
      const listings = await getNewListings(30);
      const tokens = listings.map((l, i) => ({
        address: l.address,
        symbol: l.symbol,
        name: l.name,
        logoURI: l.logoURI,
        price: 0,
        priceChange24hPercent: 0,
        volume24hUSD: 0,
        marketcap: 0,
        liquidity: l.liquidity,
        rank: i + 1,
      }));
      return NextResponse.json({ tokens });
    }

    const tokens = await getTrendingTokens(30);
    return NextResponse.json({ tokens });
  } catch (err) {
    console.error("BirdEye trending error:", err);
    return NextResponse.json({ error: "Failed to fetch trending tokens" }, { status: 500 });
  }
}
