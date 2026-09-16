"use client";

import { useActionState } from "react";
import { joinTeam, type TeamActionState } from "@/lib/actions/team";

const initial: TeamActionState = { error: null };

export default function JoinForm({ defaultCode }: { defaultCode: string }) {
  const [state, action, pending] = useActionState(joinTeam, initial);

  return (
    <form
      action={action}
      className="mt-6 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Inbjudningskod</span>
        <input
          name="invite_code"
          required
          defaultValue={defaultCode}
          placeholder="t.ex. AB12CD"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 uppercase outline-none focus:border-[var(--color-primary)]"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full rounded-lg py-2 font-semibold disabled:opacity-60"
      >
        {pending ? "Går med…" : "Gå med i laget"}
      </button>
    </form>
  );
}
