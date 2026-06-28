# ChadWallet 🟣

A Solana trading app — fomo.family style. Built with Next.js, Privy, BirdEye, and Alchemy.

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
| `NEXT_PUBLIC_PRIVY_APP_ID` | [console.privy.io](https://console.privy.io) → New App → copy App ID |
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) → Project → Settings → API → Project URL |
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
│   ├── page.tsx               ← Landing / login page (Privy)
│   ├── layout.tsx             ← Root layout + Privy provider
│   ├── globals.css            ← Global styles + Tailwind
│   ├── dashboard/page.tsx     ← Net worth + activity feed
│   ├── trending/page.tsx      ← Trending tokens list
│   ├── token/[address]/       ← Token detail + chart + buy/sell
│   └── api/
│       ├── trending/route.ts  ← GET /api/trending → BirdEye
│       ├── token/route.ts     ← GET /api/token?address=
│       └── ai/route.ts        ← POST /api/ai → Claude summary
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx       ← Page wrapper with bottom nav
│   │   ├── BottomNav.tsx      ← Navigation bar
│   │   └── PrivyProvider.tsx  ← Auth provider
│   ├── charts/
│   │   └── PriceChart.tsx     ← Candlestick chart (lightweight-charts)
│   ├── trading/
│   │   ├── BuySellPanel.tsx   ← Buy/sell UI (Jupiter TODO inside)
│   │   ├── LiveTrades.tsx     ← Polling live trades feed
│   │   └── TrendingMini.tsx   ← Mini trending for dashboard
│   └── wallet/
│       ├── NetWorthCard.tsx   ← Portfolio value + sparkline
│       └── ActivityFeed.tsx   ← Recent trades list
│
├── lib/
│   ├── birdeye.ts             ← BirdEye API client (server only)
│   ├── alchemy.ts             ← Solana RPC via Alchemy
│   ├── supabase.ts            ← Supabase client + DB types
│   └── utils.ts               ← formatUSD, formatPct, etc.
│
├── .env.local                 ← Your secrets (never commit this)
└── .env.example               ← Template to share
```

---

## What's wired up vs. TODO

### ✅ Done
- Google/Apple login via Privy
- Auto-created Solana embedded wallet per user
- Trending tokens page (real BirdEye data)
- Token detail page: price, stats, chart
- Candlestick chart (lightweight-charts)
- Live trades feed (polls every 5s)
- AI token summary (Claude API)
- Profile page with wallet address + deposit info
- Bottom nav, dark theme, mobile layout

### 🔧 TODO (wire up yourself)
- **Real net worth**: use `getTokenAccounts()` + `getMultipleTokenPrices()` (see comments in `NetWorthCard.tsx`)
- **Real activity feed**: query Supabase `trades` table (see comments in `ActivityFeed.tsx`)
- **Buy/sell swap**: integrate Jupiter API (see `BuySellPanel.tsx` — the exact steps are commented inside)
- **TradingView Charting Library**: replace `PriceChart.tsx` with official TV widget for advanced features
- **Save user to Supabase**: after Privy login, upsert into `users` table

---

## Key Docs

- [Privy React Quickstart](https://docs.privy.io/guide/react/quickstart)
- [BirdEye API Reference](https://birdeye.so/data-api)
- [Alchemy Solana RPC](https://docs.alchemy.com/reference/solana-api)
- [Jupiter Swap API](https://station.jup.ag/docs/apis/swap-api)
- [TradingView Charting Library](https://www.tradingview.com/charting-library-docs/latest/api/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
