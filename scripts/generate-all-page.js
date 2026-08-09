/**
 * /all/ 전체 테스트 목록 페이지 생성기
 *
 * 목적: 메인(index.html)이 SPA라 테스트 상세 페이지로 가는 정적 <a> 링크가 4개뿐이어서
 * 크롤러가 사이트맵 외에는 61개 테스트를 발견할 경로가 없었다. 이 페이지가 그 경로 역할을 한다.
 *
 * 실행: node scripts/generate-all-page.js
 * 대상: test-engine/tests/<폴더>/config.json 중 sitemap-main.xml에 등재된 것만
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TESTS_DIR = path.join(ROOT, 'test-engine', 'tests');
const OUT_DIR = path.join(ROOT, 'all');
const CANONICAL = 'https://gwamol-lab.xyz/all/';

// sitemap-main.xml에 실제로 등재된 폴더만 노출 (죽은 폴더가 섞이는 걸 방지)
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap-main.xml'), 'utf8');
const listed = new Set(
  [...sitemap.matchAll(/test-engine\/tests\/([^/]+)\//g)].map((m) => m[1])
);

const esc = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// 폴더명 앞 숫자 기준 정렬, 번호 없는 폴더는 뒤로
const num = (name) => {
  const m = name.match(/^(\d+)-/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
};

const items = fs
  .readdirSync(TESTS_DIR)
  .filter((d) => listed.has(d))
  .filter((d) => fs.existsSync(path.join(TESTS_DIR, d, 'config.json')))
  .sort((a, b) => num(a) - num(b) || a.localeCompare(b))
  .map((dir) => {
    const c = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, dir, 'config.json'), 'utf8'));
    return {
      dir,
      title: c.title || dir,
      description: c.description || '',
      category: c.psych_category === 'mbtizone' ? 'mbtizone' : 'immersive',
    };
  });

const groups = [
  {
    key: 'immersive',
    heading: '몰입형 심리테스트',
    intro:
      '전용 일러스트와 테마 디자인, 8~16가지 결과 유형 해설을 하나하나 직접 만든 스토리형 심리테스트예요. 결과는 카드 이미지로 저장해서 바로 공유할 수 있습니다.',
  },
  {
    key: 'mbtizone',
    heading: 'MBTI존',
    intro:
      '내 MBTI를 다른 세계관에 대입해보는 시리즈예요. 판타지 종족, 히어로 각성, 좀비 생존 등급처럼 상황을 바꿔가며 16유형을 다르게 읽어봅니다.',
  },
];

const cards = (key) =>
  items
    .filter((i) => i.category === key)
    .map(
      (i) =>
        `<a class="card" href="/test-engine/tests/${i.dir}/"><div class="t">${esc(
          i.title
        )}</div><div class="s">${esc(i.description)}</div></a>`
    )
    .join('\n');

const total = items.length;
const title = `전체 테스트 목록 — 심리테스트 ${total}종 총정리 | 과몰입 연구소`;
const desc = `과몰입 연구소의 심리테스트 ${total}가지 전체 목록. 몰입형 심리테스트와 MBTI존을 한 페이지에서 모두 찾아보세요. 전부 무료, 가입 없이 바로 시작.`;

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}"/>
  <link rel="canonical" href="${CANONICAL}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="과몰입 연구소"/>
  <meta property="og:locale" content="ko_KR"/>
  <meta property="og:url" content="${CANONICAL}"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(desc)}"/>
  <meta property="og:image" content="https://gwamol-lab.xyz/share-cards/og-default.jpg"/>
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
    h1 { font-size:1.7rem; font-weight:900; color:#f8fafc; margin-bottom:.75rem; line-height:1.3; }
    h2 { font-size:1.2rem; font-weight:800; color:#f1f5f9; margin:2.25rem 0 .5rem; }
    p.lead { font-size:1.05rem; color:#a5b4fc; font-weight:600; margin-bottom:1rem; }
    p { margin-bottom:1rem; color:#cbd5e1; }
    .count { font-size:.8rem; color:#94a3b8; font-weight:700; }
    .cta { text-align:center; margin:2rem 0; }
    .cta a { display:inline-block; background:#7c3aed; color:#fff; font-weight:800; padding:.85rem 1.5rem; border-radius:999px; }
    .cta a:hover { background:#6d28d9; text-decoration:none; }
    .grid-wide { display:grid; grid-template-columns:1fr; gap:.75rem; }
    @media(min-width:560px){ .grid-wide { grid-template-columns:1fr 1fr; } }
    .card { display:block; background:#1e293b; border:1px solid #334155; border-radius:14px; padding:.9rem 1rem; }
    .card:hover { border-color:#8b5cf6; text-decoration:none; }
    .card .t { font-weight:800; color:#f1f5f9; margin-bottom:.2rem; font-size:.95rem; }
    .card .s { font-size:.8rem; color:#94a3b8; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
    .hub { display:grid; grid-template-columns:1fr; gap:.75rem; margin:1rem 0; }
    @media(min-width:560px){ .hub { grid-template-columns:1fr 1fr; } }
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

    <nav class="crumb"><a href="/">홈</a> › 전체 테스트 목록</nav>
    <h1>전체 테스트 목록</h1>
    <p class="lead">과몰입 연구소의 심리테스트 ${total}가지를 한 페이지에 모았어요.</p>
    <p>전부 무료이고 가입 없이 바로 시작할 수 있어요. 테스트마다 전용 일러스트와 결과 유형 해설을 직접 만들었고, 결과는 카드 이미지로 저장해 카카오톡으로 공유할 수 있습니다. 두뇌·반응속도 같은 측정형 게임과 MBTI 검사 자체는 <a href="/">메인 페이지</a>에 있어요.</p>
    <div class="cta"><a href="/">🏠 메인에서 전체 기능 보기</a></div>

${groups
  .map((g) => {
    const n = items.filter((i) => i.category === g.key).length;
    return `    <h2>${g.heading} <span class="count">${n}종</span></h2>
    <p>${g.intro}</p>
    <div class="grid-wide">
${cards(g.key)}
    </div>`;
  })
  .join('\n\n')}

    <h2>사전 · 아카이브</h2>
    <div class="hub">
      <!-- [adsense-prep v0.0.2] MBTI 사전·꿈해몽 사전 카드 제거 — 색인 대상 /all/ 에서
           비색인 저품질군으로 가는 크롤 경로였음. 승인 후 이 주석을 풀어 복구. -->
    </div>

    <footer class="site">
      <p>ⓒ 과몰입 연구소 · 본 콘텐츠는 오락 목적이며 전문적인 심리 검사를 대체하지 않습니다.</p>
      <p><a href="/">홈</a> · <a href="/about/">과몰입 연구소 소개</a></p>
    </footer>
  </div>
</body>
</html>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
console.log(`/all/index.html 생성 완료 — 총 ${total}종 (몰입형 ${items.filter((i) => i.category === 'immersive').length} / MBTI존 ${items.filter((i) => i.category === 'mbtizone').length})`);
