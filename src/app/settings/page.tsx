import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SettingsPanel from "@/components/settings/SettingsPanel";
import { getSessionFromCookies } from "@/lib/session";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Tune your interview voice, review provider status, test the presence robot and manage the local practice data ViewPilot keeps in this browser.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionFromCookies();
  if (!user) redirect("/login?next=%2Fsettings");

  return <SettingsPanel user={{ name: user.name, email: user.email }} />;
}
