const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

window.addEventListener('load', () => {
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 800);
});

// =========================================================
// ACCESSIBILITY
// =========================================================
//
// Five settings, all optional and all on by default to "off". Each one is stored
// in the save, applied as a data-attribute on <html> so the stylesheet can react,
// and mirrored into the aria-live region so a screen reader hears feedback the
// sighted player gets from colour and motion.

const A11Y_DEFAULTS = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  keyboardHelp: true,
  colorBlindMode: false
};

const A11Y_LABELS = {
  reduceMotion: "Reduce motion",
  highContrast: "High contrast",
  largeText: "Larger text",
  keyboardHelp: "Show keyboard hints",
  colorBlindMode: "Colour-blind friendly"
};

/** Fills in any setting added after a player's save was written. */
function a11ySettings() {
  if (!save.a11y || typeof save.a11y !== "object") save.a11y = { ...A11Y_DEFAULTS };
  // Rebuild from the defaults so keys that no longer exist cannot linger.
  const merged = { ...A11Y_DEFAULTS };
  for (const key of Object.keys(A11Y_DEFAULTS)) {
    if (typeof save.a11y[key] === "boolean") merged[key] = save.a11y[key];
  }
  save.a11y = merged;
  return save.a11y;
}

/** The operating system preference, which the manual switch defaults to. */
function systemPrefersReducedMotion() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch { return false; }
}

/**
 * Applies every setting to the document. Called once at startup and again
 * whenever a setting changes, so the stylesheet never needs to know about the UI.
 */
function applyAccessibility() {
  const s = a11ySettings();
  const root = document.documentElement;
  // Nothing to apply to in a stripped-down test DOM; still return the settings.
  if (!root) return s;

  // Motion is reduced if the player asked for it OR the system asked for it, so
  // a player who has already asked the OS never has to ask the game too.
  const reduce = s.reduceMotion || systemPrefersReducedMotion();
  root.toggleAttribute("data-reduce-motion", reduce);
  root.toggleAttribute("data-high-contrast", s.highContrast);
  root.toggleAttribute("data-large-text", s.largeText);
  root.toggleAttribute("data-keyboard-help", s.keyboardHelp);
  root.toggleAttribute("data-colorblind", s.colorBlindMode);

  if (s.largeText) root.style.setProperty("--text-scale", "1.18");
  else root.style.removeProperty("--text-scale");

  const help = $("#keyboardHelp");
  if (help) help.hidden = !s.keyboardHelp;
  return s;
}

function setA11y(key, value) {
  if (!(key in A11Y_DEFAULTS)) return false;
  a11ySettings()[key] = !!value;
  applyAccessibility();
  persist();
  return true;
}

const categories = {
  Animals: [
    ["TIGER", "LION", "ZEBRA", "PANDA", "EAGLE", "SHARK", "WHALE", "OTTER", "COBRA", "HORSE", "RABBIT", "MONKEY", "PARROT", "TURTLE"],
    ["elephant", "giraffe", "dolphin", "penguin", "buffalo", "leopard"]
  ],
  Nature: [
    ["FOREST", "RIVER", "OCEAN", "MOUNTAIN", "VALLEY", "FLOWER", "CLOUD", "STORM", "DESERT", "CANYON", "MEADOW", "SHOWER", "WIND"],
    ["waterfall", "sunlight", "volcano", "rainbow", "glacier"]
  ],
  Technology: [
    ["CODE", "PIXEL", "ROBOT", "SERVER", "BROWSER", "NETWORK", "SCRIPT", "FACTS", "LOGIC", "SYSTEM", "MOBILE", "CYBER", "DIGITAL"],
    ["algorithm", "database", "software", "hardware", "internet"]
  ],
  Food: [
    ["PIZZA", "PASTA", "BREAD", "MANGO", "APPLE", "CHEESE", "BURGER", "NOODLE", "COOKIE", "SALAD", "CHICKEN", "RICE", "SOUP", "TACO"],
    ["sandwich", "chocolate", "pancake", "avocado", "coconut"]
  ],
  Sports: [
    ["SOCCER", "TENNIS", "BOXING", "RACING", "GOLF", "RUGBY", "HOCKEY", "SWIM", "DANCE", "CHESS", "BASKET", "VOLLEY", "TRACK", "KARATE"],
    ["badminton", "baseball", "cycling", "bowling", "archery"]
  ],
  Geography: [
    ["ASIA", "EUROPE", "AFRICA", "ISLAND", "HARBOR", "COAST", "CHINA", "JAPAN", "INDIA", "CANADA", "BRAZIL", "EGYPT", "SPAIN", "ITALY"],
    ["philippines", "australia", "america", "england", "mexico"]
  ]
};

const hints = {
  TIGER: "A large striped wild cat with orange and black fur.", LION: "A wild cat known as the king of the jungle, with a golden mane.", ZEBRA: "A striped African animal with black and white stripes.",
  PANDA: "A black-and-white bear from China that eats bamboo almost exclusively.", EAGLE: "A large bird of prey with excellent eyesight and hooked beak.", SHARK: "A powerful ocean predator with sharp teeth and gills.",
  WHALE: "One of the largest animals on Earth, living entirely in the ocean.", OTTER: "A playful aquatic mammal that swims on its back and has thick fur.", COBRA: "A venomous snake that raises a hood behind its head when threatened.",
  HORSE: "A fast animal with hooves, kept for riding, racing and farm work.", RABBIT: "A small animal with long ears, short tail and very fast hind legs.", MONKEY: "A clever primate with grasping hands, a long tail and loud calls.",
  PARROT: "A colourful bird with a curved beak, famous for mimicking human speech.", TURTLE: "A reptile with a hard bony shell that it can retract into for safety.",
  FOREST: "A large area of land covered in trees, home to many animals.", RIVER: "A natural stream of flowing water that travels toward a sea or lake.", OCEAN: "A vast body of salt water that covers most of the planet.",
  MOUNTAIN: "A very high natural landform, usually with a peak and steep sides.", VALLEY: "A low area of land between hills or mountains, often with a river.", FLOWER: "The colourful part of a plant that grows to make new seeds.",
  CLOUD: "A visible mass of water droplets or ice floating high in the sky.", STORM: "Severe weather with strong wind, heavy rain, thunder or snow.", DESERT: "A very dry region that gets almost no rainfall all year.",
  ISLAND: "A piece of land completely surrounded by water on all sides.", CANYON: "A deep, narrow valley with steep rocky sides cut by a river.", MEADOW: "An open field of grass with few trees, often full of wildflowers.",
  CODE: "A set of instructions written in a language a computer can understand.", PIXEL: "The smallest single dot of colour that makes up an image on a screen.", ROBOT: "A programmable machine that can carry out tasks by itself.",
  SERVER: "A powerful computer that stores data and serves it to other computers.", BROWSER: "Software such as Edge or Chrome used to view and read websites.", NETWORK: "Two or more connected computers that can share data and messages.",
  SCRIPT: "A small program or sequence of commands that runs a task.", DATA: "Facts, figures and information collected and stored for use.", LOGIC: "Reasoning and orderly thought used to work out how to decide something.",
  SYSTEM: "A set of parts that work together to achieve a single result.", MOBILE: "A device designed to be carried and used while moving, like a phone.", CYBER: "Relating to computers, computer networks and digital security.",
  DIGITAL: "Something that exists in the form of numbers and electronic data.", PIZZA: "A baked dish of flat dough covered with sauce and melted cheese.", PASTA: "Food made from flour and water, served with sauce or in a salad.",
  BREAD: "Baked food made from flour and yeast, the base of many meals.", MANGO: "A sweet tropical fruit with juicy orange flesh and a flat seed.", APPLE: "A round fruit with crisp flesh, grown on trees in cool climates.",
  CHEESE: "A solid food made from milk, aged and often used in cooking.", BURGER: "A sandwich of a cooked patty in a soft bun with toppings.", NOODLE: "A long thin strip of pasta, boiled or fried and served with sauce.",
  COOKIE: "A small sweet baked treat.", SALAD: "A dish of mixed vegetables or ingredients.", CHICKEN: "A farm bird whose meat is eaten all over the world as a dish.", RICE: "A small white or brown grain, a staple food for half the world.", SOUP: "A liquid dish of broth and small pieces, usually served warm.", TACO: "A folded corn tortilla filled with meat, salsa and other toppings.",
  // Longer words (the second list of each category) are used by Medium and Hard puzzles.
  ELEPHANT: "A huge animal with a long trunk, large ears and thick grey legs.", GIRAFFE: "The tallest land animal, with a very long neck and spotted coat.", DOLPHIN: "A clever marine mammal that swims in groups and clicks to talk.",
  PENGUIN: "A flightless bird that cannot fly but swims expertly in cold water.", BUFFALO: "A large heavy wild ox with wide curved horns, found in Asia and Africa.", LEOPARD: "A big cat with a spotted coat that climbs trees and hunts at night.",
  WATERFALL: "Water dropping from a great height, crashing down as a cascade.", SUNLIGHT: "Bright natural light from the sun that fills the day.", VOLCANO: "A mountain with a cracked summit that can erupt with hot lava and ash.",
  RAINBOW: "An arc of many colours in the sky, seen when sunlight meets raindrops.", GLACIER: "A huge slow-moving river of ice that carves valleys out of rock.",
  ALGORITHM: "A clear step-by-step set of instructions for solving a problem.", DATABASE: "An organised store of records that a computer can search and sort quickly.",
  SOFTWARE: "The programs and instructions that run on a computer, not its body.", HARDWARE: "The physical parts of a computer, like the case, screen and keyboard.", INTERNET: "The huge global network that connects billions of computers together.",
  SANDWICH: "Two slices of bread with meat, cheese or salad filling in between.", CHOCOLATE: "A sweet brown treat made from cocoa, usually with sugar and milk.",
  PANCAKE: "A flat soft cake of flour and eggs, fried in a pan and topped with syrup.", AVOCADO: "A green pear-shaped fruit with a large stone and creamy flesh.", COCONUT: "A tropical fruit with a hard hairy shell and a milky white centre.",
  BADMINTON: "A fast racket sport played with a feathered shuttlecock over a high net.", BASEBALL: "A bat-and-ball field sport where two teams take turns batting and fielding.",
  CYCLING: "Riding a bicycle for sport, exercise, or racing on a circuit.", BOWLING: "A sport of rolling a heavy ball to knock down pins at the end of a lane.", ARCHERY: "The sport of shooting arrows with a bow at a target, aiming for the centre.",
  PHILIPPINES: "An archipelago country of about 7,000 islands in Southeast Asia.", AUSTRALIA: "The only country that is also a whole continent, home to kangaroos.",
  AMERICA: "A continent, home to the United States.", ENGLAND: "A country in the United Kingdom.", MEXICO: "A country south of the United States.",
  HARBOR: "A sheltered stretch of water where ships can safely dock and load.", COAST: "The edge of land where it meets the sea or a large lake.",
  RAIN: "Water droplets that fall from clouds onto the ground below.", WIND: "Moving air that we can feel as a gentle breeze or a strong gust.",
  SHOWER: "A short burst of heavy rain that stops quickly and wets the ground.",
  FACTS: "Pieces of true information that have been found out and can be checked.",
  SOCCER: "A team sport played with a ball and the feet, eleven players a side.",
  TENNIS: "A racket sport played over a net with a bouncing ball.",
  BOXING: "A combat sport of two padded fighters in a ring.",
  RACING: "A sport of speed, usually in cars, bikes or horses.",
  GOLF: "A club sport played on a course, trying to putt the ball into holes.",
  RUGBY: "A team sport carried by hand across a field to the end zone.",
  HOCKEY: "A stick-and-ball sport on ice, or a field game played with a curved stick.",
  SWIM: "To move through water using the limbs and body.",
  DANCE: "Movement in rhythm to music, often as an art or performance.",
  CHESS: "A board game for two, moving pieces to capture the king.",
  BASKET: "A hoop sport where a ball is scored through a basket.",
  VOLLEY: "Hitting a ball in the air without letting it touch the ground.",
  TRACK: "The sport of running races on a marked oval course.",
  KARATE: "A martial art using strikes, blocks and kata.",
  ASIA: "The largest continent, home to China, India and Japan.",
  EUROPE: "A continent west of Asia, home to France, Germany and Spain.",
  AFRICA: "The second largest continent, known for the Sahara desert.",
  CHINA: "A large country in East Asia, the most populous in the world.",
  JAPAN: "An island country in East Asia known for Mount Fuji.",
  INDIA: "A large country in South Asia, home to the Taj Mahal.",
  CANADA: "The second largest country, in North America.",
  BRAZIL: "The largest country in South America, home to the Amazon.",
  EGYPT: "A country in Africa, famous for the pyramids and the Nile.",
  SPAIN: "A country in southwestern Europe, home to Barcelona.",
  ITALY: "A boot-shaped country in southern Europe, home to Rome."
};

const difficultyConfig = {
  Easy: {
    size: 10,
    words: 7,
    time: 240,
    coins: 50,
    icon: "🌱",
    subtitle: "Relaxed Quest",
    description: "Smaller grid, fewer words, more time."
  },

  Medium: {
    size: 12,
    words: 9,
    time: 210,
    coins: 80,
    icon: "⚔️",
    subtitle: "Skilled Explorer",
    description: "Balanced challenge with tougher word placement."
  },

  Hard: {
    size: 14,
    words: 11,
    time: 180,
    coins: 120,
    icon: "🔥",
    subtitle: "Master Challenge",
    description: "Large grid, more words, less time."
  }
};

// How much of a puzzle is drawn from the longer word list (the second array of
// every category). Easy stays on short words, Medium and Hard mix longer ones in.
const longWordRatio = {
  Easy: 0,
  Medium: .25,
  Hard: .4
};

// =========================================================
// CAMPAIGN
// =========================================================
// Six chapters of eight levels. Every level has a fixed word seed, so the same
// level is the same puzzle for everyone on every device. Difficulty ramps inside
// a chapter and the last level of each chapter is a boss puzzle.
const chapterPlan = [
  {
    category: "Animals", name: "Beastlands", icon: "🐾",
    levels: ["Petting Zoo", "Forest Trail", "Jungle Call", "River Bank", "Ocean Drift", "Mountain Roar", "Night Hunt", "The Alpha"]
  },
  {
    category: "Nature", name: "Wildlands", icon: "🌿",
    levels: ["First Bloom", "Quiet Meadow", "River Songs", "Storm Front", "Frozen Peak", "Desert Winds", "Volcano Rise", "Eye of the Storm"]
  },
  {
    category: "Technology", name: "Codelands", icon: "💻",
    levels: ["Boot Sequence", "First Script", "Local Network", "Data Streams", "Server Room", "Firewall", "Deep Logic", "The Mainframe"]
  },
  {
    category: "Food", name: "Feastlands", icon: "🍕",
    levels: ["Morning Table", "Market Day", "Garden Harvest", "Sweet Aisle", "Hot Kitchen", "Street Eats", "Grand Buffet", "The Banquet"]
  },
  {
    category: "Sports", name: "Arenal", icon: "🏆",
    levels: ["Warm Up", "Track Day", "Team Spirit", "Final Set", "Ring Side", "Extra Time", "Champion's Round", "The Final"]
  },
  {
    category: "Geography", name: "Atlas", icon: "🌍",
    levels: ["First Maps", "Island Hop", "River Cross", "Distant Shores", "Capital Trail", "Great Divide", "World Tour", "The Unknown"]
  }
];

const levelDifficulty = ["Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Hard", "Hard"];
// Extra coins for every new star earned on a level.
const starCoinBonus = 25;

const campaign = chapterPlan.flatMap((chapter, chapterIndex) =>
  chapter.levels.map((name, levelIndex) => ({
    id: `${chapterIndex + 1}-${levelIndex + 1}`,
    index: chapterIndex * chapter.levels.length + levelIndex,
    chapter: chapter.name,
    chapterIndex,
    category: chapter.category,
    icon: chapter.icon,
    name,
    difficulty: levelDifficulty[levelIndex],
    boss: levelIndex === chapter.levels.length - 1
  }))
);
const maxStars = campaign.length * 3;

function getLevel(id) { return campaign.find(l => l.id === id) || null }
function levelStars(id) { return save.campaign[id] || 0 }
function totalStars() { return campaign.reduce((sum, l) => sum + levelStars(l.id), 0) }
function levelUnlocked(level) {
  if (level.index === 0) return true;
  return levelStars(campaign[level.index - 1].id) > 0;
}
// Total seconds a level runs for, including Adventure mode's extra minute and
// the boss time penalty.
function levelRunTime(level) {
  const cfg = difficultyConfig[level.difficulty];
  return level.boss ? Math.max(120, cfg.time + 60 - 45) : cfg.time + 60;
}
// 2 stars beats this time; the 3rd star needs one mistake or fewer.
function levelStarTime(level) { return Math.round(levelRunTime(level) * .75) }
function evaluateStars(win, secondsUsed, mistakes, level) {
  if (!win) return 0;
  let stars = 1;
  if (secondsUsed <= levelStarTime(level)) stars++;
  if (mistakes <= 1) stars++;
  return stars;
}
function starRow(stars) {
  return [0, 1, 2].map(i => `<i class="star${i < stars ? " on" : ""}">★</i>`).join("");
}
function nextLevelAfter(level) {
  const next = campaign[level.index + 1];
  return next && levelUnlocked(next) ? next : null;
}
// The first level the player has unlocked but not yet cleared.
function currentLevel() {
  return campaign.find(l => levelUnlocked(l) && levelStars(l.id) === 0) || campaign[campaign.length - 1];
}

// =========================================================
// WORD CODEX — every word the player has discovered
// =========================================================

function allWords() {
  const map = new Map();
  Object.entries(categories).forEach(([cat, lists]) => {
    lists.forEach(list => list.forEach(w => {
      const word = w.toUpperCase();
      if (!map.has(word)) map.set(word, cat);
    }));
  });
  return map;
}
// Every playable word must have a real definition. The codex is the "learn" half
// of the game, so falling back to a placeholder would quietly break a core feature.
const PLACEHOLDER_DEFINITION = "Keep playing this category to learn more about this word.";
function wordDefinition(word) {
  return hints[word] || PLACEHOLDER_DEFINITION;
}
/** Words a player can find but the codex cannot explain. Should always be empty. */
function wordsMissingDefinitions() {
  return [...allWords().keys()].filter(w => !hints[w] || hints[w] === PLACEHOLDER_DEFINITION);
}
function recordWord(word, category) {
  const entry = save.codex[word] || { cat: category, n: 0 };
  entry.n++;
  save.codex[word] = entry;
  return entry;
}
function learnedCount() { return Object.keys(save.codex).length }

const defaultSave = {
  coins: 120,
  streak: 0,
  lastDaily: null,
  xp: 0,
  level: 1,
  wordsFound: 0,
  puzzlesWon: 0,
  bossesWon: 0,
  dailyWins: 0,
  bestScore: 0,
  unlockedDifficulty: ["Easy", "Medium", "Hard"],
  powers: { time: 2, hint: 2, finder: 2, multiplier: 1, shield: 1 },
  achievements: [],
  lastQuestReset: null,
  campaign: {},
  campaignBest: {},
  codex: {},
  upgrades: { extraTime: 0, coinBoost: 0, freeHint: 0, softMistakes: 0 },
  quests: {
    dailyWords: { label: "Find 20 words", target: 20, progress: 0, reward: 75 },
    cleanWin: { label: "Win a puzzle with ≤ 1 mistake", target: 1, progress: 0, reward: 100 },
    scoreHunter: { label: "Score 2,500 points", target: 2500, progress: 0, reward: 120 }
  },
  sound: true,
  // Accessibility settings. Each one is applied by applyAccessibility() and
  // mirrored onto <html> as a data attribute, so the CSS can key off it.
  a11y: {
    reduceMotion: false,   // honour prefers-reduced-motion, plus a manual switch
    highContrast: false,   // stronger borders and text on the dark background
    largeText: false,      // +18% root font size
    keyboardHelp: true,    // show the on-screen keyboard hints during a puzzle
    colorBlindMode: false  // swap gold/green for blue/orange, no red/green cues
  }
};

// =========================================================
// ACCOUNTS (local profiles)
// =========================================================
// Every profile on this device keeps its own progress, coins, stars and codex.
//
// Accounts live INSIDE the one save blob on purpose. The desktop bridge
// (desktop-app/web-shim/host.js) only mirrors the "wordQuestSave" key to disk,
// so a separate accounts key would silently vanish inside WordQuest.exe.
// Keeping them nested means one save file serves the browser and the app.

const SAVE_KEY = "wordQuestSave";
const SAVE_VERSION = 2;
const AVATARS = ["🐯", "🦊", "🐼", "🐸", "🦉", "🐙", "🐝", "🦄", "🐢", "🦁", "🐨", "👾"];
const NAME_MIN = 2;
const NAME_MAX = 16;

function newAccountId() {
  return "acc_" + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
}
function randomSalt() {
  try {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return hashString(String(Math.random())).toString(16);
  }
}
// SHA-256 where the runtime allows it, with a salted fallback for locked-down
// contexts. This keeps a local PIN out of plain text. It is not pretend-server
// security and the UI does not claim to be.
async function hashPin(pin, salt) {
  const text = `${salt}|${pin}`;
  try {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch { }
  return "fnv" + hashString(text).toString(16);
}
function makeAccount(name, avatar, id, data) {
  return {
    id,
    name,
    avatar: avatar || AVATARS[0],
    createdAt: new Date().toISOString(),
    lastPlayed: new Date().toISOString(),
    pin: null,
    save: data || structuredClone(defaultSave)
  };
}
function isFlatSave(value) {
  return !!value && typeof value === "object"
    && !value.accounts
    && ("coins" in value || "powers" in value || "wordsFound" in value);
}
function accountStoreLoad() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(SAVE_KEY)) } catch { raw = null }

  // A save made before accounts existed is kept rather than thrown away: it
  // becomes the first profile, so no campaign, coin or codex entry is lost.
  if (isFlatSave(raw)) {
    const id = newAccountId();
    const account = makeAccount("Player 1", AVATARS[0], id, deepMerge(structuredClone(defaultSave), raw));
    const migrated = { version: SAVE_VERSION, active: id, accounts: { [id]: account } };
    // Write the upgraded shape straight away. If the app closed before the next
    // save, the migration would otherwise run again and mint a different id.
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(migrated)) } catch { }
    return migrated;
  }

  if (raw && raw.accounts && typeof raw.accounts === "object") {
    const accounts = {};
    Object.entries(raw.accounts).forEach(([id, account]) => {
      if (!account || typeof account !== "object") return;
      accounts[id] = Object.assign(
        makeAccount(account.name || "Player", account.avatar, id),
        account,
        { save: deepMerge(structuredClone(defaultSave), account.save || {}) }
      );
    });
    return {
      version: SAVE_VERSION,
      active: raw.active && accounts[raw.active] ? raw.active : null,
      accounts
    };
  }

  return { version: SAVE_VERSION, active: null, accounts: {} };
}

let store = accountStoreLoad();

function activeAccount() { return store.accounts[store.active] || null }
function accountList() {
  return Object.values(store.accounts).sort((a, b) => String(a.name).localeCompare(String(b.name)));
}
function activeSave() {
  const account = activeAccount();
  return account ? account.save : structuredClone(defaultSave);
}
function accountStoreWrite() {
  const account = activeAccount();
  if (account) account.save = save;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(store)) } catch { }
}
function accountStars(account) {
  const saved = account.save || {};
  return campaign.reduce((sum, level) => sum + ((saved.campaign || {})[level.id] || 0), 0);
}
function accountSummary(account) {
  const saved = account.save || {};
  return `Level ${saved.level || 1} • ${accountStars(account)} ⭐ • ${saved.coins || 0} 🪙`;
}
function nameTaken(name, exceptId) {
  const wanted = String(name).trim().toLowerCase();
  return accountList().some(a => a.id !== exceptId && String(a.name).trim().toLowerCase() === wanted);
}

let save = activeSave();
let state = {
  selectedCategory: "Animals",
  selectedDifficulty: "Easy",
  mode: "normal",
  boss: false,
  daily: false,
  grid: [],
  placedWords: [],
  foundWords: new Set(),
  selecting: false,
  startCell: null,
  selectedCells: [],
  cursor: [0, 0],   // keyboard play: which cell the 2D cursor is on
  cursorOnBoard: false,
  score: 0,
  combo: 1,
  correct: 0,
  mistakes: 0,
  seconds: 0,
  timer: null,
  shieldActive: false,
  multiplierActive: false,
  randomEvent: null,
  rushDeadline: null,
  eventTimers: [],
  levelId: null,
  elapsed: 0,
  freeHints: 0,
  selectedChapter: null
};

function deepMerge(base, extra) {
  for (const k in extra) {
    if (extra[k] && typeof extra[k] === "object" && !Array.isArray(extra[k]) && typeof base[k] === "object") {
      base[k] = deepMerge(base[k], extra[k]);
    } else base[k] = extra[k];
  }
  return base;
}
// Writes every profile back, not just the signed-in one, so the one save file
// stays the source of truth for the browser and the desktop bridge alike.
function persist() {
  accountStoreWrite();
  updateGlobalUI();
}
function showScreen(id) {
  // Profiles gate the game: without a signed-in profile there is nowhere to save.
  if (id !== "accountScreen" && !activeAccount()) id = "accountScreen";
  $$(".screen").forEach(s => s.classList.remove("active"));
  $("#" + id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (id === "homeScreen") renderHome();
  if (id === "profileScreen") renderProfile();
  if (id === "campaignScreen") renderCampaign();
  if (id === "accountScreen") renderAccountScreen();
}
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
function modal(title, text) {
  $("#modalTitle").textContent = title;
  $("#modalText").textContent = text;
  $("#modal").classList.remove("hidden");
}
$("#modalClose").onclick = () => $("#modal").classList.add("hidden");

function playSound(type = "ok") {
  if (!save.sound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const map = { ok: 660, bad: 180, win: 880, power: 520 };
    osc.frequency.value = map[type] || 440;
    gain.gain.setValueAtTime(.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .16);
    osc.start(); osc.stop(ctx.currentTime + .16);
  } catch { }
}

function updateGlobalUI() {
  const account = activeAccount();
  $("#hudCoins").textContent = save.coins;
  $("#hudStreak").textContent = save.streak;
  $("#hudStars").textContent = totalStars();
  $("#accountAvatar").textContent = account ? account.avatar : "👤";
  $("#accountName").textContent = account ? account.name : "Sign in";
  $("#soundBtn").textContent = save.sound ? "🔊" : "🔇";
  $("#homeRank").textContent = getRank();
}
const rankSystem = [
  {
    name: "Rookie Solver",
    level: 1,
    icon: "🌱"
  },

  {
    name: "Word Hunter",
    level: 3,
    icon: "🏹"
  },

  {
    name: "Quest Scholar",
    level: 6,
    icon: "📚"
  },

  {
    name: "Elite Seeker",
    level: 10,
    icon: "⚔️"
  },

  {
    name: "Legendary Word Master",
    level: 15,
    icon: "👑"
  }
];

function getRankInfo() {

  let currentIndex = 0;


  // Find current rank
  for (
    let i = 0;
    i < rankSystem.length;
    i++
  ) {

    if (
      save.level >=
      rankSystem[i].level
    ) {

      currentIndex = i;

    }

  }


  const current =
    rankSystem[currentIndex];


  const next =
    rankSystem[
      currentIndex + 1
    ] || null;


  return {
    current,
    next
  };

}

function updateRankProgress() {

  const info =
    getRankInfo();


  const current =
    info.current;


  const next =
    info.next;


  const card =
    document.querySelector(
      ".rank-progress-card"
    );


  if (!card) return;


  // Current rank
  $("#currentRankDisplay")
    .textContent =
    current.name;


  $("#currentRankLevel")
    .textContent =
    `Level ${save.level}`;


  // =====================================================
  // PLAYER ALREADY HAS MAXIMUM RANK
  // =====================================================

  if (!next) {

    $("#nextRankIcon")
      .textContent =
      "👑";


    $("#nextRankName")
      .textContent =
      "Maximum Rank Reached";


    $("#nextRankRequirement")
      .textContent =
      "You are a Legendary Word Master!";


    $("#nextRankLevel")
      .textContent =
      "MAX";


    $("#rankLevelsLeft")
      .textContent =
      "🏆 Highest rank achieved";


    $("#rankProgressFill")
      .style.width =
      "100%";


    card.classList.add(
      "max-rank"
    );


    return;

  }


  card.classList.remove(
    "max-rank"
  );


  // =====================================================
  // UPCOMING RANK
  // =====================================================

  $("#nextRankIcon")
    .textContent =
    next.icon;


  $("#nextRankName")
    .textContent =
    next.name;


  $("#nextRankRequirement")
    .textContent =
    `Unlocks at Level ${next.level}`;


  $("#nextRankLevel")
    .textContent =
    `Level ${next.level}`;


  // Levels remaining

  const levelsLeft =
    next.level - save.level;


  $("#rankLevelsLeft")
    .textContent =
    levelsLeft === 1
      ? "⚡ 1 level until your next rank!"
      : `⚡ ${levelsLeft} levels until your next rank`;


  // =====================================================
  // PROGRESS BETWEEN CURRENT AND NEXT RANK
  // =====================================================

  const rankRange =
    next.level -
    current.level;


  const progress =
    save.level -
    current.level;


  const percentage =
    Math.min(
      100,
      Math.max(
        0,
        (progress / rankRange)
        * 100
      )
    );


  $("#rankProgressFill")
    .style.width =
    `${percentage}%`;

}

function getRank() {
  if (save.level >= 15) return "Legendary Word Master";
  if (save.level >= 10) return "Elite Seeker";
  if (save.level >= 6) return "Quest Scholar";
  if (save.level >= 3) return "Word Hunter";
  return "Rookie Solver";
}

function renderHome() {
  updateGlobalUI();
  $("#statWords").textContent = save.wordsFound;
  $("#statPuzzles").textContent = save.puzzlesWon;
  $("#statBest").textContent = save.bestScore;
  $("#statLevel").textContent = save.level;
  $("#statStars").textContent = totalStars();
  $("#statLearned").textContent = learnedCount();
  const level = currentLevel();
  $("#continueQuestHint").textContent = totalStars() === 0
    ? `Your quest begins in ${level.chapter}: ${level.name}.`
    : `${level.chapter} • ${level.name} • ${totalStars()}/${maxStars} ⭐ collected`;
  renderQuestPreview();
}

// =========================================================
// QUEST MAP
// =========================================================

function renderCampaign() {
  const chapterHost = $("#campaignChapters");
  const levelHost = $("#campaignLevels");
  if (!chapterHost || !levelHost) return;
  const active = state.selectedChapter === null ? currentLevel().chapterIndex : state.selectedChapter;
  state.selectedChapter = active;

  chapterHost.innerHTML = "";
  chapterPlan.forEach((chapter, chapterIndex) => {
    const levels = campaign.filter(l => l.chapterIndex === chapterIndex);
    const earned = levels.reduce((sum, l) => sum + levelStars(l.id), 0);
    const open = levels.some(l => levelUnlocked(l));
    const tab = document.createElement("button");
    tab.className = "chapter-tab" + (chapterIndex === active ? " selected" : "") + (open ? "" : " locked");
    tab.innerHTML = `<b>${chapter.icon} ${chapter.name}</b><small>${open ? `${earned}/${levels.length * 3} ⭐` : "🔒 Locked"}</small>`;
    tab.onclick = () => { state.selectedChapter = chapterIndex; renderCampaign() };
    chapterHost.appendChild(tab);
  });

  levelHost.innerHTML = "";
  campaign.filter(l => l.chapterIndex === active).forEach(level => {
    const stars = levelStars(level.id);
    const open = levelUnlocked(level);
    const node = document.createElement("button");
    node.className = "level-node" + (open ? "" : " locked") + (stars ? " cleared" : "") + (level.boss ? " boss" : "");
    node.disabled = !open;
    node.innerHTML = `
      <span class="level-badge">${level.boss ? "👑" : level.index + 1}</span>
      <span class="level-copy">
        <b>${level.name}</b>
        <small>${level.difficulty}${level.boss ? " • Boss" : ""} • ${open ? `⏱ ${formatTime(levelStarTime(level))} for ⭐⭐` : "Locked"}${save.campaignBest[level.id] ? ` • Best ${save.campaignBest[level.id]}` : ""}</small>
      </span>
      <span class="level-stars">${starRow(stars)}</span>`;
    node.onclick = () => startLevel(level.id);
    levelHost.appendChild(node);
  });

  $("#campaignStars").textContent = `${totalStars()} / ${maxStars}`;
  $("#campaignProgress").style.width = `${(totalStars() / maxStars) * 100}%`;
  const next = currentLevel();
  $("#campaignNext").textContent = totalStars() >= maxStars
    ? "Every level cleared — you are a Legendary Word Master!"
    : `Next up: ${next.chapter} • ${next.name} (${next.difficulty})`;
}

function startLevel(id) {
  const level = getLevel(id);
  if (!level) return;
  if (!levelUnlocked(level)) { toast("🔒 Clear the earlier levels first."); return; }
  playSound("ok");
  startGame({ level: id });
}

function renderChapterSummary() {
  const host = $("#chapterSummary");
  if (!host) return;
  host.innerHTML = "";
  chapterPlan.forEach((chapter, chapterIndex) => {
    const levels = campaign.filter(l => l.chapterIndex === chapterIndex);
    const earned = levels.reduce((sum, l) => sum + levelStars(l.id), 0);
    const possible = levels.length * 3;
    host.insertAdjacentHTML("beforeend", `
      <div class="quest-card">
        <div class="q-top"><span>${chapter.icon} ${chapter.name}</span><b>${earned}/${possible} ⭐</b></div>
        <div class="progress"><span style="width:${(earned / possible) * 100}%"></span></div>
      </div>`);
  });
}

// =========================================================
// WORD CODEX
// =========================================================

function renderCodex() {
  const host = $("#codexList");
  if (!host) return;
  const total = allWords().size;
  const query = ($("#codexSearch").value || "").trim().toLowerCase();
  const learned = Object.keys(save.codex)
    .map(word => ({ word, cat: save.codex[word].cat, n: save.codex[word].n }))
    .sort((a, b) => a.word.localeCompare(b.word));
  const matches = query
    ? learned.filter(e => e.word.toLowerCase().includes(query)
      || e.cat.toLowerCase().includes(query)
      || wordDefinition(e.word).toLowerCase().includes(query))
    : learned;

  $("#codexCount").textContent = `${learned.length} / ${total}`;
  $("#codexProgress").style.width = `${(learned.length / total) * 100}%`;

  host.innerHTML = matches.length
    ? matches.map(e => `
      <div class="codex-entry">
        <div class="codex-head">
          <b>${e.word}</b>
          <span class="tag">${e.cat}</span>
        </div>
        <small>${wordDefinition(e.word)}</small>
        <em>found ×${e.n}</em>
      </div>`).join("")
    : `<p class="codex-empty">${learned.length
      ? "No learned word matches that search."
      : "Find words in any puzzle to start building your vocabulary list."}</p>`;
}

// =========================================================
// ACCOUNT SCREEN
// =========================================================

let newAvatar = AVATARS[0];
let promptResolve = null;

function formatDay(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !isNaN(date) ? date.toLocaleDateString() : "never";
}

// One small reusable prompt, used for PINs, renames and pins alike.
function askValue(title, hint, value, type, maxlength) {
  return new Promise(resolve => {
    promptResolve = resolve;
    $("#promptTitle").textContent = title;
    $("#promptHint").textContent = hint || "";
    const input = $("#promptInput");
    input.type = type || "text";
    input.value = value || "";
    input.maxLength = maxlength || 40;
    $("#promptModal").classList.remove("hidden");
    setTimeout(() => { try { input.focus(); input.select() } catch { } }, 0);
  });
}
function closePrompt(result) {
  $("#promptModal").classList.add("hidden");
  const resolve = promptResolve;
  promptResolve = null;
  if (resolve) resolve(result);
}
function askText(title, hint, value, maxlength) { return askValue(title, hint, value, "text", maxlength) }
function askPin(title, hint) { return askValue(title, hint, "", "password", 4) }

function renderAvatarPicker() {
  const host = $("#avatarPicker");
  if (!host) return;
  host.innerHTML = "";
  AVATARS.forEach(avatar => {
    const choice = document.createElement("button");
    choice.type = "button";
    choice.className = "avatar-choice" + (avatar === newAvatar ? " selected" : "");
    choice.textContent = avatar;
    choice.title = "Use this avatar";
    choice.onclick = () => { newAvatar = avatar; renderAvatarPicker() };
    host.appendChild(choice);
  });
}

function renderAccountScreen() {
  const host = $("#accountGrid");
  if (!host) return;
  const accounts = accountList();
  $("#accountCount").textContent = accounts.length;
  $("#accountMessage").textContent = "";
  $("#accountMessage").classList.remove("success-message", "error-message");
  host.innerHTML = "";

  if (!accounts.length) {
    host.innerHTML = `<p class="codex-empty">No profiles yet. Create the first one below — there is no e-mail, password or sign-up page, everything stays on this device.</p>`;
  }

  accounts.forEach(account => {
    const signedIn = account.id === store.active;
    const card = document.createElement("div");
    card.className = "account-card" + (signedIn ? " current" : "");
    card.innerHTML = `
      <button class="account-main" data-open="${account.id}">
        <span class="account-avatar">${account.avatar}</span>
        <span class="account-copy">
          <b>${account.name}${account.pin ? ' <span class="account-lock" title="PIN protected">🔒</span>' : ""}</b>
          <small>${accountSummary(account)}</small>
          <small>Last played ${formatDay(account.lastPlayed)}</small>
        </span>
        ${signedIn ? '<span class="tag">SIGNED IN</span>' : '<span class="tag account-play">PLAY →</span>'}
      </button>
      <div class="account-actions">
        <button class="text-btn" data-rename="${account.id}">Rename</button>
        <button class="text-btn" data-face="${account.id}">Avatar</button>
        <button class="text-btn" data-pin="${account.id}">${account.pin ? "Change PIN" : "Add PIN"}</button>
        <button class="text-btn" data-export="${account.id}">Export</button>
        <button class="text-btn danger-text" data-delete="${account.id}">Delete</button>
      </div>`;
    host.appendChild(card);
  });

  $$("#accountGrid [data-open]").forEach(button => button.onclick = () => signInToAccount(button.dataset.open));
  $$("#accountGrid [data-rename]").forEach(button => button.onclick = () => renameAccount(button.dataset.rename));
  $$("#accountGrid [data-face]").forEach(button => button.onclick = () => cycleAvatar(button.dataset.face));
  $$("#accountGrid [data-pin]").forEach(button => button.onclick = () => managePin(button.dataset.pin));
  $$("#accountGrid [data-export]").forEach(button => button.onclick = () => exportAccount(button.dataset.export));
  $$("#accountGrid [data-delete]").forEach(button => button.onclick = () => deleteAccount(button.dataset.delete));

  $("#newAccountName").maxLength = NAME_MAX;
  renderAvatarPicker();
}

function adoptAccount(id) {
  const account = store.accounts[id];
  if (!account) return false;
  // Switching profile mid-puzzle abandons the run: rewards must not land on the
  // wrong profile, and powers that were paid for must not be silently burned.
  // The refund happens before store.active changes, so it goes to the buyer.
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
    state.eventTimers.forEach(clearTimeout);
    state.eventTimers = [];
    refundActivePowers();
    state.levelId = null;
  }
  store.active = id;
  account.lastPlayed = new Date().toISOString();
  // save must point at THIS profile's data, so every later write lands in it.
  save = account.save;
  resetDailyQuestsIfNeeded();
  accountStoreWrite();
  updateGlobalUI();
  showScreen("homeScreen");
  return true;
}

async function signInToAccount(id) {
  const account = store.accounts[id];
  if (!account) return;
  if (account.pin) {
    const pin = await askPin(`PIN for ${account.name}`, "Enter the 4-digit PIN for this profile.");
    if (pin === null || pin === "") return;
    const attempt = await hashPin(pin, account.pin.salt);
    if (attempt !== account.pin.hash) {
      const message = $("#accountMessage");
      message.textContent = `❌ Wrong PIN for ${account.name}.`;
      message.classList.remove("success-message");
      message.classList.add("error-message");
      toast("❌ Wrong PIN.");
      playSound("bad");
      return;
    }
  }
  adoptAccount(id);
  toast(`👋 Welcome back, ${account.name}!`);
}

async function createAccount() {
  const nameInput = $("#newAccountName");
  const pinInput = $("#newAccountPin");
  const message = $("#accountMessage");
  const name = String(nameInput.value || "").trim();
  const pin = String(pinInput.value || "").trim();

  const fail = (text) => {
    message.textContent = text;
    message.classList.remove("success-message");
    message.classList.add("error-message");
    toast("Could not create the profile.");
    playSound("bad");
  };

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return fail(`❌ The name must be ${NAME_MIN}-${NAME_MAX} characters.`);
  }
  if (nameTaken(name)) return fail(`❌ “${name}” already exists on this device.`);
  if (pin && !/^\d{4}$/.test(pin)) return fail("❌ A PIN must be exactly 4 digits, or left empty.");

  const id = newAccountId();
  const account = makeAccount(name, newAvatar, id, null);
  if (pin) {
    const salt = randomSalt();
    account.pin = { salt, hash: await hashPin(pin, salt) };
  }
  store.accounts[id] = account;
  nameInput.value = "";
  pinInput.value = "";
  adoptAccount(id);
  message.textContent = `✅ Welcome, ${name}! Your progress is saved to this profile from now on.`;
  message.classList.remove("error-message");
  message.classList.add("success-message");
  toast(`👋 Profile “${name}” created`);
  playSound("power");
}

async function renameAccount(id) {
  const account = store.accounts[id];
  if (!account) return;
  const typed = await askText("Rename profile", `${NAME_MIN}-${NAME_MAX} characters.`, account.name, NAME_MAX);
  if (typed === null) return;
  const name = typed.trim();
  if (name.length < NAME_MIN || name.length > NAME_MAX) return toast(`❌ The name must be ${NAME_MIN}-${NAME_MAX} characters.`);
  if (nameTaken(name, id)) return toast("❌ That name is already used on this device.");
  account.name = name;
  accountStoreWrite();
  updateGlobalUI();
  renderAccountScreen();
  toast(`✏️ Renamed to “${name}”`);
}

function cycleAvatar(id) {
  const account = store.accounts[id];
  if (!account) return;
  const at = AVATARS.indexOf(account.avatar);
  account.avatar = AVATARS[(at + 1) % AVATARS.length];
  accountStoreWrite();
  updateGlobalUI();
  renderAccountScreen();
  toast(`${account.avatar} ${account.name}'s new look`);
}

async function managePin(id) {
  const account = store.accounts[id];
  if (!account) return;
  const title = account.pin ? "Change PIN" : "Add PIN";
  const hint = account.pin
    ? "Enter a new 4-digit PIN, or leave it empty to remove the PIN."
    : "Enter a 4-digit PIN to lock this profile, or leave it empty for no PIN.";
  const typed = await askPin(title, hint);
  if (typed === null) return;
  const pin = typed.trim();

  if (!pin) {
    account.pin = null;
    accountStoreWrite();
    renderAccountScreen();
    return toast(`🔓 PIN removed from ${account.name}.`);
  }
  if (!/^\d{4}$/.test(pin)) return toast("❌ A PIN must be exactly 4 digits.");

  const salt = randomSalt();
  account.pin = { salt, hash: await hashPin(pin, salt) };
  accountStoreWrite();
  renderAccountScreen();
  toast(`🔒 PIN set for ${account.name}.`);
}

function deleteAccount(id) {
  const account = store.accounts[id];
  if (!account) return;
  if (!confirm(`Delete the profile “${account.name}”?\n\nIts level, coins, stars and word codex will be erased. This cannot be undone.`)) return;

  delete store.accounts[id];
  if (store.active === id) {
    // Nothing is signed in afterwards, so the shared save must not be reused.
    store.active = null;
    save = structuredClone(defaultSave);
  }
  accountStoreWrite();
  updateGlobalUI();
  renderAccountScreen();
  toast(`🗑️ Deleted “${account.name}”`);
}

function signOut() {
  const account = activeAccount();
  if (!account) return;
  const name = account.name;
  store.active = null;
  save = structuredClone(defaultSave);
  accountStoreWrite();
  updateGlobalUI();
  showScreen("accountScreen");
  toast(`👋 Signed out of ${name}`);
}

// A profile is one small JSON file, so it can be backed up or moved by hand.
function exportAccount(id) {
  const account = store.accounts[id];
  if (!account) return;
  try {
    const blob = new Blob([JSON.stringify(account, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `word-quest-${String(account.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast(`💾 Exported “${account.name}”`);
  } catch {
    toast("❌ Could not export this profile.");
  }
}

function importAccount(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || typeof data !== "object" || !data.name || typeof data.save !== "object") throw new Error("shape");

      let name = String(data.name).trim().slice(0, NAME_MAX);
      if (nameTaken(name)) name = `${String(data.name).trim().slice(0, NAME_MAX - 11)} (imported)`;

      const id = newAccountId();
      const account = makeAccount(name, data.avatar, id, deepMerge(structuredClone(defaultSave), data.save));
      account.createdAt = data.createdAt || account.createdAt;
      account.pin = null;   // a moved profile asks for a fresh PIN
      store.accounts[id] = account;
      accountStoreWrite();
      renderAccountScreen();
      toast(`📥 Imported “${name}”`);
    } catch {
      toast("❌ That file is not a Word Quest profile.");
    }
  };
  reader.readAsText(file);
}
function renderQuestPreview(target = "#questPreview") {
  const host = $(target); host.innerHTML = "";
  Object.values(save.quests).forEach(q => {
    const pct = Math.min(100, (q.progress / q.target) * 100);
    host.insertAdjacentHTML("beforeend", `
      <div class="quest-card">
        <div class="q-top"><span>${q.label}</span><b>${Math.min(q.progress, q.target)}/${q.target}</b></div>
        <div class="progress"><span style="width:${pct}%"></span></div>
      </div>`);
  });
}

function buildSetup() {
  const catHost = $("#categoryChoices");
  catHost.innerHTML = "";
  Object.keys(categories).forEach((cat, i) => {
    const icons = ["🐾", "🌿", "💻", "🍕", "🏆", "🌍"];
    const b = document.createElement("button");
    b.className = "choice" + (cat === state.selectedCategory ? " selected" : "");
    const wordCount = categories[cat][0].length + categories[cat][1].length;
    b.innerHTML = `<b>${icons[i]} ${cat}</b><span>${wordCount}+ themed words</span>`;
    b.onclick = () => { state.selectedCategory = cat; buildSetup() };
    catHost.appendChild(b);
  });
  const dHost = $("#difficultyChoices"); dHost.innerHTML = "";
  Object.entries(difficultyConfig).forEach(([name, c]) => {
    const b = document.createElement("button");
    b.className = "difficulty" + (name === state.selectedDifficulty ? " selected" : "");
    b.innerHTML = `
  <div class="difficulty-info">

    <div class="difficulty-title">
      <span class="difficulty-icon">${c.icon}</span>

      <div>
        <b>${name}</b>
        <small class="difficulty-subtitle">
          ${c.subtitle}
        </small>
      </div>
    </div>

    <small class="difficulty-description">
      ${c.description}
    </small>

    <div class="difficulty-details">
      <span>🧩 ${c.size}×${c.size}</span>
      <span>🔤 ${c.words} words</span>
      <span>⏱ ${Math.floor(c.time / 60)}:${String(c.time % 60).padStart(2, "0")}</span>
    </div>

  </div>

  <span class="coin-reward">
    <img
      src="images/kuwens.png"
      class="coin-icon-small"
      alt="Coin"
    >
    ${c.coins}
  </span>
`;
    b.onclick = () => { state.selectedDifficulty = name; buildSetup() };
    dHost.appendChild(b);
  });
}

function startGame(opts = {}) {
  clearInterval(state.timer);
  const level = opts.level ? getLevel(opts.level) : null;
  state.levelId = level ? level.id : null;
  state.boss = level ? level.boss : !!opts.boss;
  state.daily = !!opts.daily;
  state.mode = level ? "normal" : (opts.mode || state.mode || "normal");
  if (level) {
    state.selectedCategory = level.category;
    state.selectedDifficulty = level.difficulty;
  } else {
    if (opts.category) state.selectedCategory = opts.category;
    if (opts.difficulty) state.selectedDifficulty = opts.difficulty;
  }

  const cfg = difficultyConfig[state.selectedDifficulty];
  state.score = 0; state.combo = 1; state.correct = 0; state.mistakes = 0;
  state.elapsed = 0;
  state.freeHints = freeHintsPerPuzzle();
  state.foundWords = new Set(); state.shieldActive = false; state.multiplierActive = false;
  state.randomEvent = null; state.rushDeadline = null;
  state.eventTimers.forEach(clearTimeout); state.eventTimers = [];
  resetDailyQuestsIfNeeded();

  let time = cfg.time;
  if (state.mode === "normal") time += 60;
  if (state.boss) time = Math.max(120, time - 45);
  if (state.daily) time = 180;
  if (level) time = levelRunTime(level);
  // Permanent upgrade: Extra Time applies to every puzzle.
  time += bonusTimeSeconds();
  state.seconds = time;

  const wordCount = state.boss ? Math.min(cfg.words + 2, 12) : cfg.words;
  const words = chooseWords(state.selectedCategory, wordCount, state.selectedDifficulty, state.daily, level ? `level|${level.id}` : null);
  // Campaign levels and the Daily Challenge get a fixed grid seed too, so their
  // puzzles are identical for everyone. Free play stays random.
  const gridSeed = level
    ? `level|${level.id}`
    : state.daily
      ? `daily|${state.selectedCategory}|${state.selectedDifficulty}|${todayStamp()}`
      : null;
  const generated = generateGrid(cfg.size, words, gridSeed);
  state.grid = generated.grid;
  state.placedWords = generated.placements;

  $("#gameModeLabel").textContent = level
    ? `LEVEL ${level.index + 1} • ${level.chapter.toUpperCase()}`
    : state.boss ? "BOSS PUZZLE" : state.daily ? "DAILY CHALLENGE" : state.mode === "timed" ? "TIME RUSH" : "ADVENTURE MODE";
  $("#gameTitle").textContent = level
    ? `${level.icon} ${level.name} • ${level.difficulty}`
    : `${state.selectedCategory} • ${state.selectedDifficulty}`;
  $("#currentQuestText").textContent = level
    ? `${level.boss ? "👑 Boss level — " : ""}find every word. ⭐⭐ under ${formatTime(levelStarTime(level))} • ⭐⭐⭐ with ≤ 1 mistake`
    : state.boss ? "Defeat the boss by finding every word." : state.daily ? "Daily Quest: clear the puzzle before time runs out." : "Find every hidden word.";
  renderGame();
  showScreen("gameScreen");
  maybeStartRandomEvent();
  state.timer = setInterval(() => {
    state.seconds--;
    state.elapsed++;
    updateTimer();
    if (state.seconds <= 0) endGame(false);
  }, 1000);
}

const EVENT_DURATION_MS = 20000;
const RUSH_BONUS_POINTS = 75;
const GOLDEN_BONUS_COINS = 25;
const MIN_SELECTION_LENGTH = 3;
const MISTAKE_PENALTY = 25;
const FINDER_REVEAL_MS = 2000;

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// A seeded shuffle keeps the Daily Challenge identical for the whole day.
function shuffleWords(list, seedText) {
  const out = [...list];
  const rand = seedText ? mulberry32(hashString(seedText)) : Math.random;
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function chooseWords(category, count, difficulty = state.selectedDifficulty, daily = false, seedText = null) {
  const cfg = difficultyConfig[difficulty] || difficultyConfig.Easy;
  const [shortList, longList] = categories[category];
  // A word must fit in the grid, even diagonally.
  const fits = (w) => w.length <= cfg.size;
  // A fixed seed keeps a campaign level or the Daily Challenge identical.
  const seed = seedText || (daily ? `${category}|${difficulty}|${todayStamp()}` : null);

  const shortPool = shortList.map(w => w.toUpperCase()).filter(fits);
  const longPool = longList.map(w => w.toUpperCase()).filter(fits);

  const longCount = Math.min(
    longPool.length,
    count,
    Math.round(count * (longWordRatio[difficulty] || 0))
  );

  const picked = [
    ...shuffleWords(longPool, seed).slice(0, longCount),
    ...shuffleWords(shortPool, seed).slice(0, count - longCount)
  ];

  return shuffleWords(picked, seed ? seed + "|order" : null);
}

function generateGrid(size, words, seedText = null) {
  // Longer words are harder to fit, so try a few fresh grids and keep the
  // attempt that managed to place the most words. A seed makes the whole puzzle
  // reproducible: same grid, same letters, same word positions every time.
  let best = { grid: [], placements: [] };
  for (let attempt = 0; attempt < 6; attempt++) {
    const rand = seedText ? mulberry32(hashString(`${seedText}|grid|${attempt}`)) : Math.random;
    const candidate = attemptPlacements(size, words, rand);
    if (candidate.placements.length > best.placements.length) best = candidate;
    if (best.placements.length === words.length) break;
  }
  return best;
}

function attemptPlacements(size, words, rand = Math.random) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let grid = Array.from({ length: size }, () => Array(size).fill(""));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const placements = [];

  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    let placed = false;
    for (let tries = 0; tries < 400 && !placed; tries++) {
      const [dr, dc] = dirs[Math.floor(rand() * dirs.length)];
      const r = Math.floor(rand() * size), c = Math.floor(rand() * size);
      const er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1);
      if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const rr = r + dr * i, cc = c + dc * i;
        if (grid[rr][cc] && grid[rr][cc] !== word[i]) { ok = false; break; }
      }
      if (!ok) continue;
      const cells = [];
      for (let i = 0; i < word.length; i++) {
        const rr = r + dr * i, cc = c + dc * i;
        grid[rr][cc] = word[i]; cells.push([rr, cc]);
      }
      placements.push({ word, cells }); placed = true;
    }
  }
  grid = grid.map(row => row.map(ch => ch || letters[Math.floor(rand() * letters.length)]));
  return { grid, placements };
}

function renderGame() {
  const host = $("#wordGrid"), size = state.grid.length;
  host.style.setProperty("--size", size);
  host.innerHTML = "";
  state.grid.forEach((row, r) => row.forEach((ch, c) => {
    const d = document.createElement("div");
    d.className = "letter";
    d.dataset.r = r; d.dataset.c = c; d.textContent = ch;
    d.setAttribute("role", "gridcell");
    d.setAttribute("tabindex", "-1");
    d.setAttribute("aria-label", `${ch}, row ${r + 1} column ${c + 1}`);
    d.addEventListener("pointerdown", onPointerDown);
    d.addEventListener("pointerenter", onPointerEnter);
    d.addEventListener("pointerup", onPointerUp);
    host.appendChild(d);
  }));
  host.setAttribute("role", "grid");
  host.setAttribute("aria-rowcount", size);
  host.setAttribute("aria-colcount", size);
  // One listener on the container, not one per cell, so re-renders never stack.
  if (!host.dataset.keyboardReady) {
    host.addEventListener("keydown", onGridKeydown);
    host.dataset.keyboardReady = "1";
  }
  state.cursor = [0, 0];
  paintCursor();
  renderWordList();
  renderQuestPreview("#gameQuestProgress");
  updateRunUI();
  updatePowerUI();
  updateTimer();
}
function renderWordList() {
  const host = $("#wordList"); host.innerHTML = "";
  state.placedWords.forEach(p => {
    const d = document.createElement("div");
    d.className = "word-chip" + (state.foundWords.has(p.word) ? " found" : "");
    d.textContent = p.word;
    host.appendChild(d);
  });
  $("#wordCounter").textContent = `${state.foundWords.size}/${state.placedWords.length}`;
}
function cellKey(r, c) { return `${r},${c}` }
function onPointerDown(e) {
  e.preventDefault();
  state.selecting = true;
  state.startCell = [+this.dataset.r, +this.dataset.c];
  // Capture the pointer on the grid so the drag keeps reporting to us even when
  // the finger or cursor leaves the letter it started on. Without this a touch
  // drag never fires pointerenter on the other letters, so only one letter was
  // ever selected on phones and tablets.
  const grid = $("#wordGrid");
  if (grid && grid.setPointerCapture && e.pointerId !== undefined) {
    try { grid.setPointerCapture(e.pointerId) } catch { }
  }
  updateSelection(+this.dataset.r, +this.dataset.c);
}
function gridLetterAt(x, y) {
  const el = document.elementFromPoint(x, y);
  return el ? el.closest(".letter") : null;
}
function onPointerMove(e) {
  if (!state.selecting) return;
  // elementFromPoint is used instead of the event target because the pointer is
  // captured by the grid while dragging.
  const el = gridLetterAt(e.clientX, e.clientY);
  if (el) updateSelection(+el.dataset.r, +el.dataset.c);
}
function onPointerEnter(e) {
  if (!state.selecting || e.buttons === 0) return;
  updateSelection(+this.dataset.r, +this.dataset.c);
}
function onPointerUp() { if (state.selecting) finishSelection(); }
function cancelSelection() { if (state.selecting) { clearSelecting(); state.selecting = false; } }

// ---------------------------------------------------------------
// KEYBOARD PLAY
// ---------------------------------------------------------------
// A word search is a pointing task, which makes it unusable without a mouse.
// This gives the grid a real 2D cursor: arrows move it, Space or Enter anchors
// the first letter of a word, more arrows extend the selection, Enter or Space
// again submits it, and Escape gives up on the current attempt for free.
//
// The cursor position is kept in state so the arrow keys move it, while the
// focus is left on the anchor cell so a screen reader follows the selection.

/** Shows a message in the status line and in the aria-live region together. */
function announce(text) {
  const live = $("#liveRegion");
  if (live) live.textContent = text;
  const status = $("#statusText");
  if (status && status.textContent !== text) status.textContent = text;
}

const KEY_MOVES = {
  ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
  w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
  W: [-1, 0], S: [1, 0], A: [0, -1], D: [0, 1]
};

function cursorCell() {
  if (!state.grid.length) return null;
  const [r, c] = clampCursor(...(state.cursor || [0, 0]));
  return getCell(r, c);
}

/** Moves the cursor by one step, or jumps to a row or column with Home/End. */
function moveCursor(dr, dc) {
  if (!state.grid.length) return;
  state.cursor = clampCursor(...(state.cursor || [0, 0]).map((v, i) => v + [dr, dc][i]));
  paintCursor();
}

/** The cursor position, always kept inside the board. */
function clampCursor(r, c) {
  if (!state.grid.length) return [0, 0];
  // The board is not always square: rows and columns are counted separately.
  const rows = state.grid.length;
  const cols = state.grid[0].length;
  return [Math.min(Math.max(r, 0), rows - 1), Math.min(Math.max(c, 0), cols - 1)];
}

/** Jumps to the start or end of a row or column. */
function jumpCursor(to) {
  if (!state.grid.length) return;
  const [cr, cc] = clampCursor(...(state.cursor || [0, 0]));
  if (to === "row-start") state.cursor = [cr, 0];
  if (to === "row-end") state.cursor = [cr, state.grid[0].length - 1];
  if (to === "col-start") state.cursor = [0, cc];
  if (to === "col-end") state.cursor = [state.grid.length - 1, cc];
  paintCursor();
}

/**
 * Draws the keyboard cursor. It is a class rather than :focus so the game can
 * show both the real focus ring and the grid cursor without them fighting.
 */
function paintCursor() {
  $$(".letter.cursor").forEach(el => el.classList.remove("cursor"));
  const el = cursorCell();
  if (el) el.classList.add("cursor");
  state.cursorOnBoard = !!el;
}

/**
 * Reads the cell under the cursor and keeps the visible selection in step, so
 * holding an arrow key extends a word exactly like dragging with a mouse would.
 * The real updateSelection enforces a straight run, which is what we want here.
 */
function extendSelectionTo(r, c) {
  updateSelection(r, c);
  state.cursor = [r, c];
  paintCursor();
  describeSelection();
}

/**
 * True when the cursor sits on a perfect diagonal from where the word started.
 */
function isDiagonalFromStart(r, c) {
  const [sr, sc] = state.startCell || [];
  if (sr === undefined) return false;
  return Math.abs(r - sr) > 0 && Math.abs(r - sr) === Math.abs(c - sc);
}

/**
 * A word search is played in straight lines, so the keyboard needs a way to
 * reach the three axes. Holding one arrow walks its line; a perpendicular arrow
 * pressed mid-word turns the selection into a diagonal, which is how a player
 * who cannot drag asks for one.
 */
function nudgeCursorToDiagonal(dr, dc) {
  const [sr, sc] = state.startCell;
  const [cr, cc] = state.cursor;
  // Step along whichever axis the perpendicular press implies, keeping the
  // other axis in step so the run stays a perfect 45-degree diagonal.
  let next;
  if (dc !== 0) next = [cr + Math.sign(dc), cc + Math.sign(dc)];
  else next = [cr + Math.sign(dr), cc + Math.sign(dr)];
  if (next[0] < 0 || next[0] >= state.grid.length ||
      next[1] < 0 || next[1] >= state.grid[0].length) return null;
  // Only a real diagonal is worth snapping to: reject if it is a 0 or -1 slope
  // that the player could not have meant.
  const slope = Math.sign(next[1] - sc) * Math.sign(next[0] - sr);
  if (slope === 0) return null;
  return next;
}
/** Announces the current selection, so keyboard play is audible as well as visible. */
function describeSelection() {
  if (!state.selectedCells.length) return;
  const text = state.selectedCells.map(([r, c]) => state.grid[r][c]).join("");
  announce(`${text}. ${state.selectedCells.length} letters. Press Enter to submit.`);
}

function onGridKeydown(e) {
  if (!state.grid.length) return;
  const key = e.key;

  // Escape always gives up on the current word without any penalty.
  if (key === "Escape") {
    if (state.selecting) { cancelSelection(); state.selectedCells = []; announce("Selection cleared."); }
    e.preventDefault();
    return;
  }

  if (key === " " || key === "Enter") {
    e.preventDefault();
    if (state.selecting) { finishSelection(); }
    else {
      const [r, c] = state.cursor || [0, 0];
      state.selecting = true;
      state.startCell = [r, c];
      extendSelectionTo(r, c);
      announce(`Started at ${state.grid[r][c]}. Use the arrow keys to extend.`);
    }
    return;
  }

  if (key === "Home") { e.preventDefault(); jumpCursor("row-start"); return; }
  if (key === "End") { e.preventDefault(); jumpCursor("row-end"); return; }
  if (key === "PageUp") { e.preventDefault(); jumpCursor("col-start"); return; }
  if (key === "PageDown") { e.preventDefault(); jumpCursor("col-end"); return; }

  const move = KEY_MOVES[key];
  if (!move) return;
  e.preventDefault();
  const [dr, dc] = move;
  const [cr, cc] = state.cursor || [0, 0];
  const [sr, sc] = state.selecting && state.startCell ? state.startCell : [cr, cc];

  if (state.selecting && state.startCell) {
    const rd = Math.abs(cr - sr), cd = Math.abs(cc - sc);
    // A perpendicular press mid-word asks for a diagonal. Step the cursor along
    // that diagonal instead of walking the row or column it is stuck on.
    const perpendicular = (dc !== 0 && rd === 0) || (dr !== 0 && cd === 0);
    if (perpendicular) {
      const next = nudgeCursorToDiagonal(dr, dc);
      if (next) { extendSelectionTo(next[0], next[1]); return; }
    }
  }

  const [nr, nc] = clampCursor(cr + dr, cc + dc);
  if (nr === cr && nc === cc) return;                       // at an edge, stay put
  if (state.selecting) extendSelectionTo(nr, nc);          // extend the current word
  else { state.cursor = [nr, nc]; paintCursor(); announceCell(nr, nc); }
}

function announceCell(r, c) {
  const el = getCell(r, c);
  if (!el) return;
  const found = el.classList.contains("found");
  announce(`${state.grid[r][c]}, row ${r + 1} column ${c + 1}${found ? ", already found" : ""}.`);
}

function updateSelection(er, ec) {
  const sr = state.startCell[0], sc = state.startCell[1];
  const rd = Math.abs(er - sr), cd = Math.abs(ec - sc);
  // A word search only ever uses straight lines, so the cursor is allowed to
  // wander anywhere but the selection snaps to the line from the start that
  // best fits where the cursor is. Without this, a diagonal word would be
  // unreachable on a board that is not square, because the cursor could never
  // leave the column it started in.
  let cells;
  if (rd === 0 && cd === 0) {
    cells = [[sr, sc]];
  } else if (rd === cd) {
    const dr = Math.sign(er - sr), dc = Math.sign(ec - sc);
    cells = Array.from({ length: rd + 1 }, (_, i) => [sr + dr * i, sc + dc * i]);
  } else if (rd > cd) {
    const dr = Math.sign(er - sr);
    cells = Array.from({ length: rd + 1 }, (_, i) => [sr + dr * i, sc]);
  } else {
    const dc = Math.sign(ec - sc);
    cells = Array.from({ length: cd + 1 }, (_, i) => [sr, sc + dc * i]);
  }
  clearSelecting();
  state.selectedCells = cells;
  cells.forEach(([r, c]) => getCell(r, c)?.classList.add("selecting"));
}
function clearSelecting() { $$(".letter.selecting").forEach(x => x.classList.remove("selecting")) }
function getCell(r, c) { return $(`.letter[data-r="${r}"][data-c="${c}"]`) }
function finishSelection() {
  state.selecting = false;
  const cells = [...state.selectedCells];
  clearSelecting();
  state.selectedCells = [];
  // A single tap or a stray one-letter drag is not a guess. Ignore it instead of
  // charging the -25 point penalty and resetting the combo.
  if (cells.length < MIN_SELECTION_LENGTH) return;
  const str = cells.map(([r, c]) => state.grid[r][c]).join("");
  const rev = str.split("").reverse().join("");
  const match = state.placedWords.find(p => !state.foundWords.has(p.word) && (p.word === str || p.word === rev));
  if (match) handleCorrect(match);
  else handleMistake();
}

// Registered once, not per puzzle render, so listeners never stack up.
(function initSelectionEvents() {
  const grid = $("#wordGrid");
  if (grid) grid.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", (e) => {
    if (!state.selecting) return;
    // A release inside the board counts as a guess. Releasing outside it (or a
    // stray one/two letter drag) cancels instead of costing points.
    const box = grid ? grid.getBoundingClientRect() : null;
    const inside = !box || (e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom);
    if (inside) finishSelection();
    else { clearSelecting(); state.selectedCells = []; state.selecting = false }
  });
  document.addEventListener("pointercancel", cancelSelection);
})();

function handleCorrect(match) {
  state.foundWords.add(match.word);
  match.cells.forEach(([r, c]) => getCell(r, c)?.classList.add("found"));
  state.correct++;
  let pts = 100 * state.combo;
  // Lasts the whole puzzle and pays out at the end, so it is a real bet.
  if (state.multiplierActive) pts *= 2;
  if (state.randomEvent === "double") pts *= 2;
  state.score += pts;
  // Golden Word pays out on the next correct word, exactly as the banner promises.
  if (state.randomEvent === "golden") {
    save.coins += GOLDEN_BONUS_COINS;
    state.randomEvent = null;
    $("#eventBanner").classList.add("hidden");
    toast(`✨ Golden Word! +${GOLDEN_BONUS_COINS} coins`);
  }
  state.combo = Math.min(state.combo + 1, 8);
  save.wordsFound++;
  save.quests.dailyWords.progress++;
  // The "Learn" half of the game: every found word is explained and collected.
  recordWord(match.word, state.selectedCategory);
  playSound("ok");
  $("#statusText").textContent = `${match.word} found! +${pts} — ${wordDefinition(match.word)}`;
  announce(`${match.word} found, plus ${pts} points. ${wordDefinition(match.word)}`);
  toast(`📖 ${match.word} — ${wordDefinition(match.word)}`);
  renderWordList();
  updateRunUI();
  persist();
  checkQuestCompletion();
  if (state.foundWords.size === state.placedWords.length) endGame(true);
}
function handleMistake() {
  if (state.shieldActive) {
    state.shieldActive = false;
    $("#statusText").textContent = "Mistake Shield protected your combo!";
    announce("Mistake Shield protected your combo.");
    toast("🛡️ Mistake blocked");
  } else {
    state.mistakes++;
    state.combo = 1;
    const penalty = mistakePenalty();
    state.score = Math.max(0, state.score - penalty);
    $("#statusText").textContent = penalty > 0 ? `Not a hidden word. -${penalty}` : "Not a hidden word.";
    // A wrong guess is the one thing worth interrupting for.
    const alertRegion = $("#alertRegion");
    if (alertRegion) alertRegion.textContent = penalty > 0 ? `Not a hidden word, minus ${penalty} points.` : "Not a hidden word.";
    playSound("bad");
  }
  updateRunUI();
  updatePowerUI();
}
function updateRunUI() {
  $("#scoreDisplay").textContent = state.score;
  $("#comboDisplay").textContent = `x${state.combo}`;
  $("#correctDisplay").textContent = state.correct;
  $("#mistakeDisplay").textContent = state.mistakes;
  const total = state.correct + state.mistakes;
  const acc = total ? Math.round((state.correct / total) * 100) : 100;
  $("#accuracyDisplay").textContent = acc + "%";
}
function updateTimer() {
  const m = Math.floor(state.seconds / 60), s = state.seconds % 60;
  $("#timeDisplay").textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function updatePowerUI() {
  const freeHintCharges = state.freeHints || 0;
  $("#powerTimeCount").textContent = save.powers.time;
  $("#powerHintCount").textContent = save.powers.hint + freeHintCharges;
  $("#powerFinderCount").textContent = save.powers.finder;
  $("#powerMultiplierCount").textContent = save.powers.multiplier;
  $("#powerShieldCount").textContent = save.powers.shield;
  $$(".power-btn").forEach(b => b.classList.toggle("active",
    (b.dataset.power === "multiplier" && state.multiplierActive) || (b.dataset.power === "shield" && state.shieldActive)));
}
// A hint should narrow the search, never hand over the answer. It names the
// word (that is already printed on the chip list) and then describes where to
// look: length, direction, first letter and board region.
function wordDirection(cells) {
  const [r1, c1] = cells[0];
  const [r2, c2] = cells[1] || cells[0];
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
  if (dr === 0) return "horizontally";
  if (dc === 0) return "vertically";
  return "diagonally";
}
function boardRegion(r, c, size) {
  const half = size / 2;
  return `${r < half ? "top" : "bottom"}-${c < half ? "left" : "right"} corner`;
}
function hintText(placement, size) {
  const [r, c] = placement.cells[0];
  return `${placement.word} — ${placement.word.length} letters, hidden ${wordDirection(placement.cells)}. `
    + `Starts with "${placement.word[0]}" in the ${boardRegion(r, c, size)}.`;
}

function usePower(type) {
  // Scholar's Instinct grants free hints at the start of each puzzle.
  const free = type === "hint" ? (state.freeHints || 0) : 0;
  if ((save.powers[type] || 0) + free <= 0) { toast("No charges left."); return; }
  const remaining = state.placedWords.filter(p => !state.foundWords.has(p.word));
  if (!remaining.length) return;
  if (free > 0) state.freeHints--;
  else save.powers[type]--;

  if (type === "time") { state.seconds += 15; toast("⏱️ +15 seconds"); }
  if (type === "hint") {
    const p = remaining[Math.floor(Math.random() * remaining.length)];
    modal("Word Hint", hintText(p, state.grid.length));
  }
  if (type === "finder") {
    // The premium power reveals the whole word and names it, so the glow cannot
    // be missed or confused with a different word.
    const p = remaining[Math.floor(Math.random() * remaining.length)];
    p.cells.forEach(([r, c]) => {
      const el = getCell(r, c);
      if (el) { el.classList.add("finder"); setTimeout(() => el.classList.remove("finder"), FINDER_REVEAL_MS); }
    });
    $("#statusText").textContent = `🧲 ${p.word} is glowing on the board — ${p.word.length} letters.`;
    announce(`Word Finder reveals ${p.word}, ${p.word.length} letters, for two seconds.`);
    toast(`🧲 ${p.word} revealed for ${FINDER_REVEAL_MS / 1000}s`);
  }
  if (type === "multiplier") { state.multiplierActive = true; toast("🔥 This puzzle pays 2× points and coins."); }
  if (type === "shield") { state.shieldActive = true; toast("🛡️ Your next mistake is free."); }
  playSound("power"); persist(); updatePowerUI(); updateTimer();
}

// Abandoning a run must not silently burn charges the player never got to use.
function refundActivePowers() {
  const refunded = [];
  if (state.shieldActive) { state.shieldActive = false; save.powers.shield++; refunded.push("Mistake Shield") }
  if (state.multiplierActive) { state.multiplierActive = false; save.powers.multiplier++; refunded.push("2× Points & Coins") }
  if (refunded.length) {
    persist();
    updatePowerUI();
    toast(`↩️ Refunded ${refunded.join(" + ")}`);
  }
  return refunded;
}

function maybeStartRandomEvent() {
  if (state.boss || Math.random() > .38) return;
  const seconds = EVENT_DURATION_MS / 1000;
  state.eventTimers.push(setTimeout(() => {
    if (!$("#gameScreen").classList.contains("active")) return;
    const events = ["double", "rush", "golden"];
    const banner = $("#eventBanner");
    state.randomEvent = events[Math.floor(Math.random() * events.length)];

    if (state.randomEvent === "double") {
      banner.textContent = `⚡ RANDOM EVENT: DOUBLE POINTS for ${seconds} seconds!`;
    }
    if (state.randomEvent === "rush") {
      // The old text promised a bonus that did not exist. It is real now: clear
      // the puzzle inside the window and endGame pays the points out.
      banner.textContent = `⏱️ RANDOM EVENT: TIME RUSH — 15 seconds lost, clear the puzzle within ${seconds} seconds for +${RUSH_BONUS_POINTS} bonus points!`;
      state.seconds = Math.max(30, state.seconds - 15);
      state.rushDeadline = Date.now() + EVENT_DURATION_MS;
      updateTimer();
    }
    if (state.randomEvent === "golden") {
      banner.textContent = `✨ RANDOM EVENT: GOLDEN WORD — your next correct word grants +${GOLDEN_BONUS_COINS} coins!`;
    }

    banner.classList.remove("hidden");

    state.eventTimers.push(setTimeout(() => {
      banner.classList.add("hidden");
      // Every event expires, including a Golden Word that was never used.
      state.randomEvent = null;
    }, EVENT_DURATION_MS));
  }, 7000));
}

function checkQuestCompletion() {
  let awarded = false;
  for (const key in save.quests) {
    const q = save.quests[key];
    if (q.progress >= q.target && !q.claimed) {
      q.claimed = true; save.coins += q.reward; awarded = true;
      toast(`🎯 Quest complete! +${q.reward} coins`);
    }
  }
  // Quest rewards must be written to storage or they disappear on reload.
  if (awarded) persist();
}

function todayStamp() { return new Date().toISOString().slice(0, 10) }

// The three quests are daily quests. Without this reset a quest stayed claimed
// forever, so the reward could only ever be earned once.
function resetDailyQuestsIfNeeded() {
  const today = todayStamp();
  if (save.lastQuestReset === today) return false;
  for (const key in save.quests) {
    save.quests[key].progress = 0;
    save.quests[key].claimed = false;
  }
  save.lastQuestReset = today;
  persist();
  return true;
}

function endGame(win) {
  clearInterval(state.timer);
  state.timer = null;
  const level = state.levelId ? getLevel(state.levelId) : null;
  const total = state.correct + state.mistakes;
  const acc = total ? Math.round((state.correct / total) * 100) : 100;
  let coins = 0, rewards = [];

  if (win) {
    const cfg = difficultyConfig[state.selectedDifficulty];
    coins = cfg.coins + Math.floor(state.seconds / 15);
    if (state.boss) { coins += 150; save.bossesWon++; rewards.push("👑 Boss defeated"); }
    if (state.daily) {
      const today = new Date().toISOString().slice(0, 10);
      if (save.lastDaily !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        save.streak = save.lastDaily === yesterday ? save.streak + 1 : 1;
        save.lastDaily = today; save.dailyWins++; coins += 80;
      }
      rewards.push("📅 Daily challenge complete");
    }
    if (state.rushDeadline && Date.now() <= state.rushDeadline) {
      state.score += RUSH_BONUS_POINTS;
      rewards.push(`⏱️ Time Rush bonus +${RUSH_BONUS_POINTS} points`);
    }
    state.rushDeadline = null;

    // 2× Points & Coins pays out here, so it is only worth buying if you clear.
    if (state.multiplierActive) {
      coins *= 2;
      state.multiplierActive = false;
      rewards.push("🔥 2× coins applied");
    }
    coins = Math.round(coins * coinBoostMultiplier());
    if (upgradeLevel("coinBoost") > 0) rewards.push(`🪙 Coin Charm +${upgradeLevel("coinBoost") * 10}%`);

    // Campaign levels score stars: clear it, beat the time, keep mistakes low.
    if (level) {
      const previous = levelStars(level.id);
      const stars = evaluateStars(true, state.elapsed, state.mistakes, level);
      if (stars > previous) {
        const bonus = (stars - previous) * starCoinBonus;
        coins += bonus;
        rewards.push(`⭐ ${stars}/3 stars (+${bonus} coins)`);
      }
      // Stars and bosses feed the power inventory, so powers are not shop-only.
      if (stars === 3 && previous < 3) {
        save.powers.finder += 1;
        rewards.push("🧲 3-star reward: free Word Finder");
      }
      if (level.boss && previous === 0) {
        save.powers.time += 1;
        save.powers.shield += 1;
        rewards.push("👑 Boss reward: Time Boost + Mistake Shield");
      }
      if (state.score > (save.campaignBest[level.id] || 0)) {
        save.campaignBest[level.id] = state.score;
        rewards.push("🏅 New best score for this level");
      }
      save.campaign[level.id] = Math.max(previous, stars);
      // Open the map on the chapter that now has the next uncleared level.
      state.selectedChapter = null;
      const next = nextLevelAfter(level);
      if (next) rewards.push(`🗺️ Unlocked ${next.chapter}: ${next.name}`);
    }
    save.coins += coins;
    save.puzzlesWon++;
    save.bestScore = Math.max(save.bestScore, state.score);
    save.xp += 100 + Math.floor(state.score / 20);
    save.quests.scoreHunter.progress = Math.max(save.quests.scoreHunter.progress, state.score);
    if (state.mistakes <= 1) save.quests.cleanWin.progress = 1;
    while (save.xp >= save.level * 500) { save.xp -= save.level * 500; save.level++; rewards.push(`⬆️ Level ${save.level}`); }
    awardAchievements(rewards);
    playSound("win");
  }

  persist();
  $("#resultIcon").textContent = win ? "🏆" : "⌛";
  $("#resultEyebrow").textContent = win ? "QUEST COMPLETE" : "QUEST FAILED";
  $("#resultTitle").textContent = win ? (state.boss ? "Boss Defeated!" : "Victory!") : "Time's Up";
  $("#resultMessage").textContent = win ? "You found every hidden word." : "Try again and sharpen your strategy.";
  $("#resultScore").textContent = state.score;
  $("#resultCoins").textContent = `+${coins}`;
  $("#resultAccuracy").textContent = acc + "%";
  $("#resultTime").textContent = formatTime(Math.max(0, state.seconds));
  $("#rewardList").innerHTML = rewards.map(r => `<span class="reward-badge">${r}</span>`).join("");
  if (level) {
    const stars = win ? levelStars(level.id) : 0;
    const next = win ? nextLevelAfter(level) : null;
    $("#resultStars").classList.remove("hidden");
    $("#resultStars").innerHTML = `${starRow(stars)}<small>${level.chapter} • ${level.name} • ${level.difficulty}</small>`;
    $("#resultNext").textContent = win
      ? (next ? `Next level: ${next.chapter} • ${next.name}` : "Quest complete — every level cleared!")
      : `Clear ${level.name} to unlock the next level.`;
    $("#nextPuzzleBtn").textContent = win ? (next ? "Next Level" : "Back to Quest Map") : "Try Again";
    $("#resultsMapBtn").classList.remove("hidden");
  } else {
    $("#resultStars").classList.add("hidden");
    $("#resultStars").innerHTML = "";
    $("#resultNext").textContent = "";
    $("#nextPuzzleBtn").textContent = win ? "Next Puzzle" : "Try Again";
    $("#resultsMapBtn").classList.add("hidden");
  }
  showScreen("resultsScreen");
}
function awardAchievements(rewards) {
  const checks = [
    ["first_win", "First Victory", save.puzzlesWon >= 1],
    ["word_hunter", "Word Hunter", save.wordsFound >= 50],
    ["perfect_solver", "Perfect Solver", state.mistakes === 0],
    ["streak_master", "Streak Master", save.streak >= 7],
    ["boss_slayer", "Boss Slayer", save.bossesWon >= 1],
    ["coin_keeper", "Coin Keeper", save.coins >= 1000]
  ];
  for (const [id, name, ok] of checks) {
    if (ok && !save.achievements.includes(id)) { save.achievements.push(id); rewards.push(`🏅 ${name}`); }
  }
}
function formatTime(sec) { return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}` }

function renderProfile() {

  $("#profileRank").textContent =
    getRank();

  $("#profileLevel").textContent =
    save.level;


  // XP
  const need =
    save.level * 500;

  const pct =
    Math.min(
      100,
      (save.xp / need) * 100
    );

  $("#xpFill").style.width =
    pct + "%";

  $("#xpText").textContent =
    `${save.xp} / ${need} XP`;


  // LIFETIME STATS
  $("#pWords").textContent =
    save.wordsFound;

  $("#pWins").textContent =
    save.puzzlesWon;

  $("#pBosses").textContent =
    save.bossesWon;

  $("#pDaily").textContent =
    save.dailyWins;


  // ACHIEVEMENTS
  const all = [

    [
      "first_win",
      "🏆 First Victory",
      "Win your first puzzle"
    ],

    [
      "word_hunter",
      "🔎 Word Hunter",
      "Find 50 words"
    ],

    [
      "perfect_solver",
      "⭐ Perfect Solver",
      "Win with zero mistakes"
    ],

    [
      "streak_master",
      "🔥 Streak Master",
      "Reach a 7-day streak"
    ],

    [
      "boss_slayer",
      "👑 Boss Slayer",
      "Defeat a boss puzzle"
    ],

    [
      "coin_keeper",
      "🪙 Coin Keeper",
      "Hold 1,000 coins"
    ]

  ];


  $("#achievementGrid").innerHTML =
    all.map(([id, name, description]) => `

      <div class="achievement ${
        save.achievements.includes(id)
          ? "unlocked"
          : ""
      }">

        <strong>
          ${name}
        </strong>

        <small>
          ${description}
        </small>

      </div>

    `).join("");


  // RANK PROGRESSION
  updateRankProgress();

  // QUEST MAP + WORD CODEX
  renderChapterSummary();
  renderCodex();

  // ACCOUNT
  const account = activeAccount();
  $("#profileAccountAvatar").textContent = account ? account.avatar : "👤";
  $("#profileAccountName").textContent = account ? account.name : "Not signed in";
  $("#profileAccountMeta").textContent = account
    ? `${account.pin ? "🔒 PIN protected" : "No PIN"} • created ${formatDay(account.createdAt)} • ${accountSummary(account)}`
    : "Create a profile to keep your progress on this device.";

}

$("#playBtn").onclick = () => showScreen("campaignScreen");
$("#quickPlayBtn").onclick = () => { buildSetup(); showScreen("setupScreen") };
$("#dailyBtn").onclick = () => startGame({ daily: true, category: "Animals", difficulty: "Medium", mode: "timed" });
$("#bossBtn").onclick = () => startGame({ boss: true, category: "Technology", difficulty: "Hard", mode: "timed" });
$("#profileBtn").onclick = () => showScreen("profileScreen");
$("#brandBtn").onclick = () => showScreen("homeScreen");
$$("[data-go]").forEach(b => b.onclick = () => showScreen(b.dataset.go));
$("#soundBtn").onclick = () => { save.sound = !save.sound; persist() };

// ---- ACCESSIBILITY UI ----
const A11Y_HELP = {
  reduceMotion: "Turns off screen shake, pulses and sliding animations.",
  highContrast: "Stronger borders and brighter text on the dark background.",
  largeText: "Increases the size of all text by about 18%.",
  keyboardHelp: "Shows the keyboard hints above the puzzle board.",
  colorBlindMode: "Uses blue and orange instead of gold and green, so found words are not signalled by colour alone."
};

/** Renders one switch per setting, and keeps it in sync when toggled. */
function renderA11ySettings() {
  const host = $("#a11yList");
  if (!host) return;
  const s = a11ySettings();
  host.innerHTML = "";
  for (const key of Object.keys(A11Y_DEFAULTS)) {
    const id = "a11y-" + key;
    const row = document.createElement("label");
    row.className = "a11y-row";
    row.setAttribute("for", id);
    row.innerHTML =
      `<span class="a11y-copy"><b>${A11Y_LABELS[key]}</b><small>${A11Y_HELP[key]}</small></span>`;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    input.checked = s[key];
    input.addEventListener("change", () => {
      setA11y(key, input.checked);
      // Reduced motion can be forced by the OS, so reflect what actually applies.
      if (key === "reduceMotion") input.checked = a11ySettings().reduceMotion;
      announce(`${A11Y_LABELS[key]} ${input.checked ? "on" : "off"}.`);
    });
    const sw = document.createElement("span");
    sw.className = "a11y-switch";
    sw.setAttribute("aria-hidden", "true");
    row.appendChild(input);
    row.appendChild(sw);
    host.appendChild(row);
  }
}

function openA11y() {
  renderA11ySettings();
  const modal = $("#a11yModal");
  if (modal) modal.classList.remove("hidden");
  const first = $("#a11yList input");
  if (first) first.focus();
  announce("Accessibility settings opened.");
}

function closeA11y() {
  const modal = $("#a11yModal");
  if (modal) modal.classList.add("hidden");
  const btn = $("#a11yBtn");
  if (btn) btn.focus();
}

$("#a11yBtn").onclick = () => openA11y();
$("#closeA11yBtn").onclick = () => closeA11y();

// ---- ACCOUNTS ----
$("#accountBtn").onclick = () => showScreen("accountScreen");
$("#createAccountBtn").onclick = () => createAccount();
$("#newAccountName").onkeydown = (e) => { if (e.key === "Enter") createAccount() };
$("#newAccountPin").oninput = (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4) };
$("#newAccountPin").onkeydown = (e) => { if (e.key === "Enter") createAccount() };
$("#importAccountBtn").onclick = () => $("#importFile").click();
$("#importFile").onchange = (e) => { importAccount(e.target.files && e.target.files[0]); e.target.value = "" };
$("#profileSwitchBtn").onclick = () => showScreen("accountScreen");
$("#profileSignOutBtn").onclick = () => signOut();
$("#promptOk").onclick = () => closePrompt($("#promptInput").value);
$("#promptCancel").onclick = () => closePrompt(null);
$("#promptInput").onkeydown = (e) => {
  if (e.key === "Enter") closePrompt($("#promptInput").value);
  if (e.key === "Escape") closePrompt(null);
};
$("#promptModal").addEventListener("click", (e) => { if (e.target === $("#promptModal")) closePrompt(null) });
$("#beginGameBtn").onclick = () => {
  const mode = $('input[name="mode"]:checked')?.value || "normal";
  state.mode = mode; startGame({ mode });
};
$("#quitGameBtn").onclick = () => {
  if (!confirm("Quit this puzzle? Your current run will be lost.")) return;
  clearInterval(state.timer);
  state.eventTimers.forEach(clearTimeout); state.eventTimers = [];
  refundActivePowers();
  showScreen("homeScreen");
};
$$(".power-btn").forEach(b => b.onclick = () => usePower(b.dataset.power));
$("#resultsHomeBtn").onclick = () => showScreen("homeScreen");
$("#resultsMapBtn").onclick = () => showScreen("campaignScreen");
$("#codexSearch").oninput = () => renderCodex();
$("#nextPuzzleBtn").onclick = () => {
  const failed = $("#resultEyebrow").textContent === "QUEST FAILED";
  const level = state.levelId ? getLevel(state.levelId) : null;
  if (level) {
    // Campaign runs stay in the campaign: retry, advance, or back to the map.
    if (failed) return startGame({ level: level.id });
    const next = nextLevelAfter(level);
    return next ? startGame({ level: next.id }) : showScreen("campaignScreen");
  }
  if (failed) startGame({ boss: state.boss, daily: state.daily, mode: state.mode });
  else {
    // rotate category after a win for variety
    const cats = Object.keys(categories), i = cats.indexOf(state.selectedCategory);
    state.selectedCategory = cats[(i + 1) % cats.length];
    startGame({ mode: state.mode });
  }
};

resetDailyQuestsIfNeeded();
// Apply saved accessibility settings before anything renders, so the first
// frame the player sees already respects them.
applyAccessibility();
buildSetup();
renderHome();
updateGlobalUI();
// A fresh install (or a signed-out player) starts on the profile picker.
if (!activeAccount()) showScreen("accountScreen");

// =========================================================
// POWER-UP SHOP
// =========================================================

const powerPrices = {
  time: 35,
  hint: 20,
  finder: 60,
  multiplier: 120,
  shield: 30
};

const powerNames = {
  time: "Time Boost",
  hint: "Word Hint",
  finder: "Word Finder",
  multiplier: "2× Points & Coins",
  shield: "Mistake Shield"
};


// =========================================================
// PERMANENT UPGRADES
// =========================================================
// The long-term coin sink. Consumable powers are the tactical layer; these are
// the strategic one, and unlike powers they never run out.

const upgradeConfig = {
  extraTime: {
    name: "Extra Time",
    icon: "⏳",
    description: "Adds 5 seconds to every puzzle you play.",
    max: 3,
    baseCost: 150
  },
  coinBoost: {
    name: "Coin Charm",
    icon: "🪙",
    description: "Earn 10% more coins from every puzzle you clear.",
    max: 3,
    baseCost: 200
  },
  freeHint: {
    name: "Scholar's Instinct",
    icon: "🎓",
    description: "Start every puzzle with one free Word Hint.",
    max: 2,
    baseCost: 250
  },
  softMistakes: {
    name: "Steady Hand",
    icon: "🧤",
    description: "Wrong guesses cost 5 fewer points per level.",
    max: 3,
    baseCost: 150
  }
};

function upgradeLevel(key) { return save.upgrades[key] || 0 }
function upgradeMaxed(key) { return upgradeLevel(key) >= upgradeConfig[key].max }
function upgradeCost(key) { return upgradeConfig[key].baseCost * Math.pow(2, upgradeLevel(key)) }

// Upgrade effects live here so the numbers can never drift apart.
function bonusTimeSeconds() { return 5 * upgradeLevel("extraTime") }
function coinBoostMultiplier() { return 1 + .1 * upgradeLevel("coinBoost") }
function freeHintsPerPuzzle() { return upgradeLevel("freeHint") }
function mistakePenalty() { return Math.max(0, MISTAKE_PENALTY - 5 * upgradeLevel("softMistakes")) }

function renderUpgrades() {
  const host = $("#upgradeGrid");
  if (!host) return;
  host.innerHTML = "";
  Object.entries(upgradeConfig).forEach(([key, cfg]) => {
    const level = upgradeLevel(key);
    const maxed = level >= cfg.max;
    const row = document.createElement("button");
    row.className = "shop-item upgrade-item"
      + (maxed ? " maxed" : (save.coins < upgradeCost(key) ? " cannot-afford" : ""));
    row.dataset.upgrade = key;
    row.disabled = maxed;
    row.innerHTML = `
      <span class="shop-icon">${cfg.icon}</span>
      <div class="shop-copy">
        <b>${cfg.name} <span class="tag">PERMANENT</span></b>
        <small>${cfg.description}</small>
      </div>
      <div class="shop-price">
        <strong>${maxed ? "MAX" : `${upgradeCost(key)} Coins`}</strong>
        <small>Level ${level} / ${cfg.max}</small>
      </div>`;
    row.onclick = () => buyUpgrade(key, row);
    host.appendChild(row);
  });
}

function buyUpgrade(key, button) {
  const cfg = upgradeConfig[key];
  if (!cfg || upgradeMaxed(key)) return;
  const cost = upgradeCost(key);
  const message = $("#upgradeMessage");

  if (save.coins < cost) {
    if (button) { button.classList.remove("purchase-error"); void button.offsetWidth; button.classList.add("purchase-error") }
    if (message) {
      message.textContent = `❌ You need ${cost - save.coins} more coins for ${cfg.name}.`;
      message.classList.remove("success-message");
      message.classList.add("error-message");
    }
    toast("Not enough coins.");
    playSound("bad");
    return;
  }

  save.coins -= cost;
  save.upgrades[key] = upgradeLevel(key) + 1;
  persist();
  updateShopInventory();
  updatePowerUI();
  animateShopBalance();

  if (button) { button.classList.remove("purchase-success"); void button.offsetWidth; button.classList.add("purchase-success") }
  if (message) {
    message.textContent = `✨ ${cfg.name} is now level ${upgradeLevel(key)}!`;
    message.classList.remove("error-message");
    message.classList.add("success-message");
  }
  toast(`✅ ${cfg.name} upgraded to level ${upgradeLevel(key)}`);
  playSound("power");
}


// =========================================================
// UPDATE SHOP INVENTORY
// =========================================================

function updateShopInventory() {

  const ownedMap = {
    ownedTime: save.powers.time,
    ownedHint: save.powers.hint,
    ownedFinder: save.powers.finder,
    ownedMultiplier: save.powers.multiplier,
    ownedShield: save.powers.shield
  };


  Object.entries(ownedMap).forEach(([id, value]) => {

    const element = $("#" + id);

    if (element) {
      element.textContent = `Owned: ${value}`;
    }

  });


  // Update shop coin balance
  if ($("#shopCoins")) {
    $("#shopCoins").textContent = save.coins;
  }


  // Keep the displayed prices in sync with powerPrices so they cannot drift.
  Object.entries(powerPrices).forEach(([type, price]) => {
    const label = $("#price" + type[0].toUpperCase() + type.slice(1));
    if (label) label.textContent = `${price} Coins`;
  });

  // Mark items that player cannot afford (upgrade rows manage their own state)
  $$(".shop-item").forEach(button => {

    const type = button.dataset.buy;
    if (!type) return;

    const price = powerPrices[type];

    button.classList.toggle(
      "cannot-afford",
      save.coins < price
    );

  });

  renderUpgrades();

}


// =========================================================
// COIN BALANCE ANIMATION
// =========================================================

function animateShopBalance() {

  const balance =
    document.querySelector(".shop-balance");

  if (!balance) return;


  balance.classList.remove("coin-change");

  // Restart animation
  void balance.offsetWidth;

  balance.classList.add("coin-change");

}


// =========================================================
// BUY POWER-UP
// =========================================================

function buyPower(type, button) {

  const price = powerPrices[type];


  // Safety check
  if (
    !price ||
    !Object.prototype.hasOwnProperty.call(
      save.powers,
      type
    )
  ) {
    return;
  }


  // =====================================================
  // NOT ENOUGH COINS
  // =====================================================

  if (save.coins < price) {

    button.classList.remove(
      "purchase-error"
    );

    // Restart shake animation
    void button.offsetWidth;

    button.classList.add(
      "purchase-error"
    );


    const message =
      $("#purchaseMessage");


    if (message) {

      const needed =
        price - save.coins;

      message.textContent =
        `❌ You need ${needed} more coins for ${powerNames[type]}.`;

      message.classList.remove(
        "success-message"
      );

      message.classList.add(
        "error-message"
      );

    }


    toast("Not enough coins.");

    playSound("bad");

    return;
  }


  // =====================================================
  // PURCHASE SUCCESS
  // =====================================================

  save.coins -= price;

  save.powers[type] += 1;


  // Save to localStorage
  persist();


  // Update power-up counters in game
  updatePowerUI();


  // Update shop
  updateShopInventory();


  // Animate coin balance
  animateShopBalance();


  // Purchase animation
  button.classList.remove(
    "purchase-success"
  );

  void button.offsetWidth;

  button.classList.add(
    "purchase-success"
  );


  // Purchase message
  const message =
    $("#purchaseMessage");


  if (message) {

    message.textContent =
      `✨ ${powerNames[type]} purchased!`;

    message.classList.remove(
      "error-message"
    );

    message.classList.add(
      "success-message"
    );

  }


  // Toast notification
  toast(
    `✅ ${powerNames[type]} added to inventory!`
  );


  // Play sound
  playSound("power");

}


// =========================================================
// OPEN POWER-UP SHOP
// =========================================================

function openPowerShop() {

  updateShopInventory();


  const message =
    $("#purchaseMessage");


  if (message) {

    message.textContent =
      "Choose a power-up to add to your inventory.";

    message.classList.remove(
      "error-message",
      "success-message"
    );

  }


  $("#shopModal").classList.remove(
    "hidden"
  );

}


// =========================================================
// CLOSE POWER-UP SHOP
// =========================================================

function closePowerShop() {

  $("#shopModal").classList.add(
    "hidden"
  );

}


// =========================================================
// SHOP BUTTON EVENTS
// =========================================================

const shopButton = $("#shopBtn");

if (shopButton) {

  shopButton.onclick =
    openPowerShop;

}


// The shop is reachable from inside a puzzle as well, so a run can be restocked
// instead of being abandoned.
const gameShopButton = $("#gameShopBtn");

if (gameShopButton) {

  gameShopButton.onclick =
    openPowerShop;

}


const closeShopButton =
  $("#closeShopBtn");

if (closeShopButton) {

  closeShopButton.onclick =
    closePowerShop;

}


// =========================================================
// PURCHASE BUTTONS
// =========================================================

$$(".shop-item").forEach(button => {

  button.onclick = () => {

    buyPower(
      button.dataset.buy,
      button
    );

  };

});


// =========================================================
// CLICK OUTSIDE SHOP TO CLOSE
// =========================================================

const shopModal =
  $("#shopModal");

if (shopModal) {

  shopModal.addEventListener(
    "click",
    event => {

      if (
        event.target === shopModal
      ) {

        closePowerShop();

      }

    }
  );

}

// =========================================================
// INTERACTION DESIGN - CLICK RIPPLE EFFECT
// =========================================================

function addRippleEffect() {
  const selectors = [
    ".btn",
    ".choice",
    ".difficulty",
    ".power-btn",
    ".icon-btn"
  ].join(",");

  document.addEventListener("pointerdown", (event) => {
    const target = event.target.closest(selectors);

    if (!target) return;

    const style = getComputedStyle(target);

    if (style.position === "static") {
      target.style.position = "relative";
    }

    target.style.overflow = "hidden";

    const rect = target.getBoundingClientRect();

    const ripple = document.createElement("span");

    ripple.className = "interaction-ripple";

    ripple.style.left =
      `${event.clientX - rect.left}px`;

    ripple.style.top =
      `${event.clientY - rect.top}px`;

    target.appendChild(ripple);

    ripple.addEventListener(
      "animationend",
      () => ripple.remove(),
      { once: true }
    );
  });
}

addRippleEffect();