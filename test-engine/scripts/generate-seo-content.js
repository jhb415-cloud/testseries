#!/usr/bin/env node
/**
 * test-engine SEO 정적 콘텐츠 생성기 (v1.1.6, 애드센스 "가치가 별로 없는 콘텐츠" 거절 대응)
 *
 * 문제: test-engine의 각 index.html은 빈 <div id="test-engine-root">뿐이라
 *       크롤러(애드센스 심사봇/검색엔진)에겐 텍스트 8자짜리 빈 페이지로 보였음.
 * 해결: 각 테스트의 config.json에서 소개/문항 미리보기/결과 유형 해설을 뽑아
 *       root div "바깥"(뒤)에 정적 <section class="te-seo">로 삽입.
 *       - 엔진(engine.js)은 root의 innerHTML만 교체하므로 이 섹션은 JS 렌더링
 *         후에도 그대로 남음 → 구글봇이 JS를 실행해도 콘텐츠가 사라지지 않음(클로킹 아님).
 *       - 사용자에게도 인트로 화면(min-height:100vh) 아래로 스크롤하면 보이는
 *         정직한 소개 글 — 어떤 답이 어떤 결과로 이어지는지는 노출하지 않음.
 *
 * 실행: node test-engine/scripts/generate-seo-content.js
 * 멱등: <!-- te-seo:start --> ~ <!-- te-seo:end --> 마커 블록을 통째로 재생성.
 *       config.json 텍스트가 바뀌면 이 스크립트만 다시 돌리면 됨.
 */
const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.join(__dirname, '..', 'tests');
const SITE_ORIGIN = 'https://gwamol-lab.xyz';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 결과 텍스트의 런타임 플레이스홀더({tag}/{code}/{inner}/{ebar}...)를 정적 문맥에 맞게 정리
function cleanText(text, result) {
  if (text == null) return null;
  let t = String(text);
  if (result && result.code) t = t.replace(/\{code\}|\{outer\}/g, result.code);
  if (result && result.tagFallback) t = t.replace(/\{tag\}/g, result.tagFallback);
  t = t.replace(/\{claimed\}/g, '내가 고른 유형');
  // 제목에서 "/ 속 {inner}"처럼 미해결 플레이스홀더가 낀 구획은 통째로 제거
  t = t.replace(/\s*[/·]\s*[^/·{}]*\{[a-z]+\}[^/·{}]*/g, '');
  if (/\{[a-z]+\}/.test(t)) return null; // 그래도 남으면 이 문장은 정적 노출 생략
  return t.trim();
}

const SCORING_DESC = {
  sum: '문항마다 고른 답의 점수를 합산해, 총점 구간에 따라 결과 유형이 정해지는 방식이에요.',
  type: '문항마다 고른 답이 가리키는 유형을 집계해, 가장 많이 나온 유형이 결과로 나오는 방식이에요.',
  quiz: '정답이 있는 퀴즈 형식으로, 맞힌 개수에 따라 결과 등급이 정해져요.',
  mbti4: 'MBTI 4가지 축(E-I / S-N / T-F / J-P)을 문항 응답으로 각각 계산해, 16가지 유형 중 하나가 결과로 나와요.',
  mbti4_dual: '겉으로 보이는 모습과 속마음을 각각 MBTI 4축으로 계산해, 두 유형을 함께 보여주는 방식이에요.'
};

function buildSection(cfg, folder, siblings) {
  const qs = cfg.questions || [];
  const rs = cfg.results || [];
  const minutes = Math.max(1, Math.round(qs.length * 10 / 60));
  const tags = (cfg.hashtags || []).map(function (h) {
    return '<span class="te-seo-tag">' + esc(h.startsWith('#') ? h : '#' + h) + '</span>';
  }).join(' ');

  let html = '';
  html += '<section class="te-seo" lang="ko">\n<div class="te-seo-card">\n';
  html += '<h2>' + esc(cfg.title) + ' — 어떤 테스트인가요?</h2>\n';
  html += '<p>' + esc(cfg.description) + '</p>\n';
  html += '<p>' + esc(SCORING_DESC[cfg.scoring_type] || '') +
    ' 총 <strong>' + qs.length + '문항</strong>이고 약 <strong>' + minutes + '분</strong>이면 끝나요. ' +
    '결과는 <strong>' + rs.length + '가지 유형</strong> 중 하나로 나오고, 회원가입 없이 무료로 할 수 있어요. ' +
    '결과 화면에서는 전용 일러스트와 함께 카카오톡 공유·이미지 저장도 지원해요.</p>\n';
  if (tags) html += '<p class="te-seo-tags">' + tags + '</p>\n';

  // 문항 미리보기 (앞 3개만 — 전체 스포일러 방지 + 페이지 고유 텍스트 확보)
  const preview = qs.slice(0, 3).map(function (q) { return q.text; }).filter(Boolean);
  if (preview.length) {
    html += '<h3>이런 질문이 나와요</h3>\n<ul>\n';
    preview.forEach(function (t) { html += '<li>&ldquo;' + esc(t) + '&rdquo;</li>\n'; });
    html += '<li>&hellip; 외 ' + Math.max(0, qs.length - preview.length) + '문항</li>\n</ul>\n';
  }

  // 결과 유형 전체 해설 — 이 페이지의 핵심 고유 콘텐츠.
  // <details>는 기본 접힘 상태라도 텍스트가 DOM에 그대로 남아있어 크롤러(검색엔진/애드센스봇)는
  // 전문을 다 읽지만, 화면상으로는 접혀 있어 결과 스포일러가 재미를 반감시키지 않는다.
  // (나중에 이 블록 자체를 완전히 빼고 싶으면 <details>...</details> 통째로 지우면 됨)
  html += '<details class="te-seo-details">\n';
  html += '<summary>결과 유형 미리보기 (총 ' + rs.length + '가지) <span class="te-seo-spoiler">— 스포 방지, 이미 완료하셨던 분만 클릭하세요</span></summary>\n';
  html += '<div class="te-seo-details-body">\n';
  html += '<p>어떤 답을 고르면 어떤 유형이 나오는지는 비밀! 대신 어떤 유형들이 기다리고 있는지 미리 구경해보세요.</p>\n';
  rs.forEach(function (r) {
    const title = cleanText(r.title, r);
    if (!title) return;
    html += '<div class="te-seo-result">\n<h4>' + esc(title) + '</h4>\n';
    const sub = cleanText(r.subtitle, r);
    if (sub) html += '<p class="te-seo-sub">' + esc(sub) + '</p>\n';
    const traits = (r.traits || []).map(function (t) { return cleanText(t, r); }).filter(Boolean);
    if (traits.length) {
      html += '<ul>\n';
      traits.forEach(function (t) { html += '<li>' + esc(t) + '</li>\n'; });
      html += '</ul>\n';
    }
    const tip = cleanText(r.tip, r);
    if (tip) html += '<p class="te-seo-tip">💡 ' + esc(tip) + '</p>\n';
    html += '</div>\n';
  });
  html += '</div>\n</details>\n';

  // FAQ (짧게 — 페이지 간 중복 최소화를 위해 3개만)
  html += '<h3>자주 묻는 질문</h3>\n';
  html += '<p><strong>Q. 결과가 정확한가요?</strong><br>재미로 즐기는 오락용 심리테스트예요. 전문적인 심리 검사나 진단을 대체하지 않아요.</p>\n';
  html += '<p><strong>Q. 다시 할 수 있나요?</strong><br>네, 결과 화면의 &ldquo;다시하기&rdquo; 버튼으로 몇 번이든 다시 해볼 수 있어요.</p>\n';
  html += '<p><strong>Q. 결과를 공유할 수 있나요?</strong><br>결과 화면에서 카카오톡 공유와 결과 카드 이미지 저장을 지원해요.</p>\n';

  // 내부 링크 — 형제 테스트 + 메인 사이트
  if (siblings.length) {
    html += '<h3>함께 해보면 좋은 테스트</h3>\n<ul class="te-seo-links">\n';
    siblings.forEach(function (s) {
      html += '<li><a href="' + SITE_ORIGIN + '/test-engine/tests/' + s.folder + '/">' + esc(s.title) + '</a> — ' + esc(s.description) + '</li>\n';
    });
    html += '<li><a href="' + SITE_ORIGIN + '/">과몰입 연구소 홈</a> — MBTI·두뇌 나이·오늘의 운세·꿈해몽 등 전체 테스트 모음</li>\n';
    html += '<li><a href="' + SITE_ORIGIN + '/kkum/">꿈해몽 사전</a> — 174가지 꿈 풀이 전체 보기</li>\n';
    html += '</ul>\n';
  }

  html += '</div>\n</section>\n';
  return html;
}

// 섹션 공용 스타일 (테마와 무관하게 어떤 배경 위에서도 읽히는 자체완결 카드)
const SEO_STYLE = '<style>\n' +
  // 인트로 화면(.te-app, min-height:100vh)이 실제 콘텐츠 높이가 짧으면 버튼이 화면 하단에
  // 딱 붙어 렌더링돼, 살짝만 스크롤해도 바로 이 섹션이 코앞에 나타나 몰입이 깨짐(2026-07-15
  // 사용자 스크린샷 제보) — 상단 여백을 뷰포트 비례(clamp)로 넉넉히 둬서 "의도적으로 더
  // 스크롤해야만" 보이도록 확실한 거리를 둔다.
  '.te-seo{max-width:500px;margin:0 auto;padding:clamp(64px,18vh,220px) 16px 60px;font-family:"Noto Sans KR","Apple SD Gothic Neo",sans-serif;font-synthesis:none;}\n' +
  '.te-seo-card{background:#fffdf7;color:#1f2328;border:3px solid #1f2328;border-radius:16px;box-shadow:6px 6px 0 0 rgba(31,35,40,.9);padding:22px 18px;line-height:1.65;font-size:15px;}\n' +
  '.te-seo h2{font-size:20px;font-weight:800;margin:0 0 10px;}\n' +
  '.te-seo h3{font-size:17px;font-weight:800;margin:22px 0 8px;padding-top:14px;border-top:2px dashed #d8d2c4;}\n' +
  '.te-seo h4{font-size:15px;font-weight:800;margin:14px 0 4px;}\n' +
  '.te-seo p{margin:6px 0;}\n' +
  '.te-seo ul{margin:6px 0 10px;padding-left:20px;}\n' +
  '.te-seo li{margin:3px 0;}\n' +
  '.te-seo-tags{color:#0d7a5f;font-weight:700;font-size:13px;}\n' +
  '.te-seo-sub{color:#555;font-size:13.5px;margin-top:0;}\n' +
  '.te-seo-tip{background:#f4efe3;border-radius:8px;padding:8px 10px;font-size:13.5px;}\n' +
  '.te-seo-result{margin-bottom:14px;}\n' +
  '.te-seo-links a{color:#0d5fd7;font-weight:700;}\n' +
  '.te-seo-details{margin:22px 0 8px;padding-top:14px;border-top:2px dashed #d8d2c4;}\n' +
  '.te-seo-details summary{font-size:17px;font-weight:800;cursor:pointer;list-style:none;display:flex;flex-wrap:wrap;align-items:baseline;gap:6px;}\n' +
  '.te-seo-details summary::-webkit-details-marker{display:none;}\n' +
  '.te-seo-details summary::before{content:"▶";font-size:12px;color:#0d7a5f;transition:transform .15s;flex:none;}\n' +
  '.te-seo-details[open] summary::before{transform:rotate(90deg);}\n' +
  '.te-seo-details-body{margin-top:12px;}\n' +
  '.te-seo-spoiler{font-size:12.5px;font-weight:600;color:#8a6d3b;}\n' +
  '</style>\n';

function main() {
  const folders = fs.readdirSync(TESTS_DIR).filter(function (f) {
    return fs.existsSync(path.join(TESTS_DIR, f, 'config.json'));
  }).sort();

  const all = folders.map(function (f) {
    const cfg = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, f, 'config.json'), 'utf8'));
    return { folder: f, cfg: cfg, title: cfg.title, description: cfg.description };
  });

  let ok = 0;
  all.forEach(function (item, i) {
    // 형제 테스트 4개 (자기 다음 순번부터 순환)
    const siblings = [];
    for (let k = 1; siblings.length < 4 && k < all.length; k++) {
      siblings.push(all[(i + k) % all.length]);
    }
    const section = SEO_STYLE + buildSection(item.cfg, item.folder, siblings);
    const block = '<!-- te-seo:start (generate-seo-content.js가 생성 — 직접 수정 금지, config.json 수정 후 재실행) -->\n' +
      section + '<!-- te-seo:end -->';

    const htmlPath = path.join(TESTS_DIR, item.folder, 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    // 기존 블록 제거 (멱등)
    html = html.replace(/\n?<!-- te-seo:start[\s\S]*?<!-- te-seo:end -->/g, '');
    // canonical 추가 (없으면)
    const canonical = '<link rel="canonical" href="' + SITE_ORIGIN + '/test-engine/tests/' + item.folder + '/">';
    if (html.indexOf('rel="canonical"') === -1) {
      html = html.replace('</head>', canonical + '\n</head>');
    }
    if (html.indexOf('id="test-engine-root"') === -1) {
      console.error('SKIP(root 없음):', item.folder);
      return;
    }
    html = html.replace(/(<div id="test-engine-root"><\/div>)/, '$1\n' + block);
    fs.writeFileSync(htmlPath, html);
    ok++;
    console.log('OK', item.folder, '(결과 ' + (item.cfg.results || []).length + '종)');
  });
  console.log('\n총 ' + ok + '/' + all.length + '개 페이지에 SEO 섹션 삽입 완료');
}

main();
