"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type QuizFormState = {
  error?: string;
};

export async function submitQuiz(
  courseId: string,
  quizId: string,
  prevState: QuizFormState,
  formData: FormData
): Promise<QuizFormState> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to submit answers." };
  }

  // Extract answers: keys are answer_<questionId>
  const answers: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("answer_")) {
      const questionId = key.replace("answer_", "");
      answers[questionId] = value as string;
    }
  }

  if (Object.keys(answers).length === 0) {
    return { error: "No answers provided." };
  }

  // Fetch all questions for this quiz
  const { data: questions, error: qError } = await supabase
    .from("quiz_questions")
    .select("id, correct_answer")
    .eq("quiz_id", quizId);

  if (qError || !questions) {
    return { error: "Failed to fetch questions." };
  }

  const correctMap = new Map(questions.map(q => [q.id, q.correct_answer]));

  // Prepare submissions
  const submissions = Object.entries(answers).map(([questionId, selectedId]) => {
    const isCorrect = correctMap.get(questionId) === selectedId;
    return {
      user_id: user.id,
      question_id: questionId,
      selected_choice_id: selectedId,
      is_correct: isCorrect,
    };
  });

  // Save submissions
  const { error: insertError } = await supabase
    .from("submissions")
    .upsert(submissions, { onConflict: "user_id, question_id" });

  if (insertError) {
    console.error(insertError);
    return { error: "Failed to save your answers. Please try again." };
  }

  // Compute grade
  const correctCount = submissions.filter(s => s.is_correct).length;
  const total = submissions.length;

  // Save grade to grades table (upsert)
  const { error: gradeError } = await supabase
    .from("grades")
    .upsert(
      {
        user_id: user.id,
        quiz_id: quizId,
        score: correctCount,
        total: total,
      },
      { onConflict: "user_id, quiz_id" }
    );

  if (gradeError) {
    console.error(gradeError);
    return { error: "Failed to save grade." };
  }

  // Delete all submissions for this user/quiz (reset)
  const { data: questionIds } = await supabase
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", quizId);
  if (questionIds) {
    await supabase
      .from("submissions")
      .delete()
      .eq("user_id", user.id)
      .in("question_id", questionIds.map(q => q.id));
  }

  // Revalidate paths
  revalidatePath(`/courses/${courseId}/quiz`);
  revalidatePath(`/grades`);

  // Redirect back to quiz page (now reset)
  redirect(`/courses/${courseId}/quiz`);
}
