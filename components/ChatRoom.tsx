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
  const bottomRef = useRef<HTMLDivElement>(null);
  const boundAction = sendMessage.bind(null, channelId, path);
  const [state, formAction] = useFormState(boundAction, initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[60vh] border border-line rounded-panel bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-panel px-3 py-2 text-sm ${
              m.sender_id === currentUserId
                ? "bg-goldsoft ml-auto text-ink"
                : "bg-paper text-ink"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form action={formAction} className="border-t border-line p-3 flex gap-2">
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
