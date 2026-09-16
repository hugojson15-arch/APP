import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DrillEditorLoader from "../drill-editor-loader";

export default async function NewDrillPage() {
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
  if (profile?.role !== "admin" || !profile.team_id) redirect("/drills");

  const [{ data: team }, { data: roster }] = await Promise.all([
    supabase
      .from("teams")
      .select("name, primary_color, secondary_color")
      .eq("id", profile.team_id)
      .single(),
    supabase
      .from("profiles")
      .select("id, name, email, jersey_number")
      .eq("team_id", profile.team_id)
      .order("jersey_number", { ascending: true, nullsFirst: false }),
  ]);
  if (!team) redirect("/drills");

  return <DrillEditorLoader team={team} roster={roster ?? []} />;
}
