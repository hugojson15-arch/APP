import { readableTextColor } from "@/lib/theme";
import type { PlayerPosition } from "@/lib/database.types";

export type LineupPlayer = {
  id: string;
  name: string;
  jerseyNumber: number | null;
};

export type LineupGroups = Record<PlayerPosition, LineupPlayer[]>;

const SECTION_LABEL: Record<PlayerPosition, string> = {
  forward: "Forwards",
  defense: "Backar",
  goalie: "Målvakter",
};

const SECTION_COLS: Record<PlayerPosition, string> = {
  forward: "grid-cols-3",
  defense: "grid-cols-2",
  goalie: "grid-cols-2",
};

export default function LineupCard({
  team,
  title,
  opponent,
  groups,
}: {
  team: { name: string; logo_url: string | null; primary_color: string; secondary_color: string };
  title: string;
  opponent: string;
  groups: LineupGroups;
}) {
  const onPrimary = readableTextColor(team.primary_color);

  return (
    <div
      className="relative w-[640px] overflow-hidden rounded-none font-sans"
      style={{
        background: `linear-gradient(135deg, ${team.primary_color} 0%, ${team.primary_color} 35%, ${team.secondary_color} 75%)`,
        color: onPrimary,
      }}
    >
      <div className="relative z-10 flex items-center justify-between px-8 pt-8">
        <div className="flex items-center gap-3">
          {team.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- captured to canvas, next/image adds no value here
            <img
              src={team.logo_url}
              alt={team.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/20 text-lg font-bold">
              {team.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="text-lg font-semibold">{team.name}</span>
        </div>
        {opponent && (
          <span className="rounded-full bg-black/25 px-4 py-1.5 text-sm font-semibold">
            vs {opponent}
          </span>
        )}
      </div>

      <div className="relative z-10 px-8 pb-2 pt-6">
        <h1 className="text-5xl font-black uppercase leading-none tracking-tight">{title}</h1>
      </div>

      <div className="relative z-10 flex flex-col gap-6 px-8 pb-8 pt-6">
        {(Object.keys(SECTION_LABEL) as PlayerPosition[]).map((pos) => {
          const players = groups[pos];
          if (players.length === 0) return null;
          return (
            <div key={pos}>
              <div
                className="mb-3 inline-block rounded px-3 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
              >
                {SECTION_LABEL[pos]}
              </div>
              <div className={`grid ${SECTION_COLS[pos]} gap-x-4 gap-y-3`}>
                {players.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
                      style={{ borderColor: onPrimary }}
                    >
                      {p.jerseyNumber ?? "–"}
                    </span>
                    <span className="truncate text-[15px] font-semibold uppercase">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 px-8 pb-6 text-right text-xs font-semibold uppercase tracking-widest opacity-70">
        Lag-app
      </div>
    </div>
  );
}
