// GET /api/trades?privyUserId=<id>&limit=10  → recent trade history (ActivityFeed)
// POST /api/trades                            → record a completed swap (BuySellPanel)

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser, getUserByPrivyId, createServerSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const privyUserId = req.nextUrl.searchParams.get("privyUserId");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 10);

  if (!privyUserId) {
    return NextResponse.json({ error: "privyUserId is required" }, { status: 400 });
  }

  try {
    const user = await getUserByPrivyId(privyUserId);
    if (!user) return NextResponse.json({ trades: [] });

    const db = createServerSupabase();
    const { data, error } = await db
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ trades: data ?? [] });
  } catch (err) {
    console.error("Trades GET error:", err);
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { privyUserId, walletAddress, username, tokenAddress, tokenSymbol, side, amountUsd, amountTokens, txHash } = body;

  if (!privyUserId || !tokenAddress || !tokenSymbol || !side) {
    return NextResponse.json({ error: "privyUserId, tokenAddress, tokenSymbol, side are required" }, { status: 400 });
  }
  if (side !== "buy" && side !== "sell") {
    return NextResponse.json({ error: "side must be 'buy' or 'sell'" }, { status: 400 });
  }

  try {
    const user = await getOrCreateUser(privyUserId, { walletAddress, username });

    const db = createServerSupabase();
    const { data, error } = await db
      .from("trades")
      .insert({
        user_id: user.id,
        token_address: tokenAddress,
        token_symbol: tokenSymbol,
        side,
        amount_usd: amountUsd ?? 0,
        amount_tokens: amountTokens ?? 0,
        tx_hash: txHash ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ trade: data });
  } catch (err) {
    console.error("Trades POST error:", err);
    return NextResponse.json({ error: "Failed to record trade" }, { status: 500 });
  }
}
