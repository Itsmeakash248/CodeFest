import { normalizeUser } from "@/lib/session-codec";
import { writeSessionCookie } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const isDemo = Boolean(body.demo) || !password;

  // 1. If real credentials provided and Supabase is configured, use Supabase Auth
  const supabase = await createClient();
  if (supabase && password && !isDemo) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (!data.user) {
      return Response.json({ error: "Could not log in with those credentials." }, { status: 400 });
    }
    const user = {
      id: data.user.id,
      email: data.user.email ?? email,
      name:
        (data.user.user_metadata?.name as string) ||
        name ||
        email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      demo: false,
      issuedAt: Date.now(),
    };
    return Response.json({ user });
  }

  // 2. Demo / Fallback mode
  const user = normalizeUser({ email: email || "candidate@viewpilot.demo", name });
  if (!user) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  await writeSessionCookie(user);
  return Response.json({ user });
}
