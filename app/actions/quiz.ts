"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type QuizFormState = {
  error?: string;
};

export async function submitQuiz(
  courseId: string,
  prevState: QuizFormState,
  formData: FormData
): Promise<QuizFormState> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to submit answers." };
  }

  // Form fields are named answer_<questionId>, value is the selected choice's id.
  const answers: { questionId: string; choiceId: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("answer_")) {
      answers.push({ questionId: key.replace("answer_", ""), choiceId: value as string });
    }
  }

  if (answers.length === 0) {
    return { error: "No answers provided." };
  }

  // Insert submissions -- the auto_grade_mcq trigger sets is_correct/score
  // on each row the instant it's inserted.
  const { error: insertError } = await supabase.from("submissions").upsert(
    answers.map((a) => ({
      user_id: user.id,
      question_id: a.questionId,
      selected_choice_id: a.choiceId,
    })),
    { onConflict: "question_id, user_id" }
  );

  if (insertError) {
    console.error("Insert error:", insertError);
    return { error: "Failed to save your answers. Please try again." };
  }

  // Read back the graded rows to compute the score for this attempt.
  const { data: graded, error: gradedError } = await supabase
    .from("submissions")
    .select("is_correct")
    .eq("user_id", user.id)
    .in(
      "question_id",
      answers.map((a) => a.questionId)
    );

  if (gradedError || !graded) {
    console.error("Error reading back grades:", gradedError);
    return { error: "Saved your answers, but couldn't compute your score." };
  }

  const correctCount = graded.filter((s) => s.is_correct).length;
  const total = graded.length;
  const percent = Math.round((correctCount / total) * 100);

  // Record this attempt in grade history.
  const { error: gradeError } = await supabase.from("grades").insert({
    user_id: user.id,
    course_id: courseId,
    score: correctCount,
    total,
    percent,
  });

  if (gradeError) {
    console.error("Grade save error:", gradeError);
    return { error: "Failed to save grade." };
  }

  // Keep only the 10 most recent attempts for this student/course.
  const { data: history } = await supabase
    .from("grades")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (history && history.length > 10) {
    const idsToPrune = history.slice(10).map((h) => h.id);
    await supabase.from("grades").delete().in("id", idsToPrune);
  }

  // Reset: wipe this student's submissions for this course's questions so
  // the quiz shows every question as unanswered again. No retake button
  // needed -- it's just always fresh.
  const { data: courseQuestions } = await supabase
    .from("questions")
    .select("id")
    .eq("course_id", courseId);

  if (courseQuestions && courseQuestions.length > 0) {
    await supabase
      .from("submissions")
      .delete()
      .eq("user_id", user.id)
      .in(
        "question_id",
        courseQuestions.map((q) => q.id)
      );
  }

  revalidatePath(`/courses/${courseId}/quiz`);
  revalidatePath(`/grades`);

  redirect(`/courses/${courseId}/quiz?scored=${correctCount}&total=${total}`);
}
