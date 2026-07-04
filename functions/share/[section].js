/* v0.1.1 | 5-in-1 Dashboard SPA — functions/share/[section].js
   공유 랜딩 페이지: 카카오톡/페이스북/트위터/밴드 등에 링크를 붙여넣거나 카카오 SDK로 전달했을 때
   크롤러가 og:image/og:title/og:description을 읽어갈 수 있도록 서버에서 동적으로 렌더링.
   SPA는 해시 라우팅(#brain)이라 서버가 해시를 못 읽으므로, 실제 경로(/share/{section})를 이 용도로 둠.

   v0.1.1~: 실제 사람이 열었을 때 예전에는 곧바로 테스트 화면(#{section})으로 리다이렉트했지만,
   "공유받은 캐릭터/결과를 먼저 보고 싶다"는 요청으로 공용 미리보기 화면(#shared-preview)을 한 단계
   더 거치도록 변경 — 15개 섹션×3개 타입 전부 동일한 방식으로 처리(섹션마다 따로 구현하지 않음).
   미리보기 화면에서 버튼을 눌러야 실제 테스트(#{section}, 도전장이면 ?vs=payload까지 포함)로 이동.

   ① Tier 채점 8개 테스트: type=result|challenge|verdict (v0.0.49~)
   ② 성향형 7개 테스트(mbti/adhd/insa/proverb/pricequiz/fortune/dream): section 자체로 분기 (v0.0.50~) */

const TIER_SECTIONS = ['brain', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus'];
const IDENTITY_SECTIONS = ['mbti', 'adhd', 'insa', 'proverb', 'pricequiz', 'fortune', 'dream'];
const VALID_SECTIONS = [...TIER_SECTIONS, ...IDENTITY_SECTIONS];
const CTA_RESULT = '나도 해보기';
const CTA_CHALLENGE = '⚔️ 도전하기';

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* 공유 프리뷰 화면(#shared-preview)으로 가는 URL 조립. next는 미리보기 버튼을 눌렀을 때 이동할
   실제 목적지 섹션, p는 도전장일 때만 채워지는 vs 페이로드(JSON 문자열, 그대로 두면 URLSearchParams가
   퍼센트 인코딩을 알아서 처리함) */
function buildPreviewRedirect(origin, { next, rawTitle, rawDescription, imageUrl, cta, vsPayload }) {
  const params = new URLSearchParams({ section: next, title: rawTitle, desc: rawDescription, image: imageUrl, cta });
  if (vsPayload) params.set('p', vsPayload);
  return `${origin}/#shared-preview?${params.toString()}`;
}

export async function onRequestGet(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const section = params.section;

  if (!VALID_SECTIONS.includes(section)) {
    return new Response('Not Found', { status: 404 });
  }

  const rawNickname = url.searchParams.get('nickname') || '익명';
  const origin = url.origin;

  let rawTitle, rawDescription, imageUrl, cta = CTA_RESULT, vsPayload = null;

  if (TIER_SECTIONS.includes(section)) {
    const type = url.searchParams.get('type') || 'result';
    if (type === 'challenge') {
      const result = url.searchParams.get('result') || '';
      rawTitle = `⚔️ ${rawNickname}님의 도전장이 도착했습니다!`;
      rawDescription = `기록: ${result} — 같은 테스트로 나도 겨뤄보기 👉`;
      imageUrl = `${origin}/share-cards/vs.jpg`;
      cta = CTA_CHALLENGE;
      /* 기존 도전장 판정 로직(App.pendingChallenge)이 기대하는 {n,r,d} 구조를 그대로 유지 —
         미리보기 화면에서 버튼을 누르는 순간 클라이언트가 이 페이로드로 pendingChallenge를 채움 */
      vsPayload = JSON.stringify({ n: rawNickname, r: result, d: url.searchParams.get('difficulty') || '' });
    } else if (type === 'verdict') {
      const result = url.searchParams.get('result') || '';
      const oppNickname = url.searchParams.get('oppNickname') || '상대';
      const oppResult = url.searchParams.get('oppResult') || '';
      const verdict = url.searchParams.get('verdict') || '';
      rawTitle = `⚔️ ${rawNickname} vs ${oppNickname} 대결 결과`;
      rawDescription = `${rawNickname} ${result} · ${oppNickname} ${oppResult} — ${verdict}`;
      imageUrl = `${origin}/share-cards/vs.jpg`;
    } else {
      const tier = /^[SABCD]$/.test(url.searchParams.get('tier')) ? url.searchParams.get('tier') : 'D';
      const idx = /^[0-9]$/.test(url.searchParams.get('idx')) ? url.searchParams.get('idx') : '0';
      const result = url.searchParams.get('result') || '';
      rawTitle = `${rawNickname} 님의 테스트 결과: ${result}`;
      rawDescription = `나는 어떤 동물일까? 과몰입 연구소에서 직접 확인해보세요 👉`;
      imageUrl = `${origin}/share-cards/${section}-${tier}-${idx}.jpg`;
    }
  } else if (section === 'mbti') {
    const mbtiType = /^[EI][SN][TF][JP]$/.test(url.searchParams.get('mbtiType')) ? url.searchParams.get('mbtiType') : 'INFP';
    const result = url.searchParams.get('result') || '';
    rawTitle = `${rawNickname} 님의 MBTI는 ${mbtiType}!`;
    rawDescription = result || '나도 확인해보고 싶다면? 과몰입 연구소에서 테스트해보세요 👉';
    imageUrl = `${origin}/share-cards/mbti-${mbtiType}.jpg`;
  } else if (section === 'adhd' || section === 'insa' || section === 'proverb' || section === 'pricequiz') {
    const grade = /^[SABCD]$/.test(url.searchParams.get('grade')) ? url.searchParams.get('grade') : 'C';
    const result = url.searchParams.get('result') || '';
    const labels = { adhd: 'ADHD 성향 진단', insa: '인싸력 테스트', proverb: '속담 완성 퀴즈', pricequiz: '그 시절 물가 맞히기' };
    rawTitle = `${rawNickname} 님의 ${labels[section]} 결과`;
    rawDescription = result || '나도 확인해보고 싶다면? 과몰입 연구소에서 테스트해보세요 👉';
    imageUrl = `${origin}/share-cards/${section}-${grade}.jpg`;
  } else if (section === 'fortune') {
    const zodiacSlug = /^[a-z]+$/.test(url.searchParams.get('zodiac')) ? url.searchParams.get('zodiac') : 'rat';
    const result = url.searchParams.get('result') || '';
    rawTitle = '오늘의 운세';
    rawDescription = result || '오늘 내 운세는 어떨까? 과몰입 연구소에서 확인해보세요 👉';
    imageUrl = `${origin}/share-cards/fortune-${zodiacSlug}.jpg`;
  } else if (section === 'dream') {
    const dreamIdx = /^[0-9]+$/.test(url.searchParams.get('dreamIdx')) ? url.searchParams.get('dreamIdx') : '0';
    const dreamTitle = url.searchParams.get('dreamTitle') || '꿈 해몽';
    const result = url.searchParams.get('result') || '';
    rawTitle = `꿈 해몽: ${dreamTitle}`;
    rawDescription = result || '이 꿈이 무슨 의미인지 과몰입 연구소에서 확인해보세요 👉';
    imageUrl = `${origin}/share-cards/dream-${dreamIdx}.jpg`;
  }

  const title = esc(rawTitle);
  const description = esc(rawDescription);
  const redirectUrl = buildPreviewRedirect(origin, { next: section, rawTitle, rawDescription, imageUrl, cta, vsPayload });

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
