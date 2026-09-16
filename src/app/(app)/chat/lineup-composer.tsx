"use client";

import { useMemo, useRef, useState } from "react";
import { sendMessage } from "@/lib/actions/chat";
import { setRosterInfo } from "@/lib/actions/members";
import type { PlayerPosition, Profile, Team } from "@/lib/database.types";
import LineupCard, { type LineupGroups } from "./lineup-card";

type RosterMember = Pick<Profile, "id" | "name" | "email" | "jersey_number" | "player_position">;

const POSITION_LABEL: Record<PlayerPosition, string> = {
  forward: "Forward",
  defense: "Back",
  goalie: "Målvakt",
};

type Assignment = { position: PlayerPosition | "none"; jerseyNumber: string };

export default function LineupComposer({
  team,
  roster,
  onClose,
}: {
  team: Pick<Team, "name" | "logo_url" | "primary_color" | "secondary_color">;
  roster: RosterMember[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState("Dagens lineup");
  const [opponent, setOpponent] = useState("");
  const [assignments, setAssignments] = useState<Record<string, Assignment>>(() =>
    Object.fromEntries(
      roster.map((m) => [
        m.id,
        {
          position: m.player_position ?? "none",
          jerseyNumber: m.jersey_number != null ? String(m.jersey_number) : "",
        },
      ]),
    ),
  );
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const groups: LineupGroups = useMemo(() => {
    const result: LineupGroups = { forward: [], defense: [], goalie: [] };
    for (const m of roster) {
      const a = assignments[m.id];
      if (!a || a.position === "none") continue;
      result[a.position].push({
        id: m.id,
        name: m.name || m.email,
        jerseyNumber: a.jerseyNumber.trim() ? Number(a.jerseyNumber) : null,
      });
    }
    return result;
  }, [assignments, roster]);

  const playerCount = groups.forward.length + groups.defense.length + groups.goalie.length;

  function updateAssignment(id: string, patch: Partial<Assignment>) {
    setAssignments((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handlePost() {
    if (!cardRef.current || playerCount === 0) return;
    setPosting(true);
    setError(null);
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(cardRef.current, { pixelRatio: 2 });
      if (!blob) throw new Error("Kunde inte skapa bilden");

      const file = new File([blob], "lineup.png", { type: "image/png" });
      const formData = new FormData();
      formData.set("content", opponent ? `🏒 ${title} vs ${opponent}` : `🏒 ${title}`);
      formData.set("image", file);

      const result = await sendMessage({ error: null }, formData);
      if (result.error) {
        setError(result.error);
        setPosting(false);
        return;
      }

      // Best-effort: remember numbers/positions for next time. Don't block
      // the post (already sent) on this.
      Promise.all(
        Object.entries(assignments)
          .filter(([id, a]) => {
            const original = roster.find((m) => m.id === id);
            const newNumber = a.jerseyNumber.trim() ? Number(a.jerseyNumber) : null;
            const newPosition = a.position === "none" ? null : a.position;
            return original?.jersey_number !== newNumber || original?.player_position !== newPosition;
          })
          .map(([id, a]) =>
            setRosterInfo(
              id,
              a.jerseyNumber.trim() ? Number(a.jerseyNumber) : null,
              a.position === "none" ? null : a.position,
            ).catch(() => {}),
          ),
      );

      onClose();
    } catch {
      setError("Kunde inte skapa bilden. Prova igen.");
      setPosting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[var(--surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-lg font-bold">Ny lineup</h2>
          <button
            onClick={onClose}
            aria-label="Stäng"
            className="rounded-full p-1 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-y-auto md:grid-cols-2">
          <div className="space-y-4 border-b border-[var(--border)] p-5 md:border-b-0 md:border-r">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Titel</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Motståndare (valfritt)</span>
                <input
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="t.ex. Rögle"
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
                />
              </label>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Trupp</p>
              <ul className="space-y-1.5">
                {roster.map((m) => {
                  const a = assignments[m.id];
                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-2.5 py-1.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">{m.name || m.email}</span>
                      <input
                        type="number"
                        value={a.jerseyNumber}
                        onChange={(e) => updateAssignment(m.id, { jerseyNumber: e.target.value })}
                        placeholder="#"
                        className="w-14 rounded-md border border-[var(--border)] bg-transparent px-1.5 py-1 text-center text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                      <div className="flex gap-1">
                        {(["none", "forward", "defense", "goalie"] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => updateAssignment(m.id, { position: pos })}
                            className={`rounded-md px-2 py-1 text-xs font-semibold ${
                              a.position === pos
                                ? "btn-primary"
                                : "border border-[var(--border)] text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                          >
                            {pos === "none" ? "–" : POSITION_LABEL[pos]}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 overflow-x-auto bg-black/5 p-5 dark:bg-white/5">
            <div ref={cardRef}>
              <LineupCard team={team} title={title} opponent={opponent} groups={groups} />
            </div>
            {playerCount === 0 && (
              <p className="text-center text-xs text-[var(--muted)]">
                Lägg till minst en spelare i truppen för att posta.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          {error && <p className="mr-auto text-sm text-red-600">{error}</p>}
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
          >
            Avbryt
          </button>
          <button
            onClick={handlePost}
            disabled={posting || playerCount === 0}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {posting ? "Postar…" : "Posta i chatten"}
          </button>
        </div>
      </div>
    </div>
  );
}
