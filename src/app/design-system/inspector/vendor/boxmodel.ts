/* =============================================================================
 * boxmodel.ts — read an element's spacing + alignment (Figma auto-layout style).
 *
 * Reads computed padding / margin (per side, px), gap, the used content size,
 * overflow (clip), text-align, and the flex alignment. The panel maps a 3×3
 * alignment grid to justify-content × align-items (direction-aware), like
 * Figma's auto-layout alignment picker. Edits are applied to el.style directly,
 * so changes are live and appear in the element's CSS export.
 * ========================================================================== */

export interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Corners {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

export interface BoxModel {
  padding: Sides;
  margin: Sides;
  /** Border-radius per corner (px). */
  radius: Corners;
  width: number;
  height: number;
  display: string;
  direction: string;
  textAlign: string;
  isFlex: boolean;
  flexDirection: string;
  justifyContent: string;
  alignItems: string;
  /** flex/grid gap in px. */
  gap: number;
  /** True when overflow clips (hidden/clip on either axis). */
  clip: boolean;
}

const px = (v: string): number => Math.round(parseFloat(v) || 0);

export function extractBoxModel(el: Element): BoxModel {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    padding: {
      top: px(cs.paddingTop),
      right: px(cs.paddingRight),
      bottom: px(cs.paddingBottom),
      left: px(cs.paddingLeft),
    },
    margin: {
      top: px(cs.marginTop),
      right: px(cs.marginRight),
      bottom: px(cs.marginBottom),
      left: px(cs.marginLeft),
    },
    radius: {
      tl: px(cs.borderTopLeftRadius),
      tr: px(cs.borderTopRightRadius),
      br: px(cs.borderBottomRightRadius),
      bl: px(cs.borderBottomLeftRadius),
    },
    width: Math.round(r.width),
    height: Math.round(r.height),
    display: cs.display,
    direction: cs.direction,
    textAlign: cs.textAlign,
    isFlex: cs.display.includes("flex"),
    flexDirection: cs.flexDirection,
    justifyContent: cs.justifyContent,
    alignItems: cs.alignItems,
    gap: px(cs.rowGap === "normal" ? "0" : cs.rowGap),
    clip:
      cs.overflowX === "hidden" ||
      cs.overflowY === "hidden" ||
      cs.overflow.includes("hidden") ||
      cs.overflow.includes("clip"),
  };
}

/* ── 3×3 alignment grid ↔ flex CSS (direction-aware) ─────────────────────── */

const TRIPLE = ["flex-start", "center", "flex-end"] as const;

/** Map a computed justify/align value to a 0/1/2 index (or null = not a point). */
function axisIdx(v: string): number | null {
  if (!v) return null;
  if (v.includes("center")) return 1;
  if (v === "flex-end" || v === "end" || v === "right") return 2;
  if (
    v === "flex-start" ||
    v === "start" ||
    v === "left" ||
    v === "normal" ||
    v === "stretch" ||
    v === "baseline"
  ) {
    return 0;
  }
  return null; // space-between / space-around …
}

/** Current grid cell { col, row } (visual), or nulls when not a clean point. */
export function alignToGrid(bm: BoxModel): { col: number | null; row: number | null } {
  const rowDir = bm.flexDirection.startsWith("row");
  const rtl = bm.direction === "rtl";
  let col = axisIdx(rowDir ? bm.justifyContent : bm.alignItems);
  const row = axisIdx(rowDir ? bm.alignItems : bm.justifyContent);
  if (rowDir && rtl && col !== null) col = 2 - col; // visual column for RTL row
  return { col, row };
}

/** Visual grid cell → the CSS declarations to apply. */
export function gridToCss(
  col: number,
  row: number,
  bm: BoxModel,
): { prop: string; value: string }[] {
  const rowDir = bm.flexDirection.startsWith("row");
  const rtl = bm.direction === "rtl";
  let c = col;
  if (rowDir && rtl) c = 2 - c; // invert visual → logical for RTL row
  const hProp = rowDir ? "justify-content" : "align-items";
  const vProp = rowDir ? "align-items" : "justify-content";
  return [
    { prop: hProp, value: TRIPLE[c] },
    { prop: vProp, value: TRIPLE[row] },
  ];
}

/** Which text-align button is active (normalizing logical start/end). */
export function textAlignActive(
  textAlign: string,
  isRtl: boolean,
): "right" | "center" | "left" | "justify" | null {
  switch (textAlign) {
    case "center":
      return "center";
    case "justify":
      return "justify";
    case "right":
      return "right";
    case "left":
      return "left";
    case "start":
      return isRtl ? "right" : "left";
    case "end":
      return isRtl ? "left" : "right";
    default:
      return null;
  }
}
