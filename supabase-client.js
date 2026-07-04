/* v0.0.46 | 5-in-1 Dashboard SPA — supabase-client.js
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

/* saveRanking()에서 호출 — 실패해도 로컬스토리지 기록엔 영향 없도록 항상 catch로 감쌈 */
async function syncResultToSupabase(section, nickname, result) {
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
      payload: { nickname, result },
    });
  } catch (e) {
    console.error('Supabase 결과 동기화 실패(로컬 기록은 정상 유지됨):', e);
  }
}
