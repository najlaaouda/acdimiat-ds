"use client";

/* =============================================================================
 * InspectOverlay — DevTools-style "pick an element" mode.
 *
 * While active, the cursor becomes a crosshair, hovering any element draws a
 * highlight box around it, and clicking selects it (the click is swallowed so
 * links/buttons don't fire). The Inspector's own UI is excluded via the
 * `[data-gini-csi]` marker so you can't inspect the tool itself.
 *
 * Implemented with document-level capture listeners + a pointer-events:none
 * highlight box — no transparent catcher, so elementFromPoint stays accurate.
 * ========================================================================== */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { describeElement } from "./inspect";

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
}

export interface InspectOverlayProps {
  active: boolean;
  onPick: (el: Element) => void;
  onCancel: () => void;
  /** Override the crosshair hint text (e.g. for paste mode). */
  hint?: string;
}

function isOwnUi(el: Element | null): boolean {
  return !!el && !!el.closest("[data-gini-csi]");
}

export function InspectOverlay({ active, onPick, onCancel, hint }: InspectOverlayProps) {
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    if (!active) {
      setBox(null);
      return;
    }

    const onMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isOwnUi(el)) {
        setBox(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setBox({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        label: describeElement(el),
      });
    };

    const swallow = (e: Event) => {
      const el = e.target as Element | null;
      if (isOwnUi(el)) return; // let the tool's own buttons work
      e.preventDefault();
      e.stopPropagation();
    };

    const onClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (isOwnUi(el)) return;
      e.preventDefault();
      e.stopPropagation();
      if (el) onPick(el);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    // Capture phase so we beat the page's own handlers / navigation.
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("mousedown", swallow, true);
    document.addEventListener("mouseup", swallow, true);
    document.addEventListener("keydown", onKey, true);
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = "crosshair";

    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mousedown", swallow, true);
      document.removeEventListener("mouseup", swallow, true);
      document.removeEventListener("keydown", onKey, true);
      document.body.style.cursor = prevCursor;
    };
  }, [active, onPick, onCancel]);

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div className="gini-csi-inspect-layer" data-gini-csi aria-hidden="true">
      {box && (
        <div
          className="gini-csi-inspect-box"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
          }}
        >
          <span className="gini-csi-inspect-box__tag">{box.label}</span>
        </div>
      )}
      <div className="gini-csi-inspect-hint">
        {hint ?? "اضغط على أي عنصر لفحص ألوانه · Esc للإلغاء"}
      </div>
    </div>,
    document.body,
  );
}

export default InspectOverlay;
