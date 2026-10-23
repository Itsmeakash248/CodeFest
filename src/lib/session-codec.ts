// Edge-safe session encoding shared by middleware and route handlers.
// This is demo authentication for the hackathon: identity is an unsigned,
// httpOnly cookie. It is NOT production auth and stores no credentials.

export const SESSION_COOKIE = "vp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionUser {
  email: string;
  name: string;
  demo: boolean;
  issuedAt: number;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSession(user: SessionUser): string {
  return toBase64Url(JSON.stringify({ v: 1, ...user }));
}

export function decodeSession(raw: string | undefined | null): SessionUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(raw)) as Partial<SessionUser> & { v?: number };
    if (typeof parsed.email !== "string" || typeof parsed.name !== "string") return null;
    if (typeof parsed.issuedAt !== "number") return null;
    if (Date.now() - parsed.issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return null;
    return {
      email: parsed.email,
      name: parsed.name,
      demo: parsed.demo !== false,
      issuedAt: parsed.issuedAt,
    };
  } catch {
    return null;
  }
}

export function normalizeUser(input: { email?: unknown; name?: unknown }): SessionUser | null {
  const email = typeof input.email === "string" ? input.email.trim().slice(0, 200) : "";
  const nameInput = typeof input.name === "string" ? input.name.trim().slice(0, 80) : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const name = nameInput || email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { email, name, demo: true, issuedAt: Date.now() };
}
