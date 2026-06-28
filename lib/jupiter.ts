// ─── Jupiter Swap API ──────────────────────────────────────────────────────────
// Docs: https://dev.jup.ag/docs/swap-api/
// Free tier base URL — note: the older quote-api.jup.ag/v6 domain is dead
// (verified: connection fails outright). lite-api.jup.ag/swap/v1 is the current
// no-API-key endpoint for the swap flow.
//
// CLIENT-SIDE: safe to call directly from the browser — no secret key involved,
// and the swap transaction must be built with the connected wallet's own pubkey.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "https://lite-api.jup.ag/swap/v1";

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_DECIMALS = 6;

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  [key: string]: unknown;
}

/** Get a swap quote. `amount` must be the raw integer amount in the input token's smallest unit. */
export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps = 50
): Promise<JupiterQuote> {
  const res = await fetch(
    `${BASE}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${Math.floor(amount)}&slippageBps=${slippageBps}`
  );
  if (!res.ok) throw new Error(`Jupiter quote failed: ${res.status}`);
  const json = await res.json();
  if (json?.error) throw new Error(`Jupiter quote error: ${json.error}`);
  return json;
}

/** Build the serialized (base64) swap transaction for a quote, ready to sign. */
export async function getJupiterSwapTransaction(quote: JupiterQuote, userPublicKey: string): Promise<string> {
  const res = await fetch(`${BASE}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
    }),
  });
  if (!res.ok) throw new Error(`Jupiter swap build failed: ${res.status}`);
  const json = await res.json();
  if (json?.error) throw new Error(`Jupiter swap error: ${json.error}`);
  return json.swapTransaction as string;
}
