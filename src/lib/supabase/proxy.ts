import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./status";
import type { User } from "@supabase/supabase-js";

export interface ProxyAuthResult {
  response: NextResponse;
  user: User | null;
}

export async function updateSupabaseSession(request: NextRequest): Promise<ProxyAuthResult> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) {
    return { response, user: null };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { response, user };
  } catch {
    return { response, user: null };
  }
}
