/* v1.0.2 | 5-in-1 Dashboard SPA — supabase-client.js
   Stage D 1단계: 익명 인증 + test_results 이중 기록(로컬스토리지 유지 + Supabase에도 write)
   anon(publishable) 키는 RLS로 보호되는 공개 키라 하드코딩해도 안전함 — service_role 키는 절대 여기에 넣지 않음 */

const SUPABASE_URL = 'https://yovwvcjuadfieprvsooo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3FwRc74wSyRIvYGRPwXaSg_HaKNxdFZ';

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function ensureAnonSession() {
  try {
    const { data: { session } } = await window.sb.auth.getSession();
    if (session) return session;
    const { data, error } = await window.sb.auth.signInAnonymously();
    if (error) { console.error('Supabase 익명 로그인 실패:', error); return null; }
    return data.session;
  } catch (e) {
    console.error('Supabase 세션 확인 실패:', e);
    return null;
  }
}
/* v0.9.9~: 페이지 로드 즉시 ensureAnonSession()을 부르던 걸 제거 — OAuth 로그인 후 리다이렉트로
   막 돌아온 시점엔 Supabase 클라이언트가 URL의 인가 코드를 세션으로 교환하는 작업을 내부적으로
   비동기 처리 중인데, 이 타이밍에 곧바로 getSession()을 부르면 "아직 세션 없음"으로 보고
   새 익명 세션을 만들어버려 방금 로그인한 세션이 무시되는 경쟁 상태(race condition)가 있었음
   (실제로 로그인 후에도 is_anonymous:true로 남는 버그로 재현됨). onAuthStateChange의
   INITIAL_SESSION 이벤트는 이 초기 교환이 끝난 뒤에만 발생하므로, 그 시점에만 판단하도록 변경 */
/* v1.0.1~: v0.9.9 수정으로도 여전히 로그인 후 익명 세션으로 남는 문제가 재현됨 — 실제 원인은
   ensureAnonSession() 타이밍이 아니라, 이 앱이 해시(#) 기반 SPA 라우팅을 쓰는데
   app.js의 DOMContentLoaded 초기 라우팅이 곧바로 location.hash='home'으로 덮어써버려서,
   Supabase 클라이언트가 리다이렉트 URL에 실린 로그인 정보를 다 처리하기도 전에 그 정보가 든
   URL이 지워질 수 있는 구조적 경쟁이 있었음(요청 로그를 봐도 토큰 교환 요청 자체가 안 잡힘 —
   Supabase가 URL을 읽기도 전에 우리 라우팅이 먼저 덮어쓴 것으로 추정). INITIAL_SESSION이
   확정된 뒤에만 app.js가 초기 라우팅을 하도록 신호(sb-ready 이벤트)를 보내 순서를 강제함 */
window.sb.auth.onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION') {
    if (!session) ensureAnonSession();
    window.dispatchEvent(new CustomEvent('sb-ready'));
  }
});

/* ══════════════════════════════════════════════════
   🔑 로그인 (v0.9.5~) — 온라인 랭킹(기기간 동기화)을 위한 토대. 댓글 등 다른 기능은 로그인 없이도
   전부 동작하므로 이건 순수 확장 기능. 기존 익명 세션에 linkIdentity로 "업그레이드"하는 방식이라
   지금까지 쌓인 XP/스트릭/완주기록(같은 user_id)이 그대로 유지됨(Stage D 때 "Allow manual linking"을
   미리 켜둔 이유). 리다이렉트 방식 OAuth라 이 함수 호출 후 브라우저가 실제로 이동함 —
   돌아온 뒤에는 supabase-client.js가 페이지 로드 시 다시 실행되며 세션을 자동으로 인식함 */
async function loginWithProvider(provider, scopes) {
  try {
    /* handleOAuthRedirectError()가 리다이렉트로 돌아온 뒤 어떤 provider로 재시도할지 알아야 해서
       기억해둠(리다이렉트 방식이라 이 함수의 반환값/state로는 전달 불가, sessionStorage로 왕복) */
    sessionStorage.setItem('oauth_last_provider', provider);
    /* v1.0.2~: redirectTo에 '#home' 같은 해시를 절대 넣지 말 것 — GoTrue는 implicit flow 성공 시
       redirectURL + "#" + 토큰파라미터를 "문자열로 그냥 이어붙여" 반환하므로(서버 소스 확인),
       해시가 이미 있으면 최종 URL이 /#home#access_token=... 이 되고 supabase-js가 첫 파라미터
       이름을 "home#access_token"으로 읽어 토큰을 통째로 무시 → 로그인해도 계속 익명으로 남고
       identity_already_exists 무한 루프가 생기는 실제 버그의 근본 원인이었음.
       해시 없이 돌아와도 초기 라우팅이 기본값 home으로 진입하므로 UX 차이 없음 */
    const options = { redirectTo: location.origin + '/' };
    /* scopes==='' (빈 문자열)도 "명시적으로 스코프 없음"이라는 유효한 값이라 falsy 체크(if(scopes))가 아니라
       undefined 여부로만 판단해야 함 — 예전엔 if(scopes)라 빈 문자열이 무시되고 Supabase 기본 스코프
       (account_email,profile_image,profile_nickname)가 그대로 요청돼 카카오 KOE205 에러가 났었음 */
    if (scopes !== undefined) options.scopes = scopes;
    const { error } = await window.sb.auth.linkIdentity({ provider, options });
    if (error) {
      console.error(`${provider} 로그인 연결 실패:`, error);
      if (typeof showToast === 'function') showToast('로그인에 실패했어요. 다시 시도해주세요');
      return false;
    }
    return true; /* 성공 시 브라우저가 곧바로 리다이렉트되어 이 반환값은 보통 의미 없음 */
  } catch (e) {
    console.error(`${provider} 로그인 오류:`, e);
    if (typeof showToast === 'function') showToast('로그인에 실패했어요. 다시 시도해주세요');
    return false;
  }
}
function loginWithGoogle() { return loginWithProvider('google'); }
/* ⚠️ 카카오 KOE205는 클라이언트 코드로 못 고침 — 여기서 스코프를 비워 넘겨도 소용없음(v0.9.6/0.9.7의
   "빈 스코프로 해결"은 틀린 전제였음). Supabase 인증 서버(GoTrue)의 카카오 provider가
   account_email/profile_image/profile_nickname 세 스코프를 소스에 하드코딩해두고, 우리가 넘기는
   스코프는 거기에 "추가"만 될 뿐 절대 제거되지 않기 때문(supabase/auth internal/api/provider/kakao.go).
   → 유일한 해결책은 카카오 개발자 콘솔에서 세 동의항목을 전부 켜는 것. 특히 account_email은
     '앱 설정 > 비즈니스 > 개인 개발자 비즈니스 전환'(사업자등록증 불필요, 무료)을 먼저 해야 켤 수 있음.
     세 항목을 '선택 동의'로 켜면 KOE205 사라짐(이메일 실제 수신까지는 필요 없고, 우리는 안 씀).
   빈 문자열은 이제 아무 효과도 없으므로 제거하고 기본값으로 호출 */
function loginWithKakao() { return loginWithProvider('kakao'); }

/* 로그아웃(v0.9.10~) — 세션을 완전히 끝내고 새 익명 세션으로 즉시 되돌림(로그인 전과 동일한
   "기록이 이 기기에만 로컬로 남는" 상태). 같은 계정으로 다시 로그인하면 identity_already_exists
   흐름을 통해 원래 계정으로 다시 돌아올 수 있음(위 handleOAuthRedirectError 참고) */
async function logout() {
  try {
    await window.sb.auth.signOut();
    await ensureAnonSession();
    if (typeof renderHomeIdentity === 'function') renderHomeIdentity();
    if (typeof initHomeLoginState === 'function') initHomeLoginState();
    if (typeof showToast === 'function') showToast('👋 로그아웃 완료');
  } catch (e) {
    console.error('로그아웃 실패:', e);
    if (typeof showToast === 'function') showToast('로그아웃에 실패했어요');
  }
}

/* ══════════════════════════════════════════════════
   🔀 이미 다른 계정에 연결된 소셜 아이디로 재시도한 경우 (v0.9.8~)
   linkIdentity는 "현재 익명 세션에 이 소셜 계정을 새로 연결"하는 동작이라, 그 소셜 계정이
   이미 다른 user_id에 연결돼 있으면 서버가 거부함(error_code=identity_already_exists) — 이건
   JS Promise 에러가 아니라 리다이렉트 URL 쿼리스트링으로 돌아오므로 페이지 로드 시점에
   별도로 파싱해서 처리해야 함(app.js DOMContentLoaded에서 호출).
   이 경우 "연결"이 아니라 "그 기존 계정으로 갈아타는 일반 로그인"(signInWithOAuth)으로
   대체 시도 — 지금 이 기기의 진행 기록(로컬/현재 익명 user_id)은 그 기존 계정 것으로
   대체됨을 사용자에게 명확히 안내한 뒤 진행 */
async function handleOAuthRedirectError() {
  const params = new URLSearchParams(location.search);
  const errorCode = params.get('error_code');
  if (!errorCode) return;
  history.replaceState(null, '', location.pathname + location.hash); /* 에러 쿼리스트링 정리 */
  if (errorCode === 'identity_already_exists') {
    const provider = sessionStorage.getItem('oauth_last_provider');
    if (!provider) return;
    if (confirm('이 계정은 이미 다른 기기(또는 이전 시도)에서 로그인에 사용됐어요.\n그 계정으로 전환해서 로그인할까요? (지금 기기의 로컬 진행 기록은 유지되지 않아요)')) {
      try {
        const options = { redirectTo: location.origin + '/' }; /* '#home' 금지 — 위 loginWithProvider 주석 참고 (v1.0.2) */
        const { error } = await window.sb.auth.signInWithOAuth({ provider, options });
        if (error) { console.error('기존 계정 로그인 실패:', error); if (typeof showToast === 'function') showToast('로그인에 실패했어요. 다시 시도해주세요'); }
      } catch (e) { console.error('기존 계정 로그인 오류:', e); }
    }
  } else {
    console.error('OAuth 리다이렉트 에러:', errorCode, params.get('error_description'));
    if (typeof showToast === 'function') showToast('로그인 중 문제가 발생했어요');
  }
}

/* saveRanking()에서 호출 — 실패해도 로컬스토리지 기록엔 영향 없도록 항상 catch로 감쌈
   difficulty는 Tier 채점 8개 테스트만 실제 값(easy/normal/hard/hell)을 넘기고, 나머지 7개 테스트는 undefined —
   payload에 그대로 저장해두면 percentile-refresh.js가 난이도별로 나눠 집계할 수 있음 (v0.0.53~) */
async function syncResultToSupabase(section, nickname, result, difficulty) {
  try {
    const session = await ensureAnonSession();
    if (!session) return;
    const userId = session.user.id;

    await window.sb.from('profiles').upsert({ id: userId, nickname });

    const tier = typeof parseTierFromResult === 'function' ? parseTierFromResult(result) : null;
    await window.sb.from('test_results').insert({
      user_id: userId,
      section,
      tier,
      payload: { nickname, result, difficulty: difficulty || null },
    });
  } catch (e) {
    console.error('Supabase 결과 동기화 실패(로컬 기록은 정상 유지됨):', e);
  }
}
