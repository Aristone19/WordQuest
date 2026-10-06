// Word Quest - content and asset quality checks.
//
// Complements the smoke harness: where that one proves the game WORKS, this one
// proves the game has something to SAY. Run:  node content-check.mjs
import { loadApp } from "./dom-stub.mjs";

const APP = "C:/Users/Kobs/Documents/Word Quest/word-quest-game/app.js";

let passed = 0, failed = 0;
function check(name, cond, detail = "") {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}${detail ? "  -> " + detail : ""}`); }
}

// Load the real game file through the shared DOM stub; only the data is under test.
const { T: D } = loadApp(APP, [
  "categories", "hints", "allWords", "wordsMissingDefinitions", "wordDefinition"
]);

console.log("\n[1] Every playable word has a real definition");
const all = [...D.allWords().keys()];
const missing = D.wordsMissingDefinitions();
check("no playable word falls back to the placeholder", missing.length === 0, missing.join(", "));
check("every word has a definition", all.every(w => !!D.hints[w]));
check("no definition is the placeholder text",
  Object.values(D.hints).every(d => d !== "Keep playing this category to learn more about this word."));

console.log("\n[2] Definitions are worth reading");
const short = all.filter(w => D.wordDefinition(w).length < 25);
check("every definition is a real sentence, not a stub", short.length === 0, short.join(", "));
const long = all.filter(w => D.wordDefinition(w).length > 130);
check("no definition rambles", long.length === 0, long.join(", "));
check("definitions end with a full stop", all.every(w => /\.\s*$/.test(D.wordDefinition(w))));
check("definitions are not all identical", new Set(all.map(w => D.wordDefinition(w))).size > all.length * 0.9);

console.log("\n[3] Every category is fully explained");
for (const [cat, lists] of Object.entries(D.categories)) {
  const words = [...new Set(lists.flat().map(w => w.toUpperCase()))];
  const gaps = words.filter(w => !D.hints[w]);
  check(`${cat}: all ${words.length} words explained`, gaps.length === 0, gaps.join(", "));
}

console.log("\n[4] A word belongs to exactly one category");
const owner = new Map();
const clashes = [];
for (const [cat, lists] of Object.entries(D.categories)) {
  for (const w of new Set(lists.flat().map(x => x.toUpperCase()))) {
    if (owner.has(w)) clashes.push(`${w} (${owner.get(w)} / ${cat})`);
    else owner.set(w, cat);
  }
}
check("no word appears in two categories", clashes.length === 0, clashes.join(", "));

console.log("\n[5] Word shapes suit a word search");
const allWords = all;
check("no word is shorter than 3 letters", allWords.every(w => w.length >= 3), allWords.filter(w => w.length < 3).join(", "));
check("no word is longer than 14 letters", allWords.every(w => w.length <= 14), allWords.filter(w => w.length > 14).join(", "));
check("words are letters only", allWords.every(w => /^[A-Z]+$/.test(w)),
  allWords.filter(w => !/^[A-Z]+$/.test(w)).join(", "));
check("no word is a substring of another word", (() => {
  const dupes = allWords.filter(a => allWords.some(b => b !== a && b.includes(a)));
  return dupes.length === 0;
})(), (() => {
  const dupes = allWords.filter(a => allWords.some(b => b !== a && b.includes(a)));
  return dupes.join(", ");
})());
check("the word list is not tiny", allWords.length >= 80, `${allWords.length} words`);

console.log(`\n${failed === 0 ? "ALL GREEN" : "FAILURES"} - ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
