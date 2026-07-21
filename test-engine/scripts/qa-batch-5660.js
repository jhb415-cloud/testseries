#!/usr/bin/env node
/* 임시 QA — 56/57/58/59/60 신규 메커니즘(분기+success_meter/cart_ui/interstitials/feed_ui+viral_meter/
 * quit_meter+timer_sec) 검증. 로컬 http 서버(포트 8931)가 떠 있어야 함.
 * node test-engine/scripts/qa-batch-5660.js */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:8931/test-engine/tests';
const OUT_DIR = '/tmp/qa-shots-5660';
fs.mkdirSync(OUT_DIR, { recursive: true });

async function clickThroughInterstitials(page) {
  const btn = page.locator('#te-inter-next');
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    return true;
  }
  return false;
}

async function qaOne(browser, folder, opts) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(`${BASE}/${folder}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#te-start-btn', { timeout: 8000 });
  if (opts.introInput) {
    const sel = page.locator('#te-intro-input');
    if (await sel.count()) await sel.selectOption({ index: 1 });
  }
  await page.screenshot({ path: `${OUT_DIR}/${folder}-intro.png` });
  await page.click('#te-start-btn');

  let interCount = 0;
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(250);
    if (await page.locator('.te-result-title').first().isVisible().catch(() => false)) break;
    if (await clickThroughInterstitials(page)) { interCount++; continue; }
    if (opts.timeoutOnce && i === opts.timeoutOnce.step && !opts.timeoutOnce.done) {
      opts.timeoutOnce.done = true;
      await page.waitForTimeout((opts.timeoutOnce.sec || 7) * 1000 + 500);
      continue;
    }
    const count = await page.locator('[data-choice-index]').count();
    if (count === 0) continue;
    if (i === 1) await page.screenshot({ path: `${OUT_DIR}/${folder}-mid.png` });
    await page.locator('[data-choice-index]').first().click();
  }

  await page.waitForSelector('.te-result-title', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT_DIR}/${folder}-result.png`, fullPage: true });

  const brokenImages = await page.evaluate(() =>
    Array.from(document.images).filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src)
  );
  const resultTitle = await page.locator('.te-result-title').first().textContent().catch(() => null);
  const resultStats = await page.locator('.te-result-stat').allTextContents().catch(() => []);
  const hasPlaceholder = await page.evaluate(() => /\{[a-zA-Z]+\}/.test(document.body.innerText));

  await page.close();
  return { folder, errors, brokenImages, resultTitle, resultStats, interCount, hasPlaceholder };
}

async function main() {
  const jobs = [
    ['56-mbti-cyberpunk-world', {}],
    ['57-mbti-convenience-store-food', {}],
    ['58-mbti-past-future-life', { introInput: true }],
    ['59-mbti-meme-character', {}],
    ['60-mbti-office-resignation', { timeoutOnce: { step: 2, sec: 7 } }],
  ];
  const browser = await chromium.launch();
  const results = [];
  for (const [folder, opts] of jobs) {
    console.log(`\n=== ${folder} ===`);
    const r = await qaOne(browser, folder, opts);
    results.push(r);
    console.log('title:', r.resultTitle);
    console.log('stats:', r.resultStats);
    console.log('interstitials shown:', r.interCount);
    console.log('errors:', r.errors);
    console.log('brokenImages:', r.brokenImages);
    console.log('hasPlaceholder(should be false):', r.hasPlaceholder);
  }
  await browser.close();
  fs.writeFileSync(`${OUT_DIR}/summary.json`, JSON.stringify(results, null, 2));
  console.log('\nDone. Screenshots in', OUT_DIR);
}

main();
