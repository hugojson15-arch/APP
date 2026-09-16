"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DrillData } from "@/lib/drill-types";

export type DrillActionState = { error: string | null };

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Ogiltig bilddata");
  return { buffer: Buffer.from(match[2], "base64"), contentType: match[1] };
}

export async function saveDrill({
  title,
  drawingData,
  thumbnailDataUrl,
  drillId,
}: {
  title: string;
  drawingData: DrillData;
  thumbnailDataUrl: string;
  drillId?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, error: "Du måste vara inloggad" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();
  if (!profile?.team_id) return { id: null, error: "Du tillhör inget lag" };

  let thumbnailUrl: string;
  try {
    const { buffer, contentType } = dataUrlToBuffer(thumbnailDataUrl);
    const path = `${profile.team_id}/${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("drills")
      .upload(path, buffer, { contentType, upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    thumbnailUrl = supabase.storage.from("drills").getPublicUrl(path).data.publicUrl;
  } catch (e) {
    return { id: null, error: e instanceof Error ? e.message : "Kunde inte ladda upp bilden" };
  }

  if (drillId) {
    const { error } = await supabase
      .from("drills")
      .update({
        title,
        drawing_data: drawingData,
        thumbnail_url: thumbnailUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", drillId);
    if (error) return { id: null, error: error.message };
    revalidatePath("/drills");
    return { id: drillId, error: null };
  }

  const { data, error } = await supabase
    .from("drills")
    .insert({
      team_id: profile.team_id,
      title,
      drawing_data: drawingData,
      thumbnail_url: thumbnailUrl,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { id: null, error: error.message };

  revalidatePath("/drills");
  return { id: data.id, error: null };
}

export async function postDrillToChat(drillId: string): Promise<DrillActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste vara inloggad" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();
  if (!profile?.team_id) return { error: "Du tillhör inget lag" };

  const { data: drill } = await supabase
    .from("drills")
    .select("title, thumbnail_url, team_id")
    .eq("id", drillId)
    .single();
  if (!drill || drill.team_id !== profile.team_id) return { error: "Hittade inte övningen" };

  const { error } = await supabase.from("messages").insert({
    team_id: profile.team_id,
    user_id: user.id,
    content: `🏒 ${drill.title}`,
    image_url: drill.thumbnail_url,
  });
  if (error) return { error: error.message };

  return { error: null };
}

export async function deleteDrill(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("drills").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/drills");
}
