import { createClient } from "@supabase/supabase-js";

// Reads your Supabase project credentials from environment variables.
// Set these in a local `.env` file and in your Vercel project settings:
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
// The anon key is SAFE to expose in the browser — your data is protected by
// Row-Level Security (RLS) on the database, not by hiding this key.
//
// If the variables are absent, `supabase` is null and the app runs in
// local-only mode (data in this browser only, no login).
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;
