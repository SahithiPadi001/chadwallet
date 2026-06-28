"use client";
// ─── Trending Tokens Page ─────────────────────────────────────────────────────
// Fetches from /api/trending → BirdEye trending_tokens endpoint
// Click any token → goes to /token/[address]
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { formatUSD, formatPct } from "@/lib/utils";
import type { TrendingToken } from "@/lib/birdeye";
import Image from "next/image";

const FILTERS = ["All", "Top Gainers", "Top Volume", "New"];

export default function TrendingPage() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => { setTokens(d.tokens ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tokens.filter((t) => {
    if (filter === "Top Gainers") return t.priceChange24hPercent > 0;
    if (filter === "Top Volume") return t.volume24hUSD > 1_000_000;
    return true;
  });

  return (
    <AppShell>
      <div className="px-4 md:px-8 pt-6 md:pt-10 pb-4">
        <h1 className="text-white font-semibold text-xl">Trending</h1>
        <p className="text-muted text-xs mt-0.5">Live on Solana</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 md:px-8 pb-3 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors ${
              filter === f
                ? "bg-brand-purple-dim border-brand-purple/40 text-brand-purple"
                : "border-bg-border text-muted hover:text-dim"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Token list */}
      {loading ? (
        <div className="flex justify-center pt-20">
          <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          {filtered.map((token, i) => (
            <button
              key={token.address}
              onClick={() => router.push(`/token/${token.address}`)}
              className="w-full flex items-center gap-3 px-4 md:px-8 py-3 border-b border-bg-border hover:bg-bg-secondary transition-colors"
            >
              {/* Rank */}
              <span className="text-muted text-xs w-4 text-center">{i + 1}</span>

              {/* Logo */}
              <div className="w-9 h-9 rounded-full bg-bg-card flex items-center justify-center overflow-hidden flex-shrink-0">
                {token.logoURI ? (
                  <Image src={token.logoURI} alt={token.symbol} width={36} height={36} className="rounded-full" unoptimized />
                ) : (
                  <span className="text-xs text-muted font-mono">{token.symbol?.slice(0,2)}</span>
                )}
              </div>

              {/* Name + mcap */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-white text-sm font-medium truncate">{token.symbol}</p>
                <p className="text-muted text-xs truncate">{formatUSD(token.marketcap ?? 0, true)} mcap</p>
              </div>

              {/* Volume — desktop only */}
              <div className="hidden md:block text-right w-28 flex-shrink-0">
                <p className="text-dim text-sm">{formatUSD(token.volume24hUSD ?? 0, true)}</p>
                <p className="text-muted text-xs">24h vol</p>
              </div>

              {/* Price + change */}
              <div className="text-right w-20 md:w-24 flex-shrink-0">
                <p className="text-white text-sm">{formatUSD(token.price ?? 0)}</p>
                <p className={`text-xs ${(token.priceChange24hPercent ?? 0) >= 0 ? "text-green" : "text-red"}`}>
                  {formatPct(token.priceChange24hPercent ?? 0)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
