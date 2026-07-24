import { createClient } from "@/lib/supabase/server";
import CourseForm from "@/components/CourseForm";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export default async function AdminCoursesPage() {
  const supabase = createClient();

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, semester, credit_hours, departments(name)")
    .order("created_at", { ascending: false });

  const grouped = new Map<string, any[]>();
  for (const c of courses ?? []) {
    const deptName = (c as any).departments?.name ?? "Unassigned";
    if (!grouped.has(deptName)) grouped.set(deptName, []);
    grouped.get(deptName)!.push(c);
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold">Manage courses</h1>

        <CourseForm departments={departments ?? []} />

        <section className="space-y-8">
          {!courses?.length ? (
            <p className="text-ink/50">None yet — create your first course above.</p>
          ) : (
            Array.from(grouped.entries()).map(([deptName, deptCourses]) => (
              <div key={deptName}>
                <h2 className="text-lg font-semibold mb-3">{deptName}</h2>
                <ul className="space-y-2">
                  {deptCourses.map((c: any) => (
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
              </div>
            ))
          )}
        </section>
      </main>
    </>
  );
}
