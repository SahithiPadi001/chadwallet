// ─── Supabase Client ──────────────────────────────────────────────────────────
// Docs: https://supabase.com/docs/reference/javascript
// Setup:
//   1. Go to https://supabase.com → New project
//   2. Go to Settings → API → copy URL and anon key
//   3. Paste into .env.local
//   4. Run the SQL schema below in Supabase SQL editor
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for browser use (uses anon key, respects Row Level Security)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client — only use in API routes (has elevated permissions)
export function createServerSupabase() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// ─── Database Types ───────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  privy_user_id: string;
  wallet_address: string | null;
  username: string | null;
  created_at: string;
}

export interface DbTrade {
  id: string;
  user_id: string;
  token_address: string;
  token_symbol: string;
  side: "buy" | "sell";
  amount_usd: number;
  amount_tokens: number;
  tx_hash: string;
  created_at: string;
}

export interface DbNetWorthSnapshot {
  id: string;
  user_id: string;
  value_usd: number;
  recorded_at: string;
}

// ─── Server-side helpers ───────────────────────────────────────────────────────
// Privy (not Supabase Auth) issues identity here, so RLS has no policies tied to
// these rows — every write goes through the service-role client in API routes.

export async function getOrCreateUser(
  privyUserId: string,
  fields: { walletAddress?: string | null; username?: string | null } = {}
): Promise<DbUser> {
  const db = createServerSupabase();

  // Concurrent first-time requests (e.g. nav + portfolio fetch both firing on
  // first login) can race a select-then-insert — upsert on the unique key
  // instead so Postgres resolves the conflict atomically.
  const { data: existing } = await db
    .from("users")
    .select("*")
    .eq("privy_user_id", privyUserId)
    .maybeSingle();

  const { data: upserted, error } = await db
    .from("users")
    .upsert(
      {
        privy_user_id: privyUserId,
        wallet_address: fields.walletAddress ?? existing?.wallet_address ?? null,
        username: fields.username ?? existing?.username ?? null,
      },
      { onConflict: "privy_user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return upserted as DbUser;
}

export async function getUserByPrivyId(privyUserId: string): Promise<DbUser | null> {
  const db = createServerSupabase();
  const { data } = await db.from("users").select("*").eq("privy_user_id", privyUserId).maybeSingle();
  return (data as DbUser) ?? null;
}

// ─── SQL Schema (run once in Supabase SQL Editor) ─────────────────────────────
//
// CREATE TABLE users (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   privy_user_id TEXT UNIQUE NOT NULL,
//   wallet_address TEXT,
//   username TEXT,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE trades (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//   token_address TEXT NOT NULL,
//   token_symbol TEXT NOT NULL,
//   side TEXT CHECK (side IN ('buy','sell')) NOT NULL,
//   amount_usd NUMERIC NOT NULL,
//   amount_tokens NUMERIC NOT NULL,
//   tx_hash TEXT,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE net_worth_snapshots (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//   value_usd NUMERIC NOT NULL,
//   recorded_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Enable RLS
// ALTER TABLE users ENABLE ROW LEVEL SECURITY;
// ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
// ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
