import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ChatRoom from "@/components/ChatRoom";
import { getOrCreateDM } from "@/app/actions/messages";

export default async function DMPage({ params }: { params: { userId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: otherUser } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("id", params.userId)
    .single();
  if (!otherUser) notFound();

  const channelId = await getOrCreateDM(otherUser.id);

  const { data: rawMessages } = await supabase
    .from("messages")
    .select("id, content, sender_id, created_at, users(full_name)")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(100);

  const messages = (rawMessages ?? []).map((m: any) => ({
    id: m.id,
    content: m.content,
    sender_id: m.sender_id,
    created_at: m.created_at,
    sender_name: m.users?.full_name ?? null,
  }));

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-4">
      <Link href="/messages" className="text-sm text-ink/50 hover:text-gold">← All messages</Link>
      <h1 className="text-2xl font-semibold">{otherUser.full_name}</h1>
      <ChatRoom
        channelId={channelId}
        path={`/messages/${otherUser.id}`}
        currentUserId={user.id}
        initialMessages={messages}
      />
    </main>
  );
}
