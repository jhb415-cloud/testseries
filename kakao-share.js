/* v0.2.1 | 5-in-1 Dashboard SPA — kakao-share.js
   개인 계정으로 새로 만든 Kakao Developers 앱의 JavaScript 키로 교체 (기존 앱이 회사 계정에
   잘못 연결돼있던 문제 수정). 신규 앱에는 기존 도메인(testseries1.pages.dev)과 도메인 이전
   예정인 www.gwamol-lab.xyz 둘 다 미리 등록해둬 도메인 전환 시 카카오 쪽 재작업이 없도록 함 */

Kakao.init('3e54f92e9a63142650381c63b1cadee3');

function shareToKakao(text) {
  try {
    if (!window.Kakao || !Kakao.isInitialized()) { showToast('카카오 공유 준비 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    Kakao.Share.sendDefault({
      objectType: 'text',
      text,
      link: { mobileWebUrl: location.href, webUrl: location.href },
    });
  } catch (e) {
    console.error('카카오 공유 실패:', e);
    showToast('카카오 공유에 실패했습니다.');
  }
}
