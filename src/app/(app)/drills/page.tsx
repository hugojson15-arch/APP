import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CoachTabs from "./coach-tabs";
import DrillsList from "./drills-list";

export default async function DrillsPage() {
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

  const { data: drills } = await supabase
    .from("drills")
    .select("id, title, thumbnail_url, created_at")
    .eq("team_id", profile.team_id)
    .order("created_at", { ascending: false });

  const isAdmin = profile.role === "admin";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-bold">Coachverktyg</h1>
      <div className="mt-3">
        <CoachTabs />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          Rita upp powerplay, boxplay eller vilken övning som helst och posta den i chatten.
        </p>
        {isAdmin && (
          <Link
            href="/drills/new"
            className="btn-primary shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold"
          >
            + Ny övning
          </Link>
        )}
      </div>

      <DrillsList drills={drills ?? []} isAdmin={isAdmin} />
    </div>
  );
}
