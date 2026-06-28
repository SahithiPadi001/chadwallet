"use client";
import { useEffect, useState } from "react";
import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Copy, LogOut, ExternalLink, DollarSign } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DepositModal } from "@/components/wallet/DepositModal";
import { shortenAddress, formatUSD } from "@/lib/utils";
import { getTokenAccounts } from "@/lib/alchemy";
import { USDC_MINT } from "@/lib/jupiter";

export default function ProfilePage() {
  const { user, authenticated, logout } = usePrivy();
  const { ready: walletsReady, wallets, createWallet } = useSolanaWallets();
  const router = useRouter();
  const wallet = wallets[0];
  const [depositOpen, setDepositOpen] = useState(false);
  const [cashBalance, setCashBalance] = useState<number | null>(null);

  // Self-heal: createOnLogin should auto-create an embedded wallet, but if it
  // didn't (race condition, earlier failed attempt, etc.), create one now.
  useEffect(() => {
    if (authenticated && walletsReady && wallets.length === 0) {
      createWallet().catch((err) => console.error("createWallet failed:", err));
    }
  }, [authenticated, walletsReady, wallets.length, createWallet]);

  // "Cash balance" = USDC held, distinct from total net worth (which includes
  // price-fluctuating token positions) shown on the dashboard.
  useEffect(() => {
    if (!wallet?.address) return;
    getTokenAccounts(wallet.address)
      .then((accounts) => setCashBalance(accounts.find((a) => a.mint === USDC_MINT)?.amount ?? 0))
      .catch(() => setCashBalance(null));
  }, [wallet?.address]);

  const copyAddress = () => {
    if (wallet?.address) navigator.clipboard.writeText(wallet.address);
  };

  return (
    <AppShell>
      <div className="px-4 pt-6 md:pt-10 pb-4 max-w-md mx-auto">
        <h1 className="text-white font-semibold text-xl mb-6">Profile</h1>

        {/* Avatar + name — left aligned */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-full bg-brand-purple-dim border border-brand-purple/30 flex items-center justify-center text-brand-purple text-xl font-semibold flex-shrink-0">
            {(user?.google?.name?.[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <p className="text-white font-medium">{user?.google?.name ?? "Anonymous"}</p>
            <p className="text-muted text-sm">{user?.google?.email ?? ""}</p>
          </div>
        </div>

        {/* Cash balance */}
        <div className="flex items-center justify-between bg-bg-secondary border border-bg-border rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-bg-card border border-bg-border flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-dim" />
            </div>
            <div className="min-w-0">
              <p className="text-muted text-xs">Cash balance</p>
              <p className="text-white font-semibold truncate">
                {cashBalance !== null ? formatUSD(cashBalance) : "…"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              disabled
              title="Coming soon"
              className="px-4 py-2 rounded-xl bg-bg-card border border-bg-border text-muted text-sm font-medium opacity-50 cursor-not-allowed"
            >
              Withdraw
            </button>
            <button
              onClick={() => setDepositOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-purple text-white text-sm font-medium hover:bg-purple-400 transition-colors"
            >
              Deposit
            </button>
          </div>
        </div>

        {/* Wallet address */}
        {wallet?.address && (
          <div className="bg-bg-secondary border border-bg-border rounded-2xl p-4 mb-3">
            <p className="text-muted text-xs mb-1">Wallet address</p>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-mono">{shortenAddress(wallet.address, 6)}</span>
              <div className="flex gap-2">
                <button onClick={copyAddress} className="text-muted hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={`https://solscan.io/account/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={async () => { await logout(); router.push("/"); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-bg-border text-muted hover:text-red-trade hover:border-red-trade/30 transition-colors mt-4"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {depositOpen && <DepositModal walletAddress={wallet?.address} onClose={() => setDepositOpen(false)} />}
    </AppShell>
  );
}
