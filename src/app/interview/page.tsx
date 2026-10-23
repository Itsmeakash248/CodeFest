import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InterviewApp from "@/components/interview/InterviewApp";
import { getSessionFromCookies } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mock interview",
  description:
    "Five adaptive questions, spoken aloud if you want, scored against a visible four-part rubric with evidence from your own answers.",
};

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getSessionFromCookies();
  if (!user) redirect("/login?next=%2Finterview");

  const params = await searchParams;
  const reportParam = Array.isArray(params.report) ? params.report[0] : params.report;

  return (
    <InterviewApp
      user={{ name: user.name, email: user.email }}
      initialReport={reportParam === "latest" ? "latest" : null}
    />
  );
}
