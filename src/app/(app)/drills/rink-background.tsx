"use client";

import { Circle, Group, Line, Rect } from "react-konva";
import type { RinkTemplate } from "@/lib/drill-types";

const ICE = "#eef4fb";
const LINE_RED = "#c0202f";
const LINE_BLUE = "#1d4ed8";

/** A simplified, illustrative rink - not to regulation scale, just enough
 * structure (lines, circles, creases) for a coach to sketch a drill against. */
export default function RinkBackground({
  rink,
  width,
  height,
}: {
  rink: RinkTemplate;
  width: number;
  height: number;
}) {
  const pad = 10;

  return (
    <Group listening={false}>
      <Rect
        x={pad}
        y={pad}
        width={width - pad * 2}
        height={height - pad * 2}
        cornerRadius={28}
        fill={ICE}
        stroke="#0f172a"
        strokeWidth={3}
      />

      {rink === "full" && (
        <>
          <Line points={[pad, height / 3, width - pad, height / 3]} stroke={LINE_BLUE} strokeWidth={4} />
          <Line
            points={[pad, (height / 3) * 2, width - pad, (height / 3) * 2]}
            stroke={LINE_BLUE}
            strokeWidth={4}
          />
          <Line points={[pad, height / 2, width - pad, height / 2]} stroke={LINE_RED} strokeWidth={3} />
          <Circle x={width / 2} y={height / 2} radius={45} stroke={LINE_RED} strokeWidth={2} />
          <Circle x={width / 2} y={height / 2} radius={3} fill={LINE_RED} />
          {[0.22, 0.78].map((fx) =>
            [0.15, 0.85].map((fy) => (
              <FaceoffCircle key={`${fx}-${fy}`} x={width * fx} y={height * fy} />
            )),
          )}
          <Crease x={width / 2} y={pad} flip={false} />
          <Crease x={width / 2} y={height - pad} flip={true} />
        </>
      )}

      {rink === "half" && (
        <>
          <Line
            points={[pad, height * 0.88, width - pad, height * 0.88]}
            stroke={LINE_BLUE}
            strokeWidth={4}
          />
          <FaceoffCircle x={width * 0.28} y={height * 0.5} />
          <FaceoffCircle x={width * 0.72} y={height * 0.5} />
          <Crease x={width / 2} y={pad} flip={false} />
        </>
      )}

      {rink === "neutral" && (
        <>
          <Line points={[pad, height * 0.12, width - pad, height * 0.12]} stroke={LINE_BLUE} strokeWidth={4} />
          <Line points={[pad, height * 0.88, width - pad, height * 0.88]} stroke={LINE_BLUE} strokeWidth={4} />
          <Line points={[pad, height / 2, width - pad, height / 2]} stroke={LINE_RED} strokeWidth={3} />
          <Circle x={width * 0.3} y={height / 2} radius={3} fill={LINE_RED} />
          <Circle x={width * 0.7} y={height / 2} radius={3} fill={LINE_RED} />
        </>
      )}
    </Group>
  );
}

function FaceoffCircle({ x, y }: { x: number; y: number }) {
  return (
    <Group>
      <Circle x={x} y={y} radius={38} stroke={LINE_RED} strokeWidth={2} />
      <Circle x={x} y={y} radius={3} fill={LINE_RED} />
    </Group>
  );
}

function Crease({ x, y, flip }: { x: number; y: number; flip: boolean }) {
  const r = 30;
  return (
    <Line
      points={[x - r, y, x - r, y + (flip ? -r : r), x + r, y + (flip ? -r : r), x + r, y]}
      tension={0.6}
      closed={false}
      stroke="#93c5fd"
      fill="#dbeafe"
      strokeWidth={2}
    />
  );
}
