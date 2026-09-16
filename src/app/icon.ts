import { getTeamIconAsset } from "@/lib/team-brand";

// Per-request favicon: whichever team you're signed into, not one fixed mark.
export const dynamic = "force-dynamic";
export const size = { width: 64, height: 64 };

export default async function Icon() {
  const { bytes, contentType } = await getTeamIconAsset();
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": contentType } });
}
