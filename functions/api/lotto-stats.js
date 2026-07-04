/* v0.0.46 | 5-in-1 Dashboard SPA — functions/api/lotto-stats.js
   로또 통계기반 추천용 프록시. 과거 당첨번호는 불변 데이터라 실시간 크롤링이 필요 없음.
   1차 소스: GitHub Pages 미러(smok95.github.io/lotto) — 매주 토요일 추첨 직후 자동 갱신,
   dhlottery.co.kr와 달리 데이터센터 IP 차단이 없어 Cloudflare Functions에서 접근 가능.
   2차 폴백: dhlottery 비공식 엔드포인트(getLottoNumber) — 차단이 풀리면 자동으로 다시 동작. */

const ROUNDS = 30;
const MIRROR_ALL = 'https://smok95.github.io/lotto/results/all.json';

/* 1차: GitHub Pages 미러에서 전체 회차를 받아 최근 ROUNDS개만 사용 */
async function fetchFromMirror() {
  try {
    const res = await fetch(MIRROR_ALL);
    if (!res.ok) return null;
    const all = await res.json();
    if (!Array.isArray(all) || all.length === 0) return null;
    const draws = all.slice(-ROUNDS)
      .map(d => ({
        round: d.draw_no,
        date: typeof d.date === 'string' ? d.date.slice(0, 10) : '',
        numbers: d.numbers,
        bonus: d.bonus_no,
      }))
      .filter(d => Number.isInteger(d.round) && Array.isArray(d.numbers) && d.numbers.length === 6);
    return draws.length ? draws : null;
  } catch (e) {
    return null;
  }
}

/* 2차 폴백: dhlottery 직접 조회 (데이터센터 IP 차단 상태면 조용히 실패) */
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
    return {
      round: data.drwNo,
      date: data.drwNoDate,
      numbers: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
      bonus: data.bnusNo,
    };
  } catch (e) {
    return null;
  }
}

async function fetchFromDhlottery() {
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
  if (!latest) return null;

  const startRound = Math.max(1, latestRound - ROUNDS + 1);
  const roundNumbers = [];
  for (let n = startRound; n < latestRound; n++) roundNumbers.push(n);

  const draws = (await Promise.all(roundNumbers.map(fetchRound))).filter(Boolean);
  draws.push(latest);
  return draws;
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

    let source = 'mirror';
    let draws = await fetchFromMirror();
    if (!draws) {
      source = 'dhlottery';
      draws = await fetchFromDhlottery();
    }
    if (!draws) {
      return new Response(JSON.stringify({ error: '로또 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const frequency = {};
    for (let i = 1; i <= 45; i++) frequency[i] = 0;
    draws.forEach(d => d.numbers.forEach(n => { frequency[n]++; }));

    const latest = draws[draws.length - 1];
    /* v0.1.3~: 최신 회차 1개만 보여주던 것을 최근 5회차로 확대(최신순 정렬) */
    const recentRounds = draws.slice(-5).reverse().map(d => ({
      round: d.round, date: d.date, numbers: d.numbers, bonus: d.bonus,
    }));
    const body = JSON.stringify({
      frequency,
      roundsUsed: draws.length,
      latestRound: latest.round,
      latestDrawDate: latest.date,
      latestNumbers: latest.numbers,
      latestBonus: latest.bonus,
      recentRounds,
      source,
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
