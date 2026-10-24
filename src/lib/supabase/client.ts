"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./status";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}
