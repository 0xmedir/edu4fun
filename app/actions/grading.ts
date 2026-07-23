"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type GradeFormState = { error?: string };

export async function gradeSubmission(
  submissionId: string,
  _prev: GradeFormState,
  formData: FormData
): Promise<GradeFormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const score = Number(formData.get("score"));
  if (isNaN(score) || score < 0 || score > 100) {
    return { error: "Score must be between 0 and 100." };
  }

  const { error } = await supabase
    .from("submissions")
    .update({ score, graded_by: user.id, graded_at: new Date().toISOString() })
    .eq("id", submissionId);

  // RLS on submissions only allows admin/instructor to run this update —
  // a student calling this action directly would get blocked here regardless of the UI.
  if (error) return { error: `Couldn't save grade: ${error.message}` };

  revalidatePath("/admin/grading");
  return {};
}
