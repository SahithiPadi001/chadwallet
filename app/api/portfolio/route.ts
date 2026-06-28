// GET /api/portfolio?address=<wallet>&privyUserId=<id>&username=
// Computes real net worth from on-chain balances (Alchemy) + live prices (BirdEye),
// records a snapshot for history, and returns the sparkline data.
// Used by: NetWorthCard

import { NextRequest, NextResponse } from "next/server";
import { getSolBalance, getTokenAccounts, WRAPPED_SOL_MINT } from "@/lib/alchemy";
import { getMultipleTokenPrices } from "@/lib/birdeye";
import { getOrCreateUser, createServerSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const privyUserId = req.nextUrl.searchParams.get("privyUserId");
  const username = req.nextUrl.searchParams.get("username");

  if (!address || !privyUserId) {
    return NextResponse.json({ error: "address and privyUserId are required" }, { status: 400 });
  }

  try {
    const user = await getOrCreateUser(privyUserId, { walletAddress: address, username });

    const [solBalance, tokenAccounts] = await Promise.all([
      getSolBalance(address),
      getTokenAccounts(address),
    ]);

    const mints = [WRAPPED_SOL_MINT, ...tokenAccounts.map((t) => t.mint)];
    const prices = await getMultipleTokenPrices(mints);

    const solValue = solBalance * (prices[WRAPPED_SOL_MINT] ?? 0);
    const tokensValue = tokenAccounts.reduce((sum, t) => sum + t.amount * (prices[t.mint] ?? 0), 0);
    const netWorth = solValue + tokensValue;

    const db = createServerSupabase();
    await db.from("net_worth_snapshots").insert({ user_id: user.id, value_usd: netWorth });

    const { data: snapshots } = await db
      .from("net_worth_snapshots")
      .select("value_usd, recorded_at")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: true })
      .limit(50);

    const history = (snapshots ?? []).map((s) => ({
      t: new Date(s.recorded_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      v: Number(s.value_usd),
    }));

    const first = history[0]?.v ?? netWorth;
    const change = first > 0 ? ((netWorth - first) / first) * 100 : 0;

    return NextResponse.json({
      netWorth,
      change,
      history,
      breakdown: { sol: { balance: solBalance, valueUsd: solValue }, tokens: tokenAccounts.length },
    });
  } catch (err) {
    console.error("Portfolio API error:", err);
    return NextResponse.json({ error: "Failed to compute portfolio" }, { status: 500 });
  }
}
