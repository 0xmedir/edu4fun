import { createClient } from "@/lib/supabase/server";
import BookUploadForm from "@/components/BookUploadForm";

export default async function AdminLibraryPage() {
  const supabase = createClient();
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, book_tags(subject_tags(name))")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-semibold">Tutorial Library — Manage</h1>
      <BookUploadForm />
      <section className="space-y-3">
        {!books?.length ? (
          <p className="text-ink/50">No resources uploaded yet.</p>
        ) : (
          books.map((b: any) => (
            <div key={b.id} className="border border-line rounded-panel p-4 bg-white">
              <p className="font-medium">{b.title}</p>
              {b.author && <p className="text-sm text-ink/50">{b.author}</p>}
              <div className="flex gap-1 flex-wrap mt-1">
                {b.book_tags?.map((bt: any, i: number) => (
                  <span key={i} className="text-xs bg-goldsoft text-ink rounded-full px-2 py-0.5">
                    {bt.subject_tags?.name}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
