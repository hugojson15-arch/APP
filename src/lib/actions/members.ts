"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PlayerPosition } from "@/lib/database.types";

export async function setMemberRole(profileId: string, role: "admin" | "player") {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", {
    p_profile_id: profileId,
    p_role: role,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/members");
}

export async function removeMember(profileId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_remove_member", { p_profile_id: profileId });
  if (error) throw new Error(error.message);
  revalidatePath("/members");
}

export async function setRosterInfo(
  profileId: string,
  jerseyNumber: number | null,
  position: PlayerPosition | null,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_roster_info", {
    p_profile_id: profileId,
    p_jersey_number: jerseyNumber,
    p_player_position: position,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/chat");
}
