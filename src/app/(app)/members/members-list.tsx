"use client";

import { useTransition } from "react";
import { removeMember, setMemberRole } from "@/lib/actions/members";
import type { Profile } from "@/lib/database.types";

export default function MembersList({
  members,
  isAdmin,
  meId,
}: {
  members: Pick<Profile, "id" | "name" | "email" | "role">[];
  isAdmin: boolean;
  meId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="mt-6 space-y-2">
      {members.map((m) => (
        <li
          key={m.id}
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
        >
          <div>
            <p className="font-medium">
              {m.name || m.email}
              {m.id === meId && <span className="text-[var(--muted)]"> (du)</span>}
            </p>
            <p className="text-xs text-[var(--muted)]">{m.email}</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                m.role === "admin" ? "chip-primary" : "bg-black/5 text-[var(--muted)] dark:bg-white/10"
              }`}
            >
              {m.role === "admin" ? "Tränare/Admin" : "Spelare"}
            </span>

            {isAdmin && m.id !== meId && (
              <>
                <button
                  disabled={pending}
                  onClick={() =>
                    startTransition(() =>
                      setMemberRole(m.id, m.role === "admin" ? "player" : "admin"),
                    )
                  }
                  className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {m.role === "admin" ? "Gör till spelare" : "Gör till admin"}
                </button>
                <button
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Ta bort ${m.name || m.email} från laget?`)) {
                      startTransition(() => removeMember(m.id));
                    }
                  }}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                >
                  Ta bort
                </button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
