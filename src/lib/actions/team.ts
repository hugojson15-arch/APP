"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ACCENT, DEFAULT_PRIMARY, DEFAULT_SECONDARY } from "@/lib/theme";

export type TeamActionState = { error: string | null };

async function uploadLogoIfPresent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  logo: FormDataEntryValue | null,
): Promise<string | null> {
  if (!(logo instanceof File) || logo.size === 0) return null;

  const ext = logo.name.split(".").pop() ?? "png";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("logos").upload(path, logo, {
    upsert: true,
    contentType: logo.type || "image/png",
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  return data.publicUrl;
}

export async function createTeam(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const primaryColor = String(formData.get("primary_color") ?? DEFAULT_PRIMARY);
  const secondaryColor = String(formData.get("secondary_color") ?? DEFAULT_SECONDARY);
  const accentColor = String(formData.get("accent_color") ?? DEFAULT_ACCENT);

  if (!name) return { error: "Ange ett lagnamn" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste vara inloggad" };

  let logoUrl: string | null = null;
  try {
    logoUrl = await uploadLogoIfPresent(supabase, user.id, formData.get("logo"));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Kunde inte ladda upp loggan" };
  }

  const { error } = await supabase.rpc("create_team", {
    p_name: name,
    p_primary_color: primaryColor,
    p_secondary_color: secondaryColor,
    p_accent_color: accentColor,
    p_logo_url: logoUrl,
  });
  if (error) return { error: error.message };

  redirect("/calendar");
}

export async function joinTeam(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const code = String(formData.get("invite_code") ?? "").trim();
  if (!code) return { error: "Ange en inbjudningskod" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_team", { p_invite_code: code });
  if (error) return { error: "Ogiltig kod. Kontrollera med din lagledare." };

  redirect("/calendar");
}

export async function updateTeamBranding(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const teamId = String(formData.get("team_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const primaryColor = String(formData.get("primary_color") ?? DEFAULT_PRIMARY);
  const secondaryColor = String(formData.get("secondary_color") ?? DEFAULT_SECONDARY);
  const accentColor = String(formData.get("accent_color") ?? DEFAULT_ACCENT);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste vara inloggad" };

  let logoUrl: string | undefined;
  try {
    const uploaded = await uploadLogoIfPresent(supabase, user.id, formData.get("logo"));
    if (uploaded) logoUrl = uploaded;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Kunde inte ladda upp loggan" };
  }

  const update: Record<string, string> = {
    name,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    accent_color: accentColor,
  };
  if (logoUrl) update.logo_url = logoUrl;

  const { error } = await supabase.from("teams").update(update).eq("id", teamId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}

export async function regenerateInviteCode(teamId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("regenerate_invite_code", { p_team_id: teamId });
  if (error) throw new Error(error.message);
  revalidatePath("/members");
  return data as string;
}
