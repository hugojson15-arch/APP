"use client";

import { useMemo, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import type Konva from "konva";
import RinkBackground from "./rink-background";
import { ArrowNode, ConeNode, PlayerNode, PuckNode, TextNode } from "./drill-shapes";
import {
  ARROW_STYLE_LABEL,
  FORMATION_PRESETS,
  RINK_SIZE,
  type ArrowStyle,
  type DrillData,
  type DrillShape,
  type RinkTemplate,
} from "@/lib/drill-types";
import { saveDrill, postDrillToChat } from "@/lib/actions/drills";
import type { Profile, Team } from "@/lib/database.types";

type Roster = Pick<Profile, "id" | "name" | "email" | "jersey_number">;
type Tool =
  | "select"
  | "player-us"
  | "player-opp"
  | "puck"
  | "cone"
  | "text"
  | `arrow-${ArrowStyle}`;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function DrillEditor({
  team,
  roster,
}: {
  team: Pick<Team, "name" | "primary_color" | "secondary_color">;
  roster: Roster[];
}) {
  const [rink, setRink] = useState<RinkTemplate>("half");
  const [shapes, setShapes] = useState<DrillShape[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rosterPick, setRosterPick] = useState(roster[0]?.id ?? "");
  const [title, setTitle] = useState("Ny övning");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const arrowStart = useRef<{ x: number; y: number } | null>(null);
  const oppCounter = useRef(1);

  const size = RINK_SIZE[rink];
  const selected = shapes.find((s) => s.id === selectedId) ?? null;

  function addShape(shape: DrillShape) {
    setShapes((prev) => [...prev, shape]);
    setSelectedId(shape.id);
  }

  function updateShape(id: string, patch: Partial<DrillShape>) {
    setShapes((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, ...patch } as DrillShape) : s)),
    );
  }

  function deleteSelected() {
    if (!selectedId) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }

  function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    if (tool.startsWith("arrow-")) {
      arrowStart.current = pos;
      return;
    }

    // Only place non-arrow shapes when clicking empty canvas (not another shape).
    if (e.target !== stage && tool !== "select") return;

    if (tool === "select") {
      if (e.target === stage) setSelectedId(null);
      return;
    }

    if (tool === "player-us") {
      const member = roster.find((m) => m.id === rosterPick);
      addShape({
        id: uid(),
        type: "player",
        x: pos.x,
        y: pos.y,
        team: "us",
        label: member?.jersey_number != null ? String(member.jersey_number) : "?",
      });
    } else if (tool === "player-opp") {
      addShape({
        id: uid(),
        type: "player",
        x: pos.x,
        y: pos.y,
        team: "opp",
        label: String(oppCounter.current++),
      });
    } else if (tool === "puck") {
      addShape({ id: uid(), type: "puck", x: pos.x, y: pos.y });
    } else if (tool === "cone") {
      addShape({ id: uid(), type: "cone", x: pos.x, y: pos.y });
    } else if (tool === "text") {
      addShape({ id: uid(), type: "text", x: pos.x, y: pos.y, text: "Text" });
    }
  }

  function handleStageMouseUp(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!tool.startsWith("arrow-") || !arrowStart.current) return;
    const stage = e.target.getStage();
    const end = stage?.getPointerPosition();
    const start = arrowStart.current;
    arrowStart.current = null;
    if (!end || !start) return;
    if (Math.hypot(end.x - start.x, end.y - start.y) < 8) return; // ignore accidental clicks

    addShape({
      id: uid(),
      type: "arrow",
      points: [start.x, start.y, end.x, end.y],
      style: tool.replace("arrow-", "") as ArrowStyle,
    });
  }

  function applyPreset(presetId: string) {
    const preset = FORMATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setRink("half");
    const next: DrillShape[] = [];
    preset.positions.forEach((pos, i) => {
      const member = roster[i];
      next.push({
        id: uid(),
        type: "player",
        x: pos.x,
        y: pos.y,
        team: "us",
        label: member?.jersey_number != null ? String(member.jersey_number) : String(i + 1),
      });
      next.push({ id: uid(), type: "text", x: pos.x - 30, y: pos.y + 22, text: pos.label });
    });
    setShapes(next);
    setSelectedId(null);
    setTitle(`Powerplay ${preset.name}`);
  }

  async function handleSave(andPost: boolean) {
    if (shapes.length === 0) return;
    setSaving("saving");
    setErrorMsg(null);
    try {
      const dataUrl = stageRef.current?.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
      if (!dataUrl) throw new Error("Kunde inte skapa bilden");
      const drillData: DrillData = { rink, shapes };

      const result = await saveDrill({
        title,
        drawingData: drillData,
        thumbnailDataUrl: dataUrl,
      });
      if (result.error || !result.id) {
        setSaving("error");
        setErrorMsg(result.error ?? "Kunde inte spara övningen");
        return;
      }

      if (andPost) {
        const postResult = await postDrillToChat(result.id);
        if (postResult.error) {
          setSaving("error");
          setErrorMsg(postResult.error);
          return;
        }
      }

      setSaving("saved");
    } catch {
      setSaving("error");
      setErrorMsg("Kunde inte spara övningen. Prova igen.");
    }
  }

  const toolButtons: { tool: Tool; label: string }[] = useMemo(
    () => [
      { tool: "select", label: "↖ Välj" },
      { tool: "player-us", label: "🧍 Spelare" },
      { tool: "player-opp", label: "🧍 Motstånd." },
      { tool: "puck", label: "⬤ Puck" },
      { tool: "cone", label: "▲ Kon" },
      { tool: "text", label: "🔤 Text" },
      { tool: "arrow-skate", label: "→ Skridsko" },
      { tool: "arrow-pass", label: "⇢ Passning" },
      { tool: "arrow-shot", label: "⇴ Skott" },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-lg font-bold outline-none focus:border-[var(--color-primary)]"
        />
        <div className="flex gap-2">
          <select
            value={rink}
            onChange={(e) => setRink(e.target.value as RinkTemplate)}
            className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-2 text-sm"
          >
            <option value="full">Hel bana</option>
            <option value="half">Halv bana</option>
            <option value="neutral">Neutral zon</option>
          </select>
          {FORMATION_PRESETS.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => e.target.value && applyPreset(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-2 text-sm"
            >
              <option value="">Snabbstart: powerplay…</option>
              {FORMATION_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {toolButtons.map((t) => (
          <button
            key={t.tool}
            onClick={() => setTool(t.tool)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
              tool === t.tool
                ? "btn-primary border-transparent"
                : "border-[var(--border)] text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
        {roster.length > 0 && (
          <select
            value={rosterPick}
            onChange={(e) => setRosterPick(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs"
          >
            {roster.map((m) => (
              <option key={m.id} value={m.id}>
                {m.jersey_number != null ? `#${m.jersey_number} ` : ""}
                {m.name || m.email}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setShapes([])}
          className="ml-auto rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/5"
        >
          Rensa allt
        </button>
      </div>

      <p className="mt-2 text-xs text-[var(--muted)]">
        {tool.startsWith("arrow-")
          ? `Dra på banan för att rita en ${ARROW_STYLE_LABEL[tool.replace("arrow-", "") as ArrowStyle].toLowerCase()}-pil.`
          : tool === "select"
            ? "Klicka på en figur för att välja den, dra för att flytta."
            : "Klicka på banan för att placera ut."}
      </p>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row">
        <div
          className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white p-2"
          style={{ maxWidth: size.width + 20 }}
        >
          <Stage
            ref={stageRef}
            width={size.width}
            height={size.height}
            onMouseDown={handleStageMouseDown}
            onMouseUp={handleStageMouseUp}
            onTouchStart={handleStageMouseDown}
            onTouchEnd={handleStageMouseUp}
          >
            <Layer>
              <RinkBackground rink={rink} width={size.width} height={size.height} />
              {shapes.map((s) => {
                // Shapes only get Konva's native drag while the "select" tool
                // is active - otherwise starting an arrow/placement click on
                // top of an existing shape would drag it instead.
                const draggable = tool === "select";
                if (s.type === "player")
                  return (
                    <PlayerNode
                      key={s.id}
                      shape={s}
                      teamPrimary={team.primary_color}
                      selected={s.id === selectedId}
                      draggable={draggable}
                      onSelect={() => setSelectedId(s.id)}
                      onDragEnd={(x, y) => updateShape(s.id, { x, y })}
                    />
                  );
                if (s.type === "puck")
                  return (
                    <PuckNode
                      key={s.id}
                      shape={s}
                      selected={s.id === selectedId}
                      draggable={draggable}
                      onSelect={() => setSelectedId(s.id)}
                      onDragEnd={(x, y) => updateShape(s.id, { x, y })}
                    />
                  );
                if (s.type === "cone")
                  return (
                    <ConeNode
                      key={s.id}
                      shape={s}
                      selected={s.id === selectedId}
                      draggable={draggable}
                      onSelect={() => setSelectedId(s.id)}
                      onDragEnd={(x, y) => updateShape(s.id, { x, y })}
                    />
                  );
                if (s.type === "text")
                  return (
                    <TextNode
                      key={s.id}
                      shape={s}
                      selected={s.id === selectedId}
                      draggable={draggable}
                      onSelect={() => setSelectedId(s.id)}
                      onDragEnd={(x, y) => updateShape(s.id, { x, y })}
                    />
                  );
                return (
                  <ArrowNode
                    key={s.id}
                    shape={s}
                    selected={s.id === selectedId}
                    onSelect={() => setSelectedId(s.id)}
                  />
                );
              })}
            </Layer>
          </Stage>
        </div>

        <div className="w-full space-y-3 lg:w-64">
          {selected && (
            <div className="rounded-xl border border-[var(--border)] p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-[var(--muted)]">Vald figur</p>
              {(selected.type === "player" || selected.type === "text") && (
                <input
                  value={selected.type === "player" ? selected.label : selected.text}
                  onChange={(e) =>
                    updateShape(
                      selected.id,
                      selected.type === "player" ? { label: e.target.value } : { text: e.target.value },
                    )
                  }
                  className="mb-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-2 py-1 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              )}
              <button
                onClick={deleteSelected}
                className="w-full rounded-lg border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
              >
                Ta bort
              </button>
            </div>
          )}

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          {saving === "saved" && <p className="text-sm text-emerald-600">Sparad och postad!</p>}

          <button
            onClick={() => handleSave(false)}
            disabled={saving === "saving" || shapes.length === 0}
            className="w-full rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
          >
            {saving === "saving" ? "Sparar…" : "Spara övning"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving === "saving" || shapes.length === 0}
            className="btn-primary w-full rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving === "saving" ? "Sparar…" : "Spara & posta i chatten"}
          </button>
        </div>
      </div>
    </div>
  );
}
