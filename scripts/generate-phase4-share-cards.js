/* v0.2.3 | 5-in-1 Dashboard SPA — scripts/generate-phase4-share-cards.js
   Phase 4 수익화 로드맵 11-6(심리테스트존)/11-7(밸런스게임) 신규 콘텐츠의 공유 이미지 생성.
   기존 scripts/generate-share-cards.js와 같은 카드 렌더러(v0.1.8 안전영역 규칙)를 재사용 —
   신규 테스트/게임이 추가될 때마다 이 스크립트에 항목을 추가하고 재실행할 것.
   실행: node scripts/generate-phase4-share-cards.js (Playwright 필요) */

const path = require('path');
const { chromium } = require('playwright');

global.window = global;
require(path.join(__dirname, '..', 'data.js'));
const AppData = window.AppData;

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

/* 심리테스트존: 밸런스게임과 겹치지 않는 violet 톤(사이트 신규 메뉴 accent와 통일) */
const PSYCHTEST_THEME = { bgFrom: '#3b0764', bgTo: '#0c0a1f', accent: '#c4b5fd', badgeBg: '#4c1d95' };
/* 밸런스게임: emerald/rose 대비(A vs B 선택 구도를 색으로 은유) */
const BALANCE_THEME = { bgFrom: '#064e3b', bgTo: '#0c0a1f', accent: '#6ee7b7', badgeBg: '#065f46' };

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

  // 심리테스트존 — data.js의 AppData.psychTests를 그대로 순회(콘텐츠 이중 관리 방지, v0.2.4~)
  for (const t of AppData.psychTests) {
    for (const r of t.results) {
      await shot({ ...PSYCHTEST_THEME, badge: '심리테스트', emoji: r.emoji, title: r.title, subtitle: r.desc }, `psychtest-${t.id}-${r.grade}.jpg`);
    }
  }

  // 밸런스게임 — data.js의 AppData.balanceGames를 그대로 순회(선택 무관 게임당 공용 1장)
  for (const g of AppData.balanceGames) {
    await shot({ ...BALANCE_THEME, badge: '밸런스게임', emoji: g.emoji, title: g.title, subtitle: '당신의 선택은? 나도 골라보기' }, `balance-${g.id}.jpg`);
  }

  // 밸런스게임 스페셜(v0.4.1~) — 유형 결과별 이미지(balance-sp-{id}-{grade}.jpg)
  for (const g of (AppData.balanceSpecials || [])) {
    for (const r of g.results) {
      await shot({ ...BALANCE_THEME, badge: '밸런스게임 스페셜', emoji: r.emoji, title: r.title, subtitle: r.catch }, `balance-sp-${g.id}-${r.grade}.jpg`);
    }
  }

  await browser.close();
  console.log('Phase 4 공유 이미지 생성 완료');
}

main();
