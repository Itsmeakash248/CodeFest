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
  const isDemo = Boolean(body.demo);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // 1. If Supabase is configured and not in demo mode
  const supabase = await createClient();
  if (supabase && password && !isDemo) {
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const origin =
      request.headers.get("origin") ||
      (forwardedHost ? `https://${forwardedHost}` : null) ||
      process.env.NEXTAUTH_URL ||
      "https://codefest-zeta.vercel.app";
    const emailRedirectTo = `${origin}/api/auth/callback`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          name: name || email.split("@")[0],
        },
      },
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return Response.json({ error: "Could not create user." }, { status: 400 });
    }

    const user = {
      id: data.user.id,
      email: data.user.email ?? email,
      name: name || (data.user.user_metadata?.name as string) || email.split("@")[0],
      demo: false,
      issuedAt: Date.now(),
    };

    const needsEmailConfirmation = !data.session;
    if (!needsEmailConfirmation) {
      await writeSessionCookie(user);
    }
    return Response.json({ user, needsEmailConfirmation });
  }

  // 2. Demo fallback
  const user = normalizeUser({ email, name });
  if (!user) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  await writeSessionCookie(user);
  return Response.json({ user, needsEmailConfirmation: false });
}
