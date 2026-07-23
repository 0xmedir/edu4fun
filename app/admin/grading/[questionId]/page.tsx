import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import GradeSubmissionForm from "@/components/GradeSubmissionForm";

export default async function GradingPage({ params }: { params: { questionId: string } }) {
  const supabase = createClient();

  const { data: question } = await supabase
    .from("questions")
    .select("id, question_text, course_id")
    .eq("id", params.questionId)
    .single();
  if (!question) notFound();

  // RLS ensures this returns null/empty for non-staff — never exposed to students.
  const { data: answerKey } = await supabase
    .from("answer_keys")
    .select("instructor_answer")
    .eq("question_id", question.id)
    .maybeSingle();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, answer_text, score, user_id, users(full_name)")
    .eq("question_id", question.id)
    .not("answer_text", "is", null);

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-6">
      <Link href={`/admin/courses/${question.course_id}`} className="text-sm text-ink/50 hover:text-gold">← Back to course</Link>
      <h1 className="text-2xl font-semibold">{question.question_text}</h1>

      {answerKey && (
        <div className="border border-gold rounded-panel p-4 bg-goldsoft/40">
          <p className="text-xs font-medium text-ink/60 mb-1">Instructor Answer Key (staff only)</p>
          <p className="text-sm">{answerKey.instructor_answer}</p>
        </div>
      )}

      <div className="space-y-4">
        {!submissions?.length ? (
          <p className="text-ink/50">No submissions yet.</p>
        ) : (
          submissions.map((s: any) => (
            <div key={s.id} className="border border-line rounded-panel p-4 bg-white space-y-2">
              <p className="text-sm font-medium">{s.users?.full_name ?? "Unknown student"}</p>
              <p className="text-sm text-ink/70">{s.answer_text}</p>
              <GradeSubmissionForm submissionId={s.id} currentScore={s.score} />
            </div>
          ))
        )}
      </div>
    </main>
  );
}
