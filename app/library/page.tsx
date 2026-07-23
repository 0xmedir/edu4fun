import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LibraryBrowser from "@/components/LibraryBrowser";

export default async function LibraryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: rawBooks } = await supabase
    .from("books")
    .select("id, title, author, book_tags(subject_tags(name))")
    .order("created_at", { ascending: false });

  const books = (rawBooks ?? []).map((b: any) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    tags: (b.book_tags ?? []).map((bt: any) => bt.subject_tags?.name).filter(Boolean),
  }));

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Tutorial Library</h1>
      <LibraryBrowser books={books} />
    </main>
  );
}
