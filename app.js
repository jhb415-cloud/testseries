/* v0.3.2 | 5-in-1 Dashboard SPA — app.js */

/* ══════════════════════════════════════════════════
   전역 상태
══════════════════════════════════════════════════ */
window.App = {
  state: {
    currentSection: 'home',
    mbti: { nickname: '', answers: [], step: 0 },
    brain: { nickname: '', difficulty: null, questions: [], step: 0, correctCount: 0, totalTime: 0, startTime: 0, timerID: null },
    adhd: { nickname: '', answers: [], step: 0 },
    fortune: { zodiac: '', year: null },
    reaction: { nickname: '', difficulty: null, round: 0, totalRounds: 0, times: [], fouls: 0, delayTimer: null, stimulusAt: 0, phase: 'idle' },
    memdigit: { nickname: '', difficulty: null, round: 0, totalRounds: 0, currentLen: 0, sequence: [], userInput: [], maxCorrectLen: 0, correctRounds: 0, delayTimer: null, phase: 'idle' },
    seqmem: { nickname: '', difficulty: null, round: 0, totalRounds: 0, currentLen: 0, sequence: [], userInput: [], maxCorrectLen: 0, correctRounds: 0, delayTimer: null, phase: 'idle' },
    colorvision: { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, totalTime: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', baseColor: '', oddColor: '', oddIndex: 0, tileCount: 0 },
    logic: { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, totalTime: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', answer: 0 },
    impulse: { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalGoTime: 0, goCount: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', isNoGo: false },
    shortfocus: { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalHitTime: 0, hitCount: 0, hitLog: [], cards: [], promptCat: null, hasTarget: false, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', streak: 0 },
    insa: { nickname: '', answers: [], step: 0 },
    proverb: { nickname: '', step: 0, correctCount: 0, options: [], answerIndex: 0, phase: 'idle', log: [] },
    pricequiz: { nickname: '', step: 0, correctCount: 0, options: [], answerIndex: 0, phase: 'idle', log: [] },
  },

  /* ─── 내비게이션 ─── */
  _sectionHistory: [],

  navigate(sectionId) {
    document.querySelectorAll('.section').forEach(s => {
      s.classList.add('hidden');
      s.classList.remove('fade-in');
    });
    const target = document.getElementById('section-' + sectionId);
    if (!target) return;
    target.classList.remove('hidden');
    requestAnimationFrame(() => target.classList.add('fade-in'));

    if (sectionId !== this.state.currentSection) {
      this._sectionHistory.push(this.state.currentSection);
      if (this._sectionHistory.length > 30) this._sectionHistory.shift();
    }
    this.state.currentSection = sectionId;
    location.hash = sectionId;

    // 내비 active 처리
    // 심리테스트존 하위메뉴 4개는 전부 data-section="psychtest"를 공유해서(카테고리만 다름)
    // 단순 조회는 항상 DOM상 첫 번째 항목(캐릭터 테스트)만 골라버리는 버그가 있었음 —
    // 현재 카테고리(data-psych-category)까지 같이 매칭해서 실제 선택된 항목을 찾도록 수정 (v0.2.9~)
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    let active;
    if (sectionId === 'psychtest') {
      const cat = this.state.psychtest && this.state.psychtest.category;
      active = document.querySelector(`.nav-item[data-section="psychtest"][data-psych-category="${cat}"]`)
            || document.querySelector(`.nav-item[data-section="psychtest"]`);
    } else {
      active = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    }
    if (active) {
      active.classList.add('active');
      const parentGroup = active.closest('.nav-group');
      if (parentGroup) parentGroup.classList.add('open');
    }

    // 뒤로가기/홈 플로팅 버튼: 홈 화면에서는 숨김
    const floatingNav = document.getElementById('floating-nav');
    if (floatingNav) floatingNav.classList.toggle('hidden', sectionId === 'home');

    // 모바일 사이드바 닫기
    closeMobileSidebar();
  },

  /* ─── 이전 화면으로 이동 (플로팅 뒤로가기 버튼) ─── */
  goBack() {
    const prev = this._sectionHistory.length ? this._sectionHistory.pop() : 'home';
    this.navigate(prev);
  },

  /* ─── 3초 광고 프리로더 ─── */
  showLoader(callback) {
    const overlay = document.getElementById('preloader-overlay');
    overlay.classList.remove('hidden');
    let count = 3;
    const counter = document.getElementById('loader-count');
    if (counter) counter.textContent = count;
    const iv = setInterval(() => {
      count--;
      if (counter) counter.textContent = count;
      if (count <= 0) {
        clearInterval(iv);
        overlay.classList.add('hidden');
        if (callback) callback();
      }
    }, 1000);
  }
};

/* 애드센스 심사 임시 조치(v0.2.8~): 가짜 통계 그래프 + 제휴 배너(href="#", 미연결) 숨김.
   심사 승인 후 false로 되돌리면 원상복구됨(관련 코드는 삭제하지 않고 그대로 보존). */
const ADSENSE_REVIEW_MODE = true;

/* ══════════════════════════════════════════════════
   유틸리티
══════════════════════════════════════════════════ */
function seededRandom(seed) {
  let x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/* Tier 등급 코멘트뱅크(v0.0.37~)에서 랜덤으로 하나 골라 반복 노출을 줄이는 용도 */
function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* v0.1.1~: AI 생성 콘텐츠(꿈해몽 AI 폴백 등)를 innerHTML로 렌더링하기 전 이스케이프.
   앱 내 나머지 텍스트는 전부 직접 작성한 정적 데이터라 필요 없지만, 외부 API(OpenAI) 응답은
   프롬프트 인젝션으로 임의 HTML이 섞여 들어올 가능성이 있어 이 경로에만 적용 */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* v0.1.5~: AI 생성 콘텐츠를 카카오/공유 버튼 onclick의 백틱 템플릿 리터럴(`...${x}...`)에 넣기 전 살균.
   escapeHtml()은 HTML 삽입은 막아주지만 백틱(`)이나 ${ 시퀀스는 그대로 통과시켜, onclick 속성 안의
   JS 템플릿 리터럴을 탈출해 임의 코드를 실행시킬 수 있음(HTML 이스케이프와는 별개의 취약점) —
   AI 응답(꿈해몽 AI 폴백)을 공유 버튼 문구로 쓸 때만 적용 */
function sanitizeForJsTemplate(str) {
  return String(str == null ? '' : str).replace(/`/g, "'").replace(/\$\{/g, '$ {');
}

/* Stage E: 동물 비유 결과 카드 (v0.0.48~) — Tier 채점 8개 테스트 전용, data.js AppData.animalCards 참고 */
function pickAnimalCard(section, tier) {
  const pool = AppData.animalCards[section] && AppData.animalCards[section][tier];
  if (!pool) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return { ...pool[idx], _idx: idx };
}

function animalCardHTML(card) {
  if (!card) return '';
  return `
        <div class="bg-gradient-to-br from-amber-900/30 to-slate-800 border border-amber-600/40 rounded-2xl p-5 my-4 text-center">
          <div class="text-xs text-amber-300 mb-2">🐾 나의 동물 비유 카드</div>
          <div class="text-4xl mb-2">${card.emoji}</div>
          <div class="text-lg font-black text-slate-100 mb-2">${card.title}</div>
          <p class="text-slate-300 text-sm">${card.tip}</p>
        </div>`;
}

function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/* 24시간(KST, 하루) 단위 시드 — "오늘의 인생 한마디" 순환용.
   같은 날(KST 00:00~23:59)엔 모든 방문자에게 같은 문구가 뜨도록 함 */
function dailyQuoteSeed() {
  const kstMs = Date.now() + 9 * 60 * 60 * 1000; // UTC → KST 보정
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor(kstMs / dayMs);
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('복사되었습니다! 📋'));
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('복사되었습니다! 📋');
  }
}

/* ── 공유하기(도전장/궁합 링크 복사) ──
   v0.1.1까지는 navigator.share()로 OS 공유 시트를 띄웠으나, 데스크톱(Windows 등)에서
   연락처 추가를 유도하는 낯선 공유 UI가 뜨는 게 거부감을 준다는 실제 스크린샷 피드백을 받아
   항상 클립보드 복사로 통일 — 앱의 다른 공유 버튼(🔗 링크 복사 등)도 전부 이 방식이라 일관성 있고,
   사용자가 이미 익숙한 "복사해서 카톡/문자에 붙여넣기" 흐름이라 거부감이 적음 */
function shareResult(text) {
  copyToClipboard(text);
}

/* ══════════════════════════════════════════════════
   🖼️ 이미지 있는 공유 카드 (v0.0.49~)
   - Tier 채점 8개 테스트 전용. functions/share/[section].js가 og:image가 박힌 랜딩 페이지를 서빙,
     실제 접속자는 즉시 해당 테스트(#{section})로 리다이렉트됨.
   - 카카오 SDK feed 템플릿은 og 태그를 자동으로 읽지 않고 imageUrl을 직접 받아야 해서 별도로 넘김.
══════════════════════════════════════════════════ */
function buildShareLandingUrl(section, params) {
  const qs = new URLSearchParams(params).toString();
  return `${location.origin}/share/${section}?${qs}`;
}

function shareToKakaoCard(imageUrl, title, description, shareUrl) {
  try {
    if (!window.Kakao || !Kakao.isInitialized()) { showToast('카카오 공유 준비 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: { title, description, imageUrl, link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
      buttons: [{ title: '나도 테스트하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
    });
  } catch (e) {
    console.error('카카오 공유 실패:', e);
    showToast('카카오 공유에 실패했습니다.');
  }
}

function shareFacebook(url) {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
}

function shareTwitter(url, text) {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
}

function shareBand(url, text) {
  window.open(`https://band.us/plugin/share?body=${encodeURIComponent(text + ' ' + url)}&route=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
}

/* 카카오톡 공유 전용 대형 버튼 — 가장 많이 눌리길 원하는 채널이라 아이콘 행에서 분리해 최상단에 단독 배치 (v0.0.51~)
   kakaoDesc는 Kakao 피드 카드가 UI에서 짧게 잘려버리는 문제(긴 shareText를 그대로 쓰면 "···"로 잘림) 때문에
   별도로 짧게 만든 문구를 받는다 — Twitter/밴드는 글자수 여유가 있어 기존 shareText를 그대로 재사용 */
function shareKakaoButtonHTML(imageUrl, kakaoTitle, kakaoDesc, shareUrl) {
  return `
    <button onclick="shareToKakaoCard('${imageUrl}', \`${kakaoTitle}\`, \`${kakaoDesc}\`, '${shareUrl}')"
      class="w-full bg-[#FEE500] hover:brightness-95 text-[#191919] font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-yellow-900/30 mb-3 flex items-center justify-center gap-2">
      <span class="text-2xl">💬</span> 카카오톡으로 공유하기
    </button>`;
}

/* 카카오 제외 나머지 채널 아이콘 행 — Tier 8개 테스트/성향형 7개 테스트가 공용으로 재사용 */
function shareIconRowHTML(shareText, shareUrl) {
  return `
    <div class="flex items-center justify-center gap-3 my-4">
      <button onclick="shareFacebook('${shareUrl}')"
        class="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xl flex items-center justify-center shadow-lg transition" title="페이스북 공유">f</button>
      <button onclick="shareTwitter('${shareUrl}', \`${shareText}\`)"
        class="w-14 h-14 rounded-full bg-[#0f172a] hover:bg-[#1e293b] border border-[#475569] text-white font-black text-lg flex items-center justify-center shadow-lg transition" title="X(트위터) 공유">𝕏</button>
      <button onclick="shareBand('${shareUrl}', \`${shareText}\`)"
        class="w-14 h-14 rounded-full bg-[#00C73C] hover:brightness-95 text-white font-black text-xs flex items-center justify-center shadow-lg transition" title="밴드 공유">밴드</button>
      <button onclick="copyToClipboard('${shareUrl}')"
        class="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 text-2xl flex items-center justify-center shadow-lg transition" title="링크 복사">🔗</button>
    </div>`;
}

/* 결과 화면 하단에 넣을 공유 UI — Tier 채점 8개 테스트 전용(등급+동물카드 인덱스로 이미지 결정) */
function renderShareRow(section, tier, idx, nickname, resultLabel, shareText, animalCard) {
  const shareUrl = buildShareLandingUrl(section, { type: 'result', tier, idx, nickname, result: resultLabel });
  const imageUrl = `${location.origin}/share-cards/${section}-${tier}-${idx}.jpg`;
  const kakaoTitle = `${nickname} 님의 결과: 🐾 ${animalCard.title}`;
  const kakaoDesc = resultLabel;
  return shareKakaoButtonHTML(imageUrl, kakaoTitle, kakaoDesc, shareUrl) + shareIconRowHTML(shareText, shareUrl);
}

/* 성향형 7개 테스트(MBTI/ADHD/인싸력/속담/물가/운세/꿈해몽) 전용 — 등급/타입/띠/꿈 인덱스 등
   테스트마다 다른 식별자를 landingParams로 그대로 넘기고, 이미지 URL은 호출부에서 미리 계산해 전달 (v0.0.50~) */
function renderIdentityShareRow(section, landingParams, imageUrl, kakaoTitle, kakaoDesc, shareText) {
  const shareUrl = buildShareLandingUrl(section, landingParams);
  return shareKakaoButtonHTML(imageUrl, kakaoTitle, kakaoDesc, shareUrl) + shareIconRowHTML(shareText, shareUrl);
}

/* ══════════════════════════════════════════════════
   🆚 친구 대결 모드 (v0.0.31~)
   - Tier(S~D) 채점을 쓰는 8개 테스트(두뇌나이/반응속도/숫자기억/순서기억/색각/논리력/충동억제/숏폼집중력) 대상
   - 백엔드 없이 URL 파라미터(#{section}?vs=...)에 상대 결과를 담아 공유 → 같은 테스트를 마치면 Tier끼리 비교
   - Tier 점수 환산은 renderCognitiveRadarCard()의 RADAR_TIER_SCORE와 동일 기준 재사용
══════════════════════════════════════════════════ */
const CHALLENGE_TIER_SCORE = { S: 100, A: 80, B: 60, C: 40, D: 20 };
const CHALLENGE_SECTIONS = ['brain', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus'];

function parseTierFromResult(resultStr) {
  const m = resultStr && resultStr.match(/Tier ([SABCD])/);
  return m ? m[1] : null;
}

/* 결과 화면의 "친구에게 도전장 보내기" 버튼에서 호출
   v0.0.49~: 도전장 링크를 원래의 #{section}?vs=... 대신 공유 랜딩 페이지(/share/{section}?type=challenge&...)로 교체 —
   카카오톡/문자 등 어디로 공유하든 og:image(공용 VS 카드)가 자동으로 붙어 텍스트만 가던 문제를 해결.
   랜딩 페이지가 vs= 페이로드를 그대로 복원해 리다이렉트하므로 기존 도전장 판정 로직은 그대로 재사용됨 */
function challengeFriend(section, nickname, result, difficulty) {
  const url = buildShareLandingUrl(section, { type: 'challenge', nickname, result, difficulty: difficulty || '' });
  const text = `⚔️ ${nickname}님의 도전장이 도착했습니다! (${result}) 같은 테스트로 나도 겨뤄보기 👉 ${url}`;
  shareResult(text);
}

/* 결과 화면에서 state.challenge가 있을 때 VS 비교 카드 HTML 생성 (v0.0.49~ 원점수 그대로 노출 + 결과 이미지 공유 추가) */
const DIFFICULTY_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움', hell: 'HELL' };

function renderChallengeCompareCard(myResult, challenge, section, myNickname, myDifficulty) {
  if (!challenge) return '';
  const oppDifficulty = challenge.d || '';
  const difficultyMismatch = !!(myDifficulty && oppDifficulty && myDifficulty !== oppDifficulty);

  const myTier = parseTierFromResult(myResult);
  const oppTier = parseTierFromResult(challenge.r);
  const myScore = CHALLENGE_TIER_SCORE[myTier] || 0;
  const oppScore = CHALLENGE_TIER_SCORE[oppTier] || 0;
  let verdict, verdictColor;
  if (difficultyMismatch) { verdict = '⚖️ 난이도가 달라 직접 비교는 어려워요'; verdictColor = 'text-slate-400'; }
  else if (myScore > oppScore) { verdict = '🏆 승리!'; verdictColor = 'text-emerald-400'; }
  else if (myScore < oppScore) { verdict = '😢 아쉬운 패배'; verdictColor = 'text-rose-400'; }
  else { verdict = '🤝 무승부'; verdictColor = 'text-amber-400'; }
  const shareUrl = buildShareLandingUrl(section, {
    type: 'verdict', nickname: myNickname, result: myResult,
    oppNickname: challenge.n, oppResult: challenge.r, verdict,
  });
  const kakaoTitle = `${myNickname} vs ${challenge.n} 대결 결과`;
  const kakaoDesc = `${myNickname} ${myResult} · ${challenge.n} ${challenge.r} — ${verdict}`;
  const oppDiffTag = oppDifficulty ? ` <span class="text-slate-600">(${DIFFICULTY_LABEL[oppDifficulty] || oppDifficulty})</span>` : '';
  const myDiffTag = myDifficulty ? ` <span class="text-slate-600">(${DIFFICULTY_LABEL[myDifficulty] || myDifficulty})</span>` : '';
  return `
    <div class="bg-slate-800 border border-violet-700/40 rounded-2xl p-5 mb-4 text-center">
      <h4 class="text-slate-100 font-bold mb-3">⚔️ 친구 대결 결과</h4>
      <div class="flex items-center justify-center gap-4 mb-2">
        <div class="flex-1">
          <div class="text-slate-500 text-xs mb-1">${challenge.n}${oppDiffTag}</div>
          <div class="text-slate-100 font-bold">${challenge.r}</div>
        </div>
        <div class="text-slate-500 font-black">VS</div>
        <div class="flex-1">
          <div class="text-slate-500 text-xs mb-1">나${myDiffTag}</div>
          <div class="text-slate-100 font-bold">${myResult}</div>
        </div>
      </div>
      <div class="font-black text-lg ${verdictColor} mb-3">${verdict}</div>
      ${shareKakaoButtonHTML(`${location.origin}/share-cards/vs.jpg`, kakaoTitle, kakaoDesc, shareUrl)}
      <div class="flex items-center justify-center gap-3">
        <button onclick="shareTwitter('${shareUrl}', \`${kakaoDesc}\`)"
          class="w-12 h-12 rounded-full bg-[#0f172a] hover:bg-[#1e293b] border border-[#475569] text-white font-black flex items-center justify-center shadow-lg transition" title="X(트위터) 공유">𝕏</button>
        <button onclick="copyToClipboard('${shareUrl}')"
          class="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 text-xl flex items-center justify-center shadow-lg transition" title="링크 복사">🔗</button>
      </div>
    </div>`;
}

/* 시작 화면에서 state.challenge가 있을 때(도전장 링크로 진입) 보여줄 배너 */
function renderChallengeBanner(challenge) {
  if (!challenge) return '';
  const diffHint = challenge.d ? ` (난이도: <strong>${DIFFICULTY_LABEL[challenge.d] || challenge.d}</strong>으로 도전해야 정확히 비교돼요)` : '';
  return `
    <div class="bg-violet-900/30 border border-violet-700/40 rounded-xl p-3 mb-4 text-sm text-violet-200">
      ⚔️ <strong>${challenge.n}</strong>님의 도전장! 기록: <strong>${challenge.r}</strong>${diffHint} — 같은 조건으로 겨뤄보세요
    </div>`;
}

/* 결과 화면 공유 버튼 옆에 넣을 "친구에게 도전장 보내기" 버튼 */
function renderChallengeButton(section, nickname, result, difficulty) {
  return `
    <button onclick="challengeFriend('${section}', \`${nickname}\`, \`${result}\`, '${difficulty || ''}')"
      class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition mb-3">
      ⚔️ 친구에게 도전장 보내기
    </button>`;
}

/* ══════════════════════════════════════════════════
   💞 결과 궁합 보기 (v0.0.33~)
   - 성격/성향 계열 테스트(MBTI, 인싸력) 대상. 친구 대결과 동일한 URL 공유 방식 재사용
   - 일치율(%)만 제공 — 전체 사용자 중 상위 % 표시는 Stage D(백엔드) 완료 후에나 가능해 이번엔 제외
══════════════════════════════════════════════════ */
function shareCompatibility(section, nickname, data, label) {
  const payload = encodeURIComponent(JSON.stringify({ n: nickname, ...data }));
  const url = `${location.origin}${location.pathname}#${section}?match=${payload}`;
  const text = `💞 ${nickname}님이 궁합을 보고 싶어해요! (${label}) 나도 같은 테스트로 궁합 확인하기 👉 ${url}`;
  shareResult(text);
}

/* MBTI 궁합: 4개 축(E/I,S/N,T/F,J/P) 중 일치하는 축 비율 */
function renderMbtiMatchCard(myType, match) {
  if (!match || !match.type) return '';
  let sameCount = 0;
  for (let i = 0; i < 4; i++) if (myType[i] === match.type[i]) sameCount++;
  const percent = (sameCount / 4 * 100).toFixed(1);
  return `
    <div class="bg-slate-800 border border-pink-700/40 rounded-2xl p-5 mb-4 text-center">
      <h4 class="text-slate-100 font-bold mb-3">💞 궁합 결과</h4>
      <div class="flex items-center justify-center gap-4 mb-2">
        <div class="flex-1"><div class="text-slate-500 text-xs mb-1">${match.n}</div><div class="text-slate-100 font-bold tracking-widest">${match.type}</div></div>
        <div class="text-pink-400 font-black">💞</div>
        <div class="flex-1"><div class="text-slate-500 text-xs mb-1">나</div><div class="text-slate-100 font-bold tracking-widest">${myType}</div></div>
      </div>
      <div class="font-black text-2xl text-pink-400">${percent}% 일치</div>
    </div>`;
}

/* 인싸력 궁합: 점수(0~30) 차이가 적을수록 일치율이 높음 */
function renderInsaMatchCard(myScore, match) {
  if (!match || match.score === undefined) return '';
  const diff = Math.abs(myScore - match.score);
  const percent = Math.max(0, 100 - diff / 30 * 100).toFixed(1);
  return `
    <div class="bg-slate-800 border border-pink-700/40 rounded-2xl p-5 mb-4 text-center">
      <h4 class="text-slate-100 font-bold mb-3">💞 궁합 결과</h4>
      <div class="flex items-center justify-center gap-4 mb-2">
        <div class="flex-1"><div class="text-slate-500 text-xs mb-1">${match.n}</div><div class="text-slate-100 font-bold">${match.score}점</div></div>
        <div class="text-pink-400 font-black">💞</div>
        <div class="flex-1"><div class="text-slate-500 text-xs mb-1">나</div><div class="text-slate-100 font-bold">${myScore}점</div></div>
      </div>
      <div class="font-black text-2xl text-pink-400">${percent}% 일치</div>
    </div>`;
}

function renderMatchBanner(match, label) {
  if (!match) return '';
  return `
    <div class="bg-pink-900/30 border border-pink-700/40 rounded-xl p-3 mb-4 text-sm text-pink-200">
      💞 <strong>${match.n}</strong>님이 궁합을 보고 싶어해요! (${label}) 같은 테스트를 마치면 궁합이 계산돼요
    </div>`;
}

/* ── 5개 테스트 완주 추적 (마이홈용) ── */
function markDone(section) {
  localStorage.setItem('done_' + section, '1');
}
function isDone(section) {
  return localStorage.getItem('done_' + section) === '1';
}

/* ── 닉네임 저장 (마이홈용) ── */
function getNickname() {
  return localStorage.getItem('app_nickname') || '';
}
function setNickname(v) {
  localStorage.setItem('app_nickname', v);
}

/* ── 연속 방문 스트릭 (하루 1회만 갱신) ── */
function updateVisitStreak() {
  const todayStr = new Date().toDateString();
  const last = localStorage.getItem('last_visit_date');
  let streak = parseInt(localStorage.getItem('visit_streak') || '0', 10);
  if (last !== todayStr) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    streak = (last === y.toDateString()) ? streak + 1 : 1;
    localStorage.setItem('visit_streak', String(streak));
    localStorage.setItem('last_visit_date', todayStr);
  }
  return streak;
}

/* ══════════════════════════════════════════════════
   🔊 정답/오답 사운드 + 마이크로 애니메이션 (v0.0.33~)
   - 외부 음원 파일 없이 Web Audio API 오실레이터로 직접 생성 (용량 0, 라이선스 문제 없음)
══════════════════════════════════════════════════ */
/* v0.0.54~: 단순 삐- 소리(정답 880Hz/오답 220Hz 단일톤) → 퀴즈쇼에서 익숙한 "딩동"/완만한 하강음으로 교체.
   50대 이상도 거부감 없도록 BGM(반복 재생 배경음악)은 넣지 않고 짧은 효과음만 다듬음(사용자 확인 완료). */
let sharedAudioCtx = null;

function isSoundEnabled() {
  return localStorage.getItem('sound_enabled') !== '0'; // 기본값: 켜짐
}

function playTone(ctx, freq, startTime, duration, volume) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/* 각 항목: [주파수, 시작 오프셋(초), 길이(초)] */
const SOUND_SEQUENCES = {
  correct: [[659, 0, 0.12], [880, 0.09, 0.18]],                              // 딩동(2음 상승)
  wrong:   [[300, 0, 0.16], [220, 0.13, 0.22]],                              // 완만한 하강 2음(자극적이지 않게)
  tick:    [[1000, 0, 0.045]],                                               // 타이머 임박 똑딱 소리
  tierS:   [[523, 0, 0.12], [659, 0.09, 0.12], [784, 0.18, 0.12], [1046, 0.27, 0.4]], // 최고 등급 축하 팡파레
};

function playSound(type) {
  if (!isSoundEnabled()) return;
  try {
    if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sharedAudioCtx;
    const seq = SOUND_SEQUENCES[type] || SOUND_SEQUENCES.correct;
    seq.forEach(([freq, offset, duration]) => playTone(ctx, freq, ctx.currentTime + offset, duration, 0.15));
  } catch (e) { /* 오디오 미지원 환경은 조용히 무시 */ }
}

function applySoundIcon() {
  const icon = isSoundEnabled() ? '🔊' : '🔇';
  document.querySelectorAll('.sound-toggle-btn').forEach(btn => { btn.textContent = icon; });
}

function toggleSound() {
  const enabled = isSoundEnabled();
  localStorage.setItem('sound_enabled', enabled ? '0' : '1');
  applySoundIcon();
  showToast(enabled ? '🔇 효과음을 껐어요' : '🔊 효과음을 켰어요');
}

/* 정답/오답 시 카드나 요소에 짧게 붙였다 떼는 마이크로 애니메이션 클래스 */
function pulseElement(el, kind) {
  if (!el) return;
  const cls = kind === 'wrong' ? 'anim-shake' : 'anim-pop';
  el.classList.remove('anim-pop', 'anim-shake');
  void el.offsetWidth; // 리플로우 강제로 애니메이션 재시작 보장
  el.classList.add(cls);
}

/* v0.1.0~: Tier 8개 테스트 시작화면의 접이식 "어떻게 하나요" 안내 카드 (기본 접힘, 재방문자 방해 없음) */
function guideCardHTML(steps) {
  return `
    <details class="text-left bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 mb-4">
      <summary class="cursor-pointer text-slate-200 font-bold text-sm select-none marker:text-violet-400">어떻게 하나요?</summary>
      <ol class="list-decimal list-inside text-slate-400 text-sm mt-3 space-y-1">
        ${steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
    </details>`;
}

/* v0.0.54~: 정답 3연속부터만 표시(매번 뜨면 너무 게임처럼 느껴져서 절제) — Tier 8개 테스트 토스트 문구에 덧붙이는 용도 */
function comboSuffix(streak) {
  return streak >= 3 ? ` 🔥${streak}연속!` : '';
}

/* v0.0.54~: 난이도 선택 직후 "3-2-1 시작!" 카운트다운 연출 후 실제 라운드 시작 콜백 실행 —
   memdigit/seqmem은 이미 "잘 보고 기억하세요" 식 도입부가 있어 적용하지 않음(중복 연출 방지) */
function showCountdownThenStart(containerId, startCallback) {
  const container = document.getElementById(containerId);
  if (!container) { startCallback(); return; }
  let count = 3;
  const render = (label) => {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center py-24">
        <div class="text-8xl font-black text-violet-400 anim-pop">${label}</div>
      </div>`;
  };
  render(count);
  const timer = setInterval(() => {
    count--;
    if (count > 0) { render(count); return; }
    if (count === 0) { render('시작!'); return; }
    clearInterval(timer);
    startCallback();
  }, 500);
}

/* HELL 난이도(Phase 3 로드맵 10-1, v0.0.53~) 진입 전 경고 — 실수로 못 누르게 확인 한 번 거침 */
function confirmHellMode(startFnName) {
  const ok = confirm('🔥 HELL 난이도는 정말 어렵습니다. 십중팔구 실패합니다.\n그래도 도전하시겠습니까?');
  if (ok) window[startFnName]('hell');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden', 'opacity-0');
  t.classList.add('opacity-100');
  setTimeout(() => { t.classList.remove('opacity-100'); t.classList.add('opacity-0'); }, 2200);
  setTimeout(() => t.classList.add('hidden'), 2700);
}

/* ── 제휴문의 폼 (v0.3.4~, 푸터에서 진입 → Slack 웹훅으로 전달) ── */
function openPartnershipModal() {
  const inner = document.getElementById('partnership-modal-inner');
  inner.innerHTML = `
    <div class="modal-content bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-slate-100 font-bold text-lg">🤝 제휴문의</h3>
        <button onclick="closePartnershipModal()" class="text-slate-400 hover:text-slate-100 text-xl leading-none">✕</button>
      </div>
      <div class="space-y-3">
        <input id="partnership-name" type="text" maxlength="60" placeholder="이름 (선택)"
          class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"/>
        <input id="partnership-email" type="email" maxlength="120" placeholder="이메일 (필수)"
          class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"/>
        <textarea id="partnership-message" maxlength="2000" rows="5" placeholder="제안 내용을 입력해주세요 (필수)"
          class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition resize-none"></textarea>
        <input id="partnership-website" type="text" tabindex="-1" autocomplete="off"
          class="absolute -left-[9999px] w-px h-px opacity-0" aria-hidden="true"/>
      </div>
      <button id="partnership-submit-btn" onclick="submitPartnershipInquiry()"
        class="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition mt-4">보내기</button>
    </div>`;
  document.getElementById('partnership-modal').classList.remove('hidden');
}

function closePartnershipModal() {
  document.getElementById('partnership-modal').classList.add('hidden');
}

async function submitPartnershipInquiry() {
  const name = document.getElementById('partnership-name').value.trim();
  const email = document.getElementById('partnership-email').value.trim();
  const message = document.getElementById('partnership-message').value.trim();
  const website = document.getElementById('partnership-website').value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('이메일을 확인해주세요!'); return; }
  if (!message) { showToast('제안 내용을 입력해주세요!'); return; }

  const btn = document.getElementById('partnership-submit-btn');
  btn.disabled = true;
  btn.textContent = '보내는 중...';

  try {
    const res = await fetch('/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message, website }),
    });
    const data = await res.json().catch(() => ({ ok: false }));
    if (res.ok && data.ok) {
      showToast('제휴문의가 접수되었습니다. 감사합니다!');
      closePartnershipModal();
    } else {
      showToast('전송에 실패했어요. 잠시 후 다시 시도해주세요.');
      btn.disabled = false;
      btn.textContent = '보내기';
    }
  } catch (e) {
    showToast('전송에 실패했어요. 잠시 후 다시 시도해주세요.');
    btn.disabled = false;
    btn.textContent = '보내기';
  }
}

/* ── 의견 보내기 폼 (v0.3.5~, 제휴문의와 동일 패턴 — 사진 첨부는 R2 스토리지 도입 후 추가 예정) ── */
function openFeedbackModal() {
  const inner = document.getElementById('feedback-modal-inner');
  inner.innerHTML = `
    <div class="modal-content bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-slate-100 font-bold text-lg">💬 의견 보내기</h3>
        <button onclick="closeFeedbackModal()" class="text-slate-400 hover:text-slate-100 text-xl leading-none">✕</button>
      </div>
      <div class="space-y-3">
        <input id="feedback-name" type="text" maxlength="60" placeholder="이름 (선택)"
          class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"/>
        <input id="feedback-email" type="email" maxlength="120" placeholder="이메일 (선택, 답변 받고 싶으시면 입력)"
          class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"/>
        <textarea id="feedback-message" maxlength="2000" rows="5" placeholder="어떤 의견이든 편하게 남겨주세요 (필수)"
          class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition resize-none"></textarea>
        <input id="feedback-website" type="text" tabindex="-1" autocomplete="off"
          class="absolute -left-[9999px] w-px h-px opacity-0" aria-hidden="true"/>
      </div>
      <button id="feedback-submit-btn" onclick="submitFeedback()"
        class="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition mt-4">보내기</button>
    </div>`;
  document.getElementById('feedback-modal').classList.remove('hidden');
}

function closeFeedbackModal() {
  document.getElementById('feedback-modal').classList.add('hidden');
}

async function submitFeedback() {
  const name = document.getElementById('feedback-name').value.trim();
  const email = document.getElementById('feedback-email').value.trim();
  const message = document.getElementById('feedback-message').value.trim();
  const website = document.getElementById('feedback-website').value.trim();

  if (!message) { showToast('의견 내용을 입력해주세요!'); return; }

  const btn = document.getElementById('feedback-submit-btn');
  btn.disabled = true;
  btn.textContent = '보내는 중...';

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message, website }),
    });
    const data = await res.json().catch(() => ({ ok: false }));
    if (res.ok && data.ok) {
      showToast('의견이 전달되었습니다. 감사합니다!');
      closeFeedbackModal();
    } else {
      showToast('전송에 실패했어요. 잠시 후 다시 시도해주세요.');
      btn.disabled = false;
      btn.textContent = '보내기';
    }
  } catch (e) {
    showToast('전송에 실패했어요. 잠시 후 다시 시도해주세요.');
    btn.disabled = false;
    btn.textContent = '보내기';
  }
}

function closeMobileSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  sb.classList.remove('mobile-open');
  ov.classList.remove('active');
}

/* ══════════════════════════════════════════════════
   🌗 다크/라이트 테마 토글
══════════════════════════════════════════════════ */
/* v0.1.0~: 사이드바는 아이콘 토글 대신 다크/라이트 두 버튼을 항상 같이 보여주고, 현재 선택된 쪽을 강조 표시
   (모바일 헤더는 공간이 좁아 기존 아이콘 토글을 그대로 유지) */
const THEME_BTN_ACTIVE = ['border-violet-500', 'bg-violet-900/30', 'text-violet-300'];
const THEME_BTN_IDLE = ['border-slate-700', 'bg-slate-800', 'text-slate-400'];

function applyThemeIcon() {
  const isLight = document.documentElement.classList.contains('light');

  const darkBtn = document.getElementById('theme-btn-dark');
  const lightBtn = document.getElementById('theme-btn-light');
  [[darkBtn, !isLight], [lightBtn, isLight]].forEach(([btn, active]) => {
    if (!btn) return;
    btn.classList.remove(...THEME_BTN_ACTIVE, ...THEME_BTN_IDLE);
    btn.classList.add(...(active ? THEME_BTN_ACTIVE : THEME_BTN_IDLE));
  });

  const mobileIcon = document.getElementById('theme-toggle-icon-mobile');
  if (mobileIcon) mobileIcon.textContent = isLight ? '☀️' : '🌙';
}

function setTheme(mode) {
  const isLight = mode === 'light';
  document.documentElement.classList.toggle('light', isLight);
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  applyThemeIcon();
}

function toggleTheme() {
  const isLight = document.documentElement.classList.contains('light');
  setTheme(isLight ? 'dark' : 'light');
}

/* ══════════════════════════════════════════════════
   🏠 홈 섹션 초기화
══════════════════════════════════════════════════ */
function initHome() {
  const quotes = AppData.quotes;
  const idx = Math.floor(seededRandom(dailyQuoteSeed()) * quotes.length);
  const quote = quotes[idx];

  document.getElementById('home-quote-text').textContent = `"${quote.text}"`;
  document.getElementById('home-quote-author').textContent = `— ${quote.author} (${quote.role})`;
  document.getElementById('home-copy-btn').onclick = () => copyToClipboard(`"${quote.text}" — ${quote.author}`);

  renderDailyChallengeCard();

  const toolCards = [
    { section: 'dream',   emoji: '🌙', title: '꿈 해몽 검색',    desc: '어젯밤 그 꿈, 무슨 의미일까?' },
    { section: 'fortune', emoji: '🔮', title: '오늘의 운세',      desc: '띠별 오늘 하루 운세 확인' },
    { section: 'lotto',   emoji: '🎱', title: '로또 번호 조합기', desc: '랜덤·직접지정·운세연동 4가지 모드' },
  ];

  /* v0.3.2~: 13개 테스트만 후보로 삼던 것 대신, 사이드바에 있는 전체 메뉴(심리테스트존/밸런스게임
     개별 콘텐츠, 로또 직접 뽑기 게임 포함)를 전부 후보로 넣고 실제 사용 시점(각 테스트 Start 함수,
     dreamShowModal, fortuneSubmit, lotto 조합 실행, psychtestStart, balancePick 등)에 찍히는
     engagementCount 기준 상위 6개만 노출 — "특정 13개로 제한하지 말고 전체 메뉴가 경쟁하게" 요청 반영.
     꿈해몽/오늘의운세/로또 조합기는 위 도구 그리드에 항상 노출되므로 중복을 피해 후보에서 제외.
     base 값은 실사용 데이터가 쌓이기 전 임의 추정치이며 실제 인기순이 아님을 화면에 항상 명시한다
     (index.html 캡션 참고). */
  const popularCandidates = [
    { section: 'mbti',        emoji: '🧠',  title: '성격 파탄(MBTI)',   desc: '간단/정밀 2모드로 알아보는 팩폭 성격 분석', key: 'site-mbti-plays', base: 980, run: () => App.navigate('mbti') },
    { section: 'brain',       emoji: '⚡',  title: '두뇌 나이 측정기',   desc: '스트룹 테스트, 3단계 난이도', key: 'site-brain-plays', base: 740, run: () => App.navigate('brain') },
    { section: 'adhd',        emoji: '🌪️', title: '프로 미루러',        desc: 'ADHD 성향 자가진단, 간단/정밀 2모드', key: 'site-adhd-plays', base: 650, run: () => App.navigate('adhd') },
    { section: 'reaction',    emoji: '💨',  title: '반응속도 테스트',    desc: '쉬움~어려움, 가짜신호까지 등장', key: 'site-reaction-plays', base: 590, run: () => App.navigate('reaction') },
    { section: 'shortfocus',  emoji: '📱',  title: '숏폼 집중력 테스트', desc: '피드 속 목표 콘텐츠만 빠르게 찾아 탭', key: 'site-shortfocus-plays', base: 410, run: () => App.navigate('shortfocus') },
    { section: 'insa',        emoji: '🎉',  title: '인싸력 테스트',      desc: '10문항 사교성 성향 퀴즈 (MZ향)', key: 'site-insa-plays', base: 510, run: () => App.navigate('insa') },
    { section: 'memdigit',    emoji: '🔢',  title: '숫자 기억력 테스트', desc: '적응형 자릿수, 탭 키패드로 도전', key: 'site-memdigit-plays', base: 340, run: () => App.navigate('memdigit') },
    { section: 'seqmem',      emoji: '🧩',  title: '순서 기억력 테스트', desc: '격자 타일 순서 암기, 즉시 판정', key: 'site-seqmem-plays', base: 300, run: () => App.navigate('seqmem') },
    { section: 'colorvision', emoji: '🎨',  title: '색각 테스트',        desc: '미묘하게 다른 색 타일 찾기', key: 'site-colorvision-plays', base: 280, run: () => App.navigate('colorvision') },
    { section: 'lottodraw',   emoji: '🎰',  title: '로또 직접 뽑기 게임', desc: '유리 추첨기로 직접 뽑는 로또 번호', key: 'site-lottodraw-plays', base: 220, run: () => App.navigate('lottodraw') },
    { section: 'logic',       emoji: '📊',  title: '논리력 테스트',      desc: '숫자 규칙 다음 값 맞히기 4지선다', key: 'site-logic-plays', base: 260, run: () => App.navigate('logic') },
    { section: 'impulse',     emoji: '🚦',  title: '충동억제 테스트',    desc: 'Go/No-Go, 성급한 반응을 참아라', key: 'site-impulse-plays', base: 230, run: () => App.navigate('impulse') },
    { section: 'proverb',     emoji: '📜',  title: '속담 완성 퀴즈',     desc: '시간 제한 없는 지혜 나눔 테스트', key: 'site-proverb-plays', base: 180, run: () => App.navigate('proverb') },
    { section: 'pricequiz',   emoji: '🧾',  title: '그 시절 물가 맞히기', desc: '실제 물가 통계 기반 향수 트리비아', key: 'site-pricequiz-plays', base: 150, run: () => App.navigate('pricequiz') },
    ...AppData.psychTests.map(t => ({
      section: 'psychtest', emoji: t.emoji, title: t.title, desc: t.hook.slice(0, 24) + '…',
      key: 'psychtest-' + t.id + '-plays', base: 128,
      run: () => { psychtestNavCategory(t.category); App.navigate('psychtest'); psychtestOpenPost(t.id); },
    })),
    ...AppData.balanceGames.map(g => ({
      section: 'balance', emoji: g.emoji, title: g.title, desc: g.hook.slice(0, 24) + '…',
      key: 'balance-' + g.id + '-plays', base: 203,
      run: () => { App.navigate('balance'); balanceOpenPost(g.id); },
    })),
  ];
  const topTestCards = popularCandidates
    .map(c => ({ ...c, score: engagementCount(c.key, c.base) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  /* v0.1.0~: 원색 그라데이션 카드 → 사이트 기본 카드색(slate) 기반 무채색 톤으로 통일 (도구/테스트 그리드 공통) */
  const renderGrid = (gridId, cards) => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    cards.forEach(c => {
      const div = document.createElement('div');
      div.className = 'service-card bg-slate-800 border border-slate-700 hover:border-violet-500 rounded-2xl p-5 text-slate-100 shadow cursor-pointer transition';
      div.innerHTML = `
        <div class="text-4xl mb-3">${c.emoji}</div>
        <h3 class="font-bold text-lg mb-1 text-slate-100">${c.title}</h3>
        <p class="text-sm text-slate-400">${c.desc}</p>
        <div class="mt-4 text-xs font-semibold text-violet-400 uppercase tracking-widest">시작하기 →</div>
      `;
      div.onclick = c.run || (() => App.navigate(c.section));
      grid.appendChild(div);
    });
  };

  renderGrid('home-tool-grid', toolCards);
  renderGrid('home-service-grid', topTestCards);

  // 오늘 날짜 표시
  const now = new Date();
  const dateStr = `${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일 (${['일','월','화','수','목','금','토'][now.getDay()]})`;
  document.getElementById('home-date').textContent = dateStr;

  renderHomeMypage();
}

/* ══════════════════════════════════════════════════
   🧠 MBTI 섹션
══════════════════════════════════════════════════ */
function initMbti() {
  const match = (App.pendingMatch && App.pendingMatch.section === 'mbti') ? App.pendingMatch.data : null;
  App.pendingMatch = null;
  App.state.mbti = { nickname: '', mode: null, questions: [], answers: [], step: 0, match };
  renderMbtiView('start');
}

function renderMbtiView(view) {
  const container = document.getElementById('mbti-container');
  const state = App.state.mbti;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">🧠</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">성격 파탄 MBTI</h2>
        <p class="text-slate-400 mb-6">솔직한 성격 분석<br>결과가 팩폭일 수도 있습니다.</p>
        ${renderMatchBanner(state.match, state.match ? state.match.type : '')}
        <input id="mbti-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력 (최대 12자)"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-violet-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">모드 선택</p>
        <div class="grid grid-cols-2 gap-3">
          <button onclick="mbtiStart('simple')" class="bg-violet-800/50 hover:bg-violet-700/70 border border-violet-600 text-violet-300 font-bold py-4 rounded-xl transition">
            <div class="text-2xl mb-1">⚡</div>
            간단 모드<br><span class="text-xs font-normal opacity-70">12문항</span>
          </button>
          <button onclick="mbtiStart('precise')" class="bg-purple-800/50 hover:bg-purple-700/70 border border-purple-600 text-purple-300 font-bold py-4 rounded-xl transition">
            <div class="text-2xl mb-1">🔬</div>
            정밀 모드<br><span class="text-xs font-normal opacity-70">24문항 · 축 비율 제공</span>
          </button>
        </div>
      </div>`;
  }

  else if (view === 'question') {
    const q = state.questions[state.step];
    const progress = Math.round((state.step / state.questions.length) * 100);
    container.innerHTML = `
      <div class="max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님의 테스트 · ${state.mode === 'precise' ? '정밀' : '간단'}</span>
          <span class="text-violet-400 font-bold text-sm">${state.step + 1} / ${state.questions.length}</span>
        </div>
        <div class="progress-bar-track mb-6">
          <div class="progress-bar-fill" style="width:${progress}%"></div>
        </div>
        <h3 class="text-slate-100 text-xl font-semibold mb-6 leading-relaxed">Q${state.step+1}. ${q.q}</h3>
        <div class="flex flex-col gap-3">
          ${q.a.map((ans, i) => `
            <button class="option-btn" onclick="mbtiAnswer('${ans.axis}')">
              <span class="text-violet-400 font-bold mr-2">${['A','B'][i]}</span> ${ans.text}
            </button>`).join('')}
        </div>
      </div>`;
  }

  else if (view === 'result') {
    // MBTI 계산
    const axes = { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 };
    state.answers.forEach(a => axes[a]++);
    const type = [axes.E>=axes.I?'E':'I', axes.S>=axes.N?'S':'N', axes.T>=axes.F?'T':'F', axes.J>=axes.P?'J':'P'].join('');
    const result = AppData.mbtiResults[type] || AppData.mbtiResults['INFP'];
    const shareText = `나 방금 MBTI 해봤는데 ${type} 나왔어! 「${result.title}」래ㅋㅋ 너도 해봐 👉`;

    // 정밀 모드 전용: 축별 비율 바 (답변 개수만으로 계산, 별도 데이터 불필요)
    let axisBarsHtml = '';
    if (state.mode === 'precise') {
      const pairs = [['E','I','indigo'], ['S','N','emerald'], ['T','F','amber'], ['J','P','rose']];
      axisBarsHtml = `
        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <h4 class="text-slate-100 font-bold mb-3">📊 축별 성향 비율 (정밀 모드)</h4>
          <div class="flex flex-col gap-3">
            ${pairs.map(([a, b]) => {
              const total = axes[a] + axes[b];
              const pa = total ? Math.round((axes[a] / total) * 100) : 50;
              const pb = 100 - pa;
              return `
                <div>
                  <div class="flex justify-between text-xs text-slate-400 mb-1">
                    <span>${a} ${pa}%</span><span>${b} ${pb}%</span>
                  </div>
                  <div class="bg-slate-700 rounded-full h-2 overflow-hidden flex">
                    <div class="bg-violet-500 h-full" style="width:${pa}%"></div>
                    <div class="bg-slate-500 h-full" style="width:${pb}%"></div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-8">
          <div class="text-5xl mb-3">${result.emoji}</div>
          <div class="text-4xl font-black text-slate-100 mb-1 tracking-widest">${type}</div>
          <div class="text-violet-400 font-bold text-xl mb-2">${result.title}</div>
          <p class="text-slate-400">${state.nickname} 님의 성격 유형 분석 결과</p>
        </div>

        ${axisBarsHtml}

        ${renderMbtiMatchCard(type, state.match)}

        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <h4 class="text-slate-100 font-bold mb-2">📌 성격 요약</h4>
          <p class="text-slate-300 leading-relaxed">${result.desc}</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div class="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4">
            <h4 class="text-emerald-400 font-bold mb-2">✅ 강점</h4>
            <p class="text-slate-300 text-sm">${result.strength}</p>
          </div>
          <div class="bg-rose-900/30 border border-rose-700/40 rounded-xl p-4">
            <h4 class="text-rose-400 font-bold mb-2">⚠️ 도전 과제</h4>
            <p class="text-slate-300 text-sm">${result.challenge}</p>
          </div>
        </div>
        <div class="bg-violet-900/30 border border-violet-700/40 rounded-xl p-4 mb-4">
          <h4 class="text-violet-300 font-bold mb-2">💡 개선 꿀팁</h4>
          <p class="text-slate-300 text-sm leading-relaxed">${result.tip}</p>
        </div>
        <div class="text-slate-500 text-xs text-center mb-6">유명인: ${result.famous}</div>

        ${renderIdentityShareRow('mbti', { mbtiType: type, nickname: state.nickname, result: `${type} - ${result.title}` }, `${location.origin}/share-cards/mbti-${type}.jpg`, `${state.nickname} 님의 MBTI는 ${type}!`, result.title, shareText)}
        <button onclick="shareCompatibility('mbti', \`${state.nickname}\`, { type: '${type}' }, '${type}')"
          class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition mb-3">
          💞 궁합 보기 링크 보내기
        </button>

        ${renderPlaceholderUI('mbti', type)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 및 자기 이해를 위한 참고 자료이며 전문 심리 진단을 대체하지 않습니다.
        </div>
        <button onclick="initMbti()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 테스트하기
        </button>
      </div>`;

    // 랭킹 저장
    saveRanking('mbti', state.nickname, type);
    renderLocalRanking('mbti-ranking-list', 'mbti');
  }
}

function mbtiStart(mode) {
  const nickname = document.getElementById('mbti-nickname').value.trim();
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-mbti-plays');
  const state = App.state.mbti;
  state.nickname = nickname;
  state.mode = mode;
  state.questions = mode === 'precise' ? AppData.mbtiQuestions.concat(AppData.mbtiQuestionsExtra) : AppData.mbtiQuestions;
  state.answers = [];
  state.step = 0;
  renderMbtiView('question');
}

function mbtiAnswer(axis) {
  const state = App.state.mbti;
  state.answers.push(axis);
  state.step++;
  if (state.step >= state.questions.length) {
    App.showLoader(() => renderMbtiView('result'));
  } else {
    renderMbtiView('question');
  }
}

/* ══════════════════════════════════════════════════
   🌙 꿈 해몽 검색 섹션
══════════════════════════════════════════════════ */
function initDream() {
  renderDreamSearch();
}

function renderDreamSearch() {
  const container = document.getElementById('dream-container');
  const suggestions = ['뱀', '하늘을 날다', '이빨이 빠지다', '돈', '불', '귀신', '시험', '아기'];
  container.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">🌙</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">꿈 해몽 검색</h2>
        <p class="text-slate-400">어젯밤 꿈의 키워드를 입력하세요</p>
      </div>
      <div class="flex gap-2 mb-4">
        <input id="dream-search-input" type="text" placeholder="예: 뱀, 하늘을 날다, 이빨이 빠지다..."
          class="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"/>
        <button onclick="dreamSearch()" class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl transition">검색</button>
      </div>
      <div id="dream-search-results"></div>
      <div class="mt-6">
        <p class="text-slate-500 text-sm mb-3">추천 검색어</p>
        <div class="flex flex-wrap gap-2">
          ${suggestions.map(s => `
            <button onclick="dreamSearchBy('${s}')" class="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-50 text-sm px-4 py-2 rounded-full transition">
              ${s}
            </button>`).join('')}
        </div>
      </div>
    </div>`;

  document.getElementById('dream-search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') dreamSearch();
  });
}

function dreamSearch() {
  const input = document.getElementById('dream-search-input');
  if (input) dreamSearchBy(input.value.trim());
}

/* v0.3.0~: 검색 랭킹 엔진. 조사 제거 + "꿈/해몽" 등 불용어 제거 후,
   각 단어가 전체 데이터에서 얼마나 희소한지(1/등장문서수)로 가중치를 매겨
   "외계인"처럼 변별력 있는 단어에 실린 점수가 높은 항목만 통과시킨다(최고점의 50% 컷오프).
   과거엔 단어 하나만 겹쳐도(OR) 노출되거나, "꿈"이 모든 제목에 들어있어 전체가 노출되는 버그가 있었음.
   상세 배경은 CLAUDE.md 변경 이력 v0.3.0 항목 참고 — 되돌리거나 방향을 바꿀 수 있어 기록해둠. */
const DREAM_STOPWORDS = new Set(['꿈', '해몽', '나오다', '나오는', '보다', '보는', '꾸다', '꾸는', '관하다', '관한', '대하다', '대한', '거', '것']);
const DREAM_PARTICLES = ['에게서', '으로써', '한테서', '이라는', '에게는', '에서는', '까지는', '부터는',
  '에게', '에서', '으로', '한테', '까지', '부터', '이랑', '하고',
  '은', '는', '이', '가', '을', '를', '도', '만', '의', '에', '로', '와', '과', '랑'].sort((a, b) => b.length - a.length);

function dreamStripParticle(token) {
  for (const p of DREAM_PARTICLES) {
    if (token.length > p.length && token.endsWith(p)) return token.slice(0, token.length - p.length);
  }
  return token;
}

function dreamTokenizeQuery(query) {
  return query.toLowerCase().split(/\s+/)
    .map(dreamStripParticle)
    .filter(t => t && !DREAM_STOPWORDS.has(t));
}

function dreamDocText(d, v) {
  const o = v || d;
  return [...(o.keywords || []), o.title].join(' ').toLowerCase();
}

function dreamComputeWeights(tokens) {
  const weights = {};
  tokens.forEach(t => {
    let df = 0;
    AppData.dreamData.forEach(d => {
      if (dreamDocText(d, null).includes(t)) df++;
      (d.variants || []).forEach(v => { if (dreamDocText(d, v).includes(t)) df++; });
    });
    weights[t] = df > 0 ? 1 / df : 0;
  });
  return weights;
}

function dreamSearchBy(query) {
  if (!query) { showToast('검색어를 입력해주세요!'); return; }
  const input = document.getElementById('dream-search-input');
  if (input) input.value = query;

  const container = document.getElementById('dream-search-results');
  if (!container) return;
  const safeQuery = escapeHtml(query).replace(/'/g, "\\'");

  const tokens = dreamTokenizeQuery(query);
  const results = [];

  if (tokens.length > 0) {
    const weights = dreamComputeWeights(tokens);
    const candidates = [];

    AppData.dreamData.forEach((d, tIdx) => {
      const themeText = dreamDocText(d, null);
      let themeScore = 0;
      tokens.forEach(t => { if (themeText.includes(t)) themeScore += weights[t]; });

      let bestVariantIdx = null;
      let bestVariantScore = 0;
      (d.variants || []).forEach((v, vIdx) => {
        const vText = dreamDocText(d, v);
        let vScore = 0;
        tokens.forEach(t => { if (vText.includes(t)) vScore += weights[t]; });
        if (vScore > bestVariantScore) { bestVariantScore = vScore; bestVariantIdx = vIdx; }
      });

      // 변형 점수가 테마 자체보다 "확실히" 높을 때만 변형을 대표로 노출, 동점이면 테마(모달에서 변형 칩도 볼 수 있음)를 노출
      if (bestVariantScore > themeScore) {
        candidates.push({ tIdx, vIdx: bestVariantIdx, score: bestVariantScore });
      } else if (themeScore > 0) {
        candidates.push({ tIdx, vIdx: null, score: themeScore });
      }
    });

    const maxScore = candidates.reduce((m, c) => Math.max(m, c.score), 0);
    if (maxScore > 0) {
      results.push(...candidates.filter(c => c.score >= maxScore * 0.5).sort((a, b) => b.score - a.score));
    }
  }

  if (results.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <div class="text-4xl mb-3">🔍</div>
        <p class="text-slate-400 mb-5">'${escapeHtml(query)}'에 대한 해몽 결과가 없어요.</p>
        <button onclick="dreamAiSearch('${safeQuery}')" class="bg-violet-700 hover:bg-violet-600 text-white font-bold px-6 py-3 rounded-full transition">🤖 AI 해몽으로 찾아보기</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <p class="text-slate-500 text-sm mb-3">'${escapeHtml(query)}' 검색 결과 ${results.length}건</p>
    <div class="flex flex-col gap-3">
      ${results.map(({tIdx, vIdx}) => {
        const d = AppData.dreamData[tIdx];
        const shown = vIdx !== null ? d.variants[vIdx] : d;
        const badge = vIdx !== null ? `<span class="text-slate-500 text-xs">(${d.title} 중)</span>` : '';
        return `
        <div onclick="dreamShowModal(${tIdx}, ${vIdx === null ? 'null' : vIdx})"
          class="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-600/50 rounded-xl p-4 cursor-pointer transition">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🌙</span>
            <div>
              <div class="text-slate-100 font-semibold">${shown.title} ${badge}</div>
              <div class="text-blue-400 text-sm">${shown.summary || d.summary}</div>
            </div>
            <span class="ml-auto text-slate-500 text-sm">상세보기 →</span>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="mt-5 pt-5 border-t border-slate-700 text-center">
      <p class="text-slate-500 text-sm mb-3">찾는 꿈이 아닌가요?</p>
      <button onclick="dreamAiSearch('${safeQuery}')" class="bg-violet-700 hover:bg-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-full transition">🤖 AI 해몽으로 찾아보기</button>
    </div>`;
}

/* v0.1.1~: PRD 10-4 3단계(AI 폴백). 검색 결과 0건일 때만 노출되는 버튼으로 호출(자동 호출 없음).
   서버(functions/api/dream-ai.js)가 Supabase dream_ai_cache 캐시 → 없으면 OpenAI 생성 순으로 처리 */
async function dreamAiSearch(query) {
  const container = document.getElementById('dream-search-results');
  if (!container) return;
  container.innerHTML = `
    <div class="text-center py-10">
      <div class="text-4xl mb-3 animate-pulse">🤖</div>
      <p class="text-slate-400">AI가 '${escapeHtml(query)}' 꿈을 해몽하고 있어요...</p>
    </div>`;

  try {
    const res = await fetch('/api/dream-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'AI 해몽 요청 실패');
    dreamRenderAiModal(query, data);
  } catch (e) {
    showToast('AI 해몽을 가져오지 못했어요. 잠시 후 다시 시도해주세요.');
    dreamSearchBy(query);
  }
}

function dreamRenderAiModal(query, data) {
  App.showLoader(() => {
    document.getElementById('dream-modal').classList.remove('hidden');
    const modalInner = document.getElementById('dream-modal-inner');
    localStorage.setItem('last_dream_luckynum', data.luckyNum || '');
    markDone('dream');

    /* v0.1.5~: AI 해몽도 정적 데이터 해몽과 동일하게 공유 가능하게 함.
       data.title/summary는 OpenAI 응답(사용자 검색어 기반 프롬프트 인젝션 가능성 있음)이라
       onclick 백틱 템플릿에 들어가기 전 sanitizeForJsTemplate()로 한 번 더 살균(escapeHtml과 별개 방어) */
    const safeTitle = sanitizeForJsTemplate(data.title);
    const safeSummary = sanitizeForJsTemplate(data.summary);
    const shareText = `나 어제 이런 꿈 꿨어! ${safeTitle} — ${safeSummary} 너도 무슨 꿈인지 확인해봐 👉`;
    /* v0.1.8~: 정적 해몽과 동일하게 범용 티저 카드+고정 문구로 통일 (dream-0.jpg 오표시 버그 해결) */
    const shareRow = renderIdentityShareRow('dream',
      { dreamAi: 1, dreamTitle: data.title, dreamSummary: data.summary, dreamDetail: data.detail, dreamLucky: data.lucky, dreamLuckyNum: data.luckyNum, dreamAction: data.action, nickname: getNickname() || '나' },
      `${location.origin}/share-cards/dream-share.jpg`, '나 이런 꿈 꿨어', '너도 꿈 꾼거 있으면 찾아볼래?', shareText);

    modalInner.innerHTML = `
      <div class="modal-content bg-slate-800 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-slate-100 font-bold text-xl">${escapeHtml(data.title)}</h3>
          <button onclick="dreamCloseModal()" class="text-slate-400 hover:text-slate-50 text-2xl leading-none">&times;</button>
        </div>
        <div class="inline-block bg-violet-900/40 border border-violet-600/40 text-violet-300 text-xs font-semibold px-2 py-1 rounded-full mb-3">🤖 AI 생성 해몽${data.source === 'cache' ? ' (캐시됨)' : ''}</div>
        <div class="bg-blue-900/30 border border-blue-700/40 rounded-xl p-3 mb-4">
          <span class="text-blue-300 font-semibold">✦ ${escapeHtml(data.summary)}</span>
        </div>
        <p class="text-slate-300 leading-relaxed mb-5 text-sm">${escapeHtml(data.detail)}</p>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-slate-700 rounded-lg p-3 text-center">
            <div class="text-xs text-slate-400 mb-1">행운의 색</div>
            <div class="text-slate-100 font-semibold text-sm">${escapeHtml(data.lucky)}</div>
          </div>
          <div class="bg-slate-700 rounded-lg p-3 text-center">
            <div class="text-xs text-slate-400 mb-1">행운의 숫자</div>
            <div class="text-slate-100 font-semibold text-sm">${escapeHtml(data.luckyNum)}</div>
          </div>
        </div>
        <div class="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-3 mb-4">
          <div class="text-indigo-300 text-xs font-semibold mb-1">오늘의 행동</div>
          <p class="text-indigo-200 text-sm">${escapeHtml(data.action)}</p>
        </div>
        <button onclick="dreamGoToLotto()" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition mb-4">🎰 이 행운숫자로 로또 조합하기</button>
        ${shareRow}
        <div class="text-yellow-200/50 text-xs">⚠️ AI가 생성한 참고용 콘텐츠이며, 민속학적 사실이나 전문적 조언이 아닙니다.</div>
      </div>`;
  });
}

function dreamShowModal(tIdx, vIdx) {
  const d = AppData.dreamData[tIdx];
  if (!d) return;
  bumpEngagement('site-dream-plays');

  // 최초 오픈 시에만 3초 광고 로딩. 이후 칩 클릭(변형 보기)은 로딩 없이 즉시 전환.
  App.showLoader(() => {
    document.getElementById('dream-modal').classList.remove('hidden');
    dreamRenderModal(tIdx, vIdx === undefined ? null : vIdx);
  });
}

function dreamRenderModal(tIdx, vIdx) {
  const d = AppData.dreamData[tIdx];
  const isVariant = vIdx !== null && vIdx !== undefined && d.variants && d.variants[vIdx];
  const v = isVariant ? d.variants[vIdx] : null;

  const title = v ? v.title : d.title;
  const summary = v ? (v.summary || d.summary) : d.summary;
  const detail = v ? v.detail : d.detail;
  const lucky = v ? (v.lucky || d.lucky) : d.lucky;
  const luckyNum = v ? (v.luckyNum || d.luckyNum) : d.luckyNum;
  const action = v ? (v.action || d.action) : d.action;

  const hasVariants = d.variants && d.variants.length > 0;
  const shareText = `나 어제 이런 꿈 꿨어! ${title} — ${summary} 너도 무슨 꿈인지 확인해봐 👉`;
  /* v0.1.5~: 공유 링크를 연 사람이 검색 없이도 나와 똑같은 해몽 카드를 그대로 보게끔
     제목/요약뿐 아니라 본문·행운색·행운숫자·오늘의 행동까지 전부 landingParams로 전달
     (functions/share/[section].js가 이걸 그대로 shared-preview 화면의 extra로 넘김)
     v0.1.8~: 카카오 카드(이미지+제목+설명)는 꿈마다 달라 매번 이미지를 새로 만들 수 없으므로
     범용 티저 카드 1장(dream-share.jpg)+고정 문구로 통일, 실제 내용은 클릭 후 화면에서 재현 */
  const shareRow = renderIdentityShareRow('dream',
    { dreamIdx: tIdx, dreamTitle: title, dreamSummary: summary, dreamDetail: detail, dreamLucky: lucky, dreamLuckyNum: luckyNum, dreamAction: action, nickname: getNickname() || '나' },
    `${location.origin}/share-cards/dream-share.jpg`, '나 이런 꿈 꿨어', '너도 꿈 꾼거 있으면 찾아볼래?', shareText);
  const modalInner = document.getElementById('dream-modal-inner');

  // 마이홈 완주 플래그 + 로또 조합기 연동용 저장
  markDone('dream');
  localStorage.setItem('last_dream_luckynum', luckyNum);

  modalInner.innerHTML = `
    <div class="modal-content bg-slate-800 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-slate-100 font-bold text-xl">${title}</h3>
        <button onclick="dreamCloseModal()" class="text-slate-400 hover:text-slate-50 text-2xl leading-none">&times;</button>
      </div>
      ${isVariant ? `<button onclick="dreamRenderModal(${tIdx}, null)" class="text-blue-400 hover:text-blue-300 text-xs mb-3">← '${d.title}' 통합 설명으로</button>` : ''}
      <div class="bg-blue-900/30 border border-blue-700/40 rounded-xl p-3 mb-4">
        <span class="text-blue-300 font-semibold">✦ ${summary}</span>
      </div>
      <p class="text-slate-300 leading-relaxed mb-5 text-sm">${detail}</p>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-slate-700 rounded-lg p-3 text-center">
          <div class="text-xs text-slate-400 mb-1">행운의 색</div>
          <div class="text-slate-100 font-semibold text-sm">${lucky}</div>
        </div>
        <div class="bg-slate-700 rounded-lg p-3 text-center">
          <div class="text-xs text-slate-400 mb-1">행운의 숫자</div>
          <div class="text-slate-100 font-semibold text-sm">${luckyNum}</div>
        </div>
      </div>
      <div class="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-3 mb-4">
        <div class="text-indigo-300 text-xs font-semibold mb-1">오늘의 행동</div>
        <p class="text-indigo-200 text-sm">${action}</p>
      </div>
      <button onclick="dreamGoToLotto()" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition mb-4">🎰 이 행운숫자로 로또 조합하기</button>
      ${hasVariants ? `
      <div class="mb-4">
        <p class="text-slate-500 text-xs mb-2">🔍 이런 ${d.title.replace(/에 관한 꿈|이 나오는 꿈|가 나오는 꿈|하는 꿈/g,'')} 관련 꿈도 있어요</p>
        <div class="flex flex-wrap gap-2">
          ${d.variants.map((vv, i) => `
            <button onclick="dreamRenderModal(${tIdx}, ${i})"
              class="text-xs px-3 py-1.5 rounded-full border transition ${isVariant && vIdx === i ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-blue-500'}">
              ${vv.title}
            </button>`).join('')}
        </div>
      </div>` : ''}
      ${shareRow}
      <div class="text-yellow-200/50 text-xs">⚠️ 꿈 해몽은 민속학적 참고 자료이며 학문적 사실이 아닙니다.</div>
    </div>`;
}

function dreamCloseModal() {
  document.getElementById('dream-modal').classList.add('hidden');
}

/* v0.1.1~: 꿈 모달 → 로또 조합기 원클릭 연동. 방금 본 꿈의 행운숫자는 이미
   dreamRenderModal()에서 last_dream_luckynum에 저장돼있어, 로또 섹션의
   기존 "오늘의 운세·꿈 연동" 모드(lottoRunFortunePick)를 그대로 재사용해 실행까지 자동화 */
function dreamGoToLotto() {
  dreamCloseModal();
  App.navigate('lotto');
  lottoRunFortunePick();
}

/* ══════════════════════════════════════════════════
   🔮 오늘의 운세 섹션
══════════════════════════════════════════════════ */
/* 공유 카드 이미지 파일명(share-cards/fortune-{slug}.jpg)용 — scripts/generate-share-cards.js의 ZODIAC_SLUG와 동일하게 유지할 것 */
const ZODIAC_SLUG = {
  쥐: 'rat', 소: 'ox', 호랑이: 'tiger', 토끼: 'rabbit', 용: 'dragon', 뱀: 'snake',
  말: 'horse', 양: 'goat', 원숭이: 'monkey', 닭: 'rooster', 개: 'dog', 돼지: 'pig',
};

function initFortune() {
  App.state.fortune = { zodiac: '', year: null };
  renderFortuneView('input');
}

function getZodiacFromYear(year) {
  const animals = AppData.zodiacAnimals;
  const base = AppData.zodiacBaseYear;
  const idx = ((year - base) % 12 + 12) % 12;
  return animals[idx];
}

function renderFortuneView(view) {
  const container = document.getElementById('fortune-container');
  const state = App.state.fortune;

  if (view === 'input') {
    const currentYear = new Date().getFullYear();
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">🔮</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">오늘의 운세</h2>
        <p class="text-slate-400 mb-6">출생연도를 입력하면 띠를 자동으로 계산해드려요</p>
        <input id="fortune-year-input" type="number" min="1924" max="${currentYear}" placeholder="출생연도 입력 (예: 1995)"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-amber-500 transition text-center text-xl tracking-widest"/>
        <div id="fortune-zodiac-preview" class="text-2xl mb-4 min-h-8"></div>
        <button onclick="fortuneSubmit()" class="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3 rounded-xl transition">
          오늘의 운세 확인하기
        </button>
      </div>`;

    document.getElementById('fortune-year-input').addEventListener('input', function() {
      const y = parseInt(this.value);
      const preview = document.getElementById('fortune-zodiac-preview');
      if (y >= 1924 && y <= currentYear) {
        const zodiac = getZodiacFromYear(y);
        const data = AppData.fortuneData[zodiac];
        preview.textContent = `${data?.emoji || ''} ${zodiac}띠`;
        preview.className = 'text-2xl mb-4 text-amber-400 font-bold';
      } else {
        preview.textContent = '';
      }
    });
    document.getElementById('fortune-year-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') fortuneSubmit();
    });
  }

  else if (view === 'result') {
    const zodiac = state.zodiac;
    const data = AppData.fortuneData[zodiac];
    if (!data) { renderFortuneView('input'); return; }

    // 24시간(KST) 단위 시드 — 같은 날엔 모든 방문자에게 같은 운세가 뜨도록 함 (오늘의 인생 한마디와 동일한 방식)
    const zodiacIdx = AppData.zodiacAnimals.indexOf(zodiac);
    const seed = dailyQuoteSeed() + zodiacIdx * 97;

    // 카테고리별로 오늘의 variant를 결정론적으로 선택 (v0.0.35~, 띠×카테고리당 최대 7벌 순환)
    const fortune = data.categories.map((cat, i) => {
      const vIdx = Math.floor(seededRandom(seed + i * 31) * cat.variants.length);
      return { title: cat.title, ...cat.variants[vIdx] };
    });

    // 운 점수 (3~5)를 시드 기반으로 생성 (variant 선택과는 다른 오프셋을 써서 서로 독립적으로 변하게 함)
    const scores = fortune.map((_, i) => Math.floor(seededRandom(seed + i * 17 + 500) * 3) + 3);
    const starMap = (n) => '★'.repeat(n) + '☆'.repeat(5-n);
    const avgScore = (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1);
    const shareText = `나 오늘 운세 이렇대~ 「${fortune[0].positive}」 (${zodiac}띠 ⭐${avgScore}/5.0, 행운숫자 ${data.luckyNum}) 너도 확인해봐 👉`;

    // 로또 조합기 연동용 저장
    localStorage.setItem('last_fortune_luckynum', data.luckyNum);

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-2">${data.emoji}</div>
          <h2 class="text-2xl font-bold text-slate-100">${zodiac}띠 오늘의 운세</h2>
          <p class="text-slate-400 text-sm">${new Date().toLocaleDateString('ko-KR', {year:'numeric',month:'long',day:'numeric'})} 기준</p>
          <div class="mt-2 text-amber-400 text-2xl tracking-widest">${starMap(Math.round(parseFloat(avgScore)))}</div>
          <div class="text-amber-300 font-bold text-lg">${avgScore} / 5.0</div>
          <div class="inline-block mt-3 bg-amber-900/30 border border-amber-700/40 rounded-full px-4 py-1.5 text-amber-300 text-sm font-semibold">
            🍀 오늘의 행운 숫자: ${data.luckyNum}
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 mb-6">
          ${fortune.map((f, i) => `
            <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div class="flex items-center justify-between mb-2">
                <span class="text-slate-100 font-bold">${f.title}</span>
                <span class="text-amber-400 tracking-widest text-sm">${starMap(scores[i])}</span>
              </div>
              <p class="text-emerald-400 text-sm font-semibold mb-1">${f.positive}</p>
              <p class="text-slate-400 text-sm leading-relaxed">${f.detail}</p>
            </div>`).join('')}
        </div>

        ${renderIdentityShareRow('fortune', { zodiac: ZODIAC_SLUG[zodiac], nickname: getNickname() || '나', result: fortune[0].positive }, `${location.origin}/share-cards/fortune-${ZODIAC_SLUG[zodiac]}.jpg`, `오늘의 ${zodiac}띠 운세!`, fortune[0].positive, shareText)}

        ${renderPlaceholderUI('fortune', zodiac)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 운세는 오락 목적의 참고 자료이며 실제 미래를 예측하지 않습니다.
        </div>
        <button onclick="initFortune()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다른 연도로 다시 확인
        </button>
      </div>`;

    saveRanking('fortune', state.year + '년생 ' + zodiac + '띠', avgScore + '점');
    renderLocalRanking('fortune-ranking-list', 'fortune');
  }
}

function fortuneSubmit() {
  const y = parseInt(document.getElementById('fortune-year-input').value);
  if (!y || y < 1924 || y > new Date().getFullYear()) {
    showToast('올바른 출생연도를 입력해주세요!'); return;
  }
  const zodiac = getZodiacFromYear(y);
  App.state.fortune.zodiac = zodiac;
  App.state.fortune.year = y;
  bumpEngagement('site-fortune-plays');
  App.showLoader(() => renderFortuneView('result'));
}

/* ══════════════════════════════════════════════════
   🧠 두뇌 나이 측정기 (스트룹 테스트)
══════════════════════════════════════════════════ */
const STROOP_COLORS = {
  easy: [
    { name: '빨강', class: 'stroop-red' },
    { name: '파랑', class: 'stroop-blue' },
    { name: '초록', class: 'stroop-green' },
    { name: '노랑', class: 'stroop-yellow' },
  ],
  medium: [
    { name: '빨강', class: 'stroop-red' },
    { name: '파랑', class: 'stroop-blue' },
    { name: '초록', class: 'stroop-green' },
    { name: '노랑', class: 'stroop-yellow' },
    { name: '보라', class: 'stroop-purple' },
  ],
  hard: [
    { name: '빨강', class: 'stroop-red' },
    { name: '파랑', class: 'stroop-blue' },
    { name: '초록', class: 'stroop-green' },
    { name: '노랑', class: 'stroop-yellow' },
    { name: '보라', class: 'stroop-purple' },
    { name: '주황', class: 'stroop-orange' },
  ],
  hell: [
    { name: '빨강', class: 'stroop-red' },
    { name: '파랑', class: 'stroop-blue' },
    { name: '초록', class: 'stroop-green' },
    { name: '노랑', class: 'stroop-yellow' },
    { name: '보라', class: 'stroop-purple' },
    { name: '주황', class: 'stroop-orange' },
    { name: '분홍', class: 'stroop-pink' },
    { name: '하늘', class: 'stroop-sky' },
  ]
};
/* v0.0.28~: 난이도 3단계(쉬움/보통/어려움) — 색상 수뿐 아니라 문항 수·제한시간도 함께 강화
   v0.0.53~: HELL 난이도 추가(Tier 채점 8개 테스트 전용, Phase 3 로드맵 10-1) */
const STROOP_CONFIG = {
  easy:   { questions: 15, time: 5000, label: '쉬움' },
  medium: { questions: 20, time: 4000, label: '보통' },
  hard:   { questions: 25, time: 3000, label: '어려움' },
  hell:   { questions: 35, time: 1800, label: 'HELL' },
};

function initBrain() {
  if (App.state.brain.timerID) clearTimeout(App.state.brain.timerID);
  const challenge = (App.pendingChallenge && App.pendingChallenge.section === 'brain') ? App.pendingChallenge.data : null;
  App.pendingChallenge = null;
  App.state.brain = { nickname: '', difficulty: null, questions: [], step: 0, correctCount: 0, totalTime: 0, startTime: 0, timerID: null, challenge };
  renderBrainView('start');
}

function renderBrainView(view) {
  const container = document.getElementById('brain-container');
  const state = App.state.brain;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">⚡</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">두뇌 나이 측정기</h2>
        <p class="text-slate-400 mb-6">스트룹 테스트 — 글자의 뜻이 아닌<br><strong class="text-slate-100">글자 색상</strong>에 해당하는 버튼을 누르세요!</p>
        ${guideCardHTML(
          ['화면에 색깔 글자가 나타나요 (예: 파란색으로 쓰인 "빨강")', '글자의 뜻이 아니라 실제 색상에 해당하는 버튼을 누르세요', '제한시간 안에 최대한 정확하고 빠르게 답할수록 좋아요']
        )}
        ${renderChallengeBanner(state.challenge)}
        <input id="brain-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-emerald-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">난이도 선택</p>
        <div class="grid grid-cols-3 gap-3">
          <button onclick="brainSelectDifficulty('easy')" class="bg-emerald-800/50 hover:bg-emerald-700/70 border border-emerald-600 text-emerald-300 font-bold py-4 rounded-xl transition">
            <div class="text-2xl mb-1">🟢</div>
            쉬움<br><span class="text-xs font-normal opacity-70">색상 4개 · 15문항</span>
          </button>
          <button onclick="brainSelectDifficulty('medium')" class="bg-amber-800/50 hover:bg-amber-700/70 border border-amber-600 text-amber-300 font-bold py-4 rounded-xl transition">
            <div class="text-2xl mb-1">🟡</div>
            보통<br><span class="text-xs font-normal opacity-70">색상 5개 · 20문항</span>
          </button>
          <button onclick="brainSelectDifficulty('hard')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-4 rounded-xl transition">
            <div class="text-2xl mb-1">🔴</div>
            어려움<br><span class="text-xs font-normal opacity-70">색상 6개 · 25문항</span>
          </button>
        </div>
        <button onclick="confirmHellMode('brainSelectDifficulty')" class="w-full mt-3 bg-gradient-to-r from-red-950 to-black hover:from-red-900 border-2 border-red-600 text-red-400 font-black py-4 rounded-xl transition flex items-center justify-center gap-2">
          <span class="text-2xl">🔥</span> HELL 난이도 <span class="text-xs font-normal opacity-70">(색상 8개 · 35문항 · 상급자 전용)</span>
        </button>
      </div>`;
  }

  else if (view === 'question') {
    const q = state.questions[state.step];
    const colors = STROOP_COLORS[state.difficulty];
    const cfg = STROOP_CONFIG[state.difficulty];
    const progress = Math.round((state.step / cfg.questions) * 100);

    container.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님 · ${cfg.label}</span>
          <span class="text-emerald-400 font-bold text-sm">${state.step + 1} / ${cfg.questions}</span>
        </div>
        <div class="progress-bar-track mb-2">
          <div class="progress-bar-fill" style="width:${progress}%"></div>
        </div>
        <div id="time-gauge-track" class="bg-slate-700 rounded-full h-2 mb-6 overflow-hidden">
          <div id="time-gauge-bar" class="h-full rounded-full"></div>
        </div>
        <div class="text-center mb-8">
          <span class="text-7xl font-black ${q.displayColor.class}">${q.word}</span>
        </div>
        <p class="text-slate-400 text-center text-sm mb-4">이 글자의 <strong class="text-slate-100">색상</strong>은?</p>
        <div class="grid grid-cols-2 gap-3">
          ${colors.map(c => `
            <button onclick="brainAnswer('${c.name}')"
              class="bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-emerald-500 text-slate-100 font-bold py-4 rounded-xl text-lg transition">
              <span class="${c.class} font-black">${c.name}</span>
            </button>`).join('')}
        </div>
      </div>`;

    // 게이지 바 애니메이션 시작
    const bar = document.getElementById('time-gauge-bar');
    if (bar) {
      bar.style.width = '100%';
      bar.style.transition = `width ${cfg.time}ms linear`;
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = '0%'; }));
    }

    // 타이머 설정 (난이도별 제한시간 경과 시 자동 오답)
    state.startTime = Date.now();
    if (state.timerID) clearTimeout(state.timerID);
    state.timerID = setTimeout(() => {
      brainTimeUp();
    }, cfg.time);
  }

  else if (view === 'result') {
    const cfg = STROOP_CONFIG[state.difficulty];
    const avgMs = state.totalTime / cfg.questions;
    const accuracy = (state.correctCount / cfg.questions) * 100;

    // 두뇌 나이 계산
    let brainAge, tier, tierColor, tierBg;
    const score = accuracy - (avgMs / 100);

    if (score >= 85) { brainAge = Math.floor(Math.random() * 5) + 16; tier = 'S'; tierColor = 'text-yellow-300'; tierBg = 'bg-yellow-900/40 border-yellow-600'; }
    else if (score >= 70) { brainAge = Math.floor(Math.random() * 5) + 20; tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; }
    else if (score >= 55) { brainAge = Math.floor(Math.random() * 6) + 28; tier = 'B'; tierColor = 'text-blue-300'; tierBg = 'bg-blue-900/40 border-blue-600'; }
    else if (score >= 40) { brainAge = Math.floor(Math.random() * 7) + 38; tier = 'C'; tierColor = 'text-violet-300'; tierBg = 'bg-violet-900/40 border-violet-600'; }
    else { brainAge = Math.floor(Math.random() * 10) + 50; tier = 'D'; tierColor = 'text-rose-300'; tierBg = 'bg-rose-900/40 border-rose-600'; }

    const tierMsgBank = {
      S: ['초인급 두뇌! 신호등 대왕', '뇌 나이가 아니라 뇌 IQ 아니야? 압도적인 처리속도!', '이 정도면 뇌를 국가대표로 등록해야 하는 거 아닐까?'],
      A: ['날카로운 집중력의 소유자', '또래보다 훨씬 젊은 뇌! 이 컨디션 계속 유지해봐', '순발력 甲! 색깔 함정에 거의 안 걸리네'],
      B: ['평균 이상의 반응속도', '무난하게 잘 하고 있어, 딱 평균 뇌 나이', '나쁘지 않은데? 조금만 더 집중하면 등급 업 가능'],
      C: ['약간 느린 처리 속도, 충분히 개선 가능!', '오늘따라 살짝 헷갈렸나봐, 다음엔 색깔에 더 집중해보자', '생각보다 함정에 잘 걸리는 편이네, 연습하면 금방 는다'],
      D: ['오늘 컨디션이 안 좋은 날? 다시 도전해보세요!', '괜찮아, 뇌도 워밍업이 필요해! 몇 판 더 해보자', '오늘은 컨디션 난이도가 좀 셌나봐, 낮은 난이도부터 다시 가보자']
    };
    const tierMsg = pickOne(tierMsgBank[tier]);
    const animalCard = pickAnimalCard('brain', tier);
    const shareText = `🐾 나는 ${animalCard.title}! 나의 두뇌 나이는 ${brainAge}세, 정확도 ${accuracy.toFixed(0)}%, 평균 반응속도 ${(avgMs/1000).toFixed(2)}초. 티어: ${tier} - ${tierMsg}`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🧠</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 두뇌 나이</h2>
          <div class="text-7xl font-black text-slate-100 my-4">${brainAge}<span class="text-3xl text-slate-400">세</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <div id="percentile-badge-brain" class="text-xs text-violet-300 mt-2"></div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
        ${animalCardHTML(animalCard)}

        ${renderChallengeCompareCard(brainAge + '세 (Tier ' + tier + ')', state.challenge, 'brain', state.nickname, state.difficulty)}

        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-emerald-400">${state.correctCount}</div>
            <div class="text-slate-400 text-xs">정답 수</div>
            <div class="text-slate-500 text-xs">/ ${cfg.questions}</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-blue-400">${accuracy.toFixed(0)}%</div>
            <div class="text-slate-400 text-xs">정확도</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-violet-400">${(avgMs/1000).toFixed(2)}s</div>
            <div class="text-slate-400 text-xs">평균 반응속도</div>
          </div>
        </div>

        ${renderShareRow('brain', tier, animalCard._idx, state.nickname, brainAge + '세 (Tier ' + tier + ')', shareText, animalCard)}
        ${renderChallengeButton('brain', state.nickname, brainAge + '세 (Tier ' + tier + ')', state.difficulty)}

        ${renderPlaceholderUI('brain', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs">
          ⚠️ 본 결과는 오락 목적이며 의학적 진단을 대체하지 않습니다.
        </div>
        <button onclick="initBrain()" class="w-full mt-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('brain', state.nickname, brainAge + '세 (Tier ' + tier + ')', state.difficulty);
    renderPercentileBadge('brain', tier, state.difficulty);
    if (tier === 'S') playSound('tierS');
    renderLocalRanking('brain-ranking-list', 'brain');
  }
}

function brainSelectDifficulty(difficulty) {
  const nickname = document.getElementById('brain-nickname').value.trim();
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-brain-plays');
  const state = App.state.brain;
  state.nickname = nickname;
  state.difficulty = difficulty;
  state.questions = generateStroopQuestions(difficulty);
  state.step = 0;
  state.correctCount = 0;
  state.totalTime = 0;
  showCountdownThenStart('brain-container', () => renderBrainView('question'));
}

function generateStroopQuestions(difficulty) {
  const colors = STROOP_COLORS[difficulty];
  const total = STROOP_CONFIG[difficulty].questions;
  const questions = [];
  for (let i = 0; i < total; i++) {
    const word = colors[Math.floor(Math.random() * colors.length)];
    let displayColor = colors[Math.floor(Math.random() * colors.length)];
    // 절반은 일치, 절반은 불일치 (스트룹 효과)
    if (i % 2 === 0) displayColor = word;
    questions.push({ word: word.name, correctColor: displayColor.name, displayColor });
  }
  return questions;
}

function brainAnswer(colorName) {
  const state = App.state.brain;
  const cfg = STROOP_CONFIG[state.difficulty];
  if (state.timerID) clearTimeout(state.timerID);
  const elapsed = Date.now() - state.startTime;
  state.totalTime += Math.min(elapsed, cfg.time);
  if (colorName === state.questions[state.step].correctColor) {
    state.correctCount++;
    state.streak = (state.streak || 0) + 1;
    playSound('correct');
    showToast('✅ 정답!' + comboSuffix(state.streak));
  } else {
    state.streak = 0;
    playSound('wrong');
    showToast('❌ 오답');
  }
  brainNextQuestion();
}

function brainTimeUp() {
  const state = App.state.brain;
  state.totalTime += STROOP_CONFIG[state.difficulty].time;
  showToast('⏱️ 시간 초과!');
  brainNextQuestion();
}

function brainNextQuestion() {
  const state = App.state.brain;
  state.step++;
  if (state.step >= STROOP_CONFIG[state.difficulty].questions) {
    App.showLoader(() => renderBrainView('result'));
  } else {
    renderBrainView('question');
  }
}

/* ══════════════════════════════════════════════════
   ⚡ 프로 미루러 (ADHD) 섹션
══════════════════════════════════════════════════ */
function initAdhd() {
  App.state.adhd = { nickname: '', mode: null, questions: [], answers: [], step: 0 };
  renderAdhdView('start');
}

function renderAdhdView(view) {
  const container = document.getElementById('adhd-container');
  const { adhdResults } = AppData;
  const state = App.state.adhd;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">⚡</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">프로 미루러 (ADHD 성향 진단)</h2>
        <p class="text-slate-400 mb-6">집중력 결핍 성향 자가 체크<br>결과는 전문 진단이 아닌 참고용입니다.</p>
        <input id="adhd-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-rose-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">모드 선택</p>
        <div class="grid grid-cols-2 gap-3">
          <button onclick="adhdStart('simple')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-4 rounded-xl transition">
            <div class="text-2xl mb-1">⚡</div>
            간단 모드<br><span class="text-xs font-normal opacity-70">10문항</span>
          </button>
          <button onclick="adhdStart('precise')" class="bg-pink-800/50 hover:bg-pink-700/70 border border-pink-600 text-pink-300 font-bold py-4 rounded-xl transition">
            <div class="text-2xl mb-1">🔬</div>
            정밀 모드<br><span class="text-xs font-normal opacity-70">20문항 · 2개 영역 분리</span>
          </button>
        </div>
      </div>`;
  }

  else if (view === 'question') {
    const q = state.questions[state.step];
    const progress = Math.round((state.step / state.questions.length) * 100);
    const scaleOptions = state.mode === 'precise'
      ? [['항상 그렇다', 3], ['자주 그렇다', 2], ['가끔 그렇다', 1], ['전혀 아니다', 0]]
      : [['항상 그렇다', 2], ['자주 그렇다', 1], ['가끔 그렇다', 0], ['전혀 아니다', 0]];
    container.innerHTML = `
      <div class="max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님 · ${state.mode === 'precise' ? '정밀' : '간단'}</span>
          <span class="text-rose-400 font-bold text-sm">${state.step + 1} / ${state.questions.length}</span>
        </div>
        <div class="progress-bar-track mb-6" style="--from:#f43f5e;--to:#ec4899">
          <div class="h-full rounded-full transition-all" style="width:${progress}%;background:linear-gradient(90deg,#f43f5e,#ec4899)"></div>
        </div>
        <h3 class="text-slate-100 text-xl font-semibold mb-6 leading-relaxed">Q${state.step+1}. ${q.q}</h3>
        <div class="flex flex-col gap-3">
          ${scaleOptions.map(([label, val]) => `
            <button class="option-btn" onclick="adhdAnswer(${val})">
              ${label}
            </button>`).join('')}
        </div>
      </div>`;
  }

  else if (view === 'result') {
    const score = state.answers.reduce((a, b) => a + b, 0);
    // 정밀 모드(문항당 최대 3점, 10문항×2영역=최대 60점)를 간단 모드 등급표(최대 20점)에 그대로 대입하기 위해 1/3로 환산
    const gradeScore = state.mode === 'precise' ? Math.round(score / 3) : score;
    const result = adhdResults.find(r => gradeScore >= r.range[0] && gradeScore <= r.range[1]) || adhdResults[adhdResults.length-1];
    const maxScore = state.mode === 'precise' ? 60 : 20;
    const shareText = `나 ADHD 성향 테스트 해봤는데 ${result.grade}등급 나왔어! 「${result.title}」 ㅋㅋ 너도 궁금하지 않아? 👉`;

    // 정밀 모드 전용: 부주의 / 과잉행동-충동성 영역별 점수 바
    let domainBarsHtml = '';
    if (state.mode === 'precise') {
      const domainSum = (domain) => state.questions.reduce((sum, q, i) => q.domain === domain ? sum + state.answers[i] : sum, 0);
      const inattention = domainSum('inattention');
      const hyperactivity = domainSum('hyperactivity');
      const domains = [
        { label: '부주의', score: inattention, color: '#f43f5e' },
        { label: '과잉행동-충동성', score: hyperactivity, color: '#ec4899' },
      ];
      domainBarsHtml = `
        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <h4 class="text-slate-100 font-bold mb-3">📊 영역별 점수 (정밀 모드)</h4>
          <div class="flex flex-col gap-3">
            ${domains.map(d => `
              <div>
                <div class="flex justify-between text-xs text-slate-400 mb-1">
                  <span>${d.label}</span><span>${d.score} / 30</span>
                </div>
                <div class="bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div class="h-full rounded-full" style="width:${Math.round(d.score/30*100)}%;background:${d.color}"></div>
                </div>
              </div>`).join('')}
          </div>
        </div>`;
    }

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">${result.emoji}</div>
          <div class="text-4xl font-black text-slate-100 mb-1">등급 ${result.grade}</div>
          <div class="text-rose-400 font-bold text-xl mb-2">${result.title}</div>
          <p class="text-slate-400">${state.nickname} 님의 진단 점수: <strong class="text-slate-100">${score}점</strong> / ${maxScore}점</p>
        </div>

        ${domainBarsHtml}

        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <p class="text-slate-300 leading-relaxed">${result.desc}</p>
        </div>
        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <p class="text-slate-400 leading-relaxed text-sm">${result.detail}</p>
        </div>
        <div class="bg-rose-900/30 border border-rose-700/40 rounded-xl p-4 mb-4">
          <h4 class="text-rose-300 font-bold mb-3">💡 ${state.nickname} 님을 위한 행동 개선 가이드</h4>
          <ul class="space-y-2">
            ${result.tips.map(tip => `
              <li class="flex gap-2 text-slate-300 text-sm">
                <span class="text-rose-400 mt-0.5">▸</span>
                <span>${tip}</span>
              </li>`).join('')}
          </ul>
        </div>

        ${renderIdentityShareRow('adhd', { grade: result.grade, nickname: state.nickname, result: `${result.grade}등급 - ${result.title}` }, `${location.origin}/share-cards/adhd-${result.grade}.jpg`, `${state.nickname} 님의 ADHD 성향 진단 결과`, `${result.grade}등급 - ${result.title}`, shareText)}

        ${renderPlaceholderUI('adhd', result.grade)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 및 자기 이해 목적의 자가 체크리스트이며 전문 의학 진단을 대체하지 않습니다. ADHD가 의심되면 정신건강의학과 전문의와 상담하세요.
        </div>
        <button onclick="initAdhd()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 진단하기
        </button>
      </div>`;

    saveRanking('adhd', state.nickname, '등급 ' + result.grade + ' (' + score + '점)');
    renderLocalRanking('adhd-ranking-list', 'adhd');
  }
}

function adhdStart(mode) {
  const nickname = document.getElementById('adhd-nickname').value.trim();
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-adhd-plays');
  const state = App.state.adhd;
  state.nickname = nickname;
  state.mode = mode;
  state.questions = mode === 'precise' ? AppData.adhdQuestionsPrecise : AppData.adhdQuestions;
  state.answers = [];
  state.step = 0;
  renderAdhdView('question');
}

function adhdAnswer(val) {
  const state = App.state.adhd;
  state.answers.push(val);
  state.step++;
  if (state.step >= state.questions.length) {
    App.showLoader(() => renderAdhdView('result'));
  } else {
    renderAdhdView('question');
  }
}

/* ══════════════════════════════════════════════════
   💨 반응속도 테스트 (v0.0.12~)
   - 쉬움/보통/어려움 3단계. 어려움은 "가짜 신호"(디코이)가 섞여 충동억제 요소가 가미됨
   - 모바일 터치 지연 최소화를 위해 click 대신 pointerdown 사용 (PRD.md 모바일 우선 원칙 반영)
══════════════════════════════════════════════════ */
const REACTION_CONFIG = {
  easy:   { label: '쉬움',   rounds: 5,  minDelay: 1200, maxDelay: 2800, decoyChance: 0,    foulPenalty: 0 },
  normal: { label: '보통',   rounds: 7,  minDelay: 900,  maxDelay: 3200, decoyChance: 0,    foulPenalty: 300 },
  hard:   { label: '어려움', rounds: 10, minDelay: 600,  maxDelay: 3800, decoyChance: 0.3,  foulPenalty: 400 },
  hell:   { label: 'HELL',   rounds: 15, minDelay: 400,  maxDelay: 4500, decoyChance: 0.45, foulPenalty: 500 },
};

function initReaction() {
  if (App.state.reaction.delayTimer) clearTimeout(App.state.reaction.delayTimer);
  const challenge = (App.pendingChallenge && App.pendingChallenge.section === 'reaction') ? App.pendingChallenge.data : null;
  App.pendingChallenge = null;
  App.state.reaction = { nickname: '', difficulty: null, round: 0, totalRounds: 0, times: [], fouls: 0, delayTimer: null, stimulusAt: 0, phase: 'idle', challenge };
  renderReactionView('start');
}

function renderReactionView(view) {
  const container = document.getElementById('reaction-container');
  const state = App.state.reaction;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">💨</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">반응속도 테스트</h2>
        <p class="text-slate-400 mb-6">화면이 초록색으로 바뀌는 순간 최대한 빨리 탭하세요!<br>너무 일찍 누르면 반칙이에요.</p>
        ${guideCardHTML(
          ['화면이 빨간색일 땐 그냥 기다리세요 (너무 빨리 누르면 반칙!)', '초록색으로 바뀌는 순간 화면을 최대한 빨리 탭하세요', '여러 번 반복해서 평균 반응속도를 측정해요']
        )}
        ${renderChallengeBanner(state.challenge)}
        <input id="reaction-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-cyan-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">난이도 선택</p>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="reactionStart('easy')" class="bg-emerald-800/50 hover:bg-emerald-700/70 border border-emerald-600 text-emerald-300 font-bold py-3 rounded-xl transition text-sm">
            🟢 쉬움<br><span class="text-xs font-normal opacity-70">5회</span>
          </button>
          <button onclick="reactionStart('normal')" class="bg-amber-800/50 hover:bg-amber-700/70 border border-amber-600 text-amber-300 font-bold py-3 rounded-xl transition text-sm">
            🟡 보통<br><span class="text-xs font-normal opacity-70">7회</span>
          </button>
          <button onclick="reactionStart('hard')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-3 rounded-xl transition text-sm">
            🔴 어려움<br><span class="text-xs font-normal opacity-70">10회+가짜신호</span>
          </button>
        </div>
        <button onclick="confirmHellMode('reactionStart')" class="w-full mt-3 bg-gradient-to-r from-red-950 to-black hover:from-red-900 border-2 border-red-600 text-red-400 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
          <span class="text-xl">🔥</span> HELL 난이도 <span class="text-xs font-normal opacity-70">(15회·가짜신호45%·상급자 전용)</span>
        </button>
      </div>`;
  }

  else if (view === 'round') {
    container.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-4">
          <span class="text-slate-400 text-sm">${state.nickname} 님 · ${REACTION_CONFIG[state.difficulty].label}</span>
          <span id="reaction-round-counter" class="text-cyan-400 font-bold text-sm">${state.round + 1} / ${state.totalRounds}</span>
        </div>
        <div class="progress-bar-track mb-6">
          <div id="reaction-progress-fill" class="progress-bar-fill" style="width:${Math.round((state.round / state.totalRounds) * 100)}%"></div>
        </div>
        <div id="reaction-box"
          class="select-none rounded-2xl h-64 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-100 bg-slate-800 border-2 border-slate-600"
          style="touch-action:manipulation;">
          <span id="reaction-box-emoji" class="text-5xl mb-3">⏳</span>
          <span id="reaction-box-text" class="text-slate-300 font-bold text-lg px-4">잠시 후 초록색으로 바뀌면 탭하세요</span>
        </div>
        <p id="reaction-feedback" class="text-center text-slate-500 text-sm mt-4 min-h-6"></p>
      </div>`;

    const box = document.getElementById('reaction-box');
    box.addEventListener('pointerdown', reactionHandleClick, { passive: false });
    reactionBeginRound();
  }

  else if (view === 'result') {
    const avgMs = Math.round(state.times.reduce((a, b) => a + b, 0) / state.times.length);
    const bestMs = Math.min(...state.times);
    const worstMs = Math.max(...state.times);

    let tier, tierColor, tierBg, tierMsg;
    if (avgMs <= 220)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = ['F1 레이서 스카우트 제의가 들어올지도? 오늘 하루도 그 반응속도로 다 씹어먹자.', '게임 프로게이머 해도 되겠는데? 손이 눈보다 빠르다', '번개보다 빠른 반응속도, 오늘 하루 무적모드 발동']; }
    else if (avgMs <= 260) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = ['꽤 빠른데? 오늘 하루도 딱 이 텐션 유지해봐.', '순발력 甲! 웬만한 잽은 다 피하겠어', '빠릿빠릿한데? 오늘 중요한 순간 놓치지 않겠어']; }
    else if (avgMs <= 320) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = ['평균은 하는 편! 그래도 방심은 금물, 딴짓하다 버스 놓치지 말자.', '평범한데 무난한 반응속도, 나쁘지 않아', '중간은 가는 편! 조금만 더 집중하면 상위권']; }
    else if (avgMs <= 400) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = ['음... 오늘따라 반응이 좀 느긋하네. 뜨거운 국물 먹을 때 조심하자.', '살짝 굼뜬 편이네, 커피 한 잔 어때?', '반응이 느긋한 날인가봐, 무리한 운전은 피하자']; }
    else                   { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = ['어쩔 수 없지, 오늘은 주위를 잘 살피면서 걷자고~', '오늘은 몸이 로딩 중인가봐, 푹 쉬고 다시 도전해보자', '괜찮아, 반응속도보다 안전이 최고지! 천천히 가자']; }
    tierMsg = pickOne(tierMsg);

    const animalCard = pickAnimalCard('reaction', tier);
    const shareText = `🐾 나는 ${animalCard.title}! 나의 반응속도는 평균 ${avgMs}ms, 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">💨</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 반응속도</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${avgMs}<span class="text-2xl text-slate-400">ms</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <div id="percentile-badge-reaction" class="text-xs text-violet-300 mt-2"></div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
        ${animalCardHTML(animalCard)}

        ${renderChallengeCompareCard(avgMs + 'ms (Tier ' + tier + ')', state.challenge, 'reaction', state.nickname, state.difficulty)}

        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-cyan-400">${bestMs}ms</div>
            <div class="text-slate-400 text-xs">최고 기록</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-slate-300">${worstMs}ms</div>
            <div class="text-slate-400 text-xs">최저 기록</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-rose-400">${state.fouls}</div>
            <div class="text-slate-400 text-xs">반칙 횟수</div>
          </div>
        </div>

        ${renderShareRow('reaction', tier, animalCard._idx, state.nickname, avgMs + 'ms (Tier ' + tier + ')', shareText, animalCard)}
        ${renderChallengeButton('reaction', state.nickname, avgMs + 'ms (Tier ' + tier + ')', state.difficulty)}

        ${renderPlaceholderUI('reaction', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 신경학적 반응속도 측정과 다를 수 있습니다.
        </div>
        <button onclick="initReaction()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('reaction', state.nickname, avgMs + 'ms (Tier ' + tier + ')', state.difficulty);
    renderPercentileBadge('reaction', tier, state.difficulty);
    if (tier === 'S') playSound('tierS');
    renderLocalRanking('reaction-ranking-list', 'reaction');
  }
}

function reactionStart(difficulty) {
  const input = document.getElementById('reaction-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-reaction-plays');
  const cfg = REACTION_CONFIG[difficulty];
  App.state.reaction = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    times: [], fouls: 0, delayTimer: null, stimulusAt: 0, phase: 'idle',
  };
  showCountdownThenStart('reaction-container', () => renderReactionView('round'));
}

function reactionSetBox(colorClasses, emoji, text) {
  const box = document.getElementById('reaction-box');
  if (!box) return;
  box.className = `select-none rounded-2xl h-64 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-100 border-2 ${colorClasses}`;
  const emojiEl = document.getElementById('reaction-box-emoji');
  const textEl = document.getElementById('reaction-box-text');
  if (emojiEl) emojiEl.textContent = emoji;
  if (textEl) textEl.textContent = text;
}

function reactionUpdateProgress() {
  const state = App.state.reaction;
  const counter = document.getElementById('reaction-round-counter');
  const fill = document.getElementById('reaction-progress-fill');
  if (counter) counter.textContent = `${state.round + 1} / ${state.totalRounds}`;
  if (fill) fill.style.width = `${Math.round((state.round / state.totalRounds) * 100)}%`;
}

function reactionBeginRound() {
  const state = App.state.reaction;
  const cfg = REACTION_CONFIG[state.difficulty];
  reactionUpdateProgress();
  state.phase = 'waiting';
  reactionSetBox('bg-slate-800 border-slate-600', '⏳', '잠시 후 초록색으로 바뀌면 탭하세요');

  const delay = cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay);
  const useDecoy = Math.random() < cfg.decoyChance;

  if (useDecoy) {
    state.delayTimer = setTimeout(() => {
      state.phase = 'decoy';
      reactionSetBox('bg-orange-600 border-orange-400', '⚠️', '아직이에요! 누르지 마세요');
      state.delayTimer = setTimeout(() => {
        state.phase = 'waiting';
        reactionSetBox('bg-slate-800 border-slate-600', '⏳', '진짜는 아직...');
        state.delayTimer = setTimeout(reactionShowStimulus, 400 + Math.random() * 700);
      }, 500);
    }, delay * 0.5);
  } else {
    state.delayTimer = setTimeout(reactionShowStimulus, delay);
  }
}

function reactionShowStimulus() {
  const state = App.state.reaction;
  state.phase = 'go';
  state.stimulusAt = performance.now();
  reactionSetBox('bg-emerald-500 border-emerald-300', '⚡', '지금 탭하세요!');
}

function reactionAdvance() {
  if (App.state.currentSection !== 'reaction') return; // 다른 섹션으로 이동한 경우 타이머 콜백 무시
  const state = App.state.reaction;
  state.round++;
  if (state.round >= state.totalRounds) {
    App.showLoader(() => renderReactionView('result'));
  } else {
    reactionBeginRound();
  }
}

function reactionHandleClick(e) {
  e.preventDefault();
  const state = App.state.reaction;
  const cfg = REACTION_CONFIG[state.difficulty];
  const feedback = document.getElementById('reaction-feedback');

  if (state.phase === 'waiting') {
    clearTimeout(state.delayTimer);
    state.fouls++;
    state.streak = 0;
    playSound('wrong');
    if (cfg.foulPenalty === 0) {
      if (feedback) feedback.textContent = '너무 빨랐어요! 다시 기다려주세요 🙈';
      reactionBeginRound();
    } else {
      state.times.push(cfg.foulPenalty + 700);
      if (feedback) feedback.textContent = '너무 빨랐어요! 반칙 페널티가 적용됐어요 😵';
      reactionAdvance();
    }
    return;
  }

  if (state.phase === 'decoy') {
    clearTimeout(state.delayTimer);
    state.fouls++;
    state.streak = 0;
    state.times.push(cfg.foulPenalty + 700);
    playSound('wrong');
    if (feedback) feedback.textContent = '앗, 가짜 신호였어요! 반칙 😵';
    reactionAdvance();
    return;
  }

  if (state.phase === 'go') {
    const ms = Math.round(performance.now() - state.stimulusAt);
    state.times.push(ms);
    state.phase = 'idle';
    state.streak = (state.streak || 0) + 1;
    playSound('correct');
    reactionSetBox('bg-cyan-600 border-cyan-400', '✅', `${ms}ms!`);
    if (feedback) feedback.textContent = comboSuffix(state.streak);
    state.delayTimer = setTimeout(reactionAdvance, 700);
    return;
  }
}

/* ══════════════════════════════════════════════════
   🔢 숫자 기억력 테스트 (v0.0.13~)
   - 적응형 난이도: 맞히면 다음 라운드 자릿수 +1, 틀리면 -1 (staircase 방식)
   - 어려움 모드는 암기 후 3초간 "방해 단계"를 넣어 작업기억 간섭 부여
══════════════════════════════════════════════════ */
const MEMDIGIT_CONFIG = {
  easy:   { label: '쉬움',   rounds: 6,  startLen: 3, perDigitMs: 900, minLen: 2, maxLen: 8,  distractor: false },
  normal: { label: '보통',   rounds: 8,  startLen: 4, perDigitMs: 700, minLen: 3, maxLen: 9,  distractor: false },
  hard:   { label: '어려움', rounds: 10, startLen: 5, perDigitMs: 500, minLen: 3, maxLen: 10, distractor: true  },
  hell:   { label: 'HELL',   rounds: 12, startLen: 6, perDigitMs: 350, minLen: 4, maxLen: 12, distractor: true  },
};

function initMemdigit() {
  if (App.state.memdigit.delayTimer) clearTimeout(App.state.memdigit.delayTimer);
  const challenge = (App.pendingChallenge && App.pendingChallenge.section === 'memdigit') ? App.pendingChallenge.data : null;
  App.pendingChallenge = null;
  App.state.memdigit = { nickname: '', difficulty: null, round: 0, totalRounds: 0, currentLen: 0, sequence: [], userInput: [], maxCorrectLen: 0, correctRounds: 0, delayTimer: null, phase: 'idle', challenge };
  renderMemdigitView('start');
}

function renderMemdigitView(view) {
  const container = document.getElementById('memdigit-container');
  const state = App.state.memdigit;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">🔢</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">숫자 기억력 테스트</h2>
        <p class="text-slate-400 mb-6">화면에 나타나는 숫자를 순서대로 외운 뒤<br>그대로 입력하세요. 틀리면 자릿수가 줄어들어요!</p>
        ${guideCardHTML(
          ['화면에 숫자가 순서대로 하나씩 나타나요', '다 보여주면 방금 본 순서 그대로 숫자를 입력하세요', '맞히면 자릿수가 늘고, 틀리면 줄어들어요 — 본인 한계까지 도전해보세요']
        )}
        ${renderChallengeBanner(state.challenge)}
        <input id="memdigit-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-cyan-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">난이도 선택</p>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="memdigitStart('easy')" class="bg-emerald-800/50 hover:bg-emerald-700/70 border border-emerald-600 text-emerald-300 font-bold py-3 rounded-xl transition text-sm">
            🟢 쉬움<br><span class="text-xs font-normal opacity-70">3자리부터</span>
          </button>
          <button onclick="memdigitStart('normal')" class="bg-amber-800/50 hover:bg-amber-700/70 border border-amber-600 text-amber-300 font-bold py-3 rounded-xl transition text-sm">
            🟡 보통<br><span class="text-xs font-normal opacity-70">4자리부터</span>
          </button>
          <button onclick="memdigitStart('hard')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-3 rounded-xl transition text-sm">
            🔴 어려움<br><span class="text-xs font-normal opacity-70">5자리+방해</span>
          </button>
        </div>
        <button onclick="confirmHellMode('memdigitStart')" class="w-full mt-3 bg-gradient-to-r from-red-950 to-black hover:from-red-900 border-2 border-red-600 text-red-400 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
          <span class="text-xl">🔥</span> HELL 난이도 <span class="text-xs font-normal opacity-70">(6자리부터·방해·상급자 전용)</span>
        </button>
      </div>`;
  }

  else if (view === 'round') {
    container.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-4">
          <span class="text-slate-400 text-sm">${state.nickname} 님 · ${MEMDIGIT_CONFIG[state.difficulty].label}</span>
          <span id="memdigit-round-counter" class="text-cyan-400 font-bold text-sm">${state.round + 1} / ${state.totalRounds}</span>
        </div>
        <div class="progress-bar-track mb-6">
          <div id="memdigit-progress-fill" class="progress-bar-fill" style="width:${Math.round((state.round / state.totalRounds) * 100)}%"></div>
        </div>
        <div id="memdigit-display" class="rounded-2xl h-40 flex items-center justify-center bg-slate-800 border-2 border-slate-600 mb-6">
          <span id="memdigit-display-text" class="text-6xl font-black text-slate-100 tracking-widest"></span>
        </div>
        <div id="memdigit-input-area"></div>
        <p id="memdigit-feedback" class="text-center text-slate-500 text-sm mt-4 min-h-6"></p>
      </div>`;
    memdigitBeginRound();
  }

  else if (view === 'result') {
    const accuracy = Math.round((state.correctRounds / state.totalRounds) * 100);
    const maxLen = state.maxCorrectLen;

    let tier, tierColor, tierBg, tierMsg;
    if (maxLen >= 9)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = ['천재 아니야? 전화번호는 안 적어도 다 외우겠는데?', '이 정도면 카드 번호도 한 번에 외우겠는데?', '인간 계산기 아니야? 숫자 암기력 최상위 클래스']; }
    else if (maxLen >= 8) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = ['기억력 甲! 오늘 장 볼 목록은 안 적어도 되겠어.', '숫자에 강한 편! 비밀번호 까먹을 일은 없겠다', '암기력 상위권! 잔소리처럼 반복 안 해도 기억하겠어']; }
    else if (maxLen >= 6) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = ['평균은 하는 기억력! 그래도 중요한 약속은 메모해두자.', '평범하게 잘 외우는 편, 나쁘지 않아', '무난한 기억력! 중요한 건 그래도 두 번 확인하자']; }
    else if (maxLen >= 4) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = ['음... 방금 뭐 외웠더라? 중요한 건 꼭 메모해두는 습관을 들이자.', '숫자가 좀 헷갈리는 편이네, 천천히 끊어서 외워보자', '살짝 아쉬운 기억력, 반복하면 금방 늘어']; }
    else                  { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = ['괜찮아, 메모 앱이 괜히 있는 게 아니야. 오늘부터 적극 활용하자!', '오늘따라 숫자가 안 외워지나봐, 컨디션 탓일지도', '괜찮아, 숫자보다 사람 얼굴 잘 기억하면 그게 더 중요하지']; }
    tierMsg = pickOne(tierMsg);

    const animalCard = pickAnimalCard('memdigit', tier);
    const shareText = `🐾 나는 ${animalCard.title}! 나의 숫자 기억력은 최대 ${maxLen}자리, 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;
    const myResultStr = maxLen + '자리 (Tier ' + tier + ')';

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🔢</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 숫자 기억력</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${maxLen}<span class="text-2xl text-slate-400">자리</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <div id="percentile-badge-memdigit" class="text-xs text-violet-300 mt-2"></div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
        ${animalCardHTML(animalCard)}

        ${renderChallengeCompareCard(myResultStr, state.challenge, 'memdigit', state.nickname, state.difficulty)}

        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-cyan-400">${state.correctRounds} / ${state.totalRounds}</div>
            <div class="text-slate-400 text-xs">정답 라운드</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-slate-300">${accuracy}%</div>
            <div class="text-slate-400 text-xs">정답률</div>
          </div>
        </div>

        ${renderShareRow('memdigit', tier, animalCard._idx, state.nickname, myResultStr, shareText, animalCard)}
        ${renderChallengeButton('memdigit', state.nickname, myResultStr, state.difficulty)}

        ${renderPlaceholderUI('memdigit', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 임상 기억력 검사와 다를 수 있습니다.
        </div>
        <button onclick="initMemdigit()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('memdigit', state.nickname, maxLen + '자리 (Tier ' + tier + ')', state.difficulty);
    renderPercentileBadge('memdigit', tier, state.difficulty);
    if (tier === 'S') playSound('tierS');
    renderLocalRanking('memdigit-ranking-list', 'memdigit');
  }
}

function memdigitStart(difficulty) {
  const input = document.getElementById('memdigit-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-memdigit-plays');
  const cfg = MEMDIGIT_CONFIG[difficulty];
  App.state.memdigit = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    currentLen: cfg.startLen, sequence: [], userInput: [],
    maxCorrectLen: 0, correctRounds: 0, delayTimer: null, phase: 'idle',
  };
  renderMemdigitView('round');
}

function memdigitBeginRound() {
  const state = App.state.memdigit;
  const counter = document.getElementById('memdigit-round-counter');
  const fill = document.getElementById('memdigit-progress-fill');
  if (counter) counter.textContent = `${state.round + 1} / ${state.totalRounds}`;
  if (fill) fill.style.width = `${Math.round((state.round / state.totalRounds) * 100)}%`;

  state.sequence = Array.from({ length: state.currentLen }, () => Math.floor(Math.random() * 10));
  state.userInput = [];
  state.phase = 'show';

  const inputArea = document.getElementById('memdigit-input-area');
  if (inputArea) inputArea.innerHTML = '';
  const feedback = document.getElementById('memdigit-feedback');
  if (feedback) feedback.textContent = '';

  if (state.round === 0) {
    memdigitCountdown(3);
  } else {
    memdigitFlashDigit(0);
  }
}

/* v0.1.7~: 첫 라운드 시작 전 3-2-1 카운트다운 + 0.3초 여유 후 첫 숫자 노출(너무 빨리 나온다는 피드백 반영) */
function memdigitCountdown(count) {
  const state = App.state.memdigit;
  if (App.state.currentSection !== 'memdigit') return;
  const displayText = document.getElementById('memdigit-display-text');
  if (count > 0) {
    if (displayText) { displayText.textContent = count; displayText.className = 'text-7xl font-black text-violet-400 anim-pop'; }
    state.delayTimer = setTimeout(() => memdigitCountdown(count - 1), 500);
  } else {
    if (displayText) { displayText.textContent = '시작!'; displayText.className = 'text-4xl font-black text-violet-400 anim-pop'; }
    state.delayTimer = setTimeout(() => {
      if (displayText) { displayText.textContent = ''; displayText.className = 'text-6xl font-black text-slate-100 tracking-widest'; }
      state.delayTimer = setTimeout(() => memdigitFlashDigit(0), 300);
    }, 500);
  }
}

function memdigitFlashDigit(idx) {
  const state = App.state.memdigit;
  if (App.state.currentSection !== 'memdigit') return;
  const cfg = MEMDIGIT_CONFIG[state.difficulty];
  const displayText = document.getElementById('memdigit-display-text');

  if (idx >= state.sequence.length) {
    if (cfg.distractor) {
      if (displayText) { displayText.textContent = '🙈 3초간 다른 생각 금지!'; displayText.className = 'text-2xl font-bold text-slate-400'; }
      state.delayTimer = setTimeout(() => {
        if (displayText) { displayText.textContent = ''; displayText.className = 'text-6xl font-black text-slate-100 tracking-widest'; }
        memdigitShowInputPad();
      }, 3000);
    } else {
      if (displayText) displayText.textContent = '';
      state.delayTimer = setTimeout(memdigitShowInputPad, 400);
    }
    return;
  }

  if (displayText) displayText.textContent = state.sequence[idx];
  state.delayTimer = setTimeout(() => {
    if (displayText) displayText.textContent = '';
    state.delayTimer = setTimeout(() => memdigitFlashDigit(idx + 1), 200);
  }, cfg.perDigitMs);
}

function memdigitShowInputPad() {
  const state = App.state.memdigit;
  if (App.state.currentSection !== 'memdigit') return;
  state.phase = 'input';
  const area = document.getElementById('memdigit-input-area');
  if (!area) return;
  area.innerHTML = `
    <div id="memdigit-entered" class="mb-3 flex items-center justify-center gap-2 flex-wrap min-h-10"></div>
    <div class="grid grid-cols-3 gap-2">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button onclick="memdigitPadTap(${n})" class="option-btn text-center text-xl font-bold">${n}</button>`).join('')}
      <button onclick="memdigitPadDelete()" class="option-btn text-center text-xl font-bold">⌫</button>
      <button onclick="memdigitPadTap(0)" class="option-btn text-center text-xl font-bold">0</button>
      <button onclick="memdigitPadSubmit()" class="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-lg">✔</button>
    </div>`;
  memdigitRenderEntered();
}

function memdigitRenderEntered() {
  const state = App.state.memdigit;
  const el = document.getElementById('memdigit-entered');
  if (!el) return;
  el.innerHTML = state.userInput.length
    ? state.userInput.map(d => `<span class="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-700 text-white font-bold text-sm">${d}</span>`).join('')
    : `<span class="text-slate-500 text-sm">숫자를 입력하세요</span>`;
}

function memdigitPadTap(n) {
  const state = App.state.memdigit;
  if (state.phase !== 'input' || state.userInput.length >= state.sequence.length) return;
  state.userInput.push(n);
  memdigitRenderEntered();
}

function memdigitPadDelete() {
  const state = App.state.memdigit;
  if (state.phase !== 'input') return;
  state.userInput.pop();
  memdigitRenderEntered();
}

function memdigitPadSubmit() {
  const state = App.state.memdigit;
  if (state.phase !== 'input') return;
  if (state.userInput.length === 0) { showToast('숫자를 입력해주세요!'); return; }

  const cfg = MEMDIGIT_CONFIG[state.difficulty];
  const correct = state.userInput.length === state.sequence.length &&
    state.userInput.every((d, i) => d === state.sequence[i]);

  const feedback = document.getElementById('memdigit-feedback');
  if (correct) {
    state.correctRounds++;
    state.maxCorrectLen = Math.max(state.maxCorrectLen, state.currentLen);
    state.currentLen = Math.min(state.currentLen + 1, cfg.maxLen);
    playSound('correct');
    if (feedback) feedback.textContent = '정답! 다음엔 한 자리 더 늘어나요 🎉';
  } else {
    state.currentLen = Math.max(state.currentLen - 1, cfg.minLen);
    playSound('wrong');
    if (feedback) feedback.textContent = `아쉬워요! 정답은 ${state.sequence.join('')} 이었어요`;
  }
  state.phase = 'idle';
  state.delayTimer = setTimeout(memdigitAdvance, 1000);
}

function memdigitAdvance() {
  if (App.state.currentSection !== 'memdigit') return;
  const state = App.state.memdigit;
  state.round++;
  if (state.round >= state.totalRounds) {
    App.showLoader(() => renderMemdigitView('result'));
  } else {
    memdigitBeginRound();
  }
}

/* ══════════════════════════════════════════════════
   🧩 순서 기억력 테스트 (v0.0.14~)
   - 격자 타일이 순서대로 반짝이면, 그 순서 그대로 타일을 탭
   - 숫자 기억력과 달리 탭할 때마다 즉시 정오답 판정 (Simon-says류 UX)
   - 어려움은 4x4 격자(더 빽빽하고 헷갈림) + 암기 후 3초 방해단계
══════════════════════════════════════════════════ */
const SEQMEM_CONFIG = {
  easy:   { label: '쉬움',   gridSize: 3, rounds: 6,  startLen: 3, minLen: 2, maxLen: 8,  flashMs: 700, gapMs: 250, distractor: false },
  normal: { label: '보통',   gridSize: 3, rounds: 8,  startLen: 4, minLen: 3, maxLen: 9,  flashMs: 550, gapMs: 200, distractor: false },
  hard:   { label: '어려움', gridSize: 4, rounds: 10, startLen: 4, minLen: 3, maxLen: 10, flashMs: 450, gapMs: 150, distractor: true  },
  hell:   { label: 'HELL',   gridSize: 5, rounds: 12, startLen: 5, minLen: 4, maxLen: 12, flashMs: 300, gapMs: 100, distractor: true  },
};

function initSeqmem() {
  if (App.state.seqmem.delayTimer) clearTimeout(App.state.seqmem.delayTimer);
  const challenge = (App.pendingChallenge && App.pendingChallenge.section === 'seqmem') ? App.pendingChallenge.data : null;
  App.pendingChallenge = null;
  App.state.seqmem = { nickname: '', difficulty: null, round: 0, totalRounds: 0, currentLen: 0, sequence: [], userInput: [], maxCorrectLen: 0, correctRounds: 0, delayTimer: null, phase: 'idle', challenge };
  renderSeqmemView('start');
}

function seqmemTileClass(kind) {
  const base = 'aspect-square rounded-xl border-2 transition-colors duration-150 cursor-pointer';
  if (kind === 'active')  return `${base} bg-cyan-500 border-cyan-300`;
  if (kind === 'correct') return `${base} bg-emerald-500 border-emerald-300`;
  if (kind === 'wrong')   return `${base} bg-rose-500 border-rose-300`;
  return `${base} bg-slate-800 border-slate-600 hover:border-cyan-500`;
}

function renderSeqmemView(view) {
  const container = document.getElementById('seqmem-container');
  const state = App.state.seqmem;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">🧩</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">순서 기억력 테스트</h2>
        <p class="text-slate-400 mb-6">타일이 순서대로 반짝이는 걸 잘 본 뒤<br>같은 순서로 타일을 눌러보세요!</p>
        ${guideCardHTML(
          ['타일이 순서대로 반짝반짝 빛나요, 그 순서를 잘 보세요', '다 보여주면 같은 순서로 타일을 눌러보세요', '맞히면 칸 수가 늘어나요 — 몇 칸까지 기억하는지 도전해보세요']
        )}
        ${renderChallengeBanner(state.challenge)}
        <input id="seqmem-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-cyan-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">난이도 선택</p>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="seqmemStart('easy')" class="bg-emerald-800/50 hover:bg-emerald-700/70 border border-emerald-600 text-emerald-300 font-bold py-3 rounded-xl transition text-sm">
            🟢 쉬움<br><span class="text-xs font-normal opacity-70">3x3, 3칸부터</span>
          </button>
          <button onclick="seqmemStart('normal')" class="bg-amber-800/50 hover:bg-amber-700/70 border border-amber-600 text-amber-300 font-bold py-3 rounded-xl transition text-sm">
            🟡 보통<br><span class="text-xs font-normal opacity-70">3x3, 4칸부터</span>
          </button>
          <button onclick="seqmemStart('hard')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-3 rounded-xl transition text-sm">
            🔴 어려움<br><span class="text-xs font-normal opacity-70">4x4+방해</span>
          </button>
        </div>
        <button onclick="confirmHellMode('seqmemStart')" class="w-full mt-3 bg-gradient-to-r from-red-950 to-black hover:from-red-900 border-2 border-red-600 text-red-400 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
          <span class="text-xl">🔥</span> HELL 난이도 <span class="text-xs font-normal opacity-70">(5x5·초고속·상급자 전용)</span>
        </button>
      </div>`;
  }

  else if (view === 'round') {
    const cfg = SEQMEM_CONFIG[state.difficulty];
    const gridColsClass = { 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5' }[cfg.gridSize] || 'grid-cols-3';
    const tileCount = cfg.gridSize * cfg.gridSize;

    container.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-4">
          <span class="text-slate-400 text-sm">${state.nickname} 님 · ${cfg.label}</span>
          <span id="seqmem-round-counter" class="text-cyan-400 font-bold text-sm">${state.round + 1} / ${state.totalRounds}</span>
        </div>
        <div class="progress-bar-track mb-6">
          <div id="seqmem-progress-fill" class="progress-bar-fill" style="width:${Math.round((state.round / state.totalRounds) * 100)}%"></div>
        </div>
        <div id="seqmem-grid" class="grid ${gridColsClass} gap-3 max-w-xs mx-auto mb-4">
          ${Array.from({ length: tileCount }).map((_, i) => `<div id="seqmem-tile-${i}" onclick="seqmemTileTap(${i})" class="${seqmemTileClass('idle')}" style="touch-action:manipulation;"></div>`).join('')}
        </div>
        <p id="seqmem-feedback" class="text-center text-slate-500 text-sm mt-2 min-h-6">잘 보고 기억하세요...</p>
      </div>`;
    seqmemBeginRound();
  }

  else if (view === 'result') {
    const accuracy = Math.round((state.correctRounds / state.totalRounds) * 100);
    const maxLen = state.maxCorrectLen;

    let tier, tierColor, tierBg, tierMsg;
    if (maxLen >= 9)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = ['이 정도면 뮤지컬 안무도 한 번에 외우겠는데?', '댄스 챌린지 동작도 한 번 보면 바로 따라하겠는데?', '패턴 마스터! 게임 콤보도 순식간에 외우겠어']; }
    else if (maxLen >= 8) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = ['패턴 감각 甲! 길 찾기도 잘하는 편이지?', '순서 감각이 좋은 편! 요리 레시피도 잘 따라하겠어', '패턴 인식력 甲! 복잡한 순서도 곧잘 기억하네']; }
    else if (maxLen >= 6) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = ['평균은 하는 순서 감각! 헷갈리면 천천히 다시 확인하자.', '무난하게 잘 기억하는 편, 나쁘지 않아', '평균적인 순서 감각! 조금만 더 집중하면 늘겠어']; }
    else if (maxLen >= 4) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = ['음... 순서가 자꾸 헷갈리네. 서두르지 말고 하나씩 짚어가자.', '순서가 살짝 꼬이는 편이네, 하나씩 눈으로 따라가보자', '패턴이 복잡하면 좀 헷갈리는 편, 천천히 익혀보자']; }
    else                  { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = ['괜찮아, 원래 급하면 실수하는 법! 다음엔 천천히 되짚어보자~', '오늘은 순서가 유독 안 외워지네, 컨디션이 문제였을지도', '괜찮아, 다음엔 힌트 삼아 소리 내서 순서를 되뇌어보자']; }
    tierMsg = pickOne(tierMsg);

    const animalCard = pickAnimalCard('seqmem', tier);
    const shareText = `🐾 나는 ${animalCard.title}! 나의 순서 기억력은 최대 ${maxLen}칸, 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;
    const myResultStr = maxLen + '칸 (Tier ' + tier + ')';

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🧩</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 순서 기억력</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${maxLen}<span class="text-2xl text-slate-400">칸</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <div id="percentile-badge-seqmem" class="text-xs text-violet-300 mt-2"></div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
        ${animalCardHTML(animalCard)}

        ${renderChallengeCompareCard(myResultStr, state.challenge, 'seqmem', state.nickname, state.difficulty)}

        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-cyan-400">${state.correctRounds} / ${state.totalRounds}</div>
            <div class="text-slate-400 text-xs">정답 라운드</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-slate-300">${accuracy}%</div>
            <div class="text-slate-400 text-xs">정답률</div>
          </div>
        </div>

        ${renderShareRow('seqmem', tier, animalCard._idx, state.nickname, myResultStr, shareText, animalCard)}
        ${renderChallengeButton('seqmem', state.nickname, myResultStr, state.difficulty)}

        ${renderPlaceholderUI('seqmem', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 임상 기억력 검사와 다를 수 있습니다.
        </div>
        <button onclick="initSeqmem()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('seqmem', state.nickname, maxLen + '칸 (Tier ' + tier + ')', state.difficulty);
    renderPercentileBadge('seqmem', tier, state.difficulty);
    if (tier === 'S') playSound('tierS');
    renderLocalRanking('seqmem-ranking-list', 'seqmem');
  }
}

function seqmemStart(difficulty) {
  const input = document.getElementById('seqmem-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-seqmem-plays');
  const cfg = SEQMEM_CONFIG[difficulty];
  App.state.seqmem = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    currentLen: cfg.startLen, sequence: [], userInput: [],
    maxCorrectLen: 0, correctRounds: 0, delayTimer: null, phase: 'idle',
  };
  renderSeqmemView('round');
}

function seqmemBeginRound() {
  const state = App.state.seqmem;
  const cfg = SEQMEM_CONFIG[state.difficulty];
  const tileCount = cfg.gridSize * cfg.gridSize;
  const counter = document.getElementById('seqmem-round-counter');
  const fill = document.getElementById('seqmem-progress-fill');
  if (counter) counter.textContent = `${state.round + 1} / ${state.totalRounds}`;
  if (fill) fill.style.width = `${Math.round((state.round / state.totalRounds) * 100)}%`;

  state.sequence = Array.from({ length: state.currentLen }, () => Math.floor(Math.random() * tileCount));
  state.userInput = [];
  state.phase = 'show';

  for (let i = 0; i < tileCount; i++) {
    const tileEl = document.getElementById(`seqmem-tile-${i}`);
    if (tileEl) tileEl.className = seqmemTileClass('idle');
  }

  if (state.round === 0) {
    seqmemCountdown(3);
  } else {
    const feedback = document.getElementById('seqmem-feedback');
    if (feedback) { feedback.className = 'text-center text-slate-500 text-sm mt-2 min-h-6'; feedback.textContent = '잘 보고 기억하세요...'; }
    seqmemFlashTile(0);
  }
}

/* v0.1.7~: 첫 라운드 시작 전 3-2-1 카운트다운 + 0.3초 여유 후 첫 타일 노출(너무 빨리 나온다는 피드백 반영) */
function seqmemCountdown(count) {
  const state = App.state.seqmem;
  if (App.state.currentSection !== 'seqmem') return;
  const feedback = document.getElementById('seqmem-feedback');
  if (count > 0) {
    if (feedback) { feedback.className = 'text-center text-3xl font-black text-violet-400 mt-2 min-h-6 anim-pop'; feedback.textContent = count; }
    state.delayTimer = setTimeout(() => seqmemCountdown(count - 1), 500);
  } else {
    if (feedback) { feedback.className = 'text-center text-xl font-black text-violet-400 mt-2 min-h-6 anim-pop'; feedback.textContent = '시작!'; }
    state.delayTimer = setTimeout(() => {
      if (feedback) { feedback.className = 'text-center text-slate-500 text-sm mt-2 min-h-6'; feedback.textContent = '잘 보고 기억하세요...'; }
      state.delayTimer = setTimeout(() => seqmemFlashTile(0), 300);
    }, 500);
  }
}

function seqmemFlashTile(idx) {
  const state = App.state.seqmem;
  if (App.state.currentSection !== 'seqmem') return;
  const cfg = SEQMEM_CONFIG[state.difficulty];

  if (idx >= state.sequence.length) {
    if (cfg.distractor) {
      const feedback = document.getElementById('seqmem-feedback');
      if (feedback) feedback.textContent = '🙈 3초간 다른 생각 금지!';
      state.delayTimer = setTimeout(() => {
        if (feedback) feedback.textContent = '';
        seqmemStartInput();
      }, 3000);
    } else {
      state.delayTimer = setTimeout(seqmemStartInput, 400);
    }
    return;
  }

  const tileEl = document.getElementById(`seqmem-tile-${state.sequence[idx]}`);
  if (tileEl) tileEl.className = seqmemTileClass('active');
  state.delayTimer = setTimeout(() => {
    if (tileEl) tileEl.className = seqmemTileClass('idle');
    state.delayTimer = setTimeout(() => seqmemFlashTile(idx + 1), cfg.gapMs);
  }, cfg.flashMs);
}

function seqmemStartInput() {
  const state = App.state.seqmem;
  if (App.state.currentSection !== 'seqmem') return;
  state.phase = 'input';
  state.userInput = [];
  const feedback = document.getElementById('seqmem-feedback');
  if (feedback) feedback.textContent = '순서대로 타일을 눌러보세요';
}

function seqmemTileTap(idx) {
  const state = App.state.seqmem;
  if (state.phase !== 'input') return;
  const cfg = SEQMEM_CONFIG[state.difficulty];
  const pos = state.userInput.length;
  state.userInput.push(idx);
  const tileEl = document.getElementById(`seqmem-tile-${idx}`);
  const feedback = document.getElementById('seqmem-feedback');

  if (idx === state.sequence[pos]) {
    if (tileEl) tileEl.className = seqmemTileClass('correct');
    playSound('correct');
    pulseElement(tileEl, 'correct');
    if (state.userInput.length === state.sequence.length) {
      state.correctRounds++;
      state.maxCorrectLen = Math.max(state.maxCorrectLen, state.currentLen);
      state.currentLen = Math.min(state.currentLen + 1, cfg.maxLen);
      state.phase = 'idle';
      if (feedback) feedback.textContent = '정답! 다음엔 한 칸 더 길어져요 🎉';
      state.delayTimer = setTimeout(seqmemAdvance, 800);
    } else {
      setTimeout(() => { if (tileEl && state.phase === 'input') tileEl.className = seqmemTileClass('idle'); }, 200);
    }
  } else {
    if (tileEl) tileEl.className = seqmemTileClass('wrong');
    playSound('wrong');
    pulseElement(tileEl, 'wrong');
    state.currentLen = Math.max(state.currentLen - 1, cfg.minLen);
    state.phase = 'idle';
    if (feedback) feedback.textContent = '아쉬워요! 순서가 달랐어요 😵';
    state.delayTimer = setTimeout(seqmemAdvance, 1000);
  }
}

function seqmemAdvance() {
  if (App.state.currentSection !== 'seqmem') return;
  const state = App.state.seqmem;
  state.round++;
  if (state.round >= state.totalRounds) {
    App.showLoader(() => renderSeqmemView('result'));
  } else {
    seqmemBeginRound();
  }
}

/* ══════════════════════════════════════════════════
   🎨 색각 테스트 (v0.0.15~)
   - 실제 색맹/색약 임상 검사(이시하라 판)를 흉내내지 않음 — 오해를 줄 수 있어서
     대신 "미묘하게 다른 색 타일 찾기" 색 구별 감각 게임으로 설계
   - 격자 크기·색상 차이(delta)·제한시간이 난이도에 따라 함께 빡빡해짐
══════════════════════════════════════════════════ */
const COLORVISION_CONFIG = {
  easy:   { label: '쉬움',   gridSize: 3, rounds: 6,  delta: 42, timeLimitMs: 5000 },
  normal: { label: '보통',   gridSize: 4, rounds: 8,  delta: 26, timeLimitMs: 4000 },
  hard:   { label: '어려움', gridSize: 5, rounds: 10, delta: 14, timeLimitMs: 3000 },
  hell:   { label: 'HELL',   gridSize: 6, rounds: 12, delta: 8,  timeLimitMs: 2000 },
};

function initColorvision() {
  const s = App.state.colorvision;
  if (s.timerID) clearTimeout(s.timerID);
  if (s.delayTimer) clearTimeout(s.delayTimer);
  const challenge = (App.pendingChallenge && App.pendingChallenge.section === 'colorvision') ? App.pendingChallenge.data : null;
  App.pendingChallenge = null;
  App.state.colorvision = { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, totalTime: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', baseColor: '', oddColor: '', oddIndex: 0, tileCount: 0, challenge };
  renderColorvisionView('start');
}

function renderColorvisionView(view) {
  const container = document.getElementById('colorvision-container');
  const state = App.state.colorvision;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">🎨</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">색각 테스트</h2>
        <p class="text-slate-400 mb-6">격자 안에 미묘하게 다른 색 타일이 하나 숨어있어요.<br>제한시간 안에 찾아서 탭하세요!</p>
        ${guideCardHTML(
          ['격자 안에 타일이 여러 개 있어요, 그중 딱 하나만 미묘하게 색이 달라요', '제한시간 안에 다른 색 타일을 찾아 탭하세요', '정확도와 속도를 함께 채점해요']
        )}
        ${renderChallengeBanner(state.challenge)}
        <input id="colorvision-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-cyan-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">난이도 선택</p>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="colorvisionStart('easy')" class="bg-emerald-800/50 hover:bg-emerald-700/70 border border-emerald-600 text-emerald-300 font-bold py-3 rounded-xl transition text-sm">
            🟢 쉬움<br><span class="text-xs font-normal opacity-70">3x3, 5초</span>
          </button>
          <button onclick="colorvisionStart('normal')" class="bg-amber-800/50 hover:bg-amber-700/70 border border-amber-600 text-amber-300 font-bold py-3 rounded-xl transition text-sm">
            🟡 보통<br><span class="text-xs font-normal opacity-70">4x4, 4초</span>
          </button>
          <button onclick="colorvisionStart('hard')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-3 rounded-xl transition text-sm">
            🔴 어려움<br><span class="text-xs font-normal opacity-70">5x5, 3초</span>
          </button>
        </div>
        <button onclick="confirmHellMode('colorvisionStart')" class="w-full mt-3 bg-gradient-to-r from-red-950 to-black hover:from-red-900 border-2 border-red-600 text-red-400 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
          <span class="text-xl">🔥</span> HELL 난이도 <span class="text-xs font-normal opacity-70">(6x6, 2초, 상급자 전용)</span>
        </button>
      </div>`;
  }

  else if (view === 'round') {
    const cfg = COLORVISION_CONFIG[state.difficulty];
    const gridColsClass = { 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' }[cfg.gridSize];

    container.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님 · ${cfg.label}</span>
          <span id="colorvision-round-counter" class="text-cyan-400 font-bold text-sm">${state.round + 1} / ${state.totalRounds}</span>
        </div>
        <div class="progress-bar-track mb-2">
          <div id="colorvision-progress-fill" class="progress-bar-fill" style="width:${Math.round((state.round / state.totalRounds) * 100)}%"></div>
        </div>
        <div id="colorvision-gauge-bar" class="mb-6"></div>
        <div id="colorvision-grid" class="grid ${gridColsClass} gap-2 max-w-sm mx-auto"></div>
        <p class="text-center text-slate-500 text-sm mt-4">다른 색 타일을 찾아 탭하세요!</p>
      </div>`;
    colorvisionBeginRound();
  }

  else if (view === 'result') {
    const avgMs = state.totalTime / state.totalRounds;
    const accuracy = (state.correctCount / state.totalRounds) * 100;
    const score = accuracy - (avgMs / 100);

    let tier, tierColor, tierBg, tierMsg;
    if (score >= 85)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = ['이 정도면 색상 코디네이터 해도 되겠는데? 미묘한 색 차이까지 완벽하게 잡아냈어!', '디자이너 뺨치는 색 구별력! 팔레트 감별사 해도 되겠어', '미세한 톤 차이까지 다 잡아내네, 눈이 진짜 예리하다']; }
    else if (score >= 70) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = ['색 감각 甲! 웬만한 색상 미스매치는 다 잡아낼 듯.', '색 보는 눈이 좋은 편! 인테리어 컬러 고를 때 믿음직하겠어', '웬만한 색 조합 실수는 안 하겠는데?']; }
    else if (score >= 55) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = ['평균은 하는 색 감각! 애매한 색은 밝은 조명에서 다시 보자.', '평범하게 잘 구별하는 편, 나쁘지 않아', '무난한 색 감각! 헷갈리는 색은 두 번 보면 확실해져']; }
    else if (score >= 40) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = ['음... 비슷한 색은 좀 헷갈리는 편이네. 옷 고를 땐 밝은 데서 확인하자.', '비슷한 톤은 좀 헷갈리는 편이네, 화면 밝기를 올려서 다시 보자', '살짝 아쉬운 색 구별력, 연습하면 나아질 거야']; }
    else                  { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = ['괜찮아, 색보다 디자인 센스가 더 중요하지! 헷갈리면 친구한테 물어보자~', '오늘은 색이 유독 비슷하게 보였나봐, 조명 탓일 수도', '괜찮아, 색 감각보다 취향이 더 중요하지! 다음에 다시 도전해보자']; }
    tierMsg = pickOne(tierMsg);

    const animalCard = pickAnimalCard('colorvision', tier);
    const shareText = `🐾 나는 ${animalCard.title}! 나의 색 감각 점수는 정확도 ${accuracy.toFixed(0)}%, 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;
    const myResultStr = accuracy.toFixed(0) + '% (Tier ' + tier + ')';

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🎨</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 색 감각</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${accuracy.toFixed(0)}<span class="text-2xl text-slate-400">%</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <div id="percentile-badge-colorvision" class="text-xs text-violet-300 mt-2"></div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
        ${animalCardHTML(animalCard)}

        ${renderChallengeCompareCard(myResultStr, state.challenge, 'colorvision', state.nickname, state.difficulty)}

        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-emerald-400">${state.correctCount}</div>
            <div class="text-slate-400 text-xs">정답 수</div>
            <div class="text-slate-500 text-xs">/ ${state.totalRounds}</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-blue-400">${accuracy.toFixed(0)}%</div>
            <div class="text-slate-400 text-xs">정확도</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-violet-400">${(avgMs / 1000).toFixed(2)}s</div>
            <div class="text-slate-400 text-xs">평균 반응속도</div>
          </div>
        </div>

        ${renderShareRow('colorvision', tier, animalCard._idx, state.nickname, myResultStr, shareText, animalCard)}
        ${renderChallengeButton('colorvision', state.nickname, myResultStr, state.difficulty)}

        ${renderPlaceholderUI('colorvision', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적의 색 구별 게임이며 실제 색각(색맹·색약) 임상 검사를 대체하지 않습니다.
        </div>
        <button onclick="initColorvision()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('colorvision', state.nickname, accuracy.toFixed(0) + '% (Tier ' + tier + ')', state.difficulty);
    renderPercentileBadge('colorvision', tier, state.difficulty);
    if (tier === 'S') playSound('tierS');
    renderLocalRanking('colorvision-ranking-list', 'colorvision');
  }
}

function colorvisionStart(difficulty) {
  const input = document.getElementById('colorvision-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-colorvision-plays');
  const cfg = COLORVISION_CONFIG[difficulty];
  App.state.colorvision = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    correctCount: 0, totalTime: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle',
    baseColor: '', oddColor: '', oddIndex: 0, tileCount: cfg.gridSize * cfg.gridSize,
  };
  showCountdownThenStart('colorvision-container', () => renderColorvisionView('round'));
}

function colorvisionGenerateColors() {
  const state = App.state.colorvision;
  const cfg = COLORVISION_CONFIG[state.difficulty];
  const tileCount = cfg.gridSize * cfg.gridSize;
  const hue = Math.floor(Math.random() * 360);
  const sat = 55 + Math.floor(Math.random() * 20);
  const light = 38 + Math.floor(Math.random() * 15);
  const oddLight = Math.min(light + cfg.delta, 92);

  state.tileCount = tileCount;
  state.oddIndex = Math.floor(Math.random() * tileCount);
  state.baseColor = `hsl(${hue} ${sat}% ${light}%)`;
  state.oddColor = `hsl(${hue} ${sat}% ${oddLight}%)`;
}

function colorvisionBeginRound() {
  const state = App.state.colorvision;
  const cfg = COLORVISION_CONFIG[state.difficulty];
  const counter = document.getElementById('colorvision-round-counter');
  const fill = document.getElementById('colorvision-progress-fill');
  if (counter) counter.textContent = `${state.round + 1} / ${state.totalRounds}`;
  if (fill) fill.style.width = `${Math.round((state.round / state.totalRounds) * 100)}%`;

  colorvisionGenerateColors();
  const grid = document.getElementById('colorvision-grid');
  if (grid) {
    grid.innerHTML = Array.from({ length: state.tileCount }, (_, i) => {
      const color = i === state.oddIndex ? state.oddColor : state.baseColor;
      return `<div id="colorvision-tile-${i}" onclick="colorvisionTileTap(${i})" class="aspect-square rounded-lg cursor-pointer transition-transform duration-100 hover:scale-95" style="background:${color};touch-action:manipulation;"></div>`;
    }).join('');
  }

  state.phase = 'active';
  const bar = document.getElementById('colorvision-gauge-bar');
  if (bar) {
    bar.style.transition = 'none';
    bar.style.width = '100%';
    requestAnimationFrame(() => {
      bar.style.transition = `width ${cfg.timeLimitMs}ms linear`;
      requestAnimationFrame(() => { bar.style.width = '0%'; });
    });
  }
  state.startTime = performance.now();
  if (state.timerID) clearTimeout(state.timerID);
  state.timerID = setTimeout(colorvisionTimeUp, cfg.timeLimitMs);
}

function colorvisionTileTap(idx) {
  const state = App.state.colorvision;
  if (state.phase !== 'active') return;
  const cfg = COLORVISION_CONFIG[state.difficulty];
  if (state.timerID) clearTimeout(state.timerID);
  const elapsed = Math.round(performance.now() - state.startTime);
  state.phase = 'idle';

  const correctEl = document.getElementById(`colorvision-tile-${state.oddIndex}`);
  const tappedEl = document.getElementById(`colorvision-tile-${idx}`);

  if (idx === state.oddIndex) {
    state.correctCount++;
    state.streak = (state.streak || 0) + 1;
    state.totalTime += Math.min(elapsed, cfg.timeLimitMs);
    if (tappedEl) tappedEl.style.outline = '3px solid #22c55e';
    pulseElement(tappedEl, 'correct');
    playSound('correct');
    showToast('✅ 정답!' + comboSuffix(state.streak));
  } else {
    state.streak = 0;
    state.totalTime += cfg.timeLimitMs;
    if (tappedEl) tappedEl.style.outline = '3px solid #ef4444';
    if (correctEl) correctEl.style.outline = '3px solid #22c55e';
    pulseElement(tappedEl, 'wrong');
    playSound('wrong');
    showToast('❌ 오답');
  }
  state.delayTimer = setTimeout(colorvisionAdvance, 700);
}

function colorvisionTimeUp() {
  const state = App.state.colorvision;
  if (state.phase !== 'active') return;
  const cfg = COLORVISION_CONFIG[state.difficulty];
  state.phase = 'idle';
  state.totalTime += cfg.timeLimitMs;
  const correctEl = document.getElementById(`colorvision-tile-${state.oddIndex}`);
  if (correctEl) correctEl.style.outline = '3px solid #22c55e';
  showToast('⏱️ 시간 초과!');
  state.delayTimer = setTimeout(colorvisionAdvance, 700);
}

function colorvisionAdvance() {
  if (App.state.currentSection !== 'colorvision') return;
  const state = App.state.colorvision;
  state.round++;
  if (state.round >= state.totalRounds) {
    App.showLoader(() => renderColorvisionView('result'));
  } else {
    colorvisionBeginRound();
  }
}

/* ══════════════════════════════════════════════════
   🧮 논리력 테스트 (v0.0.16~)
   - 숫자 규칙(등차/등비/피보나치식)의 다음 값을 4지선다로 맞히기
   - 시간제한 + 정확도 기반 채점 (색각 테스트와 동일한 공식)
══════════════════════════════════════════════════ */
const LOGIC_CONFIG = {
  easy:   { label: '쉬움',   rounds: 6,  timeLimitMs: 8000, rules: ['add'] },
  normal: { label: '보통',   rounds: 8,  timeLimitMs: 6000, rules: ['add', 'mul'] },
  hard:   { label: '어려움', rounds: 10, timeLimitMs: 4500, rules: ['add', 'mul', 'fib'] },
  hell:   { label: 'HELL',   rounds: 12, timeLimitMs: 3000, rules: ['add', 'mul', 'fib'] },
};

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function logicGenerateRound() {
  const state = App.state.logic;
  const cfg = LOGIC_CONFIG[state.difficulty];
  const rule = cfg.rules[Math.floor(Math.random() * cfg.rules.length)];
  let seq, answer;

  if (rule === 'add') {
    const start = 1 + Math.floor(Math.random() * 15);
    const step = 2 + Math.floor(Math.random() * 8);
    seq = [start, start + step, start + 2 * step, start + 3 * step];
    answer = start + 4 * step;
  } else if (rule === 'mul') {
    const start = 1 + Math.floor(Math.random() * 4);
    const ratio = 2 + Math.floor(Math.random() * 2);
    seq = [start, start * ratio, start * ratio ** 2, start * ratio ** 3];
    answer = start * ratio ** 4;
  } else {
    const a = 1 + Math.floor(Math.random() * 5);
    const b = 1 + Math.floor(Math.random() * 5);
    seq = [a, b, a + b, a + 2 * b];
    answer = 2 * a + 3 * b;
  }

  const options = new Set([answer]);
  let guard = 0;
  while (options.size < 4 && guard < 50) {
    guard++;
    const spread = Math.max(2, Math.round(Math.abs(answer) * 0.2));
    const offset = (Math.floor(Math.random() * spread) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = answer + offset;
    if (candidate > 0 && candidate !== answer) options.add(candidate);
  }

  state.seq = seq;
  state.answer = answer;
  state.options = shuffleArray([...options]);
}

function initLogic() {
  const s = App.state.logic;
  if (s.timerID) clearTimeout(s.timerID);
  if (s.delayTimer) clearTimeout(s.delayTimer);
  const challenge = (App.pendingChallenge && App.pendingChallenge.section === 'logic') ? App.pendingChallenge.data : null;
  App.pendingChallenge = null;
  App.state.logic = { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, totalTime: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', seq: [], answer: 0, options: [], challenge };
  renderLogicView('start');
}

function renderLogicView(view) {
  const container = document.getElementById('logic-container');
  const state = App.state.logic;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">🧮</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">논리력 테스트</h2>
        <p class="text-slate-400 mb-6">숫자들이 나열되어 있어요.<br>규칙을 찾아 다음 숫자를 맞혀보세요!</p>
        ${guideCardHTML(
          ['숫자가 몇 개 나열되어 있어요, 그 안에 숨은 규칙(더하기·곱하기 등)을 찾아보세요', '규칙에 맞는 다음 숫자를 4개 보기 중에서 고르세요', '제한시간 안에 정확히 맞힐수록 등급이 올라가요']
        )}
        ${renderChallengeBanner(state.challenge)}
        <input id="logic-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-cyan-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">난이도 선택</p>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="logicStart('easy')" class="bg-emerald-800/50 hover:bg-emerald-700/70 border border-emerald-600 text-emerald-300 font-bold py-3 rounded-xl transition text-sm">
            🟢 쉬움<br><span class="text-xs font-normal opacity-70">등차수열, 8초</span>
          </button>
          <button onclick="logicStart('normal')" class="bg-amber-800/50 hover:bg-amber-700/70 border border-amber-600 text-amber-300 font-bold py-3 rounded-xl transition text-sm">
            🟡 보통<br><span class="text-xs font-normal opacity-70">등차·등비, 6초</span>
          </button>
          <button onclick="logicStart('hard')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-3 rounded-xl transition text-sm">
            🔴 어려움<br><span class="text-xs font-normal opacity-70">+피보나치, 4.5초</span>
          </button>
        </div>
        <button onclick="confirmHellMode('logicStart')" class="w-full mt-3 bg-gradient-to-r from-red-950 to-black hover:from-red-900 border-2 border-red-600 text-red-400 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
          <span class="text-xl">🔥</span> HELL 난이도 <span class="text-xs font-normal opacity-70">(3초, 상급자 전용)</span>
        </button>
      </div>`;
  }

  else if (view === 'round') {
    const cfg = LOGIC_CONFIG[state.difficulty];
    container.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님 · ${cfg.label}</span>
          <span id="logic-round-counter" class="text-cyan-400 font-bold text-sm">${state.round + 1} / ${state.totalRounds}</span>
        </div>
        <div class="progress-bar-track mb-2">
          <div id="logic-progress-fill" class="progress-bar-fill" style="width:${Math.round((state.round / state.totalRounds) * 100)}%"></div>
        </div>
        <div id="logic-gauge-bar" class="mb-6"></div>
        <div id="logic-seq-display" class="text-center text-3xl sm:text-4xl font-black text-slate-100 mb-8 tracking-wide"></div>
        <div id="logic-options" class="grid grid-cols-2 gap-3"></div>
      </div>`;
    logicBeginRound();
  }

  else if (view === 'result') {
    const avgMs = state.totalTime / state.totalRounds;
    const accuracy = (state.correctCount / state.totalRounds) * 100;
    const score = accuracy - (avgMs / 100);

    let tier, tierColor, tierBg, tierMsg;
    if (score >= 85)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = ['이 정도면 수학 학원 안 다녀도 되겠는데? 패턴이 다 보이는구나!', '수능 만점자 포스, 숫자 패턴이 그냥 보이는 수준', '이 정도면 암산왕 등극이지, 규칙이 눈에 딱딱 들어오네']; }
    else if (score >= 70) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = ['논리력 甲! 숫자 패턴은 거의 다 잡아내네.', '논리적 사고력이 탄탄한 편! 복잡한 규칙도 곧잘 풀어내', '숫자 감각 甲! 패턴 찾는 속도가 빠른 편이야']; }
    else if (score >= 55) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = ['평균은 하는 논리력! 급하게 풀지 말고 패턴을 천천히 뜯어보자.', '평범하게 잘 푸는 편, 나쁘지 않은 논리력', '무난한 패턴 감각! 조금만 더 연습하면 등급 업']; }
    else if (score >= 40) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = ['음... 패턴 찾기가 좀 어려운 편이네. 앞뒤 숫자 차이부터 하나씩 계산해보자.', '패턴이 살짝 복잡하면 헷갈리는 편이네, 차분히 계산해보자', '숫자 규칙 찾기가 좀 어려운 편, 반복하면 감이 잡힐 거야']; }
    else                  { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = ['괜찮아, 계산기는 괜히 있는 게 아니야! 다음엔 천천히 규칙을 찾아보자~', '오늘은 숫자가 유독 안 풀렸나봐, 컨디션 탓일지도', '괜찮아, 논리력보다 창의력이 더 중요한 순간도 많아!']; }
    tierMsg = pickOne(tierMsg);

    const animalCard = pickAnimalCard('logic', tier);
    const shareText = `🐾 나는 ${animalCard.title}! 나의 논리력 점수는 정확도 ${accuracy.toFixed(0)}%, 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;
    const myResultStr = accuracy.toFixed(0) + '% (Tier ' + tier + ')';

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🧮</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 논리력</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${accuracy.toFixed(0)}<span class="text-2xl text-slate-400">%</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <div id="percentile-badge-logic" class="text-xs text-violet-300 mt-2"></div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
        ${animalCardHTML(animalCard)}

        ${renderChallengeCompareCard(myResultStr, state.challenge, 'logic', state.nickname, state.difficulty)}

        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-emerald-400">${state.correctCount}</div>
            <div class="text-slate-400 text-xs">정답 수</div>
            <div class="text-slate-500 text-xs">/ ${state.totalRounds}</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-blue-400">${accuracy.toFixed(0)}%</div>
            <div class="text-slate-400 text-xs">정확도</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-violet-400">${(avgMs / 1000).toFixed(2)}s</div>
            <div class="text-slate-400 text-xs">평균 반응속도</div>
          </div>
        </div>

        ${renderShareRow('logic', tier, animalCard._idx, state.nickname, myResultStr, shareText, animalCard)}
        ${renderChallengeButton('logic', state.nickname, myResultStr, state.difficulty)}

        ${renderPlaceholderUI('logic', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 지능·논리력 검사를 대체하지 않습니다.
        </div>
        <button onclick="initLogic()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('logic', state.nickname, accuracy.toFixed(0) + '% (Tier ' + tier + ')', state.difficulty);
    renderPercentileBadge('logic', tier, state.difficulty);
    if (tier === 'S') playSound('tierS');
    renderLocalRanking('logic-ranking-list', 'logic');
  }
}

function logicStart(difficulty) {
  const input = document.getElementById('logic-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-logic-plays');
  const cfg = LOGIC_CONFIG[difficulty];
  App.state.logic = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    correctCount: 0, totalTime: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle',
    seq: [], answer: 0, options: [],
  };
  showCountdownThenStart('logic-container', () => renderLogicView('round'));
}

function logicBeginRound() {
  const state = App.state.logic;
  const cfg = LOGIC_CONFIG[state.difficulty];
  const counter = document.getElementById('logic-round-counter');
  const fill = document.getElementById('logic-progress-fill');
  if (counter) counter.textContent = `${state.round + 1} / ${state.totalRounds}`;
  if (fill) fill.style.width = `${Math.round((state.round / state.totalRounds) * 100)}%`;

  logicGenerateRound();
  const seqDisplay = document.getElementById('logic-seq-display');
  if (seqDisplay) seqDisplay.textContent = `${state.seq.join(', ')}, ?`;
  const optionsEl = document.getElementById('logic-options');
  if (optionsEl) {
    optionsEl.innerHTML = state.options.map(opt =>
      `<button id="logic-opt-${opt}" onclick="logicAnswer(${opt})" class="option-btn text-center text-xl font-bold py-4">${opt}</button>`
    ).join('');
  }

  state.phase = 'active';
  const bar = document.getElementById('logic-gauge-bar');
  if (bar) {
    bar.style.transition = 'none';
    bar.style.width = '100%';
    requestAnimationFrame(() => {
      bar.style.transition = `width ${cfg.timeLimitMs}ms linear`;
      requestAnimationFrame(() => { bar.style.width = '0%'; });
    });
  }
  state.startTime = performance.now();
  if (state.timerID) clearTimeout(state.timerID);
  state.timerID = setTimeout(logicTimeUp, cfg.timeLimitMs);
}

function logicAnswer(opt) {
  const state = App.state.logic;
  if (state.phase !== 'active') return;
  const cfg = LOGIC_CONFIG[state.difficulty];
  if (state.timerID) clearTimeout(state.timerID);
  const elapsed = Math.round(performance.now() - state.startTime);
  state.phase = 'idle';

  const tappedEl = document.getElementById(`logic-opt-${opt}`);
  const correctEl = document.getElementById(`logic-opt-${state.answer}`);

  if (opt === state.answer) {
    state.correctCount++;
    state.streak = (state.streak || 0) + 1;
    state.totalTime += Math.min(elapsed, cfg.timeLimitMs);
    if (tappedEl) tappedEl.classList.add('selected');
    pulseElement(tappedEl, 'correct');
    playSound('correct');
    showToast('✅ 정답!' + comboSuffix(state.streak));
  } else {
    state.streak = 0;
    state.totalTime += cfg.timeLimitMs;
    if (tappedEl) { tappedEl.style.borderColor = '#ef4444'; tappedEl.style.background = 'rgba(239,68,68,0.15)'; }
    if (correctEl) { correctEl.style.borderColor = '#22c55e'; correctEl.style.background = 'rgba(34,197,94,0.15)'; }
    pulseElement(tappedEl, 'wrong');
    playSound('wrong');
    showToast('❌ 오답');
  }
  state.delayTimer = setTimeout(logicAdvance, 700);
}

function logicTimeUp() {
  const state = App.state.logic;
  if (state.phase !== 'active') return;
  const cfg = LOGIC_CONFIG[state.difficulty];
  state.phase = 'idle';
  state.totalTime += cfg.timeLimitMs;
  const correctEl = document.getElementById(`logic-opt-${state.answer}`);
  if (correctEl) { correctEl.style.borderColor = '#22c55e'; correctEl.style.background = 'rgba(34,197,94,0.15)'; }
  showToast('⏱️ 시간 초과!');
  state.delayTimer = setTimeout(logicAdvance, 700);
}

function logicAdvance() {
  if (App.state.currentSection !== 'logic') return;
  const state = App.state.logic;
  state.round++;
  if (state.round >= state.totalRounds) {
    App.showLoader(() => renderLogicView('result'));
  } else {
    logicBeginRound();
  }
}

/* ══════════════════════════════════════════════════
   🚦 충동억제 테스트 (Go/No-Go, v0.0.17~)
   - 초록(Go) 신호엔 빠르게 탭, 빨강(No-Go) 신호엔 참기
   - 성급한 반응(commission error)이 충동성의 핵심 지표
══════════════════════════════════════════════════ */
const IMPULSE_CONFIG = {
  easy:   { label: '쉬움',   rounds: 8,  timeLimitMs: 1300, noGoRatio: 0.25 },
  normal: { label: '보통',   rounds: 10, timeLimitMs: 950,  noGoRatio: 0.3 },
  hard:   { label: '어려움', rounds: 12, timeLimitMs: 700,  noGoRatio: 0.35 },
  hell:   { label: 'HELL',   rounds: 16, timeLimitMs: 450,  noGoRatio: 0.45 },
};

function initImpulse() {
  const s = App.state.impulse;
  if (s.timerID) clearTimeout(s.timerID);
  if (s.delayTimer) clearTimeout(s.delayTimer);
  const challenge = (App.pendingChallenge && App.pendingChallenge.section === 'impulse') ? App.pendingChallenge.data : null;
  App.pendingChallenge = null;
  App.state.impulse = { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalGoTime: 0, goCount: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', isNoGo: false, challenge };
  renderImpulseView('start');
}

function renderImpulseView(view) {
  const container = document.getElementById('impulse-container');
  const state = App.state.impulse;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">🚦</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">충동억제 테스트</h2>
        <p class="text-slate-400 mb-6">🟢 초록 신호엔 최대한 빨리 탭!<br>🔴 빨간 신호엔 절대 누르지 말고 참으세요.</p>
        ${guideCardHTML(
          ['🟢 초록 신호가 뜨면 최대한 빨리 탭하세요', '🔴 빨간 신호가 뜨면 절대 누르지 말고 참으세요', '성급하게 누른 횟수(참지 못한 횟수)로 채점해요']
        )}
        ${renderChallengeBanner(state.challenge)}
        <input id="impulse-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-cyan-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">난이도 선택</p>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="impulseStart('easy')" class="bg-emerald-800/50 hover:bg-emerald-700/70 border border-emerald-600 text-emerald-300 font-bold py-3 rounded-xl transition text-sm">
            🟢 쉬움<br><span class="text-xs font-normal opacity-70">8회, 여유있음</span>
          </button>
          <button onclick="impulseStart('normal')" class="bg-amber-800/50 hover:bg-amber-700/70 border border-amber-600 text-amber-300 font-bold py-3 rounded-xl transition text-sm">
            🟡 보통<br><span class="text-xs font-normal opacity-70">10회, 빠름</span>
          </button>
          <button onclick="impulseStart('hard')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-3 rounded-xl transition text-sm">
            🔴 어려움<br><span class="text-xs font-normal opacity-70">12회, 매우빠름</span>
          </button>
        </div>
        <button onclick="confirmHellMode('impulseStart')" class="w-full mt-3 bg-gradient-to-r from-red-950 to-black hover:from-red-900 border-2 border-red-600 text-red-400 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
          <span class="text-xl">🔥</span> HELL 난이도 <span class="text-xs font-normal opacity-70">(16회, 초고속, 상급자 전용)</span>
        </button>
      </div>`;
  }

  else if (view === 'round') {
    const cfg = IMPULSE_CONFIG[state.difficulty];
    container.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님 · ${cfg.label}</span>
          <span id="impulse-round-counter" class="text-cyan-400 font-bold text-sm">${state.round + 1} / ${state.totalRounds}</span>
        </div>
        <div class="progress-bar-track mb-8">
          <div id="impulse-progress-fill" class="progress-bar-fill" style="width:${Math.round((state.round / state.totalRounds) * 100)}%"></div>
        </div>
        <div id="impulse-stimulus" onclick="impulseTap()"
          class="rounded-full h-56 w-56 mx-auto flex flex-col items-center justify-center cursor-pointer select-none bg-slate-800 border-4 border-slate-600 transition-colors duration-100"
          style="touch-action:manipulation;">
          <span id="impulse-stimulus-emoji" class="text-6xl mb-2">⏳</span>
          <span id="impulse-stimulus-text" class="text-slate-300 font-bold text-lg px-4 text-center">준비하세요...</span>
        </div>
        <p id="impulse-feedback" class="text-center text-slate-500 text-sm mt-6 min-h-6"></p>
      </div>`;
    impulseBeginRound();
  }

  else if (view === 'result') {
    const accuracy = (state.correctCount / state.totalRounds) * 100;
    const avgGoMs = state.goCount > 0 ? Math.round(state.totalGoTime / state.goCount) : 0;

    let tier, tierColor, tierBg, tierMsg;
    if (accuracy >= 95)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = ['이 정도 자제력이면 다이어트도 성공하겠는데? 완벽한 절제력!', '명상 고수 아니야? 흔들림 없는 완벽한 절제력', '이 정도 참을성이면 세일 기간에도 지갑 안전하겠는데?']; }
    else if (accuracy >= 85) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = ['충동 조절 甲! 웬만한 유혹엔 안 넘어가겠어.', '자제력이 탄탄한 편! 웬만한 충동엔 잘 안 흔들려', '절제력 甲! 참을 때와 행동할 때를 잘 구분하네']; }
    else if (accuracy >= 70) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = ['평균은 하는 자제력! 급할 때 한 번 더 생각하고 행동하자.', '평범하게 잘 참는 편, 나쁘지 않은 자제력', '무난한 충동 조절! 조금만 더 신중해지면 완벽']; }
    else if (accuracy >= 50) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = ['음... 성급하게 반응하는 편이네. "멈춰서 생각하기"를 연습해보자.', '급할 때 성급하게 반응하는 편이네, 한 박자 쉬어가보자', '충동을 참기가 살짝 어려운 편, 연습하면 나아질 거야']; }
    else                     { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = ['괜찮아, 원래 사람은 다 충동적이야! 다음엔 한 박자 쉬고 반응해보자~', '오늘따라 유독 급했나봐, 컨디션 탓일 수도', '괜찮아, 다음엔 신호가 뜨기 전에 손을 살짝 떼고 기다려보자']; }
    tierMsg = pickOne(tierMsg);

    const animalCard = pickAnimalCard('impulse', tier);
    const shareText = `🐾 나는 ${animalCard.title}! 나의 충동억제력은 정확도 ${accuracy.toFixed(0)}%, 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;
    const myResultStr = accuracy.toFixed(0) + '% (Tier ' + tier + ')';

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🚦</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 충동억제력</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${accuracy.toFixed(0)}<span class="text-2xl text-slate-400">%</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <div id="percentile-badge-impulse" class="text-xs text-violet-300 mt-2"></div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
        ${animalCardHTML(animalCard)}

        ${renderChallengeCompareCard(myResultStr, state.challenge, 'impulse', state.nickname, state.difficulty)}

        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-emerald-400">${state.correctCount}</div>
            <div class="text-slate-400 text-xs">정답 수</div>
            <div class="text-slate-500 text-xs">/ ${state.totalRounds}</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-rose-400">${state.commissionErrors}</div>
            <div class="text-slate-400 text-xs">성급한 반응</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-violet-400">${avgGoMs}ms</div>
            <div class="text-slate-400 text-xs">평균 반응속도</div>
          </div>
        </div>

        ${renderShareRow('impulse', tier, animalCard._idx, state.nickname, myResultStr, shareText, animalCard)}
        ${renderChallengeButton('impulse', state.nickname, myResultStr, state.difficulty)}

        ${renderPlaceholderUI('impulse', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 임상 충동성·주의력 검사를 대체하지 않습니다.
        </div>
        <button onclick="initImpulse()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('impulse', state.nickname, accuracy.toFixed(0) + '% (Tier ' + tier + ')', state.difficulty);
    renderPercentileBadge('impulse', tier, state.difficulty);
    if (tier === 'S') playSound('tierS');
    renderLocalRanking('impulse-ranking-list', 'impulse');
  }
}

function impulseStart(difficulty) {
  const input = document.getElementById('impulse-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-impulse-plays');
  const cfg = IMPULSE_CONFIG[difficulty];
  App.state.impulse = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalGoTime: 0, goCount: 0,
    startTime: 0, timerID: null, delayTimer: null, phase: 'idle', isNoGo: false,
  };
  showCountdownThenStart('impulse-container', () => renderImpulseView('round'));
}

function impulseBeginRound() {
  const state = App.state.impulse;
  const cfg = IMPULSE_CONFIG[state.difficulty];
  const counter = document.getElementById('impulse-round-counter');
  const fill = document.getElementById('impulse-progress-fill');
  if (counter) counter.textContent = `${state.round + 1} / ${state.totalRounds}`;
  if (fill) fill.style.width = `${Math.round((state.round / state.totalRounds) * 100)}%`;

  const feedback = document.getElementById('impulse-feedback');
  if (feedback) feedback.textContent = '';

  state.isNoGo = Math.random() < cfg.noGoRatio;
  const stim = document.getElementById('impulse-stimulus');
  const emoji = document.getElementById('impulse-stimulus-emoji');
  const text = document.getElementById('impulse-stimulus-text');
  if (state.isNoGo) {
    if (stim) stim.className = 'rounded-full h-56 w-56 mx-auto flex flex-col items-center justify-center cursor-pointer select-none bg-rose-500 border-4 border-rose-300 transition-colors duration-100';
    if (emoji) emoji.textContent = '🛑';
    if (text) text.textContent = '누르지 마세요!';
  } else {
    if (stim) stim.className = 'rounded-full h-56 w-56 mx-auto flex flex-col items-center justify-center cursor-pointer select-none bg-emerald-500 border-4 border-emerald-300 transition-colors duration-100';
    if (emoji) emoji.textContent = '⚡';
    if (text) text.textContent = '지금 탭!';
  }

  state.phase = 'active';
  state.startTime = performance.now();
  if (state.timerID) clearTimeout(state.timerID);
  state.timerID = setTimeout(impulseTimeUp, cfg.timeLimitMs);
}

function impulseTap() {
  const state = App.state.impulse;
  if (state.phase !== 'active') return;
  if (state.timerID) clearTimeout(state.timerID);
  state.phase = 'idle';
  const feedback = document.getElementById('impulse-feedback');

  if (state.isNoGo) {
    state.commissionErrors++;
    state.streak = 0;
    if (feedback) feedback.textContent = '앗, 참았어야 해요! 성급한 반응 😵';
    showToast('❌ 성급한 반응!');
    playSound('wrong');
    pulseElement(feedback, 'wrong');
  } else {
    const ms = Math.round(performance.now() - state.startTime);
    state.correctCount++;
    state.goCount++;
    state.totalGoTime += ms;
    state.streak = (state.streak || 0) + 1;
    if (feedback) feedback.textContent = `${ms}ms! 정확해요 ✅` + comboSuffix(state.streak);
    showToast('✅ 정답!');
    playSound('correct');
    pulseElement(feedback, 'correct');
  }
  state.delayTimer = setTimeout(impulseAdvance, 600);
}

function impulseTimeUp() {
  const state = App.state.impulse;
  if (state.phase !== 'active') return;
  state.phase = 'idle';
  const feedback = document.getElementById('impulse-feedback');

  if (state.isNoGo) {
    state.correctCount++;
    state.streak = (state.streak || 0) + 1;
    playSound('correct');
    if (feedback) feedback.textContent = '잘 참았어요! 👍' + comboSuffix(state.streak);
    showToast('✅ 잘 참았어요!');
  } else {
    state.omissionErrors++;
    state.streak = 0;
    playSound('wrong');
    if (feedback) feedback.textContent = '앗, 놓쳤어요! 😅';
    showToast('⏱️ 놓쳤어요!');
  }
  state.delayTimer = setTimeout(impulseAdvance, 600);
}

function impulseAdvance() {
  if (App.state.currentSection !== 'impulse') return;
  const state = App.state.impulse;
  state.round++;
  if (state.round >= state.totalRounds) {
    App.showLoader(() => renderImpulseView('result'));
  } else {
    impulseBeginRound();
  }
}

/* ══════════════════════════════════════════════════
   📱 숏폼 집중력 테스트 ("피드 낚시 테스트", v0.1.7~ 전면 재설계)
   - 기존엔 충동억제(Go/No-Go)와 완전히 동일한 단일 원 자극 엔진을 리스킨만 한 상태였음(v0.0.18~v0.1.6)
   - "숏폼 노출 후 평균 집중 47초" 통계·팝콘브레인 개념과, 실제 CCPT(좌우 버섯/꽃 스폿) 방식을 참고해
     "여러 콘텐츠 카드 중 목표만 시각 탐색으로 골라내기" 방식으로 재설계 — 충동억제(단일 자극 억제)와
     겹치지 않는 선택적 주의력 + 시각 탐색 측정
   - 신규 지표: 전반부/후반부 반응속도를 비교하는 "집중력 저하도"(vigilance decrement)
══════════════════════════════════════════════════ */
const SHORTFOCUS_CATEGORIES = [
  { key: 'dog',      emoji: '🐶', label: '강아지' },
  { key: 'cat',      emoji: '🐱', label: '고양이' },
  { key: 'food',     emoji: '🍕', label: '먹방' },
  { key: 'dessert',  emoji: '🍰', label: '디저트' },
  { key: 'game',     emoji: '🎮', label: '게임' },
  { key: 'music',    emoji: '🎵', label: '음악·댄스' },
  { key: 'comedy',   emoji: '😂', label: '개그' },
  { key: 'sports',   emoji: '⚽', label: '스포츠' },
  { key: 'beauty',   emoji: '💄', label: '뷰티' },
  { key: 'movie',    emoji: '🎬', label: '영화·드라마' },
  { key: 'travel',   emoji: '✈️', label: '여행' },
  { key: 'car',      emoji: '🚗', label: '자동차' },
  { key: 'study',    emoji: '📚', label: '공부·지식' },
  { key: 'art',      emoji: '🎨', label: '아트' },
  { key: 'workout',  emoji: '🏋️', label: '운동' },
];
const SHORTFOCUS_CONFIG = {
  easy:   { label: '쉬움',   rounds: 8,  gridSize: 4, cols: 2, timeLimitMs: 1400, noTargetRatio: 0.25, adTrapRatio: 0 },
  normal: { label: '보통',   rounds: 10, gridSize: 6, cols: 3, timeLimitMs: 1150, noTargetRatio: 0.3,  adTrapRatio: 0.15 },
  hard:   { label: '어려움', rounds: 12, gridSize: 8, cols: 4, timeLimitMs: 950,  noTargetRatio: 0.35, adTrapRatio: 0.3 },
  hell:   { label: 'HELL',   rounds: 16, gridSize: 9, cols: 3, timeLimitMs: 750,  noTargetRatio: 0.45, adTrapRatio: 0.45 },
};

function initShortfocus() {
  const s = App.state.shortfocus;
  if (s.timerID) clearTimeout(s.timerID);
  if (s.delayTimer) clearTimeout(s.delayTimer);
  const challenge = (App.pendingChallenge && App.pendingChallenge.section === 'shortfocus') ? App.pendingChallenge.data : null;
  App.pendingChallenge = null;
  App.state.shortfocus = { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalHitTime: 0, hitCount: 0, hitLog: [], cards: [], promptCat: null, hasTarget: false, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', streak: 0, challenge };
  renderShortfocusView('start');
}

function shortfocusCardHTML(card, idx) {
  const viewCount = Math.floor(Math.random() * 300 + 5);
  const adBadge = card.isAd ? `<span class="absolute top-1 right-1 bg-slate-900/80 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded">AD</span>` : '';
  return `
    <div id="shortfocus-card-${idx}" onclick="shortfocusTap(${idx})"
      class="relative aspect-square rounded-xl bg-slate-800 border-2 border-slate-600 hover:border-fuchsia-500 flex flex-col items-center justify-center cursor-pointer select-none transition-colors duration-100"
      style="touch-action:manipulation;">
      ${adBadge}
      <span class="text-3xl">${card.cat.emoji}</span>
      <span class="text-slate-500 text-[10px] mt-1">조회 ${viewCount}만</span>
    </div>`;
}

function renderShortfocusView(view) {
  const container = document.getElementById('shortfocus-container');
  const state = App.state.shortfocus;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">📱</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">숏폼 집중력 테스트</h2>
        <p class="text-slate-400 mb-6">피드에 여러 콘텐츠가 동시에 떠요. 🧠<br>목표 카테고리와 일치하는 콘텐츠만 빠르게 찾아 탭!<br>가짜 광고나 다른 콘텐츠를 잘못 누르면 감점이에요.</p>
        ${guideCardHTML(
          ['라운드마다 "이번엔 ○○ 찾기" 목표가 먼저 제시돼요', '카드들이 동시에 뜨면 목표와 일치하는 카드만 빠르게 탭하세요', '목표가 이번 피드에 없을 수도 있어요 — 그럴 땐 아무것도 누르지 말고 기다리세요']
        )}
        ${renderChallengeBanner(state.challenge)}
        <input id="shortfocus-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-cyan-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">피드 속도(난이도) 선택</p>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="shortfocusStart('easy')" class="bg-emerald-800/50 hover:bg-emerald-700/70 border border-emerald-600 text-emerald-300 font-bold py-3 rounded-xl transition text-sm">
            🟢 쉬움<br><span class="text-xs font-normal opacity-70">2x2, 여유있음</span>
          </button>
          <button onclick="shortfocusStart('normal')" class="bg-amber-800/50 hover:bg-amber-700/70 border border-amber-600 text-amber-300 font-bold py-3 rounded-xl transition text-sm">
            🟡 보통<br><span class="text-xs font-normal opacity-70">2x3, 가짜광고 등장</span>
          </button>
          <button onclick="shortfocusStart('hard')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-3 rounded-xl transition text-sm">
            🔴 어려움<br><span class="text-xs font-normal opacity-70">2x4, 초고속 피드</span>
          </button>
        </div>
        <button onclick="confirmHellMode('shortfocusStart')" class="w-full mt-3 bg-gradient-to-r from-red-950 to-black hover:from-red-900 border-2 border-red-600 text-red-400 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
          <span class="text-xl">🔥</span> HELL 난이도 <span class="text-xs font-normal opacity-70">(3x3, 가짜광고 절반, 상급자 전용)</span>
        </button>
      </div>`;
  }

  else if (view === 'round') {
    const cfg = SHORTFOCUS_CONFIG[state.difficulty];
    container.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님 · ${cfg.label}</span>
          <span id="shortfocus-round-counter" class="text-cyan-400 font-bold text-sm">${state.round + 1} / ${state.totalRounds}</span>
        </div>
        <div class="progress-bar-track mb-4">
          <div id="shortfocus-progress-fill" class="progress-bar-fill" style="width:${Math.round((state.round / state.totalRounds) * 100)}%"></div>
        </div>
        <div id="shortfocus-prompt" class="text-center bg-fuchsia-900/30 border border-fuchsia-700/50 rounded-xl py-2 px-3 mb-4 text-fuchsia-200 font-bold text-sm"></div>
        <div id="shortfocus-grid" class="grid gap-2 mb-4" style="grid-template-columns:repeat(${cfg.cols}, minmax(0,1fr));"></div>
        <p id="shortfocus-feedback" class="text-center text-slate-500 text-sm mt-2 min-h-6"></p>
      </div>`;
    shortfocusBeginRound();
  }

  else if (view === 'result') {
    const accuracy = (state.correctCount / state.totalRounds) * 100;
    const avgHitMs = state.hitCount > 0 ? Math.round(state.totalHitTime / state.hitCount) : 0;

    const half = state.totalRounds / 2;
    const early = state.hitLog.filter(h => h.round < half).map(h => h.ms);
    const late = state.hitLog.filter(h => h.round >= half).map(h => h.ms);
    let decrementText = '';
    if (early.length >= 2 && late.length >= 2) {
      const avgEarly = early.reduce((a, b) => a + b, 0) / early.length;
      const avgLate = late.reduce((a, b) => a + b, 0) / late.length;
      const pct = Math.round(((avgLate - avgEarly) / avgEarly) * 100);
      if (pct > 15) decrementText = `⚠️ 후반부 반응이 초반보다 ${pct}% 느려졌어요 — 팝콘브레인 주의! 🍿`;
      else if (pct < -15) decrementText = `🔥 후반부에 오히려 ${Math.abs(pct)}% 더 빨라졌어요! 완전히 몰입했네요`;
      else decrementText = `✅ 초반과 후반 집중력 차이가 거의 없어요, 꾸준한 집중력!`;
    }

    let tier, tierColor, tierBg, tierMsg;
    if (accuracy >= 95)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = ['당신의 뇌는 아직 알고리즘에 잠식되지 않았다! 클래식 집중력 보유자 🧠✨', '가짜 광고도, 낚시 썸네일도 다 걸러내는 시각 탐색 최상위권', '숏폼 마스터! 원하는 콘텐츠만 정확히 골라내는 수준']; }
    else if (accuracy >= 85) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = ['숏폼 내성 甲! 웬만한 떡밥엔 안 낚이는 타입.', '여러 콘텐츠 중에서도 목표를 잘 골라내는 편! 집중력 상위권', '숏폼 내성이 강한 편, 가짜 광고 구분을 잘 해내네']; }
    else if (accuracy >= 70) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = ['평균적인 숏폼 세대 뇌. 광고 몇 개는 낚였을지도? ㅋㅋ', '평범한 숏폼 세대 뇌, 몇 개는 낚였어도 괜찮아', '무난한 시각 탐색력! 조금만 더 신경 쓰면 안 낚이겠어']; }
    else if (accuracy >= 50) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = ['이미 도파민에 살짝 적응된 뇌... 스크롤 좀 줄여볼까?', '비슷한 콘텐츠 사이에서 살짝 헷갈리는 편, 스크롤 타임을 줄여볼까', '가짜 광고에 몇 번 낚인 편이네, 다음엔 조금 더 침착하게']; }
    else                     { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = ['숏폼 알고리즘의 완벽한 먹잇감 확정 😂 근데 원래 다들 그래, 너만 그런 거 아니야!', '오늘은 알고리즘한테 완전히 낚였나봐, 다음엔 목표를 한 번 더 확인해보자', '괜찮아, 숏폼 앞에서 안 낚이는 사람이 어딨어! 다들 그래']; }
    tierMsg = pickOne(tierMsg);

    const animalCard = pickAnimalCard('shortfocus', tier);
    const shareText = `🐾 나는 ${animalCard.title}! 내 숏폼 뇌 지수는 정확도 ${accuracy.toFixed(0)}%, 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;
    const myResultStr = accuracy.toFixed(0) + '% (Tier ' + tier + ')';

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">📱</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 숏폼 뇌 지수</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${accuracy.toFixed(0)}<span class="text-2xl text-slate-400">%</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <div id="percentile-badge-shortfocus" class="text-xs text-violet-300 mt-2"></div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
        ${animalCardHTML(animalCard)}

        ${renderChallengeCompareCard(myResultStr, state.challenge, 'shortfocus', state.nickname, state.difficulty)}

        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-emerald-400">${state.correctCount}</div>
            <div class="text-slate-400 text-xs">정답 수</div>
            <div class="text-slate-500 text-xs">/ ${state.totalRounds}</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-rose-400">${state.commissionErrors}</div>
            <div class="text-slate-400 text-xs">광고·오답에 낚인 횟수</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-violet-400">${avgHitMs}ms</div>
            <div class="text-slate-400 text-xs">평균 반응속도</div>
          </div>
        </div>
        ${decrementText ? `<div class="bg-fuchsia-900/20 border border-fuchsia-700/30 rounded-xl p-3 mb-6 text-fuchsia-200 text-sm text-center">${decrementText}</div>` : ''}

        ${renderShareRow('shortfocus', tier, animalCard._idx, state.nickname, myResultStr, shareText, animalCard)}
        ${renderChallengeButton('shortfocus', state.nickname, myResultStr, state.difficulty)}

        ${renderPlaceholderUI('shortfocus', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 임상 주의력·집중력 검사를 대체하지 않습니다.
        </div>
        <button onclick="initShortfocus()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('shortfocus', state.nickname, accuracy.toFixed(0) + '% (Tier ' + tier + ')', state.difficulty);
    renderPercentileBadge('shortfocus', tier, state.difficulty);
    if (tier === 'S') playSound('tierS');
    renderLocalRanking('shortfocus-ranking-list', 'shortfocus');
  }
}

function shortfocusStart(difficulty) {
  const input = document.getElementById('shortfocus-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-shortfocus-plays');
  const cfg = SHORTFOCUS_CONFIG[difficulty];
  App.state.shortfocus = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalHitTime: 0, hitCount: 0, hitLog: [],
    cards: [], promptCat: null, hasTarget: false,
    startTime: 0, timerID: null, delayTimer: null, phase: 'idle', streak: 0,
  };
  showCountdownThenStart('shortfocus-container', () => renderShortfocusView('round'));
}

function shortfocusBeginRound() {
  const state = App.state.shortfocus;
  const cfg = SHORTFOCUS_CONFIG[state.difficulty];
  const counter = document.getElementById('shortfocus-round-counter');
  const fill = document.getElementById('shortfocus-progress-fill');
  if (counter) counter.textContent = `${state.round + 1} / ${state.totalRounds}`;
  if (fill) fill.style.width = `${Math.round((state.round / state.totalRounds) * 100)}%`;

  const feedback = document.getElementById('shortfocus-feedback');
  if (feedback) feedback.textContent = '';

  const promptCat = pickOne(SHORTFOCUS_CATEGORIES);
  state.promptCat = promptCat;
  state.hasTarget = Math.random() >= cfg.noTargetRatio;

  const cards = [];
  if (state.hasTarget) {
    cards.push({ cat: promptCat, isTarget: true, isAd: false });
    if (cfg.adTrapRatio > 0 && Math.random() < cfg.adTrapRatio) {
      cards.push({ cat: promptCat, isTarget: false, isAd: true });
    }
  }
  const decoyPool = SHORTFOCUS_CATEGORIES.filter(c => c.key !== promptCat.key);
  while (cards.length < cfg.gridSize) {
    cards.push({ cat: pickOne(decoyPool), isTarget: false, isAd: false });
  }
  shuffleArray(cards);
  state.cards = cards;

  const promptEl = document.getElementById('shortfocus-prompt');
  if (promptEl) promptEl.textContent = `🎯 이번 피드에서 ${promptCat.emoji} ${promptCat.label} 콘텐츠를 찾아 탭하세요!`;

  const gridEl = document.getElementById('shortfocus-grid');
  if (gridEl) gridEl.innerHTML = cards.map((card, idx) => shortfocusCardHTML(card, idx)).join('');

  state.phase = 'active';
  state.startTime = performance.now();
  if (state.timerID) clearTimeout(state.timerID);
  state.timerID = setTimeout(shortfocusTimeUp, cfg.timeLimitMs);
}

function shortfocusTap(idx) {
  const state = App.state.shortfocus;
  if (state.phase !== 'active') return;
  const card = state.cards[idx];
  if (state.timerID) clearTimeout(state.timerID);
  state.phase = 'idle';
  const feedback = document.getElementById('shortfocus-feedback');
  const cardEl = document.getElementById(`shortfocus-card-${idx}`);

  if (card.isTarget) {
    const ms = Math.round(performance.now() - state.startTime);
    state.correctCount++;
    state.hitCount++;
    state.totalHitTime += ms;
    state.hitLog.push({ round: state.round, ms });
    state.streak = (state.streak || 0) + 1;
    if (cardEl) pulseElement(cardEl, 'correct');
    if (feedback) feedback.textContent = `${ms}ms! 딱 찾았어요 ✅` + comboSuffix(state.streak);
    showToast('✅ 정답!');
    playSound('correct');
  } else {
    state.commissionErrors++;
    state.streak = 0;
    if (cardEl) pulseElement(cardEl, 'wrong');
    playSound('wrong');
    if (card.isAd) {
      if (feedback) feedback.textContent = '앗, 가짜 광고에 낚였어요! 😵';
      showToast('❌ 광고 낚임!');
    } else if (!state.hasTarget) {
      if (feedback) feedback.textContent = '어? 이번엔 찾는 콘텐츠가 없었어요 😵';
      showToast('❌ 잘못 탭했어요!');
    } else {
      if (feedback) feedback.textContent = '다른 콘텐츠예요! 목표를 다시 확인해보세요 😵';
      showToast('❌ 오답!');
    }
  }
  state.delayTimer = setTimeout(shortfocusAdvance, 650);
}

function shortfocusTimeUp() {
  const state = App.state.shortfocus;
  if (state.phase !== 'active') return;
  state.phase = 'idle';
  const feedback = document.getElementById('shortfocus-feedback');

  if (state.hasTarget) {
    state.omissionErrors++;
    state.streak = 0;
    playSound('wrong');
    if (feedback) feedback.textContent = '앗, 놓쳤어요! 스크롤이 너무 빨랐나봐요 😅';
    showToast('⏱️ 놓쳤어요!');
  } else {
    state.correctCount++;
    state.streak = (state.streak || 0) + 1;
    playSound('correct');
    if (feedback) feedback.textContent = '광고뿐이었네요, 잘 넘겼어요! 👍' + comboSuffix(state.streak);
    showToast('✅ 잘 넘겼어요!');
  }
  state.delayTimer = setTimeout(shortfocusAdvance, 650);
}

function shortfocusAdvance() {
  if (App.state.currentSection !== 'shortfocus') return;
  const state = App.state.shortfocus;
  state.round++;
  if (state.round >= state.totalRounds) {
    App.showLoader(() => renderShortfocusView('result'));
  } else {
    shortfocusBeginRound();
  }
}

/* ══════════════════════════════════════════════════
   🎉 인싸력 테스트 (10문항 사교성 성향 퀴즈, MZ향, v0.0.19~)
   - MBTI/ADHD와 동일한 "문항 → 점수 누적 → 등급" 패턴
══════════════════════════════════════════════════ */
function initInsa() {
  const match = (App.pendingMatch && App.pendingMatch.section === 'insa') ? App.pendingMatch.data : null;
  App.pendingMatch = null;
  App.state.insa = { nickname: '', answers: [], step: 0, match };
  renderInsaView('start');
}

function renderInsaView(view) {
  const container = document.getElementById('insa-container');
  const { insaQuestions, insaResults } = AppData;
  const state = App.state.insa;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">인싸력 테스트</h2>
        <p class="text-slate-400 mb-6">10문항으로 알아보는 나의 사교성 지수<br>인싸든 아싸든, 다 각자의 매력이 있는 법!</p>
        ${renderMatchBanner(state.match, state.match ? state.match.score + '점' : '')}
        <input id="insa-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-orange-500 transition"/>
        <button onclick="insaStart()" class="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition">
          테스트 시작하기
        </button>
      </div>`;
  }

  else if (view === 'question') {
    const q = insaQuestions[state.step];
    const progress = Math.round((state.step / insaQuestions.length) * 100);
    container.innerHTML = `
      <div class="max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님</span>
          <span class="text-orange-400 font-bold text-sm">${state.step + 1} / ${insaQuestions.length}</span>
        </div>
        <div class="progress-bar-track mb-6">
          <div class="h-full rounded-full transition-all" style="width:${progress}%;background:linear-gradient(90deg,#f97316,#ec4899)"></div>
        </div>
        <h3 class="text-slate-100 text-xl font-semibold mb-6 leading-relaxed">Q${state.step+1}. ${q.q}</h3>
        <div class="flex flex-col gap-3">
          ${[['항상 그렇다', 3], ['자주 그렇다', 2], ['가끔 그렇다', 1], ['전혀 아니다', 0]].map(([label, val]) => `
            <button class="option-btn" onclick="insaAnswer(${val})">
              ${label}
            </button>`).join('')}
        </div>
      </div>`;
  }

  else if (view === 'result') {
    const score = state.answers.reduce((a, b) => a + b, 0);
    const result = insaResults.find(r => score >= r.range[0] && score <= r.range[1]) || insaResults[insaResults.length-1];
    const shareText = `나 인싸력 테스트 해봤는데 ${result.grade}등급 「${result.title}」 나왔어! 너도 해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">${result.emoji}</div>
          <div class="text-4xl font-black text-slate-100 mb-1">등급 ${result.grade}</div>
          <div class="text-orange-400 font-bold text-xl mb-2">${result.title}</div>
          <p class="text-slate-400">${state.nickname} 님의 점수: <strong class="text-slate-100">${score}점</strong> / 30점</p>
        </div>

        ${renderInsaMatchCard(score, state.match)}

        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <p class="text-slate-300 leading-relaxed">${result.desc}</p>
        </div>
        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <p class="text-slate-400 leading-relaxed text-sm">${result.detail}</p>
        </div>
        <div class="bg-orange-900/30 border border-orange-700/40 rounded-xl p-4 mb-4">
          <h4 class="text-orange-300 font-bold mb-3">💡 ${state.nickname} 님을 위한 인간관계 꿀팁</h4>
          <ul class="space-y-2">
            ${result.tips.map(tip => `
              <li class="flex gap-2 text-slate-300 text-sm">
                <span class="text-orange-400 mt-0.5">▸</span>
                <span>${tip}</span>
              </li>`).join('')}
          </ul>
        </div>

        ${renderIdentityShareRow('insa', { grade: result.grade, nickname: state.nickname, result: `${result.grade}등급 - ${result.title}` }, `${location.origin}/share-cards/insa-${result.grade}.jpg`, `${state.nickname} 님의 인싸력 테스트 결과`, `${result.grade}등급 - ${result.title}`, shareText)}
        <button onclick="shareCompatibility('insa', \`${state.nickname}\`, { score: ${score} }, '${score}점')"
          class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition mb-3">
          💞 궁합 보기 링크 보내기
        </button>

        ${renderPlaceholderUI('insa', result.grade)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 및 자기 이해 목적의 성향 체크리스트이며, 어떤 유형도 옳고 그름이 없습니다.
        </div>
        <button onclick="initInsa()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 테스트하기
        </button>
      </div>`;

    saveRanking('insa', state.nickname, '등급 ' + result.grade + ' (' + score + '점)');
    renderLocalRanking('insa-ranking-list', 'insa');
  }
}

function insaStart() {
  const nickname = document.getElementById('insa-nickname').value.trim();
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-insa-plays');
  App.state.insa.nickname = nickname;
  App.state.insa.answers = [];
  App.state.insa.step = 0;
  renderInsaView('question');
}

function insaAnswer(val) {
  const state = App.state.insa;
  state.answers.push(val);
  state.step++;
  if (state.step >= AppData.insaQuestions.length) {
    App.showLoader(() => renderInsaView('result'));
  } else {
    renderInsaView('question');
  }
}

/* ══════════════════════════════════════════════════
   📜 속담 완성 퀴즈 (지혜 테스트, 어르신향, v0.0.20~)
   - 시간 제한 없음, 정답/오답 모두 긍정적으로 프레이밍
══════════════════════════════════════════════════ */
function initProverb() {
  App.state.proverb = { nickname: '', step: 0, correctCount: 0, options: [], answerIndex: 0, phase: 'idle', log: [], questions: [] };
  renderProverbView('start');
}

function renderProverbView(view) {
  const container = document.getElementById('proverb-container');
  const { proverbResults } = AppData;
  const state = App.state.proverb;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">📜</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">속담 완성 퀴즈</h2>
        <p class="text-slate-400 mb-6">옛 어른들의 지혜, 속담 10문항!<br>매번 다른 문제가 나와요. 시간 제한 없이 편하게 풀어보세요 😊</p>
        <input id="proverb-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-amber-500 transition"/>
        <button onclick="proverbStart()" class="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-3 rounded-xl transition">
          퀴즈 시작하기
        </button>
      </div>`;
  }

  else if (view === 'question') {
    const q = state.questions[state.step];
    const opts = shuffleArray([q.correct, ...q.decoys]);
    state.options = opts;
    state.answerIndex = opts.indexOf(q.correct);
    state.phase = 'active';
    const progress = Math.round((state.step / state.questions.length) * 100);

    container.innerHTML = `
      <div class="max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님</span>
          <span class="text-amber-400 font-bold text-sm">${state.step + 1} / ${state.questions.length}</span>
        </div>
        <div class="progress-bar-track mb-6">
          <div class="h-full rounded-full transition-all" style="width:${progress}%;background:linear-gradient(90deg,#d97706,#eab308)"></div>
        </div>
        <h3 class="text-slate-100 text-xl font-semibold mb-6 leading-relaxed text-center">"${q.front} <span class="text-amber-400">___</span>"</h3>
        <div id="proverb-options" class="flex flex-col gap-3">
          ${opts.map((opt, i) => `
            <button id="proverb-opt-${i}" onclick="proverbAnswer(${i})" class="option-btn">
              ${opt}
            </button>`).join('')}
        </div>
        <p id="proverb-feedback" class="text-center text-slate-500 text-sm mt-4 min-h-6"></p>
      </div>`;
  }

  else if (view === 'result') {
    const total = state.questions.length;
    const result = proverbResults.find(r => state.correctCount >= r.range[0] && state.correctCount <= r.range[1]) || proverbResults[proverbResults.length-1];
    const shareText = `나 속담 퀴즈 ${state.correctCount}/${total}개 맞혔어! 「${result.title}」래ㅋㅋ 너도 도전해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">${result.emoji}</div>
          <div class="text-4xl font-black text-slate-100 mb-1">등급 ${result.grade}</div>
          <div class="text-amber-400 font-bold text-xl mb-2">${result.title}</div>
          <p class="text-slate-400">${state.nickname} 님의 점수: <strong class="text-slate-100">${state.correctCount}</strong> / ${total}개</p>
        </div>

        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <p class="text-slate-300 leading-relaxed">${result.desc}</p>
        </div>
        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <p class="text-slate-400 leading-relaxed text-sm">${result.detail}</p>
        </div>

        <div class="bg-amber-900/30 border border-amber-700/40 rounded-xl p-4 mb-4">
          <h4 class="text-amber-300 font-bold mb-3">📖 정답 확인</h4>
          <ul class="space-y-2">
            ${state.log.map(item => `
              <li class="flex gap-2 text-sm">
                <span class="mt-0.5">${item.userCorrect ? '✅' : '❌'}</span>
                <span class="text-slate-300">"${item.front} <strong class="text-amber-300">${item.correct}</strong>"</span>
              </li>`).join('')}
          </ul>
        </div>

        ${renderIdentityShareRow('proverb', { grade: result.grade, nickname: state.nickname, result: `${result.grade}등급 - ${result.title}` }, `${location.origin}/share-cards/proverb-${result.grade}.jpg`, `속담 퀴즈 ${state.correctCount}/${total}개 정답!`, `${result.grade}등급 - ${result.title}`, shareText)}

        ${renderPlaceholderUI('proverb', result.grade)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 지역·세대에 따라 다르게 전해지는 속담일 수 있어요. 정답은 재미로만 참고해주세요.
        </div>
        <button onclick="initProverb()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 풀어보기
        </button>
      </div>`;

    saveRanking('proverb', state.nickname, '등급 ' + result.grade + ' (' + state.correctCount + '/' + total + ')');
    renderLocalRanking('proverb-ranking-list', 'proverb');
  }
}

function proverbStart() {
  const input = document.getElementById('proverb-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-proverb-plays');
  const questions = shuffleArray(AppData.proverbQuestions).slice(0, 10);
  App.state.proverb = { nickname, step: 0, correctCount: 0, options: [], answerIndex: 0, phase: 'idle', log: [], questions };
  renderProverbView('question');
}

function proverbAnswer(idx) {
  const state = App.state.proverb;
  if (state.phase !== 'active') return;
  state.phase = 'idle';
  const q = state.questions[state.step];
  const isCorrect = idx === state.answerIndex;
  if (isCorrect) state.correctCount++;
  state.log.push({ front: q.front, correct: q.correct, userCorrect: isCorrect });

  const buttons = document.querySelectorAll('#proverb-options button');
  buttons.forEach(btn => btn.style.pointerEvents = 'none');
  const correctBtn = document.getElementById(`proverb-opt-${state.answerIndex}`);
  if (correctBtn) correctBtn.classList.add('!bg-emerald-700/50', '!border-emerald-500', '!text-emerald-200');
  if (!isCorrect) {
    const wrongBtn = document.getElementById(`proverb-opt-${idx}`);
    if (wrongBtn) wrongBtn.classList.add('!bg-rose-700/50', '!border-rose-500', '!text-rose-200');
  }
  const feedback = document.getElementById('proverb-feedback');
  if (feedback) feedback.textContent = isCorrect ? '정답이에요! 👍' : `아쉬워요! 정답은 "${q.correct}"`;
  playSound(isCorrect ? 'correct' : 'wrong');
  pulseElement(correctBtn || document.getElementById(`proverb-opt-${idx}`), isCorrect ? 'correct' : 'wrong');

  setTimeout(proverbAdvance, 1400);
}

function proverbAdvance() {
  if (App.state.currentSection !== 'proverb') return;
  const state = App.state.proverb;
  state.step++;
  if (state.step >= state.questions.length) {
    App.showLoader(() => renderProverbView('result'));
  } else {
    renderProverbView('question');
  }
}

/* ══════════════════════════════════════════════════
   🧾 그 시절 물가 맞히기 (향수 트리비아, 어르신향, v0.0.21~)
   - 시간 제한 없음, 실제 물가 통계 기반, 정답/오답 모두 긍정적으로 프레이밍
══════════════════════════════════════════════════ */
function initPricequiz() {
  App.state.pricequiz = { nickname: '', step: 0, correctCount: 0, options: [], answerIndex: 0, phase: 'idle', log: [], questions: [] };
  renderPricequizView('start');
}

function renderPricequizView(view) {
  const container = document.getElementById('pricequiz-container');
  const { priceQuizResults } = AppData;
  const state = App.state.pricequiz;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">🧾</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">그 시절 물가 맞히기</h2>
        <p class="text-slate-400 mb-6">추억의 그 시절 물가, 10문항!<br>매번 다른 문제가 나와요. 시간 제한 없이 편하게 풀어보세요 😊</p>
        <input id="pricequiz-nickname" type="text" maxlength="12" value="${getNickname()}" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-amber-500 transition"/>
        <button onclick="pricequizStart()" class="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-3 rounded-xl transition">
          퀴즈 시작하기
        </button>
      </div>`;
  }

  else if (view === 'question') {
    const q = state.questions[state.step];
    const opts = shuffleArray([q.correct, ...q.decoys]);
    state.options = opts;
    state.answerIndex = opts.indexOf(q.correct);
    state.phase = 'active';
    const progress = Math.round((state.step / state.questions.length) * 100);

    container.innerHTML = `
      <div class="max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님</span>
          <span class="text-amber-400 font-bold text-sm">${state.step + 1} / ${state.questions.length}</span>
        </div>
        <div class="progress-bar-track mb-6">
          <div class="h-full rounded-full transition-all" style="width:${progress}%;background:linear-gradient(90deg,#d97706,#eab308)"></div>
        </div>
        <div class="text-center mb-2">
          <span class="text-4xl">${q.emoji}</span>
        </div>
        <h3 class="text-slate-100 text-xl font-semibold mb-6 leading-relaxed text-center"><span class="text-amber-400">${q.year}</span>, ${q.item}의 가격은 얼마였을까요?</h3>
        <div id="pricequiz-options" class="flex flex-col gap-3">
          ${opts.map((opt, i) => `
            <button id="pricequiz-opt-${i}" onclick="pricequizAnswer(${i})" class="option-btn">
              ${opt}
            </button>`).join('')}
        </div>
        <p id="pricequiz-feedback" class="text-center text-slate-500 text-sm mt-4 min-h-6"></p>
      </div>`;
  }

  else if (view === 'result') {
    const total = state.questions.length;
    const result = priceQuizResults.find(r => state.correctCount >= r.range[0] && state.correctCount <= r.range[1]) || priceQuizResults[priceQuizResults.length-1];
    const shareText = `나 그 시절 물가 퀴즈 ${state.correctCount}/${total}개 맞혔어! 「${result.title}」래! 너도 해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">${result.emoji}</div>
          <div class="text-4xl font-black text-slate-100 mb-1">등급 ${result.grade}</div>
          <div class="text-amber-400 font-bold text-xl mb-2">${result.title}</div>
          <p class="text-slate-400">${state.nickname} 님의 점수: <strong class="text-slate-100">${state.correctCount}</strong> / ${total}개</p>
        </div>

        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <p class="text-slate-300 leading-relaxed">${result.desc}</p>
        </div>
        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <p class="text-slate-400 leading-relaxed text-sm">${result.detail}</p>
        </div>

        <div class="bg-amber-900/30 border border-amber-700/40 rounded-xl p-4 mb-4">
          <h4 class="text-amber-300 font-bold mb-3">🧾 정답 확인</h4>
          <ul class="space-y-3">
            ${state.log.map(item => `
              <li class="flex gap-2 text-sm">
                <span class="mt-0.5">${item.userCorrect ? '✅' : '❌'}</span>
                <div>
                  <span class="text-slate-300">${item.year} ${item.itemName} — <strong class="text-amber-300">${item.correct}</strong></span>
                  <p class="text-slate-500 text-xs mt-0.5">${item.note}</p>
                </div>
              </li>`).join('')}
          </ul>
        </div>

        ${renderIdentityShareRow('pricequiz', { grade: result.grade, nickname: state.nickname, result: `${result.grade}등급 - ${result.title}` }, `${location.origin}/share-cards/pricequiz-${result.grade}.jpg`, `그 시절 물가 퀴즈 ${state.correctCount}/${total}개 정답!`, `${result.grade}등급 - ${result.title}`, shareText)}

        ${renderPlaceholderUI('pricequiz', result.grade)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 지역·자료에 따라 실제 가격은 다소 차이가 있을 수 있어요. 재미로만 참고해주세요.
        </div>
        <button onclick="initPricequiz()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 풀어보기
        </button>
      </div>`;

    saveRanking('pricequiz', state.nickname, '등급 ' + result.grade + ' (' + state.correctCount + '/' + total + ')');
    renderLocalRanking('pricequiz-ranking-list', 'pricequiz');
  }
}

function pricequizStart() {
  const input = document.getElementById('pricequiz-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  setNickname(nickname);
  bumpEngagement('site-pricequiz-plays');
  const questions = shuffleArray(AppData.priceQuizQuestions).slice(0, 10);
  App.state.pricequiz = { nickname, step: 0, correctCount: 0, options: [], answerIndex: 0, phase: 'idle', log: [], questions };
  renderPricequizView('question');
}

function pricequizAnswer(idx) {
  const state = App.state.pricequiz;
  if (state.phase !== 'active') return;
  state.phase = 'idle';
  const q = state.questions[state.step];
  const isCorrect = idx === state.answerIndex;
  if (isCorrect) state.correctCount++;
  state.log.push({ year: q.year, itemName: q.item, correct: q.correct, note: q.note, userCorrect: isCorrect });

  const buttons = document.querySelectorAll('#pricequiz-options button');
  buttons.forEach(btn => btn.style.pointerEvents = 'none');
  const correctBtn = document.getElementById(`pricequiz-opt-${state.answerIndex}`);
  if (correctBtn) correctBtn.classList.add('!bg-emerald-700/50', '!border-emerald-500', '!text-emerald-200');
  if (!isCorrect) {
    const wrongBtn = document.getElementById(`pricequiz-opt-${idx}`);
    if (wrongBtn) wrongBtn.classList.add('!bg-rose-700/50', '!border-rose-500', '!text-rose-200');
  }
  const feedback = document.getElementById('pricequiz-feedback');
  if (feedback) feedback.textContent = isCorrect ? '정답이에요! 👍' : `아쉬워요! 정답은 "${q.correct}"`;
  playSound(isCorrect ? 'correct' : 'wrong');
  pulseElement(correctBtn || document.getElementById(`pricequiz-opt-${idx}`), isCorrect ? 'correct' : 'wrong');

  setTimeout(pricequizAdvance, 1400);
}

function pricequizAdvance() {
  if (App.state.currentSection !== 'pricequiz') return;
  const state = App.state.pricequiz;
  state.step++;
  if (state.step >= state.questions.length) {
    App.showLoader(() => renderPricequizView('result'));
  } else {
    renderPricequizView('question');
  }
}

/* ══════════════════════════════════════════════════
   🃏 심리 테스트존 / ⚖️ 밸런스 게임 공용 — 참여수/공감수 카운터
   (v0.2.3~, Phase 4 로드맵 11-6/11-7) 실제 집계는 백엔드 연동 전까지
   이 기기의 로컬스토리지 증가분만 base 더미값에 더해 표시 — 노골적 조작 방지 위해
   화면에는 항상 "추후 실데이터 연동 예정" 문구를 함께 노출한다.
══════════════════════════════════════════════════ */
function engagementCount(key, base) {
  const local = parseInt(localStorage.getItem('engage_' + key) || '0', 10);
  return base + local;
}
function bumpEngagement(key) {
  const cur = parseInt(localStorage.getItem('engage_' + key) || '0', 10);
  localStorage.setItem('engage_' + key, cur + 1);
}

/* ══════════════════════════════════════════════════
   🃏 심리 테스트존 (v0.2.3~, Phase 4 수익화 로드맵 11-6)
   - 피드형 목록 → 후킹 포스트 → 짧은 문항 테스트 → 결과+공유 구조 (poomang 레퍼런스 참고)
   - 지금은 실제 콘텐츠 1개(katokspeed)만 있고 나머지는 피드에서 "준비중"으로 노출
══════════════════════════════════════════════════ */
/* 카테고리 메타(라벨/이모지) + 잠금 콘텐츠(제목만, 2026-07-05 사용자가 선정 요청한
   "어그로 있는" 향후 주제) — 카테고리당 정원 3개(오픈 1 + 잠금 2) 운영, 신규 주제는
   CONTENT_PROMPTS.md의 AI 프롬프트로 생성 후 이 배열에 추가 */
const PSYCHTEST_CATEGORIES = {
  character: { label: '캐릭터 테스트', emoji: '🎭' },
  trait: { label: '성향 테스트', emoji: '🧠' },
  taste: { label: '취향 테스트', emoji: '🛍️' },
  national: { label: '국민테스트', emoji: '🇰🇷' },
};
const PSYCHTEST_LOCKED = {
  character: [{ emoji: '🏯', title: '나의 사극 빙의 테스트' }, { emoji: '🦹', title: '나의 빌런 각성 테스트' }],
  trait: [{ emoji: '🧊', title: 'T의 공감능력 테스트' }, { emoji: '💤', title: '관태기 자가진단 테스트' }],
  taste: [{ emoji: '🏪', title: '나의 편의점 소비 유형 테스트' }, { emoji: '📺', title: 'OTT 정주행 스타일 테스트' }],
  national: [],
};

function initPsychtest() {
  const category = App.state.psychtest && App.state.psychtest.category || 'trait';
  App.state.psychtest = { category, testId: null, step: 0, answers: [] };
  renderPsychtestFeed(category);
}

/* 사이드바 카테고리 서브메뉴 클릭 시 호출(nav 클릭 핸들러에서 연결) */
function psychtestNavCategory(category) {
  App.state.psychtest = { category, testId: null, step: 0, answers: [] };
  renderPsychtestFeed(category);
}

function renderPsychtestFeed(category) {
  category = category || 'trait';
  App.state.psychtest.category = category;
  const container = document.getElementById('psychtest-container');
  /* v0.3.1~: 카테고리당 진짜 콘텐츠가 여러 개(예: 국민테스트 3개)일 수 있어 첫 매칭 1개만 찾던 find()를
     filter()로 바꿔 전부 노출 — 대표 배너는 그중 첫 번째를 사용 */
  const reals = AppData.psychTests.filter(x => x.category === category);
  const real = reals[0];
  const locked = PSYCHTEST_LOCKED[category] || [];

  const tabsHTML = Object.keys(PSYCHTEST_CATEGORIES).map(key => {
    const cat = PSYCHTEST_CATEGORIES[key];
    return `<span class="cat-tab-btn ${key === category ? 'active' : ''}" onclick="psychtestNavCategory('${key}')">${cat.emoji} ${cat.label}</span>`;
  }).join('');

  container.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <h2 class="text-2xl font-black text-slate-100 mb-1">🃏 심리 테스트존</h2>
      <p class="text-slate-400 mb-4">요즘 뜨는 심리테스트, 카테고리별로 계속 업데이트됩니다</p>
      <div class="flex flex-wrap gap-2 mb-6">${tabsHTML}</div>

      ${real ? `
      <div class="bg-gradient-to-br from-violet-900/40 to-slate-800 border border-violet-700/40 rounded-2xl p-5 mb-6 cursor-pointer hover:border-violet-500 transition"
        onclick="psychtestOpenPost('${real.id}')">
        <div class="flex items-center gap-4">
          <div class="text-4xl">${real.emoji}</div>
          <div>
            <div class="text-violet-300 text-xs font-bold uppercase tracking-widest mb-1">🔥 이 카테고리 대표 테스트</div>
            <h3 class="text-slate-100 font-bold text-lg mb-1">${real.title}</h3>
            <p class="text-slate-400 text-sm">${real.hook}</p>
          </div>
        </div>
      </div>` : ''}

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${reals.map(t => `
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center cursor-pointer hover:border-violet-500 transition" onclick="psychtestOpenPost('${t.id}')">
          <div class="text-3xl mb-2">${t.emoji}</div>
          <p class="text-slate-100 font-semibold text-sm mb-1">${t.title}</p>
          <p class="text-slate-500 text-xs">▷ ${engagementCount('psychtest-' + t.id + '-plays', 128)}</p>
        </div>`).join('')}
        ${locked.map(c => `
          <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center opacity-60 cursor-pointer" onclick="showToast('곧 만나요! 준비중인 콘텐츠예요 🙏')">
            <div class="text-3xl mb-2">${c.emoji}</div>
            <p class="text-slate-300 font-semibold text-sm mb-1">${c.title}</p>
            <p class="text-slate-500 text-xs">🔒 준비중</p>
          </div>`).join('')}
      </div>
    </div>`;
}

function psychtestOpenPost(testId) {
  const t = AppData.psychTests.find(x => x.id === testId);
  if (!t) return;
  App.state.psychtest.testId = testId;
  const container = document.getElementById('psychtest-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <button onclick="renderPsychtestFeed('${App.state.psychtest.category}')" class="text-slate-400 hover:text-slate-200 text-sm mb-4">← 목록으로</button>
      <div class="flex items-start gap-4 mb-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-700/60 to-slate-800 flex items-center justify-center text-2xl shrink-0">${t.emoji}</div>
        <div>
          <h2 class="text-slate-100 font-black text-xl mb-1">${t.title}</h2>
          <p class="text-slate-500 text-xs">과몰입 연구소 · 약 ${t.estMinutes}분 · ▷ ${engagementCount('psychtest-' + t.id + '-plays', 128)}</p>
        </div>
      </div>
      <p class="text-slate-300 leading-relaxed mb-4">${t.hook}</p>
      <div class="flex gap-2 mb-6">
        ${t.tags.map(tag => `<span class="bg-slate-700/50 text-slate-300 text-xs px-3 py-1 rounded-full"># ${tag}</span>`).join('')}
      </div>
      <button onclick="psychtestStart('${t.id}')" class="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition">
        테스트 시작
      </button>
    </div>`;
}

function psychtestStart(testId) {
  bumpEngagement('psychtest-' + testId + '-plays');
  App.state.psychtest = { category: App.state.psychtest.category, testId, step: 0, answers: [] };
  renderPsychtestQuestion();
}

function renderPsychtestQuestion() {
  const state = App.state.psychtest;
  const t = AppData.psychTests.find(x => x.id === state.testId);
  const q = t.questions[state.step];
  const container = document.getElementById('psychtest-container');
  const progress = Math.round((state.step / t.questions.length) * 100);
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <div class="flex items-center justify-between mb-2">
        <span class="text-slate-400 text-sm">${t.title}</span>
        <span class="text-violet-400 font-bold text-sm">${state.step + 1} / ${t.questions.length}</span>
      </div>
      <div class="progress-bar-track mb-6"><div class="h-full rounded-full bg-violet-500 transition-all" style="width:${progress}%"></div></div>
      <h3 class="text-slate-100 text-xl font-semibold mb-6 leading-relaxed">Q${state.step + 1}. ${q.q}</h3>
      <div class="flex flex-col gap-3">
        ${q.options.map(([label, val]) => `
          <button class="option-btn" onclick="psychtestAnswer(${val})">${label}</button>`).join('')}
      </div>
    </div>`;
}

function psychtestAnswer(val) {
  const state = App.state.psychtest;
  state.answers.push(val);
  state.step++;
  const t = AppData.psychTests.find(x => x.id === state.testId);
  if (state.step >= t.questions.length) {
    App.showLoader(() => renderPsychtestResult());
  } else {
    renderPsychtestQuestion();
  }
}

function renderPsychtestResult() {
  const state = App.state.psychtest;
  const t = AppData.psychTests.find(x => x.id === state.testId);
  const score = state.answers.reduce((a, b) => a + b, 0);
  const result = t.results.find(r => score >= r.range[0] && score <= r.range[1]) || t.results[t.results.length - 1];
  const nickname = getNickname() || '나';
  const shareText = `나 「${t.title}」 해봤는데 ${result.title} 나왔어! 너도 해봐 👉`;
  const funKey = 'psychtest-' + t.id + '-' + result.grade + '-fun';

  const shareRow = renderIdentityShareRow('psychtest',
    { testId: t.id, grade: result.grade, nickname, result: result.title },
    `${location.origin}/share-cards/psychtest-${t.id}-${result.grade}.jpg`,
    `${nickname} 님의 「${t.title}」 결과`, result.title, shareText);

  const container = document.getElementById('psychtest-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <div class="text-center mb-6">
        <div class="text-5xl mb-3">${result.emoji}</div>
        <div class="text-violet-400 font-bold text-xl mb-1">${result.title}</div>
        <p class="text-slate-400 text-sm">${result.desc}</p>
      </div>
      <div class="bg-slate-800 rounded-2xl p-5 mb-4">
        <p class="text-slate-300 leading-relaxed text-sm">${result.detail}</p>
      </div>
      <div class="bg-violet-900/30 border border-violet-700/40 rounded-xl p-4 mb-5">
        <h4 class="text-violet-300 font-bold mb-3">💡 팁</h4>
        <ul class="space-y-2">
          ${result.tips.map(tip => `<li class="flex gap-2 text-slate-300 text-sm"><span class="text-violet-400 mt-0.5">▸</span><span>${tip}</span></li>`).join('')}
        </ul>
      </div>

      ${shareRow}

      <div class="flex justify-center gap-8 my-6">
        <button onclick="bumpEngagement('${funKey}'); this.querySelector('.n').textContent = engagementCount('${funKey}', 110);" class="text-center text-xs text-slate-500">
          <span class="block text-xl mb-1">😂</span>공감돼요<div class="n text-slate-100 font-bold text-xs mt-0.5">${engagementCount(funKey, 110)}</div>
        </button>
      </div>
      <p class="text-slate-600 text-xs text-center mb-6">※ 공감 수는 추후 실데이터 연동 예정 — 현재 이 기기 기준 더미 표시</p>

      <div class="border-t border-slate-700 pt-4 mb-4">
        <p class="text-slate-300 font-bold text-sm mb-2">댓글 0</p>
        <p class="text-slate-500 text-xs bg-slate-800 border border-dashed border-slate-700 rounded-lg p-3 text-center">💬 댓글은 로그인 후 작성할 수 있어요 (준비 중)</p>
      </div>

      <button onclick="renderPsychtestFeed('${App.state.psychtest.category}')" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">목록으로</button>
    </div>`;
}

/* ══════════════════════════════════════════════════
   ⚖️ 밸런스 게임 (v0.2.3~, Phase 4 수익화 로드맵 11-7)
   - A/B 양자택일 + 다른 사람들의 선택 비율(현재는 더미, 추후 실데이터 연동)
══════════════════════════════════════════════════ */
function initBalance() {
  App.state.balance = { gameId: null, picked: null };
  renderBalanceFeed();
}

function renderBalanceFeed() {
  const container = document.getElementById('balance-container');
  /* v0.3.1~: 예전엔 balanceGames[0] 하나만 진짜로 보여주고 나머지는 가짜 "준비중" 카드였는데,
     콘텐츠를 6개로 늘리면서 전부 실제 플레이 가능한 카드로 노출 (잠금 placeholder 제거) */
  container.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <h2 class="text-2xl font-black text-slate-100 mb-1">⚖️ 밸런스 게임</h2>
      <p class="text-slate-400 mb-6">A vs B, 당신의 선택은?</p>

      <!-- v0.4.1~ 밸런스게임 스페셜: 여러 문항 → 유형 결과 (피쿠 "중급" 레퍼런스 기반) -->
      <div class="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-2">🎯 스페셜 — 유형까지 알려주는 밸런스게임</div>
      <div class="flex flex-col gap-3 mb-6">
        ${(AppData.balanceSpecials || []).map(g => `
        <div class="bg-gradient-to-br from-emerald-900/40 to-slate-800 border border-emerald-700/40 rounded-2xl p-5 cursor-pointer hover:border-emerald-500 transition"
          onclick="balanceSpOpen('${g.id}')">
          <div class="flex items-center gap-4">
            <div class="text-4xl">${g.emoji}</div>
            <div>
              <h3 class="text-slate-100 font-bold text-lg mb-1">${g.title}</h3>
              <p class="text-slate-400 text-sm mb-1">${g.hook}</p>
              <p class="text-slate-500 text-xs">${g.questions.length}문항 · 약 ${g.estMinutes}분 · ▷ ${engagementCount('balance-sp-' + g.id + '-plays', 180)}</p>
            </div>
          </div>
        </div>`).join('')}
      </div>

      <div class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">⚡ A vs B 스피드 선택</div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${AppData.balanceGames.map(g => `
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center cursor-pointer hover:border-emerald-500 transition" onclick="balanceOpenPost('${g.id}')">
          <div class="text-3xl mb-2">${g.emoji}</div>
          <p class="text-slate-100 font-semibold text-sm mb-1">${g.title}</p>
          <p class="text-slate-500 text-xs">▷ ${engagementCount('balance-' + g.id + '-plays', 203)}</p>
        </div>`).join('')}
      </div>
    </div>`;
}

function balanceOpenPost(gameId) {
  const g = AppData.balanceGames.find(x => x.id === gameId);
  if (!g) return;
  App.state.balance.gameId = gameId;
  const container = document.getElementById('balance-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <button onclick="renderBalanceFeed()" class="text-slate-400 hover:text-slate-200 text-sm mb-4">← 목록으로</button>
      <div class="flex items-start gap-4 mb-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700/60 to-slate-800 flex items-center justify-center text-2xl shrink-0">${g.emoji}</div>
        <div>
          <h2 class="text-slate-100 font-black text-xl mb-1">${g.title}</h2>
          <p class="text-slate-500 text-xs">과몰입 연구소 · 약 ${g.estMinutes}분 · ▷ ${engagementCount('balance-' + g.id + '-plays', 203)}</p>
        </div>
      </div>
      <p class="text-slate-300 leading-relaxed mb-4">${g.hook}</p>
      <div class="flex gap-2 mb-6">
        ${g.tags.map(tag => `<span class="bg-slate-700/50 text-slate-300 text-xs px-3 py-1 rounded-full"># ${tag}</span>`).join('')}
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button onclick="balancePick('${g.id}','A')" class="bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded-xl p-5 text-center transition">
          <div class="text-3xl mb-2">${g.optionA.emoji}</div>
          <p class="text-slate-100 font-bold text-sm">${g.optionA.label}</p>
        </button>
        <button onclick="balancePick('${g.id}','B')" class="bg-slate-800 border border-slate-700 hover:border-rose-500 rounded-xl p-5 text-center transition">
          <div class="text-3xl mb-2">${g.optionB.emoji}</div>
          <p class="text-slate-100 font-bold text-sm">${g.optionB.label}</p>
        </button>
      </div>
    </div>`;
}

function balancePick(gameId, choice) {
  const g = AppData.balanceGames.find(x => x.id === gameId);
  if (!g) return;
  bumpEngagement('balance-' + gameId + '-plays');
  App.state.balance.picked = choice;

  const pickedOpt = choice === 'A' ? g.optionA : g.optionB;
  const nickname = getNickname() || '나';
  const shareText = `나는 「${g.title}」에서 "${pickedOpt.label}" 골랐어! 너라면? 👉`;
  const shareRow = renderIdentityShareRow('balance',
    { gameId: g.id, choice, nickname, result: pickedOpt.label },
    `${location.origin}/share-cards/balance-${g.id}.jpg`,
    `${nickname} 님의 선택: ${pickedOpt.label}`, g.title, shareText);

  /* 실제 집계는 추후 백엔드 연동 예정 — 지금은 이 기기의 선택 1표만 dummySplitA 기준값에 살짝 반영 */
  const pickedA = parseInt(localStorage.getItem('balance_pickA_' + gameId) || '0', 10) + (choice === 'A' ? 1 : 0);
  const pickedB = parseInt(localStorage.getItem('balance_pickB_' + gameId) || '0', 10) + (choice === 'B' ? 1 : 0);
  localStorage.setItem('balance_pickA_' + gameId, pickedA);
  localStorage.setItem('balance_pickB_' + gameId, pickedB);
  const percentA = Math.round((g.dummySplitA * 100 + pickedA * 100) / (100 + pickedA + pickedB));

  const container = document.getElementById('balance-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <div class="text-center mb-6">
        <div class="text-5xl mb-3">${pickedOpt.emoji}</div>
        <div class="text-slate-100 font-bold text-xl mb-1">"${pickedOpt.label}"</div>
        <p class="text-slate-400 text-sm">${pickedOpt.resultText}</p>
      </div>

      <div class="bg-slate-800 rounded-2xl p-5 mb-5">
        <p class="text-slate-400 text-xs mb-2">다른 사람들의 선택 <span class="text-slate-600">(추후 실데이터 연동 예정 — 현재 더미 표시)</span></p>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-slate-100 text-sm font-bold w-10">${percentA}%</span>
          <div class="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden flex">
            <div class="bg-emerald-500 h-full" style="width:${percentA}%"></div>
            <div class="bg-rose-500 h-full" style="width:${100 - percentA}%"></div>
          </div>
          <span class="text-slate-100 text-sm font-bold w-10 text-right">${100 - percentA}%</span>
        </div>
        <div class="flex justify-between text-xs text-slate-500">
          <span>${g.optionA.label}</span><span>${g.optionB.label}</span>
        </div>
      </div>

      ${shareRow}

      <button onclick="renderBalanceFeed()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">목록으로</button>
    </div>`;
}

/* ══════════════════════════════════════════════════
   ⚖️🎯 밸런스게임 스페셜 (v0.4.1~)
   - 여러 문항 연속 → pt 합산 → 유형(캐릭터) 결과. 채점 구조는 심리테스트존 엔진과 동일 사상,
     문항 UI만 밸런스게임 고유의 A/B 카드 2개(이모지+제목+짧은 설명) 형태
   - 결과 전 App.showLoader() 3초 광고 프리로더(기존 인프라 재사용)
══════════════════════════════════════════════════ */
function balanceSpOpen(gameId) {
  const g = (AppData.balanceSpecials || []).find(x => x.id === gameId);
  if (!g) return;
  App.state.balanceSp = { gameId, step: 0, score: 0 };
  const container = document.getElementById('balance-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <button onclick="renderBalanceFeed()" class="text-slate-400 hover:text-slate-200 text-sm mb-4">← 목록으로</button>
      <div class="flex items-start gap-4 mb-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700/60 to-slate-800 flex items-center justify-center text-2xl shrink-0">${g.emoji}</div>
        <div>
          <h2 class="text-slate-100 font-black text-xl mb-1">${g.title}</h2>
          <p class="text-slate-500 text-xs">과몰입 연구소 · ${g.questions.length}문항 · 약 ${g.estMinutes}분 · ▷ ${engagementCount('balance-sp-' + g.id + '-plays', 180)}</p>
        </div>
      </div>
      <p class="text-slate-300 leading-relaxed mb-4">${g.hook}</p>
      <div class="flex gap-2 mb-6">
        ${g.tags.map(tag => `<span class="bg-slate-700/50 text-slate-300 text-xs px-3 py-1 rounded-full"># ${tag}</span>`).join('')}
      </div>
      <button onclick="balanceSpStart('${g.id}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition">
        시작하기
      </button>
    </div>`;
}

function balanceSpStart(gameId) {
  bumpEngagement('balance-sp-' + gameId + '-plays');
  App.state.balanceSp = { gameId, step: 0, score: 0 };
  renderBalanceSpQuestion();
}

function renderBalanceSpQuestion() {
  const state = App.state.balanceSp;
  const g = AppData.balanceSpecials.find(x => x.id === state.gameId);
  const q = g.questions[state.step];
  const progress = Math.round((state.step / g.questions.length) * 100);
  const container = document.getElementById('balance-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <div class="flex items-center justify-between mb-2">
        <span class="text-slate-400 text-sm">${g.title}</span>
        <span class="text-emerald-400 font-bold text-sm">${state.step + 1} / ${g.questions.length}</span>
      </div>
      <div class="progress-bar-track mb-6"><div class="h-full rounded-full bg-emerald-500 transition-all" style="width:${progress}%"></div></div>
      <h3 class="text-slate-100 text-xl font-semibold mb-2 leading-relaxed text-center">Q${state.step + 1}. ${q.q}</h3>
      <p class="text-slate-500 text-xs text-center mb-6">그나마 나은 쪽을 골라주세요 😈</p>
      <div class="grid grid-cols-2 gap-3 items-stretch">
        ${q.options.map((opt, i) => `
        <button onclick="balanceSpAnswer(${opt.pt})" class="bg-slate-800 border border-slate-700 ${i === 0 ? 'hover:border-emerald-500' : 'hover:border-rose-500'} rounded-xl p-5 text-center transition flex flex-col items-center justify-start">
          <div class="text-4xl mb-3">${opt.emoji}</div>
          <p class="text-slate-100 font-bold text-sm mb-2 leading-snug" style="word-break:keep-all">${opt.label}</p>
          <p class="text-slate-500 text-xs leading-snug" style="word-break:keep-all">${opt.desc}</p>
        </button>`).join('')}
      </div>
    </div>`;
}

function balanceSpAnswer(pt) {
  const state = App.state.balanceSp;
  state.score += pt;
  state.step++;
  const g = AppData.balanceSpecials.find(x => x.id === state.gameId);
  if (state.step >= g.questions.length) {
    App.showLoader(() => renderBalanceSpResult());
  } else {
    renderBalanceSpQuestion();
  }
}

function renderBalanceSpResult() {
  const state = App.state.balanceSp;
  const g = AppData.balanceSpecials.find(x => x.id === state.gameId);
  const result = g.results.find(r => state.score >= r.range[0] && state.score <= r.range[1]) || g.results[g.results.length - 1];
  const nickname = getNickname() || '나';
  const shareText = `나 「${g.title}」 해봤는데 「${result.title}」 나왔어 ㅋㅋ 너도 해봐 👉`;

  const shareRow = renderIdentityShareRow('balance',
    { gameId: g.id, grade: result.grade, nickname, result: result.title },
    `${location.origin}/share-cards/balance-sp-${g.id}-${result.grade}.jpg`,
    `${nickname} 님은 「${result.title}」`, result.catch, shareText);

  const container = document.getElementById('balance-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <div class="bg-gradient-to-br from-emerald-900/40 to-slate-800 border border-emerald-700/40 rounded-2xl p-6 text-center mb-4">
        <p class="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-3">당신의 유형은</p>
        <div class="text-6xl mb-3">${result.emoji}</div>
        <div class="text-slate-100 font-black text-2xl mb-2">${result.title}</div>
        <p class="text-emerald-200 text-sm font-semibold mb-3">"${result.catch}"</p>
        <div class="flex flex-wrap justify-center gap-2">
          ${result.hashtags.map(h => `<span class="bg-emerald-900/50 text-emerald-300 text-xs px-3 py-1 rounded-full">#${h}</span>`).join('')}
        </div>
      </div>
      <div class="bg-slate-800 rounded-2xl p-5 mb-4">
        <p class="text-slate-300 leading-relaxed text-sm">${result.detail}</p>
      </div>
      <div class="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-5">
        <h4 class="text-slate-200 font-bold text-sm mb-3">✅ 이런 특징이 있어요</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${result.traits.map(t => `<div class="flex gap-2 text-slate-300 text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5"><span class="text-emerald-400 shrink-0">✔</span><span style="word-break:keep-all">${t}</span></div>`).join('')}
        </div>
      </div>

      ${shareRow}

      <p class="text-slate-600 text-xs text-center my-4">지금까지 ▷ ${engagementCount('balance-sp-' + g.id + '-plays', 180)}명이 플레이했어요 <span class="text-slate-700">(추후 실데이터 연동 예정)</span></p>

      <div class="flex gap-2">
        <button onclick="balanceSpStart('${g.id}')" class="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition">🔄 다시 하기</button>
        <button onclick="renderBalanceFeed()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">목록으로</button>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════
   🎲 가족오락관 (v0.2.3~, Phase 4 로드맵 11-1 — 메뉴만, 전체 준비중)
══════════════════════════════════════════════════ */
/* v0.4.2~: 스피드 퀴즈/몸으로 말해요(+v0.4.3 라이어 게임)는 실제 오픈(AppData.familyGames) — 이 목록은 남은 준비중 게임 */
const FAMILY_GAMES = [
  { emoji: '🗣️', name: '이구동성 게임', desc: '한 단어를 여러 명이 동시에 외치면? 맞혀보세요' },
  { emoji: '🎵', name: '삼행시 대결', desc: '주어진 단어로 삼행시 짓기' },
  { emoji: '🧠', name: '스무고개', desc: '질문 20개 안에 정답 맞히기' },
  { emoji: '🖐️', name: '손병호 게임', desc: '해당하면 손가락 접기' },
  { emoji: '🎨', name: '이어그리기', desc: '앞사람 그림을 이어서 완성하기' },
  { emoji: '📖', name: '끝말잇기 챌린지', desc: '제한시간 안에 끝말잇기 대결' },
  { emoji: '🎤', name: '노래 제목 맞히기', desc: '초성만 보고 노래 제목 맞히기' },
];

function initFamily() {
  /* session 토큰: 섹션을 떠나면 돌아가던 타이머가 스스로 멈추게 함 (lottodraw 물리 루프와 동일 패턴) */
  App.state.family = { session: (App.state.family ? App.state.family.session : 0) + 1 };
  const container = document.getElementById('family-container');
  container.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <h2 class="text-2xl font-black text-slate-100 mb-1">🎲 가족오락관</h2>
      <p class="text-slate-400 mb-6">모였을 때 폰 하나로 바로 진행하는 온가족 실내게임 — 출제·타이머·채점은 저희가 할게요</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        ${Object.entries(AppData.familyGames).map(([id, g]) => `
        <div class="bg-gradient-to-br from-amber-900/40 to-slate-800 border border-amber-700/40 rounded-2xl p-5 cursor-pointer hover:border-amber-500 transition" onclick="familyOpenGame('${id}')">
          <div class="text-4xl mb-2">${g.emoji}</div>
          <h3 class="text-slate-100 font-bold text-lg mb-1">${g.title}</h3>
          <p class="text-slate-400 text-sm mb-2">${g.desc}</p>
          <p class="text-slate-500 text-xs">▷ ${engagementCount('family-' + id + '-plays', 95)}</p>
        </div>`).join('')}
      </div>

      <div class="space-y-2">
        ${FAMILY_GAMES.map(g => `
          <div class="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 opacity-70 cursor-pointer hover:border-violet-500 transition"
            onclick="showToast('이 게임은 준비 중이에요 — 곧 만나요! 🙏')">
            <div class="text-2xl w-9 text-center">${g.emoji}</div>
            <div class="flex-1">
              <p class="text-slate-100 font-semibold text-sm">${g.name}</p>
              <p class="text-slate-500 text-xs">${g.desc}</p>
            </div>
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-slate-700/60 text-slate-400 whitespace-nowrap">🔒 준비중</span>
          </div>`).join('')}
      </div>
      <p class="text-slate-600 text-xs mt-4">※ 나머지 게임도 순차적으로 오픈할 예정이에요.</p>
    </div>`;
}

/* ══════════════════════════════════════════════════
   🎯 가족오락관 — 스피드 퀴즈/몸으로 말해요 진행 도우미 엔진 (v0.4.2~)
   - 두 게임이 같은 엔진 공유: 카테고리·시간 선택 → 3초 카운트다운 → 제시어+타이머+⭕/⏭️ → 결과 리캡
   - 오프라인 파티게임의 "출제자 역할"을 폰이 대신하는 도구라 점수 저장(saveRanking)은 하지 않음
══════════════════════════════════════════════════ */
function familyOpenGame(gameId) {
  const g = AppData.familyGames[gameId];
  if (!g) return;
  const st = App.state.family;
  st.gameId = gameId;
  if (gameId === 'liar') { liarRenderSetup(); return; }
  st.catId = st.catId && g.categories.some(c => c.id === st.catId) ? st.catId : g.categories[0].id;
  st.timeLimit = st.timeLimit || 90;
  familyRenderSetup();
}

function familyRenderSetup() {
  const st = App.state.family;
  const g = AppData.familyGames[st.gameId];
  const container = document.getElementById('family-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <button onclick="initFamily()" class="text-slate-400 hover:text-slate-200 text-sm mb-4">← 목록으로</button>
      <div class="text-center mb-5">
        <div class="text-5xl mb-2">${g.emoji}</div>
        <h2 class="text-slate-100 font-black text-2xl mb-1">${g.title}</h2>
        <p class="text-slate-400 text-sm">${g.desc}</p>
      </div>
      <div class="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-5">
        <h4 class="text-slate-200 font-bold text-sm mb-2">📖 어떻게 하나요</h4>
        <ol class="space-y-1.5">
          ${g.how.map((s, i) => `<li class="flex gap-2 text-slate-300 text-sm"><span class="text-amber-400 font-bold shrink-0">${i + 1}.</span><span style="word-break:keep-all">${s}</span></li>`).join('')}
        </ol>
      </div>
      <p class="text-slate-300 font-bold text-sm mb-2">제시어 카테고리</p>
      <div class="flex flex-wrap gap-2 mb-5">
        ${g.categories.map(c => `
        <button onclick="App.state.family.catId='${c.id}'; familyRenderSetup();"
          class="px-3 py-2 rounded-full text-sm font-semibold border transition ${st.catId === c.id ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-600'}">
          ${c.emoji} ${c.label}</button>`).join('')}
      </div>
      <p class="text-slate-300 font-bold text-sm mb-2">제한시간</p>
      <div class="flex gap-2 mb-6">
        ${[60, 90, 120].map(t => `
        <button onclick="App.state.family.timeLimit=${t}; familyRenderSetup();"
          class="flex-1 py-2 rounded-xl text-sm font-bold border transition ${st.timeLimit === t ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-600'}">
          ${t}초</button>`).join('')}
      </div>
      <button onclick="familyStart()" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition">▶ 시작하기</button>
    </div>`;
}

function familyStart() {
  const st = App.state.family;
  bumpEngagement('family-' + st.gameId + '-plays');
  const g = AppData.familyGames[st.gameId];
  const cat = g.categories.find(c => c.id === st.catId);
  st.words = shuffleArray([...cat.words]);
  st.idx = 0;
  st.score = 0;
  st.log = [];
  st.remaining = st.timeLimit;
  st.session++;
  const session = st.session;

  /* 3→2→1 카운트다운 (출제자가 폰을 잡을 준비 시간) */
  const container = document.getElementById('family-container');
  let count = 3;
  const showCount = () => {
    if (session !== App.state.family.session || App.state.currentSection !== 'family') return;
    if (count > 0) {
      container.innerHTML = `<div class="max-w-lg mx-auto text-center py-24"><div class="text-7xl font-black text-amber-400">${count}</div><p class="text-slate-400 mt-4">${st.gameId === 'charades' ? '표현할 사람, 폰 잡으세요!' : '출제자님, 폰 잡으세요!'}</p></div>`;
      playSound('tick');
      count--;
      setTimeout(showCount, 700);
    } else {
      familyBeginRound(session);
    }
  };
  showCount();
}

function familyBeginRound(session) {
  const st = App.state.family;
  familyRenderPlay();
  st.timer = setInterval(() => {
    if (session !== st.session || App.state.currentSection !== 'family') { clearInterval(st.timer); return; }
    st.remaining--;
    if (st.remaining <= 0) {
      clearInterval(st.timer);
      playSound('wrong');
      familyRenderResult();
      return;
    }
    if (st.remaining <= 5) playSound('tick');
    const tEl = document.getElementById('family-timer');
    const bEl = document.getElementById('family-timer-bar');
    if (tEl) {
      tEl.textContent = st.remaining + '초';
      tEl.className = 'font-black text-2xl ' + (st.remaining <= 10 ? 'text-rose-400' : 'text-amber-400');
    }
    if (bEl) bEl.style.width = Math.round((st.remaining / st.timeLimit) * 100) + '%';
  }, 1000);
}

function familyCurrentWord() {
  const st = App.state.family;
  /* 풀을 다 쓰면 다시 섞어서 계속 (제한시간이 끝날 때까지 제시어가 마르지 않게) */
  if (st.idx >= st.words.length) {
    st.words = shuffleArray([...st.words]);
    st.idx = 0;
  }
  return st.words[st.idx];
}

function familyRenderPlay() {
  const st = App.state.family;
  const g = AppData.familyGames[st.gameId];
  const cat = g.categories.find(c => c.id === st.catId);
  const container = document.getElementById('family-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <div class="flex items-center justify-between mb-2">
        <span class="text-slate-400 text-sm">${g.emoji} ${g.title} · ${cat.emoji} ${cat.label}</span>
        <span id="family-timer" class="font-black text-2xl text-amber-400">${st.remaining}초</span>
      </div>
      <div class="progress-bar-track mb-6"><div id="family-timer-bar" class="h-full rounded-full bg-amber-500 transition-all" style="width:100%"></div></div>
      <div class="bg-gradient-to-br from-amber-900/40 to-slate-800 border border-amber-700/40 rounded-2xl py-14 px-6 text-center mb-6">
        <p id="family-word" class="text-slate-100 font-black text-4xl" style="word-break:keep-all">${familyCurrentWord()}</p>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <button onclick="familyMark(true)" class="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-6 rounded-2xl transition">⭕ 정답</button>
        <button onclick="familyMark(false)" class="bg-slate-700 hover:bg-slate-600 text-slate-100 font-black text-xl py-6 rounded-2xl transition">⏭️ 패스</button>
      </div>
      <p class="text-center text-slate-400 text-sm">맞힌 개수: <span id="family-score" class="text-emerald-400 font-bold">${st.score}</span>개</p>
    </div>`;
}

function familyMark(correct) {
  const st = App.state.family;
  if (!st.timer || st.remaining <= 0) return;
  const word = familyCurrentWord();
  st.log.push({ word, correct });
  if (correct) { st.score++; playSound('correct'); } else { playSound('tick'); }
  st.idx++;
  const wEl = document.getElementById('family-word');
  const sEl = document.getElementById('family-score');
  if (wEl) { wEl.textContent = familyCurrentWord(); pulseElement(wEl, correct ? 'pop' : 'wrong'); }
  if (sEl) sEl.textContent = st.score;
}

function familyRenderResult() {
  const st = App.state.family;
  const g = AppData.familyGames[st.gameId];
  const cat = g.categories.find(c => c.id === st.catId);
  const nickname = getNickname() || '우리집';
  const shareText = `우리 「${g.title}」(${cat.label}) ${st.timeLimit}초에 ${st.score}개 맞혔어!! 이거 가족이랑 하면 진짜 웃김 ㅋㅋ 너네도 해봐 👉`;
  const shareRow = renderIdentityShareRow('family',
    { game: st.gameId, nickname, score: String(st.score), cat: cat.label, time: String(st.timeLimit) },
    `${location.origin}/share-cards/family-${st.gameId}.jpg`,
    `${nickname} 팀의 ${g.title} 기록`, `${cat.label} ${st.timeLimit}초 — ${st.score}개 정답!`, shareText);

  const container = document.getElementById('family-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <div class="bg-gradient-to-br from-amber-900/40 to-slate-800 border border-amber-700/40 rounded-2xl p-6 text-center mb-4">
        <div class="text-5xl mb-2">${g.emoji}</div>
        <p class="text-slate-400 text-sm mb-1">${cat.emoji} ${cat.label} · ${st.timeLimit}초</p>
        <div class="text-slate-100 font-black text-4xl mb-1">${st.score}개 정답!</div>
        <p class="text-amber-300 text-sm">${st.score >= 15 ? '이 팀 텔레파시 되는 거 아니에요? 🤯' : st.score >= 8 ? '호흡 척척! 다음 판은 기록 경신 가봅시다 🔥' : '웃느라 못 맞힌 거 다 압니다 ㅋㅋ 한 판 더!'}</p>
      </div>

      ${st.log.length ? `
      <div class="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-5">
        <h4 class="text-slate-200 font-bold text-sm mb-3">📋 제시어 리캡</h4>
        <div class="flex flex-wrap gap-2">
          ${st.log.map(l => `<span class="text-xs px-3 py-1 rounded-full ${l.correct ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-700/60 text-slate-400 line-through'}">${l.word}</span>`).join('')}
        </div>
      </div>` : ''}

      ${shareRow}

      <div class="flex gap-2 mt-4">
        <button onclick="familyStart()" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition">🔄 같은 설정으로 한 판 더</button>
        <button onclick="familyRenderSetup()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">설정 바꾸기</button>
      </div>
      <button onclick="initFamily()" class="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition">목록으로</button>
    </div>`;
}

/* ══════════════════════════════════════════════════
   🤥 가족오락관 — 라이어 게임 (v0.4.3~)
   - "폰 돌려보기" 방식: 인원(3~8)·카테고리 설정 → 한 명씩 몰래 확인(한 명만 라이어) →
     토론(선택 타이머) → 라이어 공개. 제시어 풀은 스피드 퀴즈 카테고리 재사용
   - 오프라인 진행 도우미라 점수 저장 없음, 승패 판정도 사람이 함(역전승 룰만 안내)
══════════════════════════════════════════════════ */
function liarCategories() {
  return AppData.familyGames.speedquiz.categories;
}

function liarRenderSetup() {
  const st = App.state.family;
  st.liar = st.liar || {};
  const L = st.liar;
  L.players = L.players || 4;
  L.catId = L.catId && liarCategories().some(c => c.id === L.catId) ? L.catId : liarCategories()[0].id;
  const g = AppData.familyGames.liar;
  const container = document.getElementById('family-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <button onclick="initFamily()" class="text-slate-400 hover:text-slate-200 text-sm mb-4">← 목록으로</button>
      <div class="text-center mb-5">
        <div class="text-5xl mb-2">${g.emoji}</div>
        <h2 class="text-slate-100 font-black text-2xl mb-1">${g.title}</h2>
        <p class="text-slate-400 text-sm">${g.desc}</p>
      </div>
      <div class="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-5">
        <h4 class="text-slate-200 font-bold text-sm mb-2">📖 어떻게 하나요</h4>
        <ol class="space-y-1.5">
          ${g.how.map((s, i) => `<li class="flex gap-2 text-slate-300 text-sm"><span class="text-amber-400 font-bold shrink-0">${i + 1}.</span><span style="word-break:keep-all">${s}</span></li>`).join('')}
        </ol>
      </div>
      <p class="text-slate-300 font-bold text-sm mb-2">인원 수</p>
      <div class="flex flex-wrap gap-2 mb-5">
        ${[3, 4, 5, 6, 7, 8].map(n => `
        <button onclick="App.state.family.liar.players=${n}; liarRenderSetup();"
          class="w-12 py-2 rounded-xl text-sm font-bold border transition ${L.players === n ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-600'}">${n}명</button>`).join('')}
      </div>
      <p class="text-slate-300 font-bold text-sm mb-2">제시어 카테고리 <span class="text-slate-500 font-normal text-xs">(라이어에게도 카테고리는 공개돼요)</span></p>
      <div class="flex flex-wrap gap-2 mb-6">
        ${liarCategories().map(c => `
        <button onclick="App.state.family.liar.catId='${c.id}'; liarRenderSetup();"
          class="px-3 py-2 rounded-full text-sm font-semibold border transition ${L.catId === c.id ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-600'}">
          ${c.emoji} ${c.label}</button>`).join('')}
      </div>
      <button onclick="liarStart()" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition">▶ 시작하기</button>
    </div>`;
}

function liarStart() {
  const st = App.state.family;
  bumpEngagement('family-liar-plays');
  const L = st.liar;
  const cat = liarCategories().find(c => c.id === L.catId);
  L.word = pickOne(cat.words);
  L.liarIdx = Math.floor(Math.random() * L.players);
  L.revealIdx = 0;
  st.session++;
  liarRenderPass();
}

function liarRenderPass() {
  const L = App.state.family.liar;
  const container = document.getElementById('family-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto text-center py-10">
      <p class="text-slate-400 text-sm mb-2">${L.revealIdx + 1} / ${L.players}</p>
      <div class="text-6xl mb-4">📵</div>
      <h2 class="text-slate-100 font-black text-2xl mb-2">${L.revealIdx + 1}번 플레이어 차례</h2>
      <p class="text-slate-400 mb-8" style="word-break:keep-all">다른 사람이 화면을 보지 않게 폰을 건네받은 뒤 눌러주세요</p>
      <button onclick="liarRenderReveal()" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl transition text-lg">🤫 혼자 확인하기</button>
    </div>`;
}

function liarRenderReveal() {
  const L = App.state.family.liar;
  const cat = liarCategories().find(c => c.id === L.catId);
  const isLiar = L.revealIdx === L.liarIdx;
  const container = document.getElementById('family-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto text-center py-10">
      <p class="text-slate-400 text-sm mb-4">${L.revealIdx + 1}번 플레이어</p>
      ${isLiar ? `
      <div class="bg-gradient-to-br from-rose-900/40 to-slate-800 border border-rose-700/40 rounded-2xl p-8 mb-6">
        <div class="text-6xl mb-3">🤥</div>
        <div class="text-rose-300 font-black text-3xl mb-3">당신이 라이어!</div>
        <p class="text-slate-300 text-sm" style="word-break:keep-all">카테고리는 <b class="text-slate-100">${cat.emoji} ${cat.label}</b> — 제시어는 비밀이에요.<br>다른 사람들 설명을 들으며 아는 척 버텨보세요 😎</p>
      </div>` : `
      <div class="bg-gradient-to-br from-emerald-900/40 to-slate-800 border border-emerald-700/40 rounded-2xl p-8 mb-6">
        <p class="text-slate-400 text-sm mb-2">${cat.emoji} ${cat.label} — 제시어</p>
        <div class="text-slate-100 font-black text-4xl mb-3" style="word-break:keep-all">${L.word}</div>
        <p class="text-slate-400 text-sm">기억했죠? 라이어가 눈치 못 채게 설명해주세요</p>
      </div>`}
      <button onclick="liarNextPlayer()" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-4 rounded-xl transition">확인 완료 — ${L.revealIdx + 1 < L.players ? '다음 사람에게 넘기기' : '모두 확인 끝!'}</button>
    </div>`;
}

function liarNextPlayer() {
  const L = App.state.family.liar;
  L.revealIdx++;
  if (L.revealIdx >= L.players) {
    liarRenderDiscuss();
  } else {
    liarRenderPass();
  }
}

function liarRenderDiscuss() {
  const st = App.state.family;
  const L = st.liar;
  const cat = liarCategories().find(c => c.id === L.catId);
  const container = document.getElementById('family-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <div class="text-center mb-6">
        <div class="text-5xl mb-2">🗣️</div>
        <h2 class="text-slate-100 font-black text-2xl mb-1">토론 시작!</h2>
        <p class="text-slate-400 text-sm">카테고리: ${cat.emoji} ${cat.label} · ${L.players}명 중 라이어 1명</p>
      </div>
      <div class="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-5">
        <ol class="space-y-1.5">
          <li class="flex gap-2 text-slate-300 text-sm"><span class="text-amber-400 font-bold shrink-0">1.</span><span>1번부터 돌아가며 제시어를 <b>한 마디씩</b> 설명해요 (제시어 단어 자체는 금지)</span></li>
          <li class="flex gap-2 text-slate-300 text-sm"><span class="text-amber-400 font-bold shrink-0">2.</span><span>다 돌았으면 자유 토론 — 수상한 사람을 추궁하세요 🕵️</span></li>
          <li class="flex gap-2 text-slate-300 text-sm"><span class="text-amber-400 font-bold shrink-0">3.</span><span>셋 세고 동시에 라이어 지목! 그 다음 아래 버튼으로 정답 공개</span></li>
        </ol>
      </div>
      <div class="bg-slate-800 rounded-xl p-4 mb-5 text-center">
        <p class="text-slate-400 text-xs mb-2">토론 타이머 (선택)</p>
        <div id="liar-timer" class="text-slate-100 font-black text-3xl mb-3">--:--</div>
        <div class="flex gap-2">
          ${[1, 2, 3].map(m => `<button onclick="liarStartTimer(${m})" class="flex-1 py-2 rounded-xl text-sm font-bold bg-slate-700 hover:bg-slate-600 text-slate-100 transition">${m}분</button>`).join('')}
        </div>
      </div>
      <button onclick="liarRenderResult()" class="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl transition text-lg">🕵️ 라이어 공개하기</button>
    </div>`;
}

function liarStartTimer(minutes) {
  const st = App.state.family;
  const L = st.liar;
  if (L.timer) clearInterval(L.timer);
  L.remaining = minutes * 60;
  st.session++;
  const session = st.session;
  const render = () => {
    const el = document.getElementById('liar-timer');
    if (!el) return;
    const m = Math.floor(L.remaining / 60), s = L.remaining % 60;
    el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    el.className = 'font-black text-3xl mb-3 ' + (L.remaining <= 10 ? 'text-rose-400' : 'text-slate-100');
  };
  render();
  L.timer = setInterval(() => {
    if (session !== st.session || App.state.currentSection !== 'family') { clearInterval(L.timer); return; }
    L.remaining--;
    if (L.remaining <= 5 && L.remaining > 0) playSound('tick');
    if (L.remaining <= 0) {
      clearInterval(L.timer);
      L.timer = null;
      playSound('wrong');
      const el = document.getElementById('liar-timer');
      if (el) el.textContent = '⏰ 타임업!';
      return;
    }
    render();
  }, 1000);
}

function liarRenderResult() {
  const st = App.state.family;
  const L = st.liar;
  if (L.timer) { clearInterval(L.timer); L.timer = null; }
  const cat = liarCategories().find(c => c.id === L.catId);
  const nickname = getNickname() || '우리집';
  const shareText = `우리 라이어 게임 했는데 눈치싸움 미쳤음 ㅋㅋ 폰 하나만 있으면 바로 됨, 너네도 해봐 👉`;
  const shareRow = renderIdentityShareRow('family',
    { game: 'liar', nickname },
    `${location.origin}/share-cards/family-liar.jpg`,
    `${nickname} 팀의 라이어 게임 한 판`, `한 명만 제시어를 모른다! 눈치싸움 게임`, shareText);
  playSound('tierS');
  const container = document.getElementById('family-container');
  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <div class="bg-gradient-to-br from-rose-900/40 to-slate-800 border border-rose-700/40 rounded-2xl p-6 text-center mb-4">
        <div class="text-6xl mb-3">🤥</div>
        <p class="text-slate-400 text-sm mb-1">라이어는 바로...</p>
        <div class="text-rose-300 font-black text-4xl mb-3">${L.liarIdx + 1}번 플레이어!</div>
        <p class="text-slate-300 text-sm">제시어는 <b class="text-slate-100">${cat.emoji} ${L.word}</b> 였습니다</p>
      </div>
      <div class="bg-amber-900/30 border border-amber-700/40 rounded-xl p-4 mb-5">
        <p class="text-amber-300 text-sm font-bold mb-1">⚖️ 판정 가이드</p>
        <ul class="space-y-1 text-slate-300 text-sm">
          <li>· 라이어를 <b>맞게 지목</b>했다면 → 시민 승리! (단, 라이어가 이 자리에서 제시어를 맞히면 <b>역전승</b>)</li>
          <li>· <b>엉뚱한 사람</b>을 지목했다면 → 라이어 승리!</li>
        </ul>
      </div>

      ${shareRow}

      <div class="flex gap-2 mt-4">
        <button onclick="liarStart()" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition">🔄 같은 설정으로 한 판 더</button>
        <button onclick="liarRenderSetup()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">설정 바꾸기</button>
      </div>
      <button onclick="initFamily()" class="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition">목록으로</button>
    </div>`;
}

/* ══════════════════════════════════════════════════
   🔮 사주 · 타로 · 궁합 (v0.2.3~, Phase 4 로드맵 11-8 — 전부 준비중)
══════════════════════════════════════════════════ */
function initFortuneExt() {
  const container = document.getElementById('fortuneext-container');
  const items = [
    { emoji: '📜', name: '사주팔자' },
    { emoji: '🎴', name: '타로 한장뽑기' },
    { emoji: '💞', name: 'AI 궁합' },
  ];
  container.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <h2 class="text-2xl font-black text-slate-100 mb-1">🔮 사주 · 타로 · 궁합</h2>
      <p class="text-slate-400 mb-6">오늘의 운세에서 확장되는 콘텐츠, 준비 중이에요</p>
      <div class="grid grid-cols-3 gap-3">
        ${items.map(i => `
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center opacity-70 cursor-pointer hover:border-violet-500 transition" onclick="showToast('곧 만나요! 준비중인 콘텐츠예요 🙏')">
            <div class="text-3xl mb-2">${i.emoji}</div>
            <p class="text-slate-100 font-semibold text-sm mb-2">${i.name}</p>
            <span class="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-1 rounded-full">준비중</span>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════
   🏆 이상형 월드컵 (v0.2.5 뼈대 → v0.4.0 "인생 공감 밈 월드컵" 1개 실구현)
   - 후보 8개 단일 토너먼트(8강→4강→결승), 실사진(무료 스톡사진) 기반
   - 랭킹(전체 몇 위)은 Supabase에 익명 투표를 처음부터 쌓되, 누적 100판 미만이면 노출하지 않음
     (표본 적을 때 노출하면 초라해 보인다는 사용자 우려 반영 — percentile_cache의 MIN_SAMPLE_SIZE와 같은 사상)
══════════════════════════════════════════════════ */
const WORLDCUP_RANK_THRESHOLD = 100;

function initWorldcup() {
  const container = document.getElementById('worldcup-container');
  container.innerHTML = `
    <div class="max-w-md mx-auto text-center py-6">
      <div class="text-5xl mb-4">🏆</div>
      <h2 class="text-2xl font-black text-slate-100 mb-2">인생 공감 밈 월드컵</h2>
      <p class="text-slate-400 mb-1">둘 중 더 "나 같은" 쪽을 골라주세요</p>
      <p class="text-slate-500 text-sm mb-6">8강 → 4강 → 결승, 총 3라운드</p>
      <button onclick="worldcupStart()" class="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition text-lg">시작하기</button>
    </div>`;
}

function worldcupMemeById(id) {
  return AppData.worldcupMemes.find(m => m.id === id);
}

function worldcupStart() {
  bumpEngagement('site-worldcup-plays');
  const ids = shuffleArray(AppData.worldcupMemes.map(m => m.id));
  App.state.worldcup = { roundIds: ids, roundLabel: '8강', matchIdx: 0, nextRoundIds: [], champion: null };
  worldcupRenderMatch();
}

function worldcupRenderMatch() {
  const s = App.state.worldcup;
  const container = document.getElementById('worldcup-container');
  const a = worldcupMemeById(s.roundIds[s.matchIdx * 2]);
  const b = worldcupMemeById(s.roundIds[s.matchIdx * 2 + 1]);
  const totalMatches = s.roundIds.length / 2;
  container.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <span class="text-slate-300 font-bold">${s.roundLabel}</span>
        <span class="text-slate-500 text-xs">${s.matchIdx + 1} / ${totalMatches}</span>
      </div>
      <div class="grid grid-cols-2 gap-3 relative">
        ${[a, b].map(m => `
          <div class="cursor-pointer group" onclick="worldcupPick('${m.id}')">
            <div class="relative rounded-2xl overflow-hidden border-2 border-slate-700 group-hover:border-violet-500 transition aspect-[3/4] bg-slate-800">
              <img src="${m.image}" alt="${escapeHtml(m.title)}" class="w-full h-full object-cover"/>
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-12 pb-3 px-3">
                <p class="text-white font-black text-base sm:text-lg">${m.emoji} ${escapeHtml(m.title)}</p>
                <p class="text-slate-300 text-xs">${escapeHtml(m.desc)}</p>
              </div>
            </div>
          </div>`).join('')}
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-100 font-black text-2xl bg-slate-900 border-2 border-slate-700 rounded-full w-12 h-12 flex items-center justify-center pointer-events-none">VS</div>
      </div>
    </div>`;
}

function worldcupPick(winnerId) {
  const s = App.state.worldcup;
  if (!s) return;
  playSound('tick');
  s.nextRoundIds.push(winnerId);
  s.matchIdx++;
  if (s.matchIdx * 2 >= s.roundIds.length) {
    if (s.nextRoundIds.length === 1) {
      worldcupFinish(s.nextRoundIds[0]);
      return;
    }
    s.roundIds = s.nextRoundIds;
    s.nextRoundIds = [];
    s.matchIdx = 0;
    s.roundLabel = s.roundIds.length === 2 ? '결승' : `${s.roundIds.length}강`;
  }
  worldcupRenderMatch();
}

async function worldcupFinish(championId) {
  App.state.worldcup.champion = championId;
  playSound('tierS');
  worldcupRenderResult(championId, null);
  worldcupSubmitVote(championId);
  const stats = await worldcupFetchStats();
  const rankingEl = document.getElementById('worldcup-ranking');
  if (rankingEl) rankingEl.innerHTML = worldcupRankingHTML(championId, stats);
}

/* 투표는 처음부터 실제로 Supabase에 쌓아두되(표본 자체는 손실 없이 계속 축적),
   100판 임계치 미만일 땐 화면에만 안 보여줌 — 실패해도 결과 화면에는 영향 없도록 항상 catch */
async function worldcupSubmitVote(memeId) {
  try {
    if (!window.sb) return;
    if (typeof ensureAnonSession === 'function') await ensureAnonSession();
    await window.sb.from('worldcup_votes').insert({ meme_id: memeId });
  } catch (e) {
    console.error('월드컵 투표 기록 실패:', e);
  }
}

async function worldcupFetchStats() {
  try {
    if (!window.sb) return null;
    const { data, error } = await window.sb.from('worldcup_stats').select('meme_id, votes');
    if (error || !data) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function worldcupRankingHTML(championId, stats) {
  if (!stats) return `<p class="text-slate-500 text-xs mt-3">📊 순위 집계 중...</p>`;
  const total = stats.reduce((sum, s) => sum + Number(s.votes), 0);
  if (total < WORLDCUP_RANK_THRESHOLD) {
    return `<p class="text-slate-500 text-xs mt-3">📊 아직 데이터가 적어서 전체 순위는 비공개예요 (누적 ${total}판, 100판부터 공개)</p>`;
  }
  const sorted = [...stats].sort((a, b) => b.votes - a.votes);
  const rank = sorted.findIndex(s => s.meme_id === championId) + 1;
  const mine = sorted.find(s => s.meme_id === championId);
  const votes = mine ? mine.votes : 0;
  return `<p class="text-amber-300 text-sm font-bold mt-3">📊 전체 ${total}판 중 ${rank}위 (${votes}표)</p>`;
}

function worldcupRenderResult(championId, stats) {
  const m = worldcupMemeById(championId);
  const container = document.getElementById('worldcup-container');
  const shareText = `나 인생 공감 밈 월드컵 했는데 결과가 "${m.title}"! 너는 뭐 나올 것 같아? 🏆`;
  const imageUrl = `${location.origin}/${m.image}`;
  const shareUrl = buildShareLandingUrl('worldcup', { champion: championId });
  container.innerHTML = `
    <div class="max-w-md mx-auto text-center">
      <p class="text-slate-400 text-sm mb-3">🏆 당신의 인생 밈은...</p>
      <div class="rounded-2xl overflow-hidden border-2 border-amber-400 mb-4">
        <img src="${m.image}" alt="${escapeHtml(m.title)}" class="w-full aspect-[3/4] object-cover"/>
      </div>
      <h2 class="text-2xl font-black text-slate-100 mb-1">${m.emoji} ${escapeHtml(m.title)}</h2>
      <p class="text-slate-400 mb-1">${escapeHtml(m.desc)}</p>
      <div id="worldcup-ranking">${worldcupRankingHTML(championId, stats)}</div>
      <div class="mt-4">
        ${shareKakaoButtonHTML(imageUrl, `내 인생 밈은 ${m.title}!`, m.desc, shareUrl)}
        ${shareIconRowHTML(shareText, shareUrl)}
      </div>
      <button onclick="worldcupStart()" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">🔄 다시하기</button>
    </div>`;
}

/* ══════════════════════════════════════════════════
   확장 Placeholder UI (공통)
══════════════════════════════════════════════════ */
function renderPlaceholderUI(section, value) {
  const rankingId = `${section}-ranking-list`;
  return `
  <div class="mt-8 space-y-4">

    ${ADSENSE_REVIEW_MODE ? '' : `
    <!-- ① 통계 비교 지면 (추후 실데이터 교체) -->
    <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <h4 class="text-slate-300 font-bold mb-1">📊 전체 통계 비교</h4>
      <p class="text-slate-500 text-xs mb-4">※ 추후 실데이터 연동 예정 — 현재 더미 표시</p>
      <div class="flex items-end gap-2 h-20">
        ${['최하값','하위25%','평균','상위25%','최고값'].map((label, i) => {
          const heights = [20, 40, 60, 75, 90];
          return `
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="dummy-bar w-full" style="height:${heights[i]}%"></div>
            <span class="text-slate-500 text-xs">${label}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="mt-3 h-3 bg-slate-700 rounded flex overflow-hidden">
        <div class="bg-violet-600/60 h-full" style="width:70%"></div>
        <div class="bg-slate-600/60 h-full" style="width:30%"></div>
      </div>
      <p class="text-slate-500 text-xs mt-1">상위 약 30% 추정 (더미)</p>
    </div>
    `}

    <!-- ② 랭킹 & 공유 지면 -->
    <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-slate-300 font-bold">🏆 로컬 명예의 전당</h4>
        <button onclick="copyToClipboard(location.href)" class="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-full transition">
          🔗 링크 복사
        </button>
      </div>
      <p class="text-slate-500 text-xs mb-3">※ 이 기기에 저장된 기록 (로컬스토리지)</p>
      <div id="${rankingId}" class="space-y-2">
        <p class="text-slate-500 text-sm text-center py-2">기록 없음</p>
      </div>
    </div>

    <!-- ③ 댓글 지면 -->
    <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <h4 class="text-slate-300 font-bold mb-1">💬 한마디 남기기</h4>
      <p class="text-slate-500 text-xs mb-3">※ 추후 백엔드 연동 예정 — 현재 로컬 임시 저장</p>
      <div id="${section}-comments-list" class="space-y-2 mb-3 max-h-40 overflow-y-auto"></div>
      <div class="flex gap-2">
        <input id="${section}-comment-input" type="text" maxlength="80" placeholder="결과에 대한 한마디..."
          class="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition"/>
        <button onclick="submitComment('${section}')" class="bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition">등록</button>
      </div>
    </div>

    ${ADSENSE_REVIEW_MODE ? '' : `
    <!-- ④ 제휴 상품 추천 배너 (Phase 4 로드맵 11-4, v0.2.3~)
         강제성 없이(안 눌러도 무방) 결과와 자연스럽게 어울리는 상품을 은근히 노출하는 자리.
         실제 쿠팡파트너스 등 제휴 링크는 가입 후 href만 교체하면 됨(placeholder 상태) —
         테스트 성격별 타겟팅(11-9)은 이후 카테고리별로 AFFILIATE_BANNERS를 분기해 고도화 예정 -->
    <a href="#" target="_blank" rel="noopener sponsored"
      class="block bg-gradient-to-r from-amber-900/20 to-slate-800/60 border border-amber-700/30 hover:border-amber-500/60 rounded-2xl p-4 transition">
      <div class="flex items-center gap-3">
        <span class="text-2xl shrink-0">🧠</span>
        <div class="flex-1 min-w-0">
          <p class="text-slate-200 text-sm font-semibold">머리가 맑아지는 하루, 이런 것도 있어요</p>
          <p class="text-slate-500 text-xs">확인해보고 싶다면 살짝 눌러보세요</p>
        </div>
        <span class="text-amber-400 text-xs font-bold shrink-0">보러가기 →</span>
      </div>
    </a>
    `}
  </div>`;
}

/* ──── 로컬스토리지 랭킹 ──── */
function saveRanking(section, nickname, result, difficulty) {
  const key = `ranking_${section}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift({ nickname, result, time: new Date().toLocaleString('ko-KR') });
  localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
  markDone(section);
  addXP(computeXP(result));
  if (typeof syncResultToSupabase === 'function') syncResultToSupabase(section, nickname, result, difficulty);
}

/* Stage D 2단계 퍼센타일 UI (v0.0.47~) — percentile_cache는 표본 5개 미만인 section+tier는
   percentile-refresh.js가 애초에 upsert하지 않으므로, row가 없으면 조용히 아무것도 표시하지 않음 */
/* v0.0.53~: 난이도별로 퍼센타일 풀을 분리(easy/normal/hard/hell 4단계) —
   difficulty가 없으면(레거시 호출부) 'normal'로 간주해 기존 데이터와 호환 */
async function renderPercentileBadge(section, tier, difficulty) {
  try {
    if (!window.sb) return;
    const { data, error } = await window.sb
      .from('percentile_cache')
      .select('percentile')
      .eq('section', section)
      .eq('tier', tier)
      .eq('difficulty', difficulty || 'normal')
      .maybeSingle();
    if (error || !data) return;
    const el = document.getElementById(`percentile-badge-${section}`);
    const diffLabel = difficulty === 'hell' ? ' · HELL' : '';
    if (el) el.innerHTML = `📊 상위 ${data.percentile}% (Tier ${tier} 이상 기록 기준${diffLabel})`;
  } catch (e) {
    console.error('퍼센타일 조회 실패:', e);
  }
}

/* ══════════════════════════════════════════════════
   ⭐ 레벨/경험치 시스템 (v0.0.33~)
   - 모든 테스트가 공통으로 호출하는 saveRanking()에서 한 곳에서만 XP를 적립
   - Tier(S~D) 채점 테스트는 등급별 차등 XP, 그 외(MBTI/ADHD/인싸력/속담/물가/운세)는 완료 시 고정 XP
══════════════════════════════════════════════════ */
const TIER_XP = { S: 30, A: 25, B: 20, C: 15, D: 10 };
const FLAT_COMPLETION_XP = 15;
const XP_PER_LEVEL = 100;

function computeXP(result) {
  const tier = parseTierFromResult(result);
  return tier ? TIER_XP[tier] : FLAT_COMPLETION_XP;
}

function addXP(amount) {
  const cur = parseInt(localStorage.getItem('app_xp') || '0', 10);
  localStorage.setItem('app_xp', String(cur + amount));
}

function getLevelInfo() {
  const xp = parseInt(localStorage.getItem('app_xp') || '0', 10);
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  return { xp, level, xpInLevel };
}

/* ══════════════════════════════════════════════════
   🏅 칭호 시스템 (v0.0.33~)
   - 방문 스트릭·완주 개수·Tier 성적 등 이미 쌓여있는 로컬 기록만으로 계산 (신규 저장소 불필요)
══════════════════════════════════════════════════ */
function getLatestResult(section) {
  const list = JSON.parse(localStorage.getItem('ranking_' + section) || '[]');
  return list.length ? list[0].result : null;
}

const BADGES = [
  { emoji: '🔥', label: '개근왕', check: () => parseInt(localStorage.getItem('visit_streak') || '0', 10) >= 7 },
  { emoji: '🌟', label: '올라운더', check: () => ['mbti', 'dream', 'fortune', 'brain', 'adhd', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus', 'insa', 'proverb', 'pricequiz'].every(isDone) },
  { emoji: '🧠', label: '천재 과몰입러', check: () => CHALLENGE_SECTIONS.every(s => { const r = getLatestResult(s); return r && parseTierFromResult(r) === 'S'; }) },
  { emoji: '🎉', label: '인싸력 만렙', check: () => { const r = getLatestResult('insa'); return r && r.includes('등급 S'); } },
  { emoji: '📜', label: '지혜로운 어른', check: () => { const r = getLatestResult('proverb'); return r && r.includes('등급 S'); } },
];

function getEarnedBadges() {
  return BADGES.filter(b => b.check());
}

function renderLocalRanking(listId, section) {
  const el = document.getElementById(listId);
  if (!el) return;
  const key = `ranking_${section}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  if (list.length === 0) { el.innerHTML = '<p class="text-slate-500 text-sm text-center py-2">기록 없음</p>'; return; }
  el.innerHTML = list.map((item, i) => `
    <div class="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
      <span class="text-slate-400 text-xs w-5">${i+1}</span>
      <span class="text-slate-100 text-sm font-semibold flex-1">${item.nickname}</span>
      <span class="text-violet-400 text-sm font-bold">${item.result}</span>
      <span class="text-slate-500 text-xs">${item.time}</span>
    </div>`).join('');
}

/* ──── 댓글 임시 저장 ──── */
function submitComment(section) {
  const input = document.getElementById(`${section}-comment-input`);
  if (!input || !input.value.trim()) { showToast('댓글을 입력해주세요!'); return; }
  const key = `comments_${section}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift({ text: input.value.trim(), time: new Date().toLocaleTimeString('ko-KR') });
  localStorage.setItem(key, JSON.stringify(list.slice(0, 20)));
  input.value = '';
  renderComments(section);
}

function renderComments(section) {
  const el = document.getElementById(`${section}-comments-list`);
  if (!el) return;
  const key = `comments_${section}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  if (list.length === 0) { el.innerHTML = '<p class="text-slate-500 text-xs text-center">아직 댓글이 없어요</p>'; return; }
  el.innerHTML = list.map(c => `
    <div class="bg-slate-700/50 rounded-lg px-3 py-2 flex gap-2">
      <span class="text-slate-300 text-sm flex-1">${c.text}</span>
      <span class="text-slate-500 text-xs whitespace-nowrap">${c.time}</span>
    </div>`).join('');
}

/* ══════════════════════════════════════════════════
   🔥 오늘의 챌린지 (v0.0.31~)
   - 오늘의 한마디와 동일한 날짜 시드 방식으로, 13개 "테스트" 중 매일 다른 3개를 홈에 노출해 재방문 유도
══════════════════════════════════════════════════ */
const DAILY_CHALLENGE_POOL = ['mbti', 'brain', 'adhd', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus', 'insa', 'proverb', 'pricequiz'];
const DAILY_CHALLENGE_META = {
  mbti: { emoji: '🧠', label: '성격 파탄(MBTI)' }, brain: { emoji: '⚡', label: '두뇌 나이' }, adhd: { emoji: '🌪️', label: '프로 미루러' },
  reaction: { emoji: '💨', label: '반응속도' }, memdigit: { emoji: '🔢', label: '숫자 기억력' }, seqmem: { emoji: '🧩', label: '순서 기억력' },
  colorvision: { emoji: '🎨', label: '색각' }, logic: { emoji: '📊', label: '논리력' }, impulse: { emoji: '🚦', label: '충동억제' },
  shortfocus: { emoji: '📱', label: '숏폼 집중력' }, insa: { emoji: '🎉', label: '인싸력' }, proverb: { emoji: '📜', label: '속담 완성' }, pricequiz: { emoji: '🧾', label: '그 시절 물가' },
};

function getDailyChallengeTests() {
  const seed = todaySeed();
  return DAILY_CHALLENGE_POOL
    .map((s, i) => ({ s, r: seededRandom(seed + i * 37) }))
    .sort((a, b) => a.r - b.r)
    .map(x => x.s)
    .slice(0, 3);
}

function renderDailyChallengeCard() {
  const container = document.getElementById('home-daily-challenge');
  if (!container) return;
  const picks = getDailyChallengeTests();
  container.innerHTML = `
    <div class="bg-gradient-to-br from-fuchsia-900/40 to-indigo-900/40 border border-fuchsia-700/40 rounded-2xl p-5">
      <h4 class="text-slate-100 font-bold mb-1">🔥 오늘의 챌린지</h4>
      <p class="text-slate-400 text-xs mb-3">매일 바뀌는 추천 테스트 3가지, 오늘 다 깨보세요!</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        ${picks.map(s => {
          const meta = DAILY_CHALLENGE_META[s];
          const done = isDone(s);
          return `
            <div onclick="App.navigate('${s}')" class="cursor-pointer bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700 rounded-xl p-3 text-center transition">
              <div class="text-2xl mb-1">${meta.emoji}</div>
              <div class="text-slate-100 text-sm font-semibold">${meta.label}</div>
              <div class="text-xs mt-1 ${done ? 'text-emerald-400' : 'text-slate-500'}">${done ? '✅ 완료' : '도전하기 →'}</div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════
   🕸️ 종합 인지 프로필 (레이더 차트, v0.0.29~)
   - 7개 인지테스트(두뇌나이/반응속도/숫자기억/순서기억/색각/논리력/충동억제) Tier를 0~100으로 환산해 시각화
   - 숏폼집중력은 충동억제와 동일 엔진이라 중복 측정 방지 차원에서 축에서 제외
   - 외부 차트 라이브러리 없이 순수 SVG로 렌더링 (빌드 도구 없는 프로젝트 구조에 맞춤)
══════════════════════════════════════════════════ */
const RADAR_AXES = [
  { key: 'brain',       label: '두뇌나이', emoji: '🧠' },
  { key: 'reaction',    label: '반응속도', emoji: '⚡' },
  { key: 'memdigit',    label: '숫자기억', emoji: '🔢' },
  { key: 'seqmem',      label: '순서기억', emoji: '🧩' },
  { key: 'colorvision', label: '색각',     emoji: '🎨' },
  { key: 'logic',       label: '논리력',   emoji: '📊' },
  { key: 'impulse',     label: '충동억제', emoji: '🚦' },
];
const RADAR_TIER_SCORE = { S: 100, A: 80, B: 60, C: 40, D: 20 };
const RADAR_MIN_DONE = 5;

function renderCognitiveRadarCard() {
  const axes = RADAR_AXES.map(a => {
    const list = JSON.parse(localStorage.getItem('ranking_' + a.key) || '[]');
    const m = list.length && list[0].result.match(/Tier ([SABCD])/);
    return { ...a, score: m ? RADAR_TIER_SCORE[m[1]] : 0, done: !!m };
  });
  const doneCount = axes.filter(a => a.done).length;

  if (doneCount < RADAR_MIN_DONE) {
    return `
      <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6 text-center">
        <h4 class="text-slate-300 font-bold mb-2">🕸️ 종합 인지 프로필</h4>
        <p class="text-slate-500 text-sm mb-3">인지테스트 7종(두뇌나이·반응속도·숫자기억·순서기억·색각·논리력·충동억제) 중 ${RADAR_MIN_DONE}개 이상 완료하면 나만의 인지 프로필이 열립니다.</p>
        <div class="text-violet-400 font-bold text-lg mb-1">${doneCount} / ${RADAR_AXES.length}</div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${doneCount/RADAR_AXES.length*100}%"></div></div>
      </div>`;
  }

  const n = axes.length;
  const cx = 190, cy = 190, R = 90;
  const angle = i => -Math.PI / 2 + i * (2 * Math.PI / n);
  const pointAt = (i, ratio) => {
    const a = angle(i);
    return [cx + R * ratio * Math.cos(a), cy + R * ratio * Math.sin(a)];
  };

  const gridPolygons = [0.25, 0.5, 0.75, 1].map(ratio => {
    const pts = axes.map((_, i) => pointAt(i, ratio).join(',')).join(' ');
    return `<polygon points="${pts}" fill="none" class="stroke-slate-600" stroke-width="1"/>`;
  }).join('');

  const axisLines = axes.map((_, i) => {
    const [x, y] = pointAt(i, 1);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="stroke-slate-600" stroke-width="1"/>`;
  }).join('');

  const dataPoints = axes.map((a, i) => pointAt(i, a.score / 100).join(',')).join(' ');

  const labels = axes.map((a, i) => {
    const [x, y] = pointAt(i, 1.25);
    let anchor = 'middle';
    if (x < cx - 10) anchor = 'end';
    else if (x > cx + 10) anchor = 'start';
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" class="fill-slate-300" font-size="12">${a.emoji} ${a.label}</text>`;
  }).join('');

  return `
    <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
      <h4 class="text-slate-300 font-bold mb-3">🕸️ 종합 인지 프로필</h4>
      <div class="flex justify-center">
        <svg viewBox="0 0 380 380" class="w-full max-w-xs">
          ${gridPolygons}
          ${axisLines}
          <polygon points="${dataPoints}" class="fill-violet-500/25 stroke-violet-500" stroke-width="2"/>
          ${labels}
        </svg>
      </div>
      <p class="text-slate-500 text-xs text-center mt-2">각 축은 최근 기록 기준 (S=100 · A=80 · B=60 · C=40 · D=20)</p>
    </div>`;
}

/* ══════════════════════════════════════════════════
   🏡 마이홈 대시보드 (v0.0.10~ 홈 섹션에 통합)
══════════════════════════════════════════════════ */
function renderHomeMypage() {
  const container = document.getElementById('home-mypage-container');
  if (!container) return;

  const nickname = getNickname();
  const streak = updateVisitStreak();
  const sections = ['mbti', 'dream', 'fortune', 'brain', 'adhd', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus', 'insa', 'proverb', 'pricequiz'];
  const sectionLabels = { mbti: '성격 파탄(MBTI)', dream: '꿈 해몽', fortune: '오늘의 운세', brain: '두뇌 나이', adhd: '프로 미루러', reaction: '반응속도', memdigit: '숫자 기억력', seqmem: '순서 기억력', colorvision: '색각 테스트', logic: '논리력', impulse: '충동억제', shortfocus: '숏폼 집중력', insa: '인싸력', proverb: '속담 완성', pricequiz: '그 시절 물가' };
  const doneCount = sections.filter(isDone).length;
  const { level, xpInLevel } = getLevelInfo();
  const earnedBadges = getEarnedBadges();

  // 최근 테스트 기록 모아보기 (섹션별 가장 최근 1건씩)
  const historyItems = [];
  ['mbti', 'fortune', 'brain', 'adhd', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus', 'insa', 'proverb', 'pricequiz'].forEach(sec => {
    const list = JSON.parse(localStorage.getItem('ranking_' + sec) || '[]');
    if (list.length) historyItems.push({ section: sec, ...list[0] });
  });

  container.innerHTML = `
    <div class="bg-gradient-to-br from-indigo-900/60 to-indigo-950/40 border border-indigo-700/40 rounded-2xl p-6 mb-6">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-black text-white shrink-0">
          ${nickname ? nickname.charAt(0) : '?'}
        </div>
        <div class="flex-1">
          <input id="home-nickname-input" type="text" maxlength="12" value="${nickname}" placeholder="닉네임을 입력하세요"
            class="bg-transparent border-b border-slate-600 text-slate-100 font-bold text-lg focus:outline-none focus:border-indigo-400 w-full py-1"/>
        </div>
        <button onclick="homeSaveNickname()" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition">저장</button>
      </div>
      <div class="flex items-center gap-2 text-amber-300 text-sm font-semibold mb-3">🔥 ${streak}일 연속 방문 중</div>

      <div class="flex items-center justify-between text-xs text-indigo-200 mb-1">
        <span class="font-bold">⭐ Lv.${level}</span>
        <span>${xpInLevel} / ${XP_PER_LEVEL} XP</span>
      </div>
      <div class="bg-slate-700/60 rounded-full h-2 overflow-hidden mb-3">
        <div class="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" style="width:${xpInLevel}%"></div>
      </div>

      ${earnedBadges.length ? `
        <div class="flex flex-wrap gap-2">
          ${earnedBadges.map(b => `
            <span class="bg-indigo-800/50 border border-indigo-600 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full">${b.emoji} ${b.label}</span>`).join('')}
        </div>` : `
        <p class="text-slate-500 text-xs">테스트를 완주하면 칭호를 얻을 수 있어요!</p>`}
    </div>

    <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-slate-300 font-bold">📋 테스트 완주 현황</h4>
        <span class="text-violet-400 font-bold text-sm">${doneCount} / ${sections.length}</span>
      </div>
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${doneCount/sections.length*100}%"></div></div>
      <div class="flex flex-wrap gap-2 mt-3">
        ${sections.map(s => `
          <span onclick="App.navigate('${s}')" class="cursor-pointer text-xs px-3 py-1.5 rounded-full transition ${isDone(s) ? 'bg-emerald-700/40 text-emerald-300 border border-emerald-600' : 'bg-slate-700 text-slate-500 border border-slate-600 hover:border-slate-500'}">
            ${isDone(s) ? '✅' : '⬜'} ${sectionLabels[s]}
          </span>`).join('')}
      </div>
    </div>

    ${renderCognitiveRadarCard()}

    <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <h4 class="text-slate-300 font-bold mb-3">🕓 최근 테스트 기록</h4>
      ${historyItems.length === 0 ? `
        <p class="text-slate-500 text-sm text-center py-4">아직 완료한 테스트가 없어요. 테스트를 해보세요!</p>` : `
        <div class="space-y-2">
          ${historyItems.map(h => `
            <div class="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2 gap-2">
              <span class="text-slate-100 text-sm font-semibold shrink-0">${sectionLabels[h.section]}</span>
              <span class="text-violet-400 text-sm font-bold flex-1 text-right truncate">${h.result}</span>
              <span class="text-slate-500 text-xs shrink-0">${h.time}</span>
            </div>`).join('')}
        </div>`}
    </div>`;
}

function homeSaveNickname() {
  const input = document.getElementById('home-nickname-input');
  if (!input) return;
  setNickname(input.value.trim());
  showToast('닉네임이 저장되었습니다! 👋');
  renderHomeMypage();
}

/* ══════════════════════════════════════════════════
   🎱 로또 번호 조합기 섹션
══════════════════════════════════════════════════ */
function lottoPickSet(seedNums) {
  const nums = new Set(seedNums || []);
  while (nums.size < 6) nums.add(Math.floor(Math.random() * 45) + 1);
  return Array.from(nums).sort((a, b) => a - b);
}

function lottoRunRandom() {
  bumpEngagement('site-lotto-plays');
  const games = [];
  for (let i = 0; i < 5; i++) games.push(lottoPickSet());
  lottoRenderGames(games, '완전 랜덤 조합', { rerun: 'lottoRunRandom()' });
}

function lottoRunCustom() {
  const input = document.getElementById('lotto-custom-input');
  if (!input) return;
  const nums = input.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => n >= 1 && n <= 45);
  const uniqueNums = [...new Set(nums)];
  if (uniqueNums.length < 1 || uniqueNums.length > 5) {
    showToast('1~5개의 숫자(1~45)를 콤마로 구분해 입력해주세요!');
    return;
  }
  bumpEngagement('site-lotto-plays');
  const games = [];
  for (let i = 0; i < 5; i++) games.push(lottoPickSet(uniqueNums));
  lottoRenderGames(games, `직접 지정 (${uniqueNums.join(', ')} 포함)`, { rerun: 'lottoRunCustom()', highlight: uniqueNums });
}

/* 오늘의 운세·꿈 행운숫자 연동 — 어느 숫자가 어디서 왔는지 출처별로 구분해 명확히 표기 (v0.1.3~) */
function lottoRunFortunePick() {
  bumpEngagement('site-lotto-plays');
  const fortuneNum = localStorage.getItem('last_fortune_luckynum') || '';
  const dreamNum = localStorage.getItem('last_dream_luckynum') || '';
  const fortuneNums = (fortuneNum.match(/\d+/g) || []).map(n => parseInt(n, 10)).filter(v => v >= 1 && v <= 45);
  const dreamNums = (dreamNum.match(/\d+/g) || []).map(n => parseInt(n, 10)).filter(v => v >= 1 && v <= 45);
  const pool = [...new Set([...fortuneNums, ...dreamNums])];

  if (pool.length === 0) {
    showToast('먼저 오늘의 운세나 꿈 해몽을 확인해보세요! 지금은 랜덤으로 대체할게요.');
  }
  const games = [];
  for (let i = 0; i < 5; i++) games.push(lottoPickSet(pool.slice(0, 5)));

  const sourceRows = [];
  if (fortuneNums.length) sourceRows.push(`<div class="flex items-center gap-1.5 flex-wrap"><span class="text-amber-300/80 text-xs w-24 shrink-0">🔮 오늘의 운세</span>${fortuneNums.map(n => `<span class="w-7 h-7 flex items-center justify-center rounded-full ${lottoBallClass(n)} text-xs font-bold ring-2 ring-amber-300">${n}</span>`).join('')}</div>`);
  if (dreamNums.length) sourceRows.push(`<div class="flex items-center gap-1.5 flex-wrap"><span class="text-amber-300/80 text-xs w-24 shrink-0">🌙 꿈 해몽</span>${dreamNums.map(n => `<span class="w-7 h-7 flex items-center justify-center rounded-full ${lottoBallClass(n)} text-xs font-bold ring-2 ring-amber-300">${n}</span>`).join('')}</div>`);
  const noteHTML = sourceRows.length ? `
    <div class="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 mb-3">
      <p class="text-amber-300 text-xs font-bold mb-2">✨ 이번 조합에 반영된 행운숫자 (금색 테두리 공)</p>
      <div class="space-y-1.5">${sourceRows.join('')}</div>
    </div>` : '';

  lottoRenderGames(games, pool.length ? '오늘의 운세·꿈 행운숫자 연동' : '오늘의 운세·꿈 미확인 (랜덤 대체)', {
    rerun: 'lottoRunFortunePick()', highlight: pool, noteHTML,
  });
}

/* 통계 데이터 조회: ① 자체 프록시(/api/lotto-stats, 엣지 캐싱) → ② GitHub Pages 미러 직접 조회(CORS 개방).
   과거 당첨번호는 불변 데이터라 미러만으로도 충분히 정확함 (매주 토요일 추첨 직후 자동 갱신) */
async function lottoFetchStats() {
  try {
    const res = await fetch('/api/lotto-stats');
    if (res.ok) {
      const d = await res.json();
      if (d && d.frequency) return d;
    }
  } catch (e) { /* 프록시 실패 시 미러 직접 조회로 계속 */ }

  const res = await fetch('https://smok95.github.io/lotto/results/all.json');
  if (!res.ok) throw new Error('mirror fetch failed');
  const all = await res.json();
  if (!Array.isArray(all) || all.length === 0) throw new Error('mirror data empty');
  const recent = all.slice(-30);
  const frequency = {};
  for (let i = 1; i <= 45; i++) frequency[i] = 0;
  recent.forEach(d => (d.numbers || []).forEach(n => { frequency[n]++; }));
  const last = recent[recent.length - 1];
  const recentRounds = recent.slice(-5).reverse().map(d => ({
    round: d.draw_no,
    date: typeof d.date === 'string' ? d.date.slice(0, 10) : '',
    numbers: d.numbers,
    bonus: d.bonus_no,
  }));
  return {
    frequency,
    roundsUsed: recent.length,
    latestRound: last.draw_no,
    latestDrawDate: typeof last.date === 'string' ? last.date.slice(0, 10) : '',
    latestNumbers: last.numbers,
    latestBonus: last.bonus_no,
    recentRounds,
    source: 'mirror-direct',
  };
}

async function lottoRunStats() {
  bumpEngagement('site-lotto-plays');
  const container = document.getElementById('lotto-result');
  if (container) container.innerHTML = '<p class="text-slate-500 text-sm text-center py-4">📊 실제 당첨 통계 불러오는 중...</p>';
  try {
    const data = await lottoFetchStats();
    const games = [];
    for (let i = 0; i < 5; i++) games.push(lottoWeightedPick(data.frequency));
    lottoRenderGames(games, `실제 당첨번호 통계 기반 (최근 ${data.roundsUsed}회, ${data.latestRound}회차까지)`, { statsPanel: data });
  } catch (e) {
    showToast('통계 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    lottoRunRandom();
  }
}

/* 실제 동행복권 공식 볼 색상 규칙(v0.0.52~) — 1~10 노랑/11~20 파랑/21~30 빨강/31~40 검정(회색)/41~45 초록.
   번호 구간에 따라 확 다른 색으로 갈리게 해서 조합 결과가 전부 같은 색 공으로만 보이던 문제 해결 */
function lottoBallClass(n) {
  if (n <= 10) return 'bg-yellow-400 text-slate-900';
  if (n <= 20) return 'bg-blue-500 text-white';
  if (n <= 30) return 'bg-red-500 text-white';
  if (n <= 40) return 'bg-slate-700 text-white';
  return 'bg-emerald-500 text-white';
}

/* 과거 데이터 확인 패널: 최근 5회차 당첨번호(v0.1.3~ 1회차→5회차로 확대) + 최근 30회 최다/최소 출현 번호 */
function lottoStatsPanelHTML(data) {
  const entries = [];
  for (let n = 1; n <= 45; n++) entries.push([n, data.frequency[n] || 0]);
  const hot = [...entries].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 7);
  const cold = [...entries].sort((a, b) => a[1] - b[1] || a[0] - b[0]).slice(0, 7);
  const chip = (n, cnt, cls) => `<span class="px-2.5 py-1.5 rounded-lg text-sm font-bold ${cls}">${n} <span class="opacity-60 font-normal text-xs">${cnt}회</span></span>`;
  const ball = (n, extraCls) => `<span class="w-9 h-9 flex items-center justify-center rounded-full ${lottoBallClass(n)} text-sm font-bold${extraCls || ''}">${n}</span>`;
  const rounds = Array.isArray(data.recentRounds) && data.recentRounds.length
    ? data.recentRounds
    : [{ round: data.latestRound, date: data.latestDrawDate, numbers: data.latestNumbers, bonus: data.latestBonus }];
  const roundCards = rounds.map(r => `
    <div class="bg-slate-900/40 border border-slate-700/60 rounded-xl p-3">
      <p class="text-slate-400 text-xs font-bold mb-2">${r.round}회차 <span class="text-slate-600 font-normal">(${r.date})</span></p>
      <div class="flex items-center gap-1.5 flex-wrap">
        ${(r.numbers || []).map(n => ball(n)).join('')}
        ${r.bonus ? `<span class="text-slate-500 text-xs mx-0.5">+</span>${ball(r.bonus, ' ring-2 ring-amber-400')}` : ''}
      </div>
    </div>`).join('');

  return `
    <div class="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-4">
      <p class="text-slate-300 text-sm font-bold mb-3">📋 최신 당첨 결과 (최근 ${rounds.length}회)</p>
      <div class="space-y-2 mb-4">${roundCards}</div>
      <p class="text-slate-400 text-xs mb-1.5">🔥 최근 ${data.roundsUsed}회 최다 출현</p>
      <div class="flex gap-1.5 flex-wrap mb-3">${hot.map(([n, c]) => chip(n, c, 'bg-rose-900/40 border border-rose-800/40 text-rose-300')).join('')}</div>
      <p class="text-slate-400 text-xs mb-1.5">🧊 최근 ${data.roundsUsed}회 뜸한 번호</p>
      <div class="flex gap-1.5 flex-wrap">${cold.map(([n, c]) => chip(n, c, 'bg-blue-900/40 border border-blue-700/40 text-blue-300')).join('')}</div>
    </div>`;
}

function lottoWeightedPick(frequency) {
  const pool = [];
  for (let n = 1; n <= 45; n++) {
    const weight = (frequency[n] || 0) + 1; // 0회 번호도 최소 확률 보장
    for (let w = 0; w < weight; w++) pool.push(n);
  }
  const picked = new Set();
  while (picked.size < 6) picked.add(pool[Math.floor(Math.random() * pool.length)]);
  return Array.from(picked).sort((a, b) => a - b);
}

/* 조합 결과 렌더링 — 4개 모드(완전랜덤/직접지정/운세연동/통계기반) 공용.
   opts: { rerun: '함수호출()' 문자열(재조합 버튼, 통계기반은 제외) | highlight: 강조할 번호 배열(테두리 표시) |
          noteHTML: 결과 위에 덧붙일 안내 패널 | statsPanel: 통계기반 모드에서만 전달되는 원본 데이터 } */
const lottoResultState = { games: [], modeLabel: '', canvas: null, shareFile: null };

function lottoRenderGames(games, modeLabel, opts) {
  opts = opts || {};
  const container = document.getElementById('lotto-result');
  if (!container) return;

  lottoResultState.games = games;
  lottoResultState.modeLabel = modeLabel;
  lottoResultState.canvas = null;
  lottoResultState.shareFile = null;

  const highlightSet = new Set(opts.highlight || []);
  const ballHTML = (n) => `<span class="w-11 h-11 flex items-center justify-center rounded-full ${lottoBallClass(n)} text-base font-black${highlightSet.has(n) ? ' ring-2 ring-amber-300' : ''}">${n}</span>`;

  /* v0.1.3~: 실제 뽑은 번호를 drawn 파라미터로 랜딩 페이지까지 전달 —
     링크를 연 친구가 프리뷰 화면에서 예시 그림이 아닌 진짜 번호(공 UI)를 보게 됨 */
  const drawn = games.map(g => g.join('.')).join('-');
  const shareUrl = buildShareLandingUrl('lotto', { drawn });
  const preview = games[0].join('-');
  const kakaoTitle = '🍀 행운의 로또 번호를 뽑았어요!';
  const kakaoDesc = `${modeLabel} · 예: ${preview}`;
  const shareText = `🍀 ${modeLabel}으로 로또 번호 5게임을 뽑았어요! (예: ${preview}) 과몰입 연구소에서 나도 뽑아보기 👉 ${shareUrl}`;

  container.innerHTML = `
    ${opts.statsPanel ? lottoStatsPanelHTML(opts.statsPanel) : ''}
    ${opts.noteHTML || ''}
    <p class="text-slate-500 text-sm mb-3">${modeLabel} · 5게임</p>
    <div class="space-y-2 mb-4">
      ${games.map((g, i) => `
        <div class="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-3">
          <span class="text-slate-500 text-xs w-12 shrink-0">${i + 1}게임</span>
          <div class="flex gap-2 flex-wrap">
            ${g.map(ballHTML).join('')}
          </div>
        </div>`).join('')}
    </div>
    <div class="space-y-2.5">
      <button onclick="copyToClipboard('${games.map(g => g.join('-')).join(' / ')}')" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-bold py-2.5 rounded-xl transition">🔗 번호 복사하기</button>
      <button onclick="lottoShareResultImage()" class="w-full bg-violet-700 hover:bg-violet-600 text-white text-sm font-bold py-2.5 rounded-xl transition">🖼️ 결과 이미지 공유</button>
      ${shareKakaoButtonHTML(`${location.origin}/share-cards/lotto-share.jpg`, kakaoTitle, kakaoDesc, shareUrl)}
      ${shareIconRowHTML(shareText, shareUrl)}
      ${opts.rerun ? `<button onclick="${opts.rerun}" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-bold py-2.5 rounded-xl transition">🔄 다시 뽑기</button>` : ''}
    </div>`;

  lottoPrepareShareImage(games, modeLabel, highlightSet);
}

/* 조합 결과를 사진 파일로 공유하기 위한 Canvas 카드 렌더링(오락용 카드, 영수증 형태 아님) */
function lottoBuildResultCanvas(games, modeLabel, highlightSet) {
  const colorFor = (n) => (n <= 10 ? '#fbc400' : n <= 20 ? '#69c8f2' : n <= 30 ? '#ff7272' : n <= 40 ? '#9aa2b1' : '#b0d840');
  const isDarkText = (n) => n <= 10;

  const W = 420, ROWH = 62, H = 150 + games.length * ROWH, SCALE = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE; canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1e1b4b'); bg.addColorStop(1, '#0f0a20');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 26px sans-serif';
  ctx.fillText('🍀 로또 번호 조합 결과', W / 2, 44);
  ctx.fillStyle = 'rgba(241,245,249,0.65)';
  ctx.font = '14px sans-serif';
  ctx.fillText(modeLabel, W / 2, 66);

  let y = 104;
  games.forEach((g, i) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(241,245,249,0.5)';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${i + 1}게임`, 24, y + 5);

    let bx = 84;
    const r = 17;
    g.forEach(n => {
      ctx.beginPath();
      ctx.arc(bx + r, y, r, 0, Math.PI * 2);
      ctx.fillStyle = colorFor(n);
      ctx.fill();
      if (highlightSet && highlightSet.has(n)) {
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#fcd34d'; ctx.stroke();
      }
      ctx.fillStyle = isDarkText(n) ? '#1e293b' : '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(n), bx + r, y + 5);
      ctx.textAlign = 'left';
      bx += r * 2 + 8;
    });
    y += ROWH;
  });

  ctx.textAlign = 'center';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(241,245,249,0.4)';
  ctx.fillText('🧪 과몰입 연구소 · 오락 목적이며 실제 당첨을 보장하지 않습니다', W / 2, H - 20);

  return canvas;
}

/* navigator.share의 user-activation 요구(특히 iOS Safari)를 만족시키려면 클릭 시점에 비동기 지연 없이
   바로 File을 넘겨야 함 — 결과가 렌더링되는 시점에 미리 Blob을 만들어 캐싱해두고, 버튼 클릭은 그걸 그대로 사용 */
function lottoPrepareShareImage(games, modeLabel, highlightSet) {
  const canvas = lottoBuildResultCanvas(games, modeLabel, highlightSet);
  lottoResultState.canvas = canvas;
  canvas.toBlob((blob) => {
    if (!blob) return;
    lottoResultState.shareFile = new File([blob], 'lotto-numbers.jpg', { type: 'image/jpeg' });
  }, 'image/jpeg', 0.92);
}

function lottoShareResultImage() {
  const s = lottoResultState;
  const doShare = (file) => {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: '로또 번호 조합 결과', text: '🍀 로또 번호를 조합해봤어요! — 과몰입 연구소' }).catch(() => {});
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = 'lotto-numbers.jpg';
      document.body.appendChild(a); a.click(); a.remove();
      showToast('이 브라우저는 이미지 공유를 지원하지 않아 저장으로 대신할게요');
    }
  };
  if (s.shareFile) { doShare(s.shareFile); return; }
  if (!s.canvas) return;
  s.canvas.toBlob((blob) => {
    if (!blob) return;
    doShare(new File([blob], 'lotto-numbers.jpg', { type: 'image/jpeg' }));
  }, 'image/jpeg', 0.92);
}

/* ══════════════════════════════════════════════════
   🔗 공유 링크 프리뷰 화면 (v0.1.1~)
   - 15개 섹션 × 3개 공유 타입(result/challenge/verdict) 전부가 공통으로 거쳐가는 화면.
     functions/share/[section].js가 #shared-preview?section=...&title=...&desc=...&image=...&cta=...(&p=도전장 페이로드)
     형태로 리다이렉트하며, 예전처럼 곧바로 테스트 화면으로 보내는 대신 카카오 카드와 동일한
     이미지+제목+설명을 먼저 보여준 뒤 버튼을 눌러야 실제 테스트로 넘어가게 함.
   - 섹션마다 따로 화면을 만들지 않고 이 화면 하나를 재사용 — 도전장(challenge)일 때만 p 페이로드를
     App.pendingChallenge로 복원해 기존 대결 비교 로직(renderChallengeBanner 등)이 그대로 이어짐.
══════════════════════════════════════════════════ */
/* drawn 문자열("1.5.12.23.34.45-2.8...")을 게임 배열로 파싱 — 프리뷰 화면/친구 배너 공용 */
function lottoParseDrawnGames(raw) {
  if (!raw) return [];
  return raw.split('-').slice(0, 5).map(g =>
    g.split('.').map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 45).slice(0, 6)
  ).filter(g => g.length === 6);
}

/* 프리뷰 화면용: 공유자가 실제로 뽑은 번호를 공 UI로 렌더링(범용 홍보 이미지 대신 진짜 번호를 보여줌) */
function sharedPreviewLottoBallsHTML(section, raw) {
  const games = lottoParseDrawnGames(raw);
  if (!games.length) return '';
  const label = (i) => section === 'lottodraw' ? LOTTODRAW_LETTERS[i] : `${i + 1}게임`;
  return `
    <div class="bg-slate-800/60 border border-amber-400/40 rounded-2xl p-4 mb-5 text-left">
      <p class="text-amber-300 text-sm font-bold mb-3 text-center">🍀 친구가 뽑은 행운의 번호</p>
      <div class="space-y-2">
        ${games.map((g, i) => `
          <div class="flex items-center gap-2">
            <span class="text-amber-300/70 text-xs font-black w-12 shrink-0">${label(i)}</span>
            <div class="flex gap-1.5 flex-wrap">
              ${g.map(n => `<span class="w-9 h-9 flex items-center justify-center rounded-full ${lottoBallClass(n)} text-sm font-bold">${n}</span>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

/* 프리뷰 화면용: 꿈해몽 공유는 범용 이미지 대신 공유자가 실제로 본 해몽 카드 전체(모달과 동일한 레이아웃)를
   그대로 재현 — 로또의 "실제 뽑은 번호 표시"와 동일한 접근(v0.1.5~). AI 생성 해몽도 같은 extra 구조 재사용 */
function sharedPreviewDreamCardHTML(dream) {
  if (!dream) return '';
  return `
    <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6 text-left shadow-xl">
      <h2 class="text-slate-100 font-bold text-xl mb-3">${escapeHtml(dream.title)}</h2>
      ${dream.ai ? `<div class="inline-block bg-violet-900/40 border border-violet-600/40 text-violet-300 text-xs font-semibold px-2 py-1 rounded-full mb-3">🤖 AI 생성 해몽</div>` : ''}
      <div class="bg-blue-900/30 border border-blue-700/40 rounded-xl p-3 mb-4">
        <span class="text-blue-300 font-semibold">✦ ${escapeHtml(dream.summary)}</span>
      </div>
      <p class="text-slate-300 leading-relaxed mb-5 text-sm">${escapeHtml(dream.detail)}</p>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-slate-700 rounded-lg p-3 text-center">
          <div class="text-xs text-slate-400 mb-1">행운의 색</div>
          <div class="text-slate-100 font-semibold text-sm">${escapeHtml(dream.lucky)}</div>
        </div>
        <div class="bg-slate-700 rounded-lg p-3 text-center">
          <div class="text-xs text-slate-400 mb-1">행운의 숫자</div>
          <div class="text-slate-100 font-semibold text-sm">${escapeHtml(dream.luckyNum)}</div>
        </div>
      </div>
      <div class="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-3">
        <div class="text-indigo-300 text-xs font-semibold mb-1">오늘의 행동</div>
        <p class="text-indigo-200 text-sm">${escapeHtml(dream.action)}</p>
      </div>
    </div>`;
}

function initSharedPreview() {
  const container = document.getElementById('shared-preview-container');
  if (!container) return;

  /* location.hash는 App.navigate()가 이미 '#shared-preview'로 덮어써 쿼리스트링이 사라진 상태라
     DOMContentLoaded 초기 라우팅 단계에서 미리 떼어둔 App._sharedPreviewParams를 사용한다 */
  const params = App._sharedPreviewParams || new URLSearchParams();
  const next = { section: params.get('section') || 'home', p: params.get('p') || '', extra: params.get('extra') || '' };
  App._sharedPreviewNext = next;

  const title = params.get('title') || '과몰입 연구소';
  const desc = params.get('desc') || '';
  const image = params.get('image') || '';
  const cta = params.get('cta') || '나도 해보기';

  /* 로또 공유(drawn 페이로드)는 범용 홍보 이미지 대신 실제 뽑은 번호를 공 UI로 보여줌 (v0.1.3~) */
  const lottoBalls = (next.section === 'lotto' || next.section === 'lottodraw') ? sharedPreviewLottoBallsHTML(next.section, next.extra) : '';

  /* 꿈해몽 공유는 범용 이미지 대신 실제 해몽 결과 카드를 재현 (v0.1.5~) */
  let dreamCard = '';
  if (next.section === 'dream' && next.extra) {
    try { dreamCard = sharedPreviewDreamCardHTML(JSON.parse(next.extra)); } catch (e) { dreamCard = ''; }
  }

  container.innerHTML = `
    <div class="max-w-md mx-auto pt-8 px-4 text-center">
      ${lottoBalls || dreamCard || (image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" class="w-full rounded-2xl shadow-2xl mb-5 border border-slate-700" />` : '')}
      ${dreamCard ? '' : `<h2 class="text-slate-100 font-bold text-xl mb-2">${escapeHtml(title)}</h2><p class="text-slate-400 text-sm mb-6">${escapeHtml(desc)}</p>`}
      <button onclick="sharedPreviewProceed()" class="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition text-lg">${escapeHtml(cta)}</button>
    </div>`;
}

function sharedPreviewProceed() {
  const next = App._sharedPreviewNext;
  if (!next) { App.navigate('home'); return; }
  if (next.p) {
    try { App.pendingChallenge = { section: next.section, data: JSON.parse(next.p) }; } catch (e) { App.pendingChallenge = null; }
  }
  /* 로또 공유 링크(drawn=...)는 vs 페이로드가 아니라 extra로 전달됨 — 각 섹션의 친구 배너용 상태에 복원 */
  if (next.section === 'lottodraw' && next.extra) {
    App._lottodrawSharedDrawn = next.extra;
  }
  if (next.section === 'lotto' && next.extra) {
    App._lottoSharedDrawn = next.extra;
  }
  App.navigate(next.section);
}

/* 공유 링크로 진입한 경우 친구가 뽑은 번호 배너 (조합기용, v0.1.3~) */
function lottoSharedBannerHTML() {
  const games = lottoParseDrawnGames(App._lottoSharedDrawn || '');
  if (!games.length) return '';
  return `
    <div class="bg-amber-900/30 border border-amber-400/40 rounded-xl p-4 mb-5">
      <p class="text-amber-300 text-sm font-bold mb-2">🎁 친구가 조합기로 뽑은 번호예요</p>
      <div class="space-y-1.5">
        ${games.map((g, i) => `
          <div class="flex items-center gap-1.5">
            <span class="text-amber-300/70 text-xs font-black w-12 shrink-0">${i + 1}게임</span>
            ${g.map(n => `<span class="w-7 h-7 flex items-center justify-center rounded-full ${lottoBallClass(n)} text-xs font-bold">${n}</span>`).join('')}
          </div>`).join('')}
      </div>
      <p class="text-amber-300/80 text-xs mt-2">아래 버튼으로 나도 직접 뽑아볼 수 있어요!</p>
    </div>`;
}

function initLotto() {
  const container = document.getElementById('lotto-container');
  if (!container) return;
  container.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-5">
        <h2 class="text-slate-100 font-black text-xl mb-1">🎱 로또 번호 조합기</h2>
        <p class="text-slate-500 text-sm mb-5">원하는 방식으로 번호를 뽑아보세요 (오락 목적)</p>
        ${lottoSharedBannerHTML()}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button onclick="lottoRunRandom()" class="bg-violet-700 hover:bg-violet-600 text-white font-bold py-3 rounded-xl transition">🎲 완전 랜덤</button>
          <button onclick="document.getElementById('lotto-custom-box').classList.toggle('hidden')" class="bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">✍️ 숫자 직접 지정</button>
          <button onclick="lottoRunFortunePick()" class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition">🔮 오늘의 운세·꿈 연동</button>
          <button onclick="lottoRunStats()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition">📊 실제 당첨 통계 기반</button>
          <button onclick="App.navigate('lottodraw')" class="sm:col-span-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-bold py-3 rounded-xl transition">🎰 직접 뽑기 게임 — 추첨기에서 내 손으로!</button>
        </div>
        <div id="lotto-custom-box" class="hidden mb-5">
          <p class="text-slate-400 text-xs mb-2">포함하고 싶은 숫자 1~5개를 콤마로 구분해 입력하세요 (1~45)</p>
          <div class="flex gap-2">
            <input id="lotto-custom-input" type="text" placeholder="예: 7, 21, 33"
              class="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition"/>
            <button onclick="lottoRunCustom()" class="bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition">생성</button>
          </div>
        </div>
        <div id="lotto-result"></div>
      </div>
      <p class="text-slate-600 text-xs text-center">⚠️ 본 서비스는 오락 목적이며 실제 당첨을 보장하지 않습니다.</p>
    </div>`;
}

/* ══════════════════════════════════════════════════
   🎰 로또 직접 뽑기 게임 (v0.1.2~)
   - 유리 구체(glassmorphism) 안에서 45개 공이 물리 시뮬레이션(중력/벽·공·패들 충돌)으로
     상시 튀어다니는 추첨기. 회전 패들이 실제로 공을 휘저음.
   - 듀얼 컨트롤: [공 1개 뽑기](손맛) / [6구 고속 추출](속도) 두 버튼.
   - 5게임(A~E) 시퀀스: 6개 뽑으면 1게임 기록 후 공 45개 재충전, E게임까지 반복.
   - 완료 시 추첨기는 페이드아웃하고 Canvas로 분홍 감열지풍 영수증 이미지를 렌더링,
     [이미지 저장 / 이미지 공유(navigator.share files) / 링크 복사(?drawn=...&ref=UUID)] 3종 CTA.
   - 물리 루프는 session 토큰 + currentSection 체크로 섹션 이탈 시 자동 정지.
══════════════════════════════════════════════════ */
const LOTTODRAW_LETTERS = ['A', 'B', 'C', 'D', 'E'];

const lottoDrawState = {
  session: 0,          // initLottodraw마다 증가 — 이전 rAF 루프/타이머 무효화 토큰
  balls: [], games: [], current: [],
  pending: 0,          // 배출 통로를 굴러가는 중(트레이 도착 전)인 공 개수 — 동시 배출 시 슬롯 예약용
  refilling: false, autoAll: false, fastTimer: null, finished: false,
  radius: 0, ballR: 0, rampLen: 0, windT: 0,
  sphereEl: null, machineEl: null, canvas: null,
};

/* 배출 레일 기울기(도) — 기계 외형과 공 굴림 경로 계산에 공용 */
const LOTTODRAW_RAMP_DEG = 16;

/* 실제 동행복권 볼 색상 계열의 [밝은색, 기본색, 어두운색] — radial-gradient 입체감용 */
function lottodrawBallColor(n) {
  if (n <= 10) return ['#ffdc60', '#fbc400', '#b28b00'];
  if (n <= 20) return ['#9fdcf8', '#69c8f2', '#3f9fd0'];
  if (n <= 30) return ['#ff9c9c', '#ff7272', '#d94f4f'];
  if (n <= 40) return ['#c4c9d4', '#9aa2b1', '#6b7280'];
  return ['#cbe873', '#b0d840', '#84ab24'];
}

function initLottodraw() {
  const container = document.getElementById('lottodraw-container');
  if (!container) return;
  bumpEngagement('site-lottodraw-plays');
  const s = lottoDrawState;
  s.session++;
  if (s.fastTimer) { clearInterval(s.fastTimer); s.fastTimer = null; }
  s.games = []; s.current = []; s.pending = 0;
  s.refilling = false; s.autoAll = false; s.finished = false; s.canvas = null;

  container.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 sm:p-6 mb-5">
        <h2 class="text-slate-100 font-black text-xl mb-1">🎰 로또 직접 뽑기</h2>
        <p class="text-slate-500 text-sm mb-4">추첨기에서 내 손으로 직접 공을 뽑아 5게임(A~E)을 완성해보세요</p>
        ${lottodrawSharedBannerHTML()}
        <div id="lottodraw-stage">
          <p id="lottodraw-progress" class="text-center text-slate-300 font-bold mb-3"></p>
          <div id="lottodraw-machine" class="lottodraw-machine">
            <div id="lottodraw-stand" class="lottodraw-stand"></div>
            <div id="lottodraw-ring" class="lottodraw-ring"></div>
            <div id="lottodraw-sphere" class="lottodraw-sphere">
              <div class="lottodraw-glare"></div>
              <div id="lottodraw-hole" class="lottodraw-hole"></div>
            </div>
            <div id="lottodraw-neck" class="lottodraw-neck"></div>
            <div id="lottodraw-ramp" class="lottodraw-ramp"></div>
          </div>
          <div id="lottodraw-tray" class="flex justify-center gap-2 mt-4"></div>
          <div class="grid grid-cols-2 gap-3 mt-4">
            <button onclick="lottodrawDrawOne()" class="bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition">⚪ 공 1개 뽑기</button>
            <button onclick="lottodrawDrawFast()" class="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition">⚡ 6개 한번에 뽑기</button>
            <button onclick="lottodrawDrawAll()" class="col-span-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold py-3 rounded-xl transition">🎯 5게임 한번에 다 뽑기</button>
          </div>
          <div id="lottodraw-board" class="mt-5 space-y-1.5"></div>
        </div>
        <div id="lottodraw-result" class="hidden"></div>
      </div>
      <p class="text-slate-600 text-xs text-center">⚠️ 본 게임은 오락 목적이며 실제 복권 구매·당첨과 무관합니다.</p>
    </div>`;

  s.sphereEl = document.getElementById('lottodraw-sphere');
  s.machineEl = document.getElementById('lottodraw-machine');

  /* 구체 크기는 화면 폭에 맞춰 결정 (모바일 대응, 이후 리사이즈는 무시) */
  const stage = document.getElementById('lottodraw-stage');
  const size = Math.max(220, Math.min(310, (stage.clientWidth || 320) - 16));
  s.radius = size / 2;
  s.ballR = Math.round(size * 0.041); // v0.1.5: 0.052→0.041 축소 — 뭉침 완화 + 팝콘식 끓음에 맞는 크기
  s.rampLen = Math.round(size * 0.46);
  const r = s.ballR;
  const rampRad = LOTTODRAW_RAMP_DEG * Math.PI / 180;
  /* 배출 경로 기준점: 목(튜브) 하단에서 공 중심이 지나는 높이 = size + 16 */
  const machineH = Math.round(size + 16 + s.rampLen * Math.sin(rampRad) + r * 2 + 14);

  s.machineEl.style.width = size + 'px';
  s.machineEl.style.height = machineH + 'px';
  s.sphereEl.style.width = size + 'px';
  s.sphereEl.style.height = size + 'px';

  /* 기계 외형(실제 추첨기 정면 사진 참고: 원형 프레임 + 하단 배출 튜브 + 경사 레일 + 받침대) */
  const ring = document.getElementById('lottodraw-ring');
  ring.style.width = (size + 14) + 'px';
  ring.style.height = (size + 14) + 'px';
  ring.style.left = '-7px';
  ring.style.top = '-7px';
  const hole = document.getElementById('lottodraw-hole');
  hole.style.width = (r * 2 + 12) + 'px';
  hole.style.height = (r + 6) + 'px';
  const neck = document.getElementById('lottodraw-neck');
  neck.style.width = (r * 2 + 10) + 'px';
  neck.style.height = '26px';
  neck.style.top = (size - 6) + 'px';
  const ramp = document.getElementById('lottodraw-ramp');
  ramp.style.width = (s.rampLen + 10) + 'px';
  ramp.style.top = (size + 16 + r - 2) + 'px';
  ramp.style.left = (size / 2 - 5) + 'px';
  ramp.style.transform = `rotate(${LOTTODRAW_RAMP_DEG}deg)`;
  const stand = document.getElementById('lottodraw-stand');
  stand.style.width = Math.round(size * 0.5) + 'px';
  stand.style.top = Math.round(size * 0.82) + 'px';
  stand.style.height = (machineH - Math.round(size * 0.82) - 2) + 'px';

  lottodrawResetBalls();
  lottodrawRenderTray();
  lottodrawRenderBoard();
  lottodrawUpdateProgress();

  const session = s.session;
  requestAnimationFrame(() => lottodrawTick(session));
}

/* 공유 링크(#lottodraw?drawn=...)로 들어온 경우 친구가 뽑은 번호 배너 표시 */
function lottodrawSharedBannerHTML() {
  const games = lottoParseDrawnGames(App._lottodrawSharedDrawn || '');
  if (!games.length) return '';
  return `
    <div class="bg-amber-900/30 border border-amber-400/40 rounded-xl p-4 mb-5">
      <p class="text-amber-300 text-sm font-bold mb-2">🎁 친구가 추첨기에서 직접 뽑은 번호예요</p>
      <div class="space-y-1.5">
        ${games.map((g, i) => `
          <div class="flex items-center gap-1.5">
            <span class="text-amber-300/70 text-xs font-black w-4">${LOTTODRAW_LETTERS[i]}</span>
            ${g.map(n => `<span class="w-7 h-7 flex items-center justify-center rounded-full ${lottoBallClass(n)} text-xs font-bold">${n}</span>`).join('')}
          </div>`).join('')}
      </div>
      <p class="text-amber-300/80 text-xs mt-2">아래 추첨기에서 나도 직접 뽑아볼 수 있어요!</p>
    </div>`;
}

function lottodrawResetBalls() {
  const s = lottoDrawState;
  s.balls.forEach(b => b.el.remove());
  s.balls = [];
  const R = s.radius, r = s.ballR;
  for (let n = 1; n <= 45; n++) {
    const el = document.createElement('div');
    el.className = 'lottodraw-ball';
    const [light, base, dark] = lottodrawBallColor(n);
    el.style.width = el.style.height = (r * 2) + 'px';
    el.style.fontSize = Math.max(9, Math.round(r * 0.85)) + 'px';
    el.style.background = `radial-gradient(circle at 32% 28%, #fff 0%, ${light} 22%, ${base} 62%, ${dark} 100%)`;
    el.textContent = n;
    s.sphereEl.appendChild(el);
    /* 원 안에 균등 랜덤 배치 (sqrt로 면적 균등 보정) */
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * (R - r - 2);
    s.balls.push({
      n, el,
      x: Math.cos(ang) * dist, y: Math.sin(ang) * dist,
      vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2,
    });
  }
}

/* 물리 루프 (좌표계: 구체 중심 원점) — v0.1.5~ "분수 순환(에어믹스)" 방식.
   실제 추첨기처럼 바닥 중앙 노즐에서 쉬지 않고 공기를 뿜어 공이 가운데로 솟구쳤다가
   양옆 벽을 타고 쏟아져 내려 다시 제트에 빨려 들어가는 순환 구조 — 팝콘처럼 끓으며
   바닥에 뭉치지 않는다. 노즐 위치는 비주기 이중 사인으로 좌우 스윙해 패턴 고착 방지.
   (v0.1.4의 부유식 옆바람+소용돌이는 공이 아래에 깔리고 예측이 쉬워 교체) */
function lottodrawTick(session) {
  const s = lottoDrawState;
  if (session !== s.session || App.state.currentSection !== 'lottodraw' || s.finished) return;
  const R = s.radius, r = s.ballR;

  s.windT += 0.016;
  /* 노즐 스윙: 제트 중심이 좌우로 천천히 흔들림 (주기가 다른 사인 2개 합성 → 비주기적) */
  const nozzleX = (Math.sin(s.windT * 0.9) * 0.35 + Math.sin(s.windT * 0.37 + 1.7) * 0.2) * R;
  const jetW = R * 0.5; // 제트 수평 폭 (가우시안 시그마)
  const maxV = r * 0.75; // 프레임당 최대 속도 (터널링 방지)

  for (const b of s.balls) {
    b.vy += 0.09; // 중력 — 제트 밖으로 밀려난 공이 벽을 타고 떨어지며 순환이 생기게 v0.1.4(0.05)보다 강화
    /* 연속 하단 제트: 아래쪽 2/3 구간에서 노즐 중심에 가까울수록 강한 상승기류.
       세기는 매 프레임 랜덤 요동(0.4~1.6배) — 꺼지지 않고 계속 분다 */
    if (b.y > -R * 0.35) {
      const dxn = b.x - nozzleX;
      const horiz = Math.exp(-(dxn * dxn) / (2 * jetW * jetW));
      const depth = (b.y + R * 0.35) / (R * 1.35); // 0(제트 상단)~1(바닥)
      const jet = 0.34 * (0.35 + 0.65 * depth) * horiz * (0.4 + Math.random() * 1.2);
      b.vy -= jet;
      b.vx += (Math.random() - 0.5) * jet * 0.9; // 제트 내 수평 난류
    }
    /* 상시 난기류 */
    b.vx += (Math.random() - 0.5) * 0.16;
    b.vy += (Math.random() - 0.5) * 0.16;
    /* 공기 저항 — 난기류로 에너지가 계속 쌓이지 않게 감쇠 (순환 유지 위해 v0.1.4보다 약하게) */
    b.vx *= 0.995; b.vy *= 0.995;
    b.x += b.vx; b.y += b.vy;

    /* 유리 구체 벽 반사 (반발계수 0.75) */
    const d = Math.hypot(b.x, b.y);
    if (d > R - r) {
      const nx = b.x / d, ny = b.y / d;
      const dot = b.vx * nx + b.vy * ny;
      if (dot > 0) { b.vx -= 1.75 * dot * nx; b.vy -= 1.75 * dot * ny; }
      b.x = nx * (R - r); b.y = ny * (R - r);
    }

    const sp = Math.hypot(b.vx, b.vy);
    if (sp > maxV) { b.vx *= maxV / sp; b.vy *= maxV / sp; }
  }

  /* 공끼리 충돌 — 등질량 탄성(법선 성분 교환) 근사 + 감쇠 */
  const balls = s.balls, minDist = r * 2;
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], c = balls[j];
      const dx = c.x - a.x, dy = c.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0.0001 && d2 < minDist * minDist) {
        const dd = Math.sqrt(d2), nx = dx / dd, ny = dy / dd;
        const overlap = (minDist - dd) / 2;
        a.x -= nx * overlap; a.y -= ny * overlap;
        c.x += nx * overlap; c.y += ny * overlap;
        const rel = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
        if (rel > 0) {
          const imp = rel * 0.85;
          a.vx -= imp * nx; a.vy -= imp * ny;
          c.vx += imp * nx; c.vy += imp * ny;
        }
      }
    }
  }

  for (const b of s.balls) {
    b.el.style.transform = `translate(${b.x + R - r}px, ${b.y + R - r}px)`;
  }
  requestAnimationFrame(() => lottodrawTick(session));
}

/* 공 1개를 뽑아 배출 통로(구체 하단 배출구 → 튜브 → 경사 레일)를 굴러 내려간 뒤 트레이 슬롯에 안착시키는 공용 함수.
   fast=true면 각 구간을 40% 단축(사용자 요청 "1.5배 빠르게"). 여러 공이 통로에 동시에 굴러갈 수 있어
   슬롯은 pending 카운터로 미리 예약해둔다 */
function lottodrawDrawBall(fast) {
  const s = lottoDrawState;
  if (s.finished || s.refilling || s.balls.length === 0) return;
  if (s.current.length + s.pending >= 6) return;
  const slotIdx = s.current.length + s.pending;
  s.pending++;
  playSound('tick');
  const idx = Math.floor(Math.random() * s.balls.length);
  const ball = s.balls.splice(idx, 1)[0]; // 물리 루프 대상에서 제외
  const session = s.session;
  lottodrawAnimateExit(ball, slotIdx, fast, () => {
    if (session !== s.session) return;
    s.current.push(ball.n);
    s.pending--;
    playSound('correct');
    lottodrawRenderTray(true);
    lottodrawUpdateProgress();
    if (s.current.length >= 6 && s.pending === 0) lottodrawCompleteGame();
  });
}

/* 배출 연출: 구체(overflow hidden) 밖으로 나와야 통로가 보이므로 공 엘리먼트를 기계 컨테이너로 옮겨 심고
   배출구 → 튜브 통과 → 레일 굴러내려감(회전) → 트레이 슬롯 안착 순으로 CSS transition을 체이닝 */
function lottodrawAnimateExit(ball, slotIdx, fast, done) {
  const s = lottoDrawState;
  const session = s.session;
  const k = fast ? 0.6 : 1;
  const machine = s.machineEl;
  const el = ball.el;
  const r = s.ballR, size = s.radius * 2;
  const rampRad = LOTTODRAW_RAMP_DEG * Math.PI / 180;
  machine.appendChild(el);
  el.classList.add('lottodraw-rolling');

  const setPos = (x, y, rot, ms, ease) => {
    el.style.transition = ms ? `transform ${ms}ms ${ease || 'linear'}` : 'none';
    el.style.transform = `translate(${x - r}px, ${y - r}px) rotate(${rot}deg)`;
  };
  const t = (fn, ms) => setTimeout(() => { if (session === s.session) fn(); else el.remove(); }, ms);

  /* 시작: 배출구(구체 하단 중앙) */
  setPos(size / 2, size - r - 4, 0, 0);
  /* 1) 튜브 통과 낙하 */
  t(() => setPos(size / 2, size + 16, 100, Math.round(200 * k), 'cubic-bezier(0.4,0,1,1)'), 20);
  /* 2) 경사 레일을 따라 굴러 내려감 */
  const rampEndX = size / 2 + s.rampLen * Math.cos(rampRad);
  const rampEndY = size + 16 + s.rampLen * Math.sin(rampRad);
  t(() => setPos(rampEndX, rampEndY, 460, Math.round(340 * k), 'cubic-bezier(0.3,0,0.8,1)'), 20 + Math.round(210 * k));
  /* 3) 레일 끝에서 트레이 슬롯으로 안착 */
  t(() => {
    const slot = document.querySelectorAll('#lottodraw-tray > span')[slotIdx];
    if (slot && machine.isConnected) {
      const mRect = machine.getBoundingClientRect();
      const sRect = slot.getBoundingClientRect();
      setPos(sRect.left - mRect.left + sRect.width / 2, sRect.top - mRect.top + sRect.height / 2, 720, Math.round(260 * k), 'cubic-bezier(0.2,0.6,0.3,1)');
    }
  }, 20 + Math.round(560 * k));
  /* 4) 마무리 — 트레이에 진짜 공을 그리고 연출용 엘리먼트 제거 */
  t(() => { el.remove(); done(); }, 20 + Math.round(840 * k));
}

/* [버튼 A] 공 1개 뽑기 (손맛용) */
function lottodrawDrawOne() {
  lottodrawDrawBall(false);
}

/* [버튼 B] 6개 한번에 뽑기 — 남은 슬롯이 찰 때까지 짧은 간격으로 연속 배출(통로에 여러 공이 줄지어 굴러감) */
function lottodrawDrawFast() {
  const s = lottoDrawState;
  if (s.finished || s.fastTimer || s.refilling) return;
  if (s.current.length + s.pending >= 6) return;
  lottodrawDrawBall(true);
  s.fastTimer = setInterval(() => {
    if (s.finished || s.refilling || s.current.length + s.pending >= 6) { clearInterval(s.fastTimer); s.fastTimer = null; return; }
    lottodrawDrawBall(true);
  }, 280);
}

/* [버튼 C] 5게임 한번에 다 뽑기 — 게임이 끝날 때마다 자동으로 재충전 후 다음 게임을 이어서 뽑아 영수증까지 직행 */
function lottodrawDrawAll() {
  const s = lottoDrawState;
  if (s.finished || s.autoAll) return;
  s.autoAll = true;
  lottodrawDrawFast();
}

function lottodrawCompleteGame() {
  const s = lottoDrawState;
  if (s.fastTimer) { clearInterval(s.fastTimer); s.fastTimer = null; }
  s.games.push([...s.current].sort((a, b) => a - b));
  lottodrawRenderBoard();

  if (s.games.length >= LOTTODRAW_LETTERS.length) {
    s.finished = true; // 물리 루프도 이 플래그로 정지
    playSound('tierS');
    lottodrawUpdateProgress();
    const stage = document.getElementById('lottodraw-stage');
    if (stage) stage.classList.add('lottodraw-fadeout');
    setTimeout(() => lottodrawShowReceipt(), 550);
    return;
  }

  showToast(`${LOTTODRAW_LETTERS[s.games.length - 1]}게임 완료! 공을 다시 채우고 ${LOTTODRAW_LETTERS[s.games.length]}게임을 시작해요`);
  s.refilling = true; // 재충전 연출 동안 추첨 잠금
  const session = s.session;
  setTimeout(() => {
    if (session !== s.session || App.state.currentSection !== 'lottodraw') return;
    s.current = [];
    lottodrawResetBalls();
    lottodrawRenderTray();
    lottodrawRenderBoard();
    lottodrawUpdateProgress();
    s.refilling = false;
    /* '5게임 한번에 다 뽑기' 모드면 다음 게임을 자동으로 이어서 뽑음 */
    if (s.autoAll) lottodrawDrawFast();
  }, s.autoAll ? 350 : 700);
}

function lottodrawRenderTray(popLast) {
  const s = lottoDrawState;
  const tray = document.getElementById('lottodraw-tray');
  if (!tray) return;
  tray.innerHTML = Array.from({ length: 6 }, (_, i) => {
    const n = s.current[i];
    if (n === undefined) return `<span class="w-12 h-12 rounded-full border-2 border-dashed border-slate-600"></span>`;
    const pop = popLast && i === s.current.length - 1 ? ' lottodraw-pop' : '';
    return `<span class="w-12 h-12 flex items-center justify-center rounded-full ${lottoBallClass(n)} text-lg font-black shadow-lg${pop}">${n}</span>`;
  }).join('');
}

function lottodrawRenderBoard() {
  const s = lottoDrawState;
  const board = document.getElementById('lottodraw-board');
  if (!board) return;
  board.innerHTML = LOTTODRAW_LETTERS.map((L, i) => {
    const done = s.games[i];
    const isCurrent = i === s.games.length && !s.finished;
    return `
      <div class="flex items-center gap-2 rounded-xl px-3 py-2 border ${done ? 'bg-slate-800 border-slate-700' : isCurrent ? 'bg-slate-800/60 border-violet-500/50' : 'bg-slate-800/30 border-slate-700/50'}">
        <span class="font-black text-sm w-5 ${done ? 'text-emerald-400' : isCurrent ? 'text-violet-400' : 'text-slate-600'}">${L}</span>
        ${done
          ? `<div class="flex gap-1.5 flex-wrap">${done.map(n => `<span class="w-9 h-9 flex items-center justify-center rounded-full ${lottoBallClass(n)} text-sm font-bold">${n}</span>`).join('')}</div>`
          : `<span class="text-xs ${isCurrent ? 'text-violet-300 font-semibold' : 'text-slate-600'}">${isCurrent ? '지금 뽑는 중...' : '대기'}</span>`}
      </div>`;
  }).join('');
}

function lottodrawUpdateProgress() {
  const s = lottoDrawState;
  const el = document.getElementById('lottodraw-progress');
  if (!el) return;
  if (s.finished) { el.textContent = '🎉 5게임 추첨 완료!'; return; }
  el.innerHTML = `<span class="text-violet-400">${LOTTODRAW_LETTERS[s.games.length]}게임</span> · ${s.current.length} / 6`;
}

/* ── 클라이맥스: 영수증 렌더링 + 3종 공유 CTA ── */
function lottodrawShowReceipt() {
  const s = lottoDrawState;
  const stage = document.getElementById('lottodraw-stage');
  const result = document.getElementById('lottodraw-result');
  if (!result) return;
  if (stage) stage.classList.add('hidden');

  s.canvas = lottodrawRenderReceiptCanvas(s.games);

  const drawn = s.games.map(g => g.join('.')).join('-');
  const shareUrl = buildShareLandingUrl('lottodraw', { drawn, desc: '5게임 30개 번호를 직접 뽑았어요! 나도 추첨기 이용해볼래?' });
  const kakaoTitle = '🎰 내가 직접 뽑은 행운 번호!';
  const kakaoDesc = '5게임 30개 번호, 나도 추첨기에서 뽑아볼래?';
  const shareText = `🎰 추첨기에서 내 손으로 직접 로또 번호 5게임을 뽑았어요! 나도 뽑아보기 👉 ${shareUrl}`;

  result.classList.remove('hidden');
  result.innerHTML = `
    <div class="text-center">
      <img src="${s.canvas.toDataURL('image/png')}" alt="로또 직접 뽑기 영수증"
        class="mx-auto rounded-xl shadow-2xl border border-slate-700 w-full max-w-xs mb-5 lottodraw-pop"/>
      <div class="space-y-2.5 max-w-xs mx-auto">
        <button onclick="lottodrawSaveImage()" class="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition">📥 이미지 저장</button>
        ${shareKakaoButtonHTML(`${location.origin}/share-cards/lotto-share.jpg`, kakaoTitle, kakaoDesc, shareUrl)}
        ${shareIconRowHTML(shareText, shareUrl)}
        <button onclick="initLottodraw()" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl transition">🔄 처음부터 다시 뽑기</button>
      </div>
    </div>`;
}

/* 다음 토요일(추첨일). 오늘이 토요일이고 추첨 시각(20:35) 이후면 다음 주 토요일 */
function lottodrawNextSaturday() {
  const d = new Date();
  let add = (6 - d.getDay() + 7) % 7;
  if (add === 0 && d.getHours() >= 21) add = 7;
  const out = new Date(d);
  out.setDate(d.getDate() + add);
  return out;
}

/* 분홍 감열지풍 영수증을 Canvas로 렌더링 (2x 스케일).
   v0.1.3~: 실제 복권처럼 보일 수 있다는 법적 리스크 우려로 ①제목을 "행운번호뽑기 6/45"로 변경
   ②회차 표기 삭제(발행일/추첨일만 유지) ③바코드·바코드 숫자열 삭제, 그 자리에 오락용 고지 문구를
   2배 크기로 키워 더 잘 보이게 배치 */
function lottodrawRenderReceiptCanvas(games) {
  const W = 380, H = 540, SCALE = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE; canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#fff5f8'); bg.addColorStop(0.5, '#fdeaf1'); bg.addColorStop(1, '#fce4ee');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const now = new Date();
  const drawDate = lottodrawNextSaturday();
  const fmt = (d) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} (${'일월화수목금토'[d.getDay()]})`;

  let y = 44;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d61f69';
  ctx.font = '900 28px sans-serif';
  ctx.fillText('행운번호뽑기 6/45', W / 2, y); y += 20;
  ctx.fillStyle = '#9d7484';
  ctx.font = '12px sans-serif';
  ctx.fillText('과 몰 입  연 구 소  ·  직 접  뽑 기', W / 2, y); y += 16;

  const dashLine = () => {
    ctx.strokeStyle = '#e3b7c8'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(22, y); ctx.lineTo(W - 22, y); ctx.stroke(); ctx.setLineDash([]);
  };
  dashLine(); y += 26;

  ctx.textAlign = 'left'; ctx.fillStyle = '#5c3a49'; ctx.font = '13px sans-serif';
  [
    ['발행일', `${fmt(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`],
    ['추첨일', fmt(drawDate)],
  ].forEach(([k, v]) => {
    ctx.fillText(k, 26, y);
    ctx.textAlign = 'right'; ctx.fillText(v, W - 26, y); ctx.textAlign = 'left';
    y += 20;
  });
  y += 4; dashLine(); y += 30;

  games.forEach((g, i) => {
    ctx.fillStyle = '#c2185b';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText(LOTTODRAW_LETTERS[i], 28, y);
    ctx.fillStyle = '#3d2430';
    ctx.font = '13px sans-serif';
    ctx.fillText('수동', 52, y);
    ctx.font = 'bold 21px "Courier New", monospace';
    ctx.fillText(g.map(n => String(n).padStart(2, '0')).join(' '), 100, y);
    y += 33;
  });
  y += 2; dashLine(); y += 24;

  ctx.fillStyle = '#5c3a49'; ctx.font = '13px sans-serif'; ctx.fillText('금액', 26, y);
  ctx.textAlign = 'right'; ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#3d2430';
  ctx.fillText('₩5,000 (가상)', W - 26, y); ctx.textAlign = 'left';
  y += 14; dashLine(); y += 60;

  ctx.textAlign = 'center'; ctx.font = '22px sans-serif'; ctx.fillStyle = '#b48a9c';
  ctx.fillText('본 영수증은 오락용 이미지이며', W / 2, y); y += 30;
  ctx.fillText('실제 복권이 아닙니다', W / 2, y); y += 40;
  ctx.fillText('행운을 빌어요! 🍀 과몰입 연구소', W / 2, y);

  return canvas;
}

function lottodrawSaveImage() {
  const s = lottoDrawState;
  if (!s.canvas) return;
  const a = document.createElement('a');
  a.href = s.canvas.toDataURL('image/png');
  a.download = `lucky-draw-${Date.now()}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  showToast('📥 영수증 이미지를 저장했어요!');
}

/* ══════════════════════════════════════════════════
   앱 초기화 (DOMContentLoaded)
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  updateVisitStreak();

  /* ── 테마 선택: 사이드바는 다크/라이트 두 버튼, 모바일 헤더는 기존 아이콘 토글 (v0.1.0~) ── */
  applyThemeIcon();
  const themeDarkBtn = document.getElementById('theme-btn-dark');
  const themeLightBtn = document.getElementById('theme-btn-light');
  if (themeDarkBtn) themeDarkBtn.addEventListener('click', () => setTheme('dark'));
  if (themeLightBtn) themeLightBtn.addEventListener('click', () => setTheme('light'));
  const themeMobileBtn = document.getElementById('theme-toggle-btn-mobile');
  if (themeMobileBtn) themeMobileBtn.addEventListener('click', toggleTheme);

  /* ── 효과음 토글 버튼 (v0.0.54~) ── */
  applySoundIcon();
  ['sound-toggle-btn', 'sound-toggle-btn-mobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', toggleSound);
  });

  /* ── 사이드바 그룹 접기/펼치기 (v0.2.4~: 심리테스트존 그룹 추가되며 공용 루프로 일반화,
       기존 저장 키(nav_tests_collapsed)는 그대로 유지해 하위호환.
       v0.2.5~: 과몰입 투표소/운명 관측소 그룹 추가 ── */
  ['nav-group-tests', 'nav-group-psychtest', 'nav-group-vote', 'nav-group-destiny'].forEach(groupId => {
    const group = document.getElementById(groupId);
    const toggle = document.getElementById(groupId + '-toggle');
    if (!group || !toggle) return;
    const storageKey = 'nav_' + groupId.replace('nav-group-', '') + '_collapsed';
    if (localStorage.getItem(storageKey) === '1') group.classList.remove('open');
    toggle.addEventListener('click', () => {
      const isOpen = group.classList.toggle('open');
      localStorage.setItem(storageKey, isOpen ? '0' : '1');
    });
  });

  /* ── 내비게이션 클릭 이벤트 ──
     심리테스트존 하위메뉴는 data-psych-category도 함께 갖고 있어, psychtestNavCategory()를
     먼저 호출해 App.state.psychtest.category를 갱신한 뒤 navigate() — 순서가 반대였으면
     navigate()의 사이드바 active 표시가 갱신 전 카테고리를 참조하게 됨 (v0.2.4~, v0.2.9 순서 수정) */
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      if (item.dataset.psychCategory) psychtestNavCategory(item.dataset.psychCategory);
      App.navigate(section);
    });
  });

  /* ── 섹션별 초기화 함수 맵 ── */
  const sectionInits = {
    home: initHome,
    mbti: initMbti,
    dream: initDream,
    fortune: initFortune,
    brain: initBrain,
    adhd: initAdhd,
    reaction: initReaction,
    memdigit: initMemdigit,
    seqmem: initSeqmem,
    colorvision: initColorvision,
    logic: initLogic,
    impulse: initImpulse,
    shortfocus: initShortfocus,
    insa: initInsa,
    proverb: initProverb,
    pricequiz: initPricequiz,
    lotto: initLotto,
    lottodraw: initLottodraw,
    'shared-preview': initSharedPreview,
    /* 개인정보처리방침/이용약관은 정적 텍스트라 별도 초기화 로직이 필요 없지만, 여기 등록해둬야
       직접 링크(#privacy 새로고침 등)로 진입해도 home으로 튕기지 않고 정상 라우팅됨 (v0.2.2~) */
    privacy: () => {},
    terms: () => {},
    /* Phase 4 수익화 로드맵 Now 항목 (v0.2.3~) */
    psychtest: initPsychtest,
    balance: initBalance,
    family: initFamily,
    fortuneext: initFortuneExt,
    worldcup: initWorldcup,
  };

  // 초기 섹션 진입 시 초기화
  const origNavigate = App.navigate.bind(App);
  App.navigate = function(sectionId) {
    origNavigate(sectionId);
    if (sectionInits[sectionId]) sectionInits[sectionId]();
  };

  /* ── 햄버거 메뉴 ── */
  const hamburger = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }

  /* ── 뒤로가기/홈 플로팅 버튼 ── */
  const floatingBackBtn = document.getElementById('floating-back-btn');
  const floatingHomeBtn = document.getElementById('floating-home-btn');
  if (floatingBackBtn) floatingBackBtn.addEventListener('click', () => App.goBack());
  if (floatingHomeBtn) floatingHomeBtn.addEventListener('click', () => App.navigate('home'));

  /* ── 꿈 해몽 모달 배경 클릭 닫기 ── */
  const dreamModal = document.getElementById('dream-modal');
  if (dreamModal) {
    dreamModal.addEventListener('click', function(e) {
      if (e.target === this) dreamCloseModal();
    });
  }

  /* ── 제휴문의 모달 배경 클릭 닫기 ── */
  const partnershipModal = document.getElementById('partnership-modal');
  if (partnershipModal) {
    partnershipModal.addEventListener('click', function(e) {
      if (e.target === this) closePartnershipModal();
    });
  }

  /* ── 의견 보내기 모달 배경 클릭 닫기 ── */
  const feedbackModal = document.getElementById('feedback-modal');
  if (feedbackModal) {
    feedbackModal.addEventListener('click', function(e) {
      if (e.target === this) closeFeedbackModal();
    });
  }

  /* ── hash 기반 초기 라우팅 ── */
  const rawHash = location.hash.replace('#', '') || 'home';
  const [hash, hashQuery] = rawHash.split('?');
  if (hashQuery) {
    const params = new URLSearchParams(hashQuery);
    const vs = params.get('vs');
    if (vs) {
      try { App.pendingChallenge = { section: hash, data: JSON.parse(vs) }; } catch (e) { App.pendingChallenge = null; }
    }
    const match = params.get('match');
    if (match) {
      try { App.pendingMatch = { section: hash, data: JSON.parse(match) }; } catch (e) { App.pendingMatch = null; }
    }
    /* App.navigate()가 곧바로 location.hash = sectionId로 덮어써 쿼리스트링이 사라지므로,
       initSharedPreview()가 나중에 읽을 수 있도록 지금 이 시점에 미리 떼어 저장해둔다 (v0.1.1~) */
    if (hash === 'shared-preview') {
      App._sharedPreviewParams = params;
    }
    /* 로또 공유 링크(?drawn=...)도 같은 이유로 이 시점에 미리 떼어둔다 (v0.1.2~, v0.1.3에서 조합기도 추가) */
    if (hash === 'lottodraw') {
      App._lottodrawSharedDrawn = params.get('drawn') || '';
    }
    if (hash === 'lotto') {
      App._lottoSharedDrawn = params.get('drawn') || '';
    }
  }
  App.navigate(hash in sectionInits ? hash : 'home');

  /* ── hashchange 이벤트 (뒤로가기/앞으로가기) ── */
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '') || 'home';
    if (h !== App.state.currentSection) App.navigate(h);
  });
});
