#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
 * adsense-prep v0.0.1 · 01-deindex.js
 *
 * 목적: 구글이 이미 색인을 거부한 저품질 페이지군(kkum 174 + mbti 17)을
 *       색인 대상에서 제외한다. 삭제가 아니라 noindex — 사용자는 그대로 접근 가능.
 *
 * 배경: GSC 기준 kkum(183 URL) + mbti(17 URL) = 200개가 "발견됨 - 현재 색인이
 *       생성되지 않음"(197) + "크롤링됨 - 현재 색인이 생성되지 않음"(4) 으로
 *       사실상 전량 거부됨. 반면 sitemap-main(61)은 색인 62로 전량 통과.
 *       애드센스 품질 분류기가 도메인 평균을 계산할 때 이 200개가 62개를 압도한다.
 *
 * 되돌리기: node scripts/adsense/01-deindex.js --revert
 * 멱등성: 여러 번 실행해도 안전.
 * ───────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const REVERT = process.argv.includes('--revert');

// 마커로 감싸서 나중에 정확히 되돌릴 수 있게 한다.
const START = '<!-- adsense-prep:noindex:start -->';
const END = '<!-- adsense-prep:noindex:end -->';
const BLOCK =
  START + '\n' +
  '  <meta name="robots" content="noindex,follow">\n' +
  '  ' + END;

const TARGET_DIRS = ['kkum', 'mbti'];

/** 대상 디렉터리 아래의 모든 index.html 경로를 수집 */
function collect(dir) {
  const base = path.join(ROOT, dir);
  if (!fs.existsSync(base)) return [];
  const out = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name === 'index.html') out.push(p);
    }
  };
  walk(base);
  return out;
}

function apply(file) {
  let html = fs.readFileSync(file, 'utf8');
  const has = html.includes(START);

  if (REVERT) {
    if (!has) return false;
    html = html.replace(new RegExp(START + '[\\s\\S]*?' + END + '\\n?'), '');
    fs.writeFileSync(file, html);
    return true;
  }

  if (has) return false; // 이미 적용됨

  // <head> 바로 다음에 삽입 (charset/viewport보다 뒤여도 무방)
  const m = html.match(/<head[^>]*>/i);
  if (!m) {
    console.warn('  ! <head> 없음, 건너뜀:', path.relative(ROOT, file));
    return false;
  }
  const at = m.index + m[0].length;
  html = html.slice(0, at) + '\n  ' + BLOCK + html.slice(at);
  fs.writeFileSync(file, html);
  return true;
}

function main() {
  let total = 0;
  let changed = 0;
  for (const dir of TARGET_DIRS) {
    const files = collect(dir);
    let c = 0;
    for (const f of files) if (apply(f)) c++;
    total += files.length;
    changed += c;
    console.log(`  ${dir}/  대상 ${files.length}개 · ${REVERT ? '복원' : '적용'} ${c}개`);
  }
  console.log(`\n[01-deindex] ${REVERT ? '복원' : '적용'} 완료 — 전체 ${total} / 변경 ${changed}`);
  if (!REVERT) {
    console.log('  → 다음: node scripts/adsense/02-unlink.js');
  }
}

main();
