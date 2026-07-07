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
const LOTTO_SECTIONS = ['lotto', 'lottodraw'];
/* Phase 4 수익화 로드맵 11-6/11-7 (v0.2.3~): 심리테스트존/밸런스게임 */
const FEED_SECTIONS = ['psychtest', 'balance'];
/* 가족오락관 진행 도우미 (v0.4.2~) */
const FAMILY_SECTIONS = ['family'];
/* 이상형 월드컵 (v0.4.0~) */
const WORLDCUP_SECTIONS = ['worldcup'];
const VALID_SECTIONS = [...TIER_SECTIONS, ...IDENTITY_SECTIONS, ...LOTTO_SECTIONS, ...FEED_SECTIONS, ...FAMILY_SECTIONS, ...WORLDCUP_SECTIONS];
const CTA_RESULT = '나도 해보기';
const CTA_CHALLENGE = '⚔️ 도전하기';

/* 이상형 월드컵 후보 텍스트 — data.js의 AppData.worldcupMemes와 내용 동일(이 함수는 별도 런타임이라
   data.js를 import할 수 없어 title/desc만 최소 복제, 이미지 파일은 assets/worldcup/{id}.jpg 공용) */
const WORLDCUP_MEMES = {
  nunnun:   { title: '눕눕',         desc: '침대와 한몸, 오늘도 못 일어남' },
  tungjang: { title: '텅장',         desc: '월급은 스쳐 지나가는 바람' },
  caffeine: { title: '카페인 수혈',  desc: '이거 없인 눈도 안 떠짐' },
  yasik:    { title: '야식',         desc: '오늘만 먹고 내일부터 다이어트' },
  scroll:   { title: '스크롤 중독',  desc: '자기 전 30분이 3시간 됨' },
  receipt:  { title: '영수증 플렉스', desc: '결제는 했는데 기억이 없음' },
  delivery: { title: '택배 쌓기',    desc: '뜯지도 않은 택배가 방 한켠에' },
  sofa:     { title: '소파 귀차니즘', desc: '한번 앉으면 못 일어남' },
};

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* 공유 프리뷰 화면(#shared-preview)으로 가는 URL 조립. next는 미리보기 버튼을 눌렀을 때 이동할
   실제 목적지 섹션, p는 도전장일 때만 채워지는 vs 페이로드(JSON 문자열, 그대로 두면 URLSearchParams가
   퍼센트 인코딩을 알아서 처리함) */
function buildPreviewRedirect(origin, { next, rawTitle, rawDescription, imageUrl, cta, vsPayload, extra }) {
  const params = new URLSearchParams({ section: next, title: rawTitle, desc: rawDescription, image: imageUrl, cta });
  if (vsPayload) params.set('p', vsPayload);
  if (extra) params.set('extra', extra);
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

  let rawTitle, rawDescription, imageUrl, cta = CTA_RESULT, vsPayload = null, extra = null;

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
    const isAiDream = url.searchParams.get('dreamAi') === '1';
    const dreamTitle = url.searchParams.get('dreamTitle') || '꿈 해몽';
    const dreamSummary = url.searchParams.get('dreamSummary') || '';
    /* v0.1.8~: 테마별 174장 이미지(dream-N.jpg)는 AI 해몽(테마 인덱스 없음)에서 항상 dream-0.jpg
       ("하늘을 나는 꿈")로 나와 "무슨 꿈이든 같은 그림"으로 보이는 문제가 있었음. 꿈 내용은 계속
       바뀌어 매번 이미지를 맞출 수 없으므로, 정적/AI 해몽 구분 없이 범용 티저 카드 1장(dream-share.jpg)
       + 고정 문구로 통일 — 실제 꿈 내용은 클릭 후 shared-preview 화면(extra 파라미터)에서 재현됨 */
    rawTitle = '나 이런 꿈 꿨어';
    rawDescription = '너도 꿈 꾼거 있으면 찾아볼래?';
    imageUrl = `${origin}/share-cards/dream-share.jpg`;
    /* v0.1.5~: 공유자가 본 해몽 카드 전체(본문/행운색/행운숫자/오늘의 행동)를 그대로 프리뷰 화면까지
       전달해, 링크를 연 사람이 검색 없이도 공유자와 똑같은 결과를 보게 함(로또의 실제 뽑은 번호
       전달 방식과 동일한 접근 — extra 파라미터 재사용) */
    extra = JSON.stringify({
      title: dreamTitle,
      summary: dreamSummary,
      detail: url.searchParams.get('dreamDetail') || '',
      lucky: url.searchParams.get('dreamLucky') || '',
      luckyNum: url.searchParams.get('dreamLuckyNum') || '',
      action: url.searchParams.get('dreamAction') || '',
      ai: isAiDream,
    });
  } else if (section === 'lotto') {
    /* 로또 조합기(완전랜덤/직접지정/운세연동/통계기반) 공용 홍보 링크 — og:image는 범용 홍보 이미지지만,
       실제 뽑은 번호(drawn)를 extra로 프리뷰 화면까지 전달해 링크를 연 사람에겐 진짜 번호를 공 UI로 보여줌 */
    const drawn = url.searchParams.get('drawn') || '';
    rawTitle = '🍀 로또 번호 조합기로 행운의 번호를 뽑아봤어요!';
    rawDescription = url.searchParams.get('desc') || '나도 로또 번호 조합기로 행운의 번호를 뽑아보세요 👉';
    imageUrl = `${origin}/share-cards/lotto-share.jpg`;
    cta = '🎲 나도 뽑아보기';
    if (drawn) extra = drawn;
  } else if (section === 'lottodraw') {
    /* 직접 뽑기 게임 — drawn(뽑은 번호)을 그대로 미리보기 화면을 거쳐 #lottodraw로 전달(extra 파라미터),
       진입 시 기존 lottodrawSharedBannerHTML()이 그대로 복원해 친구 번호 배너를 보여줌 */
    const drawn = url.searchParams.get('drawn') || '';
    rawTitle = '🎰 친구가 추첨기에서 직접 뽑은 행운 번호!';
    rawDescription = url.searchParams.get('desc') || '나도 추첨기에서 직접 내 손으로 뽑아보기 👉';
    imageUrl = `${origin}/share-cards/lotto-share.jpg`;
    cta = '🎰 나도 뽑아보기';
    if (drawn) extra = drawn;
  } else if (section === 'psychtest') {
    /* 심리테스트존 결과 공유 — testId+grade 조합별 이미지(현재는 katokspeed 1개×3등급뿐,
       신규 테스트 추가 시 share-cards/psychtest-{testId}-{grade}.jpg를 함께 생성할 것) */
    const testId = /^[a-z0-9]+$/.test(url.searchParams.get('testId')) ? url.searchParams.get('testId') : 'katokspeed';
    const grade = /^[ABCD]$/.test(url.searchParams.get('grade')) ? url.searchParams.get('grade') : 'A';
    const result = url.searchParams.get('result') || '';
    rawTitle = `${rawNickname} 님의 심리테스트 결과`;
    rawDescription = result || '나도 확인해보고 싶다면? 과몰입 연구소에서 테스트해보세요 👉';
    imageUrl = `${origin}/share-cards/psychtest-${testId}-${grade}.jpg`;
  } else if (section === 'balance') {
    /* 밸런스게임 결과 공유 — 게임별 이미지 1장(선택지와 무관하게 공용, 신규 게임 추가 시 함께 생성).
       v0.4.1~ 스페셜(유형 결과)은 grade 파라미터가 붙고 유형별 이미지(balance-sp-{id}-{grade}.jpg)를 사용 */
    const gameId = /^[a-z0-9]+$/.test(url.searchParams.get('gameId')) ? url.searchParams.get('gameId') : 'lifeorcash';
    const grade = /^[ABCD]$/.test(url.searchParams.get('grade')) ? url.searchParams.get('grade') : null;
    const result = url.searchParams.get('result') || '';
    rawTitle = grade ? `${rawNickname} 님의 밸런스게임 유형은?` : `${rawNickname} 님의 선택은?`;
    rawDescription = result || '너라면 어떤 걸 고를래? 과몰입 연구소에서 확인해보세요 👉';
    imageUrl = grade ? `${origin}/share-cards/balance-sp-${gameId}-${grade}.jpg` : `${origin}/share-cards/balance-${gameId}.jpg`;
  } else if (section === 'family') {
    /* 가족오락관(스피드퀴즈/몸으로말해요) 기록 공유 — 게임별 공용 이미지 1장 */
    const game = /^(speedquiz|charades|liar)$/.test(url.searchParams.get('game')) ? url.searchParams.get('game') : 'speedquiz';
    const gameName = { speedquiz: '스피드 퀴즈', charades: '몸으로 말해요', liar: '라이어 게임' }[game];
    const score = /^\d{1,3}$/.test(url.searchParams.get('score')) ? url.searchParams.get('score') : null;
    const time = /^\d{2,3}$/.test(url.searchParams.get('time')) ? url.searchParams.get('time') : null;
    const cat = url.searchParams.get('cat') || '';
    rawTitle = `${rawNickname} 팀의 ${gameName} 기록`;
    rawDescription = score ? `${cat ? cat + ' ' : ''}${time ? time + '초에 ' : ''}${score}개 정답! 우리 가족도 도전해볼까? 👉` : '폰 하나로 바로 하는 온가족 게임 — 과몰입 연구소에서 해보세요 👉';
    imageUrl = `${origin}/share-cards/family-${game}.jpg`;
    cta = '🎲 우리도 해보기';
  } else if (section === 'worldcup') {
    const championId = WORLDCUP_MEMES[url.searchParams.get('champion')] ? url.searchParams.get('champion') : 'nunnun';
    const meme = WORLDCUP_MEMES[championId];
    rawTitle = `내 인생 밈은 ${meme.title}!`;
    rawDescription = `${meme.desc} — 너는 뭐 나올 것 같아? 과몰입 연구소에서 확인해보세요 👉`;
    imageUrl = `${origin}/assets/worldcup/${championId}.jpg`;
    cta = '🏆 나도 해보기';
  }

  const title = esc(rawTitle);
  const description = esc(rawDescription);
  const redirectUrl = buildPreviewRedirect(origin, { next: section, rawTitle, rawDescription, imageUrl, cta, vsPayload, extra });

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
