import type { CSSProperties } from "react";

/** Picks black or white text for readable contrast against a hex background. */
export function readableTextColor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}

/**
 * Builds the design-token CSS variables for a team's branding. Every themed
 * surface in the app reads from these vars instead of hardcoded colors, so a
 * new team's colors/logo re-skin the whole UI with zero code changes.
 */
export function teamThemeStyle(primary: string, secondary: string, accent: string): CSSProperties {
  return {
    "--color-primary": primary,
    "--color-primary-text": readableTextColor(primary),
    "--color-secondary": secondary,
    "--color-secondary-text": readableTextColor(secondary),
    "--color-accent": accent,
    "--color-accent-text": readableTextColor(accent),
  } as CSSProperties;
}

// Defaults new teams start from in the onboarding form - a red/black/gold
// scheme (à la Luleå HF), tweak away per team from there.
export const DEFAULT_PRIMARY = "#d91e2a";
export const DEFAULT_SECONDARY = "#0b0b0b";
export const DEFAULT_ACCENT = "#f5c518";
