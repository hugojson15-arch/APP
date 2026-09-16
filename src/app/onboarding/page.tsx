import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForms from "./onboarding-forms";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();
  if (profile?.team_id) redirect("/calendar");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold">Välkommen!</h1>
      <p className="mt-1 text-[var(--muted)]">Skapa ett nytt lag eller gå med i ett befintligt.</p>
      <OnboardingForms />
    </main>
  );
}
