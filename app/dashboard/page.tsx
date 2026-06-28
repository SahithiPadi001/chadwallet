"use client";
// ─── Dashboard Page ───────────────────────────────────────────────────────────
// Shows: net worth, portfolio sparkline, recent activity
// Auth guard: redirects to / if not logged in
// Data: wallet balance from Alchemy + token prices from BirdEye
// ─────────────────────────────────────────────────────────────────────────────

import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDownToLine } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { NetWorthCard } from "@/components/wallet/NetWorthCard";
import { ActivityFeed } from "@/components/wallet/ActivityFeed";
import { DepositModal } from "@/components/wallet/DepositModal";
import { TrendingMini } from "@/components/trading/TrendingMini";

export default function DashboardPage() {
  const { ready, authenticated, user } = usePrivy();
  const { ready: walletsReady, wallets, createWallet } = useSolanaWallets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (ready && !authenticated) router.push("/");
    if (ready) setLoading(false);
  }, [ready, authenticated, router]);

  // Self-heal: createOnLogin should auto-create an embedded wallet, but if it
  // didn't (race condition, earlier failed attempt, etc.), create one now.
  useEffect(() => {
    if (authenticated && walletsReady && wallets.length === 0) {
      createWallet().catch((err) => console.error("createWallet failed:", err));
    }
  }, [authenticated, walletsReady, wallets.length, createWallet]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const wallet = wallets[0]; // Privy embedded wallet

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 pt-6 md:pt-10 pb-4">
        <div>
          <p className="text-muted text-sm">Good morning 👋</p>
          <p className="text-white font-medium text-lg">
            {user?.google?.name?.split(" ")[0] ?? "Trader"}
          </p>
        </div>
        <div className="md:hidden w-10 h-10 rounded-full bg-brand-purple-dim border border-brand-purple/30 flex items-center justify-center text-brand-purple font-medium">
          {(user?.google?.name?.[0] ?? "?").toUpperCase()}
        </div>
      </div>

      <div className="px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Net Worth + Activity */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          <NetWorthCard walletAddress={wallet?.address} privyUserId={user?.id} username={user?.google?.name} />
          <button
            onClick={() => setDepositOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-purple-dim border border-brand-purple/30 text-brand-purple text-sm font-medium hover:bg-brand-purple/20 transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Deposit
          </button>
          <div>
            <p className="text-muted text-xs uppercase tracking-wider mb-2">Recent activity</p>
            <ActivityFeed privyUserId={user?.id} />
          </div>
        </div>

        {/* Trending sidebar */}
        <div className="md:col-span-1 mb-4 md:mb-0">
          <TrendingMini />
        </div>
      </div>

      {depositOpen && <DepositModal walletAddress={wallet?.address} onClose={() => setDepositOpen(false)} />}
    </AppShell>
  );
}
