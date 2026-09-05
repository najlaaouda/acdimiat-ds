/* =============================================================================
 * componentMatch.ts — "Go to main component" detection.
 *
 * Given an inspected DOM element, find the nearest React component that is a
 * registered design-system component, so the inspector can link to its canonical
 * place (local demo page / Bit / source). Detection walks the React fiber chain
 * and matches component names against the supplied registry.
 *
 * Dev-only by nature: component names survive in development builds (and the tool
 * is dev-only). In a minified production build fiber names are mangled — there it
 * simply finds no match, which is fine.
 * ========================================================================== */

export interface DsComponentRef {
  /** Component display name, e.g. "OfferCard". */
  name: string;
  /** Local demo route slug, e.g. "offer-card" → /offer-card. */
  demoSlug?: string;
  /** Bit component name under uxui.gini/ui, e.g. "offer-card". */
  bitName?: string;
  /** Source path (shown for copy; not openable from the browser). */
  sourcePath?: string;
}

interface FiberNode {
  type?: unknown;
  elementType?: unknown;
  return?: FiberNode | null;
  child?: FiberNode | null;
  stateNode?: unknown;
}

/** A specific on-page occurrence of a registered design-system component. */
export interface ComponentInstance {
  /** Which registered component this is. */
  ref: DsComponentRef;
  /** The component's root DOM element — a stable per-instance identity, so two
   *  sub-elements of the SAME card resolve to the same `rootEl`, while two
   *  different cards resolve to different ones. */
  rootEl: Element;
}

/** Read the function/class component name off a fiber `type`/`elementType`. */
function fiberName(t: unknown): string | null {
  if (typeof t !== "function") return null;
  const fn = t as { displayName?: string; name?: string };
  return fn.displayName || fn.name || null;
}

function readFiber(el: Element): FiberNode | null {
  const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
  if (!key) return null;
  return (el as unknown as Record<string, FiberNode | undefined>)[key] ?? null;
}

/** First host (DOM) node at or below a fiber — i.e. the component's root element. */
function fiberHostEl(fiber: FiberNode | null): Element | null {
  let node = fiber?.child ?? null;
  let hops = 0;
  while (node && hops < 200) {
    if (node.stateNode instanceof Element) return node.stateNode;
    node = node.child ?? null;
    hops++;
  }
  return null;
}

/**
 * Walk up from `el` through the React fiber tree and return the first component
 * present in `registry` *together with its root DOM element*, or null. Stops at
 * a sane depth.
 */
export function matchComponentInstance(
  el: Element,
  registry: Map<string, DsComponentRef>,
): ComponentInstance | null {
  if (!registry.size) return null;
  let fiber = readFiber(el);
  let hops = 0;
  while (fiber && hops < 60) {
    const name = fiberName(fiber.type ?? fiber.elementType);
    if (name && registry.has(name)) {
      const ref = registry.get(name);
      if (ref) return { ref, rootEl: fiberHostEl(fiber) ?? el };
    }
    fiber = fiber.return ?? null;
    hops++;
  }
  return null;
}

/** Back-compat helper: just the matched component (no instance identity). */
export function matchComponent(
  el: Element,
  registry: Map<string, DsComponentRef>,
): DsComponentRef | null {
  return matchComponentInstance(el, registry)?.ref ?? null;
}

/** Bit cloud URL for a component (matches the app's BIT_BASE). */
export function bitUrl(bitName: string): string {
  return `https://bit.cloud/uxui/gini/ui/${bitName}`;
}
