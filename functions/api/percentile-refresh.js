/* v0.0.45 | 5-in-1 Dashboard SPA — functions/api/percentile-refresh.js
   Stage D 2단계: Tier(S~D) 채점 8개 테스트의 test_results를 집계해 percentile_cache에 upsert.
   service_role 키를 쓰는 유일한 지점 — GitHub Actions cron이 X-Cron-Secret 헤더로만 호출 가능하도록 보호.
   퍼센타일 정의: 해당 등급 "이상"을 받은 사람 비율 (예: S등급 10% → S등급은 상위 10%) */

const SECTIONS = ['brain', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus'];
const TIER_ORDER = ['S', 'A', 'B', 'C', 'D'];

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
      `${env.SUPABASE_URL}/rest/v1/test_results?select=tier&section=eq.${section}`,
      { headers: supabaseHeaders }
    );
    if (!res.ok) continue;
    const results = await res.json();
    const total = results.length;
    if (total === 0) continue;

    const tierCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    results.forEach(r => { if (tierCounts[r.tier] !== undefined) tierCounts[r.tier]++; });

    let cumulative = 0;
    for (const tier of TIER_ORDER) {
      cumulative += tierCounts[tier];
      rows.push({
        section,
        tier,
        percentile: Math.round((cumulative / total) * 100),
        updated_at: new Date().toISOString(),
      });
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
