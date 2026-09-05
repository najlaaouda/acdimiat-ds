"use client";

/* =============================================================================
 * TokenList — the Primitives / Semantic-tokens browser.
 *
 * Renders grouped, searchable rows. Each row: swatch · name · resolved hex ·
 * (for semantics) the declared value + linked-primitive chip · Copy · Edit ·
 * Reset (when edited). Primitives never mix with semantic tokens — the parent
 * passes one set of groups per tab.
 * ========================================================================== */

import { useState } from "react";
import { toHex, readableInk } from "./color";
import { IconCopy, IconEdit, IconCheck, IconReset } from "./icons";
import type { TokenGroup, TokenInfo } from "./tokens";

export interface TokenListProps {
  groups: TokenGroup[];
  resolved: Map<string, string>;
  /** varNames edited in the CURRENT theme (light/dark are independent). */
  editedVars: Set<string>;
  /** Show declared value + linked-primitive chip (semantic tab only). */
  showLinks?: boolean;
  query: string;
  onEdit: (token: TokenInfo) => void;
  onReset: (varName: string) => void;
}

function matches(token: TokenInfo, hex: string, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    token.name.toLowerCase().includes(needle) ||
    token.group.toLowerCase().includes(needle) ||
    hex.toLowerCase().includes(needle) ||
    token.rawValue.toLowerCase().includes(needle)
  );
}

function TokenRow({
  token,
  resolvedColor,
  edited,
  showLinks,
  onEdit,
  onReset,
}: {
  token: TokenInfo;
  resolvedColor: string;
  edited: boolean;
  showLinks: boolean;
  onEdit: (t: TokenInfo) => void;
  onReset: (v: string) => void;
}) {
  const [copied, setCopied] = useState<"" | "hex" | "var">("");
  const isGrad = token.isGradient;
  const hex = isGrad ? "تدرّج" : toHex(resolvedColor);
  const copyValue = isGrad ? resolvedColor : hex;

  const copy = (text: string, which: "hex" | "var") => {
    void navigator.clipboard?.writeText(text);
    setCopied(which);
    window.setTimeout(() => setCopied(""), 1100);
  };

  return (
    <div className={`gini-csi-row${edited ? " is-edited" : ""}`}>
      <button
        type="button"
        className="gini-csi-row__swatch"
        style={{ background: resolvedColor, color: readableInk(hex) }}
        onClick={() => onEdit(token)}
        aria-label={`تعديل ${token.varName}`}
        title="تعديل اللون"
      >
        {edited && <span className="gini-csi-row__edited-dot" />}
      </button>

      <div className="gini-csi-row__info">
        <button
          type="button"
          className="gini-csi-row__name"
          onClick={() => copy(`var(${token.varName})`, "var")}
          title="نسخ var()"
        >
          {token.varName}
        </button>
        <div className="gini-csi-row__meta">
          <button
            type="button"
            className="gini-csi-row__hex"
            onClick={() => copy(copyValue, "hex")}
            title="نسخ القيمة"
          >
            {hex}
          </button>
          {showLinks && token.linkedPrimitive && (
            <span className="gini-csi-row__link" title="مرتبط بلون أساسي">
              ← {token.linkedPrimitive}
            </span>
          )}
          {showLinks && !token.linkedPrimitive && token.refName && (
            <span className="gini-csi-row__link gini-csi-row__link--soft">
              ← {token.refName}
            </span>
          )}
        </div>
      </div>

      <div className="gini-csi-row__actions">
        {edited && (
          <button
            type="button"
            className="gini-csi-iconbtn gini-csi-iconbtn--soft"
            onClick={() => onReset(token.varName)}
            aria-label="استرجاع اللون الأصلي"
            title="استرجاع"
          >
            <IconReset />
          </button>
        )}
        <button
          type="button"
          className="gini-csi-iconbtn"
          onClick={() => copy(copyValue, "hex")}
          aria-label="نسخ"
          title="نسخ"
        >
          {copied ? <IconCheck /> : <IconCopy />}
        </button>
        <button
          type="button"
          className="gini-csi-iconbtn"
          onClick={() => onEdit(token)}
          aria-label="تعديل"
          title="تعديل"
        >
          <IconEdit />
        </button>
      </div>
    </div>
  );
}

export function TokenList({
  groups,
  resolved,
  editedVars,
  showLinks = false,
  query,
  onEdit,
  onReset,
}: TokenListProps) {
  const rendered = groups
    .map((g) => {
      const tokens = g.tokens.filter((t) =>
        matches(t, toHex(resolved.get(t.varName) ?? t.resolved), query),
      );
      return { group: g.group, tokens };
    })
    .filter((g) => g.tokens.length > 0);

  if (rendered.length === 0) {
    return <div className="gini-csi-empty">لا توجد ألوان مطابقة لبحثك.</div>;
  }

  return (
    <div className="gini-csi-list">
      {rendered.map((g) => (
        <section className="gini-csi-group" key={g.group}>
          <header className="gini-csi-group__head">
            <span className="gini-csi-group__name">{g.group}</span>
            <span className="gini-csi-group__count">{g.tokens.length}</span>
          </header>
          <div className="gini-csi-group__rows">
            {g.tokens.map((t) => (
              <TokenRow
                key={t.varName}
                token={t}
                resolvedColor={resolved.get(t.varName) ?? t.resolved}
                edited={editedVars.has(t.varName)}
                showLinks={showLinks}
                onEdit={onEdit}
                onReset={onReset}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default TokenList;
