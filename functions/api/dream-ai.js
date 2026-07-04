/* v0.1.1 | 5-in-1 Dashboard SPA — functions/api/dream-ai.js
   PRD 10-4 3단계: 꿈해몽 검색 실패 시에만 호출되는 AI 폴백(사용자가 "🤖 AI 해몽으로 찾아보기"
   버튼을 직접 눌러야 호출됨, 자동 호출 없음 — 비용·남용 통제).
   OpenAI(gpt-4o-mini) + Structured Outputs로 기존 dreamData와 동일한 포맷
   (title/summary/detail/lucky/luckyNum/action)의 JSON을 생성.
   같은 키워드는 Supabase dream_ai_cache에 캐싱해 전세계 사용자 통틀어 동일 쿼리당 1회만 과금됨.
   service_role 키를 쓰지만 percentile-refresh.js와 달리 실제 방문자가 버튼을 눌러야 호출되는
   공개 엔드포인트 — 키 자체는 이 서버 함수 밖으로 노출되지 않으므로 안전. */

const MAX_QUERY_LEN = 30;

const SYSTEM_PROMPT = `당신은 한국 전통 민속 꿈해몽(꿈풀이) 콘텐츠 작가입니다. 사용자가 입력한 꿈 키워드에 대해 아래 JSON 형식으로 해몽을 생성하세요.

- title: "OO 꿈" 또는 "OO하는 꿈" 형태의 짧은 제목 (15자 이내)
- summary: 핵심 의미를 한 줄로 (15자 이내)
- detail: 2문장 정도의 해몽 설명 (한국 전통 꿈해몽 관례를 참고해 재물운/애정운/건강운/관계 변화 등으로 해석, 과도하게 부정적이거나 무섭지 않게 균형 있는 톤으로)
- lucky: 행운의 색 1~2개
- luckyNum: 1~45 사이 숫자 2~3개, 쉼표로 구분 (예: "3, 17, 28")
- action: 오늘 해볼 수 있는 긍정적인 행동 제안 1문장

민속학적 참고 콘텐츠일 뿐 의학적·법적 조언이 아님을 감안해 안전하고 무해한 내용으로만 작성하세요. 반드시 JSON으로만 응답하세요.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  const rawQuery = (body && body.query || '').toString().trim().slice(0, MAX_QUERY_LEN);
  const query = rawQuery.replace(/\s+/g, ' ');
  if (query.length < 2) {
    return json({ error: '검색어가 너무 짧습니다.' }, 400);
  }

  if (!env.OPENAI_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'AI 해몽 기능은 아직 준비 중입니다.' }, 503);
  }

  const supabaseHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1) 캐시 조회 (같은 키워드면 재생성 없이 즉시 반환)
  try {
    const cacheRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/dream_ai_cache?select=title,summary,detail,lucky,lucky_num,action&query=eq.${encodeURIComponent(query)}`,
      { headers: supabaseHeaders }
    );
    if (cacheRes.ok) {
      const rows = await cacheRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return json({ ...fromCacheRow(rows[0]), source: 'cache' });
      }
    }
  } catch (e) {
    /* 캐시 조회 실패 시에도 AI 생성으로 계속 진행 */
  }

  // 2) OpenAI 호출
  let ai;
  try {
    ai = await generateWithOpenAI(query, env.OPENAI_API_KEY);
  } catch (e) {
    return json({ error: 'AI 해몽 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' }, 502);
  }

  // 3) 캐시 저장 (실패해도 이미 생성된 결과는 그대로 반환 — 다음 요청에서 재생성될 뿐 사용자 경험엔 영향 없음)
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/dream_ai_cache`, {
      method: 'POST',
      headers: { ...supabaseHeaders, Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify({
        query,
        title: ai.title,
        summary: ai.summary,
        detail: ai.detail,
        lucky: ai.lucky,
        lucky_num: ai.luckyNum,
        action: ai.action,
      }),
    });
  } catch (e) {
    /* 캐시 저장 실패는 무시 */
  }

  return json({ ...ai, source: 'ai' });
}

function fromCacheRow(row) {
  return {
    title: row.title,
    summary: row.summary,
    detail: row.detail,
    lucky: row.lucky,
    luckyNum: row.lucky_num,
    action: row.action,
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function generateWithOpenAI(query, apiKey) {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      summary: { type: 'string' },
      detail: { type: 'string' },
      lucky: { type: 'string' },
      luckyNum: { type: 'string' },
      action: { type: 'string' },
    },
    required: ['title', 'summary', 'detail', 'lucky', 'luckyNum', 'action'],
    additionalProperties: false,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `꿈 키워드: "${query}"` },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'dream_interpretation', schema, strict: true },
      },
      max_tokens: 500,
      temperature: 0.8,
    }),
  });

  if (!res.ok) throw new Error('OpenAI API error: ' + res.status);
  const data = await res.json();
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) throw new Error('empty OpenAI response');
  const parsed = JSON.parse(content);

  // 필드 길이 안전장치 — 모델이 과도하게 길게 생성해도 프론트 레이아웃이 깨지지 않도록
  return {
    title: String(parsed.title || '').slice(0, 40),
    summary: String(parsed.summary || '').slice(0, 40),
    detail: String(parsed.detail || '').slice(0, 300),
    lucky: String(parsed.lucky || '').slice(0, 20),
    luckyNum: String(parsed.luckyNum || '').slice(0, 20),
    action: String(parsed.action || '').slice(0, 80),
  };
}
