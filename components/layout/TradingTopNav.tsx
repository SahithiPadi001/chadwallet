"use client";
// ─── Trading Top Nav ────────────────────────────────────────────────────────────
// Desktop-only top nav for the post-login trading terminal (Tokens/Portfolio/
// Leaderboard). Cash balance is the real USDC holding, same source as Portfolio.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";
import { Wallet, Search, Copy, ExternalLink, LogOut, ArrowDownToLine } from "lucide-react";
import { clsx } from "clsx";
import { formatUSD, shortenAddress } from "@/lib/utils";
import { getTokenAccounts } from "@/lib/alchemy";
import { USDC_MINT } from "@/lib/jupiter";
import { DepositModal } from "@/components/wallet/DepositModal";

const TABS = [
  { href: "/tokens", label: "Tokens" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/leaderboard", label: "Leaderboard" },
];

interface Props {
  search?: string;
  onSearchChange?: (value: string) => void;
}

export function TradingTopNav({ search, onSearchChange }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = usePrivy();
  const { wallets } = useSolanaWallets();
  const wallet = wallets[0];
  const [balance, setBalance] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wallet?.address) return;
    getTokenAccounts(wallet.address)
      .then((accounts) => setBalance(accounts.find((a) => a.mint === USDC_MINT)?.amount ?? 0))
      .catch(() => setBalance(null));
  }, [wallet?.address]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const copyAddress = () => {
    if (wallet?.address) navigator.clipboard.writeText(wallet.address);
  };

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b-[0.5px] border-[#111] bg-[#0d0d11]">
      <div className="flex items-center gap-4">
        <Link href="/tokens" className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-[#5b3fe8] flex items-center justify-center">
            <Wallet className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-white">ChadWallet</span>
        </Link>

        <nav className="flex gap-0.5">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  "px-3 py-[5px] text-xs rounded-lg transition-colors",
                  active ? "bg-[#13131a] text-[#e0e0f0]" : "text-[#555] hover:text-[#888]"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {onSearchChange && (
          <div className="flex items-center gap-1.5 bg-[#13131a] border-[0.5px] border-[#1e1e28] rounded-lg px-3 py-[5px] w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#444]" />
            <input
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tokens..."
              className="bg-transparent outline-none text-xs text-[#bbb] placeholder:text-[#444] flex-1"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-xs text-[#888]">
          Balance: <span className="text-[#e0e0f0] font-medium">{balance !== null ? formatUSD(balance) : "…"}</span>
        </span>
        <button
          onClick={() => setDepositOpen(true)}
          className="flex items-center gap-1.5 bg-[#5b3fe8] text-white text-xs font-medium px-3 py-[5px] rounded-lg hover:bg-[#6d4ff0] transition-colors"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          Deposit
        </button>
        <div className="flex items-center gap-1.5 bg-[#13131a] border-[0.5px] border-[#1e1e28] rounded-lg px-2.5 py-[5px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
          <span className="text-[11px] text-[#666]">Solana</span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-7 h-7 rounded-full bg-[#5b3fe8] flex items-center justify-center text-[11px] text-white font-medium"
          >
            {(user?.google?.name?.[0] ?? "?").toUpperCase()}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-[#13131a] border-[0.5px] border-[#1e1e28] rounded-xl shadow-xl p-3 z-50">
              <p className="text-white text-sm font-medium truncate">{user?.google?.name ?? "Anonymous"}</p>
              <p className="text-[#555] text-xs truncate mb-2">{user?.google?.email ?? ""}</p>
              {wallet?.address && (
                <div className="flex items-center justify-between bg-[#0d0d12] rounded-lg px-2.5 py-2 mb-2">
                  <span className="text-[#bbb] text-xs font-mono">{shortenAddress(wallet.address, 4)}</span>
                  <div className="flex gap-2">
                    <button onClick={copyAddress} className="text-[#555] hover:text-white transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`https://solscan.io/account/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#555] hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
              <button
                onClick={async () => { await logout(); router.push("/"); }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#1e1e28] text-[#555] hover:text-[#f87171] hover:border-[#f87171]/30 transition-colors text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {depositOpen && <DepositModal walletAddress={wallet?.address} onClose={() => setDepositOpen(false)} />}
    </header>
  );
}
