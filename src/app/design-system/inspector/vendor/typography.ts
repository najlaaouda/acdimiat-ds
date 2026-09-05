/* =============================================================================
 * typography.ts — read & classify the LIVE type system from the DOM.
 *
 * Mirrors tokens.ts but for fonts. Two sources, both read live (never hardcoded):
 *   • Type scale — every `.t-{category}-{size}-{weight}` utility class shipped by
 *     the app. We discover the class names from the stylesheets, then PROBE each
 *     with a hidden element and read its computed font-size / weight / line-height
 *     (robust against responsive @media rules — we read the active breakpoint).
 *   • Font-family tokens — every `--font*` custom property on :root.
 *
 * `extractTypography(el)` reads what an element actually paints with and tries to
 * map it back to a type style (so Inspect can say "this is Body / Large / Medium").
 * ========================================================================== */

export interface TypeStyle {
  /** Class without the dot, e.g. "t-body-lg-medium". */
  className: string;
  /** Display group: Display | Header | Subheading | Body | Other. */
  group: string;
  /** Row label within the group, e.g. "Large · Medium". */
  label: string;
  /** Computed metrics at the current breakpoint. */
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  fontFamily: string;
  /** numeric px size, for sorting. */
  px: number;
}

export interface TypeStyleGroup {
  group: string;
  styles: TypeStyle[];
}

export interface FontFamilyToken {
  /** Name without the leading `--`, e.g. "font-primary". */
  name: string;
  varName: string;
  /** Resolved family stack. */
  stack: string;
  /** First family in the stack (display). */
  primary: string;
}

export interface TypographySnapshot {
  styles: TypeStyleGroup[];
  fonts: FontFamilyToken[];
  /** flat catalog, for reverse matching. */
  all: TypeStyle[];
}

export interface DetectedType {
  fontFamily: string;
  primaryFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  /** Matched type-style class, if the element's metrics map to one. */
  matchedClass: string | null;
}

const GROUP_ORDER = ["Display", "Header", "Subheading", "Body", "Other"];
const CAT_LABEL: Record<string, string> = {
  display: "Display",
  header: "Header",
  subheading: "Subheading",
  body: "Body",
};
const SIZE_LABEL: Record<string, string> = {
  xl: "XLarge",
  lg: "Large",
  md: "Medium",
  sm: "Small",
  xs: "XSmall",
};
const WEIGHT_LABEL: Record<string, string> = {
  regular: "Regular",
  medium: "Medium",
  bold: "Bold",
  light: "Light",
  semibold: "Semibold",
};

/* ── Stylesheet walking ──────────────────────────────────────────────────── */

function walkRules(rules: CSSRuleList, fn: (r: CSSRule) => void): void {
  for (const rule of Array.from(rules)) {
    fn(rule);
    const nested = (rule as CSSGroupingRule).cssRules;
    if (nested) walkRules(nested, fn);
  }
}

function eachStyleRule(fn: (r: CSSStyleRule) => void): void {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin
    }
    if (!rules) continue;
    walkRules(rules, (r) => {
      if (typeof CSSStyleRule !== "undefined" && r instanceof CSSStyleRule) fn(r);
    });
  }
}

/** Collect every `.t-…` utility class name appearing in any selector. */
function collectTypeClasses(): string[] {
  const set = new Set<string>();
  const re = /\.(t-[a-z0-9]+(?:-[a-z0-9]+)*)/g;
  eachStyleRule((r) => {
    const sel = r.selectorText || "";
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(sel))) set.add(m[1]);
  });
  return [...set];
}

/** Probe a class for its computed font metrics in the live document. */
function probe(className: string): {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  fontFamily: string;
} {
  const el = document.createElement("span");
  el.className = className;
  el.textContent = "Ag";
  el.style.cssText =
    "position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:nowrap;";
  document.body.appendChild(el);
  const cs = getComputedStyle(el);
  const out = {
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    fontFamily: cs.fontFamily,
  };
  el.remove();
  return out;
}

/* ── Public API ──────────────────────────────────────────────────────────── */

export function readTypography(): TypographySnapshot {
  const all: TypeStyle[] = [];
  for (const className of collectTypeClasses()) {
    const parts = className.split("-"); // t, category, size, weight
    if (parts.length < 4) continue;
    const [, category, size, weight] = parts;
    const m = probe(className);
    const px = parseFloat(m.fontSize) || 0;
    all.push({
      className,
      group: CAT_LABEL[category] ?? "Other",
      label: `${SIZE_LABEL[size] ?? size} · ${WEIGHT_LABEL[weight] ?? weight}`,
      fontSize: m.fontSize,
      fontWeight: m.fontWeight,
      lineHeight: m.lineHeight,
      fontFamily: m.fontFamily,
      px,
    });
  }

  // Group + order: groups by GROUP_ORDER, styles by size desc then weight.
  const buckets = new Map<string, TypeStyle[]>();
  for (const s of all) {
    const list = buckets.get(s.group) ?? [];
    list.push(s);
    buckets.set(s.group, list);
  }
  const styles: TypeStyleGroup[] = [];
  const seen = new Set<string>();
  const push = (g: string) => {
    const list = buckets.get(g);
    if (!list || seen.has(g)) return;
    seen.add(g);
    list.sort(
      (a, b) => b.px - a.px || a.fontWeight.localeCompare(b.fontWeight),
    );
    styles.push({ group: g, styles: list });
  };
  for (const g of GROUP_ORDER) push(g);
  for (const g of [...buckets.keys()].sort()) push(g);

  return { styles, fonts: readFontTokens(), all };
}

function readFontTokens(): FontFamilyToken[] {
  const found = new Map<string, string>();
  eachStyleRule((r) => {
    const sel = r.selectorText || "";
    if (!(/(^|,)\s*(:root|html)\b/.test(sel) || sel.includes(":root"))) return;
    const st = r.style;
    for (let i = 0; i < st.length; i++) {
      const p = st[i];
      if (p.startsWith("--font")) found.set(p, st.getPropertyValue(p).trim());
    }
  });
  const cs = getComputedStyle(document.documentElement);
  return [...found.keys()].sort().map((varName) => {
    const stack = (cs.getPropertyValue(varName).trim() || found.get(varName) || "").trim();
    return {
      name: varName.replace(/^--/, ""),
      varName,
      stack,
      primary: firstFamily(stack),
    };
  });
}

function firstFamily(stack: string): string {
  const first = stack.split(",")[0] ?? stack;
  return first.replace(/['"]/g, "").trim();
}

/** Read what an element actually paints with + try to map it to a type style. */
export function extractTypography(el: Element, catalog?: TypeStyle[]): DetectedType {
  const cs = getComputedStyle(el);
  const fontFamily = cs.fontFamily;
  const matchedClass = matchTypeStyle(
    cs.fontSize,
    cs.fontWeight,
    cs.lineHeight,
    catalog,
  );
  return {
    fontFamily,
    primaryFamily: firstFamily(fontFamily),
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    matchedClass,
  };
}

function matchTypeStyle(
  fontSize: string,
  fontWeight: string,
  lineHeight: string,
  catalog?: TypeStyle[],
): string | null {
  const list = catalog ?? readTypography().all;
  const targetPx = parseFloat(fontSize);
  // Exact size + weight first; line-height breaks ties.
  let best: TypeStyle | null = null;
  let bestDelta = Infinity;
  for (const s of list) {
    if (s.fontWeight !== fontWeight) continue;
    if (Math.abs(s.px - targetPx) > 0.5) continue;
    const lhDelta = Math.abs((parseFloat(s.lineHeight) || 0) - (parseFloat(lineHeight) || 0));
    if (lhDelta < bestDelta) {
      best = s;
      bestDelta = lhDelta;
    }
  }
  return best?.className ?? null;
}

/** The inline CSS props that reproduce a type style (for element editing). */
export function typeStyleProps(s: TypeStyle): Record<string, string> {
  return {
    "font-size": s.fontSize,
    "font-weight": s.fontWeight,
    "line-height": s.lineHeight,
  };
}

/** A friendly line-height display: the unitless ratio when computable. */
export function lineHeightRatio(lineHeight: string, px: number): string {
  if (!lineHeight || lineHeight === "normal") return "تلقائي";
  const lh = parseFloat(lineHeight);
  if (!lh) return lineHeight;
  if (/px$/.test(lineHeight) && px) {
    const ratio = lh / px;
    return ratio.toFixed(2).replace(/\.?0+$/, "");
  }
  return lineHeight; // already unitless
}

/* ── Export ──────────────────────────────────────────────────────────────── */

export interface TypographyExport {
  meta: { name: string; exportedAt: string; version: string; changeCount: number };
  fonts: Record<string, string>;
  scale: Record<
    string,
    Record<string, { label: string; fontSize: string; fontWeight: string; lineHeight: string }>
  >;
  changes: Array<{
    className: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
  }>;
}

export interface TypeOverrideLike {
  className: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
}

/** Serialize the type system (font families + scale) + any edits. */
export function buildTypographyExport(
  snapshot: TypographySnapshot | null,
  overrides: Iterable<TypeOverrideLike>,
  exportedAt: string,
): TypographyExport {
  const fonts: TypographyExport["fonts"] = {};
  const scale: TypographyExport["scale"] = {};
  if (snapshot) {
    for (const f of snapshot.fonts) fonts[f.varName] = f.stack;
    for (const g of snapshot.styles) {
      scale[g.group] = {};
      for (const s of g.styles) {
        scale[g.group][s.className] = {
          label: s.label,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
        };
      }
    }
  }
  const changes = [...overrides].map((o) => ({
    className: o.className,
    ...(o.fontSize ? { fontSize: o.fontSize } : {}),
    ...(o.fontWeight ? { fontWeight: o.fontWeight } : {}),
    ...(o.lineHeight ? { lineHeight: o.lineHeight } : {}),
  }));
  return {
    meta: { name: "Gini Typography", exportedAt, version: "1.0.0", changeCount: changes.length },
    fonts,
    scale,
    changes,
  };
}
