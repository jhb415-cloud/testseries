#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
 * adsense-prep v0.0.1 · 02-unlink.js
 *
 * 목적: 색인된 62개 페이지에서 저품질 페이지군(/kkum/, /mbti/)으로 가는
 *       "크롤러가 따라갈 수 있는 링크"를 전부 끊는다.
 *
 * 왜 이게 01보다 중요한가:
 *       애드센스 심사 크롤러는 sitemap.xml이 아니라 링크를 따라간다.
 *       현재 테스트 페이지 61개 중 61개(100%)가 /kkum/ 링크를 갖고 있어서,
 *       심사관이 어느 테스트를 열든 경로가 이렇게 된다:
 *         홈 → 테스트 → 꿈해몽 사전 → 746자짜리 174개
 *       sitemap만 손보면 이 경로가 그대로 살아있어 효과가 없다.
 *
 * 처리 대상:
 *   1) test-engine/scripts/generate-seo-content.js  ← 생성 소스 (근본)
 *   2) test-engine/tests/{*}/index.html             ← 이미 생성된 61개
 *   3) index.html                                    ← 본문 링크 + 푸터 링크
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
  console.log(`\n  [검증] 테스트 페이지 잔여 /kkum/ 링크: ${left}개`);
  console.log(`  [검증] 홈 잔여 /kkum/ · /mbti/ 링크: ${homeLinks}개`);
  return left === 0 && homeLinks === 0;
}

console.log(`[02-unlink] ${REVERT ? '복원' : '적용'} 시작`);
applyRules();
applyTestPages();
const ok = verify();
console.log(`\n[02-unlink] 완료 — ${REVERT ? '복원됨' : ok ? '링크 0개 확인 ✅' : '⚠ 잔여 링크 있음, 수동 확인 필요'}`);
if (!REVERT) console.log('  → 다음: node scripts/adsense/03-lotto.js');
