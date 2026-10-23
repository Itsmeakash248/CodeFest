import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSessionFromCookies } from "@/lib/session";

export const metadata: Metadata = {
  title: "Workspace",
  description:
    "Five specialist agents, a drag-and-drop prep workflow and live run status in one workspace.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getSessionFromCookies();
  if (!user) redirect("/login?next=%2Fdashboard");

  const params = await searchParams;
  const agent = Array.isArray(params.agent) ? params.agent[0] : params.agent;
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email }}
      initialAgent={agent}
      initialMode={mode}
    />
  );
}
