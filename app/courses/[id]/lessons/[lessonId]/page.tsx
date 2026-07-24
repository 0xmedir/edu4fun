import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export default async function LessonPage({
  params,
}: {
  params: { id: string; lessonId: string };
}) {
  const supabase = createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, content_richtext, video_url, pdf_url")
    .eq("id", params.lessonId)
    .single();

  if (!lesson) notFound();

  const embedUrl = lesson.video_url ? toEmbedUrl(lesson.video_url) : null;

  let pdfDownloadUrl: string | null = null;
  if (lesson.pdf_url) {
    const admin = createAdminClient();
    const { data } = await admin.storage.from("library").createSignedUrl(lesson.pdf_url, 300);
    pdfDownloadUrl = data?.signedUrl ?? null;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-6">
      <Link href={`/courses/${params.id}`} className="text-sm text-ink/50 hover:text-gold">
        ← Back to course
      </Link>

      <h1 className="text-3xl font-semibold">{lesson.title}</h1>

      {embedUrl && (
        <div className="aspect-video rounded-panel overflow-hidden border border-line">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {lesson.content_richtext && (
        <div
          className="prose prose-sm max-w-none bg-white border border-line rounded-panel p-6"
          dangerouslySetInnerHTML={{ __html: lesson.content_richtext }}
        />
      )}

      {pdfDownloadUrl && (
        <a
          href={pdfDownloadUrl}
          target="_blank"
          className="inline-block text-sm bg-goldsoft text-ink rounded-panel px-4 py-2 font-medium hover:opacity-80"
        >
          Download PDF
        </a>
      )}
    </main>
  );
}
