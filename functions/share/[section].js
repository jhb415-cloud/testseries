/* v0.0.53 | 5-in-1 Dashboard SPA — functions/share/[section].js
   공유 랜딩 페이지: 카카오톡/페이스북/트위터/밴드 등에 링크를 붙여넣거나 카카오 SDK로 전달했을 때
   크롤러가 og:image/og:title/og:description을 읽어갈 수 있도록 서버에서 동적으로 렌더링.
   SPA는 해시 라우팅(#brain)이라 서버가 해시를 못 읽으므로, 실제 경로(/share/{section})를 이 용도로 둠.
   실제 사람이 열면 즉시 해당 테스트(#{section})로 리다이렉트됨.

   ① Tier 채점 8개 테스트: type=result|challenge|verdict (v0.0.49~)
   ② 성향형 7개 테스트(mbti/adhd/insa/proverb/pricequiz/fortune/dream): section 자체로 분기 (v0.0.50~) */

const TIER_SECTIONS = ['brain', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus'];
const IDENTITY_SECTIONS = ['mbti', 'adhd', 'insa', 'proverb', 'pricequiz', 'fortune', 'dream'];
const VALID_SECTIONS = [...TIER_SECTIONS, ...IDENTITY_SECTIONS];

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

  const nickname = esc(url.searchParams.get('nickname') || '익명');
  const origin = url.origin;

  let title, description, imageUrl, redirectUrl;

  if (TIER_SECTIONS.includes(section)) {
    const type = url.searchParams.get('type') || 'result';
    if (type === 'challenge') {
      const result = esc(url.searchParams.get('result') || '');
      title = `⚔️ ${nickname}님의 도전장이 도착했습니다!`;
      description = `기록: ${result} — 같은 테스트로 나도 겨뤄보기 👉`;
      imageUrl = `${origin}/share-cards/vs.jpg`;
      /* 기존 도전장 판정 로직(App.pendingChallenge)이 #{section}?vs=<JSON> 형태를 그대로 기대하므로 페이로드를 복원.
         difficulty(d)도 함께 복원해야 난이도 불일치 대결을 클라이언트가 감지할 수 있음(v0.0.53~) */
      const payload = encodeURIComponent(JSON.stringify({
        n: url.searchParams.get('nickname') || '익명',
        r: url.searchParams.get('result') || '',
        d: url.searchParams.get('difficulty') || '',
      }));
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
  } else if (section === 'mbti') {
    const mbtiType = /^[EI][SN][TF][JP]$/.test(url.searchParams.get('mbtiType')) ? url.searchParams.get('mbtiType') : 'INFP';
    const result = esc(url.searchParams.get('result') || '');
    title = `${nickname} 님의 MBTI는 ${mbtiType}!`;
    description = result || '나도 확인해보고 싶다면? 과몰입 연구소에서 테스트해보세요 👉';
    imageUrl = `${origin}/share-cards/mbti-${mbtiType}.jpg`;
  } else if (section === 'adhd' || section === 'insa' || section === 'proverb' || section === 'pricequiz') {
    const grade = /^[SABCD]$/.test(url.searchParams.get('grade')) ? url.searchParams.get('grade') : 'C';
    const result = esc(url.searchParams.get('result') || '');
    const labels = { adhd: 'ADHD 성향 진단', insa: '인싸력 테스트', proverb: '속담 완성 퀴즈', pricequiz: '그 시절 물가 맞히기' };
    title = `${nickname} 님의 ${labels[section]} 결과`;
    description = result || '나도 확인해보고 싶다면? 과몰입 연구소에서 테스트해보세요 👉';
    imageUrl = `${origin}/share-cards/${section}-${grade}.jpg`;
  } else if (section === 'fortune') {
    const zodiacSlug = /^[a-z]+$/.test(url.searchParams.get('zodiac')) ? url.searchParams.get('zodiac') : 'rat';
    const result = esc(url.searchParams.get('result') || '');
    title = '오늘의 운세';
    description = result || '오늘 내 운세는 어떨까? 과몰입 연구소에서 확인해보세요 👉';
    imageUrl = `${origin}/share-cards/fortune-${zodiacSlug}.jpg`;
  } else if (section === 'dream') {
    const dreamIdx = /^[0-9]+$/.test(url.searchParams.get('dreamIdx')) ? url.searchParams.get('dreamIdx') : '0';
    const dreamTitle = esc(url.searchParams.get('dreamTitle') || '꿈 해몽');
    const result = esc(url.searchParams.get('result') || '');
    title = `꿈 해몽: ${dreamTitle}`;
    description = result || '이 꿈이 무슨 의미인지 과몰입 연구소에서 확인해보세요 👉';
    imageUrl = `${origin}/share-cards/dream-${dreamIdx}.jpg`;
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
