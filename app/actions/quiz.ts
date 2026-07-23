"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type QuizFormState = { error?: string };

export async function submitQuiz(
  courseId: string,
  _prev: QuizFormState,
  formData: FormData
): Promise<QuizFormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const entries = Array.from(formData.entries()).filter(([key]) => key.startsWith("answer_"));
  if (!entries.length) return { error: "Answer at least one question before submitting." };

  for (const [key, value] of entries) {
    const questionId = key.replace("answer_", "");
    const choiceId = String(value);
    if (!choiceId) continue;

    const { error } = await supabase.from("submissions").insert({
      question_id: questionId,
      user_id: user.id,
      selected_choice_id: choiceId,
    });

    // A duplicate-key error just means this question was already answered — safe to ignore.
    if (error && !error.message.includes("duplicate key")) {
      return { error: `Couldn't save an answer: ${error.message}` };
    }
  }

  redirect(`/courses/${courseId}/quiz`);
}
