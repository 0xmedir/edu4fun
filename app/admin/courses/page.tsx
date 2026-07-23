import { createClient } from "@/lib/supabase/server";
import CourseForm from "@/components/CourseForm";
import Link from "next/link";

export default async function AdminCoursesPage() {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, semester, credit_hours")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-semibold">Manage courses</h1>

      <CourseForm />

      <section>
        <h2 className="text-lg font-semibold mb-3">Existing courses</h2>
        {!courses?.length ? (
          <p className="text-ink/50">None yet — create your first course above.</p>
        ) : (
          <ul className="space-y-2">
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/courses/${c.id}`}
                  className="block border border-line rounded-panel p-4 bg-white hover:border-gold"
                >
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-ink/50">{c.semester} · {c.credit_hours} credit hours</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
