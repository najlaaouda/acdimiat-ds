"use client";

/* =============================================================================
 * useColorSystem — all stateful logic for the Color System Inspector.
 *
 * Owns:
 *   • snapshot   — the classified token system, read from the live DOM.
 *   • resolved   — current computed value per token (reflects cascade + edits).
 *   • overrides  — user edits, keyed by `${theme}::${varName}` so LIGHT and
 *                  DARK edits are independent.
 *
 * Editing model: instead of inline `:root` styles (which override BOTH themes),
 * edits are written into a managed <style> element as theme-scoped rules:
 *
 *   :root:root:not([data-theme="dark"]) { … }   ← light-only edits
 *   :root:root[data-theme="dark"]        { … }   ← dark-only edits
 *
 * `:root:root` matches globals.css's own specificity and the tag is appended
 * last, so our rules win; `:not([data-theme="dark"])` keeps a light edit from
 * leaking into dark mode, and vice-versa. Because semantic tokens reference
 * primitives via `var()`, editing a primitive still cascades automatically.
 * Persisted to localStorage so edits survive navigation + reload.
 * ========================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toHex } from "./color";
import {
  buildReverseIndex,
  normalizeKey,
  readColorSystem,
  type ColorSnapshot,
  type TokenInfo,
} from "./tokens";

const STORAGE_KEY = "gini-csi-overrides-v2";
export const OVERRIDE_STYLE_ID = "gini-csi-overrides";

// [تعديل أكاديميات] انظر ../acadimiat-scope.ts
import { apScopedRule } from "../acadimiat-scope";

export type CsiTheme = "light" | "dark";

export interface OverrideRecord {
  varName: string;
  theme: CsiTheme;
  group: string;
  kind: "primitive" | "semantic";
  /** Original declared value, e.g. `var(--bg-cta)` or `#737373`. */
  oldValue: string;
  /** Original resolved color in this theme. */
  oldResolved: string;
  /** New value applied (hex / var(...) / gradient). */
  newValue: string;
}

export interface ColorExport {
  meta: {
    name: string;
    theme: string;
    exportedAt: string;
    version: string;
    changeCount: number;
  };
  primitive: Record<string, Record<string, string>>;
  tokens: Record<
    string,
    Record<
      string,
      { value: string; resolved: string; linkedPrimitive?: string }
    >
  >;
  changes: Array<{
    name: string;
    type: string;
    group: string;
    theme: CsiTheme;
    oldValue: string;
    newValue: string;
  }>;
}

const root = (): HTMLElement => document.documentElement;
// SSR-safe: `editedVars` reads this during render, which also runs on the
// server during prerender (where `document` is undefined).
const themeNow = (): CsiTheme =>
  typeof document === "undefined"
    ? "light"
    : document.documentElement.dataset['theme'] === "dark"
      ? "dark"
      : "light";
const keyOf = (theme: CsiTheme, varName: string): string => `${theme}::${varName}`;

export function useColorSystem(active: boolean) {
  const [snapshot, setSnapshot] = useState<ColorSnapshot | null>(null);
  const [resolved, setResolved] = useState<Map<string, string>>(new Map());
  const [overrides, setOverrides] = useState<Map<string, OverrideRecord>>(
    new Map(),
  );

  const overridesRef = useRef(overrides);
  overridesRef.current = overrides;
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  // In-progress (uncommitted) edit, scoped to the theme it was started in.
  const previewRef = useRef<{
    theme: CsiTheme;
    varName: string;
    value: string;
  } | null>(null);

  /* ── Managed override stylesheet ─────────────────────────────────────── */
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const ensureStyle = useCallback((): HTMLStyleElement => {
    if (styleRef.current && styleRef.current.isConnected) return styleRef.current;
    let el = document.getElementById(
      OVERRIDE_STYLE_ID,
    ) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = OVERRIDE_STYLE_ID;
      document.head.appendChild(el);
    }
    styleRef.current = el;
    return el;
  }, []);

  const renderStyle = useCallback(
    (map: Map<string, OverrideRecord>) => {
      const decls: Record<CsiTheme, string[]> = { light: [], dark: [] };
      for (const o of map.values()) {
        decls[o.theme].push(`${o.varName}:${o.newValue};`);
      }
      const p = previewRef.current;
      if (p) decls[p.theme].push(`${p.varName}:${p.value};`); // later decl wins
      let css = "";
      if (decls.light.length) {
        css += `:root:root:not([data-theme="dark"]){${decls.light.join("")}}`;
        // [تعديل أكاديميات] قاعدة ثانية داخل النطاق. التصريح على العنصر يهزم
        // الموروث من <html> مهما بلغت خصوصيته، فقاعدة :root وحدها لا تصل
        // .ap-docs ولا يتغيّر شيء على الشاشة.
        css += apScopedRule(decls.light.join(""));
      }
      if (decls.dark.length) {
        css += `:root:root[data-theme="dark"]{${decls.dark.join("")}}`;
      }
      ensureStyle().textContent = css;
    },
    [ensureStyle],
  );

  const persist = useCallback((map: Map<string, OverrideRecord>) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...map.values()]),
      );
    } catch {
      /* storage disabled — keep working in memory */
    }
  }, []);

  /* ── Load persisted edits once on mount ──────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw) as OverrideRecord[];
      const map = new Map<string, OverrideRecord>();
      for (const r of arr) map.set(keyOf(r.theme, r.varName), r);
      setOverrides(map);
      renderStyle(map);
    } catch {
      /* ignore malformed storage */
    }
  }, [renderStyle]);

  /* ── Read resolved values for every token from the live DOM ──────────── */
  const refreshResolved = useCallback((snap: ColorSnapshot | null) => {
    if (!snap) return;
    const cs = getComputedStyle(root());
    const next = new Map<string, string>();
    for (const t of snap.byVar.values()) {
      next.set(t.varName, cs.getPropertyValue(t.varName).trim() || t.resolved);
    }
    setResolved(next);
  }, []);

  const rescan = useCallback(() => {
    const snap = readColorSystem();
    setSnapshot(snap);
    const next = new Map<string, string>();
    for (const t of snap.byVar.values()) next.set(t.varName, t.resolved);
    setResolved(next);
  }, []);

  // Scan on first open; re-scan when the theme flips.
  useEffect(() => {
    if (active && !snapshot) rescan();
  }, [active, snapshot, rescan]);

  useEffect(() => {
    if (!active) return;
    const obs = new MutationObserver(() => rescan());
    obs.observe(root(), { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, [active, rescan]);

  // Keep the override <style> + resolved values in sync with committed edits
  // and the active theme.
  useEffect(() => {
    renderStyle(overrides);
    refreshResolved(snapshotRef.current);
  }, [overrides, snapshot, renderStyle, refreshResolved]);

  /* ── Editing (theme-scoped) ──────────────────────────────────────────── */

  /** Live preview — cheap, no state churn (used during drag). */
  const previewToken = useCallback(
    (varName: string, value: string) => {
      previewRef.current = { theme: themeNow(), varName, value };
      renderStyle(overridesRef.current);
    },
    [renderStyle],
  );

  /** Drop the in-progress preview (cancel) — committed edits stay. */
  const restoreToken = useCallback(() => {
    previewRef.current = null;
    renderStyle(overridesRef.current);
    refreshResolved(snapshotRef.current);
  }, [renderStyle, refreshResolved]);

  /** Commit an edit to the CURRENT theme only. */
  const commitToken = useCallback(
    (token: TokenInfo, value: string) => {
      previewRef.current = null;
      const theme = themeNow();
      setOverrides((prev) => {
        const next = new Map(prev);
        const k = keyOf(theme, token.varName);
        const existing = next.get(k);
        next.set(k, {
          varName: token.varName,
          theme,
          group: token.group,
          kind: token.kind,
          oldValue: existing ? existing.oldValue : token.rawValue,
          oldResolved: existing
            ? existing.oldResolved
            : resolvedRef.current.get(token.varName) ?? token.resolved,
          newValue: value,
        });
        persist(next);
        return next;
      });
    },
    [persist],
  );

  /** Drop the current theme's override for a token → back to its default. */
  const resetToken = useCallback(
    (varName: string) => {
      const theme = themeNow();
      setOverrides((prev) => {
        const next = new Map(prev);
        next.delete(keyOf(theme, varName));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  /** Drop every override (both themes). */
  const resetAll = useCallback(() => {
    setOverrides(new Map());
    persist(new Map());
  }, [persist]);

  /** Current-theme override for a token (if any). */
  const getEdit = useCallback(
    (varName: string): OverrideRecord | undefined =>
      overridesRef.current.get(keyOf(themeNow(), varName)),
    [],
  );

  /** Set of varNames edited in the CURRENT theme (drives "edited" markers). */
  const editedVars = useMemo(() => {
    const theme = snapshot?.theme ?? themeNow();
    const set = new Set<string>();
    for (const o of overrides.values()) if (o.theme === theme) set.add(o.varName);
    return set;
  }, [overrides, snapshot]);

  /* ── Reverse index (resolved color → token varNames) for Inspect ─────── */
  const reverseIndex = useMemo(() => {
    if (!snapshot) return new Map<string, string[]>();
    const liveByVar = new Map<string, TokenInfo>();
    for (const t of snapshot.byVar.values()) {
      liveByVar.set(t.varName, {
        ...t,
        resolved: resolved.get(t.varName) ?? t.resolved,
      });
    }
    return buildReverseIndex(liveByVar);
  }, [snapshot, resolved]);

  const lookupToken = useCallback(
    (color: string): string | null => {
      const key = normalizeKey(color);
      if (!key) return null;
      const hits = reverseIndex.get(key);
      return hits && hits.length ? hits[0] : null;
    },
    [reverseIndex],
  );

  /* ── Export ──────────────────────────────────────────────────────────── */
  const buildExport = useCallback((): ColorExport => {
    const theme = snapshot?.theme ?? "light";
    const primitive: ColorExport["primitive"] = {};
    const tokens: ColorExport["tokens"] = {};
    if (snapshot) {
      for (const g of snapshot.primitives) {
        primitive[g.group] = {};
        for (const t of g.tokens) {
          primitive[g.group][t.name] = toHex(
            resolved.get(t.varName) ?? t.resolved,
          );
        }
      }
      for (const g of snapshot.semantics) {
        tokens[g.group] = {};
        for (const t of g.tokens) {
          tokens[g.group][t.name] = {
            value: t.rawValue,
            resolved: toHex(resolved.get(t.varName) ?? t.resolved),
            ...(t.linkedPrimitive
              ? { linkedPrimitive: t.linkedPrimitive }
              : {}),
          };
        }
      }
    }
    const changes = [...overrides.values()].map((o) => ({
      name: o.varName,
      type: o.kind,
      group: o.group,
      theme: o.theme,
      oldValue: o.oldResolved,
      newValue: o.newValue,
    }));
    return {
      meta: {
        name: "Gini Color System",
        theme,
        exportedAt: new Date().toISOString(),
        version: "2.0.0",
        changeCount: changes.length,
      },
      primitive,
      tokens,
      changes,
    };
  }, [snapshot, resolved, overrides]);

  const downloadJson = useCallback(() => {
    const data = buildExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = data.meta.exportedAt.slice(0, 10);
    a.href = url;
    a.download = `gini-color-system-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildExport]);

  return {
    snapshot,
    resolved,
    overrides,
    editedVars,
    rescan,
    previewToken,
    restoreToken,
    commitToken,
    resetToken,
    resetAll,
    getEdit,
    lookupToken,
    buildExport,
    downloadJson,
  };
}
