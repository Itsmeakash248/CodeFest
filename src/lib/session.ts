import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  decodeSession,
  encodeSession,
  type SessionUser,
} from "@/lib/session-codec";
import { createClient } from "@/lib/supabase/server";

export type { SessionUser };

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  try {
    // 1. Check Supabase session if configured
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) {
        const rawName =
          (user.user_metadata?.name as string) ||
          user.email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return {
          id: user.id,
          email: user.email,
          name: rawName,
          demo: false,
          issuedAt: Math.floor(new Date(user.created_at).getTime()),
        };
      }
    }

    // 2. Fall back to demo session cookie
    const store = await cookies();
    return decodeSession(store.get(SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}

export async function writeSessionCookie(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: encodeSession(user),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  try {
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
  } catch {
    // ignore
  }

  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
