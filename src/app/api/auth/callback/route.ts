import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeSessionCookie } from "@/lib/session";
import type { EmailOtpType } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();
  if (supabase) {
    let authUser = null;

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        authUser = data.user;
      }
    } else if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (!error && data?.user) {
        authUser = data.user;
      }
    }

    if (authUser) {
      await writeSessionCookie({
        id: authUser.id,
        email: authUser.email ?? "",
        name: (authUser.user_metadata?.name as string) || authUser.email?.split("@")[0] || "User",
        demo: false,
        issuedAt: Date.now(),
      });
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could%20not%20authenticate`);
}
