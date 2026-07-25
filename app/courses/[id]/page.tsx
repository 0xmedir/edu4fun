import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export default async function StudentCoursePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, semester, credit_hours, description, syllabus_url")
    .eq("id", params.id)
    .single();

  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, week_number, learning_objectives, lessons(id, title)")
    .eq("course_id", course.id)
    .order("week_number", { ascending: true });

  // Check if there's a quiz for this course (via module with order_index=1)
  const { data: module } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", course.id)
    .eq("order_index", 1)
    .maybeSingle();

  let hasQuiz = false;
  if (module) {
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("module_id", module.id)
      .maybeSingle();
    if (quiz) {
      const { count } = await supabase
        .from("quiz_questions")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", quiz.id);
      hasQuiz = (count ?? 0) > 0;
    }
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto space-y-8">
        <div>
          <p className="text-sm text-ink/50">{course.semester} · {course.credit_hours} credit hours</p>
          <h1 className="text-3xl font-semibold">{course.title}</h1>
          {course.description && <p className="text-ink/60 mt-2">{course.description}</p>}
          <div className="flex gap-3 mt-3 flex-wrap">
            {course.syllabus_url && (
              <a href={course.syllabus_url} target="_blank" className="text-sm text-gold underline">
                View full syllabus
              </a>
            )}
            {hasQuiz && (
              <Link href={`/courses/${course.id}/quiz`} className="text-sm bg-gold text-white rounded-panel px-4 py-1.5 font-medium hover:opacity-90">
                Take Quiz
              </Link>
            )}
            <Link href={`/courses/${course.id}/discussion`} className="text-sm bg-goldsoft text-ink rounded-panel px-4 py-1.5 font-medium hover:opacity-80">
              Discussion
            </Link>
          </div>
        </div>

        <section className="space-y-4">
          {!modules?.length ? (
            <p className="text-ink/50">No weekly units published yet.</p>
          ) : (
            modules.map((m) => (
              <div key={m.id} className="border border-line rounded-panel p-5 bg-white">
                <p className="text-xs text-ink/50 mb-1">Week {m.week_number ?? "—"}</p>
                <h3 className="font-semibold mb-2">{m.title}</h3>
                {m.learning_objectives?.length > 0 && (
                  <ul className="text-sm text-ink/60 list-disc list-inside mb-3">
                    {m.learning_objectives.map((obj: string, i: number) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                )}
                {m.lessons?.length > 0 && (
                  <ul className="space-y-1">
                    {m.lessons.map((l: { id: string; title: string }) => (
                      <li key={l.id}>
                        <Link
                          href={`/courses/${course.id}/lessons/${l.id}`}
                          className="text-sm border-l-2 border-gold pl-3 block hover:text-gold"
                        >
                          {l.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </>
  );
}
