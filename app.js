/* v0.0.1 | 5-in-1 Dashboard SPA — app.js */

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
    if (active) active.classList.add('active');

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
        <h2 class="text-2xl font-bold text-white mb-2">성격 파탄 MBTI</h2>
        <p class="text-slate-400 mb-6">12문항으로 알아보는 솔직한 성격 분석<br>결과가 팩폭일 수도 있습니다.</p>
        <input id="mbti-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력 (최대 12자)"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 mb-4 focus:outline-none focus:border-violet-500 transition"/>
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
        <h3 class="text-white text-xl font-semibold mb-6 leading-relaxed">Q${state.step+1}. ${q.q}</h3>
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

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-8">
          <div class="text-5xl mb-3">${result.emoji}</div>
          <div class="text-4xl font-black text-white mb-1 tracking-widest">${type}</div>
          <div class="text-violet-400 font-bold text-xl mb-2">${result.title}</div>
          <p class="text-slate-400">${state.nickname} 님의 성격 유형 분석 결과</p>
        </div>

        <div class="bg-slate-800 rounded-2xl p-5 mb-4">
          <h4 class="text-white font-bold mb-2">📌 성격 요약</h4>
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

        ${renderPlaceholderUI('mbti', type)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 및 자기 이해를 위한 참고 자료이며 전문 심리 진단을 대체하지 않습니다.
        </div>
        <button onclick="initMbti()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">
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
        <h2 class="text-2xl font-bold text-white mb-2">꿈 해몽 검색</h2>
        <p class="text-slate-400">어젯밤 꿈의 키워드를 입력하세요</p>
      </div>
      <div class="flex gap-2 mb-4">
        <input id="dream-search-input" type="text" placeholder="예: 뱀, 하늘을 날다, 이빨이 빠지다..."
          class="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"/>
        <button onclick="dreamSearch()" class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl transition">검색</button>
      </div>
      <div id="dream-search-results"></div>
      <div class="mt-6">
        <p class="text-slate-500 text-sm mb-3">추천 검색어</p>
        <div class="flex flex-wrap gap-2">
          ${suggestions.map(s => `
            <button onclick="dreamSearchBy('${s}')" class="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm px-4 py-2 rounded-full transition">
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
  const results = AppData.dreamData.filter(d => {
    const allText = [...d.keywords, d.title].join(' ').toLowerCase();
    return terms.some(t => allText.includes(t));
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
      ${results.map((r, i) => `
        <div onclick="dreamShowModal(${AppData.dreamData.indexOf(r)})"
          class="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-600/50 rounded-xl p-4 cursor-pointer transition">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🌙</span>
            <div>
              <div class="text-white font-semibold">${r.title}</div>
              <div class="text-blue-400 text-sm">${r.summary}</div>
            </div>
            <span class="ml-auto text-slate-500 text-sm">상세보기 →</span>
          </div>
        </div>`).join('')}
    </div>`;
}

function dreamShowModal(idx) {
  const d = AppData.dreamData[idx];
  if (!d) return;

  const modal = document.getElementById('dream-modal');
  const modalInner = document.getElementById('dream-modal-inner');
  modalInner.innerHTML = `
    <div class="modal-content bg-slate-800 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-white font-bold text-xl">${d.title}</h3>
        <button onclick="dreamCloseModal()" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
      </div>
      <div class="bg-blue-900/30 border border-blue-700/40 rounded-xl p-3 mb-4">
        <span class="text-blue-300 font-semibold">✦ ${d.summary}</span>
      </div>
      <p class="text-slate-300 leading-relaxed mb-5 text-sm">${d.detail}</p>
      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="bg-slate-700 rounded-lg p-3 text-center">
          <div class="text-xs text-slate-400 mb-1">행운의 색</div>
          <div class="text-white font-semibold text-sm">${d.lucky}</div>
        </div>
        <div class="bg-slate-700 rounded-lg p-3 text-center">
          <div class="text-xs text-slate-400 mb-1">행운의 숫자</div>
          <div class="text-white font-semibold text-sm">${d.luckyNum}</div>
        </div>
        <div class="bg-slate-700 rounded-lg p-3 text-center">
          <div class="text-xs text-slate-400 mb-1">오늘의 행동</div>
          <div class="text-white font-semibold text-xs leading-tight">${d.action.substring(0,14)}…</div>
        </div>
      </div>
      <div class="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-3 mb-4">
        <p class="text-indigo-200 text-sm">${d.action}</p>
      </div>
      <div class="text-yellow-200/50 text-xs">⚠️ 꿈 해몽은 민속학적 참고 자료이며 학문적 사실이 아닙니다.</div>
    </div>`;

  // 3초 광고 로딩 후 팝업 오픈
  App.showLoader(() => {
    modal.classList.remove('hidden');
  });
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
        <h2 class="text-2xl font-bold text-white mb-2">오늘의 운세</h2>
        <p class="text-slate-400 mb-6">출생연도를 입력하면 띠를 자동으로 계산해드려요</p>
        <input id="fortune-year-input" type="number" min="1924" max="${currentYear}" placeholder="출생연도 입력 (예: 1995)"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 mb-4 focus:outline-none focus:border-amber-500 transition text-center text-xl tracking-widest"/>
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

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-2">${data.emoji}</div>
          <h2 class="text-2xl font-bold text-white">${zodiac}띠 오늘의 운세</h2>
          <p class="text-slate-400 text-sm">${new Date().toLocaleDateString('ko-KR', {year:'numeric',month:'long',day:'numeric'})} 기준</p>
          <div class="mt-2 text-amber-400 text-2xl tracking-widest">${starMap(Math.round(parseFloat(avgScore)))}</div>
          <div class="text-amber-300 font-bold text-lg">${avgScore} / 5.0</div>
        </div>
        <div class="grid grid-cols-1 gap-4 mb-6">
          ${fortune.map((f, i) => `
            <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div class="flex items-center justify-between mb-2">
                <span class="text-white font-bold">${f.title}</span>
                <span class="text-amber-400 tracking-widest text-sm">${starMap(scores[i])}</span>
              </div>
              <p class="text-emerald-400 text-sm font-semibold mb-1">${f.positive}</p>
              <p class="text-slate-400 text-sm leading-relaxed">${f.detail}</p>
            </div>`).join('')}
        </div>

        ${renderPlaceholderUI('fortune', zodiac)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 운세는 오락 목적의 참고 자료이며 실제 미래를 예측하지 않습니다.
        </div>
        <button onclick="initFortune()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">
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
        <h2 class="text-2xl font-bold text-white mb-2">두뇌 나이 측정기</h2>
        <p class="text-slate-400 mb-6">스트룹 테스트 — 글자의 뜻이 아닌<br><strong class="text-white">글자 색상</strong>에 해당하는 버튼을 누르세요!</p>
        <input id="brain-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 mb-4 focus:outline-none focus:border-emerald-500 transition"/>
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
        <p class="text-slate-400 text-center text-sm mb-4">이 글자의 <strong class="text-white">색상</strong>은?</p>
        <div class="grid grid-cols-2 gap-3">
          ${colors.map(c => `
            <button onclick="brainAnswer('${c.name}')"
              class="bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-emerald-500 text-white font-bold py-4 rounded-xl text-lg transition">
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
          <h2 class="text-2xl font-bold text-white mb-1">${state.nickname} 님의 두뇌 나이</h2>
          <div class="text-7xl font-black text-white my-4">${brainAge}<span class="text-3xl text-slate-400">세</span></div>
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
        <button onclick="copyToClipboard(\`${shareText}\`)"
          class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-emerald-900/40 mb-3">
          📲 내 두뇌 나이 단톡방에 인증하기
        </button>

        ${renderPlaceholderUI('brain', tier)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs">
          ⚠️ 본 결과는 오락 목적이며 의학적 진단을 대체하지 않습니다.
        </div>
        <button onclick="initBrain()" class="w-full mt-3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">
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
        <h2 class="text-2xl font-bold text-white mb-2">프로 미루러 (ADHD 성향 진단)</h2>
        <p class="text-slate-400 mb-6">10문항으로 알아보는 집중력 결핍 성향<br>결과는 전문 진단이 아닌 참고용입니다.</p>
        <input id="adhd-nickname" type="text" maxlength="12" placeholder="별명 또는 닉네임 입력"
          class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 mb-4 focus:outline-none focus:border-rose-500 transition"/>
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
        <h3 class="text-white text-xl font-semibold mb-6 leading-relaxed">Q${state.step+1}. ${q.q}</h3>
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

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">${result.emoji}</div>
          <div class="text-4xl font-black text-white mb-1">등급 ${result.grade}</div>
          <div class="text-rose-400 font-bold text-xl mb-2">${result.title}</div>
          <p class="text-slate-400">${state.nickname} 님의 진단 점수: <strong class="text-white">${score}점</strong> / 20점</p>
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

        ${renderPlaceholderUI('adhd', result.grade)}

        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4 text-yellow-200/60 text-xs leading-relaxed">
          ⚠️ 본 결과는 오락 및 자기 이해 목적의 자가 체크리스트이며 전문 의학 진단을 대체하지 않습니다. ADHD가 의심되면 정신건강의학과 전문의와 상담하세요.
        </div>
        <button onclick="initAdhd()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">
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
          class="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition"/>
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
      <span class="text-white text-sm font-semibold flex-1">${item.nickname}</span>
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
   앱 초기화 (DOMContentLoaded)
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

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
