/* v0.0.44 | 5-in-1 Dashboard SPA — functions/api/lotto-stats.js
   로또 통계기반 추천용 프록시. 브라우저에서 dhlottery.co.kr을 직접 호출하면 CORS로 막히기 때문에
   서버(Cloudflare Pages Function)에서 대신 가져와 번호별 출현 빈도만 계산해 돌려줌.
   동행복권 공식 오픈 API가 없어 널리 쓰이는 비공식 엔드포인트(getLottoNumber) 사용 — 언제든 바뀔 수 있음. */

const ROUNDS = 30; // Cloudflare Functions 서브요청 한도(50) 안에서 여유 있게

async function fetchRound(no) {
  try {
    const res = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${no}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('json')) return null; // 차단 페이지(HTML)가 오는 경우 방어
    const data = await res.json();
    if (data.returnValue !== 'success') return null;
    return data;
  } catch (e) {
    return null;
  }
}

export async function onRequestGet(context) {
  try {
    let cache = null;
    let cacheKey = null;
    try {
      cache = caches.default;
      cacheKey = new Request('https://cache.internal/lotto-stats');
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
    } catch (e) {
      cache = null; // Cache API 사용 불가 환경이어도 기능 자체는 계속 동작하게
    }

    // 1회차: 2002-12-07(KST), 매주 토요일 추첨 → 대략적인 최신 회차 추정 후 보정
    const FIRST_DRAW = Date.UTC(2002, 11, 7);
    const weeksSince = Math.floor((Date.now() - FIRST_DRAW) / (7 * 24 * 60 * 60 * 1000));
    let latestRound = weeksSince + 1;

    let latest = await fetchRound(latestRound);
    let tries = 0;
    while (!latest && tries < 3) {
      latestRound--;
      tries++;
      latest = await fetchRound(latestRound);
    }
    if (!latest) {
      return new Response(JSON.stringify({ error: '로또 데이터를 불러오지 못했습니다. 원본 사이트가 일시적으로 접근을 막고 있을 수 있습니다.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const startRound = Math.max(1, latestRound - ROUNDS + 1);
    const roundNumbers = [];
    for (let n = startRound; n < latestRound; n++) roundNumbers.push(n);

    const draws = await Promise.all(roundNumbers.map(fetchRound));
    draws.push(latest);

    const frequency = {};
    for (let i = 1; i <= 45; i++) frequency[i] = 0;
    draws.forEach(d => {
      if (!d) return;
      [d.drwtNo1, d.drwtNo2, d.drwtNo3, d.drwtNo4, d.drwtNo5, d.drwtNo6].forEach(n => { frequency[n]++; });
    });

    const body = JSON.stringify({
      frequency,
      roundsUsed: draws.filter(Boolean).length,
      latestRound,
      latestDrawDate: latest.drwNoDate,
    });

    const response = new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    });
    if (cache) context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (e) {
    return new Response(JSON.stringify({ error: '로또 통계를 처리하는 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
