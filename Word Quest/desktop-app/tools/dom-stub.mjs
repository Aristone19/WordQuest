import fs from "node:fs";
import vm from "node:vm";

// A minimal DOM stub for running word-quest-game/app.js outside a browser.
//
// Shared by the content checks and the game smoke harness, so both load the
// real game file rather than a copy that could drift.
export function makeSandbox(extra = {}) {
  const noop = () => {};

  const makeEl = (tag = "div") => ({
    tagName: tag,
    children: [],
    dataset: {},
    style: {},
    textContent: "",
    innerHTML: "",
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle() { }, contains(c) { return this._s.has(c); }
    },
    appendChild(c) { this.children.push(c); return c; },
    style: { setProperty() { }, removeProperty() { }, width: "" },
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] ?? null },
    removeAttribute(k) { delete this.attributes[k] },
    toggleAttribute(k, on) { if (on) this.setAttribute(k, ""); else this.removeAttribute(k) },
    hasAttribute(k) { return k in this.attributes },
    insertAdjacentHTML() { },
    addEventListener: noop, removeEventListener: noop,
    setPointerCapture: noop, releasePointerCapture: noop,
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100 }),
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    closest(sel) { return sel === ".letter" && this.dataset.r !== undefined ? this : null; }
  });

  const registry = new Map();
  let gridHost = null;
  const bySelector = (s) => {
    if (!registry.has(s)) {
      const e = makeEl();
      registry.set(s, e);
      if (s === "#wordGrid") gridHost = e;
    }
    return registry.get(s);
  };

  const docListeners = {};
  const document = {
    querySelector(s) {
      const m = /^\.letter\[data-r="(\d+)"\]\[data-c="(\d+)"\]$/.exec(s);
      if (m && gridHost) {
        return gridHost.children.find(d => +d.dataset.r === +m[1] && +d.dataset.c === +m[2]) || null;
      }
      return bySelector(s);
    },
    querySelectorAll: () => [],
    createElement: (t) => makeEl(t),
    addEventListener(type, fn) { (docListeners[type] = docListeners[type] || []).push(fn); },
    removeEventListener: noop,
    // The fake "screen": x = row, y = column.
    elementFromPoint: (x, y) => (gridHost
      ? gridHost.children.find(d => +d.dataset.r === x && +d.dataset.c === y) || null
      : null)
  };

  const stored = new Map();
  const sandbox = {
    document,
    localStorage: {
      getItem: (k) => (stored.has(k) ? stored.get(k) : null),
      setItem: (k, v) => stored.set(k, String(v)),
      removeItem: (k) => stored.delete(k)
    },
    structuredClone, setTimeout, clearTimeout, setInterval, clearInterval,
    console, confirm: () => false,
    addEventListener: noop, removeEventListener: noop,
    getComputedStyle: () => ({ position: "static" }),
    scrollTo: noop,
    ...extra
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  return { sandbox, docListeners, stored };
}
/** Loads app.js in a sandbox and returns the globals you ask for. */
export function loadApp(appPath, globals) {
  const src = fs.readFileSync(appPath, "utf8");
  const { sandbox, docListeners, stored } = makeSandbox();
  const ctx = vm.createContext(sandbox);
  vm.runInContext(
    src + `\n;globalThis.__T = { ${globals.join(", ")} };`,
    ctx, { filename: "app.js" }
  );
  return { T: ctx.__T, docListeners, stored };
}
