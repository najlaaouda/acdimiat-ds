/* =============================================================================
 * inspect.ts — pull the colors an element actually paints with.
 *
 * Reads computed styles and returns a tidy, de-duplicated list: background,
 * text, border, box-shadow, outline, and (for SVG) fill / stroke. Fully
 * transparent / `none` values are dropped so the panel only shows real ink.
 * ========================================================================== */

import { parseColor, toHex } from "./color";
import { firstGradient, layerCount } from "./gradient";

export interface DetectedColor {
  /** CSS property we'd mutate to change it, e.g. "background-color". */
  property: string;
  /** Arabic label for the panel. */
  label: string;
  /** Resolved color string from getComputedStyle (rgb/rgba) — or a gradient. */
  value: string;
  /** Display hex (empty for gradients). */
  hex: string;
  /** True when `value` is a CSS gradient rather than a single color. */
  isGradient?: boolean;
}

function isPaintable(color: string): boolean {
  const rgba = parseColor(color);
  return !!rgba && rgba.a > 0.001;
}

/** Extract the rgba(...) / rgb(...) chunk from a computed box-shadow string. */
function shadowColor(boxShadow: string): string | null {
  if (!boxShadow || boxShadow === "none") return null;
  const m = boxShadow.match(/rgba?\([^)]+\)/);
  return m ? m[0] : null;
}

function hasBorder(cs: CSSStyleDeclaration): boolean {
  const sides = [
    cs.borderTopWidth,
    cs.borderRightWidth,
    cs.borderBottomWidth,
    cs.borderLeftWidth,
  ];
  return sides.some((w) => parseFloat(w) > 0) && cs.borderStyle !== "none";
}

export function extractColors(el: Element): DetectedColor[] {
  const cs = getComputedStyle(el);
  const out: DetectedColor[] = [];
  const add = (property: string, label: string, value: string | null) => {
    if (!value || !isPaintable(value)) return;
    out.push({ property, label, value, hex: toHex(value) });
  };

  add("background-color", "الخلفية", cs.backgroundColor);

  // Gradient background (background-image). Only single-layer gradients are
  // editable; multi-layer stacks are shown but flagged non-editable upstream.
  const bgImage = cs.backgroundImage;
  if (bgImage && bgImage !== "none") {
    const grad = firstGradient(bgImage);
    if (grad) {
      out.push({
        property: "background-image",
        label: layerCount(bgImage) > 1 ? "تدرّج (متعدد الطبقات)" : "تدرّج",
        value: grad,
        hex: "",
        isGradient: true,
      });
    }
  }

  add("color", "النص", cs.color);
  if (hasBorder(cs)) add("border-color", "الحدود", cs.borderTopColor);
  add("box-shadow", "الظل", shadowColor(cs.boxShadow));
  if (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) {
    add("outline-color", "الإطار الخارجي", cs.outlineColor);
  }
  if (el instanceof SVGElement) {
    add("fill", "التعبئة (SVG)", cs.fill);
    add("stroke", "الحد (SVG)", cs.stroke);
  }

  // De-dupe by property (keep first) — computed border returns 4 identical sides.
  const seen = new Set<string>();
  return out.filter((c) => {
    const key = `${c.property}:${c.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ── Copy / paste style ("format painter") ──────────────────────────────────
 * Snapshot an element's paint-level visual style so it can be applied verbatim
 * to another element. Captures only set/non-default visual props. */
export interface CopiedStyle {
  /** CSS property → value, applied directly with el.style.setProperty(). */
  props: Record<string, string>;
  /** Source element label (tag.class) for the panel. */
  label: string;
  /** A representative color for the preview swatch. */
  swatch: string;
}

export function captureStyle(el: Element): CopiedStyle {
  const cs = getComputedStyle(el);
  const props: Record<string, string> = {};
  const set = (k: string, v: string | null | undefined) => {
    if (v) props[k] = v;
  };

  if (isPaintable(cs.backgroundColor)) set("background-color", cs.backgroundColor);
  if (cs.backgroundImage && cs.backgroundImage !== "none") {
    set("background-image", cs.backgroundImage);
  }
  set("color", cs.color);
  if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") {
    set("border-width", cs.borderTopWidth);
    set("border-style", cs.borderTopStyle);
    set("border-color", cs.borderTopColor);
  }
  if (cs.borderRadius && cs.borderRadius !== "0px") set("border-radius", cs.borderRadius);
  if (cs.boxShadow && cs.boxShadow !== "none") set("box-shadow", cs.boxShadow);
  if (el instanceof SVGElement) {
    if (isPaintable(cs.fill)) set("fill", cs.fill);
    if (isPaintable(cs.stroke)) set("stroke", cs.stroke);
  }

  const swatch =
    props["background-color"] ||
    props["border-color"] ||
    props["fill"] ||
    props["color"] ||
    "#cccccc";
  return { props, label: describeElement(el), swatch };
}

/** Is this node part of the inspector's own UI (so we never list it)? */
function isOwnUi(el: Element | null): boolean {
  return !!el && !!el.closest("[data-gini-csi]");
}

/**
 * A 3-layer slice of the DOM around `el` for the Figma-style layers navigator:
 * the parent (one up), the element itself, and its direct element children
 * (one down). Lets the user pick the exact element when a click lands on the
 * wrong nesting level. Children are capped so deep lists stay manageable.
 */
export interface LayerContext {
  parent: Element | null;
  self: Element;
  children: Element[];
  /** Total direct children before the cap (for a "+N" hint). */
  childTotal: number;
}

const CHILD_CAP = 14;

export function getLayerContext(el: Element): LayerContext {
  let parent: Element | null = el.parentElement;
  if (
    parent &&
    (isOwnUi(parent) || parent === document.body || parent === document.documentElement)
  ) {
    parent = null;
  }
  const allKids = Array.from(el.children).filter(
    (c) =>
      !isOwnUi(c) &&
      !(c instanceof HTMLStyleElement) &&
      !(c instanceof HTMLScriptElement) &&
      c.tagName !== "LINK",
  );
  return {
    parent,
    self: el,
    children: allKids.slice(0, CHILD_CAP),
    childTotal: allKids.length,
  };
}

/** A short, human label for an inspected element (tag + class hint). */
export function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const cls =
    typeof el.className === "string" && el.className.trim()
      ? `.${el.className.trim().split(/\s+/)[0]}`
      : "";
  return `${tag}${cls}`;
}

/** A fuller CSS selector (tag + up to 3 classes) for copy-as-code output. */
export function cssSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (typeof el.className === "string" && el.className.trim()) {
    const cls = el.className
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((c) => `.${c}`)
      .join("");
    return `${tag}${cls}`;
  }
  return tag;
}
