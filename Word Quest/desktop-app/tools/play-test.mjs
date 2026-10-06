// Plays a Quick Play puzzle end to end in a real browser: finds every hidden
// word on the rendered grid, drags each one, and reports the results.
export default async function run(page, ui) {
  const out = { steps: [] };

  // A loading splash covers the UI at first. Wait for it to go before touching
  // anything, otherwise clicks land on the overlay.
  await page.waitForFunction(
    () => {
      const s = document.querySelector('#splash, .splash, #loadingScreen');
      if (!s) return true;
      const st = getComputedStyle(s);
      return st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0'
        || s.classList.contains('hidden');
    },
    null, { timeout: 30000 }
  ).catch(() => out.steps.push('splash never cleared'));
  out.steps.push('splash cleared');
  await page.waitForTimeout(600);

  // The game asks which profile to use. Create one if none exist yet.
  if (await page.locator('#accountScreen.active').count()) {
    await page.locator('#newAccountName').fill('Tester');
    await page.locator('#createAccountBtn').click();
    await page.waitForTimeout(1200);
    out.steps.push('created a profile');
  }

  await page.locator('#quickPlayBtn').click();
  await page.waitForTimeout(500);
  await page.locator('#beginGameBtn').click();
  await page.waitForSelector('.letter', { timeout: 15000 });
  out.lettersRendered = await page.locator('.letter').count();

  // Read the rendered grid. `state` is a top-level `let`, so it is not reachable
  // as a window property; the DOM is the honest source of what the player sees.
  const grid = await page.evaluate(() => {
    const rows = {};
    document.querySelectorAll('.letter').forEach(el => {
      const r = el.dataset.r, c = el.dataset.c;
      (rows[r] = rows[r] || {})[c] = el.textContent.trim();
    });
    const rs = Object.keys(rows).map(Number).sort((a, b) => a - b);
    return rs.map(r => rs.map(c => rows[r][c]));
  });
  const N = grid.length;
  out.gridSize = N;

  // Scan for a real word in the category, in all 8 directions.
  const WORDS = ['TIGER', 'LION', 'ZEBRA', 'PANDA', 'EAGLE', 'SHARK', 'WHALE', 'OTTER',
    'COBRA', 'HORSE', 'RABBIT', 'MONKEY', 'PARROT', 'TURTLE'];
  const DIRS = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];

  const hits = [];
  for (const w of WORDS) {
    for (const d of DIRS) {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const er = r + d[0] * (w.length - 1), ec = c + d[1] * (w.length - 1);
          if (er < 0 || ec < 0 || er >= N || ec >= N) continue;
          let ok = true;
          for (let i = 0; i < w.length; i++) if (grid[r + d[0] * i][c + d[1] * i] !== w[i]) { ok = false; break; }
          if (ok) { hits.push({ word: w, r, c, er, ec }); break; }
        }
      }
    }
  }
  out.wordsOnBoard = hits.map(h => h.word);
  if (!hits.length) return { error: 'no category words found on the board', out };

  // Drag each one, as a player would.
  const results = [];
  for (const h of hits.slice(0, 4)) {
    const a = await page.locator(`.letter[data-r="${h.r}"][data-c="${h.c}"]`).boundingBox();
    const b = await page.locator(`.letter[data-r="${h.er}"][data-c="${h.ec}"]`).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 });
    await page.mouse.up();
    await page.waitForTimeout(450);
    results.push({
      word: h.word,
      status: await page.evaluate(() => document.querySelector('#statusText')?.textContent?.trim() || '')
    });
  }
  out.drags = results;
  out.finalStatus = await page.evaluate(() => document.querySelector('#statusText')?.textContent?.trim() || '');
  out.highlighted = await page.locator('.letter.found, .letter.correct, .letter.hit').count();
  out.screensVisible = await page.evaluate(() =>
    [...document.querySelectorAll('.screen')].filter(s => s.classList.contains('active')).map(s => s.id));

  return out;
}
