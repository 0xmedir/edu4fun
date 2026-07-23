import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ChatRoom from "@/components/ChatRoom";
import { getOrCreateGlobalChannel } from "@/app/actions/messages";

export default async function DiscussionPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: course } = await supabase.from("courses").select("id, title").eq("id", params.id).single();
  if (!course) notFound();

  const channelId = await getOrCreateGlobalChannel(course.id);

  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, sender_id, created_at")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-4">
      <Link href={`/courses/${course.id}`} className="text-sm text-ink/50 hover:text-gold">← Back to course</Link>
      <h1 className="text-2xl font-semibold">{course.title} — Discussion</h1>
      <ChatRoom
        channelId={channelId}
        path={`/courses/${course.id}/discussion`}
        currentUserId={user.id}
        initialMessages={messages ?? []}
      />
    </main>
  );
}
