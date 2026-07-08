/* v0.5.1 | 5-in-1 Dashboard SPA — scripts/generate-og-card.js
   SEO 착수(구글/네이버 가이드 반영)로 루트 페이지(index.html)에 og:image/twitter:image가 신설되며
   필요해진 사이트 대표 카드 이미지. generate-dream-generic-card.js와 동일한 "범용 티저 카드" 패턴
   재사용(테마 색상만 브랜드 로고의 청록/주황 톤으로 교체), 안전영역 검증 로직도 그대로 가져옴.
   실행: node scripts/generate-og-card.js (Playwright 필요) */

const path = require('path');
const { chromium } = require('playwright');

function cardHTML({ scale = 1 }) {
  const px = (n) => Math.round(n * scale);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:1200px; height:630px; overflow:hidden;
      font-family:'Noto Sans CJK KR','Noto Sans','Noto Color Emoji',sans-serif;
      background: linear-gradient(135deg, #0f2e2e 0%, #0c0a1f 100%);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      position:relative;
    }
    .emoji { font-size:${px(120)}px; line-height:1; margin-bottom:${px(18)}px; text-align:center; }
    .title {
      font-weight:900; font-size:${px(52)}px; color:#f1f5f9; text-align:center;
      max-width:560px; line-height:1.3; text-shadow: 0 4px 16px rgba(0,0,0,0.4);
      margin-bottom:${px(16)}px; word-break:keep-all; overflow-wrap:break-word;
    }
    .tip {
      font-size:${px(26)}px; color:rgba(241,245,249,0.8); text-align:center;
      max-width:560px; line-height:1.5; word-break:keep-all; overflow-wrap:break-word;
    }
    .wordmark {
      position:absolute; bottom:30px; left:50%; transform:translateX(-50%);
      font-size:24px; color:rgba(45,212,191,0.75); font-weight:700; white-space:nowrap;
    }
  </style></head><body>
    <div class="content">
      <div class="emoji">🧪⚡</div>
      <div class="title">과몰입 연구소</div>
      <div class="tip">재미로 시작했다가 뼈 맞고 공유하는<br/>종합 테스트 모음</div>
    </div>
    <div class="wordmark">gwamol-lab.xyz</div>
  </body></html>`;
}

async function main() {
  const outDir = path.join(__dirname, '..', 'share-cards');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  const SAFE_LEFT = 315, SAFE_RIGHT = 885, MAX_CONTENT_H = 445;
  for (const scale of [1, 0.9, 0.8]) {
    await page.setContent(cardHTML({ scale }));
    const ok = await page.evaluate(({ SAFE_LEFT, SAFE_RIGHT, MAX_CONTENT_H }) => {
      const content = document.querySelector('.content') || document.body;
      for (const sel of ['.title', '.tip']) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.left < SAFE_LEFT || r.right > SAFE_RIGHT) return false;
        if (el.scrollWidth > el.clientWidth + 2) return false;
      }
      return true;
    }, { SAFE_LEFT, SAFE_RIGHT, MAX_CONTENT_H });
    if (ok) {
      await page.screenshot({ path: path.join(outDir, 'og-default.jpg'), type: 'jpeg', quality: 85 });
      console.log(`생성 완료: og-default.jpg (scale=${scale})`);
      await browser.close();
      return;
    }
  }
  console.error('안전영역 검증 실패 — scale 0.8에서도 잘림 발생');
  await browser.close();
  process.exit(1);
}

main();
