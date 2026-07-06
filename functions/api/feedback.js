/* v0.3.5 | 5-in-1 Dashboard SPA — functions/api/feedback.js
   푸터 "의견 보내기" 폼 제출 → Slack 인커밍 웹훅으로 전달 (제휴문의와 같은 채널/같은 웹훅 재사용, 메시지 접두어로만 구분).
   SLACK_WEBHOOK_URL은 Cloudflare Pages 환경변수(Secret)로 등록, 코드에는 두지 않음.
   사진 첨부는 아직 미지원(R2 스토리지 설정 후 추가 예정) — 텍스트만 우선 전달. */

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

  if (honeypot) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (!message) {
    return new Response(JSON.stringify({ ok: false, error: '의견 내용을 입력해주세요.' }), { status: 400 });
  }

  if (!env.SLACK_WEBHOOK_URL) {
    return new Response(JSON.stringify({ ok: false, error: 'not configured' }), { status: 500 });
  }

  const text = [
    '💬 *새 의견보내기*',
    `*이름*: ${name || '(미입력)'}`,
    `*이메일*: ${email || '(미입력)'}`,
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
