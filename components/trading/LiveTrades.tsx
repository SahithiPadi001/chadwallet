"use client";
// ─── Live Trades Feed ──────────────────────────────────────────────────────────
// Polls /api/token?address=xxx every 5 seconds for fresh trades
// For true real-time, switch to BirdEye WebSocket when available
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { formatUSD, shortenAddress } from "@/lib/utils";
import type { Trade } from "@/lib/birdeye";

interface Props {
  trades: Trade[];
  tokenAddress: string;
}

export function LiveTrades({ trades: initialTrades, tokenAddress }: Props) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);

  // Poll every 5 seconds for new trades
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/token?address=${tokenAddress}`);
        const data = await res.json();
        if (data.trades?.length) setTrades(data.trades);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [tokenAddress]);

  useEffect(() => { setTrades(initialTrades); }, [initialTrades]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-trade animate-pulse" />
        <span className="text-muted text-xs uppercase tracking-wider">Live trades</span>
      </div>
      <div className="bg-bg-secondary border border-bg-border rounded-2xl overflow-hidden">
        {trades.length === 0 ? (
          <p className="text-muted text-sm text-center py-6">No recent trades</p>
        ) : (
          trades.slice(0, 10).map((trade, i) => (
            // a single tx can contain multiple swap legs and share one txHash, so index disambiguates
            <div key={`${trade.txHash ?? "trade"}-${i}`} className="flex items-center justify-between px-3 py-2.5 border-b border-bg-border last:border-0">
              <span className="text-muted text-xs font-mono">{shortenAddress(trade.owner)}</span>
              <span className={`text-xs font-medium ${trade.side === "buy" ? "text-green" : "text-red"}`}>
                {trade.side === "buy" ? "Buy" : "Sell"}
              </span>
              <span className="text-dim text-xs">{formatUSD(trade.volume ?? 0)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
