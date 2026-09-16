"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EventType, RsvpStatus } from "@/lib/database.types";

export type EventActionState = { error: string | null };

export async function createEvent(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
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

  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "training") as EventType;
  const location = String(formData.get("location") ?? "").trim() || null;
  const date = String(formData.get("date") ?? "");
  const startTimeStr = String(formData.get("start_time") ?? "");
  const endTimeStr = String(formData.get("end_time") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!title || !date || !startTimeStr) return { error: "Fyll i titel, datum och tid" };

  const start_time = new Date(`${date}T${startTimeStr}`).toISOString();
  const end_time = endTimeStr ? new Date(`${date}T${endTimeStr}`).toISOString() : null;

  const { error } = await supabase.from("events").insert({
    team_id: profile.team_id,
    title,
    type,
    location,
    start_time,
    end_time,
    description,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/calendar");
  return { error: null };
}

export async function updateEvent(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Saknar händelse-id" };

  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "training") as EventType;
  const location = String(formData.get("location") ?? "").trim() || null;
  const date = String(formData.get("date") ?? "");
  const startTimeStr = String(formData.get("start_time") ?? "");
  const endTimeStr = String(formData.get("end_time") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!title || !date || !startTimeStr) return { error: "Fyll i titel, datum och tid" };

  const start_time = new Date(`${date}T${startTimeStr}`).toISOString();
  const end_time = endTimeStr ? new Date(`${date}T${endTimeStr}`).toISOString() : null;

  const { error } = await supabase
    .from("events")
    .update({
      title,
      type,
      location,
      start_time,
      end_time,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/calendar");
  return { error: null };
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function upsertRsvp(eventId: string, status: RsvpStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Du måste vara inloggad");

  const { error } = await supabase
    .from("rsvps")
    .upsert(
      { event_id: eventId, user_id: user.id, status, updated_at: new Date().toISOString() },
      { onConflict: "event_id,user_id" },
    );
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}
