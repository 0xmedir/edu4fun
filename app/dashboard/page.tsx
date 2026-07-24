import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, semester, credit_hours, departments(name)");

  const grouped = new Map<string, any[]>();
  for (const c of courses ?? []) {
    const deptName = (c as any).departments?.name ?? "Other courses";
    if (!grouped.has(deptName)) grouped.set(deptName, []);
    grouped.get(deptName)!.push(c);
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-sm text-ink/50 mb-1">Welcome back</p>
          <h1 className="text-3xl font-semibold">{profile?.full_name ?? user.email}</h1>
        </div>

        {!courses?.length ? (
          <div className="border border-dashed border-line rounded-panel p-8 text-center text-ink/50">
            No courses assigned yet. Check back once your instructor publishes the syllabus.
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([deptName, deptCourses]) => (
              <section key={deptName}>
                <h2 className="text-lg font-semibold mb-3">{deptName}</h2>
                <ul className="space-y-3">
                  {deptCourses.map((c: any) => (
                    <li key={c.id}>
                      <Link
                        href={`/courses/${c.id}`}
                        className="block border border-line rounded-panel p-4 bg-white hover:border-gold transition"
                      >
                        <p className="font-medium">{c.title}</p>
                        <p className="text-sm text-ink/50">
                          {c.semester} · {c.credit_hours} credit hours
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
