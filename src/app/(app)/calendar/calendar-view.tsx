"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteEvent, upsertRsvp } from "@/lib/actions/events";
import type { Profile, Rsvp, RsvpStatus, TeamEvent } from "@/lib/database.types";
import Modal from "@/components/modal";
import EventForm from "./event-form";
import { notifyLocal } from "@/lib/notify";

type EventWithRsvps = TeamEvent & { rsvps: Rsvp[] };
type Member = Pick<Profile, "id" | "name" | "email">;

const TYPE_LABEL: Record<TeamEvent["type"], string> = {
  training: "Träning",
  match: "Match",
  other: "Övrigt",
};

const STATUS_LABEL: Record<RsvpStatus, string> = {
  going: "Kommer",
  maybe: "Osäker",
  not_going: "Kommer inte",
};

export default function CalendarView({
  teamId,
  meId,
  isAdmin,
  initialEvents,
  members,
}: {
  teamId: string;
  meId: string;
  isAdmin: boolean;
  initialEvents: EventWithRsvps[];
  members: Member[];
}) {
  const [events, setEvents] = useState<TeamEvent[]>(initialEvents);
  const [rsvpsByEvent, setRsvpsByEvent] = useState<Record<string, Rsvp[]>>(() =>
    Object.fromEntries(initialEvents.map((e) => [e.id, e.rsvps ?? []])),
  );
  const [view, setView] = useState<"list" | "month">("list");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<false | "new" | TeamEvent>(false);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`calendar:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id: string }).id;
            setEvents((prev) => prev.filter((e) => e.id !== oldId));
            setRsvpsByEvent((prev) => {
              const next = { ...prev };
              delete next[oldId];
              return next;
            });
            return;
          }
          const row = payload.new as TeamEvent;
          setEvents((prev) => {
            const exists = prev.some((e) => e.id === row.id);
            if (!exists) {
              notifyLocal(
                "Ny händelse",
                `${TYPE_LABEL[row.type]}: ${row.title} · ${formatDate(row.start_time.slice(0, 10))}`,
              );
            } else if (payload.eventType === "UPDATE") {
              notifyLocal("Händelse ändrad", row.title);
            }
            const next = exists ? prev.map((e) => (e.id === row.id ? row : e)) : [...prev, row];
            return next.sort((a, b) => a.start_time.localeCompare(b.start_time));
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rsvps" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as Rsvp;
            setRsvpsByEvent((prev) => ({
              ...prev,
              [old.event_id]: (prev[old.event_id] ?? []).filter((r) => r.user_id !== old.user_id),
            }));
            return;
          }
          const row = payload.new as Rsvp;
          setRsvpsByEvent((prev) => {
            const list = prev[row.event_id] ?? [];
            const exists = list.some((r) => r.user_id === row.user_id);
            return {
              ...prev,
              [row.event_id]: exists
                ? list.map((r) => (r.user_id === row.user_id ? row : r))
                : [...list, row],
            };
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  useEffect(() => {
    const timers = events
      .map((e) => {
        const reminderAt = new Date(e.start_time).getTime() - 2 * 60 * 60 * 1000;
        const delay = reminderAt - Date.now();
        if (delay <= 0 || delay > 48 * 60 * 60 * 1000) return null;
        return setTimeout(
          () => notifyLocal("Påminnelse", `${e.title} börjar om 2 timmar`),
          delay,
        );
      })
      .filter((t): t is ReturnType<typeof setTimeout> => t !== null);
    return () => timers.forEach(clearTimeout);
  }, [events]);

  const upcoming = useMemo(
    () => events.filter((e) => (dayFilter ? e.start_time.slice(0, 10) === dayFilter : true)),
    [events, dayFilter],
  );

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, TeamEvent[]>();
    for (const e of upcoming) {
      const key = e.start_time.slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [upcoming]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Kalender</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-black/5 p-1 text-sm dark:bg-white/5">
            <button
              onClick={() => setView("list")}
              className={`rounded-md px-3 py-1 font-medium ${view === "list" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"}`}
            >
              Lista
            </button>
            <button
              onClick={() => setView("month")}
              className={`rounded-md px-3 py-1 font-medium ${view === "month" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"}`}
            >
              Månad
            </button>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm("new")}
              className="btn-primary rounded-lg px-3 py-1.5 text-sm font-semibold"
            >
              + Ny
            </button>
          )}
        </div>
      </div>

      {dayFilter && (
        <button
          onClick={() => setDayFilter(null)}
          className="mt-3 text-sm text-[var(--color-primary)] underline"
        >
          Visa alla händelser (rensa {formatDate(dayFilter)})
        </button>
      )}

      {view === "month" && (
        <MonthGrid
          month={month}
          setMonth={setMonth}
          events={events}
          onPickDay={(day) => {
            setDayFilter(day);
            setView("list");
          }}
        />
      )}

      <div className="mt-6 space-y-6">
        {groupedByDay.length === 0 && (
          <p className="text-sm text-[var(--muted)]">Inga kommande händelser ännu.</p>
        )}
        {groupedByDay.map(([day, dayEvents]) => (
          <div key={day}>
            <h3 className="mb-2 text-sm font-semibold text-[var(--muted)]">{formatDate(day)}</h3>
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  rsvps={rsvpsByEvent[event.id] ?? []}
                  memberById={memberById}
                  meId={meId}
                  isAdmin={isAdmin}
                  onEdit={() => setShowForm(event)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal
          title={showForm === "new" ? "Ny händelse" : "Redigera händelse"}
          onClose={() => setShowForm(false)}
        >
          <EventForm
            event={showForm === "new" ? undefined : showForm}
            defaultDate={new Date().toISOString().slice(0, 10)}
            onDone={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function EventCard({
  event,
  rsvps,
  memberById,
  meId,
  isAdmin,
  onEdit,
}: {
  event: TeamEvent;
  rsvps: Rsvp[];
  memberById: Map<string, Member>;
  meId: string;
  isAdmin: boolean;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const myRsvp = rsvps.find((r) => r.user_id === meId)?.status;
  const counts = { going: 0, maybe: 0, not_going: 0 };
  for (const r of rsvps) counts[r.status]++;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="chip-primary inline-block rounded-full px-2 py-0.5 text-xs font-semibold">
            {TYPE_LABEL[event.type]}
          </span>
          <h4 className="mt-1 font-semibold">{event.title}</h4>
          <p className="text-sm text-[var(--muted)]">
            {formatTime(event.start_time)}
            {event.end_time ? `–${formatTime(event.end_time)}` : ""}
            {event.location ? ` · ${event.location}` : ""}
          </p>
          {event.description && <p className="mt-1 text-sm">{event.description}</p>}
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Redigera"
            >
              ✎
            </button>
            <button
              onClick={() => {
                if (confirm(`Ta bort "${event.title}"?`)) deleteEvent(event.id);
              }}
              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              aria-label="Ta bort"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(["going", "maybe", "not_going"] as const).map((status) => (
          <button
            key={status}
            onClick={() => upsertRsvp(event.id, status)}
            className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
              myRsvp === status
                ? "border-transparent btn-primary"
                : "border-[var(--border)] text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {STATUS_LABEL[status]}
          </button>
        ))}
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-xs text-[var(--muted)] underline"
      >
        {counts.going} kommer · {counts.maybe} osäkra · {counts.not_going} kommer inte
      </button>

      {expanded && (
        <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
          {rsvps.length === 0 && <li>Ingen har svarat än.</li>}
          {rsvps.map((r) => (
            <li key={r.user_id}>
              {memberById.get(r.user_id)?.name || memberById.get(r.user_id)?.email || "?"} —{" "}
              {STATUS_LABEL[r.status]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MonthGrid({
  month,
  setMonth,
  events,
  onPickDay,
}: {
  month: Date;
  setMonth: (d: Date) => void;
  events: TeamEvent[];
  onPickDay: (day: string) => void;
}) {
  const eventsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const key = e.start_time.slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const cells: (string | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  }

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
        >
          ‹
        </button>
        <span className="font-semibold">
          {month.toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)]">
        {["M", "T", "O", "T", "F", "L", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <button
            key={i}
            disabled={!day}
            onClick={() => day && onPickDay(day)}
            className={`aspect-square rounded-lg text-sm ${
              !day
                ? ""
                : day === todayKey
                  ? "chip-primary font-bold"
                  : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {day && (
              <div className="flex h-full flex-col items-center justify-center">
                <span>{Number(day.slice(-2))}</span>
                {eventsByDay.has(day) && (
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-primary)" }} />
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}
