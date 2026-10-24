const DEFAULT_NEXT = "/dashboard";

/** Keep post-auth redirects inside this app and out of the auth routes. */
export function safeNext(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return DEFAULT_NEXT;
  if (raw === "/login" || raw.startsWith("/login?") || raw === "/signup" || raw.startsWith("/signup?")) {
    return DEFAULT_NEXT;
  }
  return raw;
}
