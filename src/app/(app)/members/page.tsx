import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MembersList from "./members-list";

export default async function MembersPage() {
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

  const [{ data: team }, { data: members }] = await Promise.all([
    supabase.from("teams").select("invite_code").eq("id", profile.team_id).single(),
    supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("team_id", profile.team_id)
      .order("role", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Laget</h1>
        {profile.role === "admin" && team?.invite_code && (
          <span className="text-sm text-[var(--muted)]">
            Kod: <code className="font-bold">{team.invite_code}</code>
          </span>
        )}
      </div>
      <MembersList members={members ?? []} isAdmin={profile.role === "admin"} meId={profile.id} />
    </div>
  );
}
