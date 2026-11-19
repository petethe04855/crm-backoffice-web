import "@testing-library/jest-dom/vitest";

// jsdom lacks matchMedia; some UI code may reference it.
// jsdom implements neither object-URL helper; the download and image components
// only need a stable string back.
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "blob:vitest";
}
if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = () => {};
}

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
