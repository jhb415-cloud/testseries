/* v0.0.6 | 과몰입 연구소 — functions/api/contact.js
   /contact/ 문의 폼 제출 → Slack 인커밍 웹훅으로 전달.
   partnership-inquiry.js와 동일 패턴(honeypot, Slack 웹훅, 응답 형식) 사용.
   SLACK_WEBHOOK_URL은 Cloudflare Pages 환경변수(Secret)로 등록, 코드에는 두지 않음. */

const CATEGORY_LABELS = {
  bug: '오류 제보',
  idea: '콘텐츠 제안',
  correction: '내용 정정 요청',
  partnership: '제휴 · 광고 문의',
  privacy: '개인정보 관련 요청',
  etc: '기타',
};

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: '요청 형식이 올바르지 않습니다.' }), { status: 400 });
  }

  const name = (body.name || '').toString().trim().slice(0, 40);
  const email = (body.email || '').toString().trim().slice(0, 120);
  const category = (body.category || '').toString().trim().slice(0, 20);
  const message = (body.message || '').toString().trim().slice(0, 2000);
  const honeypot = (body.website || '').toString().trim();

  // 스팸봇 방지용 허니팟 — 사람 눈에는 안 보이는 필드라 봇만 채움. 채워져 있으면 조용히 성공 처리(봇에게 힌트 안 줌)
  if (honeypot) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ ok: false, error: '이메일 주소를 확인해주세요.' }), { status: 400 });
  }
  if (message.length < 10 || message.length > 2000) {
    return new Response(JSON.stringify({ ok: false, error: '내용은 10자 이상 2000자 이하로 입력해주세요.' }), { status: 400 });
  }

  if (!env.SLACK_WEBHOOK_URL) {
    return new Response(JSON.stringify({ ok: false, error: '문의 접수가 일시적으로 불가능합니다.' }), { status: 500 });
  }

  const categoryLabel = CATEGORY_LABELS[category] || category || '(미선택)';
  const text = [
    '📮 *새 문의*',
    `*유형*: ${categoryLabel}`,
    `*이름*: ${name || '(미입력)'}`,
    `*이메일*: ${email}`,
    `*내용*:\n${message}`,
  ].join('\n');

  try {
    const slackRes = await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!slackRes.ok) {
      return new Response(JSON.stringify({ ok: false, error: '전송에 실패했습니다. 잠시 후 다시 시도해주세요.' }), { status: 502 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: '전송에 실패했습니다. 잠시 후 다시 시도해주세요.' }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
