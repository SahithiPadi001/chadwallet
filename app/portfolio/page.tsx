"use client";
// ─── Portfolio Page ─────────────────────────────────────────────────────────────
// Real net worth (Alchemy balances × BirdEye prices), real holdings allocation,
// real activity (Supabase trades), real deposit address.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Copy, QrCode } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { TradingShell } from "@/components/layout/TradingShell";
import { DepositModal } from "@/components/wallet/DepositModal";
import { formatUSD, formatPct, shortenAddress, colorForSymbol } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { DbTrade } from "@/lib/supabase";

interface Holding {
  mint: string;
  symbol: string;
  logoURI: string;
  amount: number;
  usdValue: number;
  pct: number;
}

const PERIODS = ["1D", "1W", "1M", "ALL"] as const;
const PERIOD_MS: Record<typeof PERIODS[number], number> = {
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  ALL: Infinity,
};

export default function PortfolioPage() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const router = useRouter();
  const wallet = wallets[0];

  const [loading, setLoading] = useState(true);
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [change, setChange] = useState(0);
  const [history, setHistory] = useState<{ t: string; v: number; ts: number }[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [period, setPeriod] = useState<typeof PERIODS[number]>("1W");
  const [trades, setTrades] = useState<DbTrade[]>([]);
  const [depositOpen, setDepositOpen] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) router.push("/");
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (!wallet?.address || !user?.id) return;
    const params = new URLSearchParams({ address: wallet.address, privyUserId: user.id });
    if (user.google?.name) params.set("username", user.google.name);
    fetch(`/api/portfolio?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setNetWorth(d.netWorth);
        setChange(d.change ?? 0);
        setHistory((d.history ?? []).map((h: any, i: number) => ({ ...h, ts: i })));
        setHoldings(d.holdings ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [wallet?.address, user?.id, user?.google?.name]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/trades?privyUserId=${user.id}&limit=10`)
      .then((r) => r.json())
      .then((d) => setTrades(d.trades ?? []))
      .catch(() => {});
  }, [user?.id]);

  if (!ready || loading) {
    return (
      <TradingShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
        </div>
      </TradingShell>
    );
  }

  const cutoff = period === "ALL" ? -Infinity : Date.now() - PERIOD_MS[period];
  const visibleHistory = history.filter((_, i) => {
    if (period === "ALL") return true;
    // snapshots don't carry enough density yet to filter by real timestamp meaningfully
    // for short windows, so for now all periods show the full available history
    return true;
  });
  void cutoff;

  return (
    <TradingShell>
      <div className="grid grid-cols-[1fr_340px] min-h-[calc(100vh-53px)]">
        {/* Left */}
        <div className="p-5 flex flex-col gap-3.5 border-r-[0.5px] border-[#111]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] text-[#333] uppercase tracking-wide mb-1">Net worth</div>
              <div className="text-[36px] font-medium text-white tracking-[-1px]">
                {netWorth !== null ? formatUSD(netWorth) : "—"}
              </div>
              <div className={`text-[13px] mt-0.5 ${change >= 0 ? "text-[#34d399]" : "text-[#f87171]"}`}>
                {change >= 0 ? "↑" : "↓"} {formatPct(change)} since first tracked
              </div>
            </div>
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-[11px] px-2.5 py-[3px] rounded-lg ${period === p ? "bg-[#13131a] text-[#a78bfa]" : "text-[#333]"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0d0d12] rounded-xl border-[0.5px] border-[#111] p-2.5 flex-1 min-h-[140px]">
            {visibleHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visibleHistory}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#a78bfa" strokeWidth={1.5} fill="url(#pg)" dot={false} />
                  <Tooltip
                    contentStyle={{ background: "#13131a", border: "1px solid #1e1e28", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [formatUSD(v), "Value"]}
                    labelStyle={{ color: "#555" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#333] text-xs">
                Keep using ChadWallet to build your net worth history
              </div>
            )}
          </div>

          <div>
            <div className="text-[11px] text-[#333] uppercase tracking-wide mb-2.5">Holdings</div>
            <div className="grid grid-cols-2 gap-2">
              {holdings.length === 0 ? (
                <p className="text-[#333] text-xs col-span-2">No holdings yet — deposit crypto to get started.</p>
              ) : (
                holdings.map((h) => (
                  <div key={h.mint} className="flex items-center gap-2 p-2 bg-[#13131a] rounded-lg border-[0.5px] border-[#111]">
                    <div className="w-1 rounded-full self-stretch" style={{ background: colorForSymbol(h.symbol) }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#bbb] truncate">{h.symbol}</div>
                      <div className="text-[11px] text-[#444] truncate">
                        {h.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {h.symbol}
                      </div>
                    </div>
                    <div className="text-xs font-medium ml-auto" style={{ color: colorForSymbol(h.symbol) }}>
                      {h.pct.toFixed(0)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="p-5 flex flex-col gap-3.5">
          <div>
            <div className="text-[11px] text-[#333] uppercase tracking-wide mb-2">Recent activity</div>
            {trades.length === 0 ? (
              <p className="text-[#333] text-xs">No trades yet.</p>
            ) : (
              trades.map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 py-2 border-b-[0.5px] border-[#0f0f14] last:border-0">
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: t.side === "buy" ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)" }}
                  >
                    {t.side === "buy" ? (
                      <TrendingUp className="w-3.5 h-3.5 text-[#34d399]" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-[#f87171]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-[#bbb]">{t.side === "buy" ? "Bought" : "Sold"} {t.token_symbol}</div>
                    <div className="text-[10px] text-[#333]">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium ${t.side === "buy" ? "text-[#34d399]" : "text-[#f87171]"}`}>
                      {formatUSD(Number(t.amount_usd))}
                    </div>
                    <div className="text-[10px] text-[#333]">{Number(t.amount_tokens).toLocaleString()} {t.token_symbol}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8">
            <div className="text-xs text-[#888] uppercase tracking-wide mb-2 font-medium">Deposit crypto</div>
            <div className="bg-[#13131a] border-[0.5px] border-[rgba(91,63,232,0.25)] rounded-xl p-3.5">
              <div className="text-[11px] text-[#666] mb-1.5">Your Solana wallet address</div>
              <div className="text-[10px] text-[#888] font-mono break-all leading-relaxed mb-2.5">
                {wallet?.address ?? "Setting up your wallet…"}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => wallet?.address && navigator.clipboard.writeText(wallet.address)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[rgba(91,63,232,0.12)] border-[0.5px] border-[rgba(91,63,232,0.3)] text-[#a78bfa] rounded-lg py-2 text-xs hover:bg-[rgba(91,63,232,0.2)] transition-colors"
                >
                  <Copy className="w-3 h-3" /> Copy address
                </button>
                <button
                  onClick={() => setDepositOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[rgba(91,63,232,0.12)] border-[0.5px] border-[rgba(91,63,232,0.3)] text-[#a78bfa] rounded-lg py-2 text-xs hover:bg-[rgba(91,63,232,0.2)] transition-colors"
                >
                  <QrCode className="w-3 h-3" /> Show QR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {depositOpen && <DepositModal walletAddress={wallet?.address} onClose={() => setDepositOpen(false)} />}
    </TradingShell>
  );
}
