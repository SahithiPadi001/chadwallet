"use client";
// ─── Token Trading View ─────────────────────────────────────────────────────────
// Center chart column + right TradePanel, inside app/tokens/layout.tsx's
// persistent left token list. Real data: /api/token → BirdEye overview/OHLCV/trades.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import { PriceChart } from "@/components/charts/PriceChart";
import { TradePanel } from "@/components/trading/TradePanel";
import { formatUSD, formatPct, formatLargeNumber, shortenAddress } from "@/lib/utils";
import type { TokenOverview, OHLCVBar, Trade } from "@/lib/birdeye";

const TIMEFRAMES = ["1m", "5m", "1H", "4H", "1D"];

function timeAgo(blockTimeSec: number) {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - blockTimeSec);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function TokenTradingPage() {
  const { address } = useParams<{ address: string }>();
  const { user } = usePrivy();

  const [overview, setOverview] = useState<TokenOverview | null>(null);
  const [ohlcv, setOhlcv] = useState<OHLCVBar[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [resolution, setResolution] = useState("1H");
  const [loading, setLoading] = useState(true);

  const fetchData = (res: string) => {
    setLoading(true);
    fetch(`/api/token?address=${address}&resolution=${res}`)
      .then((r) => r.json())
      .then((d) => {
        setOverview(d.overview);
        setOhlcv(d.ohlcv ?? []);
        setTrades(d.trades ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(resolution); }, [address]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/token?address=${address}&resolution=${resolution}`);
      const d = await res.json();
      if (d.trades?.length) setTrades(d.trades);
    }, 5000);
    return () => clearInterval(interval);
  }, [address, resolution]);

  const handleTimeframe = (tf: string) => {
    setResolution(tf);
    fetchData(tf);
  };

  const positive = (overview?.priceChange24hPercent ?? 0) >= 0;

  return (
    <div className="grid grid-cols-[1fr_260px] h-full">
      {/* Center: chart */}
      <div className="flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b-[0.5px] border-[#111] flex items-center gap-3">
          {overview?.logoURI && (
            <Image src={overview.logoURI} alt={overview.symbol} width={32} height={32} className="rounded-full" unoptimized />
          )}
          <span className="text-[15px] font-medium text-[#e8e8f0]">{overview?.symbol ?? "…"}</span>
          <span className="text-[11px] text-[#444]">{overview?.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(91,63,232,0.1)] text-[#a78bfa] border-[0.5px] border-[rgba(91,63,232,0.2)]">SOL</span>
          <div className="ml-auto flex items-baseline gap-1.5">
            <span className="text-[22px] font-medium text-white tracking-[-0.5px]">{overview ? formatUSD(overview.price) : "—"}</span>
            <span className={`text-xs ${positive ? "text-[#34d399]" : "text-[#f87171]"}`}>
              {overview ? formatPct(overview.priceChange24hPercent) : ""}
            </span>
          </div>
        </div>

        <div className="px-4 py-2 border-b-[0.5px] border-[#0f0f14] flex gap-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframe(tf)}
              className={`text-[11px] px-2.5 py-[3px] rounded-lg ${resolution === tf ? "bg-[#13131a] text-[#a78bfa]" : "text-[#333]"}`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex-1 px-2 min-h-[200px]" style={{ height: 240 }}>
          {ohlcv.length > 0 ? (
            <PriceChart data={ohlcv} positive={positive} />
          ) : (
            <div className="h-full flex items-center justify-center text-[#444] text-sm">
              {loading ? "Loading chart..." : "No chart data"}
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 border-t-[0.5px] border-[#111]">
          {[
            { label: "Market cap", value: overview ? `$${formatLargeNumber(overview.marketcap)}` : "—" },
            { label: "24h vol", value: overview ? `$${formatLargeNumber(overview.volume24hUSD)}` : "—" },
            { label: "Holders", value: overview ? formatLargeNumber(overview.holder) : "—" },
            { label: "Liquidity", value: overview ? `$${formatLargeNumber(overview.liquidity)}` : "—" },
          ].map(({ label, value }, i) => (
            <div key={label} className={`px-3.5 py-2 ${i < 3 ? "border-r-[0.5px] border-[#111]" : ""}`}>
              <div className="text-[9px] text-[#333] uppercase tracking-wide mb-0.5">{label}</div>
              <div className="text-xs font-medium text-[#bbb]">{value}</div>
            </div>
          ))}
        </div>

        <div className="border-t-[0.5px] border-[#111] px-3.5 py-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-[5px] h-[5px] rounded-full bg-[#34d399]" />
            <span className="text-[10px] text-[#333] uppercase tracking-wide">Live trades</span>
          </div>
          {trades.length === 0 ? (
            <p className="text-[#333] text-xs py-2">No recent trades</p>
          ) : (
            trades.slice(0, 10).map((trade, i) => (
              <div key={`${trade.txHash ?? "t"}-${i}`} className="flex justify-between items-center py-[3px] text-[10px] border-b-[0.5px] border-[#0a0a0d] last:border-0">
                <span className="text-[#2a2a38] font-mono">{shortenAddress(trade.owner, 4)}</span>
                <span className={trade.side === "buy" ? "text-[#34d399]" : "text-[#f87171]"}>{trade.side === "buy" ? "Buy" : "Sell"}</span>
                <span className="text-[#555]">{formatUSD(trade.volume ?? 0)}</span>
                <span className="text-[9px] text-[#222]">{timeAgo(trade.blockTime)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: trade panel */}
      <TradePanel overview={overview} privyUserId={user?.id} username={user?.google?.name} />
    </div>
  );
}
