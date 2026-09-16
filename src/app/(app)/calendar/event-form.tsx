"use client";

import { useActionState, useEffect } from "react";
import { createEvent, updateEvent, type EventActionState } from "@/lib/actions/events";
import type { TeamEvent } from "@/lib/database.types";

const initial: EventActionState = { error: null };

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}
function toTimeInput(iso: string) {
  return new Date(iso).toTimeString().slice(0, 5);
}

export default function EventForm({
  event,
  defaultDate,
  onDone,
  onCancel,
}: {
  event?: TeamEvent;
  defaultDate?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const action = event ? updateEvent : createEvent;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (!pending && !state.error && state !== initial) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  return (
    <form action={formAction} className="space-y-3">
      {event && <input type="hidden" name="id" value={event.id} />}

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Titel</span>
        <input
          name="title"
          required
          defaultValue={event?.title}
          placeholder="t.ex. Träning"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Typ</span>
        <select
          name="type"
          defaultValue={event?.type ?? "training"}
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
        >
          <option value="training">Träning</option>
          <option value="match">Match</option>
          <option value="other">Övrigt</option>
        </select>
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Datum</span>
          <input
            type="date"
            name="date"
            required
            defaultValue={event ? toDateInput(event.start_time) : defaultDate}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Start</span>
          <input
            type="time"
            name="start_time"
            required
            defaultValue={event ? toTimeInput(event.start_time) : "18:00"}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Slut</span>
          <input
            type="time"
            name="end_time"
            defaultValue={event?.end_time ? toTimeInput(event.end_time) : ""}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Plats</span>
        <input
          name="location"
          defaultValue={event?.location ?? ""}
          placeholder="t.ex. Coop Norrbotten Arena"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Beskrivning (valfri)</span>
        <textarea
          name="description"
          defaultValue={event?.description ?? ""}
          rows={2}
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary flex-1 rounded-lg py-2 font-semibold disabled:opacity-60"
        >
          {pending ? "Sparar…" : event ? "Spara" : "Skapa händelse"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium hover:bg-black/5 dark:hover:bg-white/5"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
