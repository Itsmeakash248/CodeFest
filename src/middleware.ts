import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session-codec";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (user) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/interview/:path*", "/settings/:path*", "/login"],
};
