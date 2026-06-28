"use client";
// ─── Deposit Modal ──────────────────────────────────────────────────────────────
// Step 1: choose a deposit method (crypto is real; card on-ramp is genuinely not
// built yet, shown disabled rather than faked).
// Step 2: real QR code + wallet address for a crypto transfer.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { ArrowLeft, Check, Copy, CreditCard, Loader2, QrCode, X } from "lucide-react";
import { shortenAddress } from "@/lib/utils";

interface Props {
  walletAddress?: string;
  onClose: () => void;
}

export function DepositModal({ walletAddress, onClose }: Props) {
  const [step, setStep] = useState<"choose" | "crypto">("choose");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-bg-secondary border border-bg-border rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          {step === "crypto" ? (
            <button onClick={() => setStep("choose")} className="text-muted hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <span className="w-5 h-5" />
          )}
          <h2 className="text-white font-medium text-base">
            {step === "choose" ? "Deposit with" : "Deposit crypto"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "choose" ? (
          <div className="p-4 pt-2 space-y-3">
            <button
              onClick={() => setStep("crypto")}
              disabled={!walletAddress}
              className="w-full flex items-center justify-between bg-bg-card border border-bg-border rounded-2xl p-4 text-left hover:border-brand-purple/40 transition-colors disabled:opacity-60 disabled:hover:border-bg-border"
            >
              <div>
                <p className="text-white font-medium text-sm">Crypto</p>
                <p className="text-muted text-xs mt-0.5">
                  {walletAddress ? "Transfer SOL or USDC from a crypto wallet" : "Setting up your wallet…"}
                </p>
              </div>
              {walletAddress ? (
                <QrCode className="w-5 h-5 text-muted flex-shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-muted flex-shrink-0 animate-spin" />
              )}
            </button>

            <div className="w-full flex items-center justify-between bg-bg-card border border-bg-border rounded-2xl p-4 opacity-50">
              <div>
                <p className="text-white font-medium text-sm">Credit or debit</p>
                <p className="text-muted text-xs mt-0.5">Coming soon!</p>
              </div>
              <CreditCard className="w-5 h-5 text-muted flex-shrink-0" />
            </div>
          </div>
        ) : (
          <div className="p-5 pt-2 flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl mb-4">
              <QRCode value={walletAddress ?? ""} size={176} />
            </div>
            <p className="text-muted text-xs mb-1">Your ChadWallet address</p>
            <button
              onClick={copyAddress}
              className="flex items-center gap-2 bg-bg-card border border-bg-border rounded-xl px-4 py-2.5 mb-4 max-w-full"
            >
              <span className="text-white text-sm font-mono truncate">
                {walletAddress ? shortenAddress(walletAddress, 6) : ""}
              </span>
              {copied ? <Check className="w-4 h-4 text-green-trade flex-shrink-0" /> : <Copy className="w-4 h-4 text-muted flex-shrink-0" />}
            </button>
            <p className="text-muted text-xs text-center leading-relaxed">
              Only send SOL or SPL tokens on the Solana network to this address. Sending anything else may result in permanent loss.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
