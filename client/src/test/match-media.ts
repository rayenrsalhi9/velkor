import { vi } from "vitest";

export interface MatchMediaHandle {
  mql: { matches: boolean };
  setMatches: (v: boolean) => void;
}

/** Controllable `matchMedia` stub for theme tests (system preference). */
export function stubMatchMedia(initialDark = false): MatchMediaHandle {
  const listeners = new Set<() => void>();
  const mql = {
    matches: initialDark,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: (_type: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_type: string, cb: () => void) => listeners.delete(cb),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };
  vi.stubGlobal("matchMedia", () => mql);
  return {
    mql,
    setMatches(v: boolean) {
      mql.matches = v;
      listeners.forEach((cb) => cb());
    },
  };
}
