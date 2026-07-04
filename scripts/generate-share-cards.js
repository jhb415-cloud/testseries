/* v0.0.50 | 5-in-1 Dashboard SPA — scripts/generate-share-cards.js
   공유용 정적 이미지(1200x630 JPEG) 일괄 생성 스크립트. 한 번 실행해서 share-cards/ 아래에 커밋해두는
   용도 — 런타임에 돌리지 않음(빌드 도구 없음 원칙 유지). 데이터가 바뀌면(테스트 결과/등급/문구 추가) 재실행할 것.
   실행: node scripts/generate-share-cards.js (Playwright 필요, 로컬에 fonts-noto-cjk 설치돼있어야 한글이 정상 렌더링됨)

   ① Tier 채점 8개 테스트: AppData.animalCards 100개 조합 (기존, v0.0.48~)
   ② 친구 대결 공용 VS 이미지 1장 (기존, v0.0.49~)
   ③ 성향형 7개 테스트(MBTI/ADHD/인싸력/속담/물가/운세/꿈해몽) — 결과 정체성 개수만큼 1:1 이미지 (v0.0.50~) */

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

global.window = global;
require(path.join(__dirname, '..', 'data.js'));
const AppData = window.AppData;

/* 공통 카드 렌더러 — 배경 테마(그라데이션 2색+포인트색)만 바꿔가며 전체 사이트에서 재사용 */
function themedCardHTML({ bgFrom, bgTo, accent, badgeBg, badge, emoji, title, subtitle }) {
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
      position:absolute; top:48px; left:48px;
      background:${badgeBg}; color:${accent}; border:3px solid ${accent};
      font-weight:900; font-size:32px; padding:10px 28px; border-radius:16px;
      letter-spacing:1px;
    }
    .emoji { font-size:200px; line-height:1; margin-bottom:24px; text-align:center; }
    .title {
      font-weight:900; font-size:56px; color:#f1f5f9; text-align:center;
      /* v0.1.1~: 카카오톡 채팅창 미리보기가 1200px 원본보다 좁게 크롭해서 보여줘 텍스트가 좌우로
         잘리는 문제 발견(실사용 스크린샷) — max-width를 1000→760px로 줄여 안전 여백을 넉넉히 확보.
         219장 전체(scripts/generate-share-cards.js 재실행)에 적용된 값이라 임의로 되돌리지 말 것 */
      max-width:760px; line-height:1.3; text-shadow: 0 4px 16px rgba(0,0,0,0.4);
      margin-bottom:20px;
    }
    .tip {
      font-size:28px; color:rgba(241,245,249,0.75); text-align:center;
      max-width:700px; line-height:1.5;
    }
    .wordmark {
      position:absolute; bottom:36px; font-size:26px; color:rgba(241,245,249,0.55); font-weight:700;
    }
  </style></head><body>
    ${badge ? `<div class="badge">${badge}</div>` : ''}
    <div class="emoji">${emoji}</div>
    <div class="title">${title}</div>
    ${subtitle ? `<div class="tip">${subtitle}</div>` : ''}
    <div class="wordmark">🧪 과몰입 연구소</div>
  </body></html>`;
}

/* ① Tier 8개 테스트 (기존) */
const TIER_THEME = {
  S: { bgFrom: '#78350f', bgTo: '#0f0a02', accent: '#fbbf24', badgeBg: '#92400e' },
  A: { bgFrom: '#064e3b', bgTo: '#041b14', accent: '#34d399', badgeBg: '#065f46' },
  B: { bgFrom: '#1e3a5f', bgTo: '#0a1626', accent: '#60a5fa', badgeBg: '#1e40af' },
  C: { bgFrom: '#4c1d95', bgTo: '#170729', accent: '#a78bfa', badgeBg: '#5b21b6' },
  D: { bgFrom: '#881337', bgTo: '#2e0512', accent: '#fb7185', badgeBg: '#9f1239' },
};

/* ③ 성향형 7개 테스트 테마 */
const MBTI_GROUP_THEME = {
  // 분석가(NT)=보라, 외교관(NF)=에메랄드, 관리자(SJ)=블루, 탐험가(SP)=골드 — 16Personalities 색상 관례 차용
  INTJ: 'analyst', INTP: 'analyst', ENTJ: 'analyst', ENTP: 'analyst',
  INFJ: 'diplomat', INFP: 'diplomat', ENFJ: 'diplomat', ENFP: 'diplomat',
  ISTJ: 'sentinel', ISFJ: 'sentinel', ESTJ: 'sentinel', ESFJ: 'sentinel',
  ISTP: 'explorer', ISFP: 'explorer', ESTP: 'explorer', ESFP: 'explorer',
};
const MBTI_THEME = {
  analyst: TIER_THEME.C, diplomat: TIER_THEME.A, sentinel: TIER_THEME.B, explorer: TIER_THEME.S,
};

const ADHD_THEME = { bgFrom: '#134e4a', bgTo: '#042f2e', accent: '#2dd4bf', badgeBg: '#0f766e' };
const INSA_THEME = { bgFrom: '#831843', bgTo: '#431407', accent: '#fb923c', badgeBg: '#9d174d' };
const PROVERB_THEME = { bgFrom: '#422006', bgTo: '#1c0f02', accent: '#fbbf24', badgeBg: '#78350f' };
const PRICEQUIZ_THEME = { bgFrom: '#3f2f1a', bgTo: '#14100a', accent: '#e0b589', badgeBg: '#57432a' };
const FORTUNE_THEME = { bgFrom: '#1e1b4b', bgTo: '#020617', accent: '#818cf8', badgeBg: '#3730a3' };
const DREAM_THEME = { bgFrom: '#2e1065', bgTo: '#0c0a1f', accent: '#c4b5fd', badgeBg: '#4c1d95' };

const ZODIAC_SLUG = {
  쥐: 'rat', 소: 'ox', 호랑이: 'tiger', 토끼: 'rabbit', 용: 'dragon', 뱀: 'snake',
  말: 'horse', 양: 'goat', 원숭이: 'monkey', 닭: 'rooster', 개: 'dog', 돼지: 'pig',
};

/* 꿈해몽 74개 테마(data.js dreamData 순서 그대로) 대표 이모지 — 제목/키워드에서 착안해 수작업 배정 */
const DREAM_EMOJI = [
  '🕊️','🦷','🐍','🌊','🔥','🕯️','📝','💰','🏃','🏠',
  '👶','👻','🚗','🏫','✈️','🐷','🙏','💒','💩','💇',
  '🐛','🕷️','🎣','🐯','🐉','🐶','🐱','🐦','💍','📦',
  '🌉','⛰️','🪜','🛗','🫨','⛈️','❄️','🌸','🌳','🍎',
  '🍽️','🍺','💔','💌','💋','🥊','😢','😂','🙈','👕',
  '👟','👛','📱','🧭','🔒','🏥','🩺','⭐','🌙','🎟️',
  '🪞','🌈','🦋','😱','🐻','🐢','🧟','🌀','🌋','⚰️',
  '📸','🏞️','🐘','🛸',
];

async function main() {
  const outDir = path.join(__dirname, '..', 'share-cards');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const shot = async (html, filename) => {
    await page.setContent(html);
    await page.screenshot({ path: path.join(outDir, filename), type: 'jpeg', quality: 85 });
  };

  let count = 0;

  // ① Tier 8개 테스트 100개 조합
  const animalCards = AppData.animalCards;
  for (const section of Object.keys(animalCards)) {
    for (const tier of ['S', 'A', 'B', 'C', 'D']) {
      const pool = animalCards[section][tier];
      for (let idx = 0; idx < pool.length; idx++) {
        const card = pool[idx];
        await shot(themedCardHTML({ ...TIER_THEME[tier], badge: `Tier ${tier}`, emoji: card.emoji, title: card.title, subtitle: card.tip }), `${section}-${tier}-${idx}.jpg`);
        count++;
      }
    }
  }

  // ② 친구 대결 공용 VS 이미지
  await shot(themedCardHTML({ bgFrom: '#1e3a5f', bgTo: '#881337', accent: '#f1f5f9', badgeBg: '#0f0a02', badge: null, emoji: '⚔️', title: '친구 대결 도전장', subtitle: '같은 테스트로 실력을 겨뤄보세요!' }), 'vs.jpg');
  count++;

  // ③-1 MBTI 16유형
  const mbtiResults = AppData.mbtiResults;
  for (const type of Object.keys(mbtiResults)) {
    const r = mbtiResults[type];
    const theme = MBTI_THEME[MBTI_GROUP_THEME[type]];
    await shot(themedCardHTML({ ...theme, badge: type, emoji: r.emoji, title: r.title, subtitle: null }), `mbti-${type}.jpg`);
    count++;
  }

  // ③-2 ADHD 4등급
  for (const r of AppData.adhdResults) {
    await shot(themedCardHTML({ ...ADHD_THEME, badge: `등급 ${r.grade}`, emoji: r.emoji, title: r.title, subtitle: null }), `adhd-${r.grade}.jpg`);
    count++;
  }

  // ③-3 인싸력 4등급
  for (const r of AppData.insaResults) {
    await shot(themedCardHTML({ ...INSA_THEME, badge: `등급 ${r.grade}`, emoji: r.emoji, title: r.title, subtitle: null }), `insa-${r.grade}.jpg`);
    count++;
  }

  // ③-4 속담 완성 4등급
  for (const r of AppData.proverbResults) {
    await shot(themedCardHTML({ ...PROVERB_THEME, badge: `등급 ${r.grade}`, emoji: r.emoji, title: r.title, subtitle: null }), `proverb-${r.grade}.jpg`);
    count++;
  }

  // ③-5 그 시절 물가 4등급
  for (const r of AppData.priceQuizResults) {
    await shot(themedCardHTML({ ...PRICEQUIZ_THEME, badge: `등급 ${r.grade}`, emoji: r.emoji, title: r.title, subtitle: null }), `pricequiz-${r.grade}.jpg`);
    count++;
  }

  // ③-6 오늘의 운세 12띠
  for (const zodiac of Object.keys(AppData.fortuneData)) {
    const data = AppData.fortuneData[zodiac];
    const slug = ZODIAC_SLUG[zodiac];
    await shot(themedCardHTML({ ...FORTUNE_THEME, badge: `${zodiac}띠`, emoji: data.emoji, title: '오늘의 운세', subtitle: null }), `fortune-${slug}.jpg`);
    count++;
  }

  // ③-7 꿈해몽 74개 테마
  for (let i = 0; i < AppData.dreamData.length; i++) {
    const d = AppData.dreamData[i];
    const emoji = DREAM_EMOJI[i] || '🌙';
    await shot(themedCardHTML({ ...DREAM_THEME, badge: '꿈해몽', emoji, title: d.title, subtitle: d.summary }), `dream-${i}.jpg`);
    count++;
  }

  await browser.close();
  console.log(`생성 완료: ${count}장 → ${outDir}`);
}

main();
