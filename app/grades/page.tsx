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

  // submitQuiz prunes each course down to the 10 most recent attempts, so
  // this is already a bounded history -- no extra limit needed here.
  const { data: grades } = await supabase
    .from("grades")
    .select("course_id, percent, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const byCourse = new Map<string, number[]>();
  for (const g of grades ?? []) {
    if (!byCourse.has(g.course_id)) byCourse.set(g.course_id, []);
    byCourse.get(g.course_id)!.push(g.percent as number);
  }

  const rows = (courses ?? []).map((c) => {
    const attempts = byCourse.get(c.id) ?? [];
    const avg = attempts.length ? attempts.reduce((a, b) => a + b, 0) / attempts.length : null;
    return {
      ...c,
      avg,
      letter: avg !== null ? letterForPercent(avg) : null,
      attempts,
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
            <div key={r.id} className="border border-line rounded-panel p-4 bg-white">
              <div className="flex items-center justify-between">
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
                      <p className="text-xs text-ink/50">
                        {r.avg.toFixed(0)}% avg · {r.attempts.length} attempt{r.attempts.length === 1 ? "" : "s"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-ink/40">No grades yet</p>
                  )}
                </div>
              </div>
              {r.attempts.length > 1 && (
                <p className="text-xs text-ink/40 mt-2">
                  Progress: {r.attempts.map((a) => `${Math.round(a)}%`).join(" → ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
