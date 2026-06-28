# ChadWallet 🟣

A Solana trading terminal — sign in with Google/Apple (Privy embedded wallet), browse real trending tokens, trade via Jupiter, track your portfolio, and check per-token trader leaderboards. Built with Next.js, Privy, BirdEye, Alchemy, Jupiter, and Supabase.

---

## Quick Start (5 steps)

### 1. Install dependencies
```bash
cd chadwallet
npm install
```

### 2. Get your API keys

Open `.env.local` and fill in each value:

| Key | Where to get it |
|-----|----------------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | [console.privy.io](https://console.privy.io) → New App → copy App ID, then enable Google/Apple under Login Methods |
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) → Project → Settings → API → Project URL (no trailing path) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → service_role key |
| `BIRDEYE_API_KEY` | [birdeye.so](https://birdeye.so/data-api) → Sign up → API Keys |
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | [dashboard.alchemy.com](https://dashboard.alchemy.com) → Create App → Solana Mainnet → copy URL |
| `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_DEPLOYMENT` | [portal.azure.com](https://portal.azure.com) → Azure OpenAI resource → Keys and Endpoint |

### 3. Set up Supabase database

Go to your Supabase project → SQL Editor → run this:

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  privy_user_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  side TEXT CHECK (side IN ('buy','sell')) NOT NULL,
  amount_usd NUMERIC NOT NULL,
  amount_tokens NUMERIC NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE net_worth_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  value_usd NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
```

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel
```bash
npm i -g vercel
vercel
# Follow prompts. Add all .env.local values as Environment Variables in Vercel dashboard.
```

---

## Project Structure

```
chadwallet/
├── app/
│   ├── page.tsx                  ← Landing / login page (Privy)
│   ├── layout.tsx                ← Root layout + Privy provider
│   ├── globals.css               ← Global styles + Tailwind
│   ├── tokens/
│   │   ├── layout.tsx            ← Top nav + persistent token list column
│   │   ├── page.tsx              ← Redirects to the top trending token
│   │   └── [address]/page.tsx    ← Chart + stats + live trades + trade panel
│   ├── portfolio/page.tsx        ← Net worth, holdings, activity, deposit
│   ├── leaderboard/page.tsx      ← Per-token top traders (real BirdEye data)
│   └── api/
│       ├── trending/route.ts     ← GET /api/trending → BirdEye trending/new listings
│       ├── token/route.ts        ← GET /api/token?address= → overview/OHLCV/trades
│       ├── portfolio/route.ts    ← GET /api/portfolio → real net worth + holdings
│       ├── trades/route.ts       ← GET/POST trade history (Supabase)
│       ├── leaderboard/route.ts  ← GET /api/leaderboard → BirdEye top traders
│       └── ai/route.ts           ← POST /api/ai → Azure OpenAI token insight
│
├── components/
│   ├── layout/
│   │   ├── TradingTopNav.tsx     ← Tokens/Portfolio/Leaderboard nav + balance + deposit
│   │   ├── TradingShell.tsx      ← Top nav wrapper for Portfolio/Leaderboard
│   │   └── PrivyProvider.tsx     ← Auth provider
│   ├── charts/
│   │   └── PriceChart.tsx        ← Candlestick chart (lightweight-charts)
│   ├── trading/
│   │   ├── TokenListColumn.tsx   ← Persistent left token list (Trending/New/Gainers)
│   │   └── TradePanel.tsx        ← Real Jupiter swap (quote → sign → send → record)
│   └── wallet/
│       └── DepositModal.tsx      ← Real QR code + wallet address
│
├── lib/
│   ├── birdeye.ts                ← BirdEye API client (server only)
│   ├── alchemy.ts                ← Solana RPC via Alchemy
│   ├── jupiter.ts                ← Jupiter swap quote/transaction client
│   ├── supabase.ts                ← Supabase client + DB types + getOrCreateUser
│   └── utils.ts                  ← formatUSD, formatPct, colorForSymbol, etc.
│
├── .env.local                    ← Your secrets (never commit this)
└── .env.example                  ← Template to share
```

---

## What's wired up

- Google/Apple/email login via Privy (Google/Apple require enabling in the Privy dashboard)
- Auto-created Solana embedded wallet per user
- Trending/new-listing tokens, real-time price chart, live trades, holders/liquidity — all real BirdEye data
- Real swaps via Jupiter (quote → build tx → sign with embedded wallet → send → confirm → record)
- Real net worth (Alchemy balances × BirdEye prices) and holdings allocation
- Real activity feed and trade history (Supabase)
- Real deposit flow (QR code + address)
- Per-token trader leaderboard (real BirdEye PnL/volume/tags) — note this is "top traders of token X," not a global cross-token leaderboard, since no real data source for that exists on the free API tier
- AI token insight via Azure OpenAI

## Key Docs

- [Privy React Quickstart](https://docs.privy.io/guide/react/quickstart)
- [BirdEye API Reference](https://birdeye.so/data-api)
- [Alchemy Solana RPC](https://docs.alchemy.com/reference/solana-api)
- [Jupiter Swap API](https://dev.jup.ag/docs/swap-api/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
