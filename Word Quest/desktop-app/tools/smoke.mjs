// Word Quest - game logic smoke tests.
//
// Proves the game WORKS: puzzle generation, scoring, the campaign, power-ups,
// upgrades and the codex. The content checks (content-check.mjs) prove the game
// has something worth reading.
//
// Run:  node tools\smoke.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { makeSandbox } from "./dom-stub.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const gameDir = path.resolve(here, "..", "..", "word-quest-game");
const APP = path.join(gameDir, "app.js");
const HTML = path.join(gameDir, "index.html");
const src = fs.readFileSync(APP, "utf8");
const htmlSrc = fs.readFileSync(HTML, "utf8");

let passed = 0, failed = 0;
function check(name, cond, detail = "") {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}${detail ? "  -> " + detail : ""}`); }
}

// ---------------------------------------------------------------- DOM stub
function makeEl(tag = "div") {
  const el = {
    tagName: tag,
    children: [],
    dataset: {},
    textContent: "",
    value: "",
    type: "text",
    title: "",
    disabled: false,
    maxLength: 40,
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)) },
      remove(...c) { c.forEach(x => this._s.delete(x)) },
      toggle() { }, contains(c) { return this._s.has(c) }
    },
    style: { setProperty() { }, removeProperty() { }, width: "" },
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = String(v); if (k.startsWith("data-")) this.dataset[k.slice(5).replace(/-(\w)/g, (m, c) => c.toUpperCase())] = String(v) },
    getAttribute(k) { return this.attributes[k] ?? null },
    removeAttribute(k) { delete this.attributes[k] },
    toggleAttribute(k, on) { if (on) this.setAttribute(k, ""); else this.removeAttribute(k) },
    hasAttribute(k) { return k in this.attributes },
    appendChild(c) { this.children.push(c); return c },
    insertAdjacentHTML() { },
    addEventListener() { }, removeEventListener() { },
    setPointerCapture() { }, releasePointerCapture() { },
    getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 100 } },
    focus() { }, select() { }, click() { }, remove() { },
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    closest(sel) { return sel === ".letter" && this.dataset.r !== undefined ? this : null }
  };
  // innerHTML = "" must clear children, or render() calls would pile up.
  let html = "";
  Object.defineProperty(el, "innerHTML", {
    get() { return html },
    set(v) { html = v; if (v === "") el.children = [] }
  });
  return el;
}
const registry = new Map();
let gridHost = null;
function bySelector(s) {
  if (!registry.has(s)) { const e = makeEl(); registry.set(s, e); if (s === "#wordGrid") gridHost = e; }
  return registry.get(s);
}
const docListeners = {};
let confirmAnswer = false;
// Screens are looked up in bulk by showScreen, so return the real elements for
// ".screen" instead of an empty list — otherwise its clear-active step is untested.
const SCREEN_IDS = ["homeScreen", "accountScreen", "setupScreen", "gameScreen", "resultsScreen", "profileScreen", "campaignScreen"];
const doc = {
  body: makeEl("body"),
  documentElement: makeEl("html"),
  querySelector(s) {
    const m = /^\.letter\[data-r="(\d+)"\]\[data-c="(\d+)"\]$/.exec(s);
    if (m && gridHost) return gridHost.children.find(d => +d.dataset.r === +m[1] && +d.dataset.c === +m[2]) || null;
    return bySelector(s);
  },
  querySelectorAll(sel) {
    if (sel === ".screen") return SCREEN_IDS.map(id => bySelector("#" + id));
    return [];
  },
  createElement: (t) => makeEl(t),
  addEventListener(type, fn) { (docListeners[type] = docListeners[type] || []).push(fn) },
  removeEventListener() { },
  // The fake "screen": x = row, y = column.
  elementFromPoint: (x, y) => (gridHost ? gridHost.children.find(d => +d.dataset.r === x && +d.dataset.c === y) || null : null)
};

// Stands in for the browser's FileReader so importAccount can be exercised.
class FakeFileReader {
  readAsText(file) {
    this.result = file && file.__text;
    if (this.onload) this.onload();
  }
}

// Records what was handed to Blob, so exportAccount can be inspected and even
// fed straight back into importAccount.
let lastBlobParts = null;
class FakeBlob {
  constructor(parts) { lastBlobParts = parts }
}
const stored = new Map();
const sandbox = {
  document: doc,
  localStorage: {
    getItem: (k) => (stored.has(k) ? stored.get(k) : null),
    setItem: (k, v) => stored.set(k, String(v)),
    removeItem: (k) => stored.delete(k)
  },
  structuredClone, setTimeout, clearTimeout, setInterval, clearInterval,
  console, confirm: () => confirmAnswer, getComputedStyle: () => ({ position: "static" }), scrollTo() { },
  crypto: globalThis.crypto,
  TextEncoder, TextDecoder,
  Blob: FakeBlob, FileReader: FakeFileReader,
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() { } },
  // The game registers window-level listeners at load time.
  addEventListener() { }, removeEventListener() { },
  location: { href: "file:///index.html", origin: "file://" },
  navigator: { userAgent: "node" }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

vm.runInContext(src + `
;globalThis.__T = {
  get state() { return state },
  get save() { return save },
  get store() { return store },
  get promptResolve() { return promptResolve },
  categories, difficultyConfig, longWordRatio, chooseWords, generateGrid,
  renderGame, finishSelection, handleCorrect, endGame, resetDailyQuestsIfNeeded, checkQuestCompletion,
  onPointerDown, onPointerMove, onPointerUp, todayStamp, MIN_SELECTION_LENGTH, RUSH_BONUS_POINTS,
  GOLDEN_BONUS_COINS, EVENT_DURATION_MS, campaign, chapterPlan, maxStars, getLevel, levelStars,
  totalStars, levelUnlocked, levelStarTime, levelRunTime, evaluateStars, currentLevel, allWords,
  wordDefinition, learnedCount, recordWord, renderCampaign, renderCodex, startLevel, starRow,
  hintText, wordDirection, boardRegion, usePower, refundActivePowers, buyUpgrade, upgradeCost,
  upgradeMaxed, upgradeConfig, upgradeLevel, bonusTimeSeconds, coinBoostMultiplier, mistakePenalty,
  freeHintsPerPuzzle, startGame, MISTAKE_PENALTY, FINDER_REVEAL_MS,
  SAVE_KEY, SAVE_VERSION, AVATARS, NAME_MIN, NAME_MAX, accountStoreLoad, makeAccount, isFlatSave,
  activeAccount, activeSave, accountList, accountStoreWrite, accountStars, accountSummary, nameTaken,
  newAccountId, randomSalt, hashPin, adoptAccount, signInToAccount, createAccount, renameAccount,
  cycleAvatar, managePin, deleteAccount, signOut, exportAccount, importAccount, renderAccountScreen,
  askPin, askText, askValue, closePrompt, formatDay, showScreen, defaultSave, deepMerge,
  get newAvatar() { return newAvatar }
};`, ctx, { filename: "app.js" });
const T = ctx.__T;

// The game now gates play behind a profile, so sign one in up front. This also
// means every later persistence assertion checks that profile's own save.
doc.querySelector("#newAccountName").value = "Tester";
doc.querySelector("#newAccountPin").value = "";
await T.createAccount();

const diffs = [["Easy", 10, 7], ["Medium", 12, 9], ["Hard", 14, 11]];
function freshRun() {
  T.state.grid = [["T", "I", "G", "E", "R"], ["Q", "Z", "W", "V", "U"], ["A", "B", "C", "D", "F"]];
  T.state.placedWords = [{ word: "TIGER", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] }];
  T.state.foundWords = new Set();
  T.state.score = 500; T.state.combo = 5; T.state.correct = 0; T.state.mistakes = 0;
  T.state.selectedCells = []; T.state.startCell = null; T.state.selecting = false;
  T.state.randomEvent = null; T.state.rushDeadline = null; T.state.shieldActive = false;
  T.state.multiplierActive = false; T.state.boss = false; T.state.daily = false;
  T.state.selectedDifficulty = "Easy"; T.state.seconds = 60;
}
function select(cells) { T.state.selecting = true; T.state.startCell = cells[0]; T.state.selectedCells = cells }
function tap(cells) { select(cells); T.finishSelection() }

console.log("\n[1] Puzzle generation (all 6 categories x 3 difficulties)");
const trials = {}, longSeen = {}, shortFail = [];
let shapeBad = 0, letterBad = 0, dupWords = 0;
for (const [diff, size, count] of diffs) {
  trials[diff] = 0; longSeen[diff] = 0;
  for (const cat of Object.keys(T.categories)) {
    const longWords = T.categories[cat][1].map(w => w.toUpperCase());
    for (let i = 0; i < 6; i++) {
      trials[diff]++;
      const words = T.chooseWords(cat, count, diff, false);
      if (words.some(w => longWords.includes(w))) longSeen[diff]++;
      if (new Set(words).size !== words.length) dupWords++;
      const { grid, placements } = T.generateGrid(size, words);
      if (grid.length !== size || !grid.every(r => r.length === size)) shapeBad++;
      if (placements.length !== words.length) shortFail.push(`${diff}/${cat}: ${placements.length}/${words.length}`);
      for (const p of placements) {
        const letters = p.cells.map(([r, c]) => grid[r][c]).join("");
        if (letters !== p.word && letters !== [...p.word].reverse().join("")) letterBad++;
        if (p.word.length > size) letterBad++;
        if (p.cells.some(([r, c]) => r < 0 || c < 0 || r >= size || c >= size)) letterBad++;
      }
    }
  }
}
check("grid shape is always size x size", shapeBad === 0, `${shapeBad} bad grids`);
check("placed words match their grid letters and stay in bounds", letterBad === 0, `${letterBad} mismatches`);
check("no duplicate words inside one puzzle", dupWords === 0, `${dupWords} puzzles with duplicates`);
check("every requested word is placed", shortFail.length === 0, shortFail.slice(0, 3).join(" | "));
check("Easy never uses the long word list", longSeen.Easy === 0, `${longSeen.Easy}/${trials.Easy}`);
check("Medium uses some long words", longSeen.Medium > 0, `${longSeen.Medium}/${trials.Medium}`);
check("Hard always uses long words", longSeen.Hard === trials.Hard, `${longSeen.Hard}/${trials.Hard}`);

console.log("\n[2] Daily Challenge determinism");
const d1 = T.chooseWords("Animals", 9, "Medium", true);
const d2 = T.chooseWords("Animals", 9, "Medium", true);
const d3 = T.chooseWords("Food", 9, "Medium", true);
check("same day + mode gives the same puzzle", JSON.stringify(d1) === JSON.stringify(d2));
check("different categories give different puzzles", JSON.stringify(d1) !== JSON.stringify(d3));
check("daily words fit the medium grid", d1.every(w => w.length <= 12));

console.log("\n[3] Quest rewards and daily reset");
for (const k in T.save.quests) { T.save.quests[k].progress = 0; T.save.quests[k].claimed = false }
T.save.lastQuestReset = "2000-01-01";
T.save.quests.dailyWords.claimed = true;
T.save.quests.dailyWords.progress = 20;
check("stale quests are reset", T.resetDailyQuestsIfNeeded() === true &&
  T.save.quests.dailyWords.progress === 0 && T.save.quests.dailyWords.claimed === false);
check("reset day is stamped", T.save.lastQuestReset === T.todayStamp());
check("second call on the same day is a no-op", T.resetDailyQuestsIfNeeded() === false);
T.save.coins = 0;
T.save.quests.dailyWords.progress = 20;
T.checkQuestCompletion();
check("quest reward is paid", T.save.coins === 75, `coins=${T.save.coins}`);
check("quest reward is written to the signed-in profile",
  JSON.parse(stored.get(T.SAVE_KEY)).accounts[T.store.active].save.coins === 75);
T.save.lastQuestReset = "2000-01-01";
T.resetDailyQuestsIfNeeded();
check("a quest can be earned again the next day", T.save.quests.dailyWords.claimed === false);

console.log("\n[4] Accidental tap no longer costs points");
freshRun(); tap([[0, 0]]);
check("single tap ignored (score, combo, mistakes untouched)",
  T.state.score === 500 && T.state.mistakes === 0 && T.state.combo === 5 && T.state.correct === 0);
check("selection is cleared after the tap", T.state.selecting === false && T.state.selectedCells.length === 0);
freshRun(); tap([[0, 0], [0, 1]]);
check("2-letter drag ignored", T.state.score === 500 && T.state.mistakes === 0);
freshRun(); tap([[0, 0], [0, 1], [0, 2]]);
check("3-letter wrong guess still costs 25 points and the combo",
  T.state.score === 475 && T.state.mistakes === 1 && T.state.combo === 1);
freshRun(); tap([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]);
check("correct word still scores and is marked found",
  T.state.foundWords.has("TIGER") && T.state.correct === 1 && T.state.score === 1000);
freshRun(); tap([[0, 4], [0, 3], [0, 2], [0, 1], [0, 0]]);
check("reversed selection still matches", T.state.foundWords.has("TIGER"));

console.log("\n[5] Touch drag selection (regression for the mobile bug)");
freshRun();
T.state.grid = [["T", "I", "G", "E", "R"]];
T.state.placedWords = [{ word: "TIGER", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] }];
T.renderGame();
const cell = (c) => gridHost.children.find(d => +d.dataset.c === c);
const ev = (c) => ({ preventDefault() { }, pointerId: 7, buttons: 1, clientX: 0, clientY: c });
const fire = (type, event) => (docListeners[type] || []).forEach(fn => fn(event));
T.onPointerDown.call(cell(0), ev(0));
T.onPointerMove.call(cell(0), ev(1));
T.onPointerMove.call(cell(0), ev(2));
check("drag highlights every letter it passes over",
  [0, 1, 2].every(c => cell(c).classList.contains("selecting")),
  `highlighted columns: ${[0, 1, 2, 3, 4].filter(c => cell(c).classList.contains("selecting")).join(",")}`);
T.onPointerMove.call(cell(0), ev(3));
T.onPointerMove.call(cell(0), ev(4));
fire("pointerup", ev(4));
check("a full touch drag finds the word", T.state.foundWords.has("TIGER"));
freshRun(); T.renderGame();
T.onPointerDown.call(cell(0), ev(0));
fire("pointerup", ev(0));
check("pointerdown + pointerup with no drag is not penalised", T.state.mistakes === 0 && T.state.score === 500);
freshRun(); T.renderGame();
T.onPointerDown.call(cell(0), ev(0));
T.onPointerMove.call(cell(0), ev(1));
T.onPointerMove.call(cell(0), ev(2));
fire("pointerup", { clientX: 999, clientY: 999 });
check("releasing outside the board cancels without a penalty",
  T.state.mistakes === 0 && T.state.score === 500 && T.state.selectedCells.length === 0 && T.state.selecting === false);
check("document pointerup is registered once, not per render", (docListeners.pointerup || []).length === 1,
  `${(docListeners.pointerup || []).length} listeners`);

console.log("\n[6] Random events match their banner text");
freshRun();
T.state.grid = [["T", "I", "G", "E", "R"], ["Q", "Z", "W", "V", "U"]];
// A second unfound word, so finding TIGER does not finish the puzzle and pay out.
T.state.placedWords.push({ word: "QUIZZ", cells: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] });
for (const k in T.save.quests) { T.save.quests[k].progress = 0; T.save.quests[k].claimed = true }
T.save.coins = 100;
T.state.randomEvent = "golden";
tap([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]);
check("golden word pays coins on the next correct word",
  T.save.coins === 100 + T.GOLDEN_BONUS_COINS, `coins=${T.save.coins}`);
check("golden word is consumed", T.state.randomEvent === null);
freshRun();
T.state.rushDeadline = Date.now() + 5000;
T.state.score = 0; T.endGame(true);
check("time rush pays the promised bonus points", T.state.score === T.RUSH_BONUS_POINTS, `score=${T.state.score}`);
check("rush deadline is cleared after the run", T.state.rushDeadline === null);
freshRun();
T.state.rushDeadline = Date.now() - 5000;
T.state.score = 0; T.endGame(true);
check("an expired rush window pays nothing", T.state.score === 0, `score=${T.state.score}`);
check("event duration is 20s, matching the banner", T.EVENT_DURATION_MS === 20000);

console.log("\n[7] Source-level regressions");
check("renderProfile is defined only once", (src.match(/function renderProfile\s*\(/g) || []).length === 1);
check("dead once:true cancel listener is gone", !src.includes("cancelSelection, { once: true }"));
check("drag uses pointer capture + elementFromPoint", /setPointerCapture/.test(src) && /elementFromPoint/.test(src));
check("no leftover golden-coins shortcut in endGame", !/Golden Word bonus/.test(src));

console.log("\n[8] Campaign structure and star rules");
check("48 levels across 6 chapters", T.campaign.length === 48 && T.chapterPlan.length === 6);
check("level ids and indexes are unique and sequential",
  new Set(T.campaign.map(l => l.id)).size === 48 && T.campaign.every((l, i) => l.index === i));
check("each chapter is 8 levels of its own category",
  T.chapterPlan.every((ch, i) => T.campaign.filter(l => l.chapterIndex === i).length === 8
    && T.campaign.filter(l => l.chapterIndex === i).every(l => l.category === ch.category)));
check("every level uses a real difficulty", T.campaign.every(l => !!T.difficultyConfig[l.difficulty]));
check("the last level of each chapter is a boss", T.campaign.every(l => l.boss === (l.index % 8 === 7)));
check("star time is always inside the level time",
  T.campaign.every(l => 0 < T.levelStarTime(l) && T.levelStarTime(l) < T.levelRunTime(l)));
check("every level has a distinct name", new Set(T.campaign.map(l => l.name)).size === 48);
check("star row renders 3 stars", (T.starRow(2).match(/class="star on"/g) || []).length === 2);

T.save.campaign = {};
check("only the first level starts unlocked",
  T.levelUnlocked(T.getLevel("1-1")) && !T.levelUnlocked(T.getLevel("1-2")));
check("current level starts at 1-1", T.currentLevel().id === "1-1");

const fast = T.getLevel("1-1");
check("fast + clean clear is 3 stars", T.evaluateStars(true, 10, 0, fast) === 3);
check("slow + sloppy clear is 1 star", T.evaluateStars(true, T.levelStarTime(fast) + 1, 2, fast) === 1);
check("a loss is 0 stars", T.evaluateStars(false, 10, 0, fast) === 0);

freshRun();
T.save.campaign = {};
T.state.levelId = "1-1";
T.state.elapsed = 20;
T.state.mistakes = 0;
T.endGame(true);
check("clearing level 1-1 stores 3 stars", T.save.campaign["1-1"] === 3, `stars=${T.save.campaign["1-1"]}`);
check("the next level unlocks after a clear", T.levelUnlocked(T.getLevel("1-2")));
check("total stars counts what was earned", T.totalStars() === 3);
check("current level advances to 1-2", T.currentLevel().id === "1-2");
check("map reopens on the chapter of the next level", T.state.selectedChapter === null);

freshRun();
T.save.campaign = {};
T.state.levelId = "1-2";
T.state.elapsed = T.levelStarTime(T.getLevel("1-2")) + 5;
T.state.mistakes = 3;
T.endGame(true);
check("a sloppy clear earns a single star", T.save.campaign["1-2"] === 1);
T.state.levelId = "1-2"; T.state.elapsed = 999; T.state.mistakes = 4; T.endGame(true);
check("a replay cannot lower the star count", T.save.campaign["1-2"] === 1);

freshRun();
T.save.campaign = {};
T.state.levelId = "1-3";
T.endGame(false);
check("a failed level earns no stars and blocks the next one",
  T.levelStars("1-3") === 0 && !T.levelUnlocked(T.getLevel("1-4")));

T.renderCampaign();
check("renderCampaign reports the star total",
  doc.querySelector("#campaignStars").textContent === `${T.totalStars()} / ${T.maxStars}`,
  doc.querySelector("#campaignStars").textContent);

console.log("\n[9] Campaign levels are reproducible");
const lvl = T.getLevel("2-5");
const lvlWords = T.chooseWords(lvl.category, T.difficultyConfig[lvl.difficulty].words, lvl.difficulty, false, `level|${lvl.id}`);
const lvlWords2 = T.chooseWords(lvl.category, T.difficultyConfig[lvl.difficulty].words, lvl.difficulty, false, `level|${lvl.id}`);
check("the same level always uses the same words", JSON.stringify(lvlWords) === JSON.stringify(lvlWords2));
const size = T.difficultyConfig[lvl.difficulty].size;
const g1 = T.generateGrid(size, lvlWords, `level|${lvl.id}`);
const g2 = T.generateGrid(size, lvlWords, `level|${lvl.id}`);
check("the same level always builds the same grid", JSON.stringify(g1.grid) === JSON.stringify(g2.grid));
check("the same level places every word in the same cells",
  JSON.stringify(g1.placements) === JSON.stringify(g2.placements));
check("a different seed builds a different grid",
  JSON.stringify(g1.grid) !== JSON.stringify(T.generateGrid(size, lvlWords, "level|9-9").grid));
const dailyWords = T.chooseWords("Food", 9, "Medium", true);
check("the daily challenge grid is reproducible too",
  JSON.stringify(T.generateGrid(12, dailyWords, "daily|Food|Medium|2026-01-01").grid)
  === JSON.stringify(T.generateGrid(12, dailyWords, "daily|Food|Medium|2026-01-01").grid));

console.log("\n[10] Word codex");
T.save.codex = {};
check("the codex starts empty", T.learnedCount() === 0);
const everyWord = [...T.allWords().keys()];
check("allWords() lists each unique word once", everyWord.length === new Set(everyWord).size);
check("every playable word has a real definition",
  everyWord.every(w => typeof T.wordDefinition(w) === "string" && T.wordDefinition(w).length > 15));
freshRun();
T.state.grid = [["T", "I", "G", "E", "R"], ["Q", "Z", "W", "V", "U"]];
T.state.placedWords = [
  { word: "TIGER", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { word: "QUIZZ", cells: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] }
];
T.state.selectedCategory = "Animals";
tap([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]);
check("finding a word records it in the codex",
  !!T.save.codex.TIGER && T.save.codex.TIGER.cat === "Animals" && T.save.codex.TIGER.n === 1);
check("the learned counter grows", T.learnedCount() === 1);
check("the status line reveals the definition",
  doc.querySelector("#statusText").textContent.includes("TIGER")
  && doc.querySelector("#statusText").textContent.includes("striped"));
tap([[0, 4], [0, 3], [0, 2], [0, 1], [0, 0]]);
check("tapping a found word does not double count it",
  T.state.foundWords.has("TIGER") && T.save.codex.TIGER.n === 1);
T.renderCodex();
check("renderCodex reports learned of total",
  doc.querySelector("#codexCount").textContent === `1 / ${T.allWords().size}`,
  doc.querySelector("#codexCount").textContent);
const savedGame = JSON.parse(stored.get(T.SAVE_KEY)).accounts[T.store.active].save;
check("the codex is written to storage", !!savedGame.codex.TIGER);
check("the campaign is written to storage", typeof savedGame.campaign === "object");

console.log("\n[11] Every campaign level builds a complete, readable puzzle");
const incomplete = [];
for (const l of T.campaign) {
  const cfg = T.difficultyConfig[l.difficulty];
  const count = l.boss ? Math.min(cfg.words + 2, 12) : cfg.words;
  const words = T.chooseWords(l.category, count, l.difficulty, false, `level|${l.id}`);
  const gen = T.generateGrid(cfg.size, words, `level|${l.id}`);
  if (gen.placements.length !== count) incomplete.push(`${l.id} placed ${gen.placements.length}/${count}`);
  if (gen.grid.length !== cfg.size || !gen.grid.every(row => row.length === cfg.size)) incomplete.push(`${l.id} bad grid`);
  for (const p of gen.placements) {
    const letters = p.cells.map(([r, c]) => gen.grid[r][c]).join("");
    if (letters !== p.word && letters !== [...p.word].reverse().join("")) incomplete.push(`${l.id} ${p.word} unreadable`);
    if (p.cells.some(([r, c]) => r < 0 || c < 0 || r >= cfg.size || c >= cfg.size)) incomplete.push(`${l.id} ${p.word} out of bounds`);
  }
}
check("all 48 levels place every word, readable and in bounds",
  incomplete.length === 0, incomplete.slice(0, 4).join(" | "));

console.log("\n[12] Power-ups: hints that hint, finder worth its price");
const vertical = { word: "FOREST", cells: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2]] };
const hV = T.hintText(vertical, 10);
check("hint states the word length", hV.includes("6 letters"), hV);
check("hint states the direction", hV.includes("vertically"), hV);
check("hint states the first letter", hV.includes('"F"'), hV);
check("hint names the search region", hV.includes("top-left corner"), hV);
check("hint never leaks the definition", !hV.includes(T.wordDefinition("FOREST")), hV);
check("direction detection covers all three axes",
  T.wordDirection([[2, 2], [2, 3]]) === "horizontally"
  && T.wordDirection([[2, 2], [3, 2]]) === "vertically"
  && T.wordDirection([[2, 2], [3, 3]]) === "diagonally");
check("region covers every quadrant",
  T.boardRegion(0, 0, 10) === "top-left corner" && T.boardRegion(0, 9, 10) === "top-right corner"
  && T.boardRegion(9, 0, 10) === "bottom-left corner" && T.boardRegion(9, 9, 10) === "bottom-right corner");

freshRun();
T.state.grid = [["T", "I", "G", "E", "R"], ["Q", "Z", "W", "V", "U"]];
T.state.placedWords = [
  { word: "TIGER", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { word: "QUIZZ", cells: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] }
];
T.renderGame();
const markAt = (r, c) => gridHost.children.find(d => +d.dataset.r === r && +d.dataset.c === c).classList.contains("finder");
const wordMarked = (word) => T.state.placedWords.find(p => p.word === word).cells.every(([r, c]) => markAt(r, c));
T.save.powers.finder = 1;
T.usePower("finder");
check("finder lights a whole word, not a fragment",
  wordMarked("TIGER") !== wordMarked("QUIZZ"),
  `TIGER=${wordMarked("TIGER")} QUIZZ=${wordMarked("QUIZZ")}`);
check("finder names the word it revealed",
  /TIGER|QUIZZ/.test(doc.querySelector("#statusText").textContent)
  && doc.querySelector("#statusText").textContent.includes("letters"),
  doc.querySelector("#statusText").textContent);
check("finder consumes a charge", T.save.powers.finder === 0);
check("finder reveal lasts 2 seconds", T.FINDER_REVEAL_MS === 2000);

T.save.powers.hint = 0;
T.state.freeHints = 1;
T.usePower("hint");
check("a free hint is spent before a bought one", T.state.freeHints === 0 && T.save.powers.hint === 0);
T.save.powers.hint = 2;
T.usePower("hint");
check("bought hints are used once free ones are gone", T.save.powers.hint === 1);
T.save.powers.hint = 0; T.state.freeHints = 0;
T.usePower("hint");
check("no charge means no hint is given", T.save.powers.hint === 0 && T.state.freeHints === 0);

console.log("\n[13] Permanent upgrades");
T.save.upgrades = { extraTime: 0, coinBoost: 0, freeHint: 0, softMistakes: 0 };
T.save.coins = 1000;
check("upgrades start at level 0 with no effect",
  T.upgradeLevel("extraTime") === 0 && T.bonusTimeSeconds() === 0 && T.coinBoostMultiplier() === 1);
check("the base mistake penalty is 25", T.mistakePenalty() === 25 && T.MISTAKE_PENALTY === 25);
T.buyUpgrade("extraTime");
check("buying an upgrade spends coins and raises the level",
  T.save.upgrades.extraTime === 1 && T.save.coins === 850, `coins=${T.save.coins}`);
check("upgrade costs escalate", T.upgradeCost("extraTime") === 300);
check("extra time now applies to puzzles", T.bonusTimeSeconds() === 5);
T.save.coins = 10;
T.buyUpgrade("coinBoost");
check("an upgrade cannot be bought without the coins",
  T.save.upgrades.coinBoost === 0 && T.save.coins === 10);
T.save.upgrades.extraTime = 3;
T.save.coins = 5000;
T.buyUpgrade("extraTime");
check("a maxed upgrade cannot be bought again",
  T.upgradeMaxed("extraTime") && T.save.upgrades.extraTime === 3 && T.save.coins === 5000);
T.save.upgrades.coinBoost = 2;
check("coin charm raises coin payouts by 20%", Math.abs(T.coinBoostMultiplier() - 1.2) < 1e-9);
T.save.upgrades.softMistakes = 3;
check("steady hand softens mistakes to 10 points", T.mistakePenalty() === 10);
T.save.upgrades.softMistakes = 9;
check("the mistake penalty can never go negative", T.mistakePenalty() === 0);

console.log("\n[14] Upgrades and powers feed into a live run");
T.save.upgrades = { extraTime: 2, coinBoost: 0, freeHint: 1, softMistakes: 0 };
T.save.powers.hint = 0;
T.startGame({ level: "1-1" });
const lvl1 = T.getLevel("1-1");
check("extra time lengthens the puzzle", T.state.seconds === T.levelRunTime(lvl1) + 10,
  `${T.state.seconds} vs ${T.levelRunTime(lvl1) + 10}`);
check("scholar's instinct grants a free hint per puzzle", T.state.freeHints === 1);
clearInterval(T.state.timer);
T.state.timer = null;
T.save.upgrades = { extraTime: 0, coinBoost: 0, freeHint: 0, softMistakes: 0 };

function winCoins(multiplierOn) {
  freshRun();
  T.state.levelId = null; T.state.boss = false; T.state.daily = false;
  T.state.selectedDifficulty = "Medium";
  T.state.seconds = 90; T.state.score = 0;
  T.state.multiplierActive = multiplierOn;
  const before = T.save.coins;
  T.endGame(true);
  return T.save.coins - before;
}
const basePayout = winCoins(false);
const doubledPayout = winCoins(true);
check("2× Points & Coins doubles the payout", doubledPayout === basePayout * 2,
  `${basePayout} -> ${doubledPayout}`);
check("the multiplier is consumed by a win", T.state.multiplierActive === false);
T.save.upgrades.coinBoost = 3;
const boostedPayout = winCoins(false);
check("coin charm adds 30% to the payout", boostedPayout === Math.round(basePayout * 1.3),
  `${basePayout} -> ${boostedPayout}`);
T.save.upgrades.coinBoost = 0;

console.log("\n[15] Power refunds, star rewards and shop access");
freshRun();
T.save.powers.shield = 0; T.save.powers.multiplier = 0;
T.state.shieldActive = true; T.state.multiplierActive = true;
const refunded = T.refundActivePowers();
check("quitting refunds unused activated powers",
  refunded.length === 2 && T.save.powers.shield === 1 && T.save.powers.multiplier === 1);
check("the refund clears the active flags",
  T.state.shieldActive === false && T.state.multiplierActive === false);
check("nothing is refunded when nothing is active", T.refundActivePowers().length === 0);

freshRun();
T.save.campaign = {}; T.save.campaignBest = {}; T.save.powers.finder = 0;
T.state.levelId = "1-1"; T.state.elapsed = 10; T.state.mistakes = 0; T.state.score = 1234;
T.endGame(true);
check("a 3-star clear grants a free Word Finder", T.save.powers.finder === 1);
check("the level best score is recorded", T.save.campaignBest["1-1"] === 1234);

freshRun();
T.save.campaign = {}; T.save.powers.time = 0; T.save.powers.shield = 0;
T.state.levelId = "1-8"; T.state.elapsed = 10; T.state.mistakes = 0;
T.endGame(true);
check("clearing a chapter boss grants powers",
  T.save.powers.time === 1 && T.save.powers.shield === 1);
check("chapter finales are boss levels", T.getLevel("1-8").boss === true);

check("the shop is reachable from inside a puzzle",
  /id="gameShopBtn"/.test(htmlSrc) && /#gameShopBtn/.test(src));
check("the hint no longer prints the definition",
  /modal\("Word Hint", hintText\(/.test(src) && !/hints\[p\.word\]/.test(src));
check("the finder no longer shows a 3-letter fragment", !/p\.cells\.slice\(0, count\)/.test(src));
check("shop prices have a single source", /id="priceTime"/.test(htmlSrc) && /powerPrices/.test(src));
check("permanent upgrades are rendered into the shop",
  /id="upgradeGrid"/.test(htmlSrc) && /renderUpgrades/.test(src));

console.log("\n[16] Accounts: storage, hashing and migration");
check("the store is versioned for future migrations", T.store.version === T.SAVE_VERSION);
check("isFlatSave spots a pre-accounts save", T.isFlatSave({ coins: 1, powers: {} }));
check("isFlatSave rejects an account store", !T.isFlatSave({ accounts: {}, active: null }));
check("isFlatSave rejects junk", !T.isFlatSave(null) && !T.isFlatSave("nope"));

const saltA = T.randomSalt();
const saltB = T.randomSalt();
check("each salt is unique", saltA !== saltB && saltA.length > 0);
const h1 = await T.hashPin("1234", saltA);
const h2 = await T.hashPin("1234", saltA);
const h3 = await T.hashPin("1234", saltB);
check("hashing is deterministic for one salt", h1 === h2);
check("a different salt gives a different hash", h1 !== h3);
check("the hash is never the PIN itself", h1 !== "1234" && h1.length >= 32);
check("SHA-256 is used when Web Crypto is available", h1.length === 64, `len=${h1.length}`);
const savedCrypto = sandbox.crypto;
sandbox.crypto = undefined;
const fallbackHash = await T.hashPin("1234", saltA);
sandbox.crypto = savedCrypto;
check("a salted fallback still hashes without Web Crypto",
  fallbackHash.startsWith("fnv") && fallbackHash !== h1 && fallbackHash.length > 3);

// A save from before accounts existed must not be thrown away.
stored.set(T.SAVE_KEY, JSON.stringify({
  coins: 999, wordsFound: 42, level: 4, campaign: { "1-1": 3 }, codex: { TIGER: { cat: "Animals", n: 2 } }
}));
const migrated = T.accountStoreLoad();
const legacy = Object.values(migrated.accounts)[0];
check("an old flat save becomes one profile",
  Object.keys(migrated.accounts).length === 1 && migrated.active === legacy.id);
check("migration keeps the old progress",
  legacy.save.coins === 999 && legacy.save.wordsFound === 42 && legacy.save.level === 4);
check("migration keeps campaign stars and the codex",
  T.accountStars(legacy) === 3 && legacy.save.codex.TIGER.n === 2);
check("migration fills in every newer field",
  !!legacy.save.powers && !!legacy.save.upgrades && !!legacy.save.quests);
check("the migrated profile is named and usable", legacy.name === "Player 1");

// Reloading a real store keeps profiles and their saves.
const roundTrip = T.accountStoreLoad();
check("an account store reloads unchanged",
  Object.keys(roundTrip.accounts).length === 1 && roundTrip.accounts[legacy.id].save.coins === 999);
check("the upgraded store is written immediately, so it cannot re-migrate",
  JSON.parse(stored.get(T.SAVE_KEY)).accounts[legacy.id].save.coins === 999);

stored.set(T.SAVE_KEY, JSON.stringify({
  version: 2, active: "ghost", accounts: { real: { name: "Real", save: { coins: 5 } } }
}));
check("a dangling active id is cleared on load", T.accountStoreLoad().active === null);
check("the real profile still loads", Object.keys(T.accountStoreLoad().accounts).length === 1);

// A corrupt / half-written store must not crash the app.
stored.set(T.SAVE_KEY, "{ this is not json");
check("unreadable storage falls back to an empty store",
  Object.keys(T.accountStoreLoad().accounts).length === 0);
stored.set(T.SAVE_KEY, JSON.stringify({ version: 2, active: "ghost", accounts: { x: null } }));
check("a broken account entry is dropped", Object.keys(T.accountStoreLoad().accounts).length === 0);

console.log("\n[17] Accounts: create, sign in, isolate progress");
function resetAccounts() {
  const s = T.store;
  Object.keys(s.accounts).forEach(id => delete s.accounts[id]);
  s.active = null;
  stored.set(T.SAVE_KEY, JSON.stringify(s));
}
resetAccounts();
const nameEl = doc.querySelector("#newAccountName");
const pinEl = doc.querySelector("#newAccountPin");

nameEl.value = "A";
await T.createAccount();
check("a 1-character name is refused", T.accountList().length === 0);

nameEl.value = "Kobs";
pinEl.value = "";
await T.createAccount();
check("a valid name creates a profile", T.accountList().length === 1);
check("creating a profile signs you in", T.store.active === T.activeAccount().id && T.activeAccount().name === "Kobs");
check("a new profile starts from fresh defaults",
  T.save.coins === T.defaultSave.coins && T.totalStars() === 0 && Object.keys(T.save.codex).length === 0);

nameEl.value = "kobs";
await T.createAccount();
check("the same name is refused whatever the case", T.accountList().length === 1);

nameEl.value = "Rival";
pinEl.value = "12";
await T.createAccount();
check("a non-4-digit PIN is refused", T.accountList().length === 1);

pinEl.value = "1234";
await T.createAccount();
const kobs = T.accountList().find(a => a.name === "Kobs");
const rival = T.accountList().find(a => a.name === "Rival");
check("a second profile with a PIN is created", T.accountList().length === 2 && !!rival.pin);
check("the PIN is stored as salt + hash only",
  !!rival.pin.salt && !!rival.pin.hash
  && rival.pin.hash !== "1234" && !JSON.stringify(rival.pin).includes("1234"));
check("profiles are listed alphabetically", T.accountList()[0].name === "Kobs");
T.renderAccountScreen();
check("the account screen draws one card per profile",
  doc.querySelector("#accountGrid").children.length === 2);
check("the profile count is displayed", doc.querySelector("#accountCount").textContent === 2);
check("the create form is cleared after use", nameEl.value === "" && pinEl.value === "");
check("the avatars offered match the avatar list",
  doc.querySelector("#avatarPicker").children.length === T.AVATARS.length);

// Isolation: one profile's coins must never leak into another's.
T.adoptAccount(kobs.id);
T.save.coins = 777;
T.accountStoreWrite();
check("progress is written into the signed-in profile", T.store.accounts[kobs.id].save.coins === 777);
T.adoptAccount(rival.id);
check("switching profiles loads the other save", T.save.coins === T.defaultSave.coins, `coins=${T.save.coins}`);
check("the first profile keeps its coins", T.store.accounts[kobs.id].save.coins === 777);
check("the other profile's data is untouched", T.store.accounts[rival.id].save.coins === T.defaultSave.coins);

// Switching profile while a puzzle is running must not leak the run across.
T.adoptAccount(kobs.id);
T.startGame({ level: "1-1" });
T.save.powers.shield = 0;
T.state.shieldActive = true;
T.adoptAccount(rival.id);
check("switching profiles mid-puzzle stops the run", T.state.timer === null);
check("the abandoned run's power is refunded to the profile that bought it",
  T.store.accounts[kobs.id].save.powers.shield === 1
  && T.store.accounts[rival.id].save.powers.shield === T.defaultSave.powers.shield);
check("the run no longer belongs to a level", T.state.levelId === null);

const signIn1 = T.signInToAccount(kobs.id);
await signIn1;
check("a profile without a PIN signs in at once", T.store.active === kobs.id);

const signIn2 = T.signInToAccount(rival.id);
T.closePrompt("9999");
await signIn2;
check("a wrong PIN is refused", T.store.active === kobs.id);

const signIn3 = T.signInToAccount(rival.id);
T.closePrompt("1234");
await signIn3;
check("the correct PIN signs in", T.store.active === rival.id);

const signIn4 = T.signInToAccount(rival.id);
T.closePrompt(null);
await signIn4;
check("cancelling the PIN prompt changes nothing", T.store.active === rival.id);

T.accountStoreWrite();
const reloadedNow = T.accountStoreLoad();
check("both profiles survive a reload", Object.keys(reloadedNow.accounts).length === 2);
check("progress survives a reload", reloadedNow.accounts[kobs.id].save.coins === 777);
check("the signed-in profile survives a reload", reloadedNow.active === rival.id);
check("PIN protection survives a reload", !!reloadedNow.accounts[rival.id].pin);
check("the store is written to the one save key the desktop bridge mirrors",
  stored.has(T.SAVE_KEY) && JSON.parse(stored.get(T.SAVE_KEY)).accounts[kobs.id].save.coins === 777);

console.log("\n[18] Accounts: rename, PIN, delete, sign out, backup");

const rename1 = T.renameAccount(kobs.id);
T.closePrompt("Rival");
await rename1;
check("a duplicate name is refused", T.store.accounts[kobs.id].name === "Kobs");

const rename2 = T.renameAccount(kobs.id);
T.closePrompt("Champion");
await rename2;
check("a rename sticks", T.store.accounts[kobs.id].name === "Champion");

const rename3 = T.renameAccount(kobs.id);
T.closePrompt(null);
await rename3;
check("cancelling a rename changes nothing", T.store.accounts[kobs.id].name === "Champion");

const rename4 = T.renameAccount(kobs.id);
T.closePrompt("K");
await rename4;
check("a too-short rename is refused", T.store.accounts[kobs.id].name === "Champion");

const avatarBefore = T.store.accounts[kobs.id].avatar;
T.cycleAvatar(kobs.id);
check("the avatar can be changed",
  T.store.accounts[kobs.id].avatar !== avatarBefore && T.AVATARS.includes(T.store.accounts[kobs.id].avatar));
T.store.accounts[kobs.id].avatar = T.AVATARS[T.AVATARS.length - 1];
T.cycleAvatar(kobs.id);
check("avatar cycling wraps around", T.store.accounts[kobs.id].avatar === T.AVATARS[0]);

const pin1 = T.managePin(kobs.id);
T.closePrompt("42");
await pin1;
check("a too-short PIN is refused", T.store.accounts[kobs.id].pin === null);
const pin2 = T.managePin(kobs.id);
T.closePrompt("4321");
await pin2;
check("a PIN can be added", !!T.store.accounts[kobs.id].pin);
const pin3 = T.managePin(kobs.id);
T.closePrompt("");
await pin3;
check("an empty PIN removes protection", T.store.accounts[kobs.id].pin === null);
const pin4 = T.managePin(kobs.id);
T.closePrompt(null);
await pin4;
check("cancelling a PIN change changes nothing", T.store.accounts[kobs.id].pin === null);

T.adoptAccount(rival.id);
confirmAnswer = false;
T.deleteAccount(rival.id);
check("deleting a profile needs confirmation", Object.keys(T.store.accounts).length === 2);
confirmAnswer = true;
T.deleteAccount(rival.id);
confirmAnswer = false;
check("a confirmed delete removes the profile", !T.store.accounts[rival.id]);
check("deleting the signed-in profile signs you out", T.store.active === null && T.activeAccount() === null);
check("the other profile is untouched", !!T.store.accounts[kobs.id]);

T.adoptAccount(kobs.id);
T.save.coins = 500;
T.signOut();
check("signing out clears the active profile", T.store.active === null && T.activeAccount() === null);
check("signing out resets the in-memory save", T.save.coins === T.defaultSave.coins);
check("the signed-out profile keeps its coins", T.store.accounts[kobs.id].save.coins === 500);

T.showScreen("homeScreen");
check("the game is gated behind a profile",
  doc.querySelector("#accountScreen").classList.contains("active")
  && !doc.querySelector("#homeScreen").classList.contains("active"));
T.showScreen("campaignScreen");
check("the campaign is gated too", doc.querySelector("#accountScreen").classList.contains("active"));

T.adoptAccount(kobs.id);
T.showScreen("homeScreen");
check("signed in, the home screen opens", doc.querySelector("#homeScreen").classList.contains("active"));

lastBlobParts = null;
T.exportAccount(kobs.id);
const exported = lastBlobParts ? JSON.parse(lastBlobParts[0]) : null;
check("export produces a readable profile file",
  !!exported && exported.name === T.store.accounts[kobs.id].name && typeof exported.save === "object");
check("the export carries the progress", exported.save.coins === 500);

const beforeImport = T.accountList().length;
T.importAccount({ __text: JSON.stringify(exported) });
const imported = T.accountList().find(a => String(a.name).includes("(imported)"));
check("importing adds the profile back", T.accountList().length === beforeImport + 1 && !!imported);
check("the imported profile keeps its progress", imported.save.coins === 500);
check("an imported profile starts without a PIN", imported.pin === null);
check("a clashing name is suffixed and still fits",
  String(imported.name).endsWith("(imported)") && String(imported.name).length <= T.NAME_MAX);
T.importAccount({ __text: "{ not json at all" });
T.importAccount({ __text: JSON.stringify({ hello: "world" }) });
check("junk files are refused", T.accountList().length === beforeImport + 1);

check("the save key is the one the desktop bridge mirrors",
  T.SAVE_KEY === "wordQuestSave"
  && /wordQuestSave/.test(fs.readFileSync("C:/Users/Kobs/Documents/Word Quest/desktop-app/web-shim/host.js", "utf8")));
check("account markup and prompts exist",
  /id="accountScreen"/.test(htmlSrc) && /id="accountGrid"/.test(htmlSrc) && /id="promptModal"/.test(htmlSrc));
check("the HUD shows who is signed in",
  /id="accountAvatar"/.test(htmlSrc) && /id="accountName"/.test(htmlSrc) && /id="accountBtn"/.test(htmlSrc));
check("the profile screen offers switch and sign out",
  /id="profileSwitchBtn"/.test(htmlSrc) && /id="profileSignOutBtn"/.test(htmlSrc));
check("a PIN is never assigned or stored in plain text",
  !/\.pin\s*=\s*pin\b/.test(src) && !/pin:\s*"/.test(src));

console.log(`\n${failed === 0 ? "ALL GREEN" : "FAILURES"} - ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);


