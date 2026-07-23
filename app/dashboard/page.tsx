import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    .select("id, title, semester, credit_hours");

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <p className="text-sm text-ink/50 mb-1">Welcome back</p>
          <h1 className="text-3xl font-semibold">{profile?.full_name ?? user.email}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/messages" className="text-sm bg-goldsoft text-ink rounded-panel px-4 py-2 font-medium hover:opacity-80">
            Messages
          </Link>
          <Link href="/grades" className="text-sm bg-goldsoft text-ink rounded-panel px-4 py-2 font-medium hover:opacity-80">
            Grades
          </Link>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Your courses</h2>
        {!courses?.length ? (
          <div className="border border-dashed border-line rounded-panel p-8 text-center text-ink/50">
            No courses assigned yet. Check back once your instructor publishes the syllabus.
          </div>
        ) : (
          <ul className="space-y-3">
            {courses.map((c) => (
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
        )}
      </section>
    </main>
  );
}
