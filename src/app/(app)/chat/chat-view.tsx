"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { markChatRead, sendMessage, type ChatActionState } from "@/lib/actions/chat";
import { notifyLocal } from "@/lib/notify";
import type { ChatRead, Message, Profile } from "@/lib/database.types";

type Member = Pick<Profile, "id" | "name" | "email">;
type OptimisticMessage = Message & { pending?: boolean };

const initial: ChatActionState = { error: null };

export default function ChatView({
  teamId,
  meId,
  initialMessages,
  members,
  initialReads,
}: {
  teamId: string;
  meId: string;
  initialMessages: Message[];
  members: Member[];
  initialReads: ChatRead[];
}) {
  const [messages, setMessages] = useState<OptimisticMessage[]>(initialMessages);
  const [reads, setReads] = useState<ChatRead[]>(initialReads);
  const [state, formAction, pending] = useActionState(sendMessage, initial);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    markChatRead(teamId);
    const onVisible = () => document.visibilityState === "visible" && markChatRead(teamId);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [teamId, messages.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${teamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `team_id=eq.${teamId}` },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) => {
            const withoutOptimistic = prev.filter(
              (m) =>
                !(m.pending && m.user_id === row.user_id && m.content === row.content) ,
            );
            if (withoutOptimistic.some((m) => m.id === row.id)) return withoutOptimistic;
            return [...withoutOptimistic, row];
          });
          if (row.user_id !== meId) {
            notifyLocal(
              memberById.get(row.user_id)?.name || "Nytt meddelande",
              row.content || "📷 Skickade en bild",
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_reads", filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as ChatRead;
          setReads((prev) => {
            const exists = prev.some((r) => r.user_id === row.user_id);
            return exists ? prev.map((r) => (r.user_id === row.user_id ? row : r)) : [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, meId]);

  const lastMineIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].user_id === meId) return i;
    }
    return -1;
  })();

  const seenByNames =
    lastMineIndex >= 0
      ? reads
          .filter((r) => r.user_id !== meId && r.last_read_at >= messages[lastMineIndex].created_at)
          .map((r) => memberById.get(r.user_id)?.name || memberById.get(r.user_id)?.email)
          .filter(Boolean)
      : [];

  return (
    <div className="mx-auto flex h-[calc(100vh-56px)] max-w-2xl flex-col px-4 sm:h-screen">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.map((m, i) => {
          const mine = m.user_id === meId;
          const author = memberById.get(m.user_id);
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                {!mine && (
                  <span className="mb-0.5 px-1 text-xs font-medium text-[var(--muted)]">
                    {author?.name || author?.email}
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 text-sm ${m.pending ? "opacity-60" : ""}`}
                  style={
                    mine
                      ? { background: "var(--color-primary)", color: "var(--color-primary-text)" }
                      : { background: "var(--surface)", border: "1px solid var(--border)" }
                  }
                >
                  {m.image_url && (
                    <a href={m.image_url} target="_blank" rel="noreferrer">
                      <Image
                        src={m.image_url}
                        alt="Bild"
                        width={240}
                        height={240}
                        unoptimized
                        className="mb-1 max-h-60 w-auto rounded-lg object-cover"
                      />
                    </a>
                  )}
                  {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                </div>
                <span className="mt-0.5 px-1 text-[10px] text-[var(--muted)]">
                  {formatTime(m.created_at)}
                </span>
                {mine && i === lastMineIndex && seenByNames.length > 0 && (
                  <span className="px-1 text-[10px] text-[var(--muted)]">
                    Sedd av {seenByNames.join(", ")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-[var(--muted)]">
            Inga meddelanden än. Säg hej till laget! 👋
          </p>
        )}
      </div>

      {imagePreview && (
        <div className="mb-2 flex items-center gap-2">
          <Image
            src={imagePreview}
            alt="Förhandsvisning"
            width={56}
            height={56}
            unoptimized
            className="h-14 w-14 rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setImagePreview(null);
              if (formRef.current) {
                const input = formRef.current.elements.namedItem("image") as HTMLInputElement;
                input.value = "";
              }
            }}
            className="text-xs text-[var(--muted)] underline"
          >
            Ta bort bild
          </button>
        </div>
      )}
      {state.error && <p className="mb-2 text-sm text-red-600">{state.error}</p>}

      <form
        ref={formRef}
        action={(formData) => {
          const content = String(formData.get("content") ?? "").trim();
          const image = formData.get("image");
          if (content || (image instanceof File && image.size > 0)) {
            setMessages((prev) => [
              ...prev,
              {
                id: `optimistic-${Date.now()}`,
                team_id: teamId,
                user_id: meId,
                content: content || null,
                image_url: imagePreview,
                created_at: new Date().toISOString(),
                pending: true,
              },
            ]);
          }
          formAction(formData);
          formRef.current?.reset();
          setImagePreview(null);
        }}
        className="mb-4 flex items-end gap-2 border-t border-[var(--border)] pt-3"
      >
        <label className="cursor-pointer rounded-full p-2 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10">
          📷
          <input
            type="file"
            name="image"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setImagePreview(URL.createObjectURL(file));
            }}
          />
        </label>
        <textarea
          name="content"
          rows={1}
          placeholder="Skriv ett meddelande…"
          className="flex-1 resize-none rounded-full border border-[var(--border)] bg-transparent px-4 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-primary rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          Skicka
        </button>
      </form>
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}
