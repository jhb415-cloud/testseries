#!/usr/bin/env node
/* 임시 QA — 51/52/54/55 신규 메커니즘(슬라이더 재사용/image_choices/affinity_meter/point_budget) 검증.
 * 로컬 http 서버(포트 8931)가 떠 있어야 함. node test-engine/scripts/qa-batch-5157.js */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8931/test-engine/tests';
const OUT_DIR = '/tmp/qa-shots-5157';
fs.mkdirSync(OUT_DIR, { recursive: true });

async function playSlider(page) {
  // #51: intro -> start -> each question has .te-slider-confirm
  for (let i = 0; i < 10; i++) {
    const resultVisible = await page.locator('.te-result-title').first().isVisible().catch(() => false);
    if (resultVisible) break;
    const confirmBtn = page.locator('.te-slider-confirm').first();
    const visible = await confirmBtn.isVisible().catch(() => false);
    if (!visible) { await page.waitForTimeout(300); continue; }
    await confirmBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(250);
  }
}

async function playChoices(page) {
  for (let i = 0; i < 10; i++) {
    const resultVisible = await page.locator('.te-result-title').first().isVisible().catch(() => false);
    if (resultVisible) break;
    const choiceBtn = page.locator('.te-btn-choice').first();
    const visible = await choiceBtn.isVisible().catch(() => false);
    if (!visible) { await page.waitForTimeout(300); continue; }
    await choiceBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(250);
  }
}

async function playBudgetThenChoices(page) {
  // #55: intro -> start -> point_budget screen -> spend all points -> confirm -> questions
  await page.waitForTimeout(300);
  const incButtons = page.locator('[data-budget-inc]');
  for (let i = 0; i < 10; i++) {
    const remainingText = await page.locator('#te-budget-remaining').first().textContent().catch(() => null);
    if (remainingText === null) break;
    const remaining = parseInt(remainingText, 10);
    if (remaining <= 0) break;
    const count = await incButtons.count();
    await incButtons.nth(i % count).click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(100);
  }
  await page.locator('#te-budget-confirm').click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
  await playChoices(page);
}

async function qaOne(browser, folder, mode) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });

  const url = `${BASE}/${folder}/index.html`;
  await page.goto(url, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, `${folder}-intro.png`) });

  const startBtn = page.locator('.te-choices-fixed button, .te-btn-primary').first();
  await startBtn.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);

  if (mode === 'budget') {
    await page.screenshot({ path: path.join(OUT_DIR, `${folder}-budget.png`) });
    await playBudgetThenChoices(page);
  } else if (mode === 'slider') {
    await playSlider(page);
  } else {
    // mid-question screenshot for image_choices/affinity_meter to check the decoration UI
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, `${folder}-q1.png`) });
    await playChoices(page);
  }

  await page.waitForTimeout(2200);
  await page.waitForSelector('.te-result-title', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, `${folder}-result.png`), fullPage: true });

  const brokenImages = await page.evaluate(() =>
    Array.from(document.images).filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src)
  );
  const resultTitle = await page.locator('.te-result-title').first().textContent().catch(() => null);
  const resultStats = await page.locator('.te-result-stat').allTextContents().catch(() => []);
  const hasPlaceholder = await page.evaluate(() => document.body.innerText.includes('{') && /\{[a-zA-Z]+\}/.test(document.body.innerText));

  await page.close();
  return { folder, errors, brokenImages, resultTitle, resultStats, hasPlaceholder };
}

async function main() {
  const jobs = [
    ['51-mbti-drinking-party-character', 'slider'],
    ['52-mbti-pet-animal-type', 'choices'],
    ['54-mbti-webtoon-romance-lead', 'choices'],
    ['55-mbti-fantasy-weapon', 'budget'],
  ];
  const browser = await chromium.launch();
  const results = [];
  for (const [folder, mode] of jobs) {
    console.log(`\n=== ${folder} (${mode}) ===`);
    const r = await qaOne(browser, folder, mode);
    results.push(r);
    console.log('title:', r.resultTitle);
    console.log('stats:', r.resultStats);
    console.log('errors:', r.errors);
    console.log('brokenImages:', r.brokenImages);
    console.log('hasPlaceholder(should be false):', r.hasPlaceholder);
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(results, null, 2));
  console.log('\nDone. Screenshots in', OUT_DIR);
}

main();
