/* v0.1.8 | 5-in-1 Dashboard SPA — scripts/generate-dream-generic-card.js
   꿈해몽 공유 카드를 테마별 174장 대신 범용 1장으로 통일하기 위한 1회성 생성 스크립트.
   AI 해몽(테마 인덱스 없음)이 항상 dream-0.jpg("하늘을 나는 꿈")로 나오던 문제 + 어떤 꿈이든
   같은 이미지가 나오는 걸 "당연한 범용 티저"로 재정의: 실제 꿈 내용은 이미지가 아니라
   클릭 후 shared-preview 화면에서 재현되므로, 카드 자체는 호기심 유발용 고정 문구로 통일.
   실행: node scripts/generate-dream-generic-card.js (Playwright 필요) */

const path = require('path');
const { chromium } = require('playwright');

const DREAM_THEME = { bgFrom: '#2e1065', bgTo: '#0c0a1f', accent: '#c4b5fd', badgeBg: '#4c1d95' };

function themedCardHTML({ bgFrom, bgTo, accent, badgeBg, badge, emoji, title, subtitle, scale = 1 }) {
  const px = (n) => Math.round(n * scale);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:1200px; height:630px; overflow:hidden;
      font-family:'Noto Sans CJK KR','Noto Sans','Noto Color Emoji',sans-serif;
      background: linear-gradient(135deg, ${bgFrom} 0%, ${bgTo} 100%);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      position:relative;
    }
    .badge {
      position:absolute; top:34px; left:50%; transform:translateX(-50%);
      background:${badgeBg}; color:${accent}; border:3px solid ${accent};
      font-weight:900; font-size:${px(28)}px; padding:${px(8)}px ${px(24)}px; border-radius:14px;
      letter-spacing:1px; white-space:nowrap;
    }
    .content { display:flex; flex-direction:column; align-items:center; }
    .emoji { font-size:${px(120)}px; line-height:1; margin-bottom:${px(18)}px; text-align:center; }
    .title {
      font-weight:900; font-size:${px(44)}px; color:#f1f5f9; text-align:center;
      max-width:540px; line-height:1.3; text-shadow: 0 4px 16px rgba(0,0,0,0.4);
      margin-bottom:${px(14)}px; word-break:keep-all; overflow-wrap:break-word;
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
    ${badge ? `<div class="badge">${badge}</div>` : ''}
    <div class="content">
      <div class="emoji">${emoji}</div>
      <div class="title">${title}</div>
      ${subtitle ? `<div class="tip">${subtitle}</div>` : ''}
    </div>
    <div class="wordmark">🧪 과몰입 연구소</div>
  </body></html>`;
}

async function main() {
  const outDir = path.join(__dirname, '..', 'share-cards');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  const SAFE_LEFT = 315, SAFE_RIGHT = 885, MAX_CONTENT_H = 445;
  const shot = async (params, filename) => {
    for (const scale of [1, 0.9, 0.8]) {
      await page.setContent(themedCardHTML({ ...params, scale }));
      const ok = await page.evaluate(({ SAFE_LEFT, SAFE_RIGHT, MAX_CONTENT_H }) => {
        const content = document.querySelector('.content');
        if (content.getBoundingClientRect().height > MAX_CONTENT_H) return false;
        for (const sel of ['.badge', '.title', '.tip']) {
          const el = document.querySelector(sel);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.left < SAFE_LEFT || r.right > SAFE_RIGHT) return false;
          if (el.scrollWidth > el.clientWidth + 2) return false;
        }
        return true;
      }, { SAFE_LEFT, SAFE_RIGHT, MAX_CONTENT_H });
      if (ok) {
        await page.screenshot({ path: path.join(outDir, filename), type: 'jpeg', quality: 85 });
        console.log(`생성 완료: ${filename} (scale=${scale})`);
        return;
      }
    }
    throw new Error(`안전영역 검증 실패: ${filename}`);
  };

  await shot({
    ...DREAM_THEME,
    badge: '꿈 해몽',
    emoji: '🌙💭',
    title: '나 이런 꿈 꿨어',
    subtitle: '너도 꿈 꾼거 있으면 찾아볼래?',
  }, 'dream-share.jpg');

  await browser.close();
}

main();
