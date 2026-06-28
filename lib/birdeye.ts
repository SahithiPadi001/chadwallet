// ─── BirdEye API Client ────────────────────────────────────────────────────────
// Docs: https://birdeye.so/data-api
// Sign up at birdeye.so → get API key → paste into .env.local BIRDEYE_API_KEY
//
// SERVER-SIDE ONLY. Never import in client components.
// ──────────────────────────────────────────────────────────────────────────────

const BASE = "https://public-api.birdeye.so";
const API_KEY = process.env.BIRDEYE_API_KEY!;

const birdHeaders = {
  "X-API-KEY": API_KEY,
  "x-chain": "solana",
};

export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
  price: number;
  priceChange24hPercent: number;
  volume24hUSD: number;
  marketcap: number;
  rank: number;
}

export interface NewListing {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
  liquidity: number;
  liquidityAddedAt: string;
}

export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
  price: number;
  priceChange24hPercent: number;
  volume24hUSD: number;
  marketcap: number;
  holder: number;
  liquidity: number;
  decimals: number;
}

export interface OHLCVBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  txHash: string;
  blockTime: number;
  side: "buy" | "sell";
  priceUsd: number;
  volume: number;
  owner: string;
}

export interface TopTrader {
  owner: string;
  tags: string[];
  trades: number;
  tradesBuy: number;
  tradesSell: number;
  volumeUsd: number;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
}

// BirdEye's raw response keys don't match across endpoints (eg. token_trending
// uses "price24hChangePercent" while token_overview uses "priceChange24hPercent",
// and txs/token nests amounts under "base"/"quote" instead of returning them flat) —
// every function below maps the raw shape onto our stable interfaces.

export async function getTrendingTokens(limit = 20): Promise<TrendingToken[]> {
  const res = await fetch(
    `${BASE}/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=${limit}`,
    { headers: birdHeaders, next: { revalidate: 30 } }
  );
  const json = await res.json();
  const tokens = json?.data?.tokens ?? [];
  return tokens.map((t: any) => ({
    address: t.address,
    symbol: t.symbol,
    name: t.name,
    logoURI: t.logoURI,
    price: t.price,
    priceChange24hPercent: t.price24hChangePercent,
    volume24hUSD: t.volume24hUSD,
    marketcap: t.marketcap,
    rank: t.rank,
  }));
}

export async function getNewListings(limit = 20): Promise<NewListing[]> {
  const res = await fetch(`${BASE}/defi/v2/tokens/new_listing?limit=${limit}`, {
    headers: birdHeaders,
    next: { revalidate: 30 },
  });
  const json = await res.json();
  const items = json?.data?.items ?? [];
  return items.map((item: any) => ({
    address: item.address,
    symbol: item.symbol,
    name: item.name,
    logoURI: item.logoURI,
    liquidity: item.liquidity,
    liquidityAddedAt: item.liquidityAddedAt,
  }));
}

export async function getTokenOverview(address: string): Promise<TokenOverview | null> {
  const res = await fetch(`${BASE}/defi/token_overview?address=${address}`, {
    headers: birdHeaders,
    next: { revalidate: 15 },
  });
  const json = await res.json();
  const d = json?.data;
  if (!d) return null;
  return {
    address: d.address,
    symbol: d.symbol,
    name: d.name,
    logoURI: d.logoURI,
    price: d.price,
    priceChange24hPercent: d.priceChange24hPercent,
    volume24hUSD: d.v24hUSD,
    marketcap: d.marketCap,
    holder: d.holder,
    liquidity: d.liquidity,
    decimals: d.decimals,
  };
}

export async function getOHLCV(address: string, resolution = "1H", limit = 100): Promise<OHLCVBar[]> {
  const now = Math.floor(Date.now() / 1000);
  const secs: Record<string, number> = { "1m":60,"5m":300,"15m":900,"1H":3600,"4H":14400,"1D":86400 };
  const timeFrom = now - (secs[resolution] ?? 3600) * limit;
  const res = await fetch(
    `${BASE}/defi/ohlcv?address=${address}&type=${resolution}&time_from=${timeFrom}&time_to=${now}`,
    { headers: birdHeaders }
  );
  const json = await res.json();
  const items = json?.data?.items ?? [];
  return items.map((item: any) => ({
    time: item.unixTime,
    open: item.o,
    high: item.h,
    low: item.l,
    close: item.c,
    volume: item.v,
  }));
}

export async function getTokenTrades(address: string, limit = 20): Promise<Trade[]> {
  const res = await fetch(
    `${BASE}/defi/txs/token?address=${address}&offset=0&limit=${limit}&tx_type=swap`,
    { headers: birdHeaders }
  );
  const json = await res.json();
  const items = json?.data?.items ?? [];
  return items.map((item: any) => {
    // "base" vs "quote" isn't consistently the queried token — pick whichever leg matches
    const leg = item.base?.address === address ? item.base : item.quote;
    return {
      txHash: item.txHash,
      blockTime: item.blockUnixTime,
      side: item.side,
      priceUsd: leg?.price ?? item.basePrice,
      volume: Math.abs(leg?.uiAmount ?? 0) * (leg?.price ?? 0),
      owner: item.owner,
    };
  });
}

export async function getTokenPrice(address: string): Promise<number | null> {
  const res = await fetch(`${BASE}/defi/price?address=${address}`, { headers: birdHeaders });
  const json = await res.json();
  return json?.data?.value ?? null;
}

// Real per-token trader leaderboard. Confirmed live: time_frame supports
// 30m..90d, sort_by supports volume/trade/total_pnl/realized_pnl/unrealized_pnl/volume_usd.
// limit is capped at 10 per BirdEye's docs — paginate via offset for a longer list.
export async function getTopTraders(
  address: string,
  timeFrame = "24h",
  sortBy: "volume" | "trade" | "total_pnl" | "realized_pnl" | "unrealized_pnl" | "volume_usd" = "volume_usd",
  limit = 10,
  offset = 0
): Promise<TopTrader[]> {
  const res = await fetch(
    `${BASE}/defi/v2/tokens/top_traders?address=${address}&time_frame=${timeFrame}&sort_by=${sortBy}&sort_type=desc&limit=${limit}&offset=${offset}`,
    { headers: birdHeaders }
  );
  const json = await res.json();
  const items = json?.data?.items ?? [];
  return items.map((item: any) => ({
    owner: item.owner,
    tags: item.tags ?? [],
    trades: item.trade,
    tradesBuy: item.tradeBuy,
    tradesSell: item.tradeSell,
    volumeUsd: item.volumeUsd,
    totalPnl: item.totalPnl,
    realizedPnl: item.realizedPnl,
    unrealizedPnl: item.unrealizedPnl,
  }));
}

// The batch /defi/multi_price endpoint isn't available on the free API tier
// (403 "lacks sufficient permissions") — fetch each price individually instead.
export async function getMultipleTokenPrices(addresses: string[]): Promise<Record<string, number>> {
  const unique = Array.from(new Set(addresses));
  const prices = await Promise.all(
    unique.map(async (address) => [address, await getTokenPrice(address).catch(() => null)] as const)
  );
  const result: Record<string, number> = {};
  for (const [address, price] of prices) {
    if (price !== null) result[address] = price;
  }
  return result;
}
