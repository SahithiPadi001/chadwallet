// ─── Alchemy Solana RPC ───────────────────────────────────────────────────────
// Docs: https://docs.alchemy.com/reference/solana-api
// Setup:
//   1. Go to https://dashboard.alchemy.com
//   2. Create App → Network: Solana Mainnet
//   3. Copy API key → paste into .env.local NEXT_PUBLIC_ALCHEMY_RPC_URL
// ─────────────────────────────────────────────────────────────────────────────

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL!;

export const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";

// Create a Solana connection via Alchemy
export function getSolanaConnection(): Connection {
  return new Connection(RPC_URL, "confirmed");
}

/** Get SOL balance for a wallet address */
export async function getSolBalance(walletAddress: string): Promise<number> {
  const connection = getSolanaConnection();
  const pubkey = new PublicKey(walletAddress);
  const lamports = await connection.getBalance(pubkey);
  return lamports / LAMPORTS_PER_SOL;
}

/** Get all SPL token accounts (token balances) for a wallet */
export async function getTokenAccounts(walletAddress: string) {
  const connection = getSolanaConnection();
  const pubkey = new PublicKey(walletAddress);

  const { value } = await connection.getParsedTokenAccountsByOwner(pubkey, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  });

  return value
    .map((acc) => {
      const info = acc.account.data.parsed?.info;
      return {
        mint: info?.mint as string,
        amount: info?.tokenAmount?.uiAmount as number,
        decimals: info?.tokenAmount?.decimals as number,
      };
    })
    .filter((t) => t.amount > 0);
}

/** Get recent transaction history for a wallet */
export async function getWalletTransactions(walletAddress: string, limit = 10) {
  const connection = getSolanaConnection();
  const pubkey = new PublicKey(walletAddress);
  const sigs = await connection.getSignaturesForAddress(pubkey, { limit });
  return sigs;
}
