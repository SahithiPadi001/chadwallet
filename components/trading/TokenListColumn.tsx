"use client";
// ─── Token List Column ──────────────────────────────────────────────────────────
// Persistent left column of the Tokens layout — lives in app/tokens/layout.tsx so
// it doesn't re-fetch/re-render when the selected token (right side) changes.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { clsx } from "clsx";
import { formatUSD, formatPct, colorForSymbol } from "@/lib/utils";

interface ListToken {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
  price: number;
  priceChange24hPercent: number;
  volume24hUSD: number;
  marketcap: number;
}

const FILTERS = ["Trending", "New", "Gainers"] as const;

interface Props {
  search?: string;
}

export function TokenListColumn({ search }: Props) {
  const [filter, setFilter] = useState<typeof FILTERS[number]>("Trending");
  const [tokens, setTokens] = useState<ListToken[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams<{ address?: string }>();
  const activeAddress = params?.address;

  useEffect(() => {
    setLoading(true);
    const apiFilter = filter === "New" ? "new" : "trending";
    fetch(`/api/trending?filter=${apiFilter}`)
      .then((r) => r.json())
      .then((d) => {
        let list: ListToken[] = d.tokens ?? [];
        if (filter === "Gainers") {
          list = list.filter((t) => t.priceChange24hPercent > 0).sort((a, b) => b.priceChange24hPercent - a.priceChange24hPercent);
        }
        setTokens(list);
        setLoading(false);

        // Landing on the bare /tokens route (no address yet) — jump straight to
        // whatever this same list considers #1, so the selected token always
        // matches what's actually shown at the top of the list. Doing this here
        // (instead of a separate server-side redirect with its own fetch) avoids
        // the two disagreeing when BirdEye's trending order shifts between calls.
        if (!activeAddress && filter === "Trending" && list[0]?.address) {
          router.replace(`/tokens/${list[0].address}`);
        }
      })
      .catch(() => setLoading(false));
  }, [filter]);

  const filtered = search
    ? tokens.filter(
        (t) => t.symbol?.toLowerCase().includes(search.toLowerCase()) || t.name?.toLowerCase().includes(search.toLowerCase())
      )
    : tokens;

  return (
    <div className="border-r-[0.5px] border-[#111] flex flex-col overflow-hidden h-full">
      <div className="p-2.5 border-b-[0.5px] border-[#111] flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "text-[11px] px-2.5 py-[3px] rounded-lg border-[0.5px] transition-colors",
              filter === f ? "bg-[rgba(91,63,232,0.12)] text-[#a78bfa] border-[rgba(91,63,232,0.2)]" : "text-[#555] border-transparent hover:text-[#888]"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-5 h-5 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          filtered.map((token, i) => {
            const active = token.address === activeAddress;
            return (
              <button
                key={token.address}
                onClick={() => router.push(`/tokens/${token.address}`)}
                className={clsx(
                  "w-full flex items-center gap-2 px-3.5 py-2 border-b-[0.5px] border-[#0f0f14] text-left transition-colors",
                  active ? "bg-[#13131a]" : "hover:bg-[#0d0d12]"
                )}
              >
                <span className="text-[10px] text-[#2a2a38] w-3.5 text-center flex-shrink-0">{i + 1}</span>
                <div
                  className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0 overflow-hidden"
                  style={{ background: colorForSymbol(token.symbol ?? "?") }}
                >
                  {token.logoURI ? (
                    <Image src={token.logoURI} alt={token.symbol} width={26} height={26} unoptimized />
                  ) : (
                    token.symbol?.[0]?.toUpperCase() ?? "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#d0d0e0] truncate">{token.symbol}</div>
                  <div className="text-[10px] text-[#333] truncate">
                    {token.volume24hUSD ? `Vol ${formatUSD(token.volume24hUSD, true)}` : "New listing"}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-[#bbb]">{token.price ? formatUSD(token.price) : "—"}</div>
                  {!!token.price && (
                    <div className={`text-[10px] ${token.priceChange24hPercent >= 0 ? "text-[#34d399]" : "text-[#f87171]"}`}>
                      {formatPct(token.priceChange24hPercent)}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
