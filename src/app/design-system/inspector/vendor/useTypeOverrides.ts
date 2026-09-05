"use client";

/* =============================================================================
 * useTypeOverrides — global edits to the type scale (the `.t-*` classes).
 *
 * The typography counterpart of the color override system, but simpler: the
 * type scale is NOT theme-dependent, so edits are plain global rules written
 * into a managed <style>:  `.t-x.t-x { font-size:…; font-weight:…; line-height:… }`
 * (the class is doubled to outrank single-class rules incl. responsive @media).
 * Persisted to localStorage so edits survive navigation + reload.
 * ========================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "gini-csi-type-overrides-v1";
export const TYPE_OVERRIDE_STYLE_ID = "gini-csi-type-overrides";

export interface TypeOverride {
  className: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
}

export function useTypeOverrides() {
  const [overrides, setOverrides] = useState<Map<string, TypeOverride>>(new Map());
  // Bumped on every change so callers can re-read the (now-restyled) scale.
  const [rev, setRev] = useState(0);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const ensureStyle = useCallback((): HTMLStyleElement => {
    if (styleRef.current && styleRef.current.isConnected) return styleRef.current;
    let el = document.getElementById(
      TYPE_OVERRIDE_STYLE_ID,
    ) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = TYPE_OVERRIDE_STYLE_ID;
      document.head.appendChild(el);
    }
    styleRef.current = el;
    return el;
  }, []);

  const render = useCallback(
    (map: Map<string, TypeOverride>) => {
      let css = "";
      for (const o of map.values()) {
        const decls: string[] = [];
        if (o.fontSize) decls.push(`font-size:${o.fontSize};`);
        if (o.fontWeight) decls.push(`font-weight:${o.fontWeight};`);
        if (o.lineHeight) decls.push(`line-height:${o.lineHeight};`);
        if (decls.length) css += `.${o.className}.${o.className}{${decls.join("")}}`;
      }
      ensureStyle().textContent = css;
    },
    [ensureStyle],
  );

  const persist = useCallback((map: Map<string, TypeOverride>) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...map.values()]));
    } catch {
      /* storage disabled — keep working in memory */
    }
  }, []);

  // Load once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw) as TypeOverride[];
      const map = new Map(arr.map((o) => [o.className, o] as const));
      setOverrides(map);
      render(map);
      setRev((r) => r + 1);
    } catch {
      /* ignore malformed storage */
    }
  }, [render]);

  const setTypeOverride = useCallback(
    (className: string, patch: Partial<Omit<TypeOverride, "className">>) => {
      setOverrides((prev) => {
        const next = new Map(prev);
        const cur = next.get(className) ?? { className };
        next.set(className, { ...cur, ...patch });
        persist(next);
        render(next);
        return next;
      });
      setRev((r) => r + 1);
    },
    [persist, render],
  );

  const resetType = useCallback(
    (className: string) => {
      setOverrides((prev) => {
        const next = new Map(prev);
        next.delete(className);
        persist(next);
        render(next);
        return next;
      });
      setRev((r) => r + 1);
    },
    [persist, render],
  );

  const resetAllTypes = useCallback(() => {
    setOverrides(new Map());
    persist(new Map());
    render(new Map());
    setRev((r) => r + 1);
  }, [persist, render]);

  const getTypeEdit = useCallback(
    (className: string) => overrides.get(className),
    [overrides],
  );
  const editedClasses = useMemo(() => new Set(overrides.keys()), [overrides]);

  return {
    typeOverrides: overrides,
    typeRev: rev,
    editedClasses,
    setTypeOverride,
    resetType,
    resetAllTypes,
    getTypeEdit,
  };
}
