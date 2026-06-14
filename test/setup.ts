import "@testing-library/jest-dom/vitest";

// The jsdom environment in this setup does not provide window.localStorage;
// back it with an in-memory store so storage-dependent code is testable.
if (typeof window !== "undefined" && !window.localStorage) {
  const store = new Map<string, string>();

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}
