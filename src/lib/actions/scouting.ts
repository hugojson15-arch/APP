"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ScoutingActionState = { error: string | null };

export async function saveScoutingReport(
  _prev: ScoutingActionState,
  formData: FormData,
): Promise<ScoutingActionState> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const opponentName = String(formData.get("opponent_name") ?? "").trim();
  const forecheckNotes = String(formData.get("forecheck_notes") ?? "").trim() || null;
  const ppNotes = String(formData.get("pp_notes") ?? "").trim() || null;
  const faceoffNotes = String(formData.get("faceoff_notes") ?? "").trim() || null;

  if (!opponentName) return { error: "Ange motståndarens namn" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste vara inloggad" };

  if (id) {
    const { error } = await supabase
      .from("scouting_reports")
      .update({
        opponent_name: opponentName,
        forecheck_notes: forecheckNotes,
        pp_notes: ppNotes,
        faceoff_notes: faceoffNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", user.id)
      .single();
    if (!profile?.team_id) return { error: "Du tillhör inget lag" };

    const { error } = await supabase.from("scouting_reports").insert({
      team_id: profile.team_id,
      opponent_name: opponentName,
      forecheck_notes: forecheckNotes,
      pp_notes: ppNotes,
      faceoff_notes: faceoffNotes,
      created_by: user.id,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/drills/scouting");
  return { error: null };
}

export async function deleteScoutingReport(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("scouting_reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/drills/scouting");
}
