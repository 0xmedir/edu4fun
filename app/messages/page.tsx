import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MessagesIndexPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: people } = await supabase
    .from("users")
    .select("id, full_name")
    .neq("id", user.id);

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-4">
      <h1 className="text-3xl font-semibold">Messages</h1>
      {!people?.length ? (
        <p className="text-ink/50">No one else on the platform yet.</p>
      ) : (
        <ul className="space-y-2">
          {people.map((p) => (
            <li key={p.id}>
              <Link
                href={`/messages/${p.id}`}
                className="block border border-line rounded-panel p-4 bg-white hover:border-gold transition"
              >
                {p.full_name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
