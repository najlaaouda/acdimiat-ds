"use client";

/* =============================================================================
 * TokenPalette — pick a color from the DESIGN SYSTEM (not a freeform value).
 *
 * Figma-style: tokens grouped into COLLAPSIBLE accordion sections (Background,
 * Content, Border, …). Each section opens/closes independently; searching
 * force-expands every matching section. Rows show a transparency-aware swatch
 * + a short name (the group prefix stripped, Title-Cased — "Primary-Solid").
 * Picking one binds the target to `var(--token)` so the change stays faithful
 * to the system. The currently-applied token is ringed + checked.
 * ========================================================================== */

import { useMemo, useState } from "react";
import { toHex, readableInk } from "./color";
import { IconSearch, IconCheck, IconChevron } from "./icons";
import type { TokenGroup, TokenInfo } from "./tokens";

export interface TokenPaletteProps {
  groups: TokenGroup[];
  resolved: Map<string, string>;
  /** varName currently applied to the target (gets a selected ring). */
  selectedVar: string | null;
  onPick: (token: TokenInfo) => void;
}

/** Leading group prefixes to strip so a row reads like Figma ("Primary-Solid"). */
const GROUP_PREFIX: Record<string, RegExp> = {
  Background: /^(background|bg)-/,
  Surface: /^surface-/,
  Content: /^(content|text)-/,
  Border: /^border-/,
  Icon: /^icon-/,
  "Primary Action": /^(primary-action|pa)-/,
  "Secondary Action": /^(secondary-action|sa)-/,
  State: /^(state|effect)-/,
  Coupon: /^coupon-/,
  Orange: /^orange-/,
  Neutral: /^(grey|gray|neutral)-/,
  Ink: /^ink-?/,
  Red: /^red-/,
  Pink: /^pink-/,
  Green: /^(success|green)-/,
  Yellow: /^(warning|yellow|amber)-/,
  Blue: /^(info|blue)-/,
  Purple: /^(purple|violet)-/,
  Secondary: /^secondary-/,
};

function shortLabel(group: string, name: string): string {
  const re = GROUP_PREFIX[group];
  let rest = re ? name.replace(re, "") : name;
  if (!rest) rest = name;
  return rest
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join("-");
}

export function TokenPalette({
  groups,
  resolved,
  selectedVar,
  onPick,
}: TokenPaletteProps) {
  const [q, setQ] = useState("");
  // Per-group collapse state; undefined => default open.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const needle = q.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      groups
        .map((g) => ({
          group: g.group,
          tokens: g.tokens.filter((t) => {
            if (!needle) return true;
            const hex = toHex(resolved.get(t.varName) ?? t.resolved).toLowerCase();
            return (
              t.name.toLowerCase().includes(needle) ||
              hex.includes(needle) ||
              g.group.toLowerCase().includes(needle)
            );
          }),
        }))
        .filter((g) => g.tokens.length > 0),
    [groups, needle, resolved],
  );

  return (
    <div className="gini-csi-pal">
      <label className="gini-csi-search">
        <IconSearch />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="اختر توكن من النظام…"
          spellCheck={false}
        />
      </label>

      {filtered.length === 0 ? (
        <div className="gini-csi-empty">لا يوجد توكن مطابق.</div>
      ) : (
        <div className="gini-csi-acc">
          {filtered.map((g) => {
            // Searching force-opens; otherwise honor the toggle (default open).
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
                  <span className="gini-csi-acc__count">{g.tokens.length}</span>
                </button>

                {isOpen && (
                  <div className="gini-csi-acc__body" role="list">
                    {g.tokens.map((t) => {
                      const color = resolved.get(t.varName) ?? t.resolved;
                      const hex = toHex(color);
                      const selected = selectedVar === t.varName;
                      return (
                        <button
                          key={t.varName}
                          type="button"
                          role="listitem"
                          className={`gini-csi-swrow${selected ? " is-selected" : ""}`}
                          onClick={() => onPick(t)}
                          title={`${t.varName} · ${hex}`}
                        >
                          <span className="gini-csi-swrow__chip" aria-hidden="true">
                            <span
                              className="gini-csi-swrow__sw"
                              style={{ background: color, color: readableInk(hex) }}
                            >
                              {selected && <IconCheck />}
                            </span>
                          </span>
                          <span className="gini-csi-swrow__name">
                            {shortLabel(g.group, t.name)}
                          </span>
                          <span className="gini-csi-swrow__hex">{hex}</span>
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

export default TokenPalette;
