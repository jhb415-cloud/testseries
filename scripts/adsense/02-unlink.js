#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
 * adsense-prep v0.0.2 · 02-unlink.js
 *
 * 목적: 색인된 페이지에서 저품질 페이지군(/kkum/, /mbti/)으로 가는
 *       "크롤러가 따라갈 수 있는 링크"를 전부 끊는다.
 *
 * v0.0.2 변경 이유 (코덱스 반박서 반영):
 *   v0.0.1은 홈 + 테스트 61개 + 그 생성 소스만 처리했다. 실제 코드를 다시 훑은
 *   결과 세 곳이 더 있었다 — 전부 실행해서 확인된 것이며 추정이 아니다.
 *     1) /all/index.html 이 sitemap-main.xml에 포함된 색인 대상인데도
 *        kkum·mbti 카드 링크 2개 + 푸터 링크가 그대로 있었음
 *     2) app.js의 renderDreamSearch()(SPA 런타임 렌더 함수)가 /kkum/ 링크를
 *        DOM에 직접 삽입함 — 정적 grep으로는 안 잡히고 JS 렌더 후에만 존재
 *     3) generate-mbti-pages.js 자신이 만드는 /mbti/{code}/ 페이지 17개의
 *        푸터가 /kkum/ 링크를 갖고 있었음 (mbti가 index 대상이 아니게 됐어도
 *        위생상 제거)
 *   1)의 생성 소스는 scripts/generate-all-page.js — 여기도 함께 고친다.
 *
 * 왜 이게 01(noindex)보다 중요한가:
 *       noindex는 구글 "검색 색인"만 제어할 뿐, 애드센스 심사 크롤러
 *       (Mediapartners-Google)를 막는다는 공식 보장이 없다. 반면 링크를
 *       끊으면 어떤 크롤러든 애초에 그 경로로 갈 방법이 없어진다 —
 *       이게 실제로 확실한 유일한 조치다.
 *
 * 처리 대상:
 *   1) test-engine/scripts/generate-seo-content.js  ← 생성 소스
 *   2) test-engine/tests/{*}/index.html             ← 생성된 61개
 *   3) index.html                                    ← 본문 링크 + 푸터 링크
 *   4) scripts/generate-all-page.js                 ← [v0.0.2] /all/ 생성 소스
 *   5) all/index.html                                ← [v0.0.2] 생성된 결과물
 *   6) app.js                                        ← [v0.0.2] SPA 런타임 링크
 *   7) scripts/generate-mbti-pages.js                ← [v0.0.2] mbti 자체 푸터
 *
 * 되돌리기: node scripts/adsense/02-unlink.js --revert
 * 멱등성: 여러 번 실행해도 안전.
 * ───────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const REVERT = process.argv.includes('--revert');

/* 원본 문자열 ↔ 치환 문자열 쌍.
   --revert 시 방향만 뒤집어 그대로 복원한다. */
const RULES = [

  /* ── 1. 생성 스크립트: te-seo-links에서 꿈해몽 사전 li 제거 ────────── */
  {
    file: 'test-engine/scripts/generate-seo-content.js',
    from: "    html += '<li><a href=\"' + SITE_ORIGIN + '/kkum/\">꿈해몽 사전</a> — 174가지 꿈 풀이 전체 보기</li>\\n';\n",
    to: "    // [adsense-prep v0.0.1] 꿈해몽 사전 링크 제거 — 색인 거부된 174개로 크롤러가\n    // 흘러들어가는 유일한 경로였음. 애드센스 승인 후 복구 예정.\n",
  },
  {
    file: 'test-engine/scripts/generate-seo-content.js',
    from: "과몰입 연구소 홈</a> — MBTI·두뇌 나이·오늘의 운세·꿈해몽 등 전체 테스트 모음</li>",
    to: "과몰입 연구소 홈</a> — 심리테스트·MBTI·두뇌 인지 테스트 전체 모음</li>",
  },

  /* ── 3. 홈: 본문 안 /kkum/ 링크 (앵커 텍스트는 남기고 링크만 해제) ─── */
  {
    file: 'index.html',
    from: '전체 풀이는 <a href="/kkum/" class="text-indigo-300 font-semibold">꿈해몽 사전</a>에서 읽을 수 있어요.',
    to: '174가지 꿈 테마 전체를 사이트 안에서 바로 검색할 수 있어요.',
  },

  /* ── 3-a. 홈: 본문 안 /mbti/ 링크 (앵커 텍스트는 남기고 링크만 해제) ── */
  {
    file: 'index.html',
    from: '유형별 자세한 해설은 <a href="/mbti/" class="text-indigo-300 font-semibold">MBTI 16유형 사전</a>에서 읽을 수 있어요.',
    to: '유형별 자세한 해설은 결과 화면에서 바로 이어서 볼 수 있어요.',
  },

  /* ── 3-b. 홈: 푸터의 /kkum/, /mbti/ 링크 제거 ───────────────────── */
  {
    file: 'index.html',
    from: '          <a href="/kkum/" class="hover:text-slate-300 transition">꿈해몽 사전</a>\n          <a href="/mbti/" class="hover:text-slate-300 transition">MBTI 유형 사전</a>\n',
    to: '          <a href="/about/" class="hover:text-slate-300 transition">과몰입 연구소 소개</a>\n',
  },

  /* ── 4. /all/ 생성 소스: 카드 링크 2개 + 푸터 링크 [v0.0.2] ────────── */
  {
    file: 'scripts/generate-all-page.js',
    from: '      <a class="card" href="/mbti/"><div class="t">🧠 MBTI 16유형 사전</div><div class="s">16가지 유형별 성격 특징, 연애 스타일, 직장 생활, 궁합을 유형별 페이지로 정리했어요.</div></a>\n      <a class="card" href="/kkum/"><div class="t">🌙 꿈해몽 사전</div><div class="s">174가지 꿈 테마와 546가지 세부 풀이를 직접 집필해 담은 꿈 해몽 아카이브예요.</div></a>\n',
    to: '      <!-- [adsense-prep v0.0.2] MBTI 사전·꿈해몽 사전 카드 제거 — 색인 대상 /all/ 에서\n           비색인 저품질군으로 가는 크롤 경로였음. 승인 후 이 주석을 풀어 복구. -->\n',
  },
  {
    file: 'scripts/generate-all-page.js',
    from: '      <p><a href="/">홈</a> · <a href="/mbti/">MBTI 유형 사전</a> · <a href="/kkum/">꿈해몽 사전</a></p>',
    to: '      <p><a href="/">홈</a> · <a href="/about/">과몰입 연구소 소개</a></p>',
  },

  /* ── 5. /all/index.html 생성된 결과물: 소스와 동일 치환 [v0.0.2] ──── */
  {
    file: 'all/index.html',
    from: '      <a class="card" href="/mbti/"><div class="t">🧠 MBTI 16유형 사전</div><div class="s">16가지 유형별 성격 특징, 연애 스타일, 직장 생활, 궁합을 유형별 페이지로 정리했어요.</div></a>\n      <a class="card" href="/kkum/"><div class="t">🌙 꿈해몽 사전</div><div class="s">174가지 꿈 테마와 546가지 세부 풀이를 직접 집필해 담은 꿈 해몽 아카이브예요.</div></a>\n',
    to: '      <!-- [adsense-prep v0.0.2] MBTI 사전·꿈해몽 사전 카드 제거 — 색인 대상 /all/ 에서\n           비색인 저품질군으로 가는 크롤 경로였음. 승인 후 이 주석을 풀어 복구. -->\n',
  },
  {
    file: 'all/index.html',
    from: '      <p><a href="/">홈</a> · <a href="/mbti/">MBTI 유형 사전</a> · <a href="/kkum/">꿈해몽 사전</a></p>',
    to: '      <p><a href="/">홈</a> · <a href="/about/">과몰입 연구소 소개</a></p>',
  },

  /* ── 6. app.js: SPA 런타임 렌더 링크 (정적 grep으로 안 잡히던 경로) [v0.0.2] ── */
  {
    file: 'app.js',
    from: '      <div class="text-center mt-6">\n        <a href="/kkum/" class="inline-block bg-violet-800/50 hover:bg-violet-700/70 border border-violet-600 text-violet-300 font-bold px-6 py-3 rounded-xl transition">📖 꿈해몽 전체 목록 보기</a>\n      </div>\n',
    to: '      <!-- [adsense-prep v0.0.2] 꿈해몽 전체 목록 링크 제거 (renderDreamSearch 내부).\n           검색 기능(dreamSearch/dreamSearchBy)은 그대로 동작 — 진입 링크만 제거. -->\n',
  },

  /* ── 7. mbti 생성 소스: 자기 자신의 상세 페이지 17개 푸터 kkum 링크 [v0.0.2] ── */
  {
    file: 'scripts/generate-mbti-pages.js',
    from: '      <p><a href="/">홈</a> · <a href="/#mbti">MBTI 테스트 하러 가기</a> · <a href="/kkum/">꿈해몽 사전</a></p>',
    to: '      <p><a href="/">홈</a> · <a href="/#mbti">MBTI 테스트 하러 가기</a></p>',
  },
];

/** 이미 생성된 61개 테스트 페이지에서 kkum li 한 줄을 제거 */
const TEST_LI_RE =
  /\n?<li><a href="https:\/\/gwamol-lab\.xyz\/kkum\/">꿈해몽 사전<\/a> — 174가지 꿈 풀이 전체 보기<\/li>/g;
const TEST_LI_TEXT =
  '\n<li><a href="https://gwamol-lab.xyz/kkum/">꿈해몽 사전</a> — 174가지 꿈 풀이 전체 보기</li>';
const TEST_HOME_FROM =
  '과몰입 연구소 홈</a> — MBTI·두뇌 나이·오늘의 운세·꿈해몽 등 전체 테스트 모음</li>';
const TEST_HOME_TO =
  '과몰입 연구소 홈</a> — 심리테스트·MBTI·두뇌 인지 테스트 전체 모음</li>';

function applyRules() {
  let n = 0;
  for (const r of RULES) {
    const file = path.join(ROOT, r.file);
    if (!fs.existsSync(file)) {
      console.warn('  ! 없음:', r.file);
      continue;
    }
    let s = fs.readFileSync(file, 'utf8');
    const from = REVERT ? r.to : r.from;
    const to = REVERT ? r.from : r.to;
    if (!s.includes(from)) continue; // 이미 처리됨
    s = s.split(from).join(to);
    fs.writeFileSync(file, s);
    n++;
    console.log('  ✓', r.file);
  }
  return n;
}

function applyTestPages() {
  const dir = path.join(ROOT, 'test-engine', 'tests');
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const folder of fs.readdirSync(dir)) {
    const file = path.join(dir, folder, 'index.html');
    if (!fs.existsSync(file)) continue;
    let s = fs.readFileSync(file, 'utf8');
    const before = s;

    if (REVERT) {
      s = s.split(TEST_HOME_TO).join(TEST_HOME_FROM);
      // 홈 링크 li 뒤에 꿈해몽 li를 되돌려 붙인다
      if (!s.includes('/kkum/')) {
        s = s.replace(TEST_HOME_FROM, TEST_HOME_FROM + TEST_LI_TEXT);
      }
    } else {
      s = s.replace(TEST_LI_RE, '');
      s = s.split(TEST_HOME_FROM).join(TEST_HOME_TO);
    }

    if (s !== before) {
      fs.writeFileSync(file, s);
      n++;
    }
  }
  console.log(`  ✓ test-engine/tests/*/index.html — ${n}개 ${REVERT ? '복원' : '수정'}`);
  return n;
}

function verify() {
  const dir = path.join(ROOT, 'test-engine', 'tests');
  let left = 0;
  for (const folder of fs.readdirSync(dir)) {
    const f = path.join(dir, folder, 'index.html');
    if (fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes('/kkum/')) left++;
  }
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const homeLinks = (home.match(/href="\/kkum\/"/g) || []).length +
                    (home.match(/href="\/mbti\/"/g) || []).length;

  /* [v0.0.2] /all/, app.js도 같은 기준으로 확인 — 이 세 곳이 색인 대상이면서
     동시에 크롤 경로 검증에서 빠져있던 지점이었다. */
  const allPath = path.join(ROOT, 'all', 'index.html');
  const allLinks = fs.existsSync(allPath)
    ? ((fs.readFileSync(allPath, 'utf8').match(/href="\/kkum\/"/g) || []).length +
       (fs.readFileSync(allPath, 'utf8').match(/href="\/mbti\/"/g) || []).length)
    : 0;
  const appJsPath = path.join(ROOT, 'app.js');
  const appJsLinks = fs.existsSync(appJsPath)
    ? (fs.readFileSync(appJsPath, 'utf8').match(/href="\/kkum\/"/g) || []).length
    : 0;

  console.log(`\n  [검증] 테스트 페이지 잔여 /kkum/ 링크: ${left}개`);
  console.log(`  [검증] 홈 잔여 /kkum/ · /mbti/ 링크: ${homeLinks}개`);
  console.log(`  [검증] /all/ 잔여 /kkum/ · /mbti/ 링크: ${allLinks}개 [v0.0.2]`);
  console.log(`  [검증] app.js 잔여 /kkum/ 링크: ${appJsLinks}개 [v0.0.2]`);
  return left === 0 && homeLinks === 0 && allLinks === 0 && appJsLinks === 0;
}

console.log(`[02-unlink] ${REVERT ? '복원' : '적용'} 시작`);
applyRules();
applyTestPages();
const ok = verify();
console.log(`\n[02-unlink] 완료 — ${REVERT ? '복원됨' : ok ? '링크 0개 확인 ✅' : '⚠ 잔여 링크 있음, 수동 확인 필요'}`);
if (!REVERT) console.log('  → 다음: node scripts/adsense/03-lotto.js');
