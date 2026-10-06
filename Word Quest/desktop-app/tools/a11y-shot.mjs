// Opens the accessibility panel and captures it, so the layout can be checked.
export default async function run(page, ui) {
  await page.waitForFunction(() => {
    const s = document.querySelector('#splash, .splash, #loadingScreen');
    if (!s) return true;
    const st = getComputedStyle(s);
    return st.display === 'none' || st.visibility === 'hidden' || s.classList.contains('hidden');
  }, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(400);

  if (await page.locator('#accountScreen.active').count()) {
    await page.locator('#newAccountName').fill('Look');
    const pin = page.locator('#newAccountPin');
    if (await pin.count()) await pin.fill('1234');
    await page.locator('#createAccountBtn').click();
    await page.waitForTimeout(1000);
  }

  await page.locator('#a11yBtn').click();
  await page.waitForTimeout(500);
  if (process.env.A11Y_NO_CONTRAST) {
    return { note: 'high contrast left off', cardBg: await page.evaluate(() => ({
      card: getComputedStyle(document.querySelector('#a11yModal .modal-card')).backgroundColor,
      backdrop: getComputedStyle(document.querySelector('#a11yModal')).backgroundColor
    })) };
  }

  // Turn everything on so the screenshot shows the styling, not the defaults.
  for (const id of ['#a11y-largeText', '#a11y-colorBlindMode']) {
    await page.locator(id).check();
    await page.waitForTimeout(150);
  }

  return {
    visible: await page.locator('#a11yModal:not(.hidden)').count() > 0,
    switches: await page.locator('#a11yList .a11y-row').count(),
    contrast: await page.evaluate(() => document.documentElement.hasAttribute('data-high-contrast')),
    cardBg: await page.evaluate(() => {
      const c = document.querySelector('#a11yModal .modal-card');
      const m = document.querySelector('#a11yModal');
      return {
        card: getComputedStyle(c).backgroundColor,
        backdrop: getComputedStyle(m).backgroundColor
      };
    }),
    largeText: await page.evaluate(() => document.documentElement.hasAttribute('data-large-text')),
    colorblind: await page.evaluate(() => document.documentElement.hasAttribute('data-colorblind')),
    rootFontSize: await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)
  };
}
