/* v0.0.53 | 5-in-1 Dashboard SPA — supabase-client.js
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
ensureAnonSession();

/* ══════════════════════════════════════════════════
   🔑 로그인 (v0.9.5~) — 온라인 랭킹(기기간 동기화)을 위한 토대. 댓글 등 다른 기능은 로그인 없이도
   전부 동작하므로 이건 순수 확장 기능. 기존 익명 세션에 linkIdentity로 "업그레이드"하는 방식이라
   지금까지 쌓인 XP/스트릭/완주기록(같은 user_id)이 그대로 유지됨(Stage D 때 "Allow manual linking"을
   미리 켜둔 이유). 리다이렉트 방식 OAuth라 이 함수 호출 후 브라우저가 실제로 이동함 —
   돌아온 뒤에는 supabase-client.js가 페이지 로드 시 다시 실행되며 세션을 자동으로 인식함 */
async function loginWithProvider(provider) {
  try {
    const { error } = await window.sb.auth.linkIdentity({
      provider,
      options: { redirectTo: location.origin + '/#home' }
    });
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
function loginWithKakao() { return loginWithProvider('kakao'); }

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
