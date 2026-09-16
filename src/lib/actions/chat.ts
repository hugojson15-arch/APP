"use server";

import { createClient } from "@/lib/supabase/server";

export type ChatActionState = { error: string | null };

export async function sendMessage(
  _prev: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  const content = String(formData.get("content") ?? "").trim();
  const image = formData.get("image");

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

  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    const ext = image.name.split(".").pop() ?? "jpg";
    const path = `${profile.team_id}/${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(path, image, { contentType: image.type || "image/jpeg" });
    if (uploadError) return { error: uploadError.message };
    imageUrl = supabase.storage.from("chat-images").getPublicUrl(path).data.publicUrl;
  }

  if (!content && !imageUrl) return { error: "Skriv ett meddelande eller bifoga en bild" };

  const { error } = await supabase.from("messages").insert({
    team_id: profile.team_id,
    user_id: user.id,
    content: content || null,
    image_url: imageUrl,
  });
  if (error) return { error: error.message };

  return { error: null };
}

export async function markChatRead(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("chat_reads")
    .upsert(
      { team_id: teamId, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: "team_id,user_id" },
    );
}
