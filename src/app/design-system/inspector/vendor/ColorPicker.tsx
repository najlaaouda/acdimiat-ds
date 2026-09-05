"use client";

/* =============================================================================
 * ColorPicker — a professional, dependency-free color picker.
 *
 * • Saturation/Value area with a draggable thumb
 * • Hue slider + Opacity (alpha) slider
 * • HEX · RGB · HSL · Alpha numeric inputs (all two-way bound)
 * • Before / After preview swatches
 * • Apply · Cancel · Reset actions
 *
 * The picker owns an internal HSVA model (so dragging stays stable at S=0 /
 * V=0 where hue would otherwise be lost). It emits live `onChange(hex)` on
 * every interaction; the parent applies that to the live CSS variable. Mount it
 * with a `key` per target so switching targets re-seeds it from `initial`.
 *
 * Rendered LTR on purpose — every design tool's picker (Figma included) keeps
 * saturation→right / hue 0→360 left→right regardless of page direction.
 * ========================================================================== */

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  formatHsl,
  formatRgb,
  hsvToRgb,
  parseColor,
  rgbaToHex,
  rgbToHsl,
  rgbToHsv,
  hslaToRgba,
  type HSVA,
  type RGBA,
} from "./color";

export interface ColorPickerProps {
  /** Seed color (resolved) shown as the "before" swatch + initial thumb. */
  initial: string;
  /** True system default, restored by Reset (defaults to `initial`). Differs
   *  from `initial` when the target was already edited before opening. */
  original?: string;
  /** The token / target name shown in the picker header. */
  label?: string;
  /** Live preview — fires on every drag/typing change. */
  onChange: (hex: string) => void;
  /** Commit the current color. */
  onApply?: (hex: string) => void;
  /** Abandon edits (parent should restore the previous value). */
  onCancel?: () => void;
  /** Restore `initial`. */
  onReset?: () => void;
  /** Hide the Apply/Cancel/Reset row (when an outer editor owns the actions). */
  hideActions?: boolean;
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

function seedHsva(initial: string): HSVA {
  const rgba = parseColor(initial) ?? { r: 0, g: 0, b: 0, a: 1 };
  return rgbToHsv(rgba);
}

export function ColorPicker({
  initial,
  original,
  label,
  onChange,
  onApply,
  onCancel,
  onReset,
  hideActions = false,
}: ColorPickerProps) {
  const [hsva, setHsvaState] = useState<HSVA>(() => seedHsva(initial));

  const rgba: RGBA = hsvToRgb(hsva);
  const hex = rgbaToHex(rgba);
  const hsl = rgbToHsl(rgba);
  const solidHue = `hsl(${hsva.h}, 100%, 50%)`;
  const solidColor = `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;

  /** Update model + emit a live hex (alpha-aware). */
  const commit = useCallback(
    (next: HSVA) => {
      setHsvaState(next);
      onChange(rgbaToHex(hsvToRgb(next)));
    },
    [onChange],
  );

  const setHsva = (patch: Partial<HSVA>) => commit({ ...hsva, ...patch });

  /* ── Pointer dragging for the area + sliders ──────────────────────────── */

  const areaRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);

  const dragArea = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    commit({ ...hsva, s: x * 100, v: (1 - y) * 100 });
  };

  const dragHue = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    commit({ ...hsva, h: x * 360 });
  };

  const dragAlpha = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = alphaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    commit({ ...hsva, a: x });
  };

  const startDrag =
    (handler: (e: ReactPointerEvent<HTMLDivElement>) => void) =>
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      handler(e);
    };

  const moveDrag =
    (handler: (e: ReactPointerEvent<HTMLDivElement>) => void) =>
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return;
      handler(e);
    };

  /* ── Text-input bindings ──────────────────────────────────────────────── */

  const onHex = (raw: string) => {
    const rgbaIn = parseColor(raw.startsWith("#") ? raw : `#${raw}`);
    if (rgbaIn) commit({ ...rgbToHsv(rgbaIn) });
  };

  const onRgb = (key: "r" | "g" | "b", raw: string) => {
    const n = Math.min(255, Math.max(0, Math.round(Number(raw) || 0)));
    commit(rgbToHsv({ ...rgba, [key]: n }));
  };

  const onHsl = (key: "h" | "s" | "l", raw: string) => {
    const n = Number(raw) || 0;
    const next = { ...hsl, [key]: n };
    commit(rgbToHsv(hslaToRgba(next)));
  };

  const onAlpha = (raw: string) => {
    const n = clamp01((Number(raw) || 0) / 100);
    setHsva({ a: n });
  };

  const areaThumb: CSSProperties = {
    left: `${hsva.s}%`,
    top: `${100 - hsva.v}%`,
    background: solidColor,
  };

  return (
    <div className="gini-csi-picker" dir="ltr">
      {label && <div className="gini-csi-picker__label">{label}</div>}

      {/* Saturation / Value area */}
      <div
        ref={areaRef}
        className="gini-csi-picker__area"
        style={{ background: solidHue }}
        onPointerDown={startDrag(dragArea)}
        onPointerMove={moveDrag(dragArea)}
        role="slider"
        aria-label="Saturation and brightness"
        aria-valuetext={hex}
        tabIndex={0}
      >
        <div className="gini-csi-picker__area-white" />
        <div className="gini-csi-picker__area-black" />
        <span className="gini-csi-picker__thumb" style={areaThumb} />
      </div>

      {/* Sliders + live preview */}
      <div className="gini-csi-picker__sliders">
        <span
          className="gini-csi-picker__preview-dot"
          style={
            {
              "--csi-dot": solidColor,
              "--csi-dot-a": String(hsva.a),
            } as CSSProperties
          }
          aria-hidden="true"
        />
        <div className="gini-csi-picker__tracks">
          <div
            ref={hueRef}
            className="gini-csi-picker__hue"
            onPointerDown={startDrag(dragHue)}
            onPointerMove={moveDrag(dragHue)}
            role="slider"
            aria-label="Hue"
            aria-valuenow={Math.round(hsva.h)}
            aria-valuemin={0}
            aria-valuemax={360}
            tabIndex={0}
          >
            <span
              className="gini-csi-picker__knob"
              style={{ left: `${(hsva.h / 360) * 100}%`, background: solidHue }}
            />
          </div>
          <div
            ref={alphaRef}
            className="gini-csi-picker__alpha"
            style={{ "--csi-solid": solidColor } as CSSProperties}
            onPointerDown={startDrag(dragAlpha)}
            onPointerMove={moveDrag(dragAlpha)}
            role="slider"
            aria-label="Opacity"
            aria-valuenow={Math.round(hsva.a * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
          >
            <span
              className="gini-csi-picker__knob"
              style={{ left: `${hsva.a * 100}%`, background: solidColor }}
            />
          </div>
        </div>
      </div>

      {/* Numeric inputs */}
      <div className="gini-csi-picker__inputs">
        <label className="gini-csi-picker__field gini-csi-picker__field--hex">
          <span>HEX</span>
          <input
            value={hex.replace(/^#/, "")}
            onChange={(e) => onHex(e.target.value)}
            spellCheck={false}
            maxLength={8}
          />
        </label>
        <label className="gini-csi-picker__field">
          <span>R</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgba.r}
            onChange={(e) => onRgb("r", e.target.value)}
          />
        </label>
        <label className="gini-csi-picker__field">
          <span>G</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgba.g}
            onChange={(e) => onRgb("g", e.target.value)}
          />
        </label>
        <label className="gini-csi-picker__field">
          <span>B</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgba.b}
            onChange={(e) => onRgb("b", e.target.value)}
          />
        </label>
        <label className="gini-csi-picker__field">
          <span>A%</span>
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(hsva.a * 100)}
            onChange={(e) => onAlpha(e.target.value)}
          />
        </label>
      </div>
      <div className="gini-csi-picker__inputs gini-csi-picker__inputs--hsl">
        <label className="gini-csi-picker__field">
          <span>H</span>
          <input
            type="number"
            min={0}
            max={360}
            value={Math.round(hsl.h)}
            onChange={(e) => onHsl("h", e.target.value)}
          />
        </label>
        <label className="gini-csi-picker__field">
          <span>S%</span>
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(hsl.s)}
            onChange={(e) => onHsl("s", e.target.value)}
          />
        </label>
        <label className="gini-csi-picker__field">
          <span>L%</span>
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(hsl.l)}
            onChange={(e) => onHsl("l", e.target.value)}
          />
        </label>
        <span className="gini-csi-picker__formats" aria-hidden="true">
          {formatRgb(rgba)} · {formatHsl(rgba)}
        </span>
      </div>

      {/* Before / after */}
      <div className="gini-csi-picker__compare">
        <div className="gini-csi-picker__compare-cell">
          <span className="gini-csi-picker__compare-label">قبل</span>
          <span
            className="gini-csi-swatch-chip"
            style={{ background: initial }}
            title={initial}
          />
        </div>
        <div className="gini-csi-picker__compare-cell">
          <span className="gini-csi-picker__compare-label">بعد</span>
          <span
            className="gini-csi-swatch-chip"
            style={{ background: hex }}
            title={hex}
          />
        </div>
      </div>

      {/* Actions */}
      {!hideActions && (
        <div className="gini-csi-picker__actions">
          <button
            type="button"
            className="gini-csi-btn gini-csi-btn--primary"
            onClick={() => onApply?.(hex)}
          >
            تطبيق
          </button>
          <button
            type="button"
            className="gini-csi-btn gini-csi-btn--ghost"
            onClick={() => onCancel?.()}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="gini-csi-btn gini-csi-btn--ghost"
            onClick={() => {
              // Re-seed the internal model without emitting onChange — the parent's
              // onReset owns the live restore (avoids a redundant inline write).
              setHsvaState(seedHsva(original ?? initial));
              onReset?.();
            }}
          >
            استرجاع
          </button>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
