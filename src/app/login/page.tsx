"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  sendMagicLink,
  signInWithPassword,
  signUpWithPassword,
  type AuthActionState,
} from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next ?? "/";
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [signInState, signInAction, signInPending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUpWithPassword,
    initialState,
  );
  const [magicState, magicAction, magicPending] = useActionState(sendMagicLink, initialState);
  const [magicSent, setMagicSent] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Lag-app</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Kalender, chatt och laganda på ett ställe.
        </p>

        <div className="mt-6 flex gap-1 rounded-lg bg-black/5 p-1 text-sm dark:bg-white/5">
          {(["signin", "signup", "magic"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === m ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"
              }`}
            >
              {m === "signin" ? "Logga in" : m === "signup" ? "Skapa konto" : "Magic link"}
            </button>
          ))}
        </div>

        {mode === "signin" && (
          <form action={signInAction} className="mt-6 space-y-3">
            <input type="hidden" name="next" value={next} />
            <Field label="E-post" name="email" type="email" required />
            <Field label="Lösenord" name="password" type="password" required />
            {signInState.error && <ErrorText>{signInState.error}</ErrorText>}
            <SubmitButton pending={signInPending}>Logga in</SubmitButton>
          </form>
        )}

        {mode === "signup" && (
          <form action={signUpAction} className="mt-6 space-y-3">
            <input type="hidden" name="next" value={next} />
            <Field label="Namn" name="name" required />
            <Field label="E-post" name="email" type="email" required />
            <Field label="Lösenord" name="password" type="password" required minLength={6} />
            {signUpState.error && <ErrorText>{signUpState.error}</ErrorText>}
            <SubmitButton pending={signUpPending}>Skapa konto</SubmitButton>
          </form>
        )}

        {mode === "magic" && (
          <form
            action={async (formData) => {
              formData.set("origin", window.location.origin);
              formData.set("next", next);
              await magicAction(formData);
              setMagicSent(true);
            }}
            className="mt-6 space-y-3"
          >
            <Field label="E-post" name="email" type="email" required />
            {magicState.error && <ErrorText>{magicState.error}</ErrorText>}
            {magicSent && !magicState.error && (
              <p className="text-sm text-emerald-600">Kolla din inkorg för inloggningslänken!</p>
            )}
            <SubmitButton pending={magicPending}>Skicka länk</SubmitButton>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Har du en inbjudningslänk?{" "}
          <Link href="/join" className="font-medium text-[var(--color-primary)] underline">
            Gå med i ett lag
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        minLength={props.minLength}
        className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--color-primary)]"
      />
    </label>
  );
}

function ErrorText({ children }: { children: string }) {
  return <p className="text-sm text-red-600">{children}</p>;
}

function SubmitButton({ children, pending }: { children: string; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full rounded-lg py-2 font-semibold transition disabled:opacity-60"
    >
      {pending ? "…" : children}
    </button>
  );
}
