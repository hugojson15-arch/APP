"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
