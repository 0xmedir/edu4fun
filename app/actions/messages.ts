"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MessageFormState = { error?: string };

export async function sendMessage(
  channelId: string,
  path: string,
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const content = String(formData.get("content") || "").trim();
  if (!content) return { error: "Message can't be empty." };

  const { error } = await supabase.from("messages").insert({
    channel_id: channelId,
    sender_id: user.id,
    content,
  });

  if (error) return { error: `Couldn't send: ${error.message}` };

  revalidatePath(path);
  return {};
}

export async function getOrCreateGlobalChannel(courseId: string): Promise<string> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("channels")
    .select("id")
    .eq("course_id", courseId)
    .eq("type", "global")
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("channels")
    .insert({ course_id: courseId, type: "global" })
    .select("id")
    .single();

  if (error || !created) throw new Error("Couldn't create course channel.");
  return created.id;
}

export async function getOrCreateDM(otherUserId: string): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: myChannels } = await supabase
    .from("channel_members")
    .select("channel_id, channels!inner(type)")
    .eq("user_id", user.id)
    .eq("channels.type", "dm");

  for (const row of myChannels ?? []) {
    const { data: otherMember } = await supabase
      .from("channel_members")
      .select("user_id")
      .eq("channel_id", row.channel_id)
      .eq("user_id", otherUserId)
      .single();
    if (otherMember) return row.channel_id;
  }

  const { data: created, error } = await supabase
    .from("channels")
    .insert({ type: "dm" })
    .select("id")
    .single();
  if (error || !created) throw new Error("Couldn't create DM channel.");

  await supabase.from("channel_members").insert([
    { channel_id: created.id, user_id: user.id },
    { channel_id: created.id, user_id: otherUserId },
  ]);

  return created.id;
}
