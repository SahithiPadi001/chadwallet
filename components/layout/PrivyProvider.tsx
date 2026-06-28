"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { useEffect } from "react";

// ─── Configure Privy ──────────────────────────────────────────────────────────
// Privy handles:  Google/Apple sign-in + auto-creates an embedded Solana wallet
// Docs: https://docs.privy.io/guide/react/quickstart
// Steps:
//   1. Go to https://console.privy.io
//   2. Create a new app
//   3. Copy your App ID into .env.local → NEXT_PUBLIC_PRIVY_APP_ID
// ─────────────────────────────────────────────────────────────────────────────

// Privy's modal shows a "Recent" badge next to whichever method this browser
// last logged in with — there's no appearance/config flag to turn it off, so
// this watches the modal portal and removes any leaf badge whose text is
// exactly "Recent" (text-based, so it survives internal class name changes).
function HideRecentBadge() {
  useEffect(() => {
    const hideRecentBadges = () => {
      document.querySelectorAll("#headlessui-portal-root *").forEach((el) => {
        if (el.children.length === 0 && el.textContent?.trim() === "Recent") {
          (el as HTMLElement).style.display = "none";
        }
      });
    };
    const observer = new MutationObserver(hideRecentBadges);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#a78bfa",
        },
        loginMethods: ["google", "apple", "email"],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      <HideRecentBadge />
      {children}
    </PrivyProvider>
  );
}
