/* v0.6.1 | 5-in-1 Dashboard SPA — scripts/generate-worldcup-share-cards.js
   이상형 월드컵 팩 시스템(v0.6.1~)의 emoji형 팩(lazy-hell-32/superpower-32)은 실제 사진이 없어
   우승 결과 공유 시 사용할 정적 카드를 아이템별로 미리 렌더링해둔다(64장, 심리테스트존/밸런스게임과
   동일 카드 렌더러 패턴 — scripts/generate-phase4-share-cards.js 참고, 이 스크립트는 독립 실행).
   image형 팩(cute-animals-32 등)은 실제 사진 경로를 og:image로 그대로 쓰므로 이 스크립트 대상이 아님.
   신규 emoji형 팩 추가 시 이 스크립트를 재실행하면 자동으로 새 아이템 이미지가 생성됨.
   실행: node scripts/generate-worldcup-share-cards.js (Playwright 필요) */

const path = require('path');
const { chromium } = require('playwright');

global.window = global;
require(path.join(__dirname, '..', 'data.js'));
const AppData = window.AppData;

const WC_THEME = { bgFrom: '#1a2e05', bgTo: '#0c0a1f', accent: '#bef264', badgeBg: '#365314' };

function cardHTML({ badge, emoji, title, subtitle, scale = 1 }) {
  const px = (n) => Math.round(n * scale);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:1200px; height:630px; overflow:hidden;
      font-family:'Noto Sans CJK KR','Noto Sans','Noto Color Emoji',sans-serif;
      background: linear-gradient(135deg, ${WC_THEME.bgFrom} 0%, ${WC_THEME.bgTo} 100%);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      position:relative;
    }
    .badge {
      position:absolute; top:34px; left:50%; transform:translateX(-50%);
      background:${WC_THEME.badgeBg}; color:${WC_THEME.accent}; border:3px solid ${WC_THEME.accent};
      font-weight:900; font-size:${px(28)}px; padding:${px(8)}px ${px(24)}px; border-radius:14px;
      letter-spacing:1px; white-space:nowrap;
    }
    .content { display:flex; flex-direction:column; align-items:center; }
    .emoji { font-size:${px(140)}px; line-height:1; margin-bottom:${px(20)}px; text-align:center; }
    .title {
      font-weight:900; font-size:${px(48)}px; color:#f1f5f9; text-align:center;
      max-width:540px; line-height:1.3; text-shadow: 0 4px 16px rgba(0,0,0,0.4);
      margin-bottom:${px(12)}px; word-break:keep-all; overflow-wrap:break-word;
    }
    .tip {
      font-size:${px(24)}px; color:rgba(241,245,249,0.78); text-align:center;
      max-width:540px; line-height:1.5; word-break:keep-all; overflow-wrap:break-word;
    }
    .wordmark {
      position:absolute; bottom:30px; left:50%; transform:translateX(-50%);
      font-size:24px; color:rgba(241,245,249,0.55); font-weight:700; white-space:nowrap;
    }
  </style></head><body>
    <div class="badge">${badge}</div>
    <div class="content">
      <div class="emoji">${emoji}</div>
      <div class="title">${title}</div>
      <div class="tip">${subtitle}</div>
    </div>
    <div class="wordmark">🏆 과몰입 연구소 · 이상형 월드컵</div>
  </body></html>`;
}

/* v0.1.8 안전영역 규칙과 동일: 배지/제목/팁이 카카오톡 1:1 크롭 안전영역(중앙 540px) 안에 들어오는지
   검증(엄밀 좌표 계산 대신 폭 제한선을 이미 CSS max-width:540px로 강제해뒀으므로, 여기서는 세로 넘침만
   실측 확인) — 세로 넘침 시 scale을 낮춰 재시도 */
async function shot(page, opts, outPath) {
  let scale = 1;
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.setContent(cardHTML({ ...opts, scale }));
    const overflow = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.badge,.title,.tip')];
      return els.some(el => {
        const r = el.getBoundingClientRect();
        return r.top < 0 || r.bottom > 630;
      });
    });
    if (!overflow) break;
    scale -= 0.1;
  }
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 88 });
  console.log(`생성 완료: ${path.basename(outPath)} (scale=${scale.toFixed(1)})`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const outDir = path.join(__dirname, '..', 'share-cards');

  const emojiPacks = (AppData.worldcupPacks || []).filter(p => p.type === 'emoji');
  for (const pack of emojiPacks) {
    for (const item of pack.items) {
      await shot(page, { badge: pack.title.replace(/^\p{Emoji}\s*/u, ''), emoji: item.emoji, title: item.name, subtitle: item.caption },
        path.join(outDir, `worldcup-${pack.packId}-${item.id}.jpg`));
    }
  }

  await browser.close();
  console.log(`이상형 월드컵 emoji형 팩 공유카드 ${emojiPacks.reduce((n, p) => n + p.items.length, 0)}장 생성 완료`);
})();
