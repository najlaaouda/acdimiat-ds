/* =============================================================================
 * color.ts — dependency-free color math + parsing.
 *
 * The single source of truth for every color conversion the Color System
 * Inspector needs. Kept pure (no DOM) except for `normalizeCssColor`, which is
 * a clearly-marked browser helper used to resolve named / color-mix() strings.
 *
 * Ranges: r,g,b ∈ [0,255]   a ∈ [0,1]   h ∈ [0,360)   s,v,l ∈ [0,100]
 * ========================================================================== */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}
export interface HSVA {
  h: number;
  s: number;
  v: number;
  a: number;
}
export interface HSLA {
  h: number;
  s: number;
  l: number;
  a: number;
}

const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

const round = (n: number): number => Math.round(n);

/* ── Parsing ───────────────────────────────────────────────────────────── */

function parseHex(input: string): RGBA | null {
  let h = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(h)) return null;
  if (h.length === 3 || h.length === 4) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 && h.length !== 8) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function splitFn(input: string, prefix: string): string[] | null {
  const m = input.trim().match(new RegExp(`^${prefix}a?\\(([^)]+)\\)$`, "i"));
  if (!m) return null;
  // Supports both legacy comma syntax and modern space + "/ alpha" syntax.
  return m[1].split(/[,/\s]+/).filter(Boolean);
}

function parseRgb(input: string): RGBA | null {
  const parts = splitFn(input, "rgb");
  if (!parts || parts.length < 3) return null;
  const ch = (p: string): number =>
    p.endsWith("%") ? (parseFloat(p) / 100) * 255 : parseFloat(p);
  const al = (p: string): number =>
    p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p);
  return {
    r: clamp(round(ch(parts[0])), 0, 255),
    g: clamp(round(ch(parts[1])), 0, 255),
    b: clamp(round(ch(parts[2])), 0, 255),
    a: parts[3] != null ? clamp(al(parts[3]), 0, 1) : 1,
  };
}

function parseHslStr(input: string): RGBA | null {
  const parts = splitFn(input, "hsl");
  if (!parts || parts.length < 3) return null;
  const al = (p: string): number =>
    p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p);
  return hslaToRgba({
    h: parseFloat(parts[0]),
    s: parseFloat(parts[1]),
    l: parseFloat(parts[2]),
    a: parts[3] != null ? clamp(al(parts[3]), 0, 1) : 1,
  });
}

/** Parse a hex / rgb() / rgba() / hsl() / hsla() string. Returns null if it
 *  isn't one of those literal forms (use `normalizeCssColor` for named/mix). */
export function parseColor(input: string | null | undefined): RGBA | null {
  if (!input) return null;
  const s = input.trim();
  return parseHex(s) ?? parseRgb(s) ?? parseHslStr(s);
}

/* ── Conversions ───────────────────────────────────────────────────────── */

export function rgbToHsv({ r, g, b, a }: RGBA): HSVA {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s: s * 100, v: max * 100, a };
}

export function hsvToRgb({ h, s, v, a }: HSVA): RGBA {
  const ss = s / 100;
  const vv = v / 100;
  const c = vv * ss;
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let rr = 0;
  let gg = 0;
  let bb = 0;
  if (hh >= 0 && hh < 1) [rr, gg, bb] = [c, x, 0];
  else if (hh < 2) [rr, gg, bb] = [x, c, 0];
  else if (hh < 3) [rr, gg, bb] = [0, c, x];
  else if (hh < 4) [rr, gg, bb] = [0, x, c];
  else if (hh < 5) [rr, gg, bb] = [x, 0, c];
  else [rr, gg, bb] = [c, 0, x];
  const m = vv - c;
  return {
    r: round((rr + m) * 255),
    g: round((gg + m) * 255),
    b: round((bb + m) * 255),
    a,
  };
}

export function rgbToHsl({ r, g, b, a }: RGBA): HSLA {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100, a };
}

export function hslaToRgba({ h, s, l, a }: HSLA): RGBA {
  const ss = clamp(s, 0, 100) / 100;
  const ll = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let rr = 0;
  let gg = 0;
  let bb = 0;
  if (hh >= 0 && hh < 1) [rr, gg, bb] = [c, x, 0];
  else if (hh < 2) [rr, gg, bb] = [x, c, 0];
  else if (hh < 3) [rr, gg, bb] = [0, c, x];
  else if (hh < 4) [rr, gg, bb] = [0, x, c];
  else if (hh < 5) [rr, gg, bb] = [x, 0, c];
  else [rr, gg, bb] = [c, 0, x];
  const m = ll - c / 2;
  return {
    r: round((rr + m) * 255),
    g: round((gg + m) * 255),
    b: round((bb + m) * 255),
    a,
  };
}

/* ── Formatting ────────────────────────────────────────────────────────── */

const hex2 = (n: number): string =>
  clamp(round(n), 0, 255).toString(16).padStart(2, "0");

/** "#RRGGBB", or "#RRGGBBAA" when alpha < 1 (or when `forceAlpha`). */
export function rgbaToHex(
  { r, g, b, a }: RGBA,
  forceAlpha = false,
): string {
  const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  if (forceAlpha || a < 1) return `${base}${hex2(a * 255)}`;
  return base.toUpperCase();
}

export function formatRgb({ r, g, b, a }: RGBA): string {
  const R = clamp(round(r), 0, 255);
  const G = clamp(round(g), 0, 255);
  const B = clamp(round(b), 0, 255);
  return a < 1
    ? `rgba(${R}, ${G}, ${B}, ${round(a * 100) / 100})`
    : `rgb(${R}, ${G}, ${B})`;
}

export function formatHsl(rgba: RGBA): string {
  const { h, s, l, a } = rgbToHsl(rgba);
  const H = round(h);
  const S = round(s);
  const L = round(l);
  return a < 1
    ? `hsla(${H}, ${S}%, ${L}%, ${round(a * 100) / 100})`
    : `hsl(${H}, ${S}%, ${L}%)`;
}

/** Display-ready hex for any resolved color string (keeps alpha if present). */
export function toHex(input: string): string {
  const rgba = parseColor(input);
  return rgba ? rgbaToHex(rgba) : input;
}

/** Relative luminance (WCAG) — used to pick a readable label color on a swatch. */
export function luminance({ r, g, b }: RGBA): number {
  const ch = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** Best foreground (#000 / #fff) for text drawn on top of `bg`. */
export function readableInk(bg: string): string {
  const rgba = parseColor(bg);
  if (!rgba) return "#1d1d1d";
  return luminance(rgba) > 0.5 ? "#1d1d1d" : "#ffffff";
}

/* ── DOM helper (browser only) ─────────────────────────────────────────── */

/**
 * Resolve ANY CSS color string (named colors, `color-mix()`, system colors…)
 * to a concrete `rgb()/rgba()` string via a throwaway element. Returns null
 * for invalid input or in non-browser contexts. Used as a last-resort fallback
 * when `parseColor` can't read a literal form.
 */
export function normalizeCssColor(input: string): string | null {
  if (typeof document === "undefined" || !input) return null;
  const probe = document.createElement("span");
  probe.style.display = "none";
  probe.style.color = "";
  probe.style.color = input;
  if (probe.style.color === "") return null; // browser rejected it
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved || null;
}

/** Parse with a DOM fallback for non-literal forms (named, color-mix, …). */
export function parseAnyColor(input: string | null | undefined): RGBA | null {
  if (!input) return null;
  const direct = parseColor(input);
  if (direct) return direct;
  const normalized = normalizeCssColor(input);
  return normalized ? parseColor(normalized) : null;
}
