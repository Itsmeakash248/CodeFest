import { createClient } from "@/lib/supabase/server";
import type { InterviewReport } from "@/lib/types";

export interface StoredInterviewRecord {
  id: string;
  user_id: string;
  session_id: string;
  overall: number;
  band: string;
  role: string;
  report_json: InterviewReport;
  source: string;
  created_at: string;
}

export async function saveInterviewReportToDb(
  report: InterviewReport,
  userId: string,
): Promise<{ id: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    if (!supabase) return { id: null, error: "Supabase not configured." };

    const payload = {
      user_id: userId,
      session_id: report.sessionId,
      overall: report.overall,
      band: report.band || "Competent",
      role: report.setup?.role || "Candidate",
      report_json: report,
      source: report.source || "ai",
    };

    const { data, error } = await supabase
      .from("interview_reports")
      .insert(payload)
      .select("id")
      .single();

    if (error) return { id: null, error: error.message };
    return { id: data?.id ?? null, error: null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : "Database error." };
  }
}

export async function fetchInterviewReportsFromDb(
  userId: string,
): Promise<{ reports: InterviewReport[]; error: string | null }> {
  try {
    const supabase = await createClient();
    if (!supabase) return { reports: [], error: "Supabase not configured." };

    const { data, error } = await supabase
      .from("interview_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return { reports: [], error: error.message };

    const reports: InterviewReport[] = (data || []).map((row: StoredInterviewRecord) => {
      const parsed = row.report_json;
      if (parsed && typeof parsed.overall === "number" && Array.isArray(parsed.dimensions)) {
        return parsed;
      }
      return {
        sessionId: row.session_id,
        generatedAt: new Date(row.created_at).getTime(),
        setup: {
          role: row.role || "Frontend Engineer",
          level: "Mid level",
          type: "Mixed",
          difficulty: "Standard",
        },
        overall: Number(row.overall),
        band: row.band || "Competent",
        summary: "",
        dimensions: [],
        perQuestion: [],
        strengths: [],
        improvements: [],
        nextPractice: [],
        starBlueprint: { situation: "", task: "", action: "", result: "" },
        answeredWords: 0,
        source: (row.source as "local" | "ai") || "ai",
      };
    });

    return { reports, error: null };
  } catch (err) {
    return { reports: [], error: err instanceof Error ? err.message : "Database error." };
  }
}

export async function deleteInterviewReportFromDb(
  reportId: string,
  userId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Supabase not configured." };

    const { error } = await supabase
      .from("interview_reports")
      .delete()
      .eq("id", reportId)
      .eq("user_id", userId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Database error." };
  }
}
