// Public settings (safe to ship to browsers). Filled in during setup.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

export const SUPABASE_URL = "https://tnzxkxkodqqhvypwbsnj.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XAvNHGYpXaeCPEmaT5VfrQ_aaDUa8tU";
export const VAPID_PUBLIC_KEY = "BNXnqzxCHcx4-S4INvTu-mvtJZ471fsZr6g-lVjaDQY6nJKTfNC6QltcPQC_GjAQ7u2kB688MokHiOAiGmMCBWA";

export const MINUTE_COST = 20;
// Rupees -> credits (₹25 = 100 credits)
export const PACKS = [25, 50, 100, 250].map((rupees) => ({ rupees, credits: rupees * 4 }));

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
