"use client";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Wallet, ArrowRight, Play, CandlestickChart, Sparkles, Zap, Flame, ShieldCheck } from "lucide-react";

const TICKER = [
  { sym: "SOL", price: "$142.30", chg: "+3.1%", up: true },
  { sym: "BONK", price: "$0.0024", chg: "+22.1%", up: true },
  { sym: "WIF", price: "$2.84", chg: "-4.2%", up: false },
  { sym: "JUP", price: "$1.24", chg: "+9.6%", up: true },
  { sym: "PEPE", price: "$0.018", chg: "+18.4%", up: true },
];

const TRENDING = [
  { sym: "BONK", mcap: "$450M mcap", price: "$0.0024", chg: "+22.1%", up: true, bg: "#f59e0b", letter: "B" },
  { sym: "WIF", mcap: "$890M mcap", price: "$2.84", chg: "-4.2%", up: false, bg: "#8b5cf6", letter: "W" },
  { sym: "JUP", mcap: "$1.8B mcap", price: "$1.24", chg: "+9.6%", up: true, bg: "#14b8a6", letter: "J" },
];

const LIVE_TRADES = [
  { addr: "7xKp...3Fq", side: "Buy", amount: "$4,200", up: true },
  { addr: "3mNz...8Wr", side: "Sell", amount: "$890", up: false },
  { addr: "Aa1R...kP4", side: "Buy", amount: "$12,000", up: true },
];

const FEATURES = [
  { icon: Wallet, iconColor: "#a78bfa", iconBg: "rgba(91,63,232,0.12)", title: "No seed phrases", desc: "Sign in with Google or Apple. An embedded Solana wallet is created for you instantly — no crypto knowledge needed." },
  { icon: CandlestickChart, iconColor: "#34d399", iconBg: "rgba(52,211,153,0.1)", title: "Real-time data", desc: "Live token prices, candlestick charts, holder counts, and trade feeds. Everything updates in seconds — not minutes." },
  { icon: Sparkles, iconColor: "#fbbf24", iconBg: "rgba(251,191,36,0.1)", title: "AI insights", desc: "Get a smart 3-sentence read on any token before you trade — momentum, volume signals, and holder trends explained simply." },
  { icon: Zap, iconColor: "#f87171", iconBg: "rgba(248,113,113,0.1)", title: "Instant swaps", desc: "Powered by Jupiter — the best swap router on Solana. Best price across all DEXes, executed in one click." },
  { icon: Flame, iconColor: "#a78bfa", iconBg: "rgba(91,63,232,0.12)", title: "Trending tokens", desc: "See what's moving on Solana right now. Ranked by volume, market cap, and momentum — filter by gainers or new launches." },
  { icon: ShieldCheck, iconColor: "#34d399", iconBg: "rgba(52,211,153,0.1)", title: "Non-custodial", desc: "Your keys, your crypto. We never hold your funds. Your embedded wallet is secured by Privy's MPC technology." },
];

// candlestick bars for the trading-preview chart — purely illustrative, matches the design mock
const CANDLES = [
  { x: 10, wickTop: 92, wickBottom: 108, top: 92, h: 14, up: false },
  { x: 30, wickTop: 80, wickBottom: 100, top: 80, h: 16, up: true },
  { x: 50, wickTop: 65, wickBottom: 88, top: 65, h: 18, up: true },
  { x: 70, wickTop: 58, wickBottom: 78, top: 58, h: 16, up: false },
  { x: 90, wickTop: 46, wickBottom: 68, top: 46, h: 16, up: true },
  { x: 110, wickTop: 35, wickBottom: 55, top: 35, h: 16, up: true },
  { x: 130, wickTop: 26, wickBottom: 46, top: 26, h: 16, up: false },
  { x: 150, wickTop: 16, wickBottom: 36, top: 16, h: 16, up: true },
  { x: 170, wickTop: 10, wickBottom: 28, top: 10, h: 14, up: true },
  { x: 190, wickTop: 8, wickBottom: 22, top: 8, h: 12, up: true },
  { x: 210, wickTop: 6, wickBottom: 18, top: 6, h: 10, up: false },
  { x: 230, wickTop: 4, wickBottom: 14, top: 4, h: 9, up: true },
  { x: 250, wickTop: 2, wickBottom: 10, top: 2, h: 8, up: true },
];

export default function LandingPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/dashboard");
    }
  }, [ready, authenticated, router]);

  const scrollToPreview = () => {
    document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-[#0b0b0e] text-[#e8e8f0]">
      {/* NAV */}
      <div className="flex items-center justify-between px-10 py-[18px] border-b-[0.5px] border-[#151518]">
        <div className="flex items-center gap-2">
          <div className="w-[30px] h-[30px] rounded-lg bg-[#5b3fe8] flex items-center justify-center">
            <Wallet className="w-[14px] h-[14px] text-white" />
          </div>
          <span className="text-base font-medium text-white">ChadWallet</span>
        </div>
        <button
          onClick={login}
          disabled={!ready}
          className="text-[13px] bg-[#5b3fe8] text-white px-[18px] py-[7px] rounded-full disabled:opacity-50"
        >
          Sign in
        </button>
      </div>

      {/* HERO */}
      <div className="px-10 pt-20 pb-[60px] text-center flex flex-col items-center border-b-[0.5px] border-[#111]">
        <div className="inline-flex items-center gap-1.5 bg-[rgba(91,63,232,0.12)] border-[0.5px] border-[rgba(167,139,250,0.25)] rounded-full px-[14px] py-[5px] text-xs text-[#a78bfa] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
          Now live on Solana mainnet
        </div>
        <h1 className="font-serif text-[79px] font-medium leading-[1.06] text-white tracking-[-0.5px] max-w-[680px] mb-5">
          Trade meme coins.
          <br />
          <span className="text-[#a78bfa]">Win the internet.</span>
        </h1>
        <p className="text-lg text-[#555] max-w-[460px] leading-[1.65] mb-8">
          Real-time Solana data, embedded wallet, AI-powered insights and Instant Swaps - all in one place.
        </p>
        <div className="flex gap-[10px] justify-center mb-[44px]">
          <button
            onClick={login}
            disabled={!ready}
            className="bg-[#5b3fe8] text-white px-8 py-3.5 rounded-full text-base font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            Start trading <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={scrollToPreview}
            className="bg-[rgba(255,255,255,0.05)] text-[#888] px-8 py-3.5 rounded-full text-base border-[0.5px] border-[#222] flex items-center gap-1.5"
          >
            <Play className="w-[13px] h-[13px]" /> Watch demo
          </button>
        </div>
        <div className="flex gap-12 justify-center">
          <div className="text-center">
            <div className="text-2xl font-medium text-white">65K</div>
            <div className="text-xs text-[#444] mt-0.5">TPS on Solana</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium text-white">$0.001</div>
            <div className="text-xs text-[#444] mt-0.5">avg tx fee</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium text-white">&lt;30s</div>
            <div className="text-xs text-[#444] mt-0.5">to first trade</div>
          </div>
        </div>
      </div>
      <br/>
      {/* LIVE TICKER */}
      <div className="flex overflow-x-auto md:overflow-hidden border-y-[0.5px] border-[#111]">
        {TICKER.map((t) => (
          <div key={t.sym} className="flex-shrink-0 min-w-[150px] md:min-w-0 md:flex-1 flex items-center justify-between gap-3 px-[18px] py-[10px] border-r-[0.5px] border-[#111] last:border-r-0">
            <span className="text-xs font-medium text-[#777]">{t.sym}</span>
            <div className="whitespace-nowrap">
              <span className="text-xs text-[#bbb]">{t.price}</span>{" "}
              <span className={`text-[11px] ${t.up ? "text-[#34d399]" : "text-[#f87171]"}`}>{t.chg}</span>
            </div>
          </div>
        ))}
      </div>
      <br/>
      {/* TRADING PREVIEW */}
      <div id="preview" className="px-10 py-[60px] border-b-[0.5px] border-[#111]">
        <div className="text-[11px] text-[#5b3fe8] uppercase tracking-[1.5px] mb-3">Live markets</div>
        <h2 className="text-[32px] font-medium text-white tracking-[-0.5px] mb-2">
          Everything moves fast.
          <br />
          So does your data.
        </h2>
        <p className="text-[15px] text-[#555] mb-9 max-w-[440px] leading-[1.6]">
          Prices update in real time. Spot the move before it happens.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* chart card */}
          <div className="md:row-span-2 bg-[#13131a] border-[0.5px] border-[#1a1a24] rounded-2xl p-[18px]">
            <div className="flex items-center justify-between mb-[14px]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ec4899] flex items-center justify-center text-[11px] text-white font-semibold">B</div>
                <div>
                  <div className="text-[13px] font-medium text-[#d0d0e0]">BONK/USDC</div>
                  <div className="text-[10px] text-[#444]">Solana</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-[3px] rounded-full bg-[rgba(52,211,153,0.1)] text-[#34d399] border-[0.5px] border-[rgba(52,211,153,0.2)]">Live</span>
            </div>
            <div className="mb-1">
              <span className="text-[26px] font-medium text-white tracking-[-0.5px]">$0.00243</span>
              <span className="text-[13px] ml-1.5 text-[#34d399]">+22.1%</span>
            </div>
            <div className="text-[11px] text-[#444] mb-4">Vol $128M · Holders 892K</div>
            <svg viewBox="0 0 280 130" width="100%" height="130">
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                </linearGradient>
              </defs>
              {CANDLES.map((c, i) => (
                <g key={i}>
                  <line x1={c.x} y1={c.wickBottom} x2={c.x} y2={c.wickTop} stroke={c.up ? "#34d399" : "#f87171"} strokeWidth="1" />
                  <rect x={c.x - 3} y={c.top} width="7" height={c.h} fill={c.up ? "#34d399" : "#f87171"} rx="1" />
                </g>
              ))}
              <line x1="0" y1="4" x2="280" y2="4" stroke="#34d399" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.3" />
            </svg>
            <div className="flex justify-around mt-[10px]">
              <span className="text-[10px] px-[10px] py-[3px] rounded-lg bg-[rgba(91,63,232,0.15)] text-[#a78bfa]">5m</span>
              <span className="text-[10px] text-[#444] px-[10px] py-[3px]">15m</span>
              <span className="text-[10px] text-[#444] px-[10px] py-[3px]">1h</span>
              <span className="text-[10px] text-[#444] px-[10px] py-[3px]">4h</span>
              <span className="text-[10px] text-[#444] px-[10px] py-[3px]">1d</span>
            </div>
          </div>

          {/* trending card */}
          <div className="bg-[#13131a] border-[0.5px] border-[#1a1a24] rounded-2xl p-[18px]">
            <div className="flex items-center justify-between mb-[14px]">
              <span className="text-[13px] text-[#555]">Trending now</span>
              <span className="text-[10px] px-2 py-[3px] rounded-full bg-[rgba(52,211,153,0.1)] text-[#34d399] border-[0.5px] border-[rgba(52,211,153,0.2)]">Live</span>
            </div>
            {TRENDING.map((t) => (
              <div key={t.sym} className="flex items-center gap-2 py-[6px] border-b-[0.5px] border-[#111] last:border-b-0">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold text-white flex-shrink-0" style={{ background: t.bg }}>
                  {t.letter}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[#bbb]">{t.sym}</div>
                  <div className="text-[10px] text-[#444]">{t.mcap}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#d0d0e0]">{t.price}</div>
                  <div className={`text-[10px] ${t.up ? "text-[#34d399]" : "text-[#f87171]"}`}>{t.chg}</div>
                </div>
              </div>
            ))}
          </div>

          {/* live trades card */}
          <div className="bg-[#13131a] border-[0.5px] border-[#1a1a24] rounded-2xl p-[18px]">
            <div className="flex items-center gap-1.5 mb-[14px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
              <span className="text-[13px] text-[#555]">Live trades</span>
            </div>
            {LIVE_TRADES.map((t, i) => (
              <div key={i} className="flex items-center gap-2 py-[6px] border-b-[0.5px] border-[#111] last:border-b-0">
                <span className="text-[10px] text-[#444] font-mono flex-1">{t.addr}</span>
                <span className={`text-[11px] ${t.up ? "text-[#34d399]" : "text-[#f87171]"}`}>{t.side}</span>
                <span className="text-[11px] text-[#666]">{t.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="px-10 py-[60px] border-b-[0.5px] border-[#111]">
        <div className="text-[11px] text-[#5b3fe8] uppercase tracking-[1.5px] mb-3">Why ChadWallet</div>
        <h2 className="text-[32px] font-medium text-white tracking-[-0.5px] mb-2">Built different.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-9">
          {FEATURES.map(({ icon: Icon, iconColor, iconBg, title, desc }) => (
            <div key={title} className="bg-[#0f0f14] border-[0.5px] border-[#1a1a24] rounded-2xl p-[22px]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-[14px]" style={{ background: iconBg }}>
                <Icon className="w-5 h-5" style={{ color: iconColor }} />
              </div>
              <div className="text-sm font-medium text-[#d0d0e0] mb-1.5">{title}</div>
              <div className="text-xs text-[#444] leading-[1.6]">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="px-10 py-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 bg-[rgba(91,63,232,0.12)] border-[0.5px] border-[rgba(167,139,250,0.25)] rounded-full px-[14px] py-[5px] text-xs text-[#a78bfa] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
          Free to start · No credit card
        </div>
        <h2 className="text-[38px] font-medium text-white tracking-[-1px] max-w-[480px] mb-4">Ready to trade like a chad?</h2>
        <p className="text-[15px] text-[#555] mb-7">Sign in with Google and make your first trade in under 30 seconds.</p>
        <div className="flex gap-2 bg-[#13131a] border-[0.5px] border-[#1e1e28] rounded-full pl-5 pr-1.5 py-1.5 w-full max-w-[380px] mb-3">
          <input className="bg-transparent outline-none text-sm text-[#aaa] flex-1" placeholder="your@email.com" type="email" />
          <button
            onClick={login}
            disabled={!ready}
            className="bg-[#5b3fe8] text-white rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap disabled:opacity-50"
          >
            Get started
          </button>
        </div>
        <p className="text-xs text-[#333]">Or sign in with Google / Apple</p>
      </div>

      {/* FOOTER */}
      <div className="border-t-[0.5px] border-[#111] px-10 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-[22px] h-[22px] rounded-md bg-[#5b3fe8]" />
          <span className="text-[13px] text-[#555]">ChadWallet · 2026</span>
        </div>
        <div className="flex gap-5">
          <span className="text-xs text-[#333]">Privacy</span>
          <span className="text-xs text-[#333]">Terms</span>
          <span className="text-xs text-[#333]">Twitter</span>
        </div>
        <span className="text-xs text-[#333]">Built on Solana</span>
      </div>
    </div>
  );
}
