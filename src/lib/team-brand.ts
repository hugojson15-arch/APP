import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import type { Team } from "@/lib/database.types";

export type TeamBrand = Pick<
  Team,
  "name" | "logo_url" | "primary_color" | "secondary_color" | "accent_color"
>;

/**
 * The logged-in user's team branding, used to make the PWA's manifest,
 * favicon and home-screen icon match whichever team the phone is signed
 * into, instead of one fixed icon for every team. Returns null when there's
 * no session or team yet (login/onboarding), so callers fall back to the
 * generic Lag-app mark.
 */
export async function getCurrentTeamBrand(): Promise<TeamBrand | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", user.id)
      .single();
    if (!profile?.team_id) return null;

    const { data: team } = await supabase
      .from("teams")
      .select("name, logo_url, primary_color, secondary_color, accent_color")
      .eq("id", profile.team_id)
      .single();
    return team ?? null;
  } catch {
    return null;
  }
}

type IconAsset = { bytes: ArrayBuffer | Buffer; contentType: string };

async function fallbackIcon(): Promise<IconAsset> {
  const bytes = await readFile(path.join(process.cwd(), "public/icons/icon.svg"));
  return { bytes, contentType: "image/svg+xml" };
}

export function guessImageType(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "image/png";
  }
}

/** The current team's uploaded logo as raw bytes, or the generic app mark. */
export async function getTeamIconAsset(): Promise<IconAsset> {
  const brand = await getCurrentTeamBrand();
  if (!brand?.logo_url) return fallbackIcon();

  try {
    const res = await fetch(brand.logo_url);
    if (!res.ok) return fallbackIcon();
    return {
      bytes: await res.arrayBuffer(),
      contentType: res.headers.get("content-type") || guessImageType(brand.logo_url),
    };
  } catch {
    return fallbackIcon();
  }
}
