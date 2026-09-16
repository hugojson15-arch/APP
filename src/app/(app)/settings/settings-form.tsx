"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { updateTeamBranding, regenerateInviteCode, type TeamActionState } from "@/lib/actions/team";
import type { Team } from "@/lib/database.types";

const initial: TeamActionState = { error: null };

export default function SettingsForm({
  team,
}: {
  team: Pick<Team, "id" | "name" | "primary_color" | "secondary_color" | "logo_url" | "invite_code">;
}) {
  const [state, action, pending] = useActionState(updateTeamBranding, initial);
  const [primary, setPrimary] = useState(team.primary_color);
  const [secondary, setSecondary] = useState(team.secondary_color);
  const [saved, setSaved] = useState(false);
  const [inviteCode, setInviteCode] = useState(team.invite_code);
  const [isRegenerating, startRegenerate] = useTransition();

  // Computed post-mount (not during render) so the server-rendered markup -
  // which has no notion of window.location - matches the initial client
  // render, avoiding a hydration mismatch.
  const [inviteLink, setInviteLink] = useState("");
  useEffect(() => {
    const link = `${window.location.origin}/join?code=${inviteCode}`;
    // Deferred to a microtask so this isn't a synchronous setState-in-effect.
    queueMicrotask(() => setInviteLink(link));
  }, [inviteCode]);

  return (
    <div className="mt-6 space-y-8">
      <form
        action={async (formData) => {
          setSaved(false);
          await action(formData);
          setSaved(true);
        }}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
      >
        <input type="hidden" name="team_id" value={team.id} />

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Lagnamn</span>
          <input
            name="name"
            defaultValue={team.name}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Primärfärg</span>
            <input
              type="color"
              name="primary_color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border)]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Sekundärfärg</span>
            <input
              type="color"
              name="secondary_color"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border)]"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Byt logga</span>
          <input type="file" name="logo" accept="image/*" className="w-full text-sm" />
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {saved && !state.error && <p className="text-sm text-emerald-600">Sparat!</p>}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary rounded-lg px-4 py-2 font-semibold disabled:opacity-60"
        >
          {pending ? "Sparar…" : "Spara ändringar"}
        </button>
      </form>

      <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-semibold">Bjud in spelare</h2>
        <p className="text-sm text-[var(--muted)]">Dela koden eller länken med laget.</p>
        <div className="flex items-center gap-2">
          <code className="chip-primary rounded-lg px-3 py-1.5 text-lg font-bold tracking-widest">
            {inviteCode}
          </code>
          <button
            type="button"
            onClick={() =>
              startRegenerate(async () => {
                const code = await regenerateInviteCode(team.id);
                setInviteCode(code);
              })
            }
            disabled={isRegenerating}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            {isRegenerating ? "…" : "Ny kod"}
          </button>
        </div>
        {inviteLink && (
          <input
            readOnly
            value={inviteLink}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        )}
      </div>
    </div>
  );
}
