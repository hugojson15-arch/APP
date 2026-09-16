"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteScoutingReport,
  saveScoutingReport,
  type ScoutingActionState,
} from "@/lib/actions/scouting";
import type { ScoutingReport } from "@/lib/database.types";

const initial: ScoutingActionState = { error: null };

type Report = Pick<
  ScoutingReport,
  "id" | "opponent_name" | "forecheck_notes" | "pp_notes" | "faceoff_notes"
>;

export default function ScoutingView({ reports, isAdmin }: { reports: Report[]; isAdmin: boolean }) {
  const [editing, setEditing] = useState<Report | "new" | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          Forecheck, förväntade PP-uppställningar och tekningstendenser per motståndare.
        </p>
        {isAdmin && editing === null && (
          <button
            onClick={() => setEditing("new")}
            className="btn-primary shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold"
          >
            + Ny rapport
          </button>
        )}
      </div>

      {editing !== null && (
        <ReportForm
          report={editing === "new" ? null : editing}
          onDone={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      )}

      {reports.length === 0 && editing === null && (
        <p className="mt-10 text-center text-sm text-[var(--muted)]">Inga scoutingrapporter än.</p>
      )}

      <ul className="mt-4 space-y-2">
        {reports.map((r) => {
          const expanded = expandedId === r.id;
          return (
            <li key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                  className="text-left font-semibold"
                >
                  {r.opponent_name}
                </button>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditing(r)}
                      className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
                      aria-label="Redigera"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Ta bort rapporten om ${r.opponent_name}?`)) {
                          deleteScoutingReport(r.id);
                        }
                      }}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      aria-label="Ta bort"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>

              {expanded && (
                <div className="mt-3 space-y-2 text-sm">
                  <Field label="Forecheck" value={r.forecheck_notes} />
                  <Field label="Förväntad PP" value={r.pp_notes} />
                  <Field label="Tekningstendenser" value={r.faceoff_notes} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-[var(--muted)]">{label}</p>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ReportForm({
  report,
  onDone,
  onCancel,
}: {
  report: Report | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveScoutingReport, initial);

  useEffect(() => {
    if (state !== initial && !state.error) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      {report && <input type="hidden" name="id" value={report.id} />}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Motståndare</span>
        <input
          name="opponent_name"
          required
          defaultValue={report?.opponent_name}
          placeholder="t.ex. Björklöven"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Forecheck</span>
        <textarea
          name="forecheck_notes"
          defaultValue={report?.forecheck_notes ?? ""}
          rows={2}
          placeholder="t.ex. Aggressiv 2-1-2, jagar första passen"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Förväntad PP</span>
        <textarea
          name="pp_notes"
          defaultValue={report?.pp_notes ?? ""}
          rows={2}
          placeholder="t.ex. 1-3-1, skjuter från halv vänster"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Tekningstendenser</span>
        <textarea
          name="faceoff_notes"
          defaultValue={report?.faceoff_notes ?? ""}
          rows={2}
          placeholder="t.ex. #9 vinner backhand, brickar åt vänster"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary flex-1 rounded-lg py-2 font-semibold disabled:opacity-60"
        >
          {pending ? "Sparar…" : "Spara"}
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
