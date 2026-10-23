import { normalizeUser } from "@/lib/session-codec";
import { writeSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const user = normalizeUser({ email: body.email, name: body.name });
  if (!user) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  await writeSessionCookie(user);
  return Response.json({ user });
}
