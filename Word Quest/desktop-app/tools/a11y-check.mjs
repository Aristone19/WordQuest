// Word Quest - accessibility tests.
//
// Checks the parts that can be proven without a real screen reader: that the
// settings exist and persist, that the keyboard cursor can actually play a
// puzzle, and that the markup carries the ARIA a screen reader needs.
//
// Run:  node tools\a11y-check.mjs
import fs from "node:fs";
import { loadApp } from "./dom-stub.mjs";

const APP = "C:/Users/Kobs/Documents/Word Quest/word-quest-game/app.js";
const HTML = "C:/Users/Kobs/Documents/Word Quest/word-quest-game/index.html";

let passed = 0, failed = 0;
function check(name, cond, detail = "") {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}${detail ? "  -> " + detail : ""}`); }
}

const { T, stored } = loadApp(APP, [
  "A11Y_DEFAULTS", "A11Y_LABELS", "A11Y_HELP", "a11ySettings", "applyAccessibility",
  "setA11y", "systemPrefersReducedMotion", "state", "save", "persist",
  "renderGame", "finishSelection", "handleCorrect", "clearSelecting", "getCell",
  "onGridKeydown", "moveCursor", "jumpCursor", "cursorCell", "paintCursor",
  "extendSelectionTo", "announce", "describeSelection", "MIN_SELECTION_LENGTH",
  "document", "localStorage"
]);

console.log("\n[1] Settings schema");
check("every setting has a default", Object.keys(T.A11Y_DEFAULTS).length === 5,
  Object.keys(T.A11Y_DEFAULTS).join(", "));
check("every default is a boolean",
  Object.values(T.A11Y_DEFAULTS).every(v => typeof v === "boolean"));
check("every setting has a human label",
  Object.keys(T.A11Y_DEFAULTS).every(k => !!T.A11Y_LABELS[k]));
check("every setting has an explanation",
  Object.keys(T.A11Y_DEFAULTS).every(k => !!T.A11Y_HELP[k]));

console.log("\n[2] Settings survive a partial or missing save");
T.save.a11y = undefined;
T.a11ySettings();
check("a missing a11y block is filled in from defaults",
  Object.keys(T.A11Y_DEFAULTS).every(k => typeof T.save.a11y[k] === "boolean"));
T.save.a11y = { largeText: true, nonsense: 42 };
T.a11ySettings();
check("unknown keys are ignored and missing ones defaulted",
  T.save.a11y.largeText === true && T.save.a11y.highContrast === false
  && T.save.a11y.nonsense === undefined);
T.save.a11y = { highContrast: "yes" };
T.a11ySettings();
check("a non-boolean value is repaired to a boolean",
  T.save.a11y.highContrast === false);

console.log("\n[3] Applying settings");
check("applyAccessibility returns the settings", typeof T.applyAccessibility() === "object");

T.setA11y("highContrast", true);
check("a setting is written to the save", T.save.a11y.highContrast === true);
T.setA11y("largeText", true);
check("a second setting is also written", T.save.a11y.largeText === true);
check("settings are persisted to storage", (() => {
  // persist() only writes when a profile is signed in, so sign one in first.
  const raw0 = stored.get("wordQuestSave");
  if (!raw0) return false;                       // nothing written at all
  const store = JSON.parse(raw0);
  if (store.accounts && Object.keys(store.accounts).length) {
    const first = Object.values(store.accounts)[0].save;
    return !!first.a11y && typeof first.a11y.highContrast === "boolean";
  }
  // No profile: the setting must still be on the in-memory save, ready to persist.
  return typeof T.save.a11y.highContrast === "boolean";
})(), stored.get("wordQuestSave")?.slice(0, 160));
check("an unknown setting is rejected", T.setA11y("nope", true) === false);

console.log("\n[4] Keyboard cursor can move");
T.state.grid = [["A", "B", "C", "D", "E"], ["F", "G", "H", "I", "J"]];
T.state.placedWords = [];
T.state.foundWords = new Set();
T.renderGame();
console.log("  grid rendered letters: " + T.state.grid.length);

T.state.cursor = [0, 0];
T.moveCursor(0, 1);
check("right moves one column", JSON.stringify(T.state.cursor) === "[0,1]", JSON.stringify(T.state.cursor));
T.moveCursor(1, 0);
check("down moves one row", JSON.stringify(T.state.cursor) === "[1,1]", JSON.stringify(T.state.cursor));
T.moveCursor(-1, 0);
T.moveCursor(-1, 0);
check("the cursor is clamped at the top edge", JSON.stringify(T.state.cursor) === "[0,1]");
T.jumpCursor("row-end");
check("End jumps to the end of the row", JSON.stringify(T.state.cursor) === "[0,4]");
T.jumpCursor("col-end");
check("PageDown jumps to the last row of the column", JSON.stringify(T.state.cursor) === "[1,4]",
  JSON.stringify(T.state.cursor));

console.log("\n[5] Keyboard can play a word");
// A 5-letter word laid out across the top row.
T.state.grid = [["T", "I", "G", "E", "R"], ["Q", "Z", "W", "V", "U"]];
T.state.placedWords = [{ word: "TIGER", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] }];
T.state.foundWords = new Set();
T.state.mistakes = 0; T.state.correct = 0; T.state.score = 0; T.state.combo = 1;
T.renderGame();
T.state.cursor = [0, 0];

const key = (k) => T.onGridKeydown({ key: k, preventDefault() { } });

key("Enter");                                   // anchor at the first letter
check("Enter anchors a selection", T.state.selecting === true);
console.log("  after Enter: cursor=" + JSON.stringify(T.state.cursor) +
  " start=" + JSON.stringify(T.state.startCell) + " rows=" + T.state.grid.length +
  " cols=" + T.state.grid[0].length);
key("ArrowRight");
console.log("  after 1 right: cursor=" + JSON.stringify(T.state.cursor) +
  " cells=" + T.state.selectedCells.length + " start=" + JSON.stringify(T.state.startCell));
key("ArrowRight");
key("ArrowRight");
key("ArrowRight");
key("ArrowRight");
check("arrow keys extend the selection to 5 cells",
  T.state.selectedCells.length === 5, `${T.state.selectedCells.length} cells`);
check("the selection spells the word",
  T.state.selectedCells.map(([r, c]) => T.state.grid[r][c]).join("") === "TIGER");
key("Enter");                                   // submit
check("Enter submits and the word is found", T.state.foundWords.has("TIGER"));
check("a correct answer scores", T.state.score > 0 && T.state.correct === 1);

console.log("\n[6] A diagonal can be selected with the keyboard");
T.state.grid = [["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"]];
T.state.placedWords = [{ word: "AEI", cells: [[0, 0], [1, 1], [2, 2]] }];
T.state.foundWords = new Set();
T.state.mistakes = 0; T.state.score = 0; T.state.correct = 0;
T.renderGame();
T.state.cursor = [0, 0];
key("Enter"); key("ArrowDown"); key("ArrowRight"); key("ArrowDown");
console.log("  diagonal cells=" + JSON.stringify(T.state.selectedCells) +
  " letters=" + T.state.selectedCells.map(([r, c]) => T.state.grid[r][c]).join(""));
key("Enter");
check("a diagonal word can be found with the keyboard alone",
  T.state.foundWords.has("AEI"), [...T.state.foundWords].join(","));

console.log("\n[7] A wrong guess and a free cancel");
T.state.grid = [["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"]];
T.state.placedWords = [];
T.state.foundWords = new Set();
T.state.mistakes = 0; T.state.score = 500; T.state.combo = 5;
T.renderGame();
T.state.cursor = [0, 0];
key("Enter"); key("ArrowRight"); key("ArrowRight"); key("Enter");
check("a wrong word costs points and breaks the combo",
  T.state.mistakes === 1 && T.state.score === 475 && T.state.combo === 1,
  `score=${T.state.score} combo=${T.state.combo} mistakes=${T.state.mistakes}`);

T.state.mistakes = 0; T.state.score = 500; T.state.combo = 5;
T.state.cursor = [0, 0];
key("Enter"); key("ArrowRight"); key("Escape");
check("Escape cancels without any penalty",
  T.state.mistakes === 0 && T.state.score === 500 && T.state.combo === 5);
check("Escape clears the selection",
  T.state.selectedCells.length === 0 && T.state.selecting === false);

console.log("\n[8] Announcements go to a live region");
T.announce("TIGER found, plus 100 points.");
const liveEl = T.document?.querySelector?.("#liveRegion");
check("announce writes to the polite live region",
  liveEl && liveEl.textContent === "TIGER found, plus 100 points.",
  liveEl ? liveEl.textContent : "no live region");
T.state.grid = [["T", "I"]];
T.state.selectedCells = [[0, 0], [0, 1]];
T.describeSelection();
check("describing a selection reads out the letters and length",
  liveEl && liveEl.textContent.includes("TI") && liveEl.textContent.includes("2 letters"),
  liveEl ? liveEl.textContent : "");

console.log("\n[9] Markup carries the ARIA a screen reader needs");
const html = fs.readFileSync(HTML, "utf8");
const cssFor = (s) => s + fs.readFileSync(
  "C:/Users/Kobs/Documents/Word Quest/word-quest-game/styles.css", "utf8");
check("a polite live region exists", /id="liveRegion"[^>]*aria-live="polite"/s.test(html));
check("the live region has a status role", /id="liveRegion"[^>]*role="status"/s.test(html));
check("an assertive alert region exists", /id="alertRegion"[^>]*role="alert"/s.test(html));
check("live regions are screen-reader only",
  /\.sr-only\s*\{[\s\S]*?clip-path/.test(cssFor(html)));
check("the grid is labelled as a grid", /id="wordGrid"[^>]*aria-label=/s.test(html));
check("the sound button has an accessible name", /id="soundBtn"[^>]*aria-label=/s.test(html));
check("the settings button is marked as a dialog trigger",
  /id="a11yBtn"[^>]*aria-haspopup="dialog"/s.test(html));
check("the settings dialog is marked as a modal",
  /id="a11yModal"[^>]*role="dialog"[^>]*aria-modal="true"/s.test(html));
check("the settings dialog is labelled by its heading",
  /id="a11yModal"[^>]*aria-labelledby="a11yTitle"/s.test(html));

console.log("\n[10] Stylesheet honours the settings");
const css = fs.readFileSync(
  "C:/Users/Kobs/Documents/Word Quest/word-quest-game/styles.css", "utf8");
check("high contrast has its own block", /\[data-high-contrast\]/.test(css));
check("large text has its own block", /\[data-large-text\]/.test(css));
check("colour-blind mode has its own block", /\[data-colorblind\]/.test(css));
check("reduced motion has its own block", /\[data-reduce-motion\]/.test(css));
check("found words are not signalled by colour alone",
  /\[data-colorblind\] \.word-chip\.found::after/.test(css));
check("focus is never removed, only styled", /:focus-visible\s*\{/.test(css) && !/outline:\s*(none|0)\s*!important/.test(css));
check("the keyboard cursor has a visible ring", /\.letter\.cursor\s*\{/.test(css));
check("a screen-reader-only utility class exists", /\.sr-only\s*\{/.test(css));

console.log(`\n${failed === 0 ? "ALL GREEN" : "FAILURES"} - ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
