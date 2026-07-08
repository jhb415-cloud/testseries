/* v0.5.9 | 5-in-1 Dashboard SPA — assets/kkum-share.js
   /kkum/{slug}/ 정적 콘텐츠 페이지 전용 공유 스크립트. app.js의 shareToKakaoCard/shareFacebook/
   shareTwitter/shareBand/copyToClipboard와 같은 로직이지만, 정적 페이지는 app.js(전체 SPA 상태)를
   로드하지 않으므로 최소 의존성으로 독립 구현. 174개 페이지가 이 파일 하나를 공유(캐시 재사용).
   각 페이지는 <head>에서 window.__kkumShare = {url, title, desc, image}를 먼저 채워둔다. */

function kkumToast(msg) {
  let el = document.getElementById('kkum-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'kkum-toast';
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
      'background:#334155;color:#f1f5f9;padding:.7rem 1.2rem;border-radius:999px;font-size:.85rem;' +
      'z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.4);transition:opacity .3s;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

function kkumCopyLink() {
  const url = window.__kkumShare.url;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => kkumToast('링크가 복사되었습니다! 📋'));
  } else {
    const el = document.createElement('textarea');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    kkumToast('링크가 복사되었습니다! 📋');
  }
}

function kkumShareFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.__kkumShare.url)}`, '_blank', 'width=600,height=500');
}

function kkumShareTwitter() {
  const { url, title } = window.__kkumShare;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
}

function kkumShareBand() {
  const { url, title } = window.__kkumShare;
  window.open(`https://band.us/plugin/share?body=${encodeURIComponent(title + ' ' + url)}&route=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
}

function kkumShareKakao() {
  try {
    if (!window.Kakao || !Kakao.isInitialized()) { kkumToast('카카오 공유 준비 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    const { url, title, desc, image } = window.__kkumShare;
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: { title, description: desc, imageUrl: image, link: { mobileWebUrl: url, webUrl: url } },
      buttons: [{ title: '나도 꿈해몽 찾아보기', link: { mobileWebUrl: url, webUrl: url } }],
    });
  } catch (e) {
    console.error('카카오 공유 실패:', e);
    kkumToast('카카오 공유에 실패했습니다.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.Kakao && !Kakao.isInitialized()) Kakao.init('3e54f92e9a63142650381c63b1cadee3');
});
