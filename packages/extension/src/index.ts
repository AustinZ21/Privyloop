// Minimal extension entry to satisfy webpack build
// This can be expanded with background/content scripts as needed.
export const init = (): void => {
  // no-op
};

if (typeof window !== 'undefined') {
  // Keep a tiny side-effect to ensure bundling
  (window as any).__PRIVYLOOP_EXTENSION__ = true;
}


