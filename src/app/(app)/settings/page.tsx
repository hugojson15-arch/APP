import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team_id")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" || !profile.team_id) redirect("/calendar");

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, primary_color, secondary_color, logo_url, invite_code")
    .eq("id", profile.team_id)
    .single();
  if (!team) redirect("/calendar");

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-xl font-bold">Laginställningar</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Ändra namn, färger och logga. Hela appens tema uppdateras direkt för alla i laget.
      </p>
      <SettingsForm team={team} />
    </div>
  );
}
