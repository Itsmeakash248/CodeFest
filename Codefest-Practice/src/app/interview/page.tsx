import type { Metadata } from "next";
import InterviewClient from "@/components/vp/InterviewClient";

export const metadata: Metadata = {
  title: "Practice interview — ViewPilot",
  description:
    "Set a role, experience level, interview type and difficulty, then complete a five-question mock interview with evidence-backed feedback.",
};

export default function InterviewPage() {
  return <InterviewClient />;
}
