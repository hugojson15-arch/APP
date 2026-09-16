export type EventType = "training" | "match" | "other";
export type RsvpStatus = "going" | "not_going" | "maybe";
export type Role = "admin" | "player";

export interface Team {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  invite_code: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: Role | null;
  team_id: string | null;
  created_at: string;
}

export interface TeamEvent {
  id: string;
  team_id: string;
  title: string;
  type: EventType;
  location: string | null;
  start_time: string;
  end_time: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  updated_at: string;
}

export interface Message {
  id: string;
  team_id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

export interface ChatRead {
  team_id: string;
  user_id: string;
  last_read_at: string;
}
