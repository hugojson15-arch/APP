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

export type FormationCategory = "powerplay" | "penalty-kill";

export const FORMATION_CATEGORY_LABEL: Record<FormationCategory, string> = {
  powerplay: "Powerplay",
  "penalty-kill": "Boxplay",
};

/** A known formation, pre-placing players on a half-rink. Coordinates are in
 * the "half" rink's coordinate space (see RINK_SIZE). Applying one adds its
 * players to the canvas rather than replacing it, so e.g. "PK Forwards" and
 * "PK Backar" can be combined into a full penalty-kill box. */
export interface FormationPreset {
  id: string;
  name: string;
  category: FormationCategory;
  positions: { label: string; x: number; y: number }[];
}

export const FORMATION_PRESETS: FormationPreset[] = [
  {
    id: "pp1",
    name: "PP1",
    category: "powerplay",
    positions: [
      { label: "Net Front", x: 250, y: 130 },
      { label: "Halv V", x: 140, y: 260 },
      { label: "Bumper", x: 250, y: 280 },
      { label: "Halv H", x: 360, y: 260 },
      { label: "Point", x: 250, y: 420 },
    ],
  },
  {
    id: "pp2",
    name: "PP2 (Paraply)",
    category: "powerplay",
    positions: [
      { label: "Net Front", x: 250, y: 150 },
      { label: "Half Wall", x: 150, y: 250 },
      { label: "Left Flank", x: 110, y: 390 },
      { label: "Point", x: 250, y: 420 },
      { label: "Right Flank", x: 390, y: 390 },
    ],
  },
  {
    id: "pk-forwards",
    name: "PK Forwards",
    category: "penalty-kill",
    positions: [
      { label: "F1", x: 170, y: 200 },
      { label: "F2", x: 330, y: 200 },
    ],
  },
  {
    id: "pk-backar",
    name: "PK Backar",
    category: "penalty-kill",
    positions: [
      { label: "D1", x: 190, y: 350 },
      { label: "D2", x: 310, y: 350 },
    ],
  },
];
