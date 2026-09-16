import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CoachTabs from "../coach-tabs";
import ScoutingView from "./scouting-view";

export default async function ScoutingPage() {
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
  if (!profile?.team_id) redirect("/onboarding");

  const { data: reports } = await supabase
    .from("scouting_reports")
    .select("id, opponent_name, forecheck_notes, pp_notes, faceoff_notes")
    .eq("team_id", profile.team_id)
    .order("opponent_name", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-bold">Coachverktyg</h1>
      <div className="mt-3">
        <CoachTabs />
      </div>
      <ScoutingView reports={reports ?? []} isAdmin={profile.role === "admin"} />
    </div>
  );
}
