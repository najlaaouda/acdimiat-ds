"use client";

/* =============================================================================
 * TypeStylePalette — pick a TYPE STYLE from the design system (the `.t-*` scale).
 *
 * The font counterpart of TokenPalette: the same Figma-style collapsible
 * accordion (Display / Header / Subheading / Body), each row a live preview of
 * the style + its label + metrics. Picking applies that style's font
 * size/weight/line-height to the target element.
 * ========================================================================== */

import { useMemo, useState } from "react";
import { IconSearch, IconCheck, IconChevron } from "./icons";
import { lineHeightRatio, type TypeStyleGroup, type TypeStyle } from "./typography";

export interface TypeStylePaletteProps {
  groups: TypeStyleGroup[];
  /** className currently applied to the target (gets a selected ring). */
  selectedClass: string | null;
  onPick: (style: TypeStyle) => void;
  /** classNames with a global edit (gets an "edited" dot). */
  editedClasses?: Set<string>;
}

/** Keep the preview legible: clamp huge Display sizes down for the row. */
function previewPx(px: number): number {
  return Math.max(12, Math.min(px, 22));
}

export function TypeStylePalette({
  groups,
  selectedClass,
  onPick,
  editedClasses,
}: TypeStylePaletteProps) {
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const needle = q.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      groups
        .map((g) => ({
          group: g.group,
          styles: g.styles.filter(
            (s) =>
              !needle ||
              s.className.includes(needle) ||
              s.label.toLowerCase().includes(needle) ||
              g.group.toLowerCase().includes(needle),
          ),
        }))
        .filter((g) => g.styles.length > 0),
    [groups, needle],
  );

  return (
    <div className="gini-csi-pal">
      <label className="gini-csi-search">
        <IconSearch />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="اختر نمط نص من النظام…"
          spellCheck={false}
        />
      </label>

      {filtered.length === 0 ? (
        <div className="gini-csi-empty">لا يوجد نمط نص مطابق.</div>
      ) : (
        <div className="gini-csi-acc">
          {filtered.map((g) => {
            const isOpen = needle ? true : !collapsed[g.group];
            return (
              <section className="gini-csi-acc__group" key={g.group}>
                <button
                  type="button"
                  className="gini-csi-acc__head"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [g.group]: !c[g.group] }))
                  }
                >
                  <span
                    className={`gini-csi-acc__chev${isOpen ? " is-open" : ""}`}
                    aria-hidden="true"
                  >
                    <IconChevron />
                  </span>
                  <span className="gini-csi-acc__name">{g.group}</span>
                  <span className="gini-csi-acc__count">{g.styles.length}</span>
                </button>

                {isOpen && (
                  <div className="gini-csi-acc__body" role="list">
                    {g.styles.map((s) => {
                      const selected = selectedClass === s.className;
                      return (
                        <button
                          key={s.className}
                          type="button"
                          role="listitem"
                          className={`gini-csi-tyrow${selected ? " is-selected" : ""}`}
                          onClick={() => onPick(s)}
                          title={`${s.className} · ${s.fontSize} / ${s.fontWeight}`}
                        >
                          <span
                            className="gini-csi-tyrow__preview"
                            style={{
                              fontSize: previewPx(s.px),
                              fontWeight: Number(s.fontWeight) || undefined,
                            }}
                            aria-hidden="true"
                          >
                            Ag أبجد
                          </span>
                          <span className="gini-csi-tyrow__meta">
                            <span className="gini-csi-tyrow__label">
                              {s.label}
                              {selected && <IconCheck />}
                              {editedClasses?.has(s.className) && (
                                <span
                                  className="gini-csi-tyrow__dot"
                                  aria-label="معدّل"
                                />
                              )}
                            </span>
                            <span className="gini-csi-tyrow__spec">
                              {Math.round(s.px)}px · {s.fontWeight} · س{" "}
                              {lineHeightRatio(s.lineHeight, s.px)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TypeStylePalette;
