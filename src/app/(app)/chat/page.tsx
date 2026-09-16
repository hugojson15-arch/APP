import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatView from "./chat-view";

export default async function ChatPage() {
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

  const [{ data: messages }, { data: members }, { data: reads }, { data: team }] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("team_id", profile.team_id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select("id, name, email, jersey_number, player_position")
      .eq("team_id", profile.team_id),
    supabase.from("chat_reads").select("*").eq("team_id", profile.team_id),
    supabase
      .from("teams")
      .select("name, logo_url, primary_color, secondary_color")
      .eq("id", profile.team_id)
      .single(),
  ]);

  return (
    <ChatView
      teamId={profile.team_id}
      meId={profile.id}
      isAdmin={profile.role === "admin"}
      initialMessages={(messages ?? []).slice().reverse()}
      members={members ?? []}
      initialReads={reads ?? []}
      team={team}
    />
  );
}
