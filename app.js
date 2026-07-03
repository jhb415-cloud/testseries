/* v0.0.20 | 5-in-1 Dashboard SPA — app.js */

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
    shortfocus: { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalGoTime: 0, goCount: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', isNoGo: false },
    insa: { nickname: '', answers: [], step: 0 },
    proverb: { nickname: '', step: 0, correctCount: 0, options: [], answerIndex: 0, phase: 'idle', log: [] },
  },

  /* ─── 내비게이션 ─── */
  navigate(sectionId) {
    document.querySelectorAll('.section').forEach(s => {
      s.classList.add('hidden');
      s.classList.remove('fade-in');
    });
    const target = document.getElementById('section-' + sectionId);
    if (!target) return;
    target.classList.remove('hidden');
    requestAnimationFrame(() => target.classList.add('fade-in'));
    this.state.currentSection = sectionId;
    location.hash = sectionId;

    // 내비 active 처리
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const active = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (active) {
      active.classList.add('active');
      const parentGroup = active.closest('.nav-group');
      if (parentGroup) parentGroup.classList.add('open');
    }

    // 모바일 사이드바 닫기
    closeMobileSidebar();
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

/* ══════════════════════════════════════════════════
   유틸리티
══════════════════════════════════════════════════ */
function seededRandom(seed) {
  let x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
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

/* ── 공유하기 (Web Share API, 지원 안 하면 링크복사로 대체) ──
   ※ 카카오톡 공유는 별도 JS 키 발급 후 추가 예정 (백로그) */
function shareResult(text) {
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    copyToClipboard(text);
  }
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

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden', 'opacity-0');
  t.classList.add('opacity-100');
  setTimeout(() => { t.classList.remove('opacity-100'); t.classList.add('opacity-0'); }, 2200);
  setTimeout(() => t.classList.add('hidden'), 2700);
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
function applyThemeIcon() {
  const isLight = document.documentElement.classList.contains('light');
  const icon = isLight ? '☀️' : '🌙';
  ['theme-toggle-icon', 'theme-toggle-icon-mobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = icon;
  });
}

function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  applyThemeIcon();
}

/* ══════════════════════════════════════════════════
   🏠 홈 섹션 초기화
══════════════════════════════════════════════════ */
function initHome() {
  const quotes = AppData.quotes;
  const idx = Math.floor(seededRandom(todaySeed()) * quotes.length);
  const quote = quotes[idx];

  document.getElementById('home-quote-text').textContent = `"${quote}"`;
  document.getElementById('home-copy-btn').onclick = () => copyToClipboard(quote);

  const cards = [
    { section: 'mbti',    emoji: '🧠', title: '성격 파탄(MBTI)', desc: '12문항으로 알아보는 팩폭 성격 분석', color: 'from-violet-600 to-purple-700' },
    { section: 'dream',   emoji: '🌙', title: '꿈 해몽 검색',    desc: '어젯밤 그 꿈, 무슨 의미일까?',   color: 'from-blue-600 to-indigo-700' },
    { section: 'fortune', emoji: '🔮', title: '오늘의 운세',      desc: '띠별 오늘 하루 운세 확인',        color: 'from-amber-500 to-orange-600' },
    { section: 'brain',   emoji: '⚡', title: '두뇌 나이 측정기', desc: '스트룹 테스트로 내 두뇌 나이는?', color: 'from-emerald-500 to-teal-600' },
    { section: 'adhd',    emoji: '🌪️', title: '프로 미루러',     desc: 'ADHD 성향 10문항 자가 진단',      color: 'from-rose-500 to-pink-600' },
  ];

  const grid = document.getElementById('home-service-grid');
  grid.innerHTML = '';
  cards.forEach(c => {
    const div = document.createElement('div');
    div.className = `service-card bg-gradient-to-br ${c.color} rounded-2xl p-5 text-white shadow-lg`;
    div.innerHTML = `
      <div class="text-4xl mb-3">${c.emoji}</div>
      <h3 class="font-bold text-lg mb-1">${c.title}</h3>
      <p class="text-sm opacity-80">${c.desc}</p>
      <div class="mt-4 text-xs font-semibold opacity-90 uppercase tracking-widest">시작하기 →</div>
    `;
    div.onclick = () => App.navigate(c.section);
    grid.appendChild(div);
  });

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
  App.state.mbti = { nickname: '', answers: [], step: 0 };
  renderMbtiView('start');
}

function renderMbtiView(view) {
  const container = document.getElementById('mbti-container');
  const { mbtiQuestions } = AppData;
  const state = App.state.mbti;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">🧠</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">성격 파탄 MBTI</h2>
        <p class="text-slate-400 mb-6">12문항으로 알아보는 솔직한 성격 분석<br>결과가 팩폭일 수도 있습니다.</p>
        <input id="mbti-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력 (최대 12자)"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-violet-500 transition"/>
        <button onclick="mbtiStart()" class="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition">
          테스트 시작하기
        </button>
      </div>`;
  }

  else if (view === 'question') {
    const q = mbtiQuestions[state.step];
    const progress = Math.round((state.step / mbtiQuestions.length) * 100);
    container.innerHTML = `
      <div class="max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님의 테스트</span>
          <span class="text-violet-400 font-bold text-sm">${state.step + 1} / ${mbtiQuestions.length}</span>
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
    const shareText = `나는 ${type} - ${result.title}! ${state.nickname} 님의 성격 파탄 테스트 결과, 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-8">
          <div class="text-5xl mb-3">${result.emoji}</div>
          <div class="text-4xl font-black text-slate-100 mb-1 tracking-widest">${type}</div>
          <div class="text-violet-400 font-bold text-xl mb-2">${result.title}</div>
          <p class="text-slate-400">${state.nickname} 님의 성격 유형 분석 결과</p>
        </div>

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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-violet-900/40 mb-3">
          📤 내 결과 공유하기
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

function mbtiStart() {
  const nickname = document.getElementById('mbti-nickname').value.trim();
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  App.state.mbti.nickname = nickname;
  App.state.mbti.answers = [];
  App.state.mbti.step = 0;
  renderMbtiView('question');
}

function mbtiAnswer(axis) {
  const state = App.state.mbti;
  state.answers.push(axis);
  state.step++;
  if (state.step >= AppData.mbtiQuestions.length) {
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

function dreamSearchBy(query) {
  if (!query) { showToast('검색어를 입력해주세요!'); return; }
  const input = document.getElementById('dream-search-input');
  if (input) input.value = query;

  const terms = query.toLowerCase().split(/\s+/);

  // 테마(대표 키워드) + 하위 variants 키워드까지 모두 검색
  const results = [];
  AppData.dreamData.forEach((d, tIdx) => {
    const baseText = [...d.keywords, d.title].join(' ').toLowerCase();
    const baseMatch = terms.some(t => baseText.includes(t));

    let matchedVariantIdx = null;
    (d.variants || []).forEach((v, vIdx) => {
      if (matchedVariantIdx !== null) return;
      const vText = [...v.keywords, v.title].join(' ').toLowerCase();
      if (terms.some(t => vText.includes(t))) matchedVariantIdx = vIdx;
    });

    if (baseMatch || matchedVariantIdx !== null) {
      results.push({ tIdx, vIdx: matchedVariantIdx });
    }
  });

  const container = document.getElementById('dream-search-results');
  if (!container) return;

  if (results.length === 0) {
    const suggestions = ['뱀', '하늘을 날다', '이빨이 빠지다', '물', '불'];
    container.innerHTML = `
      <div class="text-center py-8">
        <div class="text-4xl mb-3">🔍</div>
        <p class="text-slate-400 mb-4">'${query}'에 대한 해몽 결과가 없어요.</p>
        <p class="text-slate-500 text-sm mb-4">다른 키워드로 검색해보세요</p>
        <div class="flex flex-wrap gap-2 justify-center">
          ${suggestions.map(s => `<button onclick="dreamSearchBy('${s}')" class="bg-blue-700/30 border border-blue-600/40 text-blue-300 text-sm px-4 py-2 rounded-full hover:bg-blue-700/50 transition">${s}</button>`).join('')}
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <p class="text-slate-500 text-sm mb-3">'${query}' 검색 결과 ${results.length}건</p>
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
    </div>`;
}

function dreamShowModal(tIdx, vIdx) {
  const d = AppData.dreamData[tIdx];
  if (!d) return;

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
      <div class="text-yellow-200/50 text-xs">⚠️ 꿈 해몽은 민속학적 참고 자료이며 학문적 사실이 아닙니다.</div>
    </div>`;
}

function dreamCloseModal() {
  document.getElementById('dream-modal').classList.add('hidden');
}

/* ══════════════════════════════════════════════════
   🔮 오늘의 운세 섹션
══════════════════════════════════════════════════ */
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

    // 자정 기준 시드 (매일 다른 운세, 같은 날은 동일)
    const seed = todaySeed() + zodiac.charCodeAt(0);
    const fortune = data.base;

    // 운 점수 (0~5)를 시드 기반으로 생성
    const scores = fortune.map((_, i) => Math.floor(seededRandom(seed + i * 17) * 3) + 3);
    const starMap = (n) => '★'.repeat(n) + '☆'.repeat(5-n);
    const avgScore = (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1);
    const shareText = `오늘 ${zodiac}띠 운세 평점 ${avgScore}/5.0! 행운의 숫자는 ${data.luckyNum}. 너도 확인해봐 👉`;

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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-amber-900/40 mb-3">
          📤 오늘의 운세 공유하기
        </button>

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
  hard: [
    { name: '빨강', class: 'stroop-red' },
    { name: '파랑', class: 'stroop-blue' },
    { name: '초록', class: 'stroop-green' },
    { name: '노랑', class: 'stroop-yellow' },
    { name: '보라', class: 'stroop-purple' },
  ]
};
const TOTAL_QUESTIONS = 20;
const TIME_LIMIT = 4000; // ms

function initBrain() {
  if (App.state.brain.timerID) clearTimeout(App.state.brain.timerID);
  App.state.brain = { nickname: '', difficulty: null, questions: [], step: 0, correctCount: 0, totalTime: 0, startTime: 0, timerID: null };
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
        <input id="brain-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-emerald-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">난이도 선택</p>
        <div class="grid grid-cols-2 gap-3">
          <button onclick="brainSelectDifficulty('easy')" class="bg-emerald-800/50 hover:bg-emerald-700/70 border border-emerald-600 text-emerald-300 font-bold py-4 rounded-xl transition">
            <div class="text-2xl mb-1">🟢</div>
            쉬움 버전<br><span class="text-xs font-normal opacity-70">색상 4개</span>
          </button>
          <button onclick="brainSelectDifficulty('hard')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-4 rounded-xl transition">
            <div class="text-2xl mb-1">🔴</div>
            어려움 버전<br><span class="text-xs font-normal opacity-70">색상 5개</span>
          </button>
        </div>
      </div>`;
  }

  else if (view === 'question') {
    const q = state.questions[state.step];
    const colors = STROOP_COLORS[state.difficulty];
    const progress = Math.round((state.step / TOTAL_QUESTIONS) * 100);

    container.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님 · ${state.difficulty === 'easy' ? '쉬움' : '어려움'}</span>
          <span class="text-emerald-400 font-bold text-sm">${state.step + 1} / ${TOTAL_QUESTIONS}</span>
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
      bar.style.transition = `width ${TIME_LIMIT}ms linear`;
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = '0%'; }));
    }

    // 타이머 설정 (4초 후 자동 오답)
    state.startTime = Date.now();
    if (state.timerID) clearTimeout(state.timerID);
    state.timerID = setTimeout(() => {
      brainTimeUp();
    }, TIME_LIMIT);
  }

  else if (view === 'result') {
    const avgMs = state.totalTime / TOTAL_QUESTIONS;
    const accuracy = (state.correctCount / TOTAL_QUESTIONS) * 100;

    // 두뇌 나이 계산
    let brainAge, tier, tierColor, tierBg;
    const score = accuracy - (avgMs / 100);

    if (score >= 85) { brainAge = Math.floor(Math.random() * 5) + 16; tier = 'S'; tierColor = 'text-yellow-300'; tierBg = 'bg-yellow-900/40 border-yellow-600'; }
    else if (score >= 70) { brainAge = Math.floor(Math.random() * 5) + 20; tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; }
    else if (score >= 55) { brainAge = Math.floor(Math.random() * 6) + 28; tier = 'B'; tierColor = 'text-blue-300'; tierBg = 'bg-blue-900/40 border-blue-600'; }
    else if (score >= 40) { brainAge = Math.floor(Math.random() * 7) + 38; tier = 'C'; tierColor = 'text-violet-300'; tierBg = 'bg-violet-900/40 border-violet-600'; }
    else { brainAge = Math.floor(Math.random() * 10) + 50; tier = 'D'; tierColor = 'text-rose-300'; tierBg = 'bg-rose-900/40 border-rose-600'; }

    const tierMsg = { S: '초인급 두뇌! 신호등 대왕', A: '날카로운 집중력의 소유자', B: '평균 이상의 반응속도', C: '약간 느린 처리 속도, 충분히 개선 가능!', D: '오늘 컨디션이 안 좋은 날? 다시 도전해보세요!' };
    const shareText = `나의 두뇌 나이는 ${brainAge}세! 정확도 ${accuracy.toFixed(0)}%, 평균 반응속도 ${(avgMs/1000).toFixed(2)}초. 티어: ${tier} - ${tierMsg[tier]}`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🧠</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 두뇌 나이</h2>
          <div class="text-7xl font-black text-slate-100 my-4">${brainAge}<span class="text-3xl text-slate-400">세</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <p class="text-slate-300">${tierMsg[tier]}</p>
        </div>
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-emerald-400">${state.correctCount}</div>
            <div class="text-slate-400 text-xs">정답 수</div>
            <div class="text-slate-500 text-xs">/ ${TOTAL_QUESTIONS}</div>
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

        <!-- 인증하기 버튼 -->
        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-emerald-900/40 mb-3">
          📲 내 두뇌 나이 공유하기
        </button>

        ${renderPlaceholderUI('brain', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs">
          ⚠️ 본 결과는 오락 목적이며 의학적 진단을 대체하지 않습니다.
        </div>
        <button onclick="initBrain()" class="w-full mt-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('brain', state.nickname, brainAge + '세 (Tier ' + tier + ')');
    renderLocalRanking('brain-ranking-list', 'brain');
  }
}

function brainSelectDifficulty(difficulty) {
  const nickname = document.getElementById('brain-nickname').value.trim();
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  const state = App.state.brain;
  state.nickname = nickname;
  state.difficulty = difficulty;
  state.questions = generateStroopQuestions(difficulty);
  state.step = 0;
  state.correctCount = 0;
  state.totalTime = 0;
  renderBrainView('question');
}

function generateStroopQuestions(difficulty) {
  const colors = STROOP_COLORS[difficulty];
  const questions = [];
  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
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
  if (state.timerID) clearTimeout(state.timerID);
  const elapsed = Date.now() - state.startTime;
  state.totalTime += Math.min(elapsed, TIME_LIMIT);
  if (colorName === state.questions[state.step].correctColor) {
    state.correctCount++;
    showToast('✅ 정답!');
  } else {
    showToast('❌ 오답');
  }
  brainNextQuestion();
}

function brainTimeUp() {
  const state = App.state.brain;
  state.totalTime += TIME_LIMIT;
  showToast('⏱️ 시간 초과!');
  brainNextQuestion();
}

function brainNextQuestion() {
  const state = App.state.brain;
  state.step++;
  if (state.step >= TOTAL_QUESTIONS) {
    App.showLoader(() => renderBrainView('result'));
  } else {
    renderBrainView('question');
  }
}

/* ══════════════════════════════════════════════════
   ⚡ 프로 미루러 (ADHD) 섹션
══════════════════════════════════════════════════ */
function initAdhd() {
  App.state.adhd = { nickname: '', answers: [], step: 0 };
  renderAdhdView('start');
}

function renderAdhdView(view) {
  const container = document.getElementById('adhd-container');
  const { adhdQuestions, adhdResults } = AppData;
  const state = App.state.adhd;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">⚡</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">프로 미루러 (ADHD 성향 진단)</h2>
        <p class="text-slate-400 mb-6">10문항으로 알아보는 집중력 결핍 성향<br>결과는 전문 진단이 아닌 참고용입니다.</p>
        <input id="adhd-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-rose-500 transition"/>
        <button onclick="adhdStart()" class="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition">
          진단 시작하기
        </button>
      </div>`;
  }

  else if (view === 'question') {
    const q = adhdQuestions[state.step];
    const progress = Math.round((state.step / adhdQuestions.length) * 100);
    container.innerHTML = `
      <div class="max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님</span>
          <span class="text-rose-400 font-bold text-sm">${state.step + 1} / ${adhdQuestions.length}</span>
        </div>
        <div class="progress-bar-track mb-6" style="--from:#f43f5e;--to:#ec4899">
          <div class="h-full rounded-full transition-all" style="width:${progress}%;background:linear-gradient(90deg,#f43f5e,#ec4899)"></div>
        </div>
        <h3 class="text-slate-100 text-xl font-semibold mb-6 leading-relaxed">Q${state.step+1}. ${q.q}</h3>
        <div class="flex flex-col gap-3">
          ${[['항상 그렇다', 2], ['자주 그렇다', 1], ['가끔 그렇다', 0], ['전혀 아니다', 0]].map(([label, val]) => `
            <button class="option-btn" onclick="adhdAnswer(${val}, '${label}')">
              ${label}
            </button>`).join('')}
        </div>
      </div>`;
  }

  else if (view === 'result') {
    const score = state.answers.reduce((a, b) => a + b, 0);
    const result = adhdResults.find(r => score >= r.range[0] && score <= r.range[1]) || adhdResults[adhdResults.length-1];
    const shareText = `나는 프로 미루러 등급 ${result.grade} - ${result.title}! ${state.nickname} 님의 진단 점수 ${score}점. 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">${result.emoji}</div>
          <div class="text-4xl font-black text-slate-100 mb-1">등급 ${result.grade}</div>
          <div class="text-rose-400 font-bold text-xl mb-2">${result.title}</div>
          <p class="text-slate-400">${state.nickname} 님의 진단 점수: <strong class="text-slate-100">${score}점</strong> / 20점</p>
        </div>

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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-rose-900/40 mb-3">
          📤 내 결과 공유하기
        </button>

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

function adhdStart() {
  const nickname = document.getElementById('adhd-nickname').value.trim();
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  App.state.adhd.nickname = nickname;
  App.state.adhd.answers = [];
  App.state.adhd.step = 0;
  renderAdhdView('question');
}

function adhdAnswer(val) {
  const state = App.state.adhd;
  state.answers.push(val);
  state.step++;
  if (state.step >= AppData.adhdQuestions.length) {
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
};

function initReaction() {
  if (App.state.reaction.delayTimer) clearTimeout(App.state.reaction.delayTimer);
  App.state.reaction = { nickname: '', difficulty: null, round: 0, totalRounds: 0, times: [], fouls: 0, delayTimer: null, stimulusAt: 0, phase: 'idle' };
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
        <input id="reaction-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
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
    if (avgMs <= 220)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = 'F1 레이서 스카우트 제의가 들어올지도? 오늘 하루도 그 반응속도로 다 씹어먹자.'; }
    else if (avgMs <= 260) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = '꽤 빠른데? 오늘 하루도 딱 이 텐션 유지해봐.'; }
    else if (avgMs <= 320) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = '평균은 하는 편! 그래도 방심은 금물, 딴짓하다 버스 놓치지 말자.'; }
    else if (avgMs <= 400) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = '음... 오늘따라 반응이 좀 느긋하네. 뜨거운 국물 먹을 때 조심하자.'; }
    else                   { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = '어쩔 수 없지, 오늘은 주위를 잘 살피면서 걷자고~'; }

    const shareText = `나의 반응속도는 평균 ${avgMs}ms! 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">💨</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 반응속도</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${avgMs}<span class="text-2xl text-slate-400">ms</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-cyan-900/40 mb-3">
          📤 내 결과 공유하기
        </button>

        ${renderPlaceholderUI('reaction', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 신경학적 반응속도 측정과 다를 수 있습니다.
        </div>
        <button onclick="initReaction()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('reaction', state.nickname, avgMs + 'ms (Tier ' + tier + ')');
    renderLocalRanking('reaction-ranking-list', 'reaction');
  }
}

function reactionStart(difficulty) {
  const input = document.getElementById('reaction-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  const cfg = REACTION_CONFIG[difficulty];
  App.state.reaction = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    times: [], fouls: 0, delayTimer: null, stimulusAt: 0, phase: 'idle',
  };
  renderReactionView('round');
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
    state.times.push(cfg.foulPenalty + 700);
    if (feedback) feedback.textContent = '앗, 가짜 신호였어요! 반칙 😵';
    reactionAdvance();
    return;
  }

  if (state.phase === 'go') {
    const ms = Math.round(performance.now() - state.stimulusAt);
    state.times.push(ms);
    state.phase = 'idle';
    reactionSetBox('bg-cyan-600 border-cyan-400', '✅', `${ms}ms!`);
    if (feedback) feedback.textContent = '';
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
};

function initMemdigit() {
  if (App.state.memdigit.delayTimer) clearTimeout(App.state.memdigit.delayTimer);
  App.state.memdigit = { nickname: '', difficulty: null, round: 0, totalRounds: 0, currentLen: 0, sequence: [], userInput: [], maxCorrectLen: 0, correctRounds: 0, delayTimer: null, phase: 'idle' };
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
        <input id="memdigit-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
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
    if (maxLen >= 9)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = '천재 아니야? 전화번호는 안 적어도 다 외우겠는데?'; }
    else if (maxLen >= 8) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = '기억력 甲! 오늘 장 볼 목록은 안 적어도 되겠어.'; }
    else if (maxLen >= 6) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = '평균은 하는 기억력! 그래도 중요한 약속은 메모해두자.'; }
    else if (maxLen >= 4) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = '음... 방금 뭐 외웠더라? 중요한 건 꼭 메모해두는 습관을 들이자.'; }
    else                  { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = '괜찮아, 메모 앱이 괜히 있는 게 아니야. 오늘부터 적극 활용하자!'; }

    const shareText = `나의 숫자 기억력은 최대 ${maxLen}자리! 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🔢</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 숫자 기억력</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${maxLen}<span class="text-2xl text-slate-400">자리</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-cyan-900/40 mb-3">
          📤 내 결과 공유하기
        </button>

        ${renderPlaceholderUI('memdigit', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 임상 기억력 검사와 다를 수 있습니다.
        </div>
        <button onclick="initMemdigit()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('memdigit', state.nickname, maxLen + '자리 (Tier ' + tier + ')');
    renderLocalRanking('memdigit-ranking-list', 'memdigit');
  }
}

function memdigitStart(difficulty) {
  const input = document.getElementById('memdigit-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
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

  memdigitFlashDigit(0);
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
    if (feedback) feedback.textContent = '정답! 다음엔 한 자리 더 늘어나요 🎉';
  } else {
    state.currentLen = Math.max(state.currentLen - 1, cfg.minLen);
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
};

function initSeqmem() {
  if (App.state.seqmem.delayTimer) clearTimeout(App.state.seqmem.delayTimer);
  App.state.seqmem = { nickname: '', difficulty: null, round: 0, totalRounds: 0, currentLen: 0, sequence: [], userInput: [], maxCorrectLen: 0, correctRounds: 0, delayTimer: null, phase: 'idle' };
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
        <input id="seqmem-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
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
      </div>`;
  }

  else if (view === 'round') {
    const cfg = SEQMEM_CONFIG[state.difficulty];
    const gridColsClass = cfg.gridSize === 4 ? 'grid-cols-4' : 'grid-cols-3';
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
    if (maxLen >= 9)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = '이 정도면 뮤지컬 안무도 한 번에 외우겠는데?'; }
    else if (maxLen >= 8) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = '패턴 감각 甲! 길 찾기도 잘하는 편이지?'; }
    else if (maxLen >= 6) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = '평균은 하는 순서 감각! 헷갈리면 천천히 다시 확인하자.'; }
    else if (maxLen >= 4) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = '음... 순서가 자꾸 헷갈리네. 서두르지 말고 하나씩 짚어가자.'; }
    else                  { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = '괜찮아, 원래 급하면 실수하는 법! 다음엔 천천히 되짚어보자~'; }

    const shareText = `나의 순서 기억력은 최대 ${maxLen}칸! 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🧩</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 순서 기억력</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${maxLen}<span class="text-2xl text-slate-400">칸</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-cyan-900/40 mb-3">
          📤 내 결과 공유하기
        </button>

        ${renderPlaceholderUI('seqmem', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 임상 기억력 검사와 다를 수 있습니다.
        </div>
        <button onclick="initSeqmem()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('seqmem', state.nickname, maxLen + '칸 (Tier ' + tier + ')');
    renderLocalRanking('seqmem-ranking-list', 'seqmem');
  }
}

function seqmemStart(difficulty) {
  const input = document.getElementById('seqmem-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
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
  const feedback = document.getElementById('seqmem-feedback');
  if (feedback) feedback.textContent = '잘 보고 기억하세요...';

  seqmemFlashTile(0);
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
};

function initColorvision() {
  const s = App.state.colorvision;
  if (s.timerID) clearTimeout(s.timerID);
  if (s.delayTimer) clearTimeout(s.delayTimer);
  App.state.colorvision = { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, totalTime: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', baseColor: '', oddColor: '', oddIndex: 0, tileCount: 0 };
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
        <input id="colorvision-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
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
      </div>`;
  }

  else if (view === 'round') {
    const cfg = COLORVISION_CONFIG[state.difficulty];
    const gridColsClass = { 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5' }[cfg.gridSize];

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
    if (score >= 85)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = '이 정도면 색상 코디네이터 해도 되겠는데? 미묘한 색 차이까지 완벽하게 잡아냈어!'; }
    else if (score >= 70) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = '색 감각 甲! 웬만한 색상 미스매치는 다 잡아낼 듯.'; }
    else if (score >= 55) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = '평균은 하는 색 감각! 애매한 색은 밝은 조명에서 다시 보자.'; }
    else if (score >= 40) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = '음... 비슷한 색은 좀 헷갈리는 편이네. 옷 고를 땐 밝은 데서 확인하자.'; }
    else                  { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = '괜찮아, 색보다 디자인 센스가 더 중요하지! 헷갈리면 친구한테 물어보자~'; }

    const shareText = `나의 색 감각 점수는 정확도 ${accuracy.toFixed(0)}%! 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🎨</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 색 감각</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${accuracy.toFixed(0)}<span class="text-2xl text-slate-400">%</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-cyan-900/40 mb-3">
          📤 내 결과 공유하기
        </button>

        ${renderPlaceholderUI('colorvision', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적의 색 구별 게임이며 실제 색각(색맹·색약) 임상 검사를 대체하지 않습니다.
        </div>
        <button onclick="initColorvision()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('colorvision', state.nickname, accuracy.toFixed(0) + '% (Tier ' + tier + ')');
    renderLocalRanking('colorvision-ranking-list', 'colorvision');
  }
}

function colorvisionStart(difficulty) {
  const input = document.getElementById('colorvision-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  const cfg = COLORVISION_CONFIG[difficulty];
  App.state.colorvision = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    correctCount: 0, totalTime: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle',
    baseColor: '', oddColor: '', oddIndex: 0, tileCount: cfg.gridSize * cfg.gridSize,
  };
  renderColorvisionView('round');
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
    state.totalTime += Math.min(elapsed, cfg.timeLimitMs);
    if (tappedEl) tappedEl.style.outline = '3px solid #22c55e';
    showToast('✅ 정답!');
  } else {
    state.totalTime += cfg.timeLimitMs;
    if (tappedEl) tappedEl.style.outline = '3px solid #ef4444';
    if (correctEl) correctEl.style.outline = '3px solid #22c55e';
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
  App.state.logic = { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, totalTime: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', seq: [], answer: 0, options: [] };
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
        <input id="logic-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
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
    if (score >= 85)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = '이 정도면 수학 학원 안 다녀도 되겠는데? 패턴이 다 보이는구나!'; }
    else if (score >= 70) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = '논리력 甲! 숫자 패턴은 거의 다 잡아내네.'; }
    else if (score >= 55) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = '평균은 하는 논리력! 급하게 풀지 말고 패턴을 천천히 뜯어보자.'; }
    else if (score >= 40) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = '음... 패턴 찾기가 좀 어려운 편이네. 앞뒤 숫자 차이부터 하나씩 계산해보자.'; }
    else                  { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = '괜찮아, 계산기는 괜히 있는 게 아니야! 다음엔 천천히 규칙을 찾아보자~'; }

    const shareText = `나의 논리력 점수는 정확도 ${accuracy.toFixed(0)}%! 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🧮</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 논리력</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${accuracy.toFixed(0)}<span class="text-2xl text-slate-400">%</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-cyan-900/40 mb-3">
          📤 내 결과 공유하기
        </button>

        ${renderPlaceholderUI('logic', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 지능·논리력 검사를 대체하지 않습니다.
        </div>
        <button onclick="initLogic()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('logic', state.nickname, accuracy.toFixed(0) + '% (Tier ' + tier + ')');
    renderLocalRanking('logic-ranking-list', 'logic');
  }
}

function logicStart(difficulty) {
  const input = document.getElementById('logic-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  const cfg = LOGIC_CONFIG[difficulty];
  App.state.logic = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    correctCount: 0, totalTime: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle',
    seq: [], answer: 0, options: [],
  };
  renderLogicView('round');
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
    state.totalTime += Math.min(elapsed, cfg.timeLimitMs);
    if (tappedEl) tappedEl.classList.add('selected');
    showToast('✅ 정답!');
  } else {
    state.totalTime += cfg.timeLimitMs;
    if (tappedEl) { tappedEl.style.borderColor = '#ef4444'; tappedEl.style.background = 'rgba(239,68,68,0.15)'; }
    if (correctEl) { correctEl.style.borderColor = '#22c55e'; correctEl.style.background = 'rgba(34,197,94,0.15)'; }
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
};

function initImpulse() {
  const s = App.state.impulse;
  if (s.timerID) clearTimeout(s.timerID);
  if (s.delayTimer) clearTimeout(s.delayTimer);
  App.state.impulse = { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalGoTime: 0, goCount: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', isNoGo: false };
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
        <input id="impulse-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
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
    if (accuracy >= 95)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = '이 정도 자제력이면 다이어트도 성공하겠는데? 완벽한 절제력!'; }
    else if (accuracy >= 85) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = '충동 조절 甲! 웬만한 유혹엔 안 넘어가겠어.'; }
    else if (accuracy >= 70) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = '평균은 하는 자제력! 급할 때 한 번 더 생각하고 행동하자.'; }
    else if (accuracy >= 50) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = '음... 성급하게 반응하는 편이네. "멈춰서 생각하기"를 연습해보자.'; }
    else                     { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = '괜찮아, 원래 사람은 다 충동적이야! 다음엔 한 박자 쉬고 반응해보자~'; }

    const shareText = `나의 충동억제력은 정확도 ${accuracy.toFixed(0)}%! 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🚦</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 충동억제력</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${accuracy.toFixed(0)}<span class="text-2xl text-slate-400">%</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-cyan-900/40 mb-3">
          📤 내 결과 공유하기
        </button>

        ${renderPlaceholderUI('impulse', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 임상 충동성·주의력 검사를 대체하지 않습니다.
        </div>
        <button onclick="initImpulse()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('impulse', state.nickname, accuracy.toFixed(0) + '% (Tier ' + tier + ')');
    renderLocalRanking('impulse-ranking-list', 'impulse');
  }
}

function impulseStart(difficulty) {
  const input = document.getElementById('impulse-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  const cfg = IMPULSE_CONFIG[difficulty];
  App.state.impulse = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalGoTime: 0, goCount: 0,
    startTime: 0, timerID: null, delayTimer: null, phase: 'idle', isNoGo: false,
  };
  renderImpulseView('round');
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
    if (feedback) feedback.textContent = '앗, 참았어야 해요! 성급한 반응 😵';
    showToast('❌ 성급한 반응!');
  } else {
    const ms = Math.round(performance.now() - state.startTime);
    state.correctCount++;
    state.goCount++;
    state.totalGoTime += ms;
    if (feedback) feedback.textContent = `${ms}ms! 정확해요 ✅`;
    showToast('✅ 정답!');
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
    if (feedback) feedback.textContent = '잘 참았어요! 👍';
    showToast('✅ 잘 참았어요!');
  } else {
    state.omissionErrors++;
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
   📱 숏폼 집중력 테스트 ("숏폼 뇌 지수", v0.0.18~)
   - 충동억제(Go/No-Go) 테스트 엔진을 그대로 재활용, MZ향으로 리스킨
   - 🔥 꿀잼 콘텐츠엔 빠르게 탭, 📢 광고엔 참기(탭 금지)
══════════════════════════════════════════════════ */
const SHORTFOCUS_CONFIG = {
  easy:   { label: '쉬움',   rounds: 8,  timeLimitMs: 1100, noGoRatio: 0.3 },
  normal: { label: '보통',   rounds: 10, timeLimitMs: 800,  noGoRatio: 0.35 },
  hard:   { label: '어려움', rounds: 12, timeLimitMs: 600,  noGoRatio: 0.4 },
};

function initShortfocus() {
  const s = App.state.shortfocus;
  if (s.timerID) clearTimeout(s.timerID);
  if (s.delayTimer) clearTimeout(s.delayTimer);
  App.state.shortfocus = { nickname: '', difficulty: null, round: 0, totalRounds: 0, correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalGoTime: 0, goCount: 0, startTime: 0, timerID: null, delayTimer: null, phase: 'idle', isNoGo: false };
  renderShortfocusView('start');
}

function renderShortfocusView(view) {
  const container = document.getElementById('shortfocus-container');
  const state = App.state.shortfocus;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">📱</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">숏폼 집중력 테스트</h2>
        <p class="text-slate-400 mb-6">당신의 뇌, 아직 숏폼 알고리즘에 잠식되지 않았나요? 🧠<br>🔥 꿀잼 콘텐츠가 뜨면 최대한 빨리 탭!<br>📢 광고가 뜨면 절대 누르지 말고 참으세요.</p>
        <input id="shortfocus-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-cyan-500 transition"/>
        <p class="text-slate-400 text-sm mb-3">피드 속도(난이도) 선택</p>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="shortfocusStart('easy')" class="bg-emerald-800/50 hover:bg-emerald-700/70 border border-emerald-600 text-emerald-300 font-bold py-3 rounded-xl transition text-sm">
            🟢 쉬움<br><span class="text-xs font-normal opacity-70">8회, 여유있음</span>
          </button>
          <button onclick="shortfocusStart('normal')" class="bg-amber-800/50 hover:bg-amber-700/70 border border-amber-600 text-amber-300 font-bold py-3 rounded-xl transition text-sm">
            🟡 보통<br><span class="text-xs font-normal opacity-70">10회, 빠른 스크롤</span>
          </button>
          <button onclick="shortfocusStart('hard')" class="bg-rose-800/50 hover:bg-rose-700/70 border border-rose-600 text-rose-300 font-bold py-3 rounded-xl transition text-sm">
            🔴 어려움<br><span class="text-xs font-normal opacity-70">12회, 초고속 피드</span>
          </button>
        </div>
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
        <div class="progress-bar-track mb-8">
          <div id="shortfocus-progress-fill" class="progress-bar-fill" style="width:${Math.round((state.round / state.totalRounds) * 100)}%"></div>
        </div>
        <div id="shortfocus-stimulus" onclick="shortfocusTap()"
          class="rounded-3xl h-56 w-56 mx-auto flex flex-col items-center justify-center cursor-pointer select-none bg-slate-800 border-4 border-slate-600 transition-colors duration-100"
          style="touch-action:manipulation;">
          <span id="shortfocus-stimulus-emoji" class="text-6xl mb-2">📱</span>
          <span id="shortfocus-stimulus-text" class="text-slate-300 font-bold text-lg px-4 text-center">스크롤 중...</span>
        </div>
        <p id="shortfocus-feedback" class="text-center text-slate-500 text-sm mt-6 min-h-6"></p>
      </div>`;
    shortfocusBeginRound();
  }

  else if (view === 'result') {
    const accuracy = (state.correctCount / state.totalRounds) * 100;
    const avgGoMs = state.goCount > 0 ? Math.round(state.totalGoTime / state.goCount) : 0;

    let tier, tierColor, tierBg, tierMsg;
    if (accuracy >= 95)      { tier = 'S'; tierColor = 'text-yellow-300';  tierBg = 'bg-yellow-900/40 border-yellow-600';   tierMsg = '당신의 뇌는 아직 알고리즘에 잠식되지 않았다! 클래식 집중력 보유자 🧠✨'; }
    else if (accuracy >= 85) { tier = 'A'; tierColor = 'text-emerald-300'; tierBg = 'bg-emerald-900/40 border-emerald-600'; tierMsg = '숏폼 내성 甲! 웬만한 떡밥엔 안 낚이는 타입.'; }
    else if (accuracy >= 70) { tier = 'B'; tierColor = 'text-blue-300';    tierBg = 'bg-blue-900/40 border-blue-600';       tierMsg = '평균적인 숏폼 세대 뇌. 광고 몇 개는 낚였을지도? ㅋㅋ'; }
    else if (accuracy >= 50) { tier = 'C'; tierColor = 'text-violet-300';  tierBg = 'bg-violet-900/40 border-violet-600';   tierMsg = '이미 도파민에 살짝 적응된 뇌... 스크롤 좀 줄여볼까?'; }
    else                     { tier = 'D'; tierColor = 'text-rose-300';   tierBg = 'bg-rose-900/40 border-rose-600';       tierMsg = '숏폼 알고리즘의 완벽한 먹잇감 확정 😂 근데 원래 다들 그래, 너만 그런 거 아니야!'; }

    const shareText = `내 숏폼 뇌 지수는 정확도 ${accuracy.toFixed(0)}%! 등급 ${tier} - ${tierMsg} 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">📱</div>
          <h2 class="text-2xl font-bold text-slate-100 mb-1">${state.nickname} 님의 숏폼 뇌 지수</h2>
          <div class="text-6xl font-black text-slate-100 my-4">${accuracy.toFixed(0)}<span class="text-2xl text-slate-400">%</span></div>
          <div class="inline-block border-2 rounded-xl px-6 py-2 ${tierBg} mb-4">
            <span class="font-black text-2xl ${tierColor}">Tier ${tier}</span>
          </div>
          <p class="text-slate-300">${tierMsg}</p>
        </div>
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-emerald-400">${state.correctCount}</div>
            <div class="text-slate-400 text-xs">정답 수</div>
            <div class="text-slate-500 text-xs">/ ${state.totalRounds}</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-rose-400">${state.commissionErrors}</div>
            <div class="text-slate-400 text-xs">광고에 낚인 횟수</div>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 text-center">
            <div class="text-2xl font-black text-violet-400">${avgGoMs}ms</div>
            <div class="text-slate-400 text-xs">평균 반응속도</div>
          </div>
        </div>

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-fuchsia-900/40 mb-3">
          📤 내 결과 공유하기
        </button>

        ${renderPlaceholderUI('shortfocus', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 목적이며 실제 임상 주의력·집중력 검사를 대체하지 않습니다.
        </div>
        <button onclick="initShortfocus()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">
          다시 측정하기
        </button>
      </div>`;

    saveRanking('shortfocus', state.nickname, accuracy.toFixed(0) + '% (Tier ' + tier + ')');
    renderLocalRanking('shortfocus-ranking-list', 'shortfocus');
  }
}

function shortfocusStart(difficulty) {
  const input = document.getElementById('shortfocus-nickname');
  const nickname = input ? input.value.trim() : '';
  if (!nickname) { showToast('별명을 입력해주세요!'); return; }
  const cfg = SHORTFOCUS_CONFIG[difficulty];
  App.state.shortfocus = {
    nickname, difficulty, round: 0, totalRounds: cfg.rounds,
    correctCount: 0, commissionErrors: 0, omissionErrors: 0, totalGoTime: 0, goCount: 0,
    startTime: 0, timerID: null, delayTimer: null, phase: 'idle', isNoGo: false,
  };
  renderShortfocusView('round');
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

  state.isNoGo = Math.random() < cfg.noGoRatio;
  const stim = document.getElementById('shortfocus-stimulus');
  const emoji = document.getElementById('shortfocus-stimulus-emoji');
  const text = document.getElementById('shortfocus-stimulus-text');
  if (state.isNoGo) {
    if (stim) stim.className = 'rounded-3xl h-56 w-56 mx-auto flex flex-col items-center justify-center cursor-pointer select-none bg-slate-600 border-4 border-slate-400 transition-colors duration-100';
    if (emoji) emoji.textContent = '📢';
    if (text) text.textContent = '광고예요, 참으세요!';
  } else {
    if (stim) stim.className = 'rounded-3xl h-56 w-56 mx-auto flex flex-col items-center justify-center cursor-pointer select-none bg-fuchsia-500 border-4 border-fuchsia-300 transition-colors duration-100';
    if (emoji) emoji.textContent = '🔥';
    if (text) text.textContent = '지금 떴다! 탭!';
  }

  state.phase = 'active';
  state.startTime = performance.now();
  if (state.timerID) clearTimeout(state.timerID);
  state.timerID = setTimeout(shortfocusTimeUp, cfg.timeLimitMs);
}

function shortfocusTap() {
  const state = App.state.shortfocus;
  if (state.phase !== 'active') return;
  if (state.timerID) clearTimeout(state.timerID);
  state.phase = 'idle';
  const feedback = document.getElementById('shortfocus-feedback');

  if (state.isNoGo) {
    state.commissionErrors++;
    if (feedback) feedback.textContent = '앗, 광고에 낚였어요! 😵';
    showToast('❌ 광고에 낚였어요!');
  } else {
    const ms = Math.round(performance.now() - state.startTime);
    state.correctCount++;
    state.goCount++;
    state.totalGoTime += ms;
    if (feedback) feedback.textContent = `${ms}ms! 딱 걸렸다 ✅`;
    showToast('✅ 정답!');
  }
  state.delayTimer = setTimeout(shortfocusAdvance, 600);
}

function shortfocusTimeUp() {
  const state = App.state.shortfocus;
  if (state.phase !== 'active') return;
  state.phase = 'idle';
  const feedback = document.getElementById('shortfocus-feedback');

  if (state.isNoGo) {
    state.correctCount++;
    if (feedback) feedback.textContent = '광고 안 눌렀어요! 👍';
    showToast('✅ 잘 참았어요!');
  } else {
    state.omissionErrors++;
    if (feedback) feedback.textContent = '앗, 놓쳤어요! 😅';
    showToast('⏱️ 놓쳤어요!');
  }
  state.delayTimer = setTimeout(shortfocusAdvance, 600);
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
  App.state.insa = { nickname: '', answers: [], step: 0 };
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
        <input id="insa-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
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
    const shareText = `나는 인싸력 등급 ${result.grade} - ${result.title}! ${state.nickname} 님의 점수 ${score}점. 너도 확인해봐 👉`;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">${result.emoji}</div>
          <div class="text-4xl font-black text-slate-100 mb-1">등급 ${result.grade}</div>
          <div class="text-orange-400 font-bold text-xl mb-2">${result.title}</div>
          <p class="text-slate-400">${state.nickname} 님의 점수: <strong class="text-slate-100">${score}점</strong> / 30점</p>
        </div>

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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-orange-900/40 mb-3">
          📤 내 결과 공유하기
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
  App.state.proverb = { nickname: '', step: 0, correctCount: 0, options: [], answerIndex: 0, phase: 'idle', log: [] };
  renderProverbView('start');
}

function renderProverbView(view) {
  const container = document.getElementById('proverb-container');
  const { proverbQuestions, proverbResults } = AppData;
  const state = App.state.proverb;

  if (view === 'start') {
    container.innerHTML = `
      <div class="max-w-md mx-auto text-center">
        <div class="text-6xl mb-4">📜</div>
        <h2 class="text-2xl font-bold text-slate-100 mb-2">속담 완성 퀴즈</h2>
        <p class="text-slate-400 mb-6">옛 어른들의 지혜, 속담 10문항!<br>시간 제한 없이 편하게 풀어보세요 😊</p>
        <input id="proverb-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 mb-4 focus:outline-none focus:border-amber-500 transition"/>
        <button onclick="proverbStart()" class="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-3 rounded-xl transition">
          퀴즈 시작하기
        </button>
      </div>`;
  }

  else if (view === 'question') {
    const q = proverbQuestions[state.step];
    const opts = shuffleArray([q.correct, ...q.decoys]);
    state.options = opts;
    state.answerIndex = opts.indexOf(q.correct);
    state.phase = 'active';
    const progress = Math.round((state.step / proverbQuestions.length) * 100);

    container.innerHTML = `
      <div class="max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-400 text-sm">${state.nickname} 님</span>
          <span class="text-amber-400 font-bold text-sm">${state.step + 1} / ${proverbQuestions.length}</span>
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
    const total = proverbQuestions.length;
    const result = proverbResults.find(r => state.correctCount >= r.range[0] && state.correctCount <= r.range[1]) || proverbResults[proverbResults.length-1];
    const shareText = `속담 완성 퀴즈 ${state.correctCount}/${total}개 정답! 등급 ${result.grade} - ${result.title}. 너도 도전해봐 👉`;

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

        <button onclick="shareResult(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-amber-900/40 mb-3">
          📤 내 결과 공유하기
        </button>

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
  App.state.proverb = { nickname, step: 0, correctCount: 0, options: [], answerIndex: 0, phase: 'idle', log: [] };
  renderProverbView('question');
}

function proverbAnswer(idx) {
  const state = App.state.proverb;
  if (state.phase !== 'active') return;
  state.phase = 'idle';
  const q = AppData.proverbQuestions[state.step];
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

  setTimeout(proverbAdvance, 1400);
}

function proverbAdvance() {
  if (App.state.currentSection !== 'proverb') return;
  const state = App.state.proverb;
  state.step++;
  if (state.step >= AppData.proverbQuestions.length) {
    App.showLoader(() => renderProverbView('result'));
  } else {
    renderProverbView('question');
  }
}

/* ══════════════════════════════════════════════════
   확장 Placeholder UI (공통)
══════════════════════════════════════════════════ */
function renderPlaceholderUI(section, value) {
  const rankingId = `${section}-ranking-list`;
  return `
  <div class="mt-8 space-y-4">

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
  </div>`;
}

/* ──── 로컬스토리지 랭킹 ──── */
function saveRanking(section, nickname, result) {
  const key = `ranking_${section}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift({ nickname, result, time: new Date().toLocaleString('ko-KR') });
  localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
  markDone(section);
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
   🏡 마이홈 대시보드 (v0.0.10~ 홈 섹션에 통합)
══════════════════════════════════════════════════ */
function renderHomeMypage() {
  const container = document.getElementById('home-mypage-container');
  if (!container) return;

  const nickname = getNickname();
  const streak = updateVisitStreak();
  const sections = ['mbti', 'dream', 'fortune', 'brain', 'adhd', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus', 'insa', 'proverb'];
  const sectionLabels = { mbti: '성격 파탄(MBTI)', dream: '꿈 해몽', fortune: '오늘의 운세', brain: '두뇌 나이', adhd: '프로 미루러', reaction: '반응속도', memdigit: '숫자 기억력', seqmem: '순서 기억력', colorvision: '색각 테스트', logic: '논리력', impulse: '충동억제', shortfocus: '숏폼 집중력', insa: '인싸력', proverb: '속담 완성' };
  const doneCount = sections.filter(isDone).length;

  // 최근 테스트 기록 모아보기 (섹션별 가장 최근 1건씩)
  const historyItems = [];
  ['mbti', 'fortune', 'brain', 'adhd', 'reaction', 'memdigit', 'seqmem', 'colorvision', 'logic', 'impulse', 'shortfocus', 'insa', 'proverb'].forEach(sec => {
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
      <div class="flex items-center gap-2 text-amber-300 text-sm font-semibold">🔥 ${streak}일 연속 방문 중</div>
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
  const games = [];
  for (let i = 0; i < 5; i++) games.push(lottoPickSet());
  lottoRenderGames(games, '완전 랜덤 조합');
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
  const games = [];
  for (let i = 0; i < 5; i++) games.push(lottoPickSet(uniqueNums));
  lottoRenderGames(games, `직접 지정 (${uniqueNums.join(', ')} 포함)`);
}

function lottoRunFortunePick() {
  const fortuneNum = localStorage.getItem('last_fortune_luckynum') || '';
  const dreamNum = localStorage.getItem('last_dream_luckynum') || '';
  const pool = [];
  [fortuneNum, dreamNum].forEach(s => {
    (s.match(/\d+/g) || []).forEach(n => {
      const v = parseInt(n, 10);
      if (v >= 1 && v <= 45 && !pool.includes(v)) pool.push(v);
    });
  });

  if (pool.length === 0) {
    showToast('먼저 오늘의 운세나 꿈 해몽을 확인해보세요! 지금은 랜덤으로 대체할게요.');
  }
  const games = [];
  for (let i = 0; i < 5; i++) games.push(lottoPickSet(pool.slice(0, 5)));
  lottoRenderGames(games, pool.length ? '오늘의 운세·꿈 행운숫자 연동' : '오늘의 운세·꿈 미확인 (랜덤 대체)');
}

function lottoRenderGames(games, modeLabel) {
  const container = document.getElementById('lotto-result');
  if (!container) return;
  container.innerHTML = `
    <p class="text-slate-500 text-sm mb-3">${modeLabel} · 5게임</p>
    <div class="space-y-2">
      ${games.map((g, i) => `
        <div class="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-3">
          <span class="text-slate-500 text-xs w-12 shrink-0">${i + 1}게임</span>
          <div class="flex gap-2 flex-wrap">
            ${g.map(n => `<span class="w-8 h-8 flex items-center justify-center rounded-full bg-violet-700 text-white text-xs font-bold">${n}</span>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    <button onclick="copyToClipboard('${games.map(g => g.join('-')).join(' / ')}')" class="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-bold py-2 rounded-xl transition">
      🔗 번호 복사하기
    </button>`;
}

function initLotto() {
  const container = document.getElementById('lotto-container');
  if (!container) return;
  container.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-5">
        <h2 class="text-slate-100 font-black text-xl mb-1">🎱 로또 번호 조합기</h2>
        <p class="text-slate-500 text-sm mb-5">원하는 방식으로 번호를 뽑아보세요 (오락 목적)</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button onclick="lottoRunRandom()" class="bg-violet-700 hover:bg-violet-600 text-white font-bold py-3 rounded-xl transition">🎲 완전 랜덤</button>
          <button onclick="document.getElementById('lotto-custom-box').classList.toggle('hidden')" class="bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 rounded-xl transition">✍️ 숫자 직접 지정</button>
          <button onclick="lottoRunFortunePick()" class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition">🔮 오늘의 운세·꿈 연동</button>
          <button disabled title="추후 실제 당첨번호 데이터 연동 예정" class="bg-slate-800 text-slate-600 font-bold py-3 rounded-xl border border-slate-700 cursor-not-allowed">📊 통계 기반 추천 (준비중)</button>
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
   앱 초기화 (DOMContentLoaded)
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  updateVisitStreak();

  /* ── 테마 토글 버튼 ── */
  applyThemeIcon();
  ['theme-toggle-btn', 'theme-toggle-btn-mobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', toggleTheme);
  });

  /* ── 사이드바 "테스트" 그룹 접기/펼치기 ── */
  const testsGroup = document.getElementById('nav-group-tests');
  const testsToggle = document.getElementById('nav-group-tests-toggle');
  if (testsGroup && testsToggle) {
    if (localStorage.getItem('nav_tests_collapsed') === '1') testsGroup.classList.remove('open');
    testsToggle.addEventListener('click', () => {
      const isOpen = testsGroup.classList.toggle('open');
      localStorage.setItem('nav_tests_collapsed', isOpen ? '0' : '1');
    });
  }

  /* ── 내비게이션 클릭 이벤트 ── */
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
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
    lotto: initLotto,
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

  /* ── 꿈 해몽 모달 배경 클릭 닫기 ── */
  const dreamModal = document.getElementById('dream-modal');
  if (dreamModal) {
    dreamModal.addEventListener('click', function(e) {
      if (e.target === this) dreamCloseModal();
    });
  }

  /* ── hash 기반 초기 라우팅 ── */
  const hash = location.hash.replace('#', '') || 'home';
  App.navigate(hash in sectionInits ? hash : 'home');

  /* ── hashchange 이벤트 (뒤로가기/앞으로가기) ── */
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '') || 'home';
    if (h !== App.state.currentSection) App.navigate(h);
  });
});
