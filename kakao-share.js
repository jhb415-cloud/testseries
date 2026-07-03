/* v0.0.43 | 5-in-1 Dashboard SPA — kakao-share.js */

Kakao.init('0149c1c9d33b66ac289ee90d973cc243');

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
