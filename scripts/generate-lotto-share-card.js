/* v0.1.3 | 5-in-1 Dashboard SPA — scripts/generate-lotto-share-card.js
   로또 조합기/직접뽑기 공유용 범용 정적 이미지(1200x630 JPEG) 1장 생성.
   숫자는 매번 달라 개인화된 이미지를 만들 수 없어 "행운 번호 공유해요~" 톤의 범용 홍보 이미지로 제작,
   실제 번호는 카카오 공유 카드의 title/description(클라이언트에서 직접 채움)에 텍스트로 담는다.
   실행: node scripts/generate-lotto-share-card.js (Playwright 필요, 로컬에 fonts-noto-cjk 설치돼있어야 함) */

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1200px; height:630px; overflow:hidden;
    font-family:'Noto Sans CJK KR','Noto Sans','Noto Color Emoji',sans-serif;
    background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #0f0a02 100%);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    position:relative;
  }
  /* v0.1.8~: 카카오톡이 1200x630을 약 1:1(중앙 630px)로 크롭해 보여줘서 모든 요소를
     중앙 540px 안전영역 안에 배치 (generate-share-cards.js와 동일한 규칙) */
  .balls { display:flex; gap:18px; margin-bottom:30px; }
  .ball {
    width:74px; height:74px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-weight:900; font-size:32px; color:#fff; text-shadow:0 2px 4px rgba(0,0,0,0.35);
    box-shadow: inset 0 -8px 14px rgba(0,0,0,0.25), inset 0 6px 10px rgba(255,255,255,0.25), 0 8px 18px rgba(0,0,0,0.35);
  }
  .title {
    font-weight:900; font-size:46px; color:#f8fafc; text-align:center;
    max-width:540px; line-height:1.3; word-break:keep-all; overflow-wrap:break-word;
    text-shadow: 0 4px 16px rgba(0,0,0,0.4); margin-bottom:16px;
  }
  .tip {
    font-size:24px; color:rgba(241,245,249,0.75); text-align:center;
    max-width:540px; line-height:1.5; word-break:keep-all; overflow-wrap:break-word;
  }
  .wordmark {
    position:absolute; bottom:30px; left:50%; transform:translateX(-50%);
    font-size:24px; color:rgba(241,245,249,0.55); font-weight:700; white-space:nowrap;
  }
</style></head><body>
  <div class="balls">
    <div class="ball" style="background:radial-gradient(circle at 32% 28%,#fff 0%,#ffdc60 22%,#fbc400 62%,#b28b00 100%);">7</div>
    <div class="ball" style="background:radial-gradient(circle at 32% 28%,#fff 0%,#9fdcf8 22%,#69c8f2 62%,#3f9fd0 100%);">14</div>
    <div class="ball" style="background:radial-gradient(circle at 32% 28%,#fff 0%,#ff9c9c 22%,#ff7272 62%,#d94f4f 100%);">21</div>
    <div class="ball" style="background:radial-gradient(circle at 32% 28%,#fff 0%,#ff9c9c 22%,#ff7272 62%,#d94f4f 100%);">27</div>
    <div class="ball" style="background:radial-gradient(circle at 32% 28%,#fff 0%,#c4c9d4 22%,#9aa2b1 62%,#6b7280 100%);">33</div>
    <div class="ball" style="background:radial-gradient(circle at 32% 28%,#fff 0%,#cbe873 22%,#b0d840 62%,#84ab24 100%);">41</div>
  </div>
  <div class="title">🍀 행운의 번호를 뽑았어요!</div>
  <div class="tip">과몰입 연구소 로또 번호 조합기로 나도 뽑아보기 👉</div>
  <div class="wordmark">🧪 과몰입 연구소</div>
</body></html>`;

async function main() {
  const outDir = path.join(__dirname, '..', 'share-cards');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html);
  await page.screenshot({ path: path.join(outDir, 'lotto-share.jpg'), type: 'jpeg', quality: 85 });
  await browser.close();
  console.log('✅ share-cards/lotto-share.jpg 생성 완료');
}

main();
