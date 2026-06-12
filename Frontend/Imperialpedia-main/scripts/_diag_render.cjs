// One-off diagnostic: load the live page in a headless browser and report
// everything the user's browser would experience. Safe to delete afterwards.
const { chromium } = require('@playwright/test');

(async () => {
  const url = process.env.DIAG_URL || 'http://localhost:3029/';
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', async (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (text.includes('same key')) {
      // Resolve %s args so we see the actual offending key value + stack.
      try {
        const args = await Promise.all(msg.args().map((a) => a.jsonValue().catch(() => '?')));
        args.forEach((a, idx) => {
          const s = typeof a === 'string' ? a : JSON.stringify(a);
          consoleErrors.push(`DUPKEY[arg${idx}]=` + String(s).replace(/\n/g, ' ⏎ '));
        });
      } catch {
        consoleErrors.push(text);
      }
      return;
    }
    consoleErrors.push(text);
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) => {
    failedRequests.push(`${req.failure()?.errorText || 'FAIL'}  ${req.url()}`);
  });

  const waitUntil = process.env.WAIT_UNTIL || 'networkidle';
  const settle = Number(process.env.SETTLE_MS || 2500);
  let status = 'n/a';
  try {
    const resp = await page.goto(url, { waitUntil, timeout: 60000 });
    status = resp ? resp.status() : 'no-response';
  } catch (e) {
    console.log('NAV_ERROR:', e.message);
  }

  // Give client JS a beat to hydrate / crash.
  await page.waitForTimeout(settle);

  const title = await page.title().catch(() => '(no title)');
  const bodyText = (await page.evaluate(() => document.body?.innerText || '').catch(() => '')).trim();
  const visibleLen = bodyText.length;
  const h1 = await page.evaluate(() => {
    const el = document.querySelector('h1');
    return el ? el.innerText : '(no h1)';
  }).catch(() => '(eval failed)');

  await page.screenshot({ path: 'scripts/_diag_shot.png', fullPage: false }).catch(() => {});

  console.log('=== RENDER DIAGNOSTIC ===');
  console.log('URL          :', url);
  console.log('HTTP status  :', status);
  console.log('Title        :', title);
  console.log('First <h1>   :', h1);
  console.log('Visible text :', visibleLen, 'chars');
  console.log('Body preview :', bodyText.slice(0, 300).replace(/\n+/g, ' | '));
  console.log('--- pageerrors (' + pageErrors.length + ') ---');
  pageErrors.slice(0, 15).forEach((e) => console.log('  PAGEERR:', e));
  console.log('--- console.error (' + consoleErrors.length + ') ---');
  consoleErrors.slice(0, 20).forEach((e) => console.log('  CONSOLE:', e.slice(0, 240)));
  console.log('--- failed requests (' + failedRequests.length + ') ---');
  failedRequests.slice(0, 25).forEach((e) => console.log('  REQFAIL:', e));

  await browser.close();
})();
