import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { letterForPercent, gpaPointsForLetter } from "@/lib/grades";

export default async function GradesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, credit_hours");

  const { data: submissions } = await supabase
    .from("submissions")
    .select("score, question_id, questions(course_id)")
    .eq("user_id", user.id)
    .not("score", "is", null);

  const byCourse = new Map<string, number[]>();
  for (const s of submissions ?? []) {
    const courseId = (s.questions as any)?.course_id;
    if (!courseId) continue;
    if (!byCourse.has(courseId)) byCourse.set(courseId, []);
    byCourse.get(courseId)!.push(s.score as number);
  }

  const rows = (courses ?? []).map((c) => {
    const scores = byCourse.get(c.id) ?? [];
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return {
      ...c,
      avg,
      letter: avg !== null ? letterForPercent(avg) : null,
      attempted: scores.length,
    };
  });

  const graded = rows.filter((r) => r.avg !== null && r.credit_hours);
  const totalCredits = graded.reduce((sum, r) => sum + (r.credit_hours ?? 0), 0);
  const gpa = totalCredits
    ? graded.reduce((sum, r) => sum + gpaPointsForLetter(r.letter!) * (r.credit_hours ?? 0), 0) / totalCredits
    : null;

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Grades</h1>
          {gpa !== null && (
            <p className="text-ink/60 mt-1">
              Overall GPA: <strong className="text-ink">{gpa.toFixed(2)}</strong> · {totalCredits} credit hours graded
            </p>
          )}
        </div>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="border border-line rounded-panel p-4 bg-white flex items-center justify-between">
              <div>
                <Link href={`/courses/${r.id}`} className="font-medium hover:text-gold">
                  {r.title}
                </Link>
                <p className="text-xs text-ink/50">{r.credit_hours ?? "—"} credit hours</p>
              </div>
              <div className="text-right">
                {r.avg !== null ? (
                  <>
                    <p className="text-2xl font-semibold font-display">{r.letter}</p>
                    <p className="text-xs text-ink/50">{r.avg.toFixed(0)}% · {r.attempted} graded</p>
                  </>
                ) : (
                  <p className="text-sm text-ink/40">No grades yet</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
