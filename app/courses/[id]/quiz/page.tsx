import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import QuizForm from "@/components/QuizForm";

export default async function QuizPage({ params }: { params: { id: string } }) {
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

  const { data: submissions } = await supabase
    .from("submissions")
    .select("question_id, selected_choice_id, is_correct")
    .eq("user_id", user.id)
    .in("question_id", questions.map((q) => q.id));

  const answeredIds = new Set((submissions ?? []).map((s) => s.question_id));
  const unanswered = questions.filter((q) => !answeredIds.has(q.id));

  // Only show full results once every CURRENT question has been answered.
  // If new questions were added since the student last took it, they'll
  // land back on the form with just the new ones — nothing is re-asked,
  // and nothing is revealed before it's actually answered.
  const isFullyComplete = unanswered.length === 0;

  if (isFullyComplete) {
    const { data: questionsWithAnswers } = await supabase
      .from("questions")
      .select("id, question_text, question_choices(id, choice_text, is_correct)")
      .eq("course_id", course.id)
      .eq("type", "mcq");

    const subByQuestion = new Map(submissions!.map((s) => [s.question_id, s]));
    const correctCount = submissions!.filter((s) => s.is_correct).length;
    const percent = Math.round((correctCount / questions.length) * 100);

    return (
      <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-6">
        <Link href={`/courses/${course.id}`} className="text-sm text-ink/50 hover:text-gold">← Back to course</Link>
        <h1 className="text-3xl font-semibold">{course.title} — Quiz Results</h1>
        <p className="text-lg">
          Score: <strong>{correctCount}/{questions.length}</strong> ({percent}%)
        </p>
        <div className="space-y-4">
          {questionsWithAnswers?.map((q) => {
            const sub = subByQuestion.get(q.id);
            return (
              <div
                key={q.id}
                className={`border rounded-panel p-4 bg-white ${sub?.is_correct ? "border-forest" : "border-rust"}`}
              >
                <p className="font-medium mb-2">{q.question_text}</p>
                <ul className="space-y-1 text-sm">
                  {q.question_choices.map((c: any) => (
                    <li
                      key={c.id}
                      className={
                        c.is_correct
                          ? "text-forest font-medium"
                          : c.id === sub?.selected_choice_id
                          ? "text-rust font-medium"
                          : "text-ink/50"
                      }
                    >
                      {c.is_correct ? "✓ " : c.id === sub?.selected_choice_id ? "✗ " : "• "}
                      {c.choice_text}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-6">
      <Link href={`/courses/${course.id}`} className="text-sm text-ink/50 hover:text-gold">← Back to course</Link>
      <h1 className="text-3xl font-semibold">{course.title} — Quiz</h1>
      {answeredIds.size > 0 && (
        <p className="text-sm text-ink/50">
          You've already answered {answeredIds.size} question{answeredIds.size === 1 ? "" : "s"} — {unanswered.length} new question{unanswered.length === 1 ? "" : "s"} below.
        </p>
      )}
      <QuizForm courseId={course.id} questions={unanswered as any} />
    </main>
  );
}
EO
cat > "app/courses/[id]/quiz/page.tsx" << 'EOF'
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import QuizForm from "@/components/QuizForm";

export default async function QuizPage({ params }: { params: { id: string } }) {
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

  const { data: submissions } = await supabase
    .from("submissions")
    .select("question_id, selected_choice_id, is_correct")
    .eq("user_id", user.id)
    .in("question_id", questions.map((q) => q.id));

  const answeredIds = new Set((submissions ?? []).map((s) => s.question_id));
  const unanswered = questions.filter((q) => !answeredIds.has(q.id));

  // Only show full results once every CURRENT question has been answered.
  // If new questions were added since the student last took it, they'll
  // land back on the form with just the new ones — nothing is re-asked,
  // and nothing is revealed before it's actually answered.
  const isFullyComplete = unanswered.length === 0;

  if (isFullyComplete) {
    const { data: questionsWithAnswers } = await supabase
      .from("questions")
      .select("id, question_text, question_choices(id, choice_text, is_correct)")
      .eq("course_id", course.id)
      .eq("type", "mcq");

    const subByQuestion = new Map(submissions!.map((s) => [s.question_id, s]));
    const correctCount = submissions!.filter((s) => s.is_correct).length;
    const percent = Math.round((correctCount / questions.length) * 100);

    return (
      <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-6">
        <Link href={`/courses/${course.id}`} className="text-sm text-ink/50 hover:text-gold">← Back to course</Link>
        <h1 className="text-3xl font-semibold">{course.title} — Quiz Results</h1>
        <p className="text-lg">
          Score: <strong>{correctCount}/{questions.length}</strong> ({percent}%)
        </p>
        <div className="space-y-4">
          {questionsWithAnswers?.map((q) => {
            const sub = subByQuestion.get(q.id);
            return (
              <div
                key={q.id}
                className={`border rounded-panel p-4 bg-white ${sub?.is_correct ? "border-forest" : "border-rust"}`}
              >
                <p className="font-medium mb-2">{q.question_text}</p>
                <ul className="space-y-1 text-sm">
                  {q.question_choices.map((c: any) => (
                    <li
                      key={c.id}
                      className={
                        c.is_correct
                          ? "text-forest font-medium"
                          : c.id === sub?.selected_choice_id
                          ? "text-rust font-medium"
                          : "text-ink/50"
                      }
                    >
                      {c.is_correct ? "✓ " : c.id === sub?.selected_choice_id ? "✗ " : "• "}
                      {c.choice_text}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-6">
      <Link href={`/courses/${course.id}`} className="text-sm text-ink/50 hover:text-gold">← Back to course</Link>
      <h1 className="text-3xl font-semibold">{course.title} — Quiz</h1>
      {answeredIds.size > 0 && (
        <p className="text-sm text-ink/50">
          You've already answered {answeredIds.size} question{answeredIds.size === 1 ? "" : "s"} — {unanswered.length} new question{unanswered.length === 1 ? "" : "s"} below.
        </p>
      )}
      <QuizForm courseId={course.id} questions={unanswered as any} />
    </main>
  );
}
