// GET /api/trending
// Returns trending Solana tokens from BirdEye
// Used by: /trending page

import { NextResponse } from "next/server";
import { getTrendingTokens } from "@/lib/birdeye";

export async function GET() {
  try {
    const tokens = await getTrendingTokens(30);
    return NextResponse.json({ tokens });
  } catch (err) {
    console.error("BirdEye trending error:", err);
    return NextResponse.json({ error: "Failed to fetch trending tokens" }, { status: 500 });
  }
}
