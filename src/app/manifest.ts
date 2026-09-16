import type { MetadataRoute } from "next";
import { getCurrentTeamBrand, guessImageType } from "@/lib/team-brand";
import { DEFAULT_PRIMARY } from "@/lib/theme";

// Per-request: the icon/name/theme-color reflect whichever team the signed-in
// phone belongs to, so "Add to Home Screen" shows that team's own logo.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getCurrentTeamBrand();

  const icons: NonNullable<MetadataRoute.Manifest["icons"]> = brand?.logo_url
    ? [
        {
          src: brand.logo_url,
          sizes: "192x192",
          type: guessImageType(brand.logo_url),
          purpose: "any",
        },
        {
          src: brand.logo_url,
          sizes: "512x512",
          type: guessImageType(brand.logo_url),
          purpose: "maskable",
        },
      ]
    : [
        { src: "/icons/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
        { src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
      ];

  return {
    name: brand?.name ?? "Lag-app",
    short_name: brand?.name ?? "Lag-app",
    description: "Kalender, chatt och klubbanpassad branding för ditt lag.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: brand?.primary_color ?? DEFAULT_PRIMARY,
    icons,
  };
}
