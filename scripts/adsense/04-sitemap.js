#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
 * adsense-prep v0.0.1 · 04-sitemap.js
 *
 * 목적: 사이트맵과 robots.txt를 "색인 통과한 페이지 + 신뢰 페이지"만으로 재구성.
 *
 * 처리:
 *   1) sitemap-main.xml 재생성
 *      - test-engine/tests/* 중 config.json 이 있고 private 이 아닌 전부
 *        (private:true 2개는 운영자가 알코올 소재로 의도 제외한 것 — 그대로 유지)
 * *      - 홈 / all / about / privacy / terms / contact 포함
 *   2) robots.txt에서 sitemap-kkum.xml, sitemap-mbti.xml 참조 제거
 *      (파일 자체는 남겨둠 — 승인 후 되돌리기 위해)
 *
 * 되돌리기: node scripts/adsense/04-sitemap.js --revert
 * ───────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const REVERT = process.argv.includes('--revert');
const ORIGIN = 'https://gwamol-lab.xyz';

/* 제외 대상은 config.json 의 private:true 로만 판정한다.
   현재 private:true 는 13-drunk-mbti, 51-mbti-drinking-party-character 2개이며
   운영자가 알코올 소재라 의도적으로 내린 것 — 이 스크립트는 그 결정을 그대로 존중한다.
   별도 하드코딩 제외 목록을 두지 않는 이유: 제외 기준이 config 와 스크립트 두 군데로
   갈리면 나중에 반드시 어긋난다. 단일 진실 공급원은 config.json. */

/* 사이트맵에 항상 포함할 고정 경로 */
const STATIC = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/all/', changefreq: 'weekly', priority: '0.9' },
  { loc: '/about/', changefreq: 'monthly', priority: '0.8' },
  { loc: '/privacy/', changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms/', changefreq: 'yearly', priority: '0.3' },
  { loc: '/contact/', changefreq: 'yearly', priority: '0.3' },
];

function buildSitemap() {
  const testsDir = path.join(ROOT, 'test-engine', 'tests');
  const folders = fs.readdirSync(testsDir).filter((f) => {
    const cfgPath = path.join(testsDir, f, 'config.json');
    const htmlPath = path.join(testsDir, f, 'index.html');
    if (!fs.existsSync(cfgPath) || !fs.existsSync(htmlPath)) return false;
    let cfg;
    try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch { return false; }
    if (cfg.private) return false;
    return true;
  }).sort();

  const urls = [];
  for (const s of STATIC) {
    urls.push({ loc: ORIGIN + s.loc, changefreq: s.changefreq, priority: s.priority });
  }
  for (const f of folders) {
    urls.push({
      loc: `${ORIGIN}/test-engine/tests/${f}/`,
      changefreq: 'monthly',
      priority: '0.7',
    });
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) =>
      '  <url>\n' +
      `    <loc>${u.loc}</loc>\n` +
      `    <changefreq>${u.changefreq}</changefreq>\n` +
      `    <priority>${u.priority}</priority>\n` +
      '  </url>'
    ).join('\n') +
    '\n</urlset>\n';

  fs.writeFileSync(path.join(ROOT, 'sitemap-main.xml'), xml);
  console.log(`  ✓ sitemap-main.xml 재생성 — 총 ${urls.length} URL`);
  console.log(`    · 고정 페이지 ${STATIC.length}개`);
  console.log(`    · 테스트 ${folders.length}개 (config private:true 제외 후)`);
  return urls.length;
}

function patchRobots() {
  const file = path.join(ROOT, 'robots.txt');
  let s = fs.readFileSync(file, 'utf8');
  const kkum = `Sitemap: ${ORIGIN}/sitemap-kkum.xml\n`;
  const mbti = `Sitemap: ${ORIGIN}/sitemap-mbti.xml\n`;

  if (REVERT) {
    if (!s.includes(kkum)) s = s.replace(`Sitemap: ${ORIGIN}/sitemap-main.xml\n`, `Sitemap: ${ORIGIN}/sitemap-main.xml\n${kkum}${mbti}`);
    console.log('  ✓ robots.txt 복원');
  } else {
    s = s.split(kkum).join('').split(mbti).join('');
    console.log('  ✓ robots.txt — sitemap-kkum / sitemap-mbti 참조 제거');
  }
  fs.writeFileSync(file, s);
}

console.log(`[04-sitemap] ${REVERT ? '복원' : '적용'} 시작`);
if (!REVERT) buildSitemap();
patchRobots();
console.log(`\n[04-sitemap] 완료`);
if (!REVERT) {
  console.log('  ⚠ 배포 후 GSC에서 sitemap-kkum.xml / sitemap-mbti.xml 을 "삭제" 처리할 것');
  console.log('  ⚠ 그 다음 sitemap-main.xml 재제출');
}
