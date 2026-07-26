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

  // Extract answers
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
    console.error("Error fetching questions:", qError);
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
    console.error("Insert error:", insertError);
    return { error: "Failed to save your answers. Please try again." };
  }

  // Compute grade
  const correctCount = submissions.filter(s => s.is_correct).length;
  const total = submissions.length;

  // Save grade to grades table
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
    console.error("Grade save error:", gradeError);
    return { error: "Failed to save grade." };
  }

  // --- Reset: delete all submissions for this user/quiz ---
  const { data: questionIds, error: qIdsError } = await supabase
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", quizId);

  if (qIdsError) {
    console.error("Error fetching question IDs for reset:", qIdsError);
    return { error: "Failed to reset quiz (question fetch error)." };
  }

  if (questionIds && questionIds.length > 0) {
    const { error: deleteError, count } = await supabase
      .from("submissions")
      .delete({ count: "exact" })
      .eq("user_id", user.id)
      .in("question_id", questionIds.map(q => q.id));

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return { error: "Failed to reset quiz (delete error)." };
    } else {
      console.log(`✅ Deleted ${count} submissions for quiz ${quizId}`);
    }
  } else {
    console.warn("No questions found for quiz, skipping reset.");
  }

  // Revalidate and redirect
  revalidatePath(`/courses/${courseId}/quiz`);
  revalidatePath(`/grades`);

  // Add a small delay to ensure the deletion is processed (optional)
  // await new Promise(resolve => setTimeout(resolve, 500));

  redirect(`/courses/${courseId}/quiz?reset=true`);
}
