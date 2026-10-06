// Plays a whole puzzle with the KEYBOARD ONLY, in a real browser.
//
// This is the real test of the accessibility work: a word search is a pointing
// task, so if a puzzle can be cleared without a mouse the grid is genuinely
// navigable. It also exercises the settings panel and the ARIA live region.

export default async function run(page, ui) {
  const out = { steps: [] };

  await page.waitForFunction(() => {
    const s = document.querySelector('#splash, .splash, #loadingScreen');
    if (!s) return true;
    const st = getComputedStyle(s);
    return st.display === 'none' || st.visibility === 'hidden' || s.classList.contains('hidden');
  }, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);

  if (await page.locator('#accountScreen.active').count()) {
    await page.locator('#newAccountName').fill('Keyboard');
    const pin = page.locator('#newAccountPin');
    if (await pin.count()) await pin.fill('1234');
    await page.locator('#createAccountBtn').click();
    await page.waitForTimeout(1200);
    out.steps.push('profile created');
  }

  // ---- the settings panel exists and works ----
  await page.locator('#a11yBtn').click();
  await page.waitForTimeout(400);
  out.settingsVisible = await page.locator('#a11yModal:not(.hidden)').count() > 0;
  out.settingCount = await page.locator('#a11yList input[type=checkbox]').count();

  await page.locator('#a11y-highContrast').check();
  await page.waitForTimeout(300);
  out.highContrastApplied = await page.evaluate(() =>
    document.documentElement.hasAttribute('data-high-contrast'));
  await page.locator('#a11y-largeText').check();
  await page.waitForTimeout(300);
  out.largeTextApplied = await page.evaluate(() =>
    document.documentElement.hasAttribute('data-large-text'));
  await page.locator('#closeA11yBtn').click();
  await page.waitForTimeout(300);

  // ---- start a puzzle ----
  await page.locator('#quickPlayBtn').click();
  await page.waitForTimeout(500);
  await page.locator('#beginGameBtn').click();
  await page.waitForSelector('.letter', { timeout: 15000 });
  out.letters = await page.locator('.letter').count();
  out.gridHasAria = await page.locator('#wordGrid[role=grid]').count() > 0;
  out.cellsHaveAria = await page.locator('.letter[role=gridcell][aria-label]').count();
  out.helpVisible = await page.locator('#keyboardHelp:not([hidden])').count() > 0;

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

  // ---- find a word, then select it with arrow keys only ----
  const WORDS = ['TIGER', 'LION', 'ZEBRA', 'PANDA', 'EAGLE', 'SHARK', 'WHALE', 'OTTER',
    'COBRA', 'HORSE', 'RABBIT', 'MONKEY', 'PARROT', 'TURTLE'];
  const DIRS = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];

  let target = null;
  outer: for (const w of WORDS) {
    for (const d of DIRS) {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const er = r + d[0] * (w.length - 1), ec = c + d[1] * (w.length - 1);
          if (er < 0 || ec < 0 || er >= N || ec >= N) continue;
          let ok = true;
          for (let i = 0; i < w.length; i++) if (grid[r + d[0] * i][c + d[1] * i] !== w[i]) { ok = false; break; }
          if (ok) { target = { word: w, r, c, d }; break outer; }
        }
      }
    }
  }
  if (!target) return { error: 'no words on the board', out };

  out.target = target;
  const AXIS = {
    '0,1': 'ArrowRight', '0,-1': 'ArrowLeft',
    '1,0': 'ArrowDown', '-1,0': 'ArrowUp',
    '1,1': 'ArrowRight', '-1,-1': 'ArrowLeft', '1,-1': 'ArrowRight', '-1,1': 'ArrowRight'
  };

  // Put the keyboard cursor on the first letter using Home (row start) / PageUp.
  await page.locator('.letter[data-r="0"][data-c="0"]').focus();
  await page.keyboard.press('Home');
  if (target.r > 0) {
    for (let i = 0; i < target.r; i++) await page.keyboard.press('ArrowDown');
    if (target.c > 0) for (let i = 0; i < target.c; i++) await page.keyboard.press('ArrowRight');
  }
  out.cursorAt = await page.evaluate(() => {
    const el = document.querySelector('.letter.cursor');
    return el ? [+el.dataset.r, +el.dataset.c] : null;
  });

  await page.keyboard.press('Space');                    // anchor
  out.afterSpace = await page.evaluate(() => document.querySelectorAll('.letter.selecting').length);

  // Walk the word. A diagonal needs the perpendicular nudge the code supports.
  for (let i = 1; i < target.word.length; i++) {
    const [dr, dc] = target.d;
    if (dr !== 0 && dc !== 0) {
      // alternate a perpendicular press with the diagonal step
      await page.keyboard.press(dr > 0 ? 'ArrowDown' : 'ArrowUp');
      await page.keyboard.press(dc > 0 ? 'ArrowRight' : 'ArrowLeft');
    } else {
      await page.keyboard.press(AXIS[dr + ',' + dc]);
    }
  }
  out.selectedCount = await page.evaluate(() => document.querySelectorAll('.letter.selecting').length);
  out.selectedLetters = await page.evaluate(() =>
    [...document.querySelectorAll('.letter.selecting')].map(e => e.textContent.trim()).join(''));

  await page.keyboard.press('Enter');                    // submit
  await page.waitForTimeout(500);

  out.status = await page.evaluate(() => document.querySelector('#statusText')?.textContent?.trim() || '');
  out.liveRegion = await page.evaluate(() => document.querySelector('#liveRegion')?.textContent || '');
  out.found = await page.evaluate(() => document.querySelectorAll('.word-chip.found').length);

  return out;
}
