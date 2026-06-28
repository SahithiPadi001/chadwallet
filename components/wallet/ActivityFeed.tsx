"use client";
// ─── Activity Feed ─────────────────────────────────────────────────────────────
// Real data: GET /api/trades → Supabase `trades` table.
// Rows are only created when a real swap completes in BuySellPanel — empty until
// the user's first trade.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { formatUSD } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DbTrade } from "@/lib/supabase";

export function ActivityFeed({ privyUserId }: { privyUserId?: string }) {
  const [trades, setTrades] = useState<DbTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!privyUserId) return;
    setLoading(true);
    fetch(`/api/trades?privyUserId=${privyUserId}&limit=10`)
      .then((r) => r.json())
      .then((d) => {
        setTrades(d.trades ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [privyUserId]);

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-bg-border rounded-2xl p-6 text-center text-muted text-sm">
        Loading…
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="bg-bg-secondary border border-bg-border rounded-2xl p-6 text-center text-muted text-sm">
        No trades yet — your first buy or sell will show up here.
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-bg-border rounded-2xl overflow-hidden">
      {trades.map((item) => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-bg-border last:border-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
            item.side === "buy" ? "bg-green-trade-dim" : "bg-red-trade-dim"
          }`}>
            {item.side === "buy"
              ? <TrendingUp className="w-4 h-4 text-green-trade" />
              : <TrendingDown className="w-4 h-4 text-red-trade" />
            }
          </div>
          <div className="flex-1">
            <p className="text-white text-sm">{item.side === "buy" ? "Bought" : "Sold"} {item.token_symbol}</p>
            <p className="text-muted text-xs">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${item.side === "buy" ? "text-green" : "text-red"}`}>
              {formatUSD(Number(item.amount_usd))}
            </p>
            <p className="text-muted text-xs">{Number(item.amount_tokens).toLocaleString()} {item.token_symbol}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
