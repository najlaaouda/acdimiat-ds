/* =============================================================================
 * gradient.ts — parse, edit, and serialize CSS gradients.
 *
 * Handles linear / radial / conic (+ repeating) gradients with color stops in
 * hex / rgb(a) / hsl(a) / named / var() form. Pragmatic by design: it edits the
 * common cases (single-layer gradients, % stop positions, linear angle) and
 * preserves radial/conic geometry verbatim as `head`. Stop colors keep their
 * original form (so a `var(--token)` stop stays bound to the token).
 * ========================================================================== */

import { normalizeCssColor, parseAnyColor, rgbaToHex } from "./color";

export interface GradientStop {
  /** Original color form: `#hex`, `rgb(...)`, `var(--token)`, a name… */
  color: string;
  /** Position in %, or null for "auto" (browser-distributed). */
  pos: number | null;
}

export interface Gradient {
  type: "linear" | "radial" | "conic";
  repeating: boolean;
  /** Linear angle in degrees (also used as conic "from" angle display). */
  angle: number;
  /** Raw geometry prefix for radial/conic (e.g. "circle at center"); "" if none. */
  head: string;
  stops: GradientStop[];
  raw: string;
}

const round = (n: number): number => Math.round(n);

export function isGradient(value: string): boolean {
  return /(?:^|\s)(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/i.test(
    value || "",
  );
}

/** Split a CSS value list on top-level commas (respecting nested parens). */
function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Number of background layers in a (possibly multi-layer) value. */
export function layerCount(value: string): number {
  return splitTopLevel(value).length;
}

/** First gradient function in a multi-layer value, else null. */
export function firstGradient(value: string): string | null {
  for (const layer of splitTopLevel(value)) {
    if (isGradient(layer)) return layer.trim();
  }
  return null;
}

const GRAD_RE = /^(repeating-)?(linear|radial|conic)-gradient\s*\(([\s\S]*)\)$/i;

export function parseGradient(input: string): Gradient | null {
  const value = (input || "").trim();
  const m = value.match(GRAD_RE);
  if (!m) return null;
  const repeating = !!m[1];
  const type = m[2].toLowerCase() as Gradient["type"];
  const segs = splitTopLevel(m[3]);
  if (!segs.length) return null;

  let angle = type === "linear" ? 180 : 0;
  let head = "";
  let stopSegs = segs;

  // A leading non-color segment is the direction/geometry header.
  if (!parseStop(segs[0])) {
    stopSegs = segs.slice(1);
    if (type === "linear") angle = directionToAngle(segs[0]);
    else head = segs[0];
  }

  const stops = stopSegs
    .map(parseStop)
    .filter((s): s is GradientStop => s !== null);
  if (stops.length < 1) return null;

  return { type, repeating, angle, head, stops, raw: value };
}

function parseStop(seg: string): GradientStop | null {
  let s = (seg || "").trim();
  if (!s) return null;
  // Pull up to two trailing % positions (color hint syntax → keep the first).
  const positions: number[] = [];
  const pctRe = /\s+(-?[\d.]+)%\s*$/;
  let mm = s.match(pctRe);
  while (mm && positions.length < 2) {
    positions.unshift(parseFloat(mm[1]));
    s = s.slice(0, mm.index).trim();
    mm = s.match(pctRe);
  }
  // Drop a trailing non-% length so it doesn't pollute the color token.
  s = s.replace(/\s+-?[\d.]+(?:px|em|rem|vw|vh|vmin|vmax)\s*$/i, "").trim();
  if (!s) return null;
  // Must be a color: a var() reference or a literal/named color.
  if (!s.startsWith("var(") && !parseAnyColor(s)) return null;
  return { color: s, pos: positions.length ? positions[0] : null };
}

function directionToAngle(dir: string): number {
  const d = dir.trim().toLowerCase();
  const norm = (n: number) => ((n % 360) + 360) % 360;
  let m = d.match(/^(-?[\d.]+)deg$/);
  if (m) return norm(parseFloat(m[1]));
  m = d.match(/^(-?[\d.]+)turn$/);
  if (m) return norm(parseFloat(m[1]) * 360);
  m = d.match(/^(-?[\d.]+)rad$/);
  if (m) return norm((parseFloat(m[1]) * 180) / Math.PI);
  m = d.match(/^(-?[\d.]+)grad$/);
  if (m) return norm(parseFloat(m[1]) * 0.9);
  const map: Record<string, number> = {
    "to top": 0,
    "to right": 90,
    "to bottom": 180,
    "to left": 270,
    "to top right": 45,
    "to right top": 45,
    "to bottom right": 135,
    "to right bottom": 135,
    "to bottom left": 225,
    "to left bottom": 225,
    "to top left": 315,
    "to left top": 315,
  };
  return map[d] ?? 180;
}

export function serializeGradient(g: Gradient): string {
  const stops = g.stops
    .map((s) => (s.pos == null ? s.color : `${s.color} ${round(s.pos)}%`))
    .join(", ");
  const fn = `${g.repeating ? "repeating-" : ""}${g.type}-gradient`;
  if (g.type === "linear") return `${fn}(${round(g.angle)}deg, ${stops})`;
  const head = g.head ? `${g.head}, ` : "";
  return `${fn}(${head}${stops})`;
}

/** Resolve a stop color (incl. `var(--token)`) to a concrete #hex for display. */
export function resolveStopColor(color: string): string {
  const norm = normalizeCssColor(color);
  const rgba = parseAnyColor(norm ?? color);
  return rgba ? rgbaToHex(rgba) : color;
}

/** A horizontal preview strip (ignores angle/type) for the editor's stop bar. */
export function stripGradient(g: Gradient): string {
  const n = g.stops.length;
  const stops = g.stops
    .map((s, i) => {
      const pos = s.pos == null ? (n <= 1 ? 100 : (i / (n - 1)) * 100) : s.pos;
      return `${s.color} ${round(pos)}%`;
    })
    .join(", ");
  return `linear-gradient(90deg, ${stops})`;
}

/** Effective display position for a stop (fills in "auto" evenly). */
export function stopPosition(g: Gradient, i: number): number {
  const s = g.stops[i];
  if (s.pos != null) return s.pos;
  const n = g.stops.length;
  return n <= 1 ? 100 : (i / (n - 1)) * 100;
}
