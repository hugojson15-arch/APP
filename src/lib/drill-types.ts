export type RinkTemplate = "full" | "half" | "neutral";
export type ArrowStyle = "skate" | "pass" | "shot";
export type ShapeTeam = "us" | "opp";

export interface PlayerShape {
  id: string;
  type: "player";
  x: number;
  y: number;
  team: ShapeTeam;
  label: string;
}

export interface PuckShape {
  id: string;
  type: "puck";
  x: number;
  y: number;
}

export interface ConeShape {
  id: string;
  type: "cone";
  x: number;
  y: number;
}

export interface TextShape {
  id: string;
  type: "text";
  x: number;
  y: number;
  text: string;
}

export interface ArrowShape {
  id: string;
  type: "arrow";
  points: [number, number, number, number];
  style: ArrowStyle;
}

export type DrillShape = PlayerShape | PuckShape | ConeShape | TextShape | ArrowShape;

export interface DrillData {
  rink: RinkTemplate;
  shapes: DrillShape[];
}

export const RINK_SIZE: Record<RinkTemplate, { width: number; height: number }> = {
  full: { width: 500, height: 1000 },
  half: { width: 500, height: 520 },
  neutral: { width: 500, height: 420 },
};

export const ARROW_STYLE_LABEL: Record<ArrowStyle, string> = {
  skate: "Skridsko",
  pass: "Passning",
  shot: "Skott",
};

/** A known powerplay formation, pre-placing players on a half-rink. Coordinates
 * are in the "half" rink's coordinate space (see RINK_SIZE). */
export interface FormationPreset {
  id: string;
  name: string;
  category: "powerplay";
  positions: { label: string; x: number; y: number }[];
}

export const FORMATION_PRESETS: FormationPreset[] = [
  {
    id: "1-3-1",
    name: "1-3-1",
    category: "powerplay",
    positions: [
      { label: "Net Front", x: 250, y: 130 },
      { label: "Halv V", x: 140, y: 260 },
      { label: "Bumper", x: 250, y: 280 },
      { label: "Halv H", x: 360, y: 260 },
      { label: "Point", x: 250, y: 420 },
    ],
  },
];
