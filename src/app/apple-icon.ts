import { getTeamIconAsset } from "@/lib/team-brand";

// iOS "Add to Home Screen" reads this - same per-team logo as icon.ts/manifest.ts.
export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };

export default async function AppleIcon() {
  const { bytes, contentType } = await getTeamIconAsset();
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": contentType } });
}
