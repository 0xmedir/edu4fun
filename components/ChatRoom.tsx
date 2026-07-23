"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, type MessageFormState } from "@/app/actions/messages";
import SubmitButton from "@/components/SubmitButton";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name?: string | null;
};

const initial: MessageFormState = {};

export default function ChatRoom({
  channelId,
  path,
  currentUserId,
  initialMessages,
}: {
  channelId: string;
  path: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [nameCache, setNameCache] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const m of initialMessages) {
      if (m.sender_name) seed[m.sender_id] = m.sender_name;
    }
    return seed;
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isFirstRender = useRef(true);

  const boundAction = sendMessage.bind(null, channelId, path);
  const [state, formAction] = useFormState(boundAction, initial);

  // Clear the input after a successful send, but not on first mount.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!state?.error) {
      formRef.current?.reset();
    }
  }, [state]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);

          if (newMsg.sender_id !== currentUserId) {
            setNameCache((prev) => {
              if (prev[newMsg.sender_id]) return prev;
              // Fetch the sender's name once, then cache it.
              supabase
                .from("users")
                .select("full_name")
                .eq("id", newMsg.sender_id)
                .single()
                .then(({ data }) => {
                  if (data?.full_name) {
                    setNameCache((c) => ({ ...c, [newMsg.sender_id]: data.full_name }));
                  }
                });
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[60vh] border border-line rounded-panel bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isMine = m.sender_id === currentUserId;
          const displayName = isMine ? null : nameCache[m.sender_id] ?? "…";
          return (
            <div key={m.id} className={isMine ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[80%]">
                {displayName && (
                  <p className="text-[11px] text-ink/40 mb-0.5 px-1">{displayName}</p>
                )}
                <div
                  className={`rounded-panel px-3 py-2 text-sm ${
                    isMine ? "bg-goldsoft text-ink" : "bg-paper text-ink"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form ref={formRef} action={formAction} className="border-t border-line p-3 flex gap-2">
        <input
          name="content"
          placeholder="Type a message…"
          autoComplete="off"
          className="flex-1 border border-line rounded-panel px-3 py-2 text-sm"
        />
        <SubmitButton className="bg-gold text-white rounded-panel px-4 py-2 text-sm font-medium hover:opacity-90">
          Send
        </SubmitButton>
      </form>
      {state?.error && <p className="text-rust text-xs px-3 pb-2">{state.error}</p>}
    </div>
  );
}
