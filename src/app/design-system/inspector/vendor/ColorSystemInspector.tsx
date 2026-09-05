"use client";

/* =============================================================================
 * ColorSystemInspector — a floating, in-browser editor for the Gini color
 * system. Mounted globally; renders nothing but a small FAB until opened.
 *
 *   • Primitives tab  — raw palette ramps, grouped by family.
 *   • Tokens tab      — semantic tokens, grouped by usage, with var() links.
 *   • Inspect tab     — pick any element on the page, read its colors, map them
 *                       back to tokens, and edit them.
 *   • Export tab      — review changes, download / copy the system as JSON.
 *
 * The tool is intentionally self-contained: its own surface uses scoped
 * `--csi-*` variables (color-inspector.css), NOT the site tokens — otherwise
 * editing `--bg-surface` would restyle the panel itself. Desktop = draggable
 * floating panel; mobile = bottom sheet. RTL throughout. It never alters the
 * page's markup — only inline custom-property values on <html>, live.
 * ========================================================================== */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { toHex, readableInk, parseAnyColor, formatRgb } from "./color";
import { ColorPicker } from "./ColorPicker";
/* [تعديل أكاديميات] الورقة مُسجَّلة في angular.json تحت تهيئة development:
   بنّاء Angular لا يملك محمّلًا لاستيراد CSS من TypeScript. */
import { TokenList } from "./TokenList";
import { TokenPalette } from "./TokenPalette";
import { GradientEditor } from "./GradientEditor";
import { InspectOverlay } from "./InspectOverlay";
import {
  extractColors,
  describeElement,
  cssSelector,
  captureStyle,
  type DetectedColor,
  type CopiedStyle,
} from "./inspect";
import { LayersNav } from "./LayersNav";
import { TypeStylePalette } from "./TypeStylePalette";
import { useColorSystem } from "./useColorSystem";
import type { TokenGroup, TokenInfo } from "./tokens";
import {
  readTypography,
  extractTypography,
  typeStyleProps,
  lineHeightRatio,
  buildTypographyExport,
  type TypographySnapshot,
  type TypeStyle,
  type FontFamilyToken,
} from "./typography";
import { useTypeOverrides, type TypeOverride } from "./useTypeOverrides";
import {
  extractBoxModel,
  alignToGrid,
  gridToCss,
  type BoxModel,
  type Sides,
  type Corners,
} from "./boxmodel";
import {
  matchComponent,
  matchComponentInstance,
  bitUrl,
  type DsComponentRef,
} from "./componentMatch";
import {
  IconClose,
  IconMinimize,
  IconSearch,
  IconPicker,
  IconDownload,
  IconReset,
  IconDrag,
  IconPalette,
  IconCopy,
  IconCheck,
  IconEdit,
  IconSun,
  IconMoon,
  IconType,
  IconBox,
  IconChevron,
  IconGap,
  IconPadH,
  IconPadV,
  IconSides,
  IconRadius,
  IconFlowV,
  IconFlowH,
  IconComponent,
  IconShadow,
} from "./icons";

export type Tab = "primitives" | "tokens" | "inspect" | "typography" | "export";

/* v2 nav — 4 tabs. «الألوان» hosts both palettes (primitives/tokens) behind an
   in-body segmented switch, so the mental model is: تصفّح → استهدف → خطوط → راجع. */
const NAV: { id: Tab; label: string; match: Tab[] }[] = [
  { id: "primitives", label: "الألوان", match: ["primitives", "tokens"] },
  { id: "inspect", label: "العنصر", match: ["inspect"] },
  { id: "typography", label: "الخطوط", match: ["typography"] },
  { id: "export", label: "التغييرات", match: ["export"] },
];

/** Properties we can safely set inline on a non-token element color. */
const SAFE_ELEMENT_PROPS = new Set([
  "background-color",
  "color",
  "border-color",
  "outline-color",
  "fill",
  "stroke",
]);

/* ── Line style (stroke) helpers — the inspector can toggle a border/stroke
 *    between solid / dashed / dotted, mirroring the Figma "stroke" settings. */
export const STROKE_STYLES: ReadonlyArray<{ key: string; label: string }> = [
  { key: "solid", label: "صلب" },
  { key: "dashed", label: "متقطّع" },
  { key: "dotted", label: "منقّط" },
];
/** Normalize a computed CSS border line-style to one of the 3 we toggle. */
function normalizeLineStyle(s: string): string {
  return s === "dashed" || s === "dotted" ? s : "solid";
}
/** Map an SVG `stroke-dasharray` to a line-style key (none/0 → solid). */
function dashToLineStyle(dash: string): string {
  if (!dash || dash === "none" || !(parseFloat(dash) > 0)) return "solid";
  return parseFloat(dash) <= 2 ? "dotted" : "dashed";
}
/** Build an SVG `stroke-dasharray` for a line-style key (solid → ""). */
function lineStyleToDash(style: string): string {
  return style === "dashed" ? "6 5" : style === "dotted" ? "1.5 4" : "";
}

/** Resolve a CSS custom property (e.g. "--content-cta") to a concrete rgb()
 *  color via a hidden probe — handles vars that point at other vars. */
function resolveCssVar(name: string): string {
  if (typeof document === "undefined") return "#F05D25";
  const probe = document.createElement("span");
  probe.style.cssText = `color:var(${name});position:absolute;left:-9999px;`;
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c || "#F05D25";
}

/** Does the inspected element already paint this property? */
function elementHasProp(colors: DetectedColor[], prop: string): boolean {
  return colors.some((c) => c.property === prop);
}

interface EditTarget {
  label: string;
  /** Resolved color when the editor opened (picker seed + "before"). */
  initial: string;
  /** True system default, restored by Reset. */
  original: string;
  /** Token currently bound to the target (highlighted in the palette). */
  currentVar: string | null;
  /** Token bound before editing — restored on Reset. */
  originalVar: string | null;
  /** Whether the "من النظام" (pick a token) mode is offered. */
  supportsTokens: boolean;
  /** Which mode opens first. */
  defaultMode: EditMode;
  /** When set, the target is a gradient — the gradient editor is shown. */
  gradient: string | null;
  /** When set, the target is a stroke/border — the edit panel shows a line-style
   *  toggle (صلب / متقطّع / منقّط). `apply` mutates the right property
   *  (`border-style` for an HTML border, `stroke-dasharray` for an SVG stroke)
   *  and records the edit so "نسخ ككود" reproduces it. */
  strokeStyle?: {
    /** Current line style: "solid" | "dashed" | "dotted". */
    initial: string;
    /** Apply a line style live and record it. */
    apply: (style: string) => void;
  };
  meta: ReactNode;
  /** Live-apply any value — a hex OR a `var(--token)` string. */
  preview: (value: string) => void;
  /** Commit the current value. */
  commit: (value: string) => void;
  restore: () => void;
  reset: () => void;
}

type EditMode = "system" | "custom";

/** One edited sub-element belonging to a design-system component instance. */
interface ComponentEdit {
  /** The edited element. */
  el: Element;
  /** The instance's root DOM element — groups sub-edits of the SAME component. */
  rootEl: Element;
  /** Component display name (e.g. "OfferCard"). */
  name: string;
  /** CSS selector for the copy-as-code output. */
  selector: string;
  /** property → value. */
  props: Map<string, string>;
}

/** Extract the `--x` name from a `var(--x)` value (else null). */
function varRefOf(value: string): string | null {
  const m = value.match(/^var\(\s*(--[a-z0-9-]+)/i);
  return m ? m[1].replace(/^--/, "") : null;
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

export interface ColorSystemInspectorProps {
  /**
   * Optional design-system registry. When provided, the Inspect tab shows a
   * "go to main component" link for elements that render a registered component.
   * In the Gini app this is passed from the /status `ITEMS` list.
   */
  components?: DsComponentRef[];
  /**
   * Render the panel INLINE (in the page flow) instead of as a floating overlay
   * — used by the `/inspector` showcase so the tool's own screens can be put on
   * a page and edited by the (separate) floating instance. Embedded panels drop
   * the `data-gini-csi` self-exclusion marker, so the floating inspector's
   * "فحص عنصر" can target and restyle them. No FAB, no drag, no portal.
   */
  embedded?: boolean;
  /** Initial tab to show (handy for the showcase, e.g. one panel per screen). */
  defaultTab?: Tab;
}

export function ColorSystemInspector({
  components,
  embedded = false,
  defaultTab = "primitives",
}: ColorSystemInspectorProps = {}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(embedded);
  const [closing, setClosing] = useState(false);
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [inspectActive, setInspectActive] = useState(false);
  const [selected, setSelected] = useState<{
    el: Element;
    label: string;
    colors: DetectedColor[];
  } | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  // Element whose TYPOGRAPHY is being edited (font counterpart of editTarget).
  const [fontTarget, setFontTarget] = useState<HTMLElement | null>(null);
  // Type-style class being edited GLOBALLY from the الخطوط tab.
  const [fontStyleTarget, setFontStyleTarget] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  // Color properties the user changed on the currently-inspected element —
  // drives the "نسخ ككود CSS" output. Reset whenever a new element is picked.
  const [elementEdits, setElementEdits] = useState<Map<string, string>>(
    new Map(),
  );
  // Edits accumulated PER design-system component instance, across however many
  // sub-elements the user touched. Each entry = one edited sub-element. Grouped
  // by `rootEl` (the instance), so "نسخ كل تعديلات هذا المكوّن" only ever bundles
  // edits that belong to one single component. `compEditsRef` mirrors it for
  // reads inside callbacks (which would otherwise close over stale state).
  const [compEdits, setCompEdits] = useState<ComponentEdit[]>([]);
  const compEditsRef = useRef<ComponentEdit[]>([]);
  // The element currently being edited (for attributing edits without a stale
  // closure over `selected`).
  const selectedRef = useRef<Element | null>(null);
  // "Format painter" buffer — a style copied from one element, paste-able onto another.
  const [copiedStyle, setCopiedStyle] = useState<CopiedStyle | null>(null);
  // When true, the next element picked on the page receives the copied style.
  const [pasteMode, setPasteMode] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const isMobile = useIsMobile();
  const system = useColorSystem(open);
  const typeOv = useTypeOverrides();
  const {
    snapshot,
    resolved,
    overrides,
    editedVars,
    previewToken,
    commitToken,
    restoreToken,
    resetToken,
    resetAll,
    getEdit,
    lookupToken,
    buildExport,
    downloadJson,
  } = system;

  // Live type system (the `.t-*` scale + font tokens), re-read while the panel
  // is open. Cheap — probes ~3 dozen hidden spans for their computed metrics.
  // `readTypography()` reads document.styleSheets, so it must never run during
  // SSR. The floating instance is closed (open=false) at first paint, but an
  // embedded panel starts open — gate on `mounted` (client-only) so neither
  // path touches `document` on the server.
  const typography = useMemo<TypographySnapshot | null>(
    () => (open && mounted ? readTypography() : null),
    [open, mounted, tab, fontStyleTarget, typeOv.typeRev],
  );

  // Design-system component registry (name → ref) for "go to main component".
  const componentRegistry = useMemo(
    () => new Map((components ?? []).map((c) => [c.name, c] as const)),
    [components],
  );

  useEffect(() => setMounted(true), []);

  // Reset transient view state whenever the group/tab context changes.
  useEffect(() => setGroupFilter(null), [tab]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Collapse the panel down into the floating circle (with the slide-down
  // animation), then hide it so the FAB shows again.
  const requestClose = useCallback(() => {
    setInspectActive(false);
    setEditTarget(null);
    setFontTarget(null);
    setFontStyleTarget(null);
    setClosing(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  }, []);

  const recordElementEdit = useCallback(
    (property: string, value: string) => {
      setElementEdits((prev) => {
        const next = new Map(prev);
        next.set(property, value);
        return next;
      });
      // Bucket EVERY edit so "نسخ كل تعديلات الجلسة" captures the whole page —
      // any element you touch, not only registered design-system components.
      // Component edits group under their instance root (this also drives the
      // per-component block); loose page elements share one page-level bucket.
      const el = selectedRef.current;
      if (!el) return;
      const inst = matchComponentInstance(el, componentRegistry);
      const list = compEditsRef.current.slice();
      const i = list.findIndex((e) => e.el === el);
      if (i >= 0) {
        const props = new Map(list[i].props);
        props.set(property, value);
        list[i] = { ...list[i], props };
      } else {
        list.push({
          el,
          rootEl: inst ? inst.rootEl : document.body,
          name: inst ? inst.ref.name : "عناصر الصفحة",
          selector: cssSelector(el),
          props: new Map([[property, value]]),
        });
      }
      compEditsRef.current = list;
      setCompEdits(list);
    },
    [componentRegistry],
  );

  // Switch the mode being edited. Matches the site's own toggle
  // (data-theme + "gini:theme"); the hook re-scans on the data-theme change and
  // shows THAT mode's values + edits (light/dark edits are kept separate).
  const applyTheme = useCallback((t: "light" | "dark") => {
    document.documentElement.dataset['theme'] = t;
    try {
      window.localStorage.setItem("gini:theme", t);
    } catch {
      /* storage disabled */
    }
  }, []);

  /* ── Build an edit target for a design token ─────────────────────────── */
  const editToken = useCallback(
    (token: TokenInfo) => {
      const ov = getEdit(token.varName);
      const current = resolved.get(token.varName) ?? token.resolved;
      const original = ov ? ov.oldResolved : current;
      const currentRaw = ov ? ov.newValue : token.rawValue;
      if (token.isGradient) {
        setEditTarget({
          label: token.varName,
          initial: current,
          original,
          currentVar: null,
          originalVar: null,
          supportsTokens: false,
          defaultMode: "custom",
          gradient: current,
          preview: (value) => previewToken(token.varName, value),
          commit: (value) => commitToken(token, value),
          restore: restoreToken,
          reset: () => resetToken(token.varName),
          meta: (
            <div className="gini-csi-editmeta">
              <span className="gini-csi-chip gini-csi-chip--kind">تدرّج</span>
              <span className="gini-csi-chip">{token.group}</span>
            </div>
          ),
        });
        return;
      }
      setEditTarget({
        label: token.varName,
        initial: current,
        original,
        currentVar: varRefOf(currentRaw),
        originalVar: token.refName,
        supportsTokens: true,
        defaultMode: "custom",
        gradient: null,
        preview: (value) => previewToken(token.varName, value),
        commit: (value) => commitToken(token, value),
        restore: restoreToken,
        reset: () => resetToken(token.varName),
        meta: (
          <div className="gini-csi-editmeta">
            <span className="gini-csi-chip gini-csi-chip--kind">
              {token.kind === "primitive" ? "لون أساسي" : "توكن دلالي"}
            </span>
            <span className="gini-csi-chip">{token.group}</span>
            {token.linkedPrimitive && (
              <span className="gini-csi-chip gini-csi-chip--link">
                ← {token.linkedPrimitive}
              </span>
            )}
            <code className="gini-csi-editmeta__value">{token.rawValue}</code>
          </div>
        ),
      });
    },
    [
      getEdit,
      resolved,
      previewToken,
      commitToken,
      restoreToken,
      resetToken,
    ],
  );

  /* ── Build an edit target for an inspected color ─────────────────────── */
  const editDetected = useCallback(
    (el: Element, dc: DetectedColor) => {
      // Element-scoped, design-system-first: recolour THIS element by binding
      // its property to a token (var(--token)) — or a custom value as fallback.
      if (!(el instanceof HTMLElement)) return;
      const prop = dc.property;
      const before = el.style.getPropertyValue(prop);
      // A border can also be re-styled (solid/dashed/dotted) — snapshot the
      // inline border-style so Cancel/Reset restores it alongside the color.
      const isBorder = prop === "border-color";
      const beforeBorderStyle = isBorder
        ? el.style.getPropertyValue("border-style")
        : "";
      const restore = () => {
        if (before) el.style.setProperty(prop, before);
        else el.style.removeProperty(prop);
        if (isBorder) {
          if (beforeBorderStyle)
            el.style.setProperty("border-style", beforeBorderStyle);
          else el.style.removeProperty("border-style");
        }
      };

      // Gradient background → open the gradient editor.
      if (dc.isGradient) {
        setEditTarget({
          label: `${describeElement(el)} · تدرّج`,
          initial: dc.value,
          original: dc.value,
          currentVar: null,
          originalVar: null,
          supportsTokens: false,
          defaultMode: "custom",
          gradient: dc.value,
          preview: (value) => el.style.setProperty(prop, value),
          commit: (value) => {
            el.style.setProperty(prop, value);
            recordElementEdit(prop, value);
          },
          restore,
          reset: restore,
          meta: (
            <div className="gini-csi-editmeta">
              <span className="gini-csi-chip gini-csi-chip--kind">
                تغيير تدرّج هذا العنصر
              </span>
              <code className="gini-csi-editmeta__value">{prop}</code>
            </div>
          ),
        });
        return;
      }

      if (!SAFE_ELEMENT_PROPS.has(dc.property)) return; // box-shadow → copy only
      const matchedVar = lookupToken(dc.value);
      setEditTarget({
        label: `${describeElement(el)} · ${dc.label}`,
        initial: dc.value,
        original: dc.value,
        currentVar: matchedVar,
        originalVar: matchedVar,
        supportsTokens: true,
        defaultMode: "system",
        gradient: null,
        strokeStyle: isBorder
          ? {
              initial: normalizeLineStyle(getComputedStyle(el).borderTopStyle),
              apply: (s) => {
                el.style.setProperty("border-style", s);
                recordElementEdit("border-style", s);
              },
            }
          : undefined,
        preview: (value) => el.style.setProperty(prop, value),
        commit: (value) => {
          el.style.setProperty(prop, value);
          recordElementEdit(prop, value);
        },
        restore,
        reset: restore,
        meta: (
          <div className="gini-csi-editmeta">
            <span className="gini-csi-chip gini-csi-chip--kind">
              تغيير هذا العنصر
            </span>
            <code className="gini-csi-editmeta__value">{prop}</code>
            {matchedVar && (
              <span className="gini-csi-chip gini-csi-chip--link">
                {`var(--${matchedVar})`}
              </span>
            )}
          </div>
        ),
      });
    },
    [lookupToken, recordElementEdit],
  );

  /* ── Add a color the element doesn't have yet (stroke / fill) ─────────── */
  const addColor = useCallback(
    (el: Element, kind: "stroke" | "fill") => {
      const isSvg = el instanceof SVGElement;
      if (!isSvg && !(el instanceof HTMLElement)) return;
      const style = (el as HTMLElement | SVGElement).style;

      let prop: string;
      let label: string;
      let defaultVar: string;
      const befores: Record<string, string> = {};
      const snap = (p: string) => {
        befores[p] = style.getPropertyValue(p);
      };
      let ensure: () => void;

      if (kind === "stroke") {
        if (isSvg) {
          prop = "stroke";
          snap("stroke");
          snap("stroke-width");
          snap("stroke-dasharray");
          snap("stroke-linecap");
          ensure = () => {
            if (!style.getPropertyValue("stroke-width")) {
              style.setProperty("stroke-width", "1.5");
            }
          };
        } else {
          // An HTML border only shows with a width + style, so add those too.
          prop = "border-color";
          snap("border-color");
          snap("border-style");
          snap("border-width");
          ensure = () => {
            style.setProperty("border-style", "solid");
            if (!(parseFloat(getComputedStyle(el).borderTopWidth) > 0)) {
              style.setProperty("border-width", "1px");
            }
          };
        }
        label = "ستروك (حدود)";
        defaultVar = "content-cta";
      } else {
        // fill
        prop = isSvg ? "fill" : "background-color";
        snap(prop);
        ensure = () => {};
        label = "تعبئة (خلفية)";
        defaultVar = "bg-cta-soft";
      }

      const restore = () => {
        for (const [p, v] of Object.entries(befores)) {
          if (v) style.setProperty(p, v);
          else style.removeProperty(p);
        }
      };
      const refresh = () =>
        setSelected((s) =>
          s && s.el === el ? { ...s, colors: extractColors(el) } : s,
        );

      const seed = resolveCssVar(`--${defaultVar}`);

      // A stroke target gets a line-style toggle (solid/dashed/dotted): an HTML
      // border toggles `border-style`, an SVG stroke toggles `stroke-dasharray`.
      const strokeStyleCtl =
        kind !== "stroke"
          ? undefined
          : isSvg
            ? {
                initial: dashToLineStyle(
                  getComputedStyle(el).getPropertyValue("stroke-dasharray"),
                ),
                apply: (s: string) => {
                  const dash = lineStyleToDash(s);
                  if (dash) {
                    style.setProperty("stroke-dasharray", dash);
                    if (s === "dotted")
                      style.setProperty("stroke-linecap", "round");
                  } else {
                    style.removeProperty("stroke-dasharray");
                  }
                  recordElementEdit("stroke-dasharray", dash || "none");
                },
              }
            : {
                initial: normalizeLineStyle(getComputedStyle(el).borderTopStyle),
                apply: (s: string) => {
                  style.setProperty("border-style", s);
                  recordElementEdit("border-style", s);
                },
              };

      setEditTarget({
        label: `${describeElement(el)} · إضافة ${label}`,
        initial: seed,
        original: seed,
        currentVar: defaultVar,
        originalVar: null,
        supportsTokens: true,
        defaultMode: "system",
        gradient: null,
        strokeStyle: strokeStyleCtl,
        preview: (value) => {
          ensure();
          style.setProperty(prop, value);
        },
        commit: (value) => {
          ensure();
          style.setProperty(prop, value);
          recordElementEdit(prop, value);
          // Record the structural props we added (border width/style,
          // stroke-width) so "نسخ ككود CSS" reproduces the stroke/fill.
          for (const p of Object.keys(befores)) {
            if (p === prop) continue;
            const v = style.getPropertyValue(p);
            if (v) recordElementEdit(p, v);
          }
          refresh();
        },
        restore,
        reset: restore,
        meta: (
          <div className="gini-csi-editmeta">
            <span className="gini-csi-chip gini-csi-chip--kind">
              إضافة {label} لهذا العنصر
            </span>
            <code className="gini-csi-editmeta__value">{prop}</code>
          </div>
        ),
      });
    },
    [recordElementEdit],
  );

  /* ── Copy style ("format painter") ───────────────────────────────────── */
  const copyStyle = useCallback((el: Element) => {
    setCopiedStyle(captureStyle(el));
  }, []);

  /* Apply the copied style to another element. */
  const pasteStyle = useCallback(
    (el: Element) => {
      if (!copiedStyle) return;
      if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) return;
      selectedRef.current = el;
      const style = (el as HTMLElement | SVGElement).style;
      for (const [prop, value] of Object.entries(copiedStyle.props)) {
        style.setProperty(prop, value);
        recordElementEdit(prop, value);
      }
      setSelected((s) =>
        s && s.el === el ? { ...s, colors: extractColors(el) } : s,
      );
    },
    [copiedStyle, recordElementEdit],
  );

  /* ── Inspect: pick an element ────────────────────────────────────────── */
  const onPick = useCallback(
    (el: Element) => {
      // Attribute any edits about to happen to this element.
      selectedRef.current = el;
      // Paste mode: apply the copied style to the element just clicked.
      const pasting =
        pasteMode &&
        copiedStyle &&
        (el instanceof HTMLElement || el instanceof SVGElement);
      if (pasting) {
        const style = (el as HTMLElement | SVGElement).style;
        setElementEdits(new Map());
        for (const [prop, value] of Object.entries(copiedStyle.props)) {
          style.setProperty(prop, value);
          recordElementEdit(prop, value); // updates elementEdits + the component bucket
        }
      } else {
        // Re-picking an element we already edited? Restore its recorded edits so
        // the "نسخ ككود CSS" block and the panel reflect them.
        const prior = compEditsRef.current.find((e) => e.el === el);
        setElementEdits(prior ? new Map(prior.props) : new Map());
      }
      setSelected({
        el,
        label: describeElement(el),
        colors: extractColors(el), // read AFTER paste so new colors show
      });
      setPasteMode(false);
      setInspectActive(false);
    },
    [pasteMode, copiedStyle, recordElementEdit],
  );

  /* ── Desktop drag ────────────────────────────────────────────────────── */
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const onDragStart = (e: ReactPointerEvent<HTMLElement>) => {
    if (isMobile || embedded) return;
    // Don't start a drag (which captures the pointer) when the press lands on a
    // header control — otherwise the capture swallows the minimize/close click.
    if ((e.target as HTMLElement).closest("button, a, input")) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current || e.buttons !== 1) return;
    const w = panelRef.current?.offsetWidth ?? 360;
    // Clamp inside the viewport on both axes so the header (drag handle) can
    // never be pushed fully off-screen and become unreachable / "stuck".
    const x = Math.min(
      Math.max(8, e.clientX - dragRef.current.dx),
      Math.max(8, window.innerWidth - w - 8),
    );
    const y = Math.min(
      Math.max(8, e.clientY - dragRef.current.dy),
      window.innerHeight - 40,
    );
    setPos({ x, y });
  };
  const onDragEnd = () => {
    dragRef.current = null;
  };

  /* ── Derived data ────────────────────────────────────────────────────── */
  const activeGroups = useMemo(() => {
    if (!snapshot) return [];
    const groups = tab === "tokens" ? snapshot.semantics : snapshot.primitives;
    return groupFilter ? groups.filter((g) => g.group === groupFilter) : groups;
  }, [snapshot, tab, groupFilter]);

  // For the "من النظام" palette — semantic tokens first (most meaningful for
  // recolouring UI), then primitives.
  const paletteGroups = useMemo(
    () => (snapshot ? [...snapshot.semantics, ...snapshot.primitives] : []),
    [snapshot],
  );

  const groupNames = useMemo(() => {
    if (!snapshot) return [];
    const groups = tab === "tokens" ? snapshot.semantics : snapshot.primitives;
    return groups.map((g) => g.group);
  }, [snapshot, tab]);

  const exportData = useMemo(
    () => (tab === "export" && open ? buildExport() : null),
    [tab, open, buildExport],
  );

  const closeEdit = () => setEditTarget(null);
  const editFont = useCallback((el: Element) => {
    if (el instanceof HTMLElement) setFontTarget(el);
  }, []);
  const closeFont = () => setFontTarget(null);
  const closeFontStyle = () => setFontStyleTarget(null);

  const downloadTypographyJson = useCallback(() => {
    const data = buildTypographyExport(
      typography,
      typeOv.typeOverrides.values(),
      new Date().toISOString(),
    );
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gini-typography-${data.meta.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [typography, typeOv.typeOverrides]);

  if (!mounted) return null;

  /* ── FAB (closed state) — never shown when embedded inline ───────────── */
  if (!open && !embedded) {
    return createPortal(
      <button
        type="button"
        data-gini-csi
        className="gini-csi-fab"
        onClick={() => setOpen(true)}
        aria-label="فاحص نظام الألوان"
        data-tip="فاحص نظام الألوان"
      >
        <IconPalette />
        {editedVars.size > 0 && (
          <span className="gini-csi-fab__badge">{editedVars.size}</span>
        )}
      </button>,
      document.body,
    );
  }

  // The drag math runs in physical viewport coordinates (clientX/clientY), so
  // the panel MUST be pinned with physical left/top. The previous logical
  // `inset-inline-start` mapped x onto the panel's *right* edge in this RTL
  // dialog — which inverted horizontal dragging (drag right → moved left) and
  // let the panel run away to a clamped corner where it felt "stuck". We also
  // clear right/bottom so the CSS dock (inset-inline-start / inset-block-end)
  // doesn't fight the inline left/top.
  const panelStyle: CSSProperties =
    !embedded && !isMobile && pos
      ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
      : {};

  const tree = (
    <>
      <InspectOverlay
        active={inspectActive || pasteMode}
        hint={
          pasteMode
            ? "اضغط على العنصر الذي تريد لصق الستايل عليه · Esc للإلغاء"
            : undefined
        }
        onPick={onPick}
        onCancel={() => {
          setInspectActive(false);
          setPasteMode(false);
        }}
      />

      <section
        ref={panelRef}
        {...(embedded ? {} : { "data-gini-csi": true })}
        className={`gini-csi${embedded ? " gini-csi--embedded" : ""}${closing ? " is-closing" : ""}`}
        style={panelStyle}
        dir="rtl"
        role={embedded ? "region" : "dialog"}
        aria-label="فاحص نظام الألوان"
      >
        {/* Header / drag handle */}
        <header
          className="gini-csi__header"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onLostPointerCapture={onDragEnd}
        >
          <span className="gini-csi__grip" aria-hidden="true">
            <IconDrag />
          </span>
          <div className="gini-csi__titles">
            <h2 className="gini-csi__title">فاحص نظام الألوان</h2>
            <span className="gini-csi__subtitle">
              <span>
                {snapshot
                  ? snapshot.theme === "dark"
                    ? "تحرير الوضع الداكن"
                    : "تحرير الوضع الفاتح"
                  : "…"}
              </span>
              {editedVars.size > 0 && (
                <button
                  type="button"
                  className="gini-csi__subtitle-edits"
                  onClick={() => {
                    setTab("export");
                    closeEdit();
                    closeFont();
                    closeFontStyle();
                  }}
                  title="مراجعة التغييرات"
                >
                  <bdi dir="ltr">{editedVars.size}</bdi> تعديل
                </button>
              )}
            </span>
          </div>
          <div className="gini-csi__chrome">
            {/* الفحص = الإجراء الأهم — متاح من أي تبويب بنقرة واحدة */}
            <button
              type="button"
              className={`gini-csi-iconbtn gini-csi-iconbtn--inspect${inspectActive ? " is-active" : ""}`}
              onClick={() => {
                setTab("inspect");
                closeEdit();
                closeFont();
                closeFontStyle();
                setSelected(null);
                setInspectActive(true);
              }}
              aria-label="فحص عنصر من الصفحة"
              title="فحص عنصر من الصفحة"
            >
              <IconPicker />
            </button>
            <div className="gini-csi-hseg" role="group" aria-label="وضع التحرير">
              <button
                type="button"
                className={`gini-csi-hseg__btn${(snapshot?.theme ?? "light") === "light" ? " is-active" : ""}`}
                onClick={() => applyTheme("light")}
                aria-label="تحرير الوضع الفاتح"
                title="الوضع الفاتح"
              >
                <IconSun />
              </button>
              <button
                type="button"
                className={`gini-csi-hseg__btn${snapshot?.theme === "dark" ? " is-active" : ""}`}
                onClick={() => applyTheme("dark")}
                aria-label="تحرير الوضع الداكن"
                title="الوضع الداكن"
              >
                <IconMoon />
              </button>
            </div>
            <button
              type="button"
              className="gini-csi-iconbtn"
              onClick={requestClose}
              aria-label="تصغير"
              title="تصغير إلى الزر العائم"
            >
              <IconMinimize />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <nav className="gini-csi__tabs" role="tablist">
              {NAV.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={t.match.includes(tab)}
                  className={`gini-csi__tab${t.match.includes(tab) ? " is-active" : ""}`}
                  onClick={() => {
                    setTab((cur) => (t.match.includes(cur) ? cur : t.id));
                    closeEdit();
                    closeFont();
                    closeFontStyle();
                  }}
                >
                  {t.label}
                  {t.id === "export" &&
                    (editedVars.size > 0 || typeOv.editedClasses.size > 0) && (
                      <span className="gini-csi__tab-dot" aria-hidden="true" />
                    )}
                </button>
              ))}
            </nav>

            {/* Body */}
            <div className="gini-csi__body">
              {editTarget ? (
                <EditView
                  key={editTarget.label}
                  target={editTarget}
                  paletteGroups={paletteGroups}
                  resolved={resolved}
                  lookupToken={lookupToken}
                  onClose={closeEdit}
                />
              ) : fontTarget ? (
                <FontEditView
                  el={fontTarget}
                  typography={typography}
                  onRecord={recordElementEdit}
                  onClose={closeFont}
                />
              ) : fontStyleTarget ? (
                <TypeStyleEditView
                  className={fontStyleTarget}
                  typography={typography}
                  override={typeOv.getTypeEdit(fontStyleTarget)}
                  onApply={(patch) => typeOv.setTypeOverride(fontStyleTarget, patch)}
                  onReset={() => typeOv.resetType(fontStyleTarget)}
                  onClose={closeFontStyle}
                />
              ) : tab === "inspect" ? (
                <InspectTab
                  active={inspectActive}
                  selected={selected}
                  elementEdits={elementEdits}
                  compEdits={compEdits}
                  typography={typography}
                  onStart={() => {
                    setSelected(null);
                    setInspectActive(true);
                  }}
                  onEditColor={editDetected}
                  onEditFont={editFont}
                  onRecord={recordElementEdit}
                  componentRegistry={componentRegistry}
                  onAddColor={addColor}
                  onReselect={onPick}
                  copiedStyle={copiedStyle}
                  onCopyStyle={copyStyle}
                  onPasteStyle={pasteStyle}
                  onStartPaste={() => setPasteMode(true)}
                  onClearStyle={() => {
                    setCopiedStyle(null);
                    setPasteMode(false);
                  }}
                  lookupToken={lookupToken}
                />
              ) : tab === "typography" ? (
                <TypographyTab
                  typography={typography}
                  editedClasses={typeOv.editedClasses}
                  onEditStyle={(s) => setFontStyleTarget(s.className)}
                />
              ) : tab === "export" ? (
                <ExportTab
                  data={exportData}
                  copied={copiedJson}
                  typeChangeCount={typeOv.editedClasses.size}
                  onDownloadColors={downloadJson}
                  onDownloadTypography={downloadTypographyJson}
                  onCopy={() => {
                    if (!exportData) return;
                    void navigator.clipboard?.writeText(
                      JSON.stringify(exportData, null, 2),
                    );
                    setCopiedJson(true);
                    window.setTimeout(() => setCopiedJson(false), 1200);
                  }}
                  onResetAll={() => {
                    resetAll();
                    typeOv.resetAllTypes();
                  }}
                  onResetToken={(name, theme) => {
                    if ((snapshot?.theme ?? "light") !== theme) applyTheme(theme);
                    resetToken(name);
                  }}
                  hasChanges={overrides.size > 0 || typeOv.editedClasses.size > 0}
                />
              ) : (
                <>
                  <div className="gini-csi-filterrow">
                    <div className="gini-csi-seg gini-csi-seg--kind" role="tablist" aria-label="نوع التوكنات">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "primitives"}
                        className={`gini-csi-seg__btn${tab === "primitives" ? " is-active" : ""}`}
                        onClick={() => setTab("primitives")}
                      >
                        الأساسية
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "tokens"}
                        className={`gini-csi-seg__btn${tab === "tokens" ? " is-active" : ""}`}
                        onClick={() => setTab("tokens")}
                      >
                        الدلالية
                      </button>
                    </div>
                    <label className="gini-csi-search">
                      <IconSearch />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ابحث بالاسم أو الكود…"
                        spellCheck={false}
                      />
                    </label>
                  </div>
                  <div className="gini-csi__chips">
                    <button
                      type="button"
                      className={`gini-csi-pill${groupFilter === null ? " is-active" : ""}`}
                      onClick={() => setGroupFilter(null)}
                    >
                      الكل
                    </button>
                    {groupNames.map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`gini-csi-pill${groupFilter === g ? " is-active" : ""}`}
                        onClick={() => setGroupFilter((cur) => (cur === g ? null : g))}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {snapshot ? (
                    <TokenList
                      groups={activeGroups}
                      resolved={resolved}
                      editedVars={editedVars}
                      showLinks={tab === "tokens"}
                      query={query}
                      onEdit={editToken}
                      onReset={resetToken}
                    />
                  ) : (
                    <div className="gini-csi-empty">جارٍ قراءة نظام الألوان…</div>
                  )}
                </>
              )}
            </div>
      </section>
    </>
  );

  // Embedded → render in the page flow. Floating → portal into <body>.
  return embedded ? tree : createPortal(tree, document.body);
}

/* ── Stroke line-style toggle (صلب / متقطّع / منقّط) — shown in the edit panel
 *    whenever the target is a border/stroke, mirroring Figma's stroke settings.
 *    Each option previews the line; picking one applies it live via the
 *    target's `strokeStyle.apply`. */
function StrokeStyleToggle({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (style: string) => void;
}) {
  const [sel, setSel] = useState(
    STROKE_STYLES.some((s) => s.key === initial) ? initial : "solid",
  );
  return (
    <div className="gini-csi-strokestyle">
      <span className="gini-csi-strokestyle__label">نمط الخط</span>
      <div
        className="gini-csi-seg gini-csi-seg--sm"
        role="group"
        aria-label="نمط الخط"
      >
        {STROKE_STYLES.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`gini-csi-seg__btn${sel === s.key ? " is-active" : ""}`}
            aria-pressed={sel === s.key}
            onClick={() => {
              setSel(s.key);
              onChange(s.key);
            }}
          >
            <span
              className="gini-csi-strokestyle__line"
              data-style={s.key}
              aria-hidden="true"
            />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Edit view — "من النظام" (pick a token) vs "لون مخصص" (freeform) ────── */
function EditView({
  target,
  paletteGroups,
  resolved,
  lookupToken,
  onClose,
}: {
  target: EditTarget;
  paletteGroups: TokenGroup[];
  resolved: Map<string, string>;
  lookupToken: (color: string) => string | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<EditMode>(
    target.supportsTokens ? target.defaultMode : "custom",
  );
  const [draft, setDraft] = useState(target.initial);
  const [selVar, setSelVar] = useState<string | null>(target.currentVar);

  const apply = (value: string, varName: string | null) => {
    setDraft(value);
    setSelVar(varName);
    target.preview(value);
  };

  const commitValue = (value: string) => {
    target.commit(value);
    onClose();
  };
  const doCancel = () => {
    target.restore();
    onClose();
  };
  const doReset = () => {
    target.reset();
    setDraft(target.original);
    setSelVar(target.originalVar);
  };

  const showPalette = target.supportsTokens && mode === "system";

  return (
    <div className="gini-csi-edit">
      <button type="button" className="gini-csi-edit__back" onClick={doCancel}>
        ← رجوع
      </button>
      {target.meta}

      {target.strokeStyle && (
        <StrokeStyleToggle
          initial={target.strokeStyle.initial}
          onChange={target.strokeStyle.apply}
        />
      )}

      {target.gradient != null ? (
        <GradientEditor
          initial={target.gradient}
          paletteGroups={paletteGroups}
          resolved={resolved}
          lookupToken={lookupToken}
          onChange={target.preview}
          onApply={(v) => commitValue(v)}
          onCancel={doCancel}
          onReset={doReset}
        />
      ) : (
        <>
          {target.supportsTokens && (
            <div className="gini-csi-seg" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "system"}
                className={`gini-csi-seg__btn${mode === "system" ? " is-active" : ""}`}
                onClick={() => setMode("system")}
              >
                من النظام
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "custom"}
                className={`gini-csi-seg__btn${mode === "custom" ? " is-active" : ""}`}
                onClick={() => setMode("custom")}
              >
                لون مخصص
              </button>
            </div>
          )}

          {showPalette ? (
        <>
          <TokenPalette
            groups={paletteGroups}
            resolved={resolved}
            selectedVar={selVar}
            onPick={(t) => apply(`var(${t.varName})`, t.varName)}
          />
          <div className="gini-csi-picker__actions">
            <button
              type="button"
              className="gini-csi-btn gini-csi-btn--primary"
              onClick={() => commitValue(draft)}
            >
              تطبيق
            </button>
            <button
              type="button"
              className="gini-csi-btn gini-csi-btn--ghost"
              onClick={doCancel}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="gini-csi-btn gini-csi-btn--danger"
              onClick={doReset}
            >
              استرجاع
            </button>
          </div>
        </>
          ) : (
            <ColorPicker
              initial={target.initial}
              original={target.original}
              label={target.label}
              onChange={(hex) => apply(hex, null)}
              onApply={(hex) => commitValue(hex)}
              onCancel={doCancel}
              onReset={doReset}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ── OrderControl — «ترتيب العنصر داخل الإطار» (DOM order · مثل طبقات Figma)
 * يغيّر ترتيب HTML فعلياً: insertBefore بين إخوة العنصر داخل أبيه.
 * شريط «طبقات» يمثّل الإخوة (النقر ينقل العنصر لذلك الموضع)، وأزرار
 * الأول/قدّم/أخّر/الأخير، مع مؤشّر «الموضع i من n» واسترجاع للترتيب الأصلي. */
function OrderControl({ el }: { el: Element }) {
  const parent = el.parentElement;
  const usable =
    !!parent &&
    parent !== document.body &&
    parent !== document.documentElement;

  // يجبر إعادة القياس بعد كل نقل
  const [, setRev] = useState(0);
  const bump = () => setRev((x) => x + 1);

  // الموضع الأصلي (يُلتقط عند أول نقل لهذا العنصر) للاسترجاع
  const originRef = useRef<{ el: Element; next: Node | null } | null>(null);

  const siblings = usable ? Array.from(parent.children) : [];
  const index = siblings.indexOf(el); // 0-based
  const count = siblings.length;

  const captureOrigin = () => {
    if (!originRef.current || originRef.current.el !== el) {
      originRef.current = { el, next: el.nextSibling };
    }
  };

  const moveTo = (target: number) => {
    if (!usable || target < 0 || target > count - 1 || target === index) return;
    captureOrigin();
    const list = Array.from(parent.children).filter((c) => c !== el);
    const ref = list[target] ?? null; // إدراج قبل العنصر الذي سيحتل الموضع التالي
    parent.insertBefore(el, target >= list.length ? null : ref);
    bump();
  };

  const restore = () => {
    const o = originRef.current;
    if (!o || o.el !== el || !parent) return;
    parent.insertBefore(el, o.next);
    originRef.current = null;
    bump();
  };

  const moved = originRef.current?.el === el;

  return (
    <div className={`gini-csi-alignpad${usable ? "" : " gini-csi-alignpad--off"}`}>
      <div className="gini-csi-alignpad__head">
        <span className="gini-csi-alignpad__title">ترتيب العنصر داخل الإطار</span>
        {usable && (
          <span className="gini-csi-order__pos">
            الموضع <bdi>{index + 1}</bdi> من <bdi>{count}</bdi>
          </span>
        )}
      </div>

      {usable ? (
        <>
          {/* شريط الإخوة — العنصر البنفسجي هو المحدَّد؛ انقر أي موضع لنقله إليه */}
          <div className="gini-csi-order__strip" dir="rtl" role="group" aria-label="مواضع الإخوة داخل الإطار">
            {siblings.map((sib, i) => (
              <button
                key={i}
                type="button"
                className={`gini-csi-order__dot${i === index ? " is-active" : ""}`}
                onClick={() => moveTo(i)}
                disabled={i === index}
                aria-label={i === index ? `العنصر الحالي — الموضع ${i + 1}` : `انقله إلى الموضع ${i + 1}`}
                title={i === index ? "العنصر الحالي" : `إلى الموضع ${i + 1}`}
              />
            ))}
          </div>

          <div className="gini-csi-order__btns">
            <button
              type="button"
              className="gini-csi-btn gini-csi-btn--sm"
              onClick={() => moveTo(index - 1)}
              disabled={index === 0}
            >
              قدّمه ↑
            </button>
            <button
              type="button"
              className="gini-csi-btn gini-csi-btn--sm"
              onClick={() => moveTo(index + 1)}
              disabled={index === count - 1}
            >
              أخّره ↓
            </button>
            <button
              type="button"
              className="gini-csi-btn gini-csi-btn--secondary gini-csi-btn--sm"
              onClick={() => moveTo(0)}
              disabled={index === 0}
            >
              اجعله الأول
            </button>
            <button
              type="button"
              className="gini-csi-btn gini-csi-btn--secondary gini-csi-btn--sm"
              onClick={() => moveTo(count - 1)}
              disabled={index === count - 1}
            >
              اجعله الأخير
            </button>
          </div>

          <div className="gini-csi-alignpad__head">
            <span className="gini-csi-alignpad__hint">
              يغيّر ترتيب HTML فعلياً داخل الإطار الأب — معاينة حيّة فورية.
            </span>
            {moved && (
              <button
                type="button"
                className="gini-csi-btn gini-csi-btn--ghost gini-csi-btn--sm"
                onClick={restore}
              >
                <IconReset />
                استرجاع الترتيب
              </button>
            )}
          </div>
        </>
      ) : (
        <span className="gini-csi-alignpad__hint">
          هذا العنصر بلا إطار أب صالح (body) — حدّد عنصراً داخل مكوّن.
        </span>
      )}
    </div>
  );
}

/* ── Inspect tab body ──────────────────────────────────────────────────── */
function InspectTab({
  active,
  selected,
  elementEdits,
  compEdits,
  typography,
  onStart,
  onEditColor,
  onEditFont,
  onRecord,
  componentRegistry,
  onAddColor,
  onReselect,
  copiedStyle,
  onCopyStyle,
  onPasteStyle,
  onStartPaste,
  onClearStyle,
  lookupToken,
}: {
  active: boolean;
  selected: { el: Element; label: string; colors: DetectedColor[] } | null;
  elementEdits: Map<string, string>;
  compEdits: ComponentEdit[];
  typography: TypographySnapshot | null;
  onStart: () => void;
  onEditColor: (el: Element, dc: DetectedColor) => void;
  onEditFont: (el: Element) => void;
  onRecord: (property: string, value: string) => void;
  componentRegistry: Map<string, DsComponentRef>;
  onAddColor: (el: Element, kind: "stroke" | "fill") => void;
  onReselect: (el: Element) => void;
  copiedStyle: CopiedStyle | null;
  onCopyStyle: (el: Element) => void;
  onPasteStyle: (el: Element) => void;
  onStartPaste: () => void;
  onClearStyle: () => void;
  lookupToken: (color: string) => string | null;
}) {
  return (
    <div className="gini-csi-inspect">
      <button
        type="button"
        className={`gini-csi-btn gini-csi-btn--primary gini-csi-btn--block${active ? " is-active" : ""}`}
        onClick={onStart}
      >
        <IconPicker />
        {active ? "اختر عنصراً من الصفحة…" : selected ? "فحص عنصر آخر" : "ابدأ فحص عنصر"}
      </button>

      {/* All edits made anywhere this session — copy them as one CSS bundle,
          reachable regardless of what's currently selected. */}
      {compEdits.length > 0 && <SessionEditsBlock entries={compEdits} />}

      {!selected && !active && (
        <p className="gini-csi-inspect__hint">
          فعّل الفحص ثم مرّر فوق أي عنصر في الموقع واضغط عليه لاستخراج ألوانه
          وربطها بالتوكنز.
        </p>
      )}

      {selected && (
        <div className="gini-csi-inspect__result">
          <div className="gini-csi-inspect__el">
            <span className="gini-csi-inspect__el-label">العنصر المحدد</span>
            <code>{selected.label}</code>
          </div>

          {/* الميزة الجديدة: ترتيب العنصر داخل إطاره — يغيّر ترتيب HTML */}
          <OrderControl key={selected.label} el={selected.el} />

          {/* Go to main component — only when the element renders a registered
              design-system component (detected via the React fiber tree). */}
          {(() => {
            const match = matchComponent(selected.el, componentRegistry);
            if (!match) return null;
            const { name, demoSlug, bitName, sourcePath } = match;
            return (
              <div className="gini-csi-maincomp">
                <div className="gini-csi-maincomp__head">
                  <span className="gini-csi-maincomp__icon" aria-hidden="true">
                    <IconComponent />
                  </span>
                  <span className="gini-csi-maincomp__name">{name}</span>
                  <span className="gini-csi-maincomp__tag">مكوّن من النظام</span>
                </div>
                <div className="gini-csi-maincomp__actions">
                  {demoSlug && (
                    <button
                      type="button"
                      className="gini-csi-btn gini-csi-btn--sm gini-csi-btn--primary"
                      onClick={() => window.open(`/${demoSlug}`, "_blank", "noopener")}
                    >
                      <IconComponent />
                      المكوّن الأساسي
                    </button>
                  )}
                  {bitName && (
                    <button
                      type="button"
                      className="gini-csi-btn gini-csi-btn--outline gini-csi-btn--sm"
                      onClick={() => window.open(bitUrl(bitName), "_blank", "noopener")}
                    >
                      Bit ↗
                    </button>
                  )}
                </div>
                {sourcePath && (
                  <code className="gini-csi-maincomp__src" dir="ltr">
                    {sourcePath}
                  </code>
                )}
              </div>
            );
          })()}

          {/* All edits made across THIS component instance's sub-elements —
              grouped by the instance root, so it never mixes two components. */}
          {(() => {
            const inst = matchComponentInstance(selected.el, componentRegistry);
            if (!inst) return null;
            const entries = compEdits.filter((e) => e.rootEl === inst.rootEl);
            if (entries.length === 0) return null;
            return <ComponentEditsBlock name={inst.ref.name} entries={entries} />;
          })()}

          <LayersNav selected={selected.el} onReselect={onReselect} />

          {/* Format painter — copy this element's style, paste onto another. */}
          <div className="gini-csi-painter">
            <button
              type="button"
              className="gini-csi-btn gini-csi-btn--secondary gini-csi-btn--sm gini-csi-btn--block"
              onClick={() => onCopyStyle(selected.el)}
            >
              <IconCopy />
              نسخ ستايل هذا العنصر
            </button>
            {copiedStyle && (
              <>
                <div className="gini-csi-painter__buf">
                  <span
                    className="gini-csi-painter__swatch"
                    style={{ background: copiedStyle.swatch }}
                    aria-hidden="true"
                  />
                  <span className="gini-csi-painter__meta">
                    <span className="gini-csi-painter__label">
                      منسوخ من <code>{copiedStyle.label}</code>
                    </span>
                    <span className="gini-csi-painter__props">
                      {Object.keys(copiedStyle.props).length} خصائص — اختر عنصراً للّصق
                    </span>
                  </span>
                  <button
                    type="button"
                    className="gini-csi-painter__clear"
                    onClick={onClearStyle}
                    aria-label="مسح الستايل المنسوخ"
                  >
                    ✕
                  </button>
                </div>
                <div className="gini-csi-painter__actions">
                  <button
                    type="button"
                    className="gini-csi-btn gini-csi-btn--sm gini-csi-btn--primary"
                    onClick={onStartPaste}
                  >
                    <IconPicker />
                    الصق على عنصر… (انقر العنصر)
                  </button>
                  <button
                    type="button"
                    className="gini-csi-btn gini-csi-btn--secondary gini-csi-btn--sm"
                    onClick={() => onPasteStyle(selected.el)}
                    title="لصق على العنصر المحدد حالياً"
                  >
                    على المُحدَّد
                  </button>
                </div>
              </>
            )}
          </div>
          {selected.colors.length === 0 ? (
            <div className="gini-csi-empty">لا ألوان ظاهرة على هذا العنصر.</div>
          ) : (
            <div className="gini-csi-detected">
              {selected.colors.map((dc) => {
                const varName = dc.isGradient ? null : lookupToken(dc.value);
                const editable =
                  dc.isGradient ||
                  varName !== null ||
                  SAFE_ELEMENT_PROPS.has(dc.property);
                return (
                  <DetectedRow
                    key={`${dc.property}-${dc.value}`}
                    dc={dc}
                    varName={varName}
                    editable={editable}
                    onEdit={() => onEditColor(selected.el, dc)}
                  />
                );
              })}
            </div>
          )}
          {(() => {
            const isSvg = selected.el instanceof SVGElement;
            const fillProp = isSvg ? "fill" : "background-color";
            const strokeProp = isSvg ? "stroke" : "border-color";
            const hasFill =
              elementHasProp(selected.colors, fillProp) ||
              (!isSvg && elementHasProp(selected.colors, "background-image"));
            const hasStroke = elementHasProp(selected.colors, strokeProp);
            if (hasFill && hasStroke) return null;
            return (
              <div className="gini-csi-addcolor">
                <span className="gini-csi-addcolor__label">
                  إضافة لون غير موجود لهذا العنصر
                </span>
                <div className="gini-csi-addcolor__row">
                  {!hasFill && (
                    <button
                      type="button"
                      className="gini-csi-btn gini-csi-btn--secondary gini-csi-btn--sm gini-csi-addcolor__btn"
                      onClick={() => onAddColor(selected.el, "fill")}
                    >
                      <span className="gini-csi-addcolor__plus" aria-hidden="true">
                        +
                      </span>
                      تعبئة (fill)
                    </button>
                  )}
                  {!hasStroke && (
                    <button
                      type="button"
                      className="gini-csi-btn gini-csi-btn--secondary gini-csi-btn--sm gini-csi-addcolor__btn"
                      onClick={() => onAddColor(selected.el, "stroke")}
                    >
                      <span className="gini-csi-addcolor__plus" aria-hidden="true">
                        +
                      </span>
                      ستروك (حدود)
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
          <BoxModelSection el={selected.el} onRecord={onRecord} />
          <ShadowSection el={selected.el} onRecord={onRecord} />
          <DetectedTypography
            el={selected.el}
            catalog={typography?.all ?? null}
            onEdit={() => onEditFont(selected.el)}
          />
          <CssCodeBlock
            selector={selected.label}
            colors={selected.colors}
            edits={elementEdits}
            typeClass={
              extractTypography(selected.el, typography?.all ?? undefined)
                .matchedClass
            }
          />
        </div>
      )}
    </div>
  );
}

/* Typography readout for the inspected element + an "edit font" entry point. */
function DetectedTypography({
  el,
  catalog,
  onEdit,
}: {
  el: Element;
  catalog: TypeStyle[] | null;
  onEdit: () => void;
}) {
  const dt = extractTypography(el, catalog ?? undefined);
  const editable = el instanceof HTMLElement;
  return (
    <div className="gini-csi-typo">
      <div className="gini-csi-typo__head">
        <span className="gini-csi-typo__title">
          <IconType /> الطباعة
        </span>
        {editable && (
          <button
            type="button"
            className="gini-csi-btn gini-csi-btn--sm"
            onClick={onEdit}
          >
            <IconEdit />
            تغيير الخط
          </button>
        )}
      </div>
      <div
        className="gini-csi-typo__sample"
        style={{
          fontFamily: dt.fontFamily,
          fontWeight: Number(dt.fontWeight) || undefined,
          fontSize: Math.min(parseFloat(dt.fontSize) || 16, 22),
          lineHeight: 1.2,
        }}
      >
        نموذج النص Ag 123
      </div>
      <dl className="gini-csi-typo__grid">
        <div>
          <dt>الخط</dt>
          <dd>{dt.primaryFamily}</dd>
        </div>
        <div>
          <dt>الحجم</dt>
          <dd dir="ltr">{dt.fontSize}</dd>
        </div>
        <div>
          <dt>الوزن</dt>
          <dd dir="ltr">{dt.fontWeight}</dd>
        </div>
        <div>
          <dt>ارتفاع السطر</dt>
          <dd dir="ltr">
            {lineHeightRatio(dt.lineHeight, parseFloat(dt.fontSize))}
            {/px$/.test(dt.lineHeight) ? ` · ${dt.lineHeight}` : ""}
          </dd>
        </div>
        {dt.matchedClass && (
          <div className="gini-csi-typo__match">
            <dt>النمط</dt>
            <dd dir="ltr">.{dt.matchedClass}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/* ── Spacing & alignment — a Figma/DevTools box-model editor (live) ───────── */
function BoxModelSection({
  el,
  onRecord,
}: {
  el: Element;
  onRecord: (property: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [perSide, setPerSide] = useState(false);
  const [perCorner, setPerCorner] = useState(false);
  const [bm, setBm] = useState<BoxModel>(() => extractBoxModel(el));
  const [dimW, setDimW] = useState("");
  const [dimH, setDimH] = useState("");
  const editable = el instanceof HTMLElement;

  useEffect(() => {
    setBm(extractBoxModel(el));
  }, [el, open]);

  // بذور حقلي الأبعاد من الحجم المعروض — حالة محلية حتى لا تقفز القيمة بسبب box-sizing
  useEffect(() => {
    const m = extractBoxModel(el);
    setDimW(String(m.width));
    setDimH(String(m.height));
  }, [el, open]);

  const apply = (prop: string, value: string) => {
    if (!editable) return;
    el.style.setProperty(prop, value);
    onRecord(prop, value);
    setBm(extractBoxModel(el));
  };
  // الأبعاد — عرض/ارتفاع العنصر بشكل حيّ (فارغ = أثناء الكتابة، لا نطبّق)
  const applyDim = (prop: "width" | "height", raw: string) => {
    if (!editable) return;
    if (prop === "width") setDimW(raw);
    else setDimH(raw);
    if (raw.trim() === "") return;
    const v = `${Number(raw) || 0}px`;
    el.style.setProperty(prop, v);
    onRecord(prop, v);
    setBm(extractBoxModel(el));
  };
  const resetDims = () => {
    if (!editable) return;
    el.style.setProperty("width", "auto");
    el.style.setProperty("height", "auto");
    onRecord("width", "auto");
    onRecord("height", "auto");
    const m = extractBoxModel(el);
    setBm(m);
    setDimW(String(m.width));
    setDimH(String(m.height));
  };
  const setSide = (group: "padding" | "margin", side: keyof Sides, n: number) =>
    apply(`${group}-${side}`, `${n}px`);
  const setHV = (group: "padding" | "margin", axis: "h" | "v", n: number) => {
    if (axis === "h") {
      apply(`${group}-left`, `${n}px`);
      apply(`${group}-right`, `${n}px`);
    } else {
      apply(`${group}-top`, `${n}px`);
      apply(`${group}-bottom`, `${n}px`);
    }
  };
  const pickAlign = (col: number, row: number) => {
    for (const d of gridToCss(col, row, bm)) apply(d.prop, d.value);
  };
  const grid = alignToGrid(bm);

  const setRadiusAll = (n: number) => apply("border-radius", `${n}px`);
  const CORNERS: { key: keyof Corners; prop: string; label: string }[] = [
    { key: "tl", prop: "border-top-left-radius", label: "↖" },
    { key: "tr", prop: "border-top-right-radius", label: "↗" },
    { key: "bl", prop: "border-bottom-left-radius", label: "↙" },
    { key: "br", prop: "border-bottom-right-radius", label: "↘" },
  ];

  // Flow = flex-direction (vertical/horizontal only). Enables flex if needed.
  const setFlow = (dir: "row" | "column") => {
    if (!bm.isFlex) apply("display", "flex");
    apply("flex-direction", dir);
  };
  const flowActive = bm.isFlex
    ? bm.flexDirection.startsWith("column")
      ? "column"
      : "row"
    : null;

  const sideField = (group: "padding" | "margin", side: keyof Sides, mod: string) => (
    <input
      type="number"
      className={`gini-csi-box__f gini-csi-box__f--${mod}`}
      value={bm[group][side]}
      disabled={!editable}
      onChange={(e) => setSide(group, side, Number(e.target.value) || 0)}
      aria-label={`${group}-${side}`}
    />
  );
  const hvField = (
    group: "padding" | "margin",
    axis: "h" | "v",
    value: number,
    icon: ReactNode,
  ) => (
    <label className="gini-csi-field">
      <span className="gini-csi-field__icon" aria-hidden="true">
        {icon}
      </span>
      <input
        type="number"
        value={value}
        disabled={!editable}
        onChange={(e) => setHV(group, axis, Number(e.target.value) || 0)}
      />
    </label>
  );
  const cornerField = (c: (typeof CORNERS)[number]) => (
    <label className="gini-csi-field" title={c.prop}>
      <span className="gini-csi-field__icon" aria-hidden="true">
        {c.label}
      </span>
      <input
        type="number"
        value={bm.radius[c.key]}
        disabled={!editable}
        onChange={(e) => apply(c.prop, `${Number(e.target.value) || 0}px`)}
      />
    </label>
  );

  return (
    <div className="gini-csi-box-sec">
      <button
        type="button"
        className="gini-csi-acc__head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={`gini-csi-acc__chev${open ? " is-open" : ""}`}
          aria-hidden="true"
        >
          <IconChevron />
        </span>
        <span className="gini-csi-box-sec__title">
          <IconBox /> المسافات والمحاذاة
        </span>
        <span className="gini-csi-box-sec__size" dir="ltr">
          {bm.width}×{bm.height}
        </span>
      </button>

      {open && (
        <div className="gini-csi-box-sec__body">
          {/* الأبعاد — عرض وارتفاع العنصر (تعديل حيّ) */}
          <div className="gini-csi-box-row">
            <span className="gini-csi-box-row__label">الأبعاد</span>
            <div className="gini-csi-dims">
              <label className="gini-csi-field" title="width">
                <span className="gini-csi-field__icon" aria-hidden="true">W</span>
                <input
                  type="number"
                  value={dimW}
                  disabled={!editable}
                  onChange={(e) => applyDim("width", e.target.value)}
                  aria-label="العرض"
                />
              </label>
              <label className="gini-csi-field" title="height">
                <span className="gini-csi-field__icon" aria-hidden="true">H</span>
                <input
                  type="number"
                  value={dimH}
                  disabled={!editable}
                  onChange={(e) => applyDim("height", e.target.value)}
                  aria-label="الارتفاع"
                />
              </label>
              <button
                type="button"
                className="gini-csi-dims__reset"
                disabled={!editable}
                onClick={resetDims}
                data-tip="إرجاع تلقائي"
              >
                auto
              </button>
            </div>
          </div>
          {/* Flow — content direction (vertical / horizontal only) */}
          <div className="gini-csi-box-row">
            <span className="gini-csi-box-row__label">التدفّق (Flow)</span>
            <div className="gini-csi-seg gini-csi-seg--sm">
              <button
                type="button"
                className={`gini-csi-seg__btn${flowActive === "column" ? " is-active" : ""}`}
                onClick={() => setFlow("column")}
                disabled={!editable}
                aria-label="عمودي"
                data-tip="عمودي"
              >
                <IconFlowV />
              </button>
              <button
                type="button"
                className={`gini-csi-seg__btn${flowActive === "row" ? " is-active" : ""}`}
                onClick={() => setFlow("row")}
                disabled={!editable}
                aria-label="أفقي"
                data-tip="أفقي"
              >
                <IconFlowH />
              </button>
            </div>
          </div>

          {/* Alignment (3×3 grid) + Gap — Figma auto-layout style */}
          <div className="gini-csi-al">
            <div className="gini-csi-al__group">
              <span className="gini-csi-al__label">المحاذاة</span>
              <div className="gini-csi-align" dir="ltr">
                {[0, 1, 2].map((row) =>
                  [0, 1, 2].map((col) => {
                    const active = grid.col === col && grid.row === row;
                    return (
                      <button
                        key={`${row}-${col}`}
                        type="button"
                        className={`gini-csi-align__cell${active ? " is-active" : ""}`}
                        onClick={() => pickAlign(col, row)}
                        disabled={!editable}
                        aria-label={`محاذاة ${col + 1}×${row + 1}`}
                      >
                        {active ? (
                          <span className="gini-csi-align__bars" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                          </span>
                        ) : (
                          <span className="gini-csi-align__dot" aria-hidden="true" />
                        )}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>
            <div className="gini-csi-al__group">
              <span className="gini-csi-al__label">المسافة (Gap)</span>
              <label className="gini-csi-field">
                <span className="gini-csi-field__icon" aria-hidden="true">
                  <IconGap />
                </span>
                <input
                  type="number"
                  value={bm.gap}
                  disabled={!editable}
                  onChange={(e) => apply("gap", `${Number(e.target.value) || 0}px`)}
                />
              </label>
            </div>
          </div>

          {/* Padding — H / V (+ per-side toggle) */}
          <div className="gini-csi-box-head">
            <span className="gini-csi-box-row__label">الحشو (Padding)</span>
            <button
              type="button"
              className={`gini-csi-iconbtn gini-csi-sides-tgl${perSide ? " is-active" : ""}`}
              onClick={() => setPerSide((p) => !p)}
              disabled={!editable}
              title="تحرير كل جهة على حدة"
              aria-pressed={perSide}
            >
              <IconSides />
            </button>
          </div>

          {perSide ? (
            <div className="gini-csi-box" data-disabled={!editable}>
              <span className="gini-csi-box__tag gini-csi-box__tag--m">margin</span>
              {sideField("margin", "top", "t")}
              {sideField("margin", "right", "r")}
              {sideField("margin", "bottom", "b")}
              {sideField("margin", "left", "l")}
              <div className="gini-csi-box__pad">
                <span className="gini-csi-box__tag gini-csi-box__tag--p">padding</span>
                {sideField("padding", "top", "t")}
                {sideField("padding", "right", "r")}
                {sideField("padding", "bottom", "b")}
                {sideField("padding", "left", "l")}
                <div className="gini-csi-box__content" dir="ltr">
                  {bm.width} × {bm.height}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="gini-csi-pair">
                {hvField("padding", "h", bm.padding.left, <IconPadH />)}
                {hvField("padding", "v", bm.padding.top, <IconPadV />)}
              </div>
              <span className="gini-csi-box-row__label gini-csi-box-row__label--mt">
                الهامش (Margin)
              </span>
              <div className="gini-csi-pair">
                {hvField("margin", "h", bm.margin.left, <IconPadH />)}
                {hvField("margin", "v", bm.margin.top, <IconPadV />)}
              </div>
            </>
          )}

          {/* Border radius (all corners, or per-corner) */}
          <div className="gini-csi-box-head">
            <span className="gini-csi-box-row__label">نصف القطر (Radius)</span>
            <button
              type="button"
              className={`gini-csi-iconbtn gini-csi-sides-tgl${perCorner ? " is-active" : ""}`}
              onClick={() => setPerCorner((p) => !p)}
              disabled={!editable}
              title="تحرير كل زاوية على حدة"
              aria-pressed={perCorner}
            >
              <IconSides />
            </button>
          </div>
          {perCorner ? (
            <div className="gini-csi-pair">
              {cornerField(CORNERS[0])}
              {cornerField(CORNERS[1])}
              {cornerField(CORNERS[2])}
              {cornerField(CORNERS[3])}
            </div>
          ) : (
            <label className="gini-csi-field">
              <span className="gini-csi-field__icon" aria-hidden="true">
                <IconRadius />
              </span>
              <input
                type="number"
                value={bm.radius.tl}
                disabled={!editable}
                onChange={(e) => setRadiusAll(Number(e.target.value) || 0)}
              />
            </label>
          )}

          {/* Clip content (overflow) */}
          <button
            type="button"
            className="gini-csi-clip"
            onClick={() => apply("overflow", bm.clip ? "visible" : "hidden")}
            disabled={!editable}
            aria-pressed={bm.clip}
          >
            <span
              className={`gini-csi-check${bm.clip ? " is-on" : ""}`}
              aria-hidden="true"
            >
              {bm.clip && <IconCheck />}
            </span>
            قص المحتوى الزائد
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Box-shadow editor — live-edit the inspected element's shadow ─────────── */
interface ShadowParts {
  inset: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string; // rgb()/rgba()/hex — kept verbatim so values round-trip
}

const DEFAULT_SHADOW: ShadowParts = {
  inset: false,
  x: 0,
  y: 4,
  blur: 12,
  spread: -2,
  color: "rgba(0, 0, 0, 0.16)",
};

const SHADOW_PRESETS: { label: string; parts: ShadowParts | null }[] = [
  { label: "بدون", parts: null },
  { label: "S", parts: { inset: false, x: 0, y: 1, blur: 2, spread: 0, color: "rgba(0, 0, 0, 0.12)" } },
  { label: "M", parts: { inset: false, x: 0, y: 4, blur: 12, spread: -2, color: "rgba(0, 0, 0, 0.14)" } },
  { label: "L", parts: { inset: false, x: 0, y: 10, blur: 24, spread: -4, color: "rgba(0, 0, 0, 0.18)" } },
  { label: "XL", parts: { inset: false, x: 0, y: 22, blur: 48, spread: -8, color: "rgba(0, 0, 0, 0.22)" } },
];

/** Parse the FIRST layer of a (computed or inline) box-shadow string. */
function parseShadow(value: string): ShadowParts | null {
  if (!value || value === "none") return null;
  // first layer — split on commas that are NOT inside parentheses
  const first = value.split(/,(?![^(]*\))/)[0].trim();
  if (!first) return null;
  const inset = /(^|\s)inset(\s|$)/.test(first);
  let rest = first.replace(/\binset\b/g, " ");
  const cm = rest.match(/rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-fA-F]{3,8}/);
  const color = cm ? cm[0] : "rgba(0, 0, 0, 0.25)";
  if (cm) rest = rest.replace(cm[0], " ");
  const nums = (rest.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const [x = 0, y = 0, blur = 0, spread = 0] = nums;
  return { inset, x, y, blur, spread, color };
}

function shadowToCss(p: ShadowParts): string {
  return `${p.inset ? "inset " : ""}${p.x}px ${p.y}px ${p.blur}px ${p.spread}px ${p.color}`;
}

function ShadowSection({
  el,
  onRecord,
}: {
  el: Element;
  onRecord: (property: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const editable = el instanceof HTMLElement;
  const read = useCallback(
    () => parseShadow(getComputedStyle(el).boxShadow),
    [el],
  );
  const [sh, setSh] = useState<ShadowParts | null>(() => read());

  useEffect(() => {
    setSh(read());
  }, [read, open]);

  const apply = (next: ShadowParts | null) => {
    if (!editable) return;
    const css = next ? shadowToCss(next) : "none";
    el.style.boxShadow = css;
    onRecord("box-shadow", css);
    setSh(next);
  };
  const patch = (p: Partial<ShadowParts>) =>
    apply({ ...(sh ?? DEFAULT_SHADOW), ...p });

  const cur = sh ?? DEFAULT_SHADOW;
  const rgba = parseAnyColor(cur.color) ?? { r: 0, g: 0, b: 0, a: 0.25 };
  const hex =
    "#" +
    [rgba.r, rgba.g, rgba.b]
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("");
  const alphaPct = Math.round((rgba.a ?? 1) * 100);
  const setColor = (h: string, a: number) => {
    const c = parseAnyColor(h) ?? { r: 0, g: 0, b: 0, a: 1 };
    patch({ color: formatRgb({ r: c.r, g: c.g, b: c.b, a }) });
  };

  const NUMS: { key: "x" | "y" | "blur" | "spread"; label: string }[] = [
    { key: "x", label: "X" },
    { key: "y", label: "Y" },
    { key: "blur", label: "B" },
    { key: "spread", label: "S" },
  ];

  return (
    <div className="gini-csi-box-sec">
      <button
        type="button"
        className="gini-csi-acc__head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={`gini-csi-acc__chev${open ? " is-open" : ""}`}
          aria-hidden="true"
        >
          <IconChevron />
        </span>
        <span className="gini-csi-box-sec__title">
          <IconShadow /> الظل
        </span>
        <span className="gini-csi-box-sec__size" dir="ltr">
          {sh ? `${sh.x},${sh.y} · ${sh.blur}` : "بدون"}
        </span>
      </button>

      {open && (
        <div className="gini-csi-box-sec__body">
          {/* Quick elevation presets */}
          <div className="gini-csi-box-row">
            <span className="gini-csi-box-row__label">جاهز</span>
            <div className="gini-csi-seg gini-csi-seg--sm">
              {SHADOW_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="gini-csi-seg__btn"
                  disabled={!editable}
                  onClick={() => apply(p.parts)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Offset X/Y · blur · spread */}
          <div className="gini-csi-box-row">
            <span className="gini-csi-box-row__label">إزاحة · تمويه · انتشار</span>
            <div className="gini-csi-shadow__nums">
              {NUMS.map((n) => (
                <label key={n.key} className="gini-csi-field" title={n.key}>
                  <span className="gini-csi-field__icon" aria-hidden="true">
                    {n.label}
                  </span>
                  <input
                    type="number"
                    value={cur[n.key]}
                    disabled={!editable}
                    onChange={(e) =>
                      patch({ [n.key]: Number(e.target.value) || 0 } as Partial<ShadowParts>)
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Color + alpha */}
          <div className="gini-csi-box-row">
            <span className="gini-csi-box-row__label">اللون والشفافية</span>
            <div className="gini-csi-shadow__color">
              <span
                className="gini-csi-shadow__sw"
                style={{ background: cur.color }}
                aria-hidden="true"
              />
              <input
                type="color"
                className="gini-csi-shadow__picker"
                value={hex}
                disabled={!editable}
                onChange={(e) => setColor(e.target.value, rgba.a ?? 1)}
                aria-label="لون الظل"
              />
              <label className="gini-csi-field gini-csi-field--alpha">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={alphaPct}
                  disabled={!editable}
                  onChange={(e) =>
                    setColor(
                      hex,
                      Math.min(100, Math.max(0, Number(e.target.value) || 0)) / 100,
                    )
                  }
                />
                <span className="gini-csi-field__icon" aria-hidden="true">
                  %
                </span>
              </label>
            </div>
          </div>

          <label className="gini-csi-shadow__inset">
            <input
              type="checkbox"
              checked={cur.inset}
              disabled={!editable}
              onChange={(e) => patch({ inset: e.target.checked })}
            />
            <span>ظل داخلي (inset)</span>
          </label>

          {!editable && (
            <p className="gini-csi-inspect__hint">
              هذا العنصر غير قابل للتعديل المباشر.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* "نسخ كل تعديلات هذا المكوّن" — bundle every recorded edit across the
   sub-elements of ONE component instance into a single CSS snippet (one rule
   per edited sub-element). Only ever covers a single component. */
function buildComponentCss(name: string, entries: ComponentEdit[]): string {
  const blocks = entries.map((e) => {
    const lines = [...e.props].map(([p, v]) => `  ${p}: ${v};`);
    return `${e.selector} {\n${lines.join("\n")}\n}`;
  });
  return `/* ${name} — ${entries.length} عنصر معدّل */\n${blocks.join("\n\n")}`;
}

function ComponentEditsBlock({
  name,
  entries,
}: {
  name: string;
  entries: ComponentEdit[];
}) {
  const [copied, setCopied] = useState(false);
  const total = entries.reduce((n, e) => n + e.props.size, 0);
  const copy = () => {
    void navigator.clipboard?.writeText(buildComponentCss(name, entries));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="gini-csi-compedits">
      <div className="gini-csi-compedits__head">
        <span className="gini-csi-compedits__title">
          <IconComponent />
          تعديلات «{name}»
        </span>
        <span className="gini-csi-compedits__count">
          {entries.length} عنصر · {total} خاصية
        </span>
      </div>
      <ul className="gini-csi-compedits__list">
        {entries.map((e, i) => (
          <li key={i} className="gini-csi-compedits__item">
            <code dir="ltr">{e.selector}</code>
            <span className="gini-csi-compedits__n">{e.props.size}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="gini-csi-btn gini-csi-btn--primary gini-csi-btn--block gini-csi-btn--sm"
        onClick={copy}
      >
        {copied ? <IconCheck /> : <IconCopy />}
        نسخ كل تعديلات هذا المكوّن
      </button>
    </div>
  );
}

/* "نسخ كل تعديلات الجلسة" — bundle EVERY recorded edit across ALL component
   instances touched this session into one CSS snippet, grouped per instance
   (each group is one component's sub-element rules). Built on buildComponentCss
   so the output format matches the per-component copy exactly. */
function buildSessionCss(all: ComponentEdit[]): string {
  const byRoot = new Map<Element, ComponentEdit[]>();
  const groups: ComponentEdit[][] = [];
  for (const e of all) {
    let arr = byRoot.get(e.rootEl);
    if (!arr) {
      arr = [];
      byRoot.set(e.rootEl, arr);
      groups.push(arr);
    }
    arr.push(e);
  }
  const props = all.reduce((n, e) => n + e.props.size, 0);
  const header = `/* ===== كل تعديلات الجلسة: ${groups.length} مجموعة · ${all.length} عنصر · ${props} خاصية ===== */`;
  const sections = groups.map((g) => buildComponentCss(g[0]?.name ?? "عنصر", g));
  return `${header}\n\n${sections.join("\n\n")}`;
}

function SessionEditsBlock({ entries }: { entries: ComponentEdit[] }) {
  const [copied, setCopied] = useState(false);
  const comps = new Set(entries.map((e) => e.rootEl)).size;
  const props = entries.reduce((n, e) => n + e.props.size, 0);
  const copy = () => {
    void navigator.clipboard?.writeText(buildSessionCss(entries));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="gini-csi-compedits gini-csi-compedits--session">
      <div className="gini-csi-compedits__head">
        <span className="gini-csi-compedits__title">
          <IconComponent />
          كل تعديلات الجلسة
        </span>
        <span className="gini-csi-compedits__count">
          {comps} مجموعة · {entries.length} عنصر · {props} خاصية
        </span>
      </div>
      <button
        type="button"
        className="gini-csi-btn gini-csi-btn--primary gini-csi-btn--block gini-csi-btn--sm"
        onClick={copy}
      >
        {copied ? <IconCheck /> : <IconCopy />}
        نسخ كل تعديلات الجلسة
      </button>
    </div>
  );
}

/* "نسخ ككود CSS" — the inspected element's colors as a CSS rule. Shows the
   element's current declarable color properties (background/text/border/outline/
   fill/stroke/gradient), with any live edits applied. Updates as you edit. */
const CSS_DECLARABLE = new Set([
  "background-color",
  "color",
  "border-color",
  "outline-color",
  "fill",
  "stroke",
  "background-image",
]);

function CssCodeBlock({
  selector,
  colors,
  edits,
  typeClass,
}: {
  selector: string;
  colors: DetectedColor[];
  edits: Map<string, string>;
  /** Type-style utility the element's typography matches (e.g. "t-body-md-regular"). */
  typeClass?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const seen = new Set<string>();
  const lines: string[] = [];
  for (const dc of colors) {
    if (!CSS_DECLARABLE.has(dc.property) || seen.has(dc.property)) continue;
    seen.add(dc.property);
    lines.push(`  ${dc.property}: ${edits.get(dc.property) ?? dc.value};`);
  }
  // Any edit whose property wasn't among the detected colors (font-size,
  // font-weight, line-height, font-family, box-shadow, …).
  for (const [p, v] of edits) {
    if (!seen.has(p)) {
      seen.add(p);
      lines.push(`  ${p}: ${v};`);
    }
  }
  if (lines.length === 0 && !typeClass) return null;
  // Surface the matched type-style utility so it can be applied as a class
  // (the Gini way) instead of the raw font-* declarations above.
  if (typeClass) lines.unshift(`  /* نمط النص: .${typeClass} */`);
  const css = `${selector} {\n${lines.join("\n")}\n}`;

  const copy = () => {
    void navigator.clipboard?.writeText(css);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="gini-csi-csscode">
      <div className="gini-csi-csscode__head">
        <span className="gini-csi-csscode__title">كود CSS للعنصر</span>
        <button
          type="button"
          className="gini-csi-btn gini-csi-btn--primary gini-csi-btn--sm"
          onClick={copy}
        >
          {copied ? <IconCheck /> : <IconCopy />}
          نسخ ككود CSS
        </button>
      </div>
      <pre className="gini-csi-csscode__pre">{css}</pre>
    </div>
  );
}

function DetectedRow({
  dc,
  varName,
  editable,
  onEdit,
}: {
  dc: DetectedColor;
  varName: string | null;
  editable: boolean;
  onEdit: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = varName
      ? `var(${varName})`
      : dc.isGradient
        ? dc.value
        : dc.hex;
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1100);
  };
  return (
    <div className="gini-csi-detected__row">
      <span
        className="gini-csi-detected__swatch"
        style={{ background: dc.value, color: readableInk(dc.hex || "#fff") }}
      />
      <div className="gini-csi-detected__info">
        <span className="gini-csi-detected__label">{dc.label}</span>
        <div className="gini-csi-detected__meta">
          <span className="gini-csi-detected__hex">
            {dc.isGradient ? "تدرّج لوني" : dc.hex}
          </span>
          {dc.isGradient ? (
            <span className="gini-csi-chip gini-csi-chip--grad">CSS gradient</span>
          ) : varName ? (
            <span className="gini-csi-chip gini-csi-chip--link">
              {`var(${varName})`}
            </span>
          ) : (
            <span className="gini-csi-chip gini-csi-chip--warn">ليس توكن</span>
          )}
        </div>
      </div>
      <div className="gini-csi-detected__actions">
        <button
          type="button"
          className="gini-csi-iconbtn"
          onClick={copy}
          aria-label="نسخ"
          title="نسخ"
        >
          {copied ? <IconCheck /> : <IconCopy />}
        </button>
        {editable && (
          <button
            type="button"
            className="gini-csi-iconbtn"
            onClick={onEdit}
            aria-label="تعديل"
            title="تعديل"
          >
            <IconEdit />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Export tab body ───────────────────────────────────────────────────── */
function ExportTab({
  data,
  copied,
  typeChangeCount,
  onDownloadColors,
  onDownloadTypography,
  onCopy,
  onResetAll,
  onResetToken,
  hasChanges,
}: {
  data: ReturnType<ReturnType<typeof useColorSystem>["buildExport"]> | null;
  copied: boolean;
  typeChangeCount: number;
  onDownloadColors: () => void;
  onDownloadTypography: () => void;
  onCopy: () => void;
  onResetAll: () => void;
  onResetToken: (varName: string, theme: "light" | "dark") => void;
  hasChanges: boolean;
}) {
  // Two-step destructive confirm: first click arms, second (within 3s) commits.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);

  if (!data) return <div className="gini-csi-empty">جارٍ التحضير…</div>;
  const primitiveCount = Object.values(data.primitive).reduce(
    (n, g) => n + Object.keys(g).length,
    0,
  );
  const tokenCount = Object.values(data.tokens).reduce(
    (n, g) => n + Object.keys(g).length,
    0,
  );
  const totalChanges = data.changes.length + typeChangeCount;

  return (
    <div className="gini-csi-changes">
      <div className="gini-csi-export__stats">
        <Stat n={primitiveCount} label="لون أساسي" />
        <Stat n={tokenCount} label="توكن دلالي" />
        <Stat n={totalChanges} label="تعديل" highlight={hasChanges} />
      </div>

      {/* ── المراجعة أولاً: كل تغيير صفّ قابل للاسترجاع ── */}
      {!hasChanges ? (
        <div className="gini-csi-zero">
          <span className="gini-csi-zero__icon" aria-hidden="true">
            <IconCheck />
          </span>
          <span className="gini-csi-zero__title">لا تغييرات بعد</span>
          <span className="gini-csi-zero__desc">
            عدّل أي توكن من «الألوان» أو افحص عنصراً من الصفحة — وستجد كل
            تغييراتك هنا للمراجعة والتصدير.
          </span>
        </div>
      ) : (
        <>
          {data.changes.length > 0 && (
            <div className="gini-csi-changes__sec">
              <span className="gini-csi-changes__sechead">
                الألوان
                <span className="gini-csi-group__count">{data.changes.length}</span>
              </span>
              {data.changes.map((c) => (
                <div className="gini-csi-diff" key={`${c.theme}-${c.name}`}>
                  <button
                    type="button"
                    className="gini-csi-diff__revert"
                    onClick={() => onResetToken(c.name, c.theme)}
                    aria-label={`استرجاع ${c.name}`}
                    title="استرجاع هذا التوكن"
                  >
                    <IconReset />
                  </button>
                  <span
                    className={`gini-csi-themetag gini-csi-themetag--${c.theme}`}
                    title={c.theme === "dark" ? "الوضع الداكن" : "الوضع الفاتح"}
                  >
                    {c.theme === "dark" ? "D" : "L"}
                  </span>
                  <span className="gini-csi-diff__name">{c.name}</span>
                  <span className="gini-csi-diff__swatches">
                    <span
                      className="gini-csi-diff__sw"
                      style={{ background: c.oldValue }}
                      title={c.oldValue}
                    />
                    <span className="gini-csi-diff__arrow" aria-hidden="true">
                      <IconChevronSmall />
                    </span>
                    <span
                      className="gini-csi-diff__sw"
                      style={{ background: c.newValue }}
                      title={c.newValue}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
          {typeChangeCount > 0 && (
            <div className="gini-csi-changes__sec">
              <span className="gini-csi-changes__sechead">
                الخطوط
                <span className="gini-csi-group__count">{typeChangeCount}</span>
              </span>
              <span className="gini-csi-alignpad__hint">
                أنماط نص معدّلة — راجعها من تبويب «الخطوط».
              </span>
            </div>
          )}
        </>
      )}

      {/* ── التصدير ── */}
      <div className="gini-csi-changes__actions">
        <button
          type="button"
          className="gini-csi-btn gini-csi-btn--primary gini-csi-btn--block"
          onClick={onDownloadColors}
        >
          <IconDownload />
          تنزيل الألوان (JSON)
        </button>
        <div className="gini-csi-changes__row">
          <button
            type="button"
            className="gini-csi-btn gini-csi-btn--secondary"
            onClick={onDownloadTypography}
          >
            <IconType />
            تنزيل الخطوط
          </button>
          <button
            type="button"
            className="gini-csi-btn gini-csi-btn--secondary"
            onClick={onCopy}
          >
            {copied ? <IconCheck /> : <IconCopy />}
            {copied ? "نُسخ" : "نسخ JSON"}
          </button>
        </div>
        <button
          type="button"
          className={`gini-csi-btn gini-csi-btn--danger gini-csi-btn--block${armed ? " is-armed" : ""}`}
          onClick={() => {
            if (!armed) return setArmed(true);
            setArmed(false);
            onResetAll();
          }}
          disabled={!hasChanges}
        >
          <IconReset />
          {armed ? "متأكد؟ اضغط للتأكيد" : "استرجاع الكل"}
        </button>
      </div>

      <pre className="gini-csi-export__json">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function Stat({
  n,
  label,
  highlight,
}: {
  n: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={`gini-csi-stat${highlight ? " is-hot" : ""}`}>
      <span className="gini-csi-stat__n">{n}</span>
      <span className="gini-csi-stat__label">{label}</span>
    </div>
  );
}

function IconChevronSmall() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/* ── Font edit view — pick a type style / family, or tweak manually ──────── */
// The full Rubik ramp loaded by the app (see layout.tsx → next/font). The
// inspector is a dev tool, so it deliberately exposes every available weight —
// not just the 400/500 the Gini design system ships in production.
const FONT_WEIGHTS: { v: string; l: string }[] = [
  { v: "300", l: "Light" },
  { v: "400", l: "Regular" },
  { v: "500", l: "Medium" },
  { v: "600", l: "SemiBold" },
  { v: "700", l: "Bold" },
];

function FontEditView({
  el,
  typography,
  onRecord,
  onClose,
}: {
  el: HTMLElement;
  typography: TypographySnapshot | null;
  onRecord: (property: string, value: string) => void;
  onClose: () => void;
}) {
  const before = useRef({
    fontSize: el.style.fontSize,
    fontWeight: el.style.fontWeight,
    lineHeight: el.style.lineHeight,
    fontFamily: el.style.fontFamily,
  });
  const detected = useMemo(
    () => extractTypography(el, typography?.all),
    [el, typography],
  );
  const [mode, setMode] = useState<"style" | "family" | "manual">("style");
  const [matched, setMatched] = useState<string | null>(detected.matchedClass);
  const [selFamily, setSelFamily] = useState<string | null>(null);
  const [size, setSize] = useState(Math.round(parseFloat(detected.fontSize)) || 16);
  const [weight, setWeight] = useState(detected.fontWeight || "400");
  const [lh, setLh] = useState(detected.lineHeight);

  const setProp = (property: string, value: string) => {
    el.style.setProperty(property, value);
    onRecord(property, value);
  };

  const applyStyle = (s: TypeStyle) => {
    for (const [k, v] of Object.entries(typeStyleProps(s))) setProp(k, v);
    setMatched(s.className);
    setSize(Math.round(parseFloat(s.fontSize)) || size);
    setWeight(s.fontWeight);
    setLh(s.lineHeight);
  };
  const applyFamily = (f: FontFamilyToken) => {
    setProp("font-family", `var(${f.varName})`);
    setSelFamily(f.varName);
  };
  const applySize = (n: number) => {
    setSize(n);
    setProp("font-size", `${n}px`);
    setMatched(null);
  };
  const applyWeight = (w: string) => {
    setWeight(w);
    setProp("font-weight", w);
    setMatched(null);
  };
  const applyLh = (v: string) => {
    setLh(v);
    if (v.trim()) setProp("line-height", v.trim());
    setMatched(null);
  };

  const cancel = () => {
    const b = before.current;
    const restore = (prop: string, v: string) => {
      if (v) el.style.setProperty(prop, v);
      else el.style.removeProperty(prop);
    };
    restore("font-size", b.fontSize);
    restore("font-weight", b.fontWeight);
    restore("line-height", b.lineHeight);
    restore("font-family", b.fontFamily);
    onClose();
  };

  return (
    <div className="gini-csi-edit">
      <button type="button" className="gini-csi-edit__back" onClick={cancel}>
        ← رجوع
      </button>
      <div className="gini-csi-editmeta">
        <span className="gini-csi-chip gini-csi-chip--kind">تغيير خط هذا العنصر</span>
        <code className="gini-csi-editmeta__value">{describeElement(el)}</code>
      </div>

      <div className="gini-csi-seg" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "style"}
          className={`gini-csi-seg__btn${mode === "style" ? " is-active" : ""}`}
          onClick={() => setMode("style")}
        >
          نمط النص
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "family"}
          className={`gini-csi-seg__btn${mode === "family" ? " is-active" : ""}`}
          onClick={() => setMode("family")}
        >
          الخط
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "manual"}
          className={`gini-csi-seg__btn${mode === "manual" ? " is-active" : ""}`}
          onClick={() => setMode("manual")}
        >
          يدوي
        </button>
      </div>

      {mode === "style" ? (
        typography ? (
          <TypeStylePalette
            groups={typography.styles}
            selectedClass={matched}
            onPick={applyStyle}
          />
        ) : (
          <div className="gini-csi-empty">جارٍ قراءة الأنماط…</div>
        )
      ) : mode === "family" ? (
        <div className="gini-csi-fontfam">
          {typography && typography.fonts.length > 0 ? (
            typography.fonts.map((f) => (
              <button
                key={f.varName}
                type="button"
                className={`gini-csi-fontfam__item${selFamily === f.varName ? " is-selected" : ""}`}
                onClick={() => applyFamily(f)}
              >
                <span className="gini-csi-fontfam__name">--{f.name}</span>
                <span
                  className="gini-csi-fontfam__sample"
                  style={{ fontFamily: f.stack }}
                >
                  {f.primary} · أبجد Ag
                </span>
              </button>
            ))
          ) : (
            <div className="gini-csi-empty">لا توجد عائلات خطوط في النظام.</div>
          )}
        </div>
      ) : (
        <div className="gini-csi-fontman">
          <label className="gini-csi-fontman__field">
            <span>الحجم (px)</span>
            <input
              type="number"
              min={8}
              max={120}
              value={size}
              onChange={(e) => applySize(Number(e.target.value) || size)}
            />
          </label>
          <div className="gini-csi-fontman__field">
            <span>الوزن</span>
            <div className="gini-csi-seg gini-csi-seg--sm gini-csi-seg--weights">
              {FONT_WEIGHTS.map((w) => (
                <button
                  key={w.v}
                  type="button"
                  title={w.l}
                  style={{ fontWeight: Number(w.v) }}
                  className={`gini-csi-seg__btn${weight === w.v ? " is-active" : ""}`}
                  onClick={() => applyWeight(w.v)}
                >
                  {w.v}
                </button>
              ))}
            </div>
          </div>
          <label className="gini-csi-fontman__field">
            <span>ارتفاع السطر</span>
            <input
              type="text"
              dir="ltr"
              value={lh}
              onChange={(e) => applyLh(e.target.value)}
              spellCheck={false}
            />
          </label>
        </div>
      )}

      <div className="gini-csi-picker__actions">
        <button
          type="button"
          className="gini-csi-btn gini-csi-btn--primary"
          onClick={onClose}
        >
          تطبيق
        </button>
        <button
          type="button"
          className="gini-csi-btn gini-csi-btn--ghost"
          onClick={cancel}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

/* ── Typography tab — browse the scale + font tokens; click a style to edit ─ */
function TypographyTab({
  typography,
  editedClasses,
  onEditStyle,
}: {
  typography: TypographySnapshot | null;
  editedClasses: Set<string>;
  onEditStyle: (s: TypeStyle) => void;
}) {
  if (!typography) {
    return <div className="gini-csi-empty">جارٍ قراءة الخطوط…</div>;
  }
  return (
    <div className="gini-csi-typotab">
      <p className="gini-csi-inspect__hint">
        أنماط النص في النظام — اضغط أي نمط لتعديل حجمه ووزنه وارتفاع سطره (يُطبّق
        على كل العناصر التي تستخدمه). لتغيير خط عنصر واحد، افتح «فحص عنصر».
      </p>
      {typography.fonts.length > 0 && (
        <div className="gini-csi-fonttokens">
          <span className="gini-csi-group__name">عائلات الخطوط</span>
          {typography.fonts.map((f) => (
            <div
              key={f.varName}
              className="gini-csi-fonttokens__row"
              style={{ fontFamily: f.stack }}
            >
              <code dir="ltr">--{f.name}</code>
              <span>{f.primary}</span>
            </div>
          ))}
        </div>
      )}
      <TypeStylePalette
        groups={typography.styles}
        selectedClass={null}
        editedClasses={editedClasses}
        onPick={onEditStyle}
      />
    </div>
  );
}

/* ── Global type-style editor (size / weight / line-height) ──────────────── */
function TypeStyleEditView({
  className,
  typography,
  override,
  onApply,
  onReset,
  onClose,
}: {
  className: string;
  typography: TypographySnapshot | null;
  override: TypeOverride | undefined;
  onApply: (patch: Partial<Omit<TypeOverride, "className">>) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const style = typography?.all.find((s) => s.className === className);
  const [size, setSize] = useState(
    Math.round(parseFloat(override?.fontSize ?? style?.fontSize ?? "16")) || 16,
  );
  const [weight, setWeight] = useState(
    override?.fontWeight ?? style?.fontWeight ?? "400",
  );
  const [lh, setLh] = useState(
    override?.lineHeight ??
      lineHeightRatio(style?.lineHeight ?? "1.2", style?.px ?? 16),
  );

  const applySize = (n: number) => {
    setSize(n);
    onApply({ fontSize: `${n}px` });
  };
  const applyWeight = (w: string) => {
    setWeight(w);
    onApply({ fontWeight: w });
  };
  const applyLh = (v: string) => {
    setLh(v);
    if (v.trim()) onApply({ lineHeight: v.trim() });
  };

  return (
    <div className="gini-csi-edit">
      <button type="button" className="gini-csi-edit__back" onClick={onClose}>
        ← رجوع
      </button>
      <div className="gini-csi-editmeta">
        <span className="gini-csi-chip gini-csi-chip--kind">تعديل نمط نص</span>
        <span className="gini-csi-chip">{style?.group}</span>
        <code className="gini-csi-editmeta__value">.{className}</code>
      </div>

      <div
        className="gini-csi-typo__sample"
        style={{
          fontSize: Math.min(size, 28),
          fontWeight: Number(weight) || undefined,
          lineHeight: lh || undefined,
          fontFamily: style?.fontFamily,
        }}
      >
        نموذج النص Ag 123
      </div>

      <div className="gini-csi-fontman">
        <label className="gini-csi-fontman__field">
          <span>الحجم (px)</span>
          <input
            type="number"
            min={8}
            max={120}
            value={size}
            onChange={(e) => applySize(Number(e.target.value) || size)}
          />
        </label>
        <div className="gini-csi-fontman__field">
          <span>الوزن</span>
          <div className="gini-csi-seg gini-csi-seg--sm gini-csi-seg--weights">
            {FONT_WEIGHTS.map((w) => (
              <button
                key={w.v}
                type="button"
                title={w.l}
                style={{ fontWeight: Number(w.v) }}
                className={`gini-csi-seg__btn${weight === w.v ? " is-active" : ""}`}
                onClick={() => applyWeight(w.v)}
              >
                {w.v}
              </button>
            ))}
          </div>
        </div>
        <label className="gini-csi-fontman__field">
          <span>ارتفاع السطر</span>
          <input
            type="text"
            dir="ltr"
            value={lh}
            onChange={(e) => applyLh(e.target.value)}
            spellCheck={false}
          />
        </label>
      </div>

      <div className="gini-csi-picker__actions">
        <button
          type="button"
          className="gini-csi-btn gini-csi-btn--primary"
          onClick={onClose}
        >
          تم
        </button>
        <button
          type="button"
          className="gini-csi-btn gini-csi-btn--ghost"
          onClick={() => {
            onReset();
            onClose();
          }}
          disabled={!override}
        >
          <IconReset />
          استرجاع
        </button>
      </div>
    </div>
  );
}

export default ColorSystemInspector;
