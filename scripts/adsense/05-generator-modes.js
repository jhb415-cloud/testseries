#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
 * adsense-prep v0.0.2 · 05-generator-modes.js
 *
 * 목적: kkum·mbti 생성기 2개에 "review/public 모드"를 심는다.
 *
 * 왜 필요한가 (코덱스 반박서 + 재검증으로 확정된 문제):
 *   generate-content-pages.js는 `const PUBLISH = true;` 하나로 noindex 여부와
 *   sitemap-kkum.xml 생성 여부를 같이 결정한다. 문제는:
 *     1) PUBLISH=false로만 바꾸면 새 HTML엔 noindex가 들어가지만,
 *        기존 sitemap-kkum.xml "파일 자체"는 건드리지 않는다 — 183개 URL이
 *        그대로 디스크에 남아 gwamol-lab.xyz/sitemap-kkum.xml 로 계속 열림.
 *     2) 이 상수 하나만 true로 되돌리면(예: 나중에 콘텐츠 추가하다 실수로)
 *        재실행 한 번으로 noindex 해제 + sitemap 재생성이 동시에 일어난다.
 *   generate-mbti-pages.js는 한술 더 떠서 이런 스위치 자체가 아예 없다.
 *   noindex 개념도, sitemap 조건부 생성도 없이 실행할 때마다 무조건
 *   17개 URL짜리 sitemap-mbti.xml을 새로 쓴다.
 *
 * 이 스크립트가 하는 일 (두 생성기 소스에 동일한 패턴을 심는다):
 *   - CLI 인자로 모드를 받는다: --mode=review(기본값) | --mode=public
 *   - public 모드는 --confirm-kkum-publish / --confirm-mbti-publish 를
 *     "같이" 줘야만 실제로 발동한다. 하나라도 없으면 review로 강제 전환하고
 *     경고를 찍는다 — 실수로 공개되는 걸 막는 안전장치.
 *   - review 모드: 모든 페이지에 noindex 삽입 + sitemap 파일을 "URL 0개"
 *     빈 사이트맵으로 즉시 덮어쓴다 (파일을 지우지 않는 이유는 아래 참고).
 *   - public 모드: 기존과 동일하게 noindex 없이 정식 sitemap 생성.
 *   - 생성 직후 review 모드라면 자체 검증을 돌려서, noindex나 sitemap 조건을
 *     하나라도 못 지키면 즉시 exit(1)로 실패한다. "됐겠지"로 넘어가지 않는다.
 *
 * 파일을 삭제하지 않고 "빈 사이트맵"으로 남기는 이유:
 *   파일이 아예 없으면 그 URL 요청 시 404가 뜬다. 예전에 이 sitemap 주소를
 *   어딘가(GSC 기록, 외부 SEO 도구 등)에 등록해둔 적이 있다면 404보다는
 *   "URL 0개"인 빈 sitemap이 더 안전하고 덜 혼란스럽다.
 *
 * 이 패치 이후 01-deindex.js와의 관계:
 *   01-deindex.js는 마커 주석으로 개별 HTML 파일에 noindex를 직접 삽입하는
 *   방식이었다. 이 스크립트 적용 후 생성기를 (기본값 review 모드로) 재실행하면
 *   kkum·mbti 파일이 통째로 새로 만들어지면서 01-deindex.js가 넣은 마커는
 *   사라지고 생성기 자체의 noindex로 대체된다 — 정상이며 의도된 동작이다.
 *   앞으로는 01-deindex.js를 따로 돌릴 필요가 없다. 이 스크립트가 그 역할을
 *   생성기 안으로 흡수했다.
 *
 * 사용법:
 *   node scripts/adsense/05-generator-modes.js          ← 생성기 소스에 모드 시스템 이식
 *   node scripts/adsense/05-generator-modes.js --revert  ← 이식 전 상태로 되돌림
 *
 * 이 스크립트 자체는 생성기를 "실행"하지 않는다. 소스만 고친다.
 * 실제로 review 모드를 적용하려면 이식 후 아래를 별도로 실행해야 한다.
 *   node scripts/generate-content-pages.js
 *   node scripts/generate-mbti-pages.js
 * ───────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const REVERT = process.argv.includes('--revert');

/* ═══════════════════════════════════════════════════════════════
 * 1) generate-content-pages.js 패치
 * ═══════════════════════════════════════════════════════════════ */

const CONTENT_FILE = 'scripts/generate-content-pages.js';

const CONTENT_MODE_BLOCK_OLD = `const PUBLISH = true;    // v0.5.9~ 정식 공개 확정(사용자 승인) — noindex 해제 + sitemap-kkum.xml 생성`;

const CONTENT_MODE_BLOCK_NEW = `// [adsense-prep v0.0.2] 발행 모드 — 기본값은 review(fail-safe).
// public 은 --mode=public 과 --confirm-kkum-publish 를 "동시에" 줘야만 발동한다.
// 하나라도 빠지면 review 로 강제 전환하고 경고를 찍는다 — PUBLISH 상수를 손으로
// 바꾸는 실수(과거 v0.5.9 방식)를 원천 차단하기 위함.
const _args = process.argv.slice(2);
const _modeArg = _args.find(a => a.startsWith('--mode='));
const _requestedMode = _modeArg ? _modeArg.split('=')[1] : 'review';
const _hasConfirm = _args.includes('--confirm-kkum-publish');
const MODE = (_requestedMode === 'public' && _hasConfirm) ? 'public' : 'review';
if (_requestedMode === 'public' && !_hasConfirm) {
  console.warn('[안전장치] --mode=public 이지만 --confirm-kkum-publish 가 없어 review 모드로 강제 전환합니다.');
}
const PUBLISH = MODE === 'public';`;

const CONTENT_SITEMAP_OLD = `if (PUBLISH) {
  const urlEntries = [];
  urlEntries.push(\`  <url><loc>\${ORIGIN}/kkum/</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\`);
  for (let p = 2; p <= totalPages; p++) {
    urlEntries.push(\`  <url><loc>\${ORIGIN}/kkum/page/\${p}/</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\`);
  }
  dreams.forEach(t => {
    urlEntries.push(\`  <url><loc>\${ORIGIN}/kkum/\${encodeURIComponent(t._slug)}/</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\`);
  });
  const sitemapXml = \`<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n\${urlEntries.join('\\n')}\\n</urlset>\\n\`;
  fs.writeFileSync(path.join(__dirname, '..', 'sitemap-kkum.xml'), sitemapXml);
  console.log(\`sitemap-kkum.xml 생성 완료 (\${urlEntries.length}개 URL)\`);
}`;

const CONTENT_SITEMAP_NEW = `if (PUBLISH) {
  const urlEntries = [];
  urlEntries.push(\`  <url><loc>\${ORIGIN}/kkum/</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\`);
  for (let p = 2; p <= totalPages; p++) {
    urlEntries.push(\`  <url><loc>\${ORIGIN}/kkum/page/\${p}/</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\`);
  }
  dreams.forEach(t => {
    urlEntries.push(\`  <url><loc>\${ORIGIN}/kkum/\${encodeURIComponent(t._slug)}/</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\`);
  });
  const sitemapXml = \`<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n\${urlEntries.join('\\n')}\\n</urlset>\\n\`;
  fs.writeFileSync(path.join(__dirname, '..', 'sitemap-kkum.xml'), sitemapXml);
  console.log(\`sitemap-kkum.xml 생성 완료 (\${urlEntries.length}개 URL)\`);
} else {
  // [adsense-prep v0.0.2] review 모드: 과거 public 실행으로 남아있을 수 있는
  // sitemap-kkum.xml을 URL 0개짜리 빈 사이트맵으로 즉시 교체한다.
  const emptySitemap = '<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n</urlset>\\n';
  fs.writeFileSync(path.join(__dirname, '..', 'sitemap-kkum.xml'), emptySitemap);
  console.log('[review 모드] sitemap-kkum.xml 을 빈 사이트맵으로 교체했습니다 (URL 0개).');
}

// [adsense-prep v0.0.2] 발행 후 검증 — review 모드인데 정책이 어긋나면 즉시 실패시킨다.
if (!PUBLISH) {
  const fails = [];
  const badPage = dreams.find(t => {
    const html = fs.readFileSync(path.join(outRoot, t._slug, 'index.html'), 'utf8');
    return !html.includes('<meta name="robots" content="noindex"/>');
  });
  if (badPage) fails.push('상세 페이지 중 noindex 누락: ' + badPage._slug);
  const sitemapCheck = fs.readFileSync(path.join(__dirname, '..', 'sitemap-kkum.xml'), 'utf8');
  if (sitemapCheck.includes('<loc>')) fails.push('sitemap-kkum.xml 에 URL이 남아있음');
  if (fails.length) {
    console.error('\\n[검증 실패 — review 모드 정책 위반]\\n- ' + fails.join('\\n- '));
    process.exit(1);
  }
  console.log('[검증 통과] review 모드 정책 정상 적용 (noindex 전수 확인 + sitemap 0 URL)');
}`;

/* ═══════════════════════════════════════════════════════════════
 * 2) generate-mbti-pages.js 패치 — 기존엔 모드 개념 자체가 없었음
 * ═══════════════════════════════════════════════════════════════ */

const MBTI_FILE = 'scripts/generate-mbti-pages.js';

const MBTI_ORIGIN_OLD = `const ORIGIN = 'https://gwamol-lab.xyz';`;

const MBTI_ORIGIN_NEW = `const ORIGIN = 'https://gwamol-lab.xyz';

// [adsense-prep v0.0.2] 발행 모드 신규 도입 — 이 파일엔 원래 이런 개념이 없어서
// 실행할 때마다 무조건 noindex 없이 sitemap-mbti.xml 을 새로 썼다. content-pages.js와
// 동일한 안전장치를 심는다. --confirm-mbti-publish 로 confirm 플래그 이름을 분리한
// 이유: kkum과 mbti를 한 명령으로 착각해 같이 공개해버리는 사고를 막기 위함.
const _args = process.argv.slice(2);
const _modeArg = _args.find(a => a.startsWith('--mode='));
const _requestedMode = _modeArg ? _modeArg.split('=')[1] : 'review';
const _hasConfirm = _args.includes('--confirm-mbti-publish');
const MODE = (_requestedMode === 'public' && _hasConfirm) ? 'public' : 'review';
if (_requestedMode === 'public' && !_hasConfirm) {
  console.warn('[안전장치] --mode=public 이지만 --confirm-mbti-publish 가 없어 review 모드로 강제 전환합니다.');
}
const PUBLISH = MODE === 'public';`;

const MBTI_PAGESHELL_OLD = `function pageShell({ title, description, canonicalPath, body }) {
  return \`<!doctype html>`;

const MBTI_PAGESHELL_NEW = `function pageShell({ title, description, canonicalPath, body }) {
  // [adsense-prep v0.0.2] review 모드일 때만 noindex 삽입
  const robots = PUBLISH ? '' : '\\n  <meta name="robots" content="noindex"/>';
  return \`<!doctype html>`;

const MBTI_HEAD_OLD = `  <style>\${STYLE}</style>
</head>
<body>`;

const MBTI_HEAD_NEW = `  <style>\${STYLE}</style>\${robots}
</head>
<body>`;

const MBTI_SITEMAP_OLD = `// ── sitemap-mbti.xml ──
const urls = ['/mbti/'].concat(CODES.map(c => \`/mbti/\${c.toLowerCase()}/\`));
const sitemap = \`<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n\` +
  urls.map(u => \`  <url>\\n    <loc>\${ORIGIN}\${u}</loc>\\n    <changefreq>monthly</changefreq>\\n    <priority>0.6</priority>\\n  </url>\`).join('\\n') +
  '\\n</urlset>\\n';
fs.writeFileSync(path.join(__dirname, '..', 'sitemap-mbti.xml'), sitemap);

console.log('생성 완료: /mbti/ 목록 1 + 상세 ' + CODES.length + ' + sitemap-mbti.xml (' + urls.length + ' URLs)');`;

const MBTI_SITEMAP_NEW = `// ── sitemap-mbti.xml ── [adsense-prep v0.0.2] PUBLISH 조건부로 변경
if (PUBLISH) {
  const urls = ['/mbti/'].concat(CODES.map(c => \`/mbti/\${c.toLowerCase()}/\`));
  const sitemap = \`<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n\` +
    urls.map(u => \`  <url>\\n    <loc>\${ORIGIN}\${u}</loc>\\n    <changefreq>monthly</changefreq>\\n    <priority>0.6</priority>\\n  </url>\`).join('\\n') +
    '\\n</urlset>\\n';
  fs.writeFileSync(path.join(__dirname, '..', 'sitemap-mbti.xml'), sitemap);
  console.log('생성 완료: /mbti/ 목록 1 + 상세 ' + CODES.length + ' + sitemap-mbti.xml (' + urls.length + ' URLs)');
} else {
  const emptySitemap = '<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n</urlset>\\n';
  fs.writeFileSync(path.join(__dirname, '..', 'sitemap-mbti.xml'), emptySitemap);
  console.log('[review 모드] sitemap-mbti.xml 을 빈 사이트맵으로 교체했습니다 (URL 0개).');
}

// [adsense-prep v0.0.2] 발행 후 검증
if (!PUBLISH) {
  const fails = [];
  const badCode = CODES.find(c => {
    const html = fs.readFileSync(path.join(outRoot, c.toLowerCase(), 'index.html'), 'utf8');
    return !html.includes('<meta name="robots" content="noindex"/>');
  });
  if (badCode) fails.push('상세 페이지 중 noindex 누락: ' + badCode);
  const listHtml = fs.readFileSync(path.join(outRoot, 'index.html'), 'utf8');
  if (!listHtml.includes('<meta name="robots" content="noindex"/>')) fails.push('/mbti/ 목록 페이지 noindex 누락');
  const sitemapCheck = fs.readFileSync(path.join(__dirname, '..', 'sitemap-mbti.xml'), 'utf8');
  if (sitemapCheck.includes('<loc>')) fails.push('sitemap-mbti.xml 에 URL이 남아있음');
  if (fails.length) {
    console.error('\\n[검증 실패 — review 모드 정책 위반]\\n- ' + fails.join('\\n- '));
    process.exit(1);
  }
  console.log('[검증 통과] review 모드 정책 정상 적용 (noindex 전수 확인 + sitemap 0 URL)');
}`;

/* ═══════════════════════════════════════════════════════════════
 * 적용 로직
 * ═══════════════════════════════════════════════════════════════ */

const PATCHES = [
  {
    file: CONTENT_FILE,
    from: CONTENT_MODE_BLOCK_OLD,
    to: CONTENT_MODE_BLOCK_NEW,
    marker: '// [adsense-prep v0.0.2] 발행 모드 — 기본값은 review(fail-safe).',
    label: 'content-pages: 모드 시스템 도입',
  },
  {
    file: CONTENT_FILE,
    from: CONTENT_SITEMAP_OLD,
    to: CONTENT_SITEMAP_NEW,
    marker: '// [adsense-prep v0.0.2] 발행 후 검증 — review 모드인데 정책이 어긋나면 즉시 실패시킨다.',
    label: 'content-pages: sitemap 조건부 + 검증',
  },
  {
    file: MBTI_FILE,
    from: MBTI_ORIGIN_OLD,
    to: MBTI_ORIGIN_NEW,
    marker: '// [adsense-prep v0.0.2] 발행 모드 신규 도입 — 이 파일엔 원래 이런 개념이 없어서',
    label: 'mbti-pages: 모드 시스템 신규 도입',
  },
  {
    file: MBTI_FILE,
    from: MBTI_PAGESHELL_OLD,
    to: MBTI_PAGESHELL_NEW,
    marker: '// [adsense-prep v0.0.2] review 모드일 때만 noindex 삽입',
    label: 'mbti-pages: pageShell에 robots 변수 추가',
  },
  {
    file: MBTI_FILE,
    from: MBTI_HEAD_OLD,
    to: MBTI_HEAD_NEW,
    marker: '  <style>${STYLE}</style>${robots}',
    label: 'mbti-pages: <head> 에 robots 슬롯 삽입',
  },
  {
    file: MBTI_FILE,
    from: MBTI_SITEMAP_OLD,
    to: MBTI_SITEMAP_NEW,
    marker: '// ── sitemap-mbti.xml ── [adsense-prep v0.0.2] PUBLISH 조건부로 변경',
    label: 'mbti-pages: sitemap 조건부 + 검증',
  },
];

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

let applied = 0;
let failed = 0;
for (const p of PATCHES) {
  const filePath = path.join(ROOT, p.file);
  if (!fs.existsSync(filePath)) {
    console.error('  ! 파일 없음:', p.file);
    failed++;
    continue;
  }
  let s = fs.readFileSync(filePath, 'utf8');

  if (!REVERT && s.includes(p.marker)) {
    if (!s.includes(p.to)) {
      console.error('  ! 적용 마커는 있으나 패치 블록이 불완전함:', p.label);
      failed++;
      continue;
    }
    console.log('  · 건너뜀(이미 처리):', p.label);
    continue;
  }

  if (REVERT && !s.includes(p.marker)) {
    console.log('  · 건너뜀(이미 복원):', p.label);
    continue;
  }

  const from = REVERT ? p.to : p.from;
  const to = REVERT ? p.from : p.to;
  const matches = countOccurrences(s, from);
  if (matches !== 1) {
    console.error(`  ! 치환 대상이 정확히 1개가 아님(${matches}개):`, p.label);
    failed++;
    continue;
  }
  s = s.replace(from, to);
  fs.writeFileSync(filePath, s);
  console.log('  ✓', p.label);
  applied++;
}

if (failed) {
  console.error(`\n[05-generator-modes] 실패 — ${failed}건의 패치 상태가 불완전합니다.`);
  process.exit(1);
}

console.log(`\n[05-generator-modes] ${REVERT ? '복원' : '이식'} 완료 — ${applied}건 반영`);
if (!REVERT) {
  console.log('\n  ⚠ 이 스크립트는 소스만 고쳤다. 실제로 review 모드를 적용하려면:');
  console.log('    node scripts/generate-content-pages.js');
  console.log('    node scripts/generate-mbti-pages.js');
  console.log('  (인자 없이 실행 = 기본값 review 모드. 두 명령 다 노란 경고 없이 "[검증 통과]"가 떠야 정상)');
}
