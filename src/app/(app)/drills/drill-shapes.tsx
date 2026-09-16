"use client";

import { Arrow, Circle, Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { ArrowShape, ConeShape, PlayerShape, PuckShape, TextShape } from "@/lib/drill-types";

const OPP_COLOR = "#475569";
const ARROW_STYLE: Record<ArrowShape["style"], { stroke: string; dash?: number[] }> = {
  skate: { stroke: "#0f172a" },
  pass: { stroke: "#0f172a", dash: [12, 8] },
  shot: { stroke: "#c0202f", dash: [2, 6] },
};

type DragEnd = (x: number, y: number) => void;

export function PlayerNode({
  shape,
  teamPrimary,
  selected,
  draggable,
  onSelect,
  onDragEnd,
}: {
  shape: PlayerShape;
  teamPrimary: string;
  selected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onDragEnd: DragEnd;
}) {
  const fill = shape.team === "us" ? teamPrimary : OPP_COLOR;
  return (
    <Group
      x={shape.x}
      y={shape.y}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(e.target.x(), e.target.y())}
    >
      <Circle radius={18} fill={fill} stroke={selected ? "#f5c518" : "#ffffff"} strokeWidth={selected ? 3 : 2} />
      <Text
        text={shape.label}
        fontSize={12}
        fontStyle="bold"
        fill="#ffffff"
        width={36}
        align="center"
        offsetX={18}
        offsetY={6}
      />
    </Group>
  );
}

export function PuckNode({
  shape,
  selected,
  draggable,
  onSelect,
  onDragEnd,
}: {
  shape: PuckShape;
  selected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onDragEnd: DragEnd;
}) {
  return (
    <Circle
      x={shape.x}
      y={shape.y}
      radius={7}
      fill="#0f172a"
      stroke={selected ? "#f5c518" : undefined}
      strokeWidth={2}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(e.target.x(), e.target.y())}
    />
  );
}

export function ConeNode({
  shape,
  selected,
  draggable,
  onSelect,
  onDragEnd,
}: {
  shape: ConeShape;
  selected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onDragEnd: DragEnd;
}) {
  return (
    <Rect
      x={shape.x - 8}
      y={shape.y - 8}
      width={16}
      height={16}
      rotation={45}
      fill="#f97316"
      stroke={selected ? "#f5c518" : "#ffffff"}
      strokeWidth={selected ? 3 : 1}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) =>
        onDragEnd(e.target.x() + 8, e.target.y() + 8)
      }
    />
  );
}

export function TextNode({
  shape,
  selected,
  draggable,
  onSelect,
  onDragEnd,
}: {
  shape: TextShape;
  selected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onDragEnd: DragEnd;
}) {
  return (
    <Text
      x={shape.x}
      y={shape.y}
      text={shape.text}
      fontSize={16}
      fontStyle="bold"
      fill="#0f172a"
      padding={4}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      shadowColor={selected ? "#f5c518" : undefined}
      shadowBlur={selected ? 8 : 0}
      shadowOpacity={1}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(e.target.x(), e.target.y())}
    />
  );
}

export function ArrowNode({
  shape,
  selected,
  onSelect,
}: {
  shape: ArrowShape;
  selected: boolean;
  onSelect: () => void;
}) {
  const style = ARROW_STYLE[shape.style];
  return (
    <Arrow
      points={shape.points}
      stroke={style.stroke}
      fill={style.stroke}
      strokeWidth={selected ? 4 : 3}
      dash={style.dash}
      pointerLength={10}
      pointerWidth={10}
      hitStrokeWidth={16}
      onClick={onSelect}
      onTap={onSelect}
      shadowColor={selected ? "#f5c518" : undefined}
      shadowBlur={selected ? 6 : 0}
      shadowOpacity={1}
    />
  );
}
