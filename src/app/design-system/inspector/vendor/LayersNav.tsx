"use client";

/* =============================================================================
 * LayersNav — a Figma-style 3-layer tree for the inspector.
 *
 * Solves the "I clicked the wrong nesting level" problem: after picking any
 * element, this shows its parent (one up), itself (highlighted), and its direct
 * children (one down) — max 3 layers. Click any row to re-select that exact
 * element; the view re-roots so you can walk up/down. Hovering a row draws a
 * highlight box over the element on the page (like DevTools / Figma).
 * ========================================================================== */

import { useState } from "react";
import { createPortal } from "react-dom";
import { getLayerContext, describeElement } from "./inspect";

type Kind = "parent" | "self" | "child";

function rectOf(el: Element) {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function LayersNav({
  selected,
  onReselect,
}: {
  selected: Element;
  onReselect: (el: Element) => void;
}) {
  const [hover, setHover] = useState<Element | null>(null);
  const ctx = getLayerContext(selected);

  const rows: { el: Element; depth: number; kind: Kind }[] = [];
  if (ctx.parent) rows.push({ el: ctx.parent, depth: 0, kind: "parent" });
  const selfDepth = ctx.parent ? 1 : 0;
  rows.push({ el: ctx.self, depth: selfDepth, kind: "self" });
  for (const c of ctx.children) {
    rows.push({ el: c, depth: selfDepth + 1, kind: "child" });
  }

  const hi = hover ? rectOf(hover) : null;
  const marker: Record<Kind, string> = { parent: "‹", self: "●", child: "›" };

  return (
    <div className="gini-csi-layers">
      <div className="gini-csi-layers__head">
        <span className="gini-csi-layers__title">الطبقات</span>
        <span className="gini-csi-layers__hint">اضغط لاختيار العنصر الدقيق</span>
      </div>
      <div
        className="gini-csi-layers__tree"
        onMouseLeave={() => setHover(null)}
      >
        {rows.map((r, i) => (
          <button
            key={`${r.kind}-${i}`}
            type="button"
            className={
              `gini-csi-layer gini-csi-layer--${r.kind}` +
              (r.kind === "self" ? " is-current" : "")
            }
            style={{ paddingInlineStart: 8 + r.depth * 16 }}
            onMouseEnter={() => setHover(r.el)}
            onFocus={() => setHover(r.el)}
            onClick={() => {
              if (r.kind === "self") return;
              setHover(null);
              onReselect(r.el);
            }}
          >
            <span className="gini-csi-layer__icon" aria-hidden="true">
              {marker[r.kind]}
            </span>
            <span className="gini-csi-layer__label">{describeElement(r.el)}</span>
            {r.kind === "self" && (
              <span className="gini-csi-layer__badge">الحالي</span>
            )}
          </button>
        ))}
        {ctx.childTotal > ctx.children.length && (
          <span className="gini-csi-layers__more">
            +{ctx.childTotal - ctx.children.length} عنصراً آخر
          </span>
        )}
      </div>

      {hi &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-gini-csi
            aria-hidden="true"
            style={{
              position: "fixed",
              top: hi.top,
              left: hi.left,
              width: hi.width,
              height: hi.height,
              border: "2px solid #3b5bdb",
              background: "rgba(59, 91, 219, 0.1)",
              borderRadius: 4,
              pointerEvents: "none",
              zIndex: 2147483646,
              transition: "top .06s ease, left .06s ease, width .06s ease, height .06s ease",
            }}
          />,
          document.body,
        )}
    </div>
  );
}

export default LayersNav;
