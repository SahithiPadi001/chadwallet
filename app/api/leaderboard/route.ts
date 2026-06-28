// GET /api/leaderboard?address=<token>&timeframe=24h&walletAddress=<optional>
// Real per-token top traders from BirdEye (no global cross-token leaderboard
// exists on our API tier — see plan notes). Fetches top ~20 by volume; if the
// caller's wallet appears in that set we report their real rank, otherwise we
// say so honestly rather than fabricating one.

import { NextRequest, NextResponse } from "next/server";
import { getTopTraders } from "@/lib/birdeye";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const timeframe = req.nextUrl.searchParams.get("timeframe") ?? "24h";
  const walletAddress = req.nextUrl.searchParams.get("walletAddress");

  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  try {
    const [page1, page2] = await Promise.all([
      getTopTraders(address, timeframe, "volume_usd", 10, 0),
      getTopTraders(address, timeframe, "volume_usd", 10, 10),
    ]);
    const traders = [...page1, ...page2].map((t, i) => ({ ...t, rank: i + 1 }));

    const yours = walletAddress ? traders.find((t) => t.owner === walletAddress) ?? null : null;

    return NextResponse.json({ traders, yours });
  } catch (err) {
    console.error("Leaderboard API error:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
