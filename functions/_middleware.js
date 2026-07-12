/* v0.9.1~ | 5-in-1 Dashboard SPA — functions/_middleware.js
   www.gwamol-lab.xyz → gwamol-lab.xyz 301 리다이렉트 (2026-07-12).
   과거엔 카카오 디벨로퍼스 도메인 화이트리스트가 www 기준으로만 등록돼있어 이 리다이렉트를
   걸면 카카오 공유/로그인이 깨질까봐 의도적으로 스킵했었음([[project_stage_d_backend]] 메모리
   참고) — 이후 카카오 앱에 apex/www 양쪽 다 등록해둔 걸 확인해 지금은 안전하게 적용 가능.
   Cloudflare Pages Functions의 루트 미들웨어라 모든 경로(정적 파일 포함)에 적용됨.
   testseries1.pages.dev 등 다른 호스트명은 건드리지 않음(정확히 www.gwamol-lab.xyz만 매치). */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'www.gwamol-lab.xyz') {
    url.hostname = 'gwamol-lab.xyz';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
