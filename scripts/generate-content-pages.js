/* v0.5.8 | 5-in-1 Dashboard SPA — scripts/generate-content-pages.js
   GEO 6단계(SPA에 숨은 콘텐츠를 크롤러가 읽을 수 있게 정적 노출)의 파일럿 — 꿈해몽 사전.
   해시 라우팅 SPA(#dream)는 실제 해몽 텍스트가 data.js 안에만 있어 크롤러/AI봇/애드센스가 못 봄.
   이 스크립트가 data.js를 읽어 진짜 URL을 가진 정적 콘텐츠 페이지를 생성한다(SPA 런타임은 무변경, 순수 추가).

   생성물:
   - /kkum/index.html                (사전 목록 1페이지, 20개씩)
   - /kkum/page/{N}/index.html        (2페이지부터)
   - /kkum/{slug}/index.html          (테마별 상세 — 요약/상세/행운색·숫자/행동/하위꿈)

   실행: node scripts/generate-content-pages.js
   데이터(data.js dreamData)가 바뀌면 재실행할 것(share-cards 재생성과 동일한 수동 파이프라인).

   ── PUBLISH 플래그 ──────────────────────────────────────────────────────────
   false(미리보기): 모든 페이지에 <meta name="robots" content="noindex"> 삽입, sitemap/푸터 미연결.
     → 사용자가 품질·범위를 확정하기 전까지 크롤러·애드센스에 노출되지 않도록 안전장치.
   true(정식 공개): noindex 제거. 이때 sitemap.xml에 URL 추가 + SPA 푸터/꿈해몽 섹션에 "꿈해몽 사전"
     링크를 걸어 크롤러가 발견할 수 있게 하는 별도 작업을 함께 진행할 것.
   ── LIMIT ───────────────────────────────────────────────────────────────────
   null이면 전체 174개, 숫자면 앞에서 그 개수만(샘플/큐레이션용). */

const fs = require('fs');
const path = require('path');

const PUBLISH = false;   // 미리보기 단계 — 확정 후 true로 변경
const LIMIT = null;      // null=전체, 숫자=앞에서 N개만
const PER_PAGE = 20;
const ORIGIN = 'https://gwamol-lab.xyz';

// data.js를 Node에서 그대로 평가해 AppData 확보(브라우저 전역 window에 붙는 구조)
global.window = {};
eval(fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8'));
let dreams = global.window.AppData.dreamData;
if (LIMIT) dreams = dreams.slice(0, LIMIT);

const outRoot = path.join(__dirname, '..', 'kkum');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 제목 → URL 슬러그. 한글은 유지(한국어 검색엔진 친화 + 서술적 URL 권장사항), 문제되는 기호만 제거.
const usedSlugs = new Set();
function slugify(title) {
  let s = title.trim()
    .replace(/[\/\\?%*:|"'<>().,·~!@#$^&+=`\[\]{};]/g, '')
    .replace(/\s+/g, '-');
  let base = s, i = 2;
  while (usedSlugs.has(s)) { s = base + '-' + i; i++; }
  usedSlugs.add(s);
  return s;
}
dreams.forEach(t => { t._slug = slugify(t.title); });

function pageShell({ title, description, canonicalPath, body }) {
  const robots = PUBLISH ? '' : '\n  <meta name="robots" content="noindex"/>';
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}"/>
  <link rel="canonical" href="${ORIGIN}${canonicalPath}"/>${robots}
  <meta property="og:type" content="article"/>
  <meta property="og:site_name" content="과몰입 연구소"/>
  <meta property="og:locale" content="ko_KR"/>
  <meta property="og:url" content="${ORIGIN}${canonicalPath}"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(description)}"/>
  <meta property="og:image" content="${ORIGIN}/share-cards/dream-share.jpg"/>
  <link rel="icon" type="image/png" href="/assets/brand/favicon-32.png"/>
  <meta name="google-adsense-account" content="ca-pub-4825324689294427"/>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4825324689294427" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-W05KHWP4WY"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-W05KHWP4WY');</script>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; margin: 0; }
    body { background:#0f172a; color:#e2e8f0; font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif; line-height:1.7; }
    a { color:#c4b5fd; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .wrap { max-width:760px; margin:0 auto; padding:1.25rem 1.25rem 4rem; }
    header.site { display:flex; align-items:center; gap:.6rem; padding:1rem 0; border-bottom:1px solid #1e293b; margin-bottom:1.5rem; }
    header.site img { width:32px; height:32px; }
    header.site .name { font-weight:900; font-size:1.05rem; color:#f1f5f9; }
    .crumb { font-size:.8rem; color:#94a3b8; margin-bottom:1.25rem; }
    .crumb a { color:#94a3b8; }
    h1 { font-size:1.75rem; font-weight:900; color:#f8fafc; margin-bottom:.75rem; line-height:1.3; }
    h2 { font-size:1.2rem; font-weight:800; color:#f1f5f9; margin:2rem 0 .75rem; }
    p.lead { font-size:1.05rem; color:#a5b4fc; font-weight:600; margin-bottom:1rem; }
    p { margin-bottom:1rem; color:#cbd5e1; }
    .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; margin:1.25rem 0; }
    .meta-grid > div { background:#1e293b; border:1px solid #334155; border-radius:12px; padding:.9rem 1rem; }
    .meta-grid .k { font-size:.75rem; color:#94a3b8; margin-bottom:.25rem; }
    .meta-grid .v { font-weight:700; color:#f1f5f9; }
    .action { background:#3b2f0b; border:1px solid #a16207; border-radius:12px; padding:.9rem 1rem; color:#fde68a; margin:1.25rem 0; }
    .variant { background:#1e293b; border:1px solid #334155; border-radius:12px; padding:1rem 1.1rem; margin-bottom:.9rem; }
    .variant h3 { font-size:1rem; color:#f1f5f9; margin-bottom:.4rem; }
    .variant .sub { font-size:.85rem; color:#94a3b8; margin-top:.5rem; }
    .cta { text-align:center; margin:2rem 0; }
    .cta a { display:inline-block; background:#7c3aed; color:#fff; font-weight:800; padding:.85rem 1.5rem; border-radius:999px; }
    .cta a:hover { background:#6d28d9; text-decoration:none; }
    .grid { display:grid; grid-template-columns:1fr; gap:.75rem; }
    @media(min-width:560px){ .grid { grid-template-columns:1fr 1fr; } }
    .card { display:block; background:#1e293b; border:1px solid #334155; border-radius:14px; padding:1rem 1.1rem; }
    .card:hover { border-color:#8b5cf6; text-decoration:none; }
    .card .t { font-weight:800; color:#f1f5f9; margin-bottom:.3rem; }
    .card .s { font-size:.85rem; color:#94a3b8; }
    .pager { display:flex; flex-wrap:wrap; gap:.4rem; justify-content:center; align-items:center; margin:2rem 0 0; }
    .pager a, .pager span { padding:.45rem .8rem; border-radius:8px; border:1px solid #334155; font-size:.9rem; color:#cbd5e1; }
    .pager .cur { background:#7c3aed; border-color:#7c3aed; color:#fff; font-weight:700; }
    .related a { display:block; padding:.5rem 0; border-bottom:1px solid #1e293b; }
    footer.site { margin-top:3rem; padding-top:1.5rem; border-top:1px solid #1e293b; font-size:.8rem; color:#94a3b8; }
    footer.site a { color:#94a3b8; }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="site">
      <a href="/"><img src="/assets/brand/logo-icon-96.png" alt="과몰입 연구소" width="32" height="32"/></a>
      <a href="/" class="name">과몰입 연구소</a>
    </header>
${body}
    <footer class="site">
      <p>본 꿈 해몽은 전통적 상징 해석을 참고한 오락용 콘텐츠이며, 실제 길흉을 보장하지 않습니다.</p>
      <p style="margin-top:.5rem;">© 2026 과몰입 연구소 · <a href="/">홈</a> · <a href="/#dream">꿈 해몽 검색</a></p>
    </footer>
  </div>
</body>
</html>`;
}

function detailBody(t, related) {
  const variants = (t.variants || []).map(v => `
      <div class="variant">
        <h3>${esc(v.title)}</h3>
        <p style="margin-bottom:0;">${esc(v.detail)}</p>
        <div class="sub">🍀 ${esc(v.lucky)} · 🔢 ${esc(v.luckyNum)}${v.action ? ' · 💡 ' + esc(v.action) : ''}</div>
      </div>`).join('');
  const relatedLinks = related.map(r => `<a href="/kkum/${encodeURIComponent(r._slug)}/">${esc(r.title)}</a>`).join('\n        ');
  return `    <nav class="crumb"><a href="/">홈</a> › <a href="/kkum/">꿈해몽 사전</a> › ${esc(t.title)}</nav>
    <article>
      <h1>${esc(t.title)}</h1>
      <p class="lead">${esc(t.summary)}</p>
      <p>${esc(t.detail)}</p>
      <div class="meta-grid">
        <div><div class="k">🍀 행운의 색</div><div class="v">${esc(t.lucky)}</div></div>
        <div><div class="k">🔢 행운의 숫자</div><div class="v">${esc(t.luckyNum)}</div></div>
      </div>
      <div class="action">💡 오늘의 행동 — ${esc(t.action)}</div>
      ${variants ? `<h2>이런 꿈도 있어요</h2>${variants}` : ''}
      <div class="cta"><a href="/#dream">🌙 다른 꿈도 검색해보기</a></div>
      <h2>다른 꿈 해몽 보기</h2>
      <nav class="related">
        ${relatedLinks}
      </nav>
    </article>`;
}

function listBody(pageItems, pageNum, totalPages) {
  const cards = pageItems.map(t => `
      <a class="card" href="/kkum/${encodeURIComponent(t._slug)}/">
        <div class="t">${esc(t.title)}</div>
        <div class="s">${esc(t.summary)}</div>
      </a>`).join('');
  const pageUrl = (n) => n === 1 ? '/kkum/' : `/kkum/page/${n}/`;
  let pager = '';
  if (totalPages > 1) {
    const parts = [];
    parts.push(pageNum > 1 ? `<a href="${pageUrl(pageNum - 1)}">‹ 이전</a>` : `<span>‹ 이전</span>`);
    for (let n = 1; n <= totalPages; n++) {
      parts.push(n === pageNum ? `<span class="cur">${n}</span>` : `<a href="${pageUrl(n)}">${n}</a>`);
    }
    parts.push(pageNum < totalPages ? `<a href="${pageUrl(pageNum + 1)}">다음 ›</a>` : `<span>다음 ›</span>`);
    pager = `<nav class="pager">${parts.join('')}</nav>`;
  }
  const heading = pageNum === 1 ? '꿈해몽 사전' : `꿈해몽 사전 (${pageNum}페이지)`;
  return `    <nav class="crumb"><a href="/">홈</a> › 꿈해몽 사전</nav>
    <h1>${heading}</h1>
    <p>뱀·물·불·돈·이빨 등 자주 꾸는 꿈부터 특이한 꿈까지, 전통 해몽과 상징 풀이를 한곳에 모았어요. 총 ${dreams.length}가지 꿈의 의미를 확인해보세요.</p>
    <div class="grid">${cards}
    </div>
    ${pager}
    <div class="cta"><a href="/#dream">🔍 꿈 키워드로 바로 검색하기</a></div>`;
}

// ── 생성 ──────────────────────────────────────────────────────────────────────
fs.rmSync(outRoot, { recursive: true, force: true });
fs.mkdirSync(outRoot, { recursive: true });

// 상세 페이지
dreams.forEach((t, i) => {
  const related = [];
  for (let k = 1; k <= 6; k++) related.push(dreams[(i + k) % dreams.length]);
  const dir = path.join(outRoot, t._slug);
  fs.mkdirSync(dir, { recursive: true });
  const desc = `${t.summary}. ${t.detail}`.slice(0, 155);
  fs.writeFileSync(path.join(dir, 'index.html'), pageShell({
    title: `${t.title} 해몽 - 무슨 의미일까? | 과몰입 연구소`,
    description: desc,
    canonicalPath: `/kkum/${t._slug}/`,
    body: detailBody(t, related),
  }));
});

// 목록 페이지(20개씩)
const totalPages = Math.ceil(dreams.length / PER_PAGE);
for (let p = 1; p <= totalPages; p++) {
  const items = dreams.slice((p - 1) * PER_PAGE, p * PER_PAGE);
  const canonicalPath = p === 1 ? '/kkum/' : `/kkum/page/${p}/`;
  const html = pageShell({
    title: p === 1 ? '꿈해몽 사전 - 174가지 꿈의 의미 총정리 | 과몰입 연구소'
                   : `꿈해몽 사전 ${p}페이지 | 과몰입 연구소`,
    description: `뱀·물·불·돈 등 174가지 꿈 해몽을 한곳에. 자주 꾸는 꿈의 의미와 행운의 숫자까지 확인하세요.${p > 1 ? ' (' + p + '페이지)' : ''}`,
    canonicalPath,
    body: listBody(items, p, totalPages),
  });
  const dir = p === 1 ? outRoot : path.join(outRoot, 'page', String(p));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

console.log(`생성 완료: 상세 ${dreams.length}개 + 목록 ${totalPages}페이지 (PUBLISH=${PUBLISH}, PER_PAGE=${PER_PAGE})`);
console.log(`미리보기: ${ORIGIN}/kkum/  (예: ${ORIGIN}/kkum/${encodeURIComponent(dreams[0]._slug)}/)`);
