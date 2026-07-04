/* v0.0.49 | 5-in-1 Dashboard SPA — scripts/generate-share-cards.js
   AppData.animalCards의 100개 조합 전부를 카카오톡/오픈그래프 공유용 정적 PNG(1200x630)로 렌더링.
   한 번 실행해서 share-cards/ 아래에 커밋해두는 용도 — 런타임에 돌리지 않음(빌드 도구 없음 원칙 유지).
   animalCards 데이터가 바뀌면(테스트/등급/문구 추가·수정) 이 스크립트를 다시 실행해서 이미지도 갱신할 것.
   실행: node scripts/generate-share-cards.js (Playwright 필요, 로컬에 fonts-noto-cjk 설치돼있어야 한글이 정상 렌더링됨) */

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

global.window = global;
require(path.join(__dirname, '..', 'data.js'));
const animalCards = window.AppData.animalCards;

const TIER_THEME = {
  S: { bgFrom: '#78350f', bgTo: '#0f0a02', accent: '#fbbf24', badgeBg: '#92400e' },
  A: { bgFrom: '#064e3b', bgTo: '#041b14', accent: '#34d399', badgeBg: '#065f46' },
  B: { bgFrom: '#1e3a5f', bgTo: '#0a1626', accent: '#60a5fa', badgeBg: '#1e40af' },
  C: { bgFrom: '#4c1d95', bgTo: '#170729', accent: '#a78bfa', badgeBg: '#5b21b6' },
  D: { bgFrom: '#881337', bgTo: '#2e0512', accent: '#fb7185', badgeBg: '#9f1239' },
};

function cardHTML(card, tier) {
  const t = TIER_THEME[tier];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:1200px; height:630px; overflow:hidden;
      font-family:'Noto Sans CJK KR','Noto Sans','Noto Color Emoji',sans-serif;
      background: linear-gradient(135deg, ${t.bgFrom} 0%, ${t.bgTo} 100%);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      position:relative;
    }
    .badge {
      position:absolute; top:48px; left:48px;
      background:${t.badgeBg}; color:${t.accent}; border:3px solid ${t.accent};
      font-weight:900; font-size:32px; padding:10px 28px; border-radius:16px;
      letter-spacing:1px;
    }
    .emoji { font-size:200px; line-height:1; margin-bottom:24px; text-align:center; }
    .title {
      font-weight:900; font-size:56px; color:#f1f5f9; text-align:center;
      max-width:1000px; line-height:1.3; text-shadow: 0 4px 16px rgba(0,0,0,0.4);
      margin-bottom:20px;
    }
    .tip {
      font-size:28px; color:rgba(241,245,249,0.75); text-align:center;
      max-width:920px; line-height:1.5;
    }
    .wordmark {
      position:absolute; bottom:36px; font-size:26px; color:rgba(241,245,249,0.55); font-weight:700;
    }
  </style></head><body>
    <div class="badge">Tier ${tier}</div>
    <div class="emoji">${card.emoji}</div>
    <div class="title">${card.title}</div>
    <div class="tip">${card.tip}</div>
    <div class="wordmark">🧪 과몰입 연구소</div>
  </body></html>`;
}

/* 친구 대결(도전장) 전용 공용 VS 이미지 1장 — 등급/닉네임과 무관하게 재사용, 텍스트는 카카오 카드 title/description으로 처리 */
function vsHTML() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:1200px; height:630px; overflow:hidden;
      font-family:'Noto Sans CJK KR','Noto Sans','Noto Color Emoji',sans-serif;
      background: linear-gradient(135deg, #1e3a5f 0%, #0f0a02 50%, #881337 100%);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      position:relative;
    }
    .emoji { font-size:220px; line-height:1; margin-bottom:16px; }
    .title { font-weight:900; font-size:60px; color:#f1f5f9; text-shadow: 0 4px 16px rgba(0,0,0,0.5); margin-bottom:16px; }
    .sub { font-size:30px; color:rgba(241,245,249,0.8); }
    .wordmark { position:absolute; bottom:36px; font-size:26px; color:rgba(241,245,249,0.55); font-weight:700; }
  </style></head><body>
    <div class="emoji">⚔️</div>
    <div class="title">친구 대결 도전장</div>
    <div class="sub">같은 테스트로 실력을 겨뤄보세요!</div>
    <div class="wordmark">🧪 과몰입 연구소</div>
  </body></html>`;
}

async function main() {
  const outDir = path.join(__dirname, '..', 'share-cards');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  let count = 0;
  for (const section of Object.keys(animalCards)) {
    for (const tier of ['S', 'A', 'B', 'C', 'D']) {
      const pool = animalCards[section][tier];
      for (let idx = 0; idx < pool.length; idx++) {
        const html = cardHTML(pool[idx], tier);
        await page.setContent(html);
        const filePath = path.join(outDir, `${section}-${tier}-${idx}.jpg`);
        await page.screenshot({ path: filePath, type: 'jpeg', quality: 85 });
        count++;
      }
    }
  }

  await page.setContent(vsHTML());
  await page.screenshot({ path: path.join(outDir, 'vs.jpg'), type: 'jpeg', quality: 85 });
  count++;

  await browser.close();
  console.log(`생성 완료: ${count}장 → ${outDir}`);
}

main();
