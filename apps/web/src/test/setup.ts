import "@testing-library/jest-dom/vitest";

HTMLDialogElement.prototype.showModal ??= function showModal() {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close ??= function close() {
  this.removeAttribute("open");
  this.dispatchEvent(new Event("close"));
};

const storage = new Map<string, string>();
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
});
