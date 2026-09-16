"use client";

import { useActionState, useState } from "react";
import { createTeam, joinTeam, type TeamActionState } from "@/lib/actions/team";
import { DEFAULT_PRIMARY, DEFAULT_SECONDARY } from "@/lib/theme";

const initial: TeamActionState = { error: null };

export default function OnboardingForms() {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [createState, createAction, createPending] = useActionState(createTeam, initial);
  const [joinState, joinAction, joinPending] = useActionState(joinTeam, initial);
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(DEFAULT_SECONDARY);

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="flex gap-1 rounded-lg bg-black/5 p-1 text-sm sm:col-span-2 dark:bg-white/5">
        <button
          onClick={() => setTab("create")}
          className={`flex-1 rounded-md py-1.5 font-medium transition ${
            tab === "create" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"
          }`}
        >
          Skapa lag
        </button>
        <button
          onClick={() => setTab("join")}
          className={`flex-1 rounded-md py-1.5 font-medium transition ${
            tab === "join" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"
          }`}
        >
          Gå med i lag
        </button>
      </div>

      {tab === "create" && (
        <form
          action={createAction}
          className="sm:col-span-2 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Lagnamn</span>
            <input
              name="name"
              required
              placeholder="t.ex. Luleå Hockey J18"
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
            <span className="mb-1 block font-medium">Logga (valfritt)</span>
            <input
              type="file"
              name="logo"
              accept="image/*"
              className="w-full text-sm"
            />
          </label>

          <div
            className="flex items-center gap-3 rounded-lg p-3"
            style={{ background: primary, color: "#fff" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: secondary }}
            >
              LAG
            </div>
            <span className="font-semibold">Förhandsvisning av tema</span>
          </div>

          {createState.error && <p className="text-sm text-red-600">{createState.error}</p>}

          <button
            type="submit"
            disabled={createPending}
            className="btn-primary w-full rounded-lg py-2 font-semibold disabled:opacity-60"
          >
            {createPending ? "Skapar…" : "Skapa lag"}
          </button>
        </form>
      )}

      {tab === "join" && (
        <form
          action={joinAction}
          className="sm:col-span-2 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Inbjudningskod</span>
            <input
              name="invite_code"
              required
              placeholder="t.ex. AB12CD"
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 uppercase outline-none focus:border-[var(--color-primary)]"
            />
          </label>
          {joinState.error && <p className="text-sm text-red-600">{joinState.error}</p>}
          <button
            type="submit"
            disabled={joinPending}
            className="btn-primary w-full rounded-lg py-2 font-semibold disabled:opacity-60"
          >
            {joinPending ? "Går med…" : "Gå med i laget"}
          </button>
        </form>
      )}
    </div>
  );
}
