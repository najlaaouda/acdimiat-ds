"use client";

/* =============================================================================
 * GradientEditor — edit a CSS gradient on-system.
 *
 *   • Live preview of the real gradient (type + angle).
 *   • A horizontal stop bar with draggable handles; click the bar to add a stop.
 *   • Type switch (linear / radial / conic) + angle control (linear).
 *   • The selected stop's color is chosen from the DESIGN SYSTEM palette
 *     (binds the stop to `var(--token)`) or a custom freeform picker.
 *
 * Emits the serialized gradient on every change; the parent applies it live.
 * ========================================================================== */

import {
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ColorPicker } from "./ColorPicker";
import { TokenPalette } from "./TokenPalette";
import { IconClose } from "./icons";
import {
  parseGradient,
  serializeGradient,
  stripGradient,
  resolveStopColor,
  stopPosition,
  type Gradient,
} from "./gradient";
import type { TokenGroup } from "./tokens";

export interface GradientEditorProps {
  initial: string;
  paletteGroups: TokenGroup[];
  resolved: Map<string, string>;
  lookupToken: (color: string) => string | null;
  onChange: (css: string) => void;
  onApply: (css: string) => void;
  onCancel: () => void;
  onReset: () => void;
}

const TYPES: Gradient["type"][] = ["linear", "radial", "conic"];
const TYPE_LABEL: Record<Gradient["type"], string> = {
  linear: "خطي",
  radial: "دائري",
  conic: "مخروطي",
};
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const varRef = (color: string): string | null => {
  const m = color.match(/^var\(\s*(--[a-z0-9-]+)/i);
  return m ? m[1].replace(/^--/, "") : null;
};

const FALLBACK: Gradient = {
  type: "linear",
  repeating: false,
  angle: 180,
  head: "",
  stops: [
    { color: "#ffffff", pos: 0 },
    { color: "#000000", pos: 100 },
  ],
  raw: "",
};

export function GradientEditor({
  initial,
  paletteGroups,
  resolved,
  lookupToken,
  onChange,
  onApply,
  onCancel,
  onReset,
}: GradientEditorProps) {
  const [g, setG] = useState<Gradient>(() => parseGradient(initial) ?? FALLBACK);
  const [sel, setSel] = useState(0);
  const [mode, setMode] = useState<"system" | "custom">("system");

  const serialized = useMemo(() => serializeGradient(g), [g]);
  const strip = useMemo(() => stripGradient(g), [g]);
  const selStop = g.stops[Math.min(sel, g.stops.length - 1)];

  const update = (next: Gradient) => {
    setG(next);
    onChange(serializeGradient(next));
  };

  /** Convert every "auto" stop position to an explicit % (editor-friendly). */
  const materialized = (): Gradient => ({
    ...g,
    stops: g.stops.map((s, i) => ({ ...s, pos: stopPosition(g, i) })),
  });

  const setStopColor = (color: string) => {
    update({
      ...g,
      stops: g.stops.map((s, i) => (i === sel ? { ...s, color } : s)),
    });
  };
  const setStopPos = (i: number, pos: number) => {
    update({
      ...g,
      stops: g.stops.map((s, k) =>
        k === i ? { ...s, pos: clamp(Math.round(pos), 0, 100) } : s,
      ),
    });
  };
  const addStopAt = (pos: number) => {
    const base = materialized();
    const stop = { color: selStop?.color ?? "#888888", pos: clamp(Math.round(pos), 0, 100) };
    const stops = [...base.stops, stop].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));
    const idx = stops.indexOf(stop);
    setG({ ...base, stops });
    onChange(serializeGradient({ ...base, stops }));
    setSel(idx);
  };
  const removeStop = (i: number) => {
    if (g.stops.length <= 2) return;
    const stops = g.stops.filter((_, k) => k !== i);
    update({ ...g, stops });
    setSel((s) => clamp(s, 0, stops.length - 1));
  };

  /* ── Stop-bar dragging ────────────────────────────────────────────────── */
  const barPos = (e: { clientX: number }, el: HTMLElement): number => {
    const r = el.getBoundingClientRect();
    return clamp(((e.clientX - r.left) / r.width) * 100, 0, 100);
  };
  const onHandleDown =
    (i: number) => (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setSel(i);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
  const onHandleMove =
    (i: number) => (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (e.buttons !== 1) return;
      const bar = (e.currentTarget as HTMLElement).parentElement;
      if (bar) setStopPos(i, barPos(e, bar));
    };
  const onBarDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // ignore clicks on handles
    addStopAt(barPos(e, e.currentTarget));
  };

  const selHex = resolveStopColor(selStop?.color ?? "#000");
  const selVar = selStop ? varRef(selStop.color) ?? lookupToken(selHex) : null;

  return (
    <div className="gini-csi-grad" dir="rtl">
      <div
        className="gini-csi-grad__preview"
        style={{ background: serialized }}
        aria-label="معاينة التدرّج"
      />

      {/* Stop bar */}
      <div
        className="gini-csi-grad__bar"
        style={{ background: strip }}
        onPointerDown={onBarDown}
        dir="ltr"
      >
        {g.stops.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`gini-csi-grad__handle${i === sel ? " is-selected" : ""}`}
            style={
              {
                left: `${stopPosition(g, i)}%`,
                "--csi-stop": resolveStopColor(s.color),
              } as CSSProperties
            }
            onPointerDown={onHandleDown(i)}
            onPointerMove={onHandleMove(i)}
            aria-label={`نقطة ${i + 1}`}
          />
        ))}
      </div>

      {/* Type + angle */}
      <div className="gini-csi-grad__controls">
        <div className="gini-csi-seg gini-csi-seg--sm">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`gini-csi-seg__btn${g.type === t ? " is-active" : ""}`}
              onClick={() => update({ ...g, type: t })}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        {g.type === "linear" && (
          <div className="gini-csi-grad__angle" dir="ltr">
            <input
              type="range"
              min={0}
              max={360}
              value={Math.round(g.angle)}
              onChange={(e) => update({ ...g, angle: Number(e.target.value) })}
              aria-label="زاوية التدرّج"
            />
            <input
              type="number"
              min={0}
              max={360}
              value={Math.round(g.angle)}
              onChange={(e) =>
                update({ ...g, angle: clamp(Number(e.target.value) || 0, 0, 360) })
              }
            />
            <span>°</span>
          </div>
        )}
      </div>

      {/* Selected stop */}
      <div className="gini-csi-grad__stop">
        <div className="gini-csi-grad__stop-head">
          <span className="gini-csi-grad__stop-title">
            نقطة {sel + 1} / {g.stops.length}
          </span>
          <label className="gini-csi-grad__pos" dir="ltr">
            <input
              type="number"
              min={0}
              max={100}
              value={Math.round(stopPosition(g, sel))}
              onChange={(e) => setStopPos(sel, Number(e.target.value) || 0)}
            />
            <span>%</span>
          </label>
          <button
            type="button"
            className="gini-csi-iconbtn gini-csi-iconbtn--soft"
            onClick={() => removeStop(sel)}
            disabled={g.stops.length <= 2}
            aria-label="حذف النقطة"
            title="حذف النقطة"
          >
            <IconClose />
          </button>
        </div>

        <div className="gini-csi-seg gini-csi-seg--sm">
          <button
            type="button"
            className={`gini-csi-seg__btn${mode === "system" ? " is-active" : ""}`}
            onClick={() => setMode("system")}
          >
            من النظام
          </button>
          <button
            type="button"
            className={`gini-csi-seg__btn${mode === "custom" ? " is-active" : ""}`}
            onClick={() => setMode("custom")}
          >
            لون مخصص
          </button>
        </div>

        {mode === "system" ? (
          <TokenPalette
            groups={paletteGroups}
            resolved={resolved}
            selectedVar={selVar}
            onPick={(t) => setStopColor(`var(${t.varName})`)}
          />
        ) : (
          <ColorPicker
            key={sel}
            initial={selHex}
            label={`نقطة ${sel + 1}`}
            hideActions
            onChange={(hex) => setStopColor(hex)}
          />
        )}
      </div>

      {/* Actions */}
      <div className="gini-csi-picker__actions">
        <button
          type="button"
          className="gini-csi-btn gini-csi-btn--primary"
          onClick={() => onApply(serialized)}
        >
          تطبيق
        </button>
        <button
          type="button"
          className="gini-csi-btn gini-csi-btn--ghost"
          onClick={onCancel}
        >
          إلغاء
        </button>
        <button
          type="button"
          className="gini-csi-btn gini-csi-btn--ghost"
          onClick={() => {
            const reseed = parseGradient(initial) ?? FALLBACK;
            setG(reseed);
            setSel(0);
            onReset();
          }}
        >
          استرجاع
        </button>
      </div>
    </div>
  );
}

export default GradientEditor;
