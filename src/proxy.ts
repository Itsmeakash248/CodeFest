import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session-codec";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Refresh Supabase session cookies if configured
  const { response, user: supabaseUser } = await updateSupabaseSession(request);

  // 2. Check either Supabase user or demo session cookie
  const demoUser = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isAuthenticated = Boolean(supabaseUser || demoUser);

  if (pathname === "/login" || pathname === "/signup") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  if (!isAuthenticated) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/interview/:path*", "/settings/:path*", "/login", "/signup"],
};
