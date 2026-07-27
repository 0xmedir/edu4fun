import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import QuizForm from "@/components/QuizForm";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { scored?: string; total?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", params.id)
    .single();
  if (!course) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, difficulty, bloom_level, question_choices(id, choice_text)")
    .eq("course_id", course.id)
    .eq("type", "mcq");

  if (!questions?.length) {
    return (
      <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
        <Link href={`/courses/${course.id}`} className="text-sm text-ink/50 hover:text-gold">← Back to course</Link>
        <h1 className="text-3xl font-semibold mt-4">Quiz</h1>
        <p className="text-ink/50 mt-4">No quiz questions published yet for this course.</p>
      </main>
    );
  }

  // A finished attempt always gets wiped right after grading (see
  // submitQuiz), so this is normally empty -- it only catches a partial
  // attempt that never made it through a full submit.
  const { data: submissions } = await supabase
    .from("submissions")
    .select("question_id")
    .eq("user_id", user.id)
    .in(
      "question_id",
      questions.map((q) => q.id)
    );

  const answeredIds = new Set((submissions ?? []).map((s) => s.question_id));
  const unanswered = questions.filter((q) => !answeredIds.has(q.id));

  const justScored =
    searchParams.scored && searchParams.total
      ? { correct: Number(searchParams.scored), total: Number(searchParams.total) }
      : null;

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-6">
      <Link href={`/courses/${course.id}`} className="text-sm text-ink/50 hover:text-gold">← Back to course</Link>
      <h1 className="text-3xl font-semibold">{course.title} — Quiz</h1>

      {justScored && (
        <div className="border border-gold rounded-panel p-4 bg-gold/10">
          <p className="font-medium">
            You scored {justScored.correct}/{justScored.total} (
            {Math.round((justScored.correct / justScored.total) * 100)}%)
          </p>
          <p className="text-sm text-ink/60 mt-1">
            Saved to your grade history. Retake any time below.
          </p>
        </div>
      )}

      {answeredIds.size > 0 && unanswered.length > 0 && (
        <p className="text-sm text-ink/50">
          You've already answered {answeredIds.size} question{answeredIds.size === 1 ? "" : "s"} —{" "}
          {unanswered.length} remaining below.
        </p>
      )}

      <QuizForm courseId={course.id} questions={unanswered as any} />
    </main>
  );
}
