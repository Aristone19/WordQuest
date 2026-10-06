export const categories = {
  Animals: [
    ["TIGER", "LION", "ZEBRA", "PANDA", "EAGLE", "SHARK", "WHALE", "OTTER", "COBRA", "HORSE", "RABBIT", "MONKEY", "PARROT", "TURTLE"],
    ["elephant", "giraffe", "dolphin", "penguin", "buffalo", "leopard"]
  ],
  Nature: [
    ["FOREST", "RIVER", "OCEAN", "MOUNTAIN", "VALLEY", "FLOWER", "CLOUD", "STORM", "DESERT", "ISLAND", "CANYON", "MEADOW", "RAIN", "WIND"],
    ["waterfall", "sunlight", "volcano", "rainbow", "glacier"]
  ],
  Technology: [
    ["CODE", "PIXEL", "ROBOT", "SERVER", "CLOUD", "BROWSER", "NETWORK", "SCRIPT", "DATA", "LOGIC", "SYSTEM", "MOBILE", "CYBER", "DIGITAL"],
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
    ["ASIA", "EUROPE", "AFRICA", "ISLAND", "OCEAN", "RIVER", "CHINA", "JAPAN", "INDIA", "CANADA", "BRAZIL", "EGYPT", "SPAIN", "ITALY"],
    ["philippines", "australia", "america", "england", "mexico"]
  ]
};

export const hints = {
  TIGER: 'A striped big cat.',
  LION: 'Known as the king of the jungle.',
  ZEBRA: 'An animal with black-and-white stripes.',
  PANDA: 'A black-and-white bear that loves bamboo.',
  EAGLE: 'A powerful bird of prey.',
  SHARK: 'A large ocean predator.',
  WHALE: 'One of the largest animals on Earth.',
  OTTER: 'A playful aquatic mammal.',
  COBRA: 'A venomous snake with a hood.',
  HORSE: 'A fast animal often ridden by people.',
  RABBIT: 'A small animal with long ears.',
  MONKEY: 'A clever primate.',
  PARROT: 'A colorful bird known for mimicking sounds.',
  TURTLE: 'A reptile with a hard shell.',
  FOREST: 'A large area filled with trees.',
  RIVER: 'Flowing water that travels toward a sea or lake.',
  OCEAN: 'A vast body of salt water.',
  MOUNTAIN: 'A very high natural landform.',
  VALLEY: 'Low land between hills or mountains.',
  FLOWER: 'A colorful part of a plant.',
  CLOUD: 'A visible mass of water droplets in the sky.',
  STORM: 'Severe weather with wind or rain.',
  DESERT: 'A very dry region.',
  ISLAND: 'Land completely surrounded by water.',
  CANYON: 'A deep valley with steep sides.',
  MEADOW: 'An open grassy field.',
  CODE: 'Instructions written for a computer.',
  PIXEL: 'The smallest picture element on a screen.',
  ROBOT: 'A programmable machine.',
  SERVER: 'A computer that provides services to other computers.',
  BROWSER: 'Software used to view websites.',
  NETWORK: 'Connected computers or devices.',
  SCRIPT: 'A small program or sequence of commands.',
  DATA: 'Facts or information stored for use.',
  LOGIC: 'Reasoning used to make decisions.',
  SYSTEM: 'A group of parts working together.',
  MOBILE: 'Designed to move or work on phones.',
  CYBER: 'Related to computers and networks.',
  DIGITAL: 'Represented using electronic technology.',
  PIZZA: 'A baked dish with dough, sauce, and toppings.',
  PASTA: 'Food made from dough and often served with sauce.',
  BREAD: 'Baked food made from flour.',
  MANGO: 'A sweet tropical fruit.',
  APPLE: 'A common round fruit.',
  CHEESE: 'Food made from milk.',
  BURGER: 'A sandwich with a patty.',
  NOODLE: 'A long thin strip of pasta.',
  COOKIE: 'A small sweet baked treat.',
  SALAD: 'A dish of mixed vegetables or ingredients.',
  CHICKEN: 'A common poultry meat.',
  RICE: 'A staple grain eaten around the world.',
  SOUP: 'A liquid dish often served warm.',
  TACO: 'A folded tortilla filled with ingredients.',
  ELEPHANT: 'A huge animal with a long trunk.',
  GIRAFFE: 'The tallest land animal.',
  DOLPHIN: 'A smart marine mammal.',
  PENGUIN: 'A flightless bird that swims in cold water.',
  BUFFALO: 'A large wild ox.',
  LEOPARD: 'A spotted big cat.',
  WATERFALL: 'Water dropping from a great height.',
  SUNLIGHT: 'Bright natural light that fills the day.',
  VOLCANO: 'A mountain that can erupt.',
  RAINBOW: 'An arc of colors in the sky after a shower.',
  GLACIER: 'A huge slow-moving mass of ice.',
  ALGORITHM: 'A step-by-step set of instructions.',
  DATABASE: 'An organized collection of stored records.',
  SOFTWARE: 'Programs that run on a computer.',
  HARDWARE: 'The physical parts of a computer.',
  INTERNET: 'The global network of networks.',
  SANDWICH: 'Fillings served between two slices of bread.',
  CHOCOLATE: 'A sweet treat made from cocoa.',
  PANCAKE: 'A flat cake cooked in a pan.',
  AVOCADO: 'A green fruit with a large stone.',
  COCONUT: 'A tropical fruit with hard shells and a milky center.',
  BADMINTON: 'A racket sport played with a shuttlecock.',
  BASEBALL: 'A bat-and-ball sport with four bases.',
  CYCLING: 'Riding a bicycle.',
  BOWLING: 'Knocking down pins with a heavy ball.',
  ARCHERY: 'The sport of shooting arrows at a target.',
  PHILIPPINES: 'An archipelago country in Southeast Asia.',
  AUSTRALIA: 'The continent-country of kangaroos.',
  AMERICA: 'A continent, home to the United States.',
  ENGLAND: 'A country in the United Kingdom.',
  MEXICO: 'A country south of the United States.'
};

export const difficultyConfig = {
  Easy: {
    size: 10,
    words: 7,
    time: 240,
    coins: 50,
    icon: '🌱',
    subtitle: 'Relaxed Quest',
    description: 'Smaller grid, fewer words, more time.'
  },
  Medium: {
    size: 12,
    words: 9,
    time: 210,
    coins: 80,
    icon: '⚔️',
    subtitle: 'Skilled Explorer',
    description: 'Balanced challenge with tougher word placement.'
  },
  Hard: {
    size: 14,
    words: 11,
    time: 180,
    coins: 120,
    icon: '🔥',
    subtitle: 'Master Challenge',
    description: 'Large grid, more words, less time.'
  }
};

export const longWordRatio = {
  Easy: 0,
  Medium: 0.25,
  Hard: 0.4
};

export const chapterPlan = [
  {
    category: 'Animals', name: 'Beastlands', icon: '🐾',
    levels: ['Petting Zoo', 'Forest Trail', 'Jungle Call', 'River Bank', 'Ocean Drift', 'Mountain Roar', 'Night Hunt', 'The Alpha']
  },
  {
    category: 'Nature', name: 'Wildlands', icon: '🌿',
    levels: ['First Bloom', 'Quiet Meadow', 'River Songs', 'Storm Front', 'Frozen Peak', 'Desert Winds', 'Volcano Rise', 'Eye of the Storm']
  },
  {
    category: 'Technology', name: 'Codelands', icon: '💻',
    levels: ['Boot Sequence', 'First Script', 'Local Network', 'Data Streams', 'Server Room', 'Firewall', 'Deep Logic', 'The Mainframe']
  },
  {
    category: 'Food', name: 'Feastlands', icon: '🍕',
    levels: ['Morning Table', 'Market Day', 'Garden Harvest', 'Sweet Aisle', 'Hot Kitchen', 'Street Eats', 'Grand Buffet', 'The Banquet']
  },
  {
    category: 'Sports', name: 'Arenal', icon: '🏆',
    levels: ['Warm Up', 'Track Day', 'Team Spirit', 'Final Set', 'Ring Side', 'Extra Time', 'Champion\'s Round', 'The Final']
  },
  {
    category: 'Geography', name: 'Atlas', icon: '🌍',
    levels: ['First Maps', 'Island Hop', 'River Cross', 'Distant Shores', 'Capital Trail', 'Great Divide', 'World Tour', 'The Unknown']
  }
];

export const levelDifficulty = ['Easy', 'Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard'];
export const starCoinBonus = 25;

export const campaign = chapterPlan.flatMap((chapter, chapterIndex) =>
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

export const maxStars = campaign.length * 3;

export function getLevel(id) { return campaign.find(l => l.id === id) || null; }
export function levelStars(id, saveCampaign = {}) { return saveCampaign[id] || 0; }
export function totalStars(saveCampaign = {}) { return campaign.reduce((sum, level) => sum + levelStars(level.id, saveCampaign), 0); }
export function levelUnlocked(level, saveCampaign = {}) {
  if (level.index === 0) return true;
  return levelStars(campaign[level.index - 1].id, saveCampaign) > 0;
}
export function levelRunTime(level) {
  const cfg = difficultyConfig[level.difficulty];
  return level.boss ? Math.max(120, cfg.time + 60 - 45) : cfg.time + 60;
}
export function levelStarTime(level) { return Math.round(levelRunTime(level) * 0.75); }
export function evaluateStars(win, secondsUsed, mistakes, level) {
  if (!win) return 0;
  let stars = 1;
  if (secondsUsed <= levelStarTime(level)) stars += 1;
  if (mistakes <= 1) stars += 1;
  return stars;
}
export function starRow(stars) {
  return [0, 1, 2].map(i => `<i class="star${i < stars ? ' on' : ''}">★</i>`).join('');
}
export function nextLevelAfter(level, saveCampaign = {}) {
  const next = campaign[level.index + 1];
  return next && levelUnlocked(next, saveCampaign) ? next : null;
}
export function currentLevel(saveCampaign = {}) {
  return campaign.find(level => levelUnlocked(level, saveCampaign) && levelStars(level.id, saveCampaign) === 0) || campaign[campaign.length - 1];
}

export function allWords() {
  const map = new Map();
  Object.entries(categories).forEach(([cat, lists]) => {
    lists.forEach(list => list.forEach(word => {
      const title = word.toUpperCase();
      if (!map.has(title)) map.set(title, cat);
    }));
  });
  return map;
}

export function wordDefinition(word) {
  return hints[word] || 'Keep playing this category to learn more about this word.';
}

export function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWords(list, seedText) {
  const out = [...list];
  const rand = seedText ? mulberry32(hashString(seedText)) : Math.random;
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function chooseWords(category, count, difficulty = 'Easy', daily = false, seedText = null) {
  const cfg = difficultyConfig[difficulty] || difficultyConfig.Easy;
  const [shortList, longList] = categories[category];
  const fits = (word) => word.length <= cfg.size;
  const seed = seedText || (daily ? `${category}|${difficulty}|${new Date().toISOString().slice(0, 10)}` : null);

  const shortPool = shortList.map(word => word.toUpperCase()).filter(fits);
  const longPool = longList.map(word => word.toUpperCase()).filter(fits);

  const longCount = Math.min(
    longPool.length,
    count,
    Math.round(count * (longWordRatio[difficulty] || 0))
  );

  const picked = [
    ...shuffleWords(longPool, seed).slice(0, longCount),
    ...shuffleWords(shortPool, seed).slice(0, count - longCount)
  ];

  return shuffleWords(picked, seed ? `${seed}|order` : null);
}

export function generateGrid(size, words, seedText = null) {
  let best = { grid: [], placements: [] };
  for (let attempt = 0; attempt < 6; attempt++) {
    const rand = seedText ? mulberry32(hashString(`${seedText}|grid|${attempt}`)) : Math.random;
    const candidate = attemptPlacements(size, words, rand);
    if (candidate.placements.length > best.placements.length) best = candidate;
    if (best.placements.length === words.length) break;
  }
  return best;
}

export function attemptPlacements(size, words, rand = Math.random) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let grid = Array.from({ length: size }, () => Array(size).fill(''));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const placements = [];

  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    let placed = false;
    for (let tries = 0; tries < 400 && !placed; tries++) {
      const [dr, dc] = dirs[Math.floor(rand() * dirs.length)];
      const r = Math.floor(rand() * size);
      const c = Math.floor(rand() * size);
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
        grid[rr][cc] = word[i];
        cells.push([rr, cc]);
      }
      placements.push({ word, cells });
      placed = true;
    }
  }

  grid = grid.map(row => row.map(ch => ch || letters[Math.floor(rand() * letters.length)]));
  return { grid, placements };
}
