import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import OpenAnswerForm from "@/components/OpenAnswerForm";

export default async function OpenQuestionPage({
  params,
}: {
  params: { id: string; questionId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: question } = await supabase
    .from("questions")
    .select("id, question_text, difficulty, bloom_level, type")
    .eq("id", params.questionId)
    .eq("type", "open")
    .single();

  if (!question) notFound();

  const { data: existing } = await supabase
    .from("submissions")
    .select("id, answer_text, score, graded_at")
    .eq("question_id", question.id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-4">
      <Link href={`/courses/${params.id}`} className="text-sm text-ink/50 hover:text-gold">← Back to course</Link>
      <p className="text-xs text-ink/50">{question.difficulty} · {question.bloom_level}</p>
      <h1 className="text-2xl font-semibold">{question.question_text}</h1>

      {existing ? (
        <div className="border border-line rounded-panel p-5 bg-white space-y-2">
          <p className="text-sm text-ink/50">Your submitted answer:</p>
          <p className="text-sm">{existing.answer_text}</p>
          {existing.graded_at ? (
            <p className="text-sm font-medium text-forest">Score: {existing.score}/100</p>
          ) : (
            <p className="text-sm text-ink/40">Awaiting instructor review.</p>
          )}
        </div>
      ) : (
        <OpenAnswerForm questionId={question.id} path={`/courses/${params.id}/questions/${question.id}`} />
      )}
    </main>
  );
}
