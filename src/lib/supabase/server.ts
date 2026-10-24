import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./status";

export async function createClient(): Promise<SupabaseClient | null> {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Can happen in Server Components where cookies cannot be set; handled safely.
        }
      },
    },
  });
}
