/* v0.0.49 | 5-in-1 Dashboard SPA — functions/share/[section].js
   공유 랜딩 페이지: 카카오톡/페이스북/트위터/밴드 등에 링크를 붙여넣거나 카카오 SDK로 전달했을 때
   크롤러가 og:image/og:title/og:description을 읽어갈 수 있도록 서버에서 동적으로 렌더링.
   SPA는 해시 라우팅(#brain)이라 서버가 해시를 못 읽으므로, 실제 경로(/share/{section})를 이 용도로 둠.
   실제 사람이 열면 즉시 해당 테스트(#{section})로 리다이렉트됨. */

const VALID_SECTIONS = ['brain', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus'];

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function onRequestGet(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const section = params.section;

  if (!VALID_SECTIONS.includes(section)) {
    return new Response('Not Found', { status: 404 });
  }

  const type = url.searchParams.get('type') || 'result';
  const nickname = esc(url.searchParams.get('nickname') || '익명');
  const origin = url.origin;

  let title, description, imageUrl, redirectUrl;

  if (type === 'challenge') {
    const result = esc(url.searchParams.get('result') || '');
    title = `⚔️ ${nickname}님의 도전장이 도착했습니다!`;
    description = `기록: ${result} — 같은 테스트로 나도 겨뤄보기 👉`;
    imageUrl = `${origin}/share-cards/vs.jpg`;
    /* 기존 도전장 판정 로직(App.pendingChallenge)이 #{section}?vs=<JSON> 형태를 그대로 기대하므로 페이로드를 복원 */
    const payload = encodeURIComponent(JSON.stringify({ n: url.searchParams.get('nickname') || '익명', r: url.searchParams.get('result') || '' }));
    redirectUrl = `${origin}/#${section}?vs=${payload}`;
  } else if (type === 'verdict') {
    const result = esc(url.searchParams.get('result') || '');
    const oppNickname = esc(url.searchParams.get('oppNickname') || '상대');
    const oppResult = esc(url.searchParams.get('oppResult') || '');
    const verdict = esc(url.searchParams.get('verdict') || '');
    title = `⚔️ ${nickname} vs ${oppNickname} 대결 결과`;
    description = `${nickname} ${result} · ${oppNickname} ${oppResult} — ${verdict}`;
    imageUrl = `${origin}/share-cards/vs.jpg`;
  } else {
    const tier = /^[SABCD]$/.test(url.searchParams.get('tier')) ? url.searchParams.get('tier') : 'D';
    const idx = /^[0-9]$/.test(url.searchParams.get('idx')) ? url.searchParams.get('idx') : '0';
    const result = esc(url.searchParams.get('result') || '');
    title = `${nickname} 님의 테스트 결과: ${result}`;
    description = `나는 어떤 동물일까? 과몰입 연구소에서 직접 확인해보세요 👉`;
    imageUrl = `${origin}/share-cards/${section}-${tier}-${idx}.jpg`;
  }

  if (!redirectUrl) redirectUrl = `${origin}/#${section}`;

  const html = `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:url" content="${esc(url.origin + url.pathname + url.search)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageUrl}">
<meta http-equiv="refresh" content="0; url=${esc(redirectUrl)}">
<script>location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;text-align:center;padding-top:4rem;">
  <p>결과로 이동 중입니다...</p>
  <p><a href="${esc(redirectUrl)}" style="color:#60a5fa;">이동이 안 되면 여기를 눌러주세요 →</a></p>
</body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
