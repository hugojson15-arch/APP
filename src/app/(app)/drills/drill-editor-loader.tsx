"use client";

import dynamic from "next/dynamic";
import type { Profile, Team } from "@/lib/database.types";

// Konva touches `window` at import time, so the editor can only ever run
// client-side - loading it any other way breaks the server render.
const DrillEditor = dynamic(() => import("./drill-editor"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-[var(--muted)]">
      Laddar ritverktyget…
    </div>
  ),
});

export default function DrillEditorLoader({
  team,
  roster,
}: {
  team: Pick<Team, "name" | "primary_color" | "secondary_color">;
  roster: Pick<Profile, "id" | "name" | "email" | "jersey_number">[];
}) {
  return <DrillEditor team={team} roster={roster} />;
}
