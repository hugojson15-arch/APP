import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CalendarView from "./calendar-view";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, team_id")
    .eq("id", user.id)
    .single();
  if (!profile?.team_id) redirect("/onboarding");

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 14);

  const [{ data: events }, { data: members }] = await Promise.all([
    supabase
      .from("events")
      .select("*, rsvps(*)")
      .eq("team_id", profile.team_id)
      .gte("start_time", rangeStart.toISOString())
      .order("start_time", { ascending: true }),
    supabase.from("profiles").select("id, name, email").eq("team_id", profile.team_id),
  ]);

  return (
    <CalendarView
      teamId={profile.team_id}
      meId={profile.id}
      isAdmin={profile.role === "admin"}
      initialEvents={events ?? []}
      members={members ?? []}
    />
  );
}
