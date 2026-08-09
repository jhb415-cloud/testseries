#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
 * adsense-prep v0.0.1 · 03-lotto.js
 *
 * 목적: 심사 기간 동안 로또/도박 인접 신호를 제거한다.
 *
 * 왜 필요한가:
 *   - 복권은 Google 게시자 정책상 "제한된 콘텐츠"다.
 *   - 특히 "실제 최근 당첨 통계 기반"은 당첨 확률 향상을 암시하는 표현으로
 *     읽힐 수 있다. 홈 소개문과 FAQ(JSON-LD 포함)에 그대로 노출돼 있었다.
 *   - "오늘의 운세 → 행운의 숫자 → 로또 조합기 연동"은 운세+도박 결합 구조로,
 *     품질 분류기가 가장 민감하게 보는 조합이다.
 *   - 두 번의 거절 사유는 "가치 없는 콘텐츠"였으므로 이게 주범은 아니지만,
 *     콘텐츠 문제를 해결하고 나면 다음 심사에서 새 사유로 튀어나올 수 있다.
 *
 * 처리:
 *   1) 사이드바 nav에서 로또 항목 숨김 (기능/코드는 그대로, 표시만 차단)
 *      ※ v0.2.8에서 가족오락관에 이미 썼던 방식과 동일
 *   2) 홈 소개문에서 "실제 최근 당첨 통계 기반" 문구 제거
 *   3) FAQ(본문 + JSON-LD) 답변을 순수 오락 도구로 재서술
 *
 * 되돌리기: node scripts/adsense/03-lotto.js --revert
 * 멱등성: 여러 번 실행해도 안전.
 * ───────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const REVERT = process.argv.includes('--revert');
const FILE = path.join(ROOT, 'index.html');

const RULES = [

  /* ── 1. 사이드바 nav 항목 숨김 ─────────────────────────────── */
  {
    label: 'nav 로또 항목 숨김',
    marker: '[adsense-prep v0.0.1] 애드센스 심사 기간 동안 로또 항목 숨김.',
    from: '    <div class="nav-item" data-section="lotto">\n      <span class="text-lg">🎱</span> 로또 번호 조합기\n    </div>\n',
    to: '    <!-- [adsense-prep v0.0.1] 애드센스 심사 기간 동안 로또 항목 숨김.\n' +
        '         복권은 게시자 정책상 제한 콘텐츠 — 승인 후 이 주석을 풀어 복구.\n' +
        '    <div class="nav-item" data-section="lotto">\n' +
        '      <span class="text-lg">🎱</span> 로또 번호 조합기\n' +
        '    </div>\n' +
        '    -->\n',
  },

  /* ── 2. 홈 소개문: 운세→로또 연동 서술 제거 ──────────────────── */
  {
    label: '운세 소개문에서 로또 연동 문구 제거',
    from: '는 12간지 띠별로 총운·재물운·애정운·건강운을 매일 다른 문구로 보여주고, 행운의 숫자는 로또 조합기와 바로 연동돼요.',
    to: '는 12간지 띠별로 총운·재물운·애정운·건강운을 매일 다른 문구로 보여줘요.',
  },

  /* ── 3. 홈 소개문: 가족오락관 & 로또 섹션 → 가족오락관 단독 ────── */
  {
    label: '소개 섹션 제목에서 로또 제거',
    from: '🎲 가족오락관 & 🎱 로또 조합기 — 모이면 켜는 도구',
    to: '🎲 가족오락관 — 모이면 켜는 도구',
  },
  {
    label: '소개 본문에서 로또 서술 제거',
    from: '(제시어 252개 내장). <a href="#lotto" class="text-indigo-300 font-semibold">로또 번호 조합기</a>는 완전 랜덤부터 실제 최근 당첨 통계 기반, 운세·꿈 행운숫자 연동, 물리 엔진으로 직접 공을 뽑는 추첨기 게임까지 4가지 방식을 지원합니다.',
    to: '(제시어 252개 내장). 인원수만 정하면 진행 순서와 점수까지 자동으로 관리돼서, 모임 자리에서 폰 하나만 꺼내면 바로 시작할 수 있어요.',
  },

  /* ── 4. FAQ 본문 ───────────────────────────────────────────── */
  {
    label: 'FAQ 본문에서 로또 질문 제거',
    from: '          <details class="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 group">\n            <summary class="cursor-pointer font-semibold text-slate-100 text-sm block w-full">로또 번호 조합기를 쓰면 당첨 확률이 올라가나요?</summary>\n            <p class="text-slate-400 text-sm mt-2">아니요, 오락용 번호 조합 도구예요. 다만 실제 최근 당첨 통계를 참고하는 모드가 있어 재미로 활용할 수 있어요.</p>\n          </details>\n',
    to: '          <details class="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 group">\n            <summary class="cursor-pointer font-semibold text-slate-100 text-sm block w-full">테스트는 누가 만드나요?</summary>\n            <p class="text-slate-400 text-sm mt-2">과몰입 연구소 운영자가 문항 설계부터 결과 유형 해설, 전용 일러스트까지 직접 만들어요. 자세한 제작 과정은 <a href="/about/" class="text-indigo-300">소개 페이지</a>에서 볼 수 있어요.</p>\n          </details>\n',
  },

  /* ── 5. JSON-LD FAQ ────────────────────────────────────────── */
  {
    label: 'JSON-LD에서 로또 Q&A 교체',
    from: '        "name": "로또 번호 조합기를 쓰면 당첨 확률이 올라가나요?",\n        "acceptedAnswer": { "@type": "Answer", "text": "아니요, 오락용 번호 조합 도구예요. 다만 실제 최근 당첨 통계를 참고하는 모드가 있어 재미로 활용할 수 있어요." }',
    to: '        "name": "테스트는 누가 만드나요?",\n        "acceptedAnswer": { "@type": "Answer", "text": "과몰입 연구소 운영자가 문항 설계부터 결과 유형 해설, 전용 일러스트까지 직접 만듭니다. 자세한 제작 과정은 소개 페이지에서 확인할 수 있어요." }',
  },
  {
    label: 'JSON-LD 무료 안내에서 로또 제거',
    from: '"네, 회원가입 없이 모든 테스트·운세·꿈해몽·로또 조합기를 무료로 이용할 수 있어요. 광고 수익으로 운영됩니다."',
    to: '"네, 회원가입 없이 모든 테스트와 콘텐츠를 무료로 이용할 수 있어요. 광고 수익으로 운영됩니다."',
  },
  {
    label: 'FAQ 본문 무료 안내에서 로또 제거',
    from: '네, 회원가입 없이 모든 테스트·운세·꿈해몽·로또 조합기를 무료로 이용할 수 있어요. 광고 수익으로 운영됩니다.',
    to: '네, 회원가입 없이 모든 테스트와 콘텐츠를 무료로 이용할 수 있어요. 광고 수익으로 운영됩니다.',
  },

  /* ── 5-b. 인라인 약관 섹션 서비스 설명에서 로또 제거 ──────────── */
  {
    label: '인라인 약관 서비스 설명에서 로또 제거',
    from: '본 서비스는 MBTI, 두뇌 나이, 집중 습관, 꿈 해몽, 오늘의 운세, 로또 번호 조합기 등 오락 목적의 각종 테스트 및 콘텐츠를 제공합니다.',
    to: '본 서비스는 MBTI, 두뇌 나이, 집중 습관, 심리테스트, 밸런스 게임 등 오락 목적의 각종 테스트 및 콘텐츠를 제공합니다.',
  },

  /* ── 6. 메타/타이틀에서 로또 제거 ───────────────────────────── */
  {
    label: 'og/twitter description에서 로또 제거',
    from: '재미로 시작했다가 뼈 맞고 공유하는 종합 테스트 모음. MBTI, 두뇌 인지 테스트, 심리테스트, 밸런스 게임, 오늘의 운세, 꿈 해몽, 로또 번호 조합기까지 전부 무료로 즐겨보세요.',
    to: '재미로 시작했다가 뼈 맞고 공유하는 종합 테스트 모음. MBTI, 두뇌 인지 테스트, 심리테스트, 밸런스 게임, 이상형 월드컵까지 전부 무료로 즐겨보세요.',
  },
  {
    label: 'JSON-LD description에서 로또 제거',
    from: '재미로 시작했다가 뼈 맞고 공유하는 종합 테스트 모음. MBTI, 두뇌 인지 테스트, 심리테스트, 밸런스 게임, 오늘의 운세, 꿈 해몽, 로또 번호 조합기 등을 제공하는 무료 웹 서비스.',
    to: '재미로 시작했다가 뼈 맞고 공유하는 종합 테스트 모음. MBTI, 두뇌 인지 테스트, 심리테스트, 밸런스 게임, 이상형 월드컵 등을 제공하는 무료 웹 서비스.',
  },
  {
    label: 'meta description에서 로또 제거',
    from: '과몰입 연구소는 MBTI, 두뇌 나이 측정기, 심리테스트, 밸런스 게임, 오늘의 운세, 꿈 해몽 검색, 로또 번호 조합기까지 다양한 테스트와 콘텐츠를 무료로 즐길 수 있는 종합 테스트 모음 사이트입니다.',
    to: '과몰입 연구소는 MBTI, 두뇌 나이 측정기, 심리테스트, 밸런스 게임, 이상형 월드컵까지 다양한 테스트를 무료로 즐길 수 있는 종합 테스트 모음 사이트입니다.',
  },
];

let s = fs.readFileSync(FILE, 'utf8');
let n = 0;
let failed = 0;
for (const r of RULES) {
  if (!REVERT && r.marker && s.includes(r.marker)) {
    const markerCount = s.split(r.marker).length - 1;
    if (markerCount !== 1 || !s.includes(r.to)) {
      console.error(`  ! 적용 마커 상태가 불완전함(${markerCount}개):`, r.label);
      failed++;
      continue;
    }
    console.log('  · 건너뜀(이미 처리):', r.label);
    continue;
  }
  const from = REVERT ? r.to : r.from;
  const to = REVERT ? r.from : r.to;
  if (!s.includes(from)) {
    console.log('  · 건너뜀(이미 처리):', r.label);
    continue;
  }
  s = s.split(from).join(to);
  console.log('  ✓', r.label);
  n++;
}

if (failed) {
  console.error(`\n[03-lotto] 실패 — ${failed}건의 규칙 상태가 불완전합니다.`);
  process.exit(1);
}

fs.writeFileSync(FILE, s);

const remaining = (s.match(/로또/g) || []).length;
console.log(`\n[03-lotto] ${REVERT ? '복원' : '적용'} 완료 — 규칙 ${n}건 반영`);
console.log(`  [검증] index.html 내 "로또" 잔여 언급: ${remaining}건 (약관·주석 등 비노출 영역 포함)`);
if (!REVERT) console.log('  → 다음: node scripts/adsense/04-sitemap.js');
