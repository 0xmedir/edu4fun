import { createClient } from "@/lib/supabase/server";
import ModuleForm from "@/components/ModuleForm";
import LessonForm from "@/components/LessonForm";
import { notFound } from "next/navigation";

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, semester, credit_hours, description")
    .eq("id", params.id)
    .single();

  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, week_number, learning_objectives, lessons(id, title)")
    .eq("course_id", course.id)
    .order("week_number", { ascending: true });

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto space-y-8">
      <div>
        <p className="text-sm text-ink/50">{course.semester} · {course.credit_hours} credit hours</p>
        <h1 className="text-3xl font-semibold">{course.title}</h1>
        {course.description && <p className="text-ink/60 mt-2">{course.description}</p>}
      </div>

      <ModuleForm courseId={course.id} />

      <section className="space-y-6">
        {modules?.map((m) => (
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
              <ul className="space-y-1 mb-3">
                {m.lessons.map((l: { id: string; title: string }) => (
                  <li key={l.id} className="text-sm border-l-2 border-goldsoft pl-3">
                    {l.title}
                  </li>
                ))}
              </ul>
            )}

            <LessonForm moduleId={m.id} courseId={course.id} />
          </div>
        ))}
      </section>
    </main>
  );
}
