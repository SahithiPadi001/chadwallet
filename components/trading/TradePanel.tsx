"use client";
// ─── Trade Panel ────────────────────────────────────────────────────────────────
// Real swap via Jupiter (lite-api.jup.ag/swap/v1). Pay box drives a live debounced
// quote that fills the receive box — everything here (price, slippage, route) is
// real, except the network-fee line which is a typical Solana fee estimate, not
// computed per-transaction.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useSolanaWallets } from "@privy-io/react-auth";
import { VersionedTransaction } from "@solana/web3.js";
import { Sparkles } from "lucide-react";
import { formatUSD } from "@/lib/utils";
import { getSolanaConnection, getTokenAccounts } from "@/lib/alchemy";
import { getJupiterQuote, getJupiterSwapTransaction, JupiterQuote, USDC_MINT, USDC_DECIMALS } from "@/lib/jupiter";
import type { TokenOverview } from "@/lib/birdeye";

interface Props {
  overview: TokenOverview | null;
  privyUserId?: string;
  username?: string | null;
}

const PRESETS_USD = [25, 50, 100, 250];

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function TradePanel({ overview, privyUserId, username }: Props) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const { wallets } = useSolanaWallets();
  const wallet = wallets[0];

  const tokenAddress = overview?.address ?? "";
  const tokenSymbol = overview?.symbol ?? "";
  const tokenDecimals = overview?.decimals;

  useEffect(() => {
    if (!wallet?.address) return;
    setBalance(null);
    getTokenAccounts(wallet.address)
      .then((accounts) => {
        const mint = side === "buy" ? USDC_MINT : tokenAddress;
        setBalance(accounts.find((a) => a.mint === mint)?.amount ?? 0);
      })
      .catch(() => setBalance(null));
  }, [wallet?.address, side, tokenAddress]);

  // Live debounced quote for the "you receive" box
  useEffect(() => {
    setQuote(null);
    if (!amount || !tokenDecimals || !tokenAddress) return;
    const inputMint = side === "buy" ? USDC_MINT : tokenAddress;
    const outputMint = side === "buy" ? tokenAddress : USDC_MINT;
    const inputDecimals = side === "buy" ? USDC_DECIMALS : tokenDecimals;
    const rawAmount = Math.round(parseFloat(amount) * 10 ** inputDecimals);
    if (!rawAmount || rawAmount <= 0) return;

    setQuoting(true);
    const timeout = setTimeout(() => {
      getJupiterQuote(inputMint, outputMint, rawAmount, 50)
        .then(setQuote)
        .catch(() => setQuote(null))
        .finally(() => setQuoting(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [amount, side, tokenAddress, tokenDecimals]);

  const outputDecimals = side === "buy" ? tokenDecimals : USDC_DECIMALS;
  const receiveAmount = quote && outputDecimals ? Number(quote.outAmount) / 10 ** outputDecimals : null;
  const payUsdValue = parseFloat(amount || "0") * (side === "buy" ? 1 : (overview?.price ?? 0));

  const handleMax = () => {
    if (balance !== null) setAmount(String(balance));
  };

  const handlePreset = (usd: number) => {
    if (side === "buy") setAmount(String(usd));
    else if (overview?.price) setAmount((usd / overview.price).toFixed(6));
  };

  const handleSwap = async () => {
    if (!amount || !wallet || !tokenDecimals || !quote) return;
    setLoading(true);
    setStatus(null);

    try {
      const swapTxBase64 = await getJupiterSwapTransaction(quote, wallet.address);
      const transaction = VersionedTransaction.deserialize(base64ToBytes(swapTxBase64));

      const connection = getSolanaConnection();
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      const amountTokens = side === "buy" ? (receiveAmount ?? 0) : parseFloat(amount);
      const amountUsd = side === "buy" ? parseFloat(amount) : (receiveAmount ?? 0);

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
      setQuote(null);
      setBalance(null);
    } catch (err) {
      console.error("Swap failed:", err);
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "Swap failed" });
    } finally {
      setLoading(false);
    }
  };

  const getAiSummary = async () => {
    if (!overview) return;
    setAiLoading(true);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenData: overview }),
    });
    const data = await res.json();
    setAiSummary(data.summary ?? "");
    setAiLoading(false);
  };

  return (
    <div className="border-l-[0.5px] border-[#111] flex flex-col h-full">
      {/* Buy/Sell tabs */}
      <div className="p-3.5 border-b-[0.5px] border-[#111] flex gap-1.5">
        <button
          onClick={() => { setSide("buy"); setAmount(""); setStatus(null); }}
          className={`flex-1 py-2 text-center rounded-lg text-[13px] font-medium border-[0.5px] transition-colors ${
            side === "buy" ? "bg-[rgba(52,211,153,0.08)] text-[#34d399] border-[rgba(52,211,153,0.15)]" : "text-[#2a2a38] border-[#111]"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => { setSide("sell"); setAmount(""); setStatus(null); }}
          className={`flex-1 py-2 text-center rounded-lg text-[13px] font-medium border-[0.5px] transition-colors ${
            side === "sell" ? "bg-[rgba(248,113,113,0.08)] text-[#f87171] border-[rgba(248,113,113,0.15)]" : "text-[#2a2a38] border-[#111]"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="p-3.5 flex flex-col gap-2.5 flex-1 overflow-y-auto">
        {/* Pay box */}
        <div className="bg-[#13131a] border-[0.5px] border-[#1a1a24] rounded-xl p-3">
          <div className="flex justify-between text-[10px] text-[#333] mb-1.5">
            <span>You pay</span>
            <button onClick={handleMax} disabled={balance === null} className="text-[#5b3fe8] disabled:opacity-40">
              Max{balance !== null ? ` (${balance.toLocaleString(undefined, { maximumFractionDigits: 4 })})` : ""}
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-[24px] font-medium text-[#e8e8f0] font-mono outline-none"
          />
          <div className="text-[10px] text-[#333] mt-0.5">
            {side === "buy" ? "USDC" : tokenSymbol} · {formatUSD(payUsdValue)}
            {balance !== null && ` · Balance: ${formatUSD(side === "buy" ? balance : balance * (overview?.price ?? 0))}`}
          </div>
        </div>

        <div className="flex justify-center text-[#1e1e28]">⇄</div>

        {/* Receive box */}
        <div className="bg-[#13131a] border-[0.5px] border-[#1a1a24] rounded-xl p-3">
          <div className="flex justify-between text-[10px] text-[#333] mb-1.5">
            <span>You receive</span>
            <span className="text-[#333]">{quoting ? "quoting…" : "est."}</span>
          </div>
          <div className="text-[24px] font-medium text-[#444] font-mono">
            {receiveAmount !== null ? receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "0.00"}
          </div>
          <div className="text-[10px] text-[#333] mt-0.5">{side === "buy" ? tokenSymbol : "USDC"}</div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-[5px]">
          {PRESETS_USD.map((usd) => (
            <button
              key={usd}
              onClick={() => handlePreset(usd)}
              className="bg-[#13131a] border-[0.5px] border-[#1a1a24] rounded-lg py-1.5 text-center text-[11px] text-[#555] hover:text-[#a78bfa] hover:border-[rgba(91,63,232,0.3)] transition-colors"
            >
              ${usd}
            </button>
          ))}
        </div>

        {/* Info rows */}
        <div className="bg-[#0d0d12] rounded-lg px-3 py-2.5 flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#333]">Price</span>
            <span className="text-[#666]">{overview ? formatUSD(overview.price) : "—"}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#333]">Slippage</span>
            <span className="text-[#666]">0.5%</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#333]">Network fee</span>
            <span className="text-[#666]">~$0.001</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#333]">Route</span>
            <span className="text-[#a78bfa]">Jupiter</span>
          </div>
        </div>

        {/* AI insight */}
        <div className="bg-[rgba(91,63,232,0.06)] border-[0.5px] border-[rgba(91,63,232,0.15)] rounded-lg p-2.5">
          {aiSummary ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3 h-3 text-[#a78bfa]" />
                <span className="text-[10px] text-[#a78bfa] font-medium">AI insight</span>
              </div>
              <p className="text-[10px] text-[#555] leading-relaxed">{aiSummary}</p>
            </>
          ) : (
            <button
              onClick={getAiSummary}
              disabled={aiLoading || !overview}
              className="w-full flex items-center justify-center gap-1.5 text-[10px] text-[#a78bfa] disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              {aiLoading ? "Generating insight…" : "Get AI insight"}
            </button>
          )}
        </div>
      </div>

      <button
        onClick={handleSwap}
        disabled={!amount || !quote || loading || !wallet || !tokenDecimals}
        className="mx-3.5 mb-3.5 py-3 rounded-xl text-[13px] font-medium text-center disabled:opacity-50 transition-colors"
        style={{ background: side === "buy" ? "#34d399" : "#f87171", color: "#0b0b0e" }}
      >
        {loading ? "Processing…" : `${side === "buy" ? "Buy" : "Sell"} ${tokenSymbol}`}
      </button>

      {status && (
        <p className={`text-[11px] text-center mb-2 ${status.kind === "ok" ? "text-[#34d399]" : "text-[#f87171]"}`}>{status.text}</p>
      )}
      {!wallet && <p className="text-[11px] text-[#444] text-center mb-3">Sign in to trade</p>}
      <p className="text-[10px] text-[#222] text-center pb-2.5">Best price via Jupiter · Solana</p>
    </div>
  );
}
