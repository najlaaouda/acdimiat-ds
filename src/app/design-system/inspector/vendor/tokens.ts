/* =============================================================================
 * tokens.ts — read & classify the LIVE Gini color system from the DOM.
 *
 * Rather than hard-coding the spec's idealized token names (bg-brand,
 * content-primary…), we read whatever `--*` custom properties the app actually
 * ships (globals.css + any imported Bit theme), so the Inspector always mirrors
 * the real, evolving system and keeps working as it grows.
 *
 * For every custom property we capture two things:
 *   • rawValue — the *declared* value for the active theme, e.g. `var(--bg-cta)`
 *                or `#737373`. Read from the stylesheet rules (getComputedStyle
 *                only ever returns the resolved value, never the var() ref).
 *   • resolved — the *computed* value, e.g. `#F05D25`. Read live from the DOM,
 *                so it already reflects the cascade + any inline edits.
 *
 * Classification:
 *   • primitive — a raw palette ramp entry (orange-500, grey-100, ink-900…).
 *   • semantic  — everything else, grouped by usage prefix (Background, Content,
 *                 Border, Primary Action…). A semantic whose rawValue is a
 *                 `var(--x)` is "linked"; we follow the chain to the ultimate
 *                 primitive when one exists.
 * ========================================================================== */

import { parseColor, normalizeCssColor } from "./color";
import { isGradient } from "./gradient";
// [تعديل أكاديميات] انظر ../acadimiat-scope.ts
import { apClassify, apComputedScope, isApTokenScope } from "../acadimiat-scope";

export type TokenKind = "primitive" | "semantic";

export interface TokenInfo {
  /** Name without the leading `--`, e.g. "orange-500". */
  name: string;
  /** Full custom-property name, e.g. "--orange-500". */
  varName: string;
  /** Declared value for the active theme: `var(--bg-cta)` or `#737373`. */
  rawValue: string;
  /** Computed color, normalized to `#RRGGBB[AA]` or `rgba(...)`. */
  resolved: string;
  kind: TokenKind;
  /** Display group, e.g. "Orange" (primitive) or "Background" (semantic). */
  group: string;
  /** Immediate `var()` target name (no `--`), when rawValue is a single ref. */
  refName: string | null;
  /** Ultimate primitive name the chain resolves to, when one exists. */
  linkedPrimitive: string | null;
  /** True when the value is a CSS gradient rather than a single color. */
  isGradient: boolean;
}

export interface TokenGroup {
  group: string;
  tokens: TokenInfo[];
}

export interface ColorSnapshot {
  theme: "light" | "dark";
  primitives: TokenGroup[];
  semantics: TokenGroup[];
  /** All color tokens by varName, for lookups + reverse mapping. */
  byVar: Map<string, TokenInfo>;
}

/* ── Grouping config ──────────────────────────────────────────────────────
 * Order matters: the first matching family/group wins. Families are matched
 * on the property name; groups are matched on a name prefix. */

interface FamilyRule {
  group: string;
  test: RegExp;
}

const PRIMITIVE_FAMILIES: FamilyRule[] = [
  { group: "Orange", test: /^orange(-|$)/ },
  { group: "Neutral", test: /^(grey|gray|neutral)(-|$)/ },
  { group: "Ink", test: /^ink(-|$)/ },
  { group: "Red", test: /^red(-|$)/ },
  { group: "Pink", test: /^pink(-|$)/ },
  { group: "Green", test: /^(success|green)(-|$)/ },
  { group: "Yellow", test: /^(warning|yellow|amber)(-|$)/ },
  { group: "Blue", test: /^(info|blue)(-|$)/ },
  { group: "Purple", test: /^(purple|violet)(-|$)/ },
  { group: "Secondary", test: /^secondary-(soft|muted|content|strong|solid)$/ },
];

const SEMANTIC_GROUPS: FamilyRule[] = [
  { group: "Background", test: /^(background|bg)(-|$)/ },
  { group: "Surface", test: /^surface(-|$)/ },
  { group: "Content", test: /^(content|text)(-|$)/ },
  { group: "Border", test: /^border(-|$)/ },
  { group: "Icon", test: /^icon(-|$)/ },
  { group: "Primary Action", test: /^(primary-action|pa)(-|$)/ },
  { group: "Secondary Action", test: /^(secondary-action|sa)(-|$)/ },
  { group: "State", test: /^(state|effect)(-|$)/ },
  { group: "Coupon", test: /^coupon(-|$)/ },
];

/** Desired display order of semantic groups (matches the spec's ordering). */
const SEMANTIC_ORDER = [
  "Background",
  "Surface",
  "Content",
  "Border",
  "Icon",
  "Primary Action",
  "Secondary Action",
  "State",
  "Coupon",
  "Gradients",
  "Other",
];

const PRIMITIVE_ORDER = [
  "Orange",
  "Neutral",
  "Ink",
  "Red",
  "Pink",
  "Green",
  "Yellow",
  "Blue",
  "Purple",
  "Secondary",
];

/* ── Raw-value reading from stylesheets ──────────────────────────────────── */

function selectorIsRoot(selector: string): boolean {
  // `:root`, `:root:root`, `html`, etc. — but NOT a themed override.
  return (
    (/(^|,)\s*(:root|html)\b/.test(selector) || selector.includes(":root") ||
      // [تعديل أكاديميات] .ap-docs/.ap-admin يصرّحان 722 من 892 توكنًا.
      isApTokenScope(selector)) &&
    !selector.includes("[data-theme")
  );
}

function selectorIsDark(selector: string): boolean {
  return selector.includes('[data-theme="dark"]');
}

/**
 * Walk every readable stylesheet and collect the declared value of each `--*`
 * custom property, split into the base (light) layer and the dark-override
 * layer. Cross-origin sheets throw on `.cssRules` access — those are skipped.
 */
function readRawDeclarations(): { light: Map<string, string>; dark: Map<string, string> } {
  const light = new Map<string, string>();
  const dark = new Map<string, string>();

  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const sel = rule.selectorText || "";
        const target = selectorIsDark(sel)
          ? dark
          : selectorIsRoot(sel)
            ? light
            : null;
        if (!target) continue;
        const style = rule.style;
        for (let i = 0; i < style.length; i++) {
          const prop = style[i];
          if (prop.startsWith("--")) {
            target.set(prop, style.getPropertyValue(prop).trim());
          }
        }
      } else if (
        typeof CSSMediaRule !== "undefined" &&
        rule instanceof CSSMediaRule
      ) {
        visit(rule.cssRules); // tokens defined inside @media (rare, but cheap)
      } else if (
        typeof CSSSupportsRule !== "undefined" &&
        rule instanceof CSSSupportsRule
      ) {
        visit(rule.cssRules);
      }
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    // Skip the inspector's own override stylesheet so edits don't pollute the
    // base "declared value" we report for each token.
    const owner = sheet.ownerNode as Element | null;
    if (owner && owner.id === "gini-csi-overrides") continue;
    try {
      if (sheet.cssRules) visit(sheet.cssRules);
    } catch {
      /* cross-origin / not yet loaded — skip */
    }
  }
  return { light, dark };
}

/* ── Classification helpers ──────────────────────────────────────────────── */

const VAR_RE = /^var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)$/i;

/** If rawValue is a single `var(--x)` reference, return "x" (no `--`). */
function refTargetOf(rawValue: string): string | null {
  const m = rawValue.match(VAR_RE);
  return m ? m[1].replace(/^--/, "") : null;
}

function classify(name: string): { kind: TokenKind; group: string } {
  // [تعديل أكاديميات] طبقاتنا أوّلًا؛ الجداول الأصلية تبقى لما ليس --ap-*.
  const ap = apClassify(name);
  if (ap) return ap;
  for (const f of PRIMITIVE_FAMILIES) {
    if (f.test.test(name)) return { kind: "primitive", group: f.group };
  }
  for (const g of SEMANTIC_GROUPS) {
    if (g.test.test(name)) return { kind: "semantic", group: g.group };
  }
  return { kind: "semantic", group: "Other" };
}

/** Is this resolved value actually a color (vs. a px/clamp/font/shadow value)? */
function isColorValue(resolved: string): boolean {
  const s = resolved.trim();
  if (!s) return false;
  if (/^#[0-9a-f]{3,8}$/i.test(s)) return true;
  if (/^rgba?\(/i.test(s)) return true;
  if (/^hsla?\(/i.test(s)) return true;
  return false;
}

/* ── Scale-aware sort (orange-50 < orange-100 < orange-500) ──────────────── */

const SCALE_WORDS: Record<string, number> = {
  ink: -1,
  dark: 1000,
  solid: 1100,
};

function scaleRank(name: string): number {
  const tail = name.split("-").pop() ?? "";
  if (/^\d+$/.test(tail)) return parseInt(tail, 10);
  return SCALE_WORDS[tail] ?? 500;
}

/* ── Public API ──────────────────────────────────────────────────────────── */

/**
 * Build a full snapshot of the live color system. Reads raw declarations from
 * the stylesheets and resolved values from `getComputedStyle(:root)`, so it
 * already reflects the active theme + any inline edits applied to the root.
 */
export function readColorSystem(): ColorSnapshot {
  const root = document.documentElement;
  const theme = root.dataset['theme'] === "dark" ? "dark" : "light";
  const { light, dark } = readRawDeclarations();

  // Effective raw values follow the cascade: dark overlays light when active.
  const rawByVar = new Map<string, string>(light);
  if (theme === "dark") for (const [k, v] of dark) rawByVar.set(k, v);

  // [تعديل أكاديميات] القراءة من داخل النطاق — الجذر يعيد فارغًا لكل مقصور.
  const computed = getComputedStyle(apComputedScope());

  // First pass — build every color TokenInfo (resolved + classification).
  const byVar = new Map<string, TokenInfo>();
  for (const [varName, rawValue] of rawByVar) {
    const resolved = computed.getPropertyValue(varName).trim();
    const gradient = isGradient(resolved);
    if (!isColorValue(resolved) && !gradient) continue; // drop spacing/type/shadow
    const name = varName.replace(/^--/, "");
    // Gradients form their own semantic group regardless of name.
    const { kind, group } = gradient
      ? { kind: "semantic" as TokenKind, group: "Gradients" }
      : classify(name);
    byVar.set(varName, {
      name,
      varName,
      rawValue: rawValue || resolved,
      resolved,
      kind,
      group,
      refName: refTargetOf(rawValue),
      linkedPrimitive: null,
      isGradient: gradient,
    });
  }

  // Second pass — resolve each ref chain to its ultimate primitive (if any).
  for (const token of byVar.values()) {
    let cursor = token.refName;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const next = byVar.get(`--${cursor}`);
      if (!next) break;
      if (next.kind === "primitive") {
        token.linkedPrimitive = next.name;
        break;
      }
      cursor = next.refName;
    }
  }

  // Group + order.
  const primitives = groupAndOrder(byVar, "primitive", PRIMITIVE_ORDER, true);
  const semantics = groupAndOrder(byVar, "semantic", SEMANTIC_ORDER, false);

  return { theme, primitives, semantics, byVar };
}

function groupAndOrder(
  byVar: Map<string, TokenInfo>,
  kind: TokenKind,
  order: string[],
  scaleSort: boolean,
): TokenGroup[] {
  const buckets = new Map<string, TokenInfo[]>();
  for (const t of byVar.values()) {
    if (t.kind !== kind) continue;
    const list = buckets.get(t.group) ?? [];
    list.push(t);
    buckets.set(t.group, list);
  }
  const groups: TokenGroup[] = [];
  const seen = new Set<string>();
  const pushGroup = (g: string) => {
    const tokens = buckets.get(g);
    if (!tokens || seen.has(g)) return;
    seen.add(g);
    tokens.sort((a, b) =>
      scaleSort
        ? scaleRank(a.name) - scaleRank(b.name) || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
    groups.push({ group: g, tokens });
  };
  for (const g of order) pushGroup(g);
  for (const g of [...buckets.keys()].sort()) pushGroup(g); // any extras
  return groups;
}

/**
 * Reverse index: normalized `#RRGGBB` → the token varNames that resolve to it.
 * Used by Inspect Element to label a computed color with its design token.
 * Primitives are listed first so e.g. `--orange-500` wins over a deep alias.
 */
export function buildReverseIndex(byVar: Map<string, TokenInfo>): Map<string, string[]> {
  const index = new Map<string, string[]>();
  const sorted = [...byVar.values()].sort((a, b) =>
    a.kind === b.kind ? 0 : a.kind === "primitive" ? -1 : 1,
  );
  for (const t of sorted) {
    const key = normalizeKey(t.resolved);
    if (!key) continue;
    const list = index.get(key) ?? [];
    list.push(t.varName);
    index.set(key, list);
  }
  return index;
}

/** Normalize any color string to a stable `r,g,b,a` key for reverse lookup. */
export function normalizeKey(value: string): string | null {
  const rgba = parseColor(value) ?? parseColor(normalizeCssColor(value) ?? "");
  if (!rgba) return null;
  return `${rgba.r},${rgba.g},${rgba.b},${Math.round(rgba.a * 100)}`;
}
