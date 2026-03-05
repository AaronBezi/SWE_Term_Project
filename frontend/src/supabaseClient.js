/**
 * supabaseClient.js — Supabase client initialization
 *
 * Creates and exports a single shared Supabase client instance used
 * throughout the frontend for authentication (sign in, sign up, sign out)
 * and any reads that go directly through Supabase's API.
 *
 * ─── Security note: why is an API key in frontend code? ───────────────
 * VITE_SUPABASE_ANON_KEY is Supabase's "anon" (anonymous) key. It is
 * intentionally designed to be safe inside public frontend code.
 * It only grants the minimum permissions allowed by Supabase's Row Level
 * Security (RLS) policies — unauthenticated users get read-only access
 * to public data; everything private is blocked at the database level.
 *
 * The key that must NEVER appear in frontend code is the Supabase
 * "service_role" key — that one bypasses all RLS and has full access.
 *
 * Both values are stored in frontend/.env and excluded from git via
 * .gitignore. Vite injects them at build time via import.meta.env.
 * ──────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Warn developers immediately if the .env file is missing or incomplete.
// Without these values the Supabase client silently fails — auth will not work.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[supabaseClient] Missing environment variables. " +
    "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in frontend/.env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
