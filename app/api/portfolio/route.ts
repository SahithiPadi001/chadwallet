// GET /api/portfolio?address=<wallet>&privyUserId=<id>&username=
// Computes real net worth + per-token holdings from on-chain balances (Alchemy)
// + live prices/symbols (BirdEye), records a snapshot for history.
// Used by: app/portfolio/page.tsx

import { NextRequest, NextResponse } from "next/server";
import { getSolBalance, getTokenAccounts, WRAPPED_SOL_MINT } from "@/lib/alchemy";
import { getTokenOverview } from "@/lib/birdeye";
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
    const overviews = await Promise.all(mints.map((m) => getTokenOverview(m).catch(() => null)));
    const overviewByMint = new Map(mints.map((m, i) => [m, overviews[i]]));

    const solOverview = overviewByMint.get(WRAPPED_SOL_MINT);
    const solValue = solBalance * (solOverview?.price ?? 0);

    const tokenHoldings = tokenAccounts.map((t) => {
      const ov = overviewByMint.get(t.mint);
      const usdValue = t.amount * (ov?.price ?? 0);
      return { mint: t.mint, symbol: ov?.symbol ?? t.mint.slice(0, 4), logoURI: ov?.logoURI ?? "", amount: t.amount, usdValue };
    });

    const netWorth = solValue + tokenHoldings.reduce((sum, t) => sum + t.usdValue, 0);

    const holdings = [
      { mint: WRAPPED_SOL_MINT, symbol: "SOL", logoURI: solOverview?.logoURI ?? "", amount: solBalance, usdValue: solValue },
      ...tokenHoldings,
    ]
      .filter((h) => h.usdValue > 0 || h.mint === WRAPPED_SOL_MINT)
      .map((h) => ({ ...h, pct: netWorth > 0 ? (h.usdValue / netWorth) * 100 : 0 }))
      .sort((a, b) => b.usdValue - a.usdValue);

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
      ts: new Date(s.recorded_at).getTime(),
    }));

    const first = history[0]?.v ?? netWorth;
    const change = first > 0 ? ((netWorth - first) / first) * 100 : 0;

    return NextResponse.json({ netWorth, change, history, holdings });
  } catch (err) {
    console.error("Portfolio API error:", err);
    return NextResponse.json({ error: "Failed to compute portfolio" }, { status: 500 });
  }
}
