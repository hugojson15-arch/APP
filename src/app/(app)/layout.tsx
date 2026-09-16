import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { teamThemeStyle } from "@/lib/theme";
import AppShell from "./app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, role, team_id")
    .eq("id", user.id)
    .single();
  if (!profile?.team_id) redirect("/onboarding");

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, primary_color, secondary_color, accent_color, logo_url, invite_code")
    .eq("id", profile.team_id)
    .single();
  if (!team) redirect("/onboarding");

  return (
    <div
      style={teamThemeStyle(team.primary_color, team.secondary_color, team.accent_color)}
      className="min-h-screen"
    >
      <AppShell profile={profile} team={team}>
        {children}
      </AppShell>
    </div>
  );
}
