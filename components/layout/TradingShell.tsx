"use client";
import { TradingTopNav } from "./TradingTopNav";

// Same top nav as the Tokens page, without the persistent token-list column —
// used by Portfolio and Leaderboard.
export function TradingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0e]">
      <TradingTopNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
