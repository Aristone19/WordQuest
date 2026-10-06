// Creates a profile in the browser and confirms it is written to storage.
// Used to verify the save format the desktop bridge has to carry.
export default async function run(page, ui) {
  const out = {};

  await page.waitForFunction(() => {
    const s = document.querySelector('#splash, .splash, #loadingScreen');
    if (!s) return true;
    const st = getComputedStyle(s);
    return st.display === 'none' || st.visibility === 'hidden' || s.classList.contains('hidden');
  }, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);

  out.accountScreen = await page.locator('#accountScreen.active').count();

  const pinField = page.locator('#newAccountPin, #newAccountPinInput');
  out.pinRequired = await pinField.count();

  await page.locator('#newAccountName').fill('Tester');
  if (out.pinRequired) await pinField.fill('1234');

  const createBtn = page.locator('#createAccountBtn');
  out.createEnabled = await createBtn.isEnabled().catch(() => null);
  await createBtn.click();
  await page.waitForTimeout(1500);

  out.afterCreate = await page.evaluate(() => ({
    activeScreen: [...document.querySelectorAll('.screen')]
      .filter(s => s.classList.contains('active')).map(s => s.id),
    saved: localStorage.getItem('wordQuestSave')
  }));

  if (out.afterCreate.saved) {
    const parsed = JSON.parse(out.afterCreate.saved);
    out.savedSize = out.afterCreate.saved.length;
    out.version = parsed.version;
    out.accountCount = Object.keys(parsed.accounts || {}).length;
    out.activeName = parsed.accounts?.[parsed.active]?.name;
    out.hasProgress = !!parsed.accounts?.[parsed.active]?.save;
  }

  return out;
}
