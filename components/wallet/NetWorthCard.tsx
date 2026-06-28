"use client";
// ─── Net Worth Card ────────────────────────────────────────────────────────────
// Real data: /api/portfolio → on-chain balance (Alchemy) + live prices (BirdEye)
// History is real Supabase snapshots recorded on every load — starts sparse for
// new users and fills in as they keep using the app.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { formatUSD, formatPct } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";

interface Props {
  walletAddress?: string;
  privyUserId?: string;
  username?: string | null;
}

export function NetWorthCard({ walletAddress, privyUserId, username }: Props) {
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [change, setChange] = useState(0);
  const [history, setHistory] = useState<{ t: string; v: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress || !privyUserId) return;
    setLoading(true);
    const params = new URLSearchParams({ address: walletAddress, privyUserId });
    if (username) params.set("username", username);

    fetch(`/api/portfolio?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setNetWorth(d.netWorth);
        setChange(d.change ?? 0);
        setHistory(d.history ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [walletAddress, privyUserId, username]);

  return (
    <div className="bg-bg-secondary border border-bg-border rounded-2xl p-4">
      <p className="text-muted text-xs mb-1">Net worth</p>
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-3xl font-semibold text-white">
          {netWorth !== null ? formatUSD(netWorth) : loading ? "…" : "—"}
        </span>
      </div>
      <p className={`text-sm mb-3 ${change >= 0 ? "text-green" : "text-red"}`}>
        {change >= 0 ? "↑" : "↓"} {formatPct(change)} since first tracked
      </p>
      {history.length > 1 ? (
        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="#a78bfa" fill="url(#netGrad)" strokeWidth={1.5} dot={false} />
            <Tooltip
              contentStyle={{ background: "#13131a", border: "1px solid #1e1e28", borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => [formatUSD(v), "Value"]}
              labelStyle={{ color: "#555" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted text-xs py-4 text-center">
          {loading ? "Loading…" : "Keep using ChadWallet to build your net worth history"}
        </p>
      )}
    </div>
  );
}
