/* =============================================================================
 * icons.tsx — tiny inline glyphs for the Inspector chrome.
 *
 * The tool is self-contained: it can't rely on the site's #i-* sprite (which
 * has no copy / pencil / eyedropper symbols). These are minimal 1.5-stroke,
 * round-cap icons in the Iconsax spirit, sized via CSS (1em) and inheriting
 * currentColor. Decorative only — every control carries its own aria-label.
 * ========================================================================== */

import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

export const IconCopy = () => (
  <svg {...base}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
  </svg>
);

export const IconEdit = () => (
  <svg {...base}>
    <path d="M13.5 6.5 17.5 10.5" />
    <path d="M4 20l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" />
  </svg>
);

/* A card casting a soft shadow to the bottom-end — the "elevation / shadow" glyph. */
export const IconShadow = () => (
  <svg {...base}>
    <rect x="3" y="3" width="13" height="13" rx="3" />
    <rect x="8" y="8" width="13" height="13" rx="3" opacity="0.4" />
  </svg>
);

export const IconCheck = () => (
  <svg {...base}>
    <path d="M5 12.5 10 17 19 7" />
  </svg>
);

export const IconClose = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconMinimize = () => (
  <svg {...base}>
    <path d="M5 12h14" />
  </svg>
);

export const IconSearch = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const IconPicker = () => (
  <svg {...base}>
    <path d="M14.5 5.5 16 4a2.1 2.1 0 0 1 3 3l-1.5 1.5" opacity="0.45" />
    <path d="M14.5 5.5 18.5 9.5" />
    <path d="M16.5 7.5 8 16l-3 1 1-3 8.5-8.5" />
  </svg>
);

export const IconDownload = () => (
  <svg {...base}>
    <path d="M12 4v10" />
    <path d="M8 11l4 4 4-4" />
    <path d="M5 19h14" opacity="0.45" />
  </svg>
);

export const IconReset = () => (
  <svg {...base}>
    <path d="M4.5 9A7.5 7.5 0 1 1 4 12.5" />
    <path d="M4.5 4.5V9H9" />
  </svg>
);

export const IconDrag = () => (
  <svg {...base}>
    <circle cx="9" cy="6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPalette = () => (
  <svg {...base}>
    <path d="M12 3a9 9 0 0 0 0 18c1.2 0 2-.9 2-2 0-1.1-.9-1.8-.9-2.7 0-.8.7-1.3 1.6-1.3H16a5 5 0 0 0 5-5c0-4-4-7-9-7Z" />
    <circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="11" r="1.1" fill="currentColor" stroke="none" opacity="0.45" />
  </svg>
);

export const IconChevron = () => (
  <svg {...base}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const IconType = () => (
  <svg {...base}>
    <path d="M5.5 19 11 5h2l5.5 14" />
    <path d="M8 14h8" opacity="0.45" />
  </svg>
);

export const IconBox = () => (
  <svg {...base}>
    <rect x="3" y="3" width="18" height="18" rx="3.5" />
    <rect x="8" y="8" width="8" height="8" rx="1.5" opacity="0.45" />
  </svg>
);

export const IconAlignRight = () => (
  <svg {...base}>
    <path d="M20 6H9" />
    <path d="M20 12H4" />
    <path d="M20 18H11" />
  </svg>
);

export const IconAlignLeft = () => (
  <svg {...base}>
    <path d="M4 6h11" />
    <path d="M4 12h16" />
    <path d="M4 18h9" />
  </svg>
);

export const IconAlignCenter = () => (
  <svg {...base}>
    <path d="M7 6h10" />
    <path d="M4 12h16" />
    <path d="M8 18h8" />
  </svg>
);

export const IconAlignJustify = () => (
  <svg {...base}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

export const IconGap = () => (
  <svg {...base}>
    <rect x="4" y="4" width="16" height="3.4" rx="1.2" fill="currentColor" stroke="none" opacity="0.4" />
    <rect x="4" y="16.6" width="16" height="3.4" rx="1.2" fill="currentColor" stroke="none" opacity="0.4" />
    <path d="M12 9.4v5.2M10.3 11.1 12 9.4l1.7 1.7M10.3 12.9 12 14.6l1.7-1.7" />
  </svg>
);

export const IconPadH = () => (
  <svg {...base}>
    <path d="M6.5 5v14" />
    <path d="M17.5 5v14" />
    <path d="M11 12h2" opacity="0.45" />
  </svg>
);

export const IconPadV = () => (
  <svg {...base}>
    <path d="M5 6.5h14" />
    <path d="M5 17.5h14" />
    <path d="M11 12h2" opacity="0.45" />
  </svg>
);

export const IconSides = () => (
  <svg {...base}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <rect x="8" y="8" width="8" height="8" rx="1.5" opacity="0.4" />
  </svg>
);

export const IconRadius = () => (
  <svg {...base}>
    <path d="M4 20v-8a8 8 0 0 1 8-8h8" />
    <path d="M9 20H6a2 2 0 0 1-2-2v-3" opacity="0.4" />
  </svg>
);

/* Flow = vertical (column): stacked blocks + down arrow. */
export const IconFlowV = () => (
  <svg {...base}>
    <rect x="7" y="3.5" width="10" height="5" rx="1.5" opacity="0.4" fill="currentColor" stroke="none" />
    <rect x="7" y="11.5" width="10" height="5" rx="1.5" opacity="0.4" fill="currentColor" stroke="none" />
    <path d="M12 18.5v2.5M10.5 19.5 12 21l1.5-1.5" />
  </svg>
);

/* Flow = horizontal (row): side-by-side blocks + right arrow (RTL-agnostic). */
export const IconFlowH = () => (
  <svg {...base}>
    <rect x="3.5" y="7" width="5" height="10" rx="1.5" opacity="0.4" fill="currentColor" stroke="none" />
    <rect x="11.5" y="7" width="5" height="10" rx="1.5" opacity="0.4" fill="currentColor" stroke="none" />
    <path d="M18.5 12h2.5M19.5 10.5 21 12l-1.5 1.5" />
  </svg>
);

/* Design-system component glyph (Figma-like diamond). */
export const IconComponent = () => (
  <svg {...base}>
    <path d="M12 3 21 12 12 21 3 12 12 3Z" />
    <path d="M12 8.5 15.5 12 12 15.5 8.5 12 12 8.5Z" opacity="0.4" />
  </svg>
);

export const IconSun = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="4.2" />
    <path
      d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4"
      opacity="0.55"
    />
  </svg>
);

export const IconMoon = () => (
  <svg {...base}>
    <path d="M20 14.4A8 8 0 0 1 9.6 4 7 7 0 1 0 20 14.4Z" />
  </svg>
);
