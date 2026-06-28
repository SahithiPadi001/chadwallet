"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Wallet, Home, Flame } from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/trending", label: "Trending", icon: Flame },
];

// Desktop-only top navbar — BottomNav covers the equivalent mobile nav
export function TopNav() {
  const pathname = usePathname();
  const { user } = usePrivy();

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-bg-border sticky top-0 bg-bg-primary/95 backdrop-blur z-50">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-purple-dim border border-brand-purple/30 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-brand-purple" />
          </div>
          <span className="text-white font-semibold">ChadWallet</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors",
                  active ? "bg-brand-purple-dim text-brand-purple" : "text-muted hover:text-dim"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        href="/profile"
        className={clsx(
          "w-9 h-9 rounded-full bg-brand-purple-dim border flex items-center justify-center text-brand-purple text-sm font-medium transition-colors",
          pathname.startsWith("/profile") ? "border-brand-purple" : "border-brand-purple/30 hover:border-brand-purple"
        )}
      >
        {(user?.google?.name?.[0] ?? "?").toUpperCase()}
      </Link>
    </header>
  );
}
