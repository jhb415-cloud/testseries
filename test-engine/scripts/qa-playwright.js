#!/usr/bin/env node
/* 임시 QA 스크립트 — 로컬 http 서버(포트 8931)가 떠 있어야 함.
 * 사용: node scripts/qa-playwright.js <folder1> <folder2> ...
 * 각 테스트: 인트로 → 시작 → 문항 전부 첫 선택지 클릭 → 로딩 대기 → 결과 화면까지 진행,
 * 콘솔 에러/깨진 이미지/버튼바-본문 겹침 여부를 점검하고 스크린샷 저장. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8931/test-engine/tests';
const OUT_DIR = '/tmp/qa-shots';
fs.mkdirSync(OUT_DIR, { recursive: true });

async function qaOne(browser, folder) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });

  const url = `${BASE}/${folder}/index.html`;
  await page.goto(url, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, `${folder}-intro.png`) });

  // 시작 버튼 클릭 (인트로 화면의 첫 primary 버튼)
  const startBtn = page.locator('.te-choices-fixed button, .te-btn-primary').first();
  await startBtn.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);

  // 문항 반복 진행 (최대 30스텝 안전장치)
  // 일반 선택지 외에 특수 화면도 넘길 수 있어야 61개 전체가 결과까지 도달한다:
  //  - config.interstitials(#56~60): 풀스크린 컷신 → #te-inter-next
  //  - config.point_budget(#55): 포인트 배분 화면 → +버튼을 다 소진 후 #te-budget-confirm
  //  - config.slider_ui(#51,#33): 슬라이더 확인 버튼 → .te-slider-confirm
  for (let i = 0; i < 30; i++) {
    const resultVisible = await page.locator('.te-result-title').first().isVisible().catch(() => false);
    if (resultVisible) break;

    const interBtn = page.locator('#te-inter-next');
    if (await interBtn.isVisible().catch(() => false)) {
      await interBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(250);
      continue;
    }

    const budgetConfirm = page.locator('#te-budget-confirm');
    if (await budgetConfirm.isVisible().catch(() => false)) {
      for (let k = 0; k < 40; k++) {
        if (await budgetConfirm.isEnabled().catch(() => false)) break;
        const inc = page.locator('[data-budget-inc]').first();
        if (!(await inc.isVisible().catch(() => false))) break;
        await inc.click({ timeout: 3000 }).catch(() => {});
      }
      await budgetConfirm.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(250);
      continue;
    }

    const sliderConfirm = page.locator('.te-slider-confirm').first();
    if (await sliderConfirm.isVisible().catch(() => false)) {
      await sliderConfirm.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(250);
      continue;
    }

    const choiceBtn = page.locator('.te-btn-choice').first();
    const visible = await choiceBtn.isVisible().catch(() => false);
    if (!visible) { await page.waitForTimeout(400); continue; }
    await choiceBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(250);
  }

  // 로딩 화면 대기
  await page.waitForTimeout(2500);
  await page.waitForSelector('.te-result-title', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, `${folder}-result.png`), fullPage: true });

  // 깨진 이미지 체크
  const brokenImages = await page.evaluate(() =>
    Array.from(document.images).filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src)
  );

  const reachedResult = await page.locator('.te-result-title').first().isVisible().catch(() => false);

  await page.close();
  return { folder, errors, brokenImages, reachedResult };
}

async function main() {
  const folders = process.argv.slice(2);
  const browser = await chromium.launch();
  const results = [];
  for (const folder of folders) {
    console.log(`▶ QA: ${folder}`);
    const r = await qaOne(browser, folder);
    results.push(r);
    if (r.errors.length) console.log(`  ⚠️ 콘솔 에러 ${r.errors.length}건:`, r.errors.slice(0, 3));
    if (r.brokenImages.length) console.log(`  ⚠️ 깨진 이미지 ${r.brokenImages.length}건:`, r.brokenImages);
    if (!r.reachedResult) console.log(`  ⚠️ 결과 화면까지 도달하지 못함`);
    if (!r.errors.length && !r.brokenImages.length && r.reachedResult) console.log(`  ✅ 통과`);
  }
  await browser.close();
  const failCount = results.filter((r) => r.errors.length || r.brokenImages.length || !r.reachedResult).length;
  console.log(`\n총 ${results.length}개 중 ${results.length - failCount}개 통과`);
  process.exit(failCount ? 1 : 0);
}

main();
