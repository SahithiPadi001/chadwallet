"use client";
// ─── Token Detail + Trade Page ────────────────────────────────────────────────
// Shows: price chart (lightweight-charts), stats, buy/sell, live trades, AI summary
// Data: /api/token?address=xxx → BirdEye
// Chart: lightweight-charts (free, TradingView alternative for OHLCV)
//        To use official TradingView Charting Library instead, replace
//        the PriceChart component with TradingView's Widget
//        Docs: https://www.tradingview.com/charting-library-docs/latest/api/
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowLeft, Sparkles, Users, Droplets } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PriceChart } from "@/components/charts/PriceChart";
import { LiveTrades } from "@/components/trading/LiveTrades";
import { BuySellPanel } from "@/components/trading/BuySellPanel";
import { formatUSD, formatPct, formatLargeNumber } from "@/lib/utils";
import type { TokenOverview, OHLCVBar, Trade } from "@/lib/birdeye";
import Image from "next/image";

const TIMEFRAMES = ["5m", "15m", "1H", "4H", "1D"];

export default function TokenPage() {
  const { address } = useParams<{ address: string }>();
  const router = useRouter();
  const { user } = usePrivy();

  const [overview, setOverview] = useState<TokenOverview | null>(null);
  const [ohlcv, setOhlcv] = useState<OHLCVBar[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [resolution, setResolution] = useState("1H");
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
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

  const handleTimeframe = (tf: string) => {
    setResolution(tf);
    fetchData(tf);
  };

  const getAiSummary = async () => {
    if (!overview) return;
    setAiLoading(true);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenData: overview }),
    });
    const data = await res.json();
    setAiSummary(data.summary ?? "");
    setAiLoading(false);
  };

  const positive = (overview?.priceChange24hPercent ?? 0) >= 0;

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-8 pt-6 md:pt-10 pb-3">
        <button onClick={() => router.back()} className="text-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {overview?.logoURI && (
          <Image src={overview.logoURI} alt={overview.symbol} width={28} height={28} className="rounded-full" unoptimized />
        )}
        <span className="text-white font-semibold">{overview?.symbol ?? "..."}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-purple-dim text-brand-purple border border-brand-purple/30">SOL</span>
      </div>

      <div className="px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Chart + stats */}
        <div className="md:col-span-2 min-w-0">
          {/* Price */}
          <div className="pb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-white">
                {overview ? formatUSD(overview.price) : "—"}
              </span>
              <span className={`text-sm ${positive ? "text-green" : "text-red"}`}>
                {overview ? formatPct(overview.priceChange24hPercent) : ""}
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="mb-2 bg-bg-secondary rounded-2xl border border-bg-border overflow-hidden" style={{ height: 200 }}>
            {ohlcv.length > 0 ? (
              <PriceChart data={ohlcv} positive={positive} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted text-sm">
                {loading ? "Loading chart..." : "No chart data"}
              </div>
            )}
          </div>

          {/* Timeframe selector */}
          <div className="flex justify-around mb-4">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframe(tf)}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  resolution === tf ? "bg-brand-purple-dim text-brand-purple" : "text-muted"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              { label: "Market Cap", value: overview ? `$${formatLargeNumber(overview.marketcap)}` : "—" },
              { label: "24h Volume", value: overview ? `$${formatLargeNumber(overview.volume24hUSD)}` : "—" },
              { label: "Holders", value: overview ? formatLargeNumber(overview.holder) : "—", icon: Users },
              { label: "Liquidity", value: overview ? `$${formatLargeNumber(overview.liquidity)}` : "—", icon: Droplets },
            ].map(({ label, value }) => (
              <div key={label} className="bg-bg-secondary border border-bg-border rounded-xl p-3">
                <p className="text-muted text-xs mb-1">{label}</p>
                <p className="text-white text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          <div className="mb-4">
            {aiSummary ? (
              <div className="bg-bg-secondary border border-brand-purple/20 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
                  <span className="text-brand-purple text-xs font-medium">AI Insight</span>
                </div>
                <p className="text-dim text-sm leading-relaxed">{aiSummary}</p>
              </div>
            ) : (
              <button
                onClick={getAiSummary}
                disabled={aiLoading || !overview}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-bg-border text-muted text-sm hover:border-brand-purple/40 hover:text-brand-purple transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? "Generating insight..." : "Get AI insight"}
              </button>
            )}
          </div>
        </div>

        {/* Buy/Sell + Live Trades */}
        <div className="md:col-span-1 min-w-0 mb-4 space-y-4">
          <div className="md:sticky md:top-24">
            <BuySellPanel
              tokenAddress={address}
              tokenSymbol={overview?.symbol ?? ""}
              tokenPrice={overview?.price ?? 0}
              tokenDecimals={overview?.decimals}
              privyUserId={user?.id}
              username={user?.google?.name}
            />
          </div>
          <LiveTrades trades={trades} tokenAddress={address} />
        </div>
      </div>
    </AppShell>
  );
}
