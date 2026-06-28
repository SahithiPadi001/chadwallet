"use client";
// ─── Leaderboard Page ───────────────────────────────────────────────────────────
// Real per-token top traders (BirdEye) — there's no real global cross-token
// trader ranking available on our API tier, so this is framed as "top traders
// of [token]" rather than a fake global leaderboard. See plan notes.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";
import { Flame } from "lucide-react";
import { TradingShell } from "@/components/layout/TradingShell";
import { formatUSD, formatPct, shortenAddress, colorForSymbol } from "@/lib/utils";
import type { TrendingToken, TopTrader } from "@/lib/birdeye";

const PERIODS = ["24h", "7d", "30d", "90d"] as const;

const TAG_COLORS: Record<string, string> = {
  whale: "#f59e0b",
  bundler: "#8b5cf6",
  sniper: "#f87171",
};

export default function LeaderboardPage() {
  const { user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const wallet = wallets[0];

  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [selected, setSelected] = useState<TrendingToken | null>(null);
  const [period, setPeriod] = useState<typeof PERIODS[number]>("7d");
  const [traders, setTraders] = useState<(TopTrader & { rank: number })[]>([]);
  const [yours, setYours] = useState<(TopTrader & { rank: number }) | null>(null);
  const [recentMoves, setRecentMoves] = useState<{ owner: string; side: string; volume: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => {
        setTokens(d.tokens ?? []);
        if (d.tokens?.[0]) setSelected(d.tokens[0]);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    const params = new URLSearchParams({ address: selected.address, timeframe: period });
    if (wallet?.address) params.set("walletAddress", wallet.address);
    fetch(`/api/leaderboard?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setTraders(d.traders ?? []);
        setYours(d.yours ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/token?address=${selected.address}`)
      .then((r) => r.json())
      .then((d) => setRecentMoves((d.trades ?? []).slice(0, 2)))
      .catch(() => {});
  }, [selected, period, wallet?.address]);

  return (
    <TradingShell>
      <div className="grid grid-cols-[1fr_280px] min-h-[calc(100vh-53px)]">
        {/* Main */}
        <div className="border-r-[0.5px] border-[#111] flex flex-col">
          <div className="px-5 py-4 border-b-[0.5px] border-[#111] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-base font-medium text-[#e8e8f0]">Top traders</div>
                <div className="text-[11px] text-[#333] mt-0.5">Ranked by volume · Solana</div>
              </div>
              {tokens.length > 0 && (
                <select
                  value={selected?.address ?? ""}
                  onChange={(e) => setSelected(tokens.find((t) => t.address === e.target.value) ?? null)}
                  className="bg-[#13131a] border-[0.5px] border-[#1e1e28] rounded-lg text-xs text-[#bbb] px-2.5 py-1.5 outline-none"
                >
                  {tokens.map((t) => (
                    <option key={t.address} value={t.address}>{t.symbol}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-[11px] px-3 py-1 rounded-lg border-[0.5px] ${
                    period === p ? "bg-[rgba(91,63,232,0.1)] text-[#a78bfa] border-[rgba(91,63,232,0.2)]" : "text-[#444] border-transparent"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[40px_1fr_110px_110px_120px] px-5 py-2 border-b-[0.5px] border-[#0f0f14]">
            {["#", "Trader", "PnL", "Volume", "Buy/Sell trades"].map((h, i) => (
              <span key={h} className={`text-[10px] text-[#2a2a38] uppercase tracking-wide ${i >= 2 ? "text-right" : ""}`}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center pt-10">
              <div className="w-5 h-5 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            traders.map((t) => {
              const isYou = wallet?.address === t.owner;
              return (
                <div
                  key={t.owner}
                  className={`grid grid-cols-[40px_1fr_110px_110px_120px] items-center px-5 py-2.5 border-b-[0.5px] border-[#0a0a0d] ${isYou ? "bg-[rgba(91,63,232,0.04)] border-l-2 border-l-[#5b3fe8]" : ""}`}
                >
                  <span className="text-[13px] font-medium text-[#2a2a38]">{t.rank}</span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                      style={{ background: colorForSymbol(t.owner) }}
                    >
                      {t.owner.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-medium text-[#d0d0e0]">{isYou ? "you" : shortenAddress(t.owner, 4)}</span>
                        {t.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-[1px] rounded-lg"
                            style={{ background: `${TAG_COLORS[tag] ?? "#555"}20`, color: TAG_COLORS[tag] ?? "#888" }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-[#2a2a38] font-mono">{shortenAddress(t.owner, 4)}</div>
                    </div>
                  </div>
                  <div className={`text-xs text-right font-medium ${t.totalPnl >= 0 ? "text-[#34d399]" : "text-[#f87171]"}`}>
                    {t.totalPnl >= 0 ? "+" : ""}{formatUSD(t.totalPnl)}
                  </div>
                  <div className="text-xs text-right text-[#555]">{formatUSD(t.volumeUsd, true)}</div>
                  <div className="flex items-center justify-end gap-1">
                    <div className="flex h-1.5 w-16 rounded-full overflow-hidden bg-[#111]">
                      <div className="bg-[#34d399]" style={{ width: `${(t.tradesBuy / (t.trades || 1)) * 100}%` }} />
                      <div className="bg-[#f87171]" style={{ width: `${(t.tradesSell / (t.trades || 1)) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-[#333]">{t.trades}</span>
                  </div>
                </div>
              );
            })
          )}

          {!loading && !yours && (
            <div className="px-5 py-3 text-[11px] text-[#333]">
              {user ? "You haven't traded this token in the selected window." : "Sign in and trade to see your rank here."}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="p-4 flex flex-col gap-4">
          {yours && (
            <div>
              <div className="text-[10px] text-[#2a2a38] uppercase tracking-wide mb-2">Your rank</div>
              <div className="bg-[#13131a] border-[0.5px] border-[rgba(91,63,232,0.2)] rounded-xl p-3.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-[#0d0d12] rounded-lg p-2">
                    <div className="text-[9px] text-[#333] uppercase mb-0.5">PnL</div>
                    <div className={`text-[13px] font-medium ${yours.totalPnl >= 0 ? "text-[#34d399]" : "text-[#f87171]"}`}>
                      {formatUSD(yours.totalPnl)}
                    </div>
                  </div>
                  <div className="bg-[#0d0d12] rounded-lg p-2">
                    <div className="text-[9px] text-[#333] uppercase mb-0.5">Volume</div>
                    <div className="text-[13px] font-medium text-[#bbb]">{formatUSD(yours.volumeUsd, true)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 mt-2 py-2 bg-[rgba(91,63,232,0.08)] rounded-lg border-[0.5px] border-[rgba(91,63,232,0.15)]">
                  <span className="text-[11px] text-[#555]">Rank</span>
                  <span className="text-base font-medium text-[#a78bfa]">#{yours.rank}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] text-[#2a2a38] uppercase tracking-wide mb-2">Hot tokens</div>
            {tokens.slice(0, 5).map((t) => (
              <button
                key={t.address}
                onClick={() => setSelected(t)}
                className="w-full flex items-center gap-2 py-1.5 border-b-[0.5px] border-[#0f0f14] last:border-0 text-left"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0"
                  style={{ background: colorForSymbol(t.symbol) }}
                >
                  {t.symbol?.[0]}
                </div>
                <span className="text-xs text-[#bbb]">{t.symbol}</span>
                <span className={`text-xs ml-auto ${t.priceChange24hPercent >= 0 ? "text-[#34d399]" : "text-[#f87171]"}`}>
                  {formatPct(t.priceChange24hPercent)}
                </span>
              </button>
            ))}
          </div>

          <div>
            <div className="text-[10px] text-[#2a2a38] uppercase tracking-wide mb-2 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Recent moves
            </div>
            {recentMoves.length === 0 ? (
              <p className="text-[#333] text-xs">No recent trades.</p>
            ) : (
              recentMoves.map((m, i) => (
                <div key={i} className="bg-[#13131a] border-[0.5px] border-[#111] rounded-lg p-2.5 mb-1.5">
                  <span className="text-[11px] text-[#888] font-mono">{shortenAddress(m.owner, 4)}</span>
                  <span className="text-[11px] text-[#555]"> {m.side === "buy" ? "bought" : "sold"} </span>
                  <span className={`text-[11px] ${m.side === "buy" ? "text-[#34d399]" : "text-[#f87171]"}`}>{formatUSD(m.volume)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </TradingShell>
  );
}
