import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(value: number, compact = false): string {
  if (compact && value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (compact && value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (compact && value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

export function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function shortenAddress(addr: string, chars = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}
