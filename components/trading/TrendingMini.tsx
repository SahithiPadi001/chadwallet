"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPct } from "@/lib/utils";
import type { TrendingToken } from "@/lib/birdeye";

export function TrendingMini() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => setTokens((d.tokens ?? []).slice(0, 5)));
  }, []);

  if (!tokens.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted text-xs uppercase tracking-wider">Trending now</p>
        <button onClick={() => router.push("/trending")} className="text-brand-purple text-xs">See all</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tokens.map((t) => (
          <button
            key={t.address}
            onClick={() => router.push(`/token/${t.address}`)}
            className="flex-shrink-0 bg-bg-secondary border border-bg-border rounded-xl px-3 py-2 text-left hover:border-brand-purple/30 transition-colors"
          >
            <p className="text-white text-xs font-medium">{t.symbol}</p>
            <p className={`text-xs ${(t.priceChange24hPercent ?? 0) >= 0 ? "text-green" : "text-red"}`}>
              {formatPct(t.priceChange24hPercent ?? 0)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
