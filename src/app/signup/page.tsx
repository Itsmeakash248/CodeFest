import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import { safeNext } from "@/lib/next-path";

export const metadata: Metadata = {
  title: "Create your free desk",
  description:
    "Create a free ViewPilot Pro desk. Five specialist agents, adaptive mock interviews and an evidence-backed scorecard. Demo authentication — no password is stored.",
};

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  return <AuthForm mode="signup" nextPath={safeNext(params.next)} />;
}
