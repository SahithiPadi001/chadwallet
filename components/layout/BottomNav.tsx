"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, User } from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home",     icon: Home },
  { href: "/trending",  label: "Trending", icon: Flame },
  { href: "/profile",   label: "Profile",  icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-bg-border flex justify-around py-2 z-50 max-w-md mx-auto">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-col items-center gap-0.5 text-xs px-4 py-1 rounded-xl transition-colors",
              active ? "text-brand-purple" : "text-muted hover:text-dim"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
