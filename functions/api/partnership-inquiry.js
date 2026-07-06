/* v0.3.4 | 5-in-1 Dashboard SPA — functions/api/partnership-inquiry.js
   푸터 "제휴문의" 폼 제출 → Slack 인커밍 웹훅으로 전달.
   SLACK_WEBHOOK_URL은 Cloudflare Pages 환경변수(Secret)로 등록, 코드에는 두지 않음. */

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid body' }), { status: 400 });
  }

  const name = (body.name || '').toString().trim().slice(0, 60);
  const email = (body.email || '').toString().trim().slice(0, 120);
  const message = (body.message || '').toString().trim().slice(0, 2000);
  const honeypot = (body.website || '').toString().trim();

  // 스팸봇 방지용 허니팟 — 사람 눈에는 안 보이는 필드라 봇만 채움. 채워져 있으면 조용히 성공 처리(봇에게 힌트 안 줌)
  if (honeypot) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return new Response(JSON.stringify({ ok: false, error: '이메일과 제안 내용을 확인해주세요.' }), { status: 400 });
  }

  if (!env.SLACK_WEBHOOK_URL) {
    return new Response(JSON.stringify({ ok: false, error: 'not configured' }), { status: 500 });
  }

  const text = [
    '📮 *새 제휴문의*',
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
      return new Response(JSON.stringify({ ok: false, error: 'slack delivery failed' }), { status: 502 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'slack delivery failed' }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
