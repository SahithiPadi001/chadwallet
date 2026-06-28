"use client";
import { useState } from "react";
import { TradingTopNav } from "@/components/layout/TradingTopNav";
import { TokenListColumn } from "@/components/trading/TokenListColumn";

export default function TokensLayout({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");

  return (
    <div className="h-screen flex flex-col bg-[#0b0b0e]">
      <TradingTopNav search={search} onSearchChange={setSearch} />
      <div className="flex-1 grid grid-cols-[220px_1fr] overflow-hidden">
        <TokenListColumn search={search} />
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
