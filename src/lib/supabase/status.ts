export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  return {
    url,
    anonKey,
    serviceRoleKey,
    configured: Boolean(url && anonKey),
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv().configured;
}
