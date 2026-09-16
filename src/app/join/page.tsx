import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JoinForm from "./join-form";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = code ? `/join?code=${encodeURIComponent(code)}` : "/join";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();
  if (profile?.team_id) redirect("/calendar");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold">Gå med i ett lag</h1>
      <p className="mt-1 text-[var(--muted)]">
        Ange koden du fick av din tränare eller lagledare.
      </p>
      <JoinForm defaultCode={code ?? ""} />
    </main>
  );
}
