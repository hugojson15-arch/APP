import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CoachTabs from "../coach-tabs";
import VideosView from "./videos-view";

export default async function VideosPage() {
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

  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, video_url, created_at")
    .eq("team_id", profile.team_id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-bold">Coachverktyg</h1>
      <div className="mt-3">
        <CoachTabs />
      </div>
      <VideosView teamId={profile.team_id} videos={videos ?? []} isAdmin={profile.role === "admin"} />
    </div>
  );
}
