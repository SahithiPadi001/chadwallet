"use client";
// ─── Buy / Sell Panel ─────────────────────────────────────────────────────────
// Real swap via Jupiter (lite-api.jup.ag/swap/v1 — the old quote-api.jup.ag/v6
// domain referenced in older docs is dead, verified by direct request).
// Flow: get quote → build tx → sign+send with Privy embedded wallet → confirm →
// record the trade in Supabase.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useSolanaWallets } from "@privy-io/react-auth";
import { VersionedTransaction } from "@solana/web3.js";
import { formatUSD } from "@/lib/utils";
import { getSolanaConnection, getTokenAccounts } from "@/lib/alchemy";
import { getJupiterQuote, getJupiterSwapTransaction, USDC_MINT, USDC_DECIMALS } from "@/lib/jupiter";

interface Props {
  tokenAddress: string;
  tokenSymbol: string;
  tokenPrice: number;
  tokenDecimals?: number;
  privyUserId?: string;
  username?: string | null;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function BuySellPanel({ tokenAddress, tokenSymbol, tokenPrice, tokenDecimals, privyUserId, username }: Props) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const { wallets } = useSolanaWallets();
  const wallet = wallets[0];

  const usdValue = parseFloat(amount || "0") * (side === "buy" ? 1 : tokenPrice);

  // Balance for the "Max" button — USDC balance when buying, token balance when selling
  useEffect(() => {
    if (!wallet?.address) return;
    setBalance(null);
    getTokenAccounts(wallet.address)
      .then((accounts) => {
        const mint = side === "buy" ? USDC_MINT : tokenAddress;
        const match = accounts.find((a) => a.mint === mint);
        setBalance(match?.amount ?? 0);
      })
      .catch(() => setBalance(null));
  }, [wallet?.address, side, tokenAddress]);

  const handleMax = () => {
    if (balance !== null) setAmount(String(balance));
  };

  const handleSwap = async () => {
    if (!amount || !wallet || !tokenDecimals) return;
    setLoading(true);
    setStatus(null);

    try {
      const inputMint = side === "buy" ? USDC_MINT : tokenAddress;
      const outputMint = side === "buy" ? tokenAddress : USDC_MINT;
      const inputDecimals = side === "buy" ? USDC_DECIMALS : tokenDecimals;
      const rawAmount = Math.round(parseFloat(amount) * 10 ** inputDecimals);

      const quote = await getJupiterQuote(inputMint, outputMint, rawAmount, 50);
      const swapTxBase64 = await getJupiterSwapTransaction(quote, wallet.address);
      const transaction = VersionedTransaction.deserialize(base64ToBytes(swapTxBase64));

      const connection = getSolanaConnection();
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      const outputDecimals = side === "buy" ? tokenDecimals : USDC_DECIMALS;
      const amountTokens = side === "buy" ? Number(quote.outAmount) / 10 ** outputDecimals : parseFloat(amount);
      const amountUsd = side === "buy" ? parseFloat(amount) : Number(quote.outAmount) / 10 ** outputDecimals;

      if (privyUserId) {
        await fetch("/api/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            privyUserId,
            walletAddress: wallet.address,
            username,
            tokenAddress,
            tokenSymbol,
            side,
            amountUsd,
            amountTokens,
            txHash: signature,
          }),
        }).catch(() => {});
      }

      setStatus({ kind: "ok", text: `${side === "buy" ? "Bought" : "Sold"} ${tokenSymbol} — tx ${signature.slice(0, 8)}…` });
      setAmount("");
      setBalance(null);
    } catch (err) {
      console.error("Swap failed:", err);
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "Swap failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-secondary border border-bg-border rounded-2xl p-4">
      {/* Buy/Sell tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setSide("buy"); setAmount(""); setStatus(null); }}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            side === "buy"
              ? "bg-green-trade-dim border border-green-trade/30 text-green-trade"
              : "text-muted border border-bg-border"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => { setSide("sell"); setAmount(""); setStatus(null); }}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            side === "sell"
              ? "bg-red-trade-dim border border-red-trade/30 text-red-trade"
              : "text-muted border border-bg-border"
          }`}
        >
          Sell
        </button>
      </div>

      {/* Amount input */}
      <div className="bg-bg-card border border-bg-border rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-muted text-xs">{side === "buy" ? "You pay (USDC)" : `You sell (${tokenSymbol})`}</span>
          <button onClick={handleMax} disabled={balance === null} className="text-brand-purple text-xs disabled:opacity-40">
            Max{balance !== null ? ` (${balance.toLocaleString(undefined, { maximumFractionDigits: 4 })})` : ""}
          </button>
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-transparent text-white text-xl outline-none font-mono"
        />
        <p className="text-muted text-xs mt-1">≈ {formatUSD(usdValue)}</p>
      </div>

      {/* Swap button */}
      <button
        onClick={handleSwap}
        disabled={!amount || loading || !wallet || !tokenDecimals}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
          side === "buy"
            ? "bg-green-trade-dim border border-green-trade/30 text-green-trade hover:bg-green-trade hover:text-bg-primary"
            : "bg-red-trade-dim border border-red-trade/30 text-red-trade hover:bg-red-trade hover:text-white"
        }`}
      >
        {loading ? "Processing..." : `${side === "buy" ? "Buy" : "Sell"} ${tokenSymbol}`}
      </button>

      {status && (
        <p className={`text-xs mt-2 text-center ${status.kind === "ok" ? "text-green" : "text-red"}`}>{status.text}</p>
      )}
      {!wallet && <p className="text-muted text-xs mt-2 text-center">Connect wallet to trade</p>}
    </div>
  );
}
