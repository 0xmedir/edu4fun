"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type OpenAnswerState = { error?: string; success?: boolean };

export async function submitOpenAnswer(
  questionId: string,
  path: string,
  _prev: OpenAnswerState,
  formData: FormData
): Promise<OpenAnswerState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const answer_text = String(formData.get("answer_text") || "").trim();
  if (!answer_text) return { error: "Write an answer before submitting." };

  const { error } = await supabase.from("submissions").insert({
    question_id: questionId,
    user_id: user.id,
    answer_text,
  });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { error: "You've already submitted an answer to this question." };
    }
    return { error: `Couldn't submit: ${error.message}` };
  }

  revalidatePath(path);
  return { success: true };
}
