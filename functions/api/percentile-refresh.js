/* v0.0.53 | 5-in-1 Dashboard SPA — functions/api/percentile-refresh.js
   Stage D 2단계: Tier(S~D) 채점 8개 테스트의 test_results를 집계해 percentile_cache에 upsert.
   service_role 키를 쓰는 유일한 지점 — GitHub Actions cron이 X-Cron-Secret 헤더로만 호출 가능하도록 보호.
   퍼센타일 정의: 해당 등급 "이상"을 받은 사람 비율 (예: S등급 10% → S등급은 상위 10%)
   v0.0.53~: HELL 난이도 추가에 맞춰 난이도별로 퍼센타일 풀을 분리(easy/normal/hard/hell) — "쉬움 S"와
   "HELL S"가 같은 취급을 받아 통계가 왜곡되던 문제 해결. difficulty는 test_results.payload(JSONB)에서
   꺼내오므로 스키마 변경 없이 조회 가능하지만, percentile_cache 쪽은 (section,tier) 유일성만으로는
   난이도별 행을 구분 못 해 difficulty 컬럼 추가 + 복합 UNIQUE 제약 마이그레이션이 필요함(SQL은 별도 안내). */

const SECTIONS = ['brain', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus'];
const TIER_ORDER = ['S', 'A', 'B', 'C', 'D'];
const DIFFICULTIES = ['easy', 'normal', 'hard', 'hell'];
const MIN_SAMPLE_SIZE = 5; // 클라이언트에 "상위 %"를 노출하려면 섹션+난이도당 최소 이 정도 표본은 쌓여야 함

export async function onRequestPost(context) {
  const { request, env } = context;

  const secret = request.headers.get('X-Cron-Secret');
  if (!secret || secret !== env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  const rows = [];
  for (const section of SECTIONS) {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/test_results?select=tier,difficulty:payload->>difficulty&section=eq.${section}`,
      { headers: supabaseHeaders }
    );
    if (!res.ok) continue;
    const results = await res.json();

    for (const difficulty of DIFFICULTIES) {
      // difficulty가 없는 레거시 row(HELL 도입 이전에 저장된 기록)는 'normal'로 간주해 호환 유지
      const subset = results.filter(r => (r.difficulty || 'normal') === difficulty);
      const total = subset.length;
      if (total < MIN_SAMPLE_SIZE) continue; // 표본 부족(5개 미만)한 section+difficulty는 퍼센타일을 아예 발행하지 않음

      const tierCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
      subset.forEach(r => { if (tierCounts[r.tier] !== undefined) tierCounts[r.tier]++; });

      let cumulative = 0;
      for (const tier of TIER_ORDER) {
        cumulative += tierCounts[tier];
        rows.push({
          section,
          difficulty,
          tier,
          percentile: Math.round((cumulative / total) * 100),
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  if (rows.length === 0) {
    return new Response(JSON.stringify({ ok: true, updated: 0, note: '집계할 데이터가 없습니다.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upsertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/percentile_cache`, {
    method: 'POST',
    headers: { ...supabaseHeaders, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(rows),
  });

  if (!upsertRes.ok) {
    const errText = await upsertRes.text();
    return new Response(JSON.stringify({ ok: false, error: errText }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, updated: rows.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
