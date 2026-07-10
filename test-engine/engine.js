/* test-engine v3 (STEP 3 버그수정) | engine.js — 공통 로직 (config 로드, 화면 전환, 채점, 렌더,
   결과 공유카드 저장, 관련 테스트 배너, 카카오톡 공유, 메인 사이트로 돌아가기 링크)
   순수 바닐라 JS. 외부 라이브러리 없음. 기능별 함수로 분리해 유지보수.
   결과 화면의 "이미지 저장" 기능은 별도 파일 result-card.js(window.TestEngineResultCard)에 위임한다.
   카카오 SDK 로드+초기화와 "메인으로" 링크는 이 파일이 init() 시점에 자동으로 주입한다 —
   새 테스트를 추가할 때 index.html에 별도로 스크립트/마크업을 추가할 필요가 없다(자동 적용). */

(function () {
  'use strict';

  // 최상단에서 즉시 캡처해야 함 — defer 스크립트라도 동기 실행 구간에서만 currentScript가 유효함
  var ENGINE_SCRIPT = document.currentScript;
  var ENGINE_BASE = ENGINE_SCRIPT.src.replace(/engine\.js(\?.*)?$/, '');
  var TEST_ID_ATTR = ENGINE_SCRIPT.dataset.testId || '';

  var state = {
    config: null,
    testId: TEST_ID_ATTR,
    questionIndex: 0,
    answers: [],
    sumScore: 0,
    typeCounts: {},
    correctCount: 0,
    axisScore: { left: 0, right: 0 }
  };

  var rootEl = null;

  // 메인 사이트(같은 도메인)에서 이미 쓰고 있는 Kakao Developers 앱 키를 그대로 재사용 —
  // 도메인이 같으므로(gwamol-lab.xyz) 카카오 쪽 도메인 화이트리스트 추가 등록이 필요 없다.
  var KAKAO_APP_KEY = '3e54f92e9a63142650381c63b1cadee3';
  var KAKAO_SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js';
  var KAKAO_SDK_INTEGRITY = 'sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J';

  // ---------- bootstrap ----------
  function init() {
    rootEl = document.getElementById('test-engine-root');
    if (!rootEl) {
      console.error('[test-engine] #test-engine-root 요소를 찾을 수 없습니다.');
      return;
    }
    injectHomeLink();
    loadKakaoSdk(); // fire-and-forget: 결과 화면에 도달할 즈음엔 로드가 끝나있을 것으로 기대, 실패해도 공유 버튼이 안내 문구로 우아하게 처리함
    loadConfig()
      .then(function (config) {
        state.config = config;
        state.testId = state.testId || config.id;
        injectThemeCSS(config.theme);
        renderIntro();
      })
      .catch(function (err) {
        console.error('[test-engine] config.json 로드 실패', err);
        rootEl.innerHTML = '<p class="te-error">테스트를 불러오지 못했습니다. 새로고침해보세요.</p>';
      });
  }

  // 화면 어디서든(질문 중간 포함) 메인 사이트로 빠져나갈 수 있는 고정 링크.
  // rootEl.innerHTML 교체와 무관하게 항상 떠 있도록 document.body에 직접 붙인다.
  function injectHomeLink() {
    if (document.getElementById('te-home-link')) return;
    var a = document.createElement('a');
    a.id = 'te-home-link';
    a.className = 'te-home-link';
    a.href = '/';
    a.textContent = '← 메인으로';
    document.body.appendChild(a);
  }

  function loadKakaoSdk() {
    if (window.Kakao) {
      try { if (!Kakao.isInitialized()) Kakao.init(KAKAO_APP_KEY); } catch (e) { /* noop */ }
      return;
    }
    if (document.getElementById('te-kakao-sdk')) return;
    var script = document.createElement('script');
    script.id = 'te-kakao-sdk';
    script.src = KAKAO_SDK_SRC;
    script.integrity = KAKAO_SDK_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.onload = function () {
      try { Kakao.init(KAKAO_APP_KEY); } catch (e) { console.warn('[test-engine] Kakao 초기화 실패', e); }
    };
    script.onerror = function () { console.warn('[test-engine] Kakao SDK 로드 실패'); };
    document.head.appendChild(script);
  }

  function loadConfig() {
    return fetch('./config.json', { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('config fetch failed: ' + res.status);
      return res.json();
    });
  }

  function injectThemeCSS(themeName) {
    if (!themeName) return;
    if (document.querySelector('link[data-te-theme]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = ENGINE_BASE + 'themes/' + themeName + '.css';
    link.dataset.teTheme = themeName;
    document.head.appendChild(link);
  }

  // ---------- localStorage 완료 카운터 ----------
  function getCompletionKey() {
    return 'test_engine_done_' + (state.testId || state.config.id);
  }

  function getSeenCount() {
    var seed = Number(state.config.seed_count) || 0;
    var done = Number(localStorage.getItem(getCompletionKey())) || 0;
    return seed + done;
  }

  function bumpCompletionCount() {
    var done = Number(localStorage.getItem(getCompletionKey())) || 0;
    localStorage.setItem(getCompletionKey(), String(done + 1));
  }

  // ---------- 화면: 인트로 ----------
  function renderIntro() {
    var c = state.config;
    var hashtags = (c.hashtags || [])
      .map(function (h) { return '<span class="te-chip">#' + escapeHtml(h) + '</span>'; })
      .join('');

    rootEl.innerHTML =
      '<div class="te-app te-screen-intro te-has-fixed-footer">' +
        '<div class="te-intro-cover">' +
          '<img src="' + escapeAttr(c.cover_image) + '" alt="' + escapeAttr(c.title) + '" class="te-cover-img" style="width:100%;display:block;" />' +
        '</div>' +
        '<div class="te-intro-body">' +
          '<h1 class="te-title">' + escapeHtml(c.title) + '</h1>' +
          '<p class="te-desc">' + escapeHtml(c.description) + '</p>' +
          '<div class="te-chip-row">' + hashtags + '</div>' +
        '</div>' +
        '<div class="te-choices-fixed te-intro-footer">' +
          '<button type="button" class="te-btn te-btn-primary" id="te-start-btn">테스트 시작</button>' +
          '<p class="te-seen-count">지금까지 <strong>' + getSeenCount().toLocaleString('ko-KR') + '</strong>명이 확인했어요</p>' +
        '</div>' +
      '</div>';

    qs('#te-start-btn').addEventListener('click', startTest);
  }

  function startTest() {
    state.questionIndex = 0;
    state.answers = [];
    state.sumScore = 0;
    state.typeCounts = {};
    state.correctCount = 0;
    state.axisScore = { left: 0, right: 0 };
    renderQuestion();
  }

  // ---------- 화면: 질문 (루프) ----------
  function renderQuestion() {
    var c = state.config;
    var total = c.questions.length;
    var idx = state.questionIndex;
    var q = c.questions[idx];
    var progress = Math.round((idx / total) * 100);

    var imageHtml = q.image
      ? '<img src="' + escapeAttr(q.image) + '" alt="" class="te-question-img" />'
      : '';

    var choicesHtml = q.choices
      .map(function (choice, i) {
        return '<button type="button" class="te-btn te-btn-choice" data-choice-index="' + i + '">' +
          escapeHtml(choice.label) +
        '</button>';
      })
      .join('');

    rootEl.innerHTML =
      '<div class="te-app te-screen-question te-has-fixed-footer">' +
        '<div style="padding:12px 20px 0;">' +
          '<div class="te-progress-track"><div class="te-progress-fill" style="width:' + progress + '%"></div></div>' +
        '</div>' +
        '<div class="te-question-body">' +
          '<p class="te-question-counter">' + (idx + 1) + ' / ' + total + '</p>' +
          imageHtml +
          '<h2 class="te-question-text">' + escapeHtml(q.text) + '</h2>' +
        '</div>' +
        '<div class="te-choices-fixed te-question-footer">' +
          choicesHtml +
        '</div>' +
      '</div>';

    qsa('.te-btn-choice').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var choiceIndex = Number(btn.dataset.choiceIndex);
        selectChoice(q, choiceIndex);
      });
    });
  }

  function selectChoice(question, choiceIndex) {
    var choice = question.choices[choiceIndex];
    state.answers.push(choice);
    applyScoring(choice);

    if (state.questionIndex < state.config.questions.length - 1) {
      state.questionIndex += 1;
      renderQuestion();
    } else {
      renderLoading();
    }
  }

  function applyScoring(choice) {
    switch (state.config.scoring_type) {
      case 'sum':
        state.sumScore += Number(choice.score) || 0;
        break;
      case 'type':
        if (choice.type) {
          state.typeCounts[choice.type] = (state.typeCounts[choice.type] || 0) + 1;
        }
        break;
      case 'quiz':
        if (choice.correct === true) state.correctCount += 1;
        break;
      case 'axis':
        // choice.axis: 'left' | 'right', choice.weight: number (기본 1)
        if (choice.axis === 'left') state.axisScore.left += Number(choice.weight) || 1;
        else if (choice.axis === 'right') state.axisScore.right += Number(choice.weight) || 1;
        break;
      default:
        console.warn('[test-engine] 알 수 없는 scoring_type: ' + state.config.scoring_type);
    }
  }

  // ---------- 화면: 로딩 연출 ----------
  function renderLoading() {
    var c = state.config;
    var loadingText = (c.loading && c.loading.text) || '결과 분석 중..';
    var duration = (c.loading && c.loading.duration_ms) || 2000;

    rootEl.innerHTML =
      '<div class="te-app te-screen-loading">' +
        '<div class="te-loading-box">' +
          '<div class="te-spinner"></div>' +
          '<p class="te-loading-text">' + escapeHtml(loadingText) + '</p>' +
          '<div class="te-progress-track" style="max-width:240px;">' +
            '<div class="te-progress-fill te-progress-anim" style="animation-duration:' + duration + 'ms"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 실제 계산은 즉시 수행, 화면 전환만 연출용으로 지연
    var result = computeResult();
    bumpCompletionCount();
    setTimeout(function () {
      renderResult(result);
    }, duration);
  }

  // ---------- 채점 (scoring_type 4종 분기) ----------
  function computeResult() {
    var c = state.config;
    switch (c.scoring_type) {
      case 'sum': return computeSumResult(c);
      case 'type': return computeTypeResult(c);
      case 'quiz': return computeQuizResult(c);
      case 'axis': return computeAxisResult(c);
      default:
        console.warn('[test-engine] 알 수 없는 scoring_type: ' + c.scoring_type);
        return c.results[0];
    }
  }

  function computeSumResult(c) {
    var score = state.sumScore;
    var matched = c.results.filter(function (r) { return score >= r.min && score <= r.max; })[0];
    return matched || c.results[c.results.length - 1];
  }

  function computeTypeResult(c) {
    var bestType = null;
    var bestCount = -1;
    Object.keys(state.typeCounts).forEach(function (type) {
      if (state.typeCounts[type] > bestCount) {
        bestCount = state.typeCounts[type];
        bestType = type;
      }
    });
    var matched = c.results.filter(function (r) { return r.type === bestType; })[0];
    return matched || c.results[0];
  }

  function computeQuizResult(c) {
    var correct = state.correctCount;
    var matched = c.results.filter(function (r) { return correct >= r.min && correct <= r.max; })[0];
    return matched || c.results[c.results.length - 1];
  }

  function computeAxisResult(c) {
    var left = state.axisScore.left;
    var right = state.axisScore.right;
    var total = left + right || 1;
    var rightRatio = Math.round((right / total) * 100);
    var matched = c.results.filter(function (r) { return rightRatio >= r.min && rightRatio <= r.max; })[0];
    var base = matched || c.results[0];
    var merged = {};
    Object.keys(base).forEach(function (k) { merged[k] = base[k]; });
    merged.axisRatio = rightRatio;
    return merged;
  }

  // ---------- 화면: 결과 ----------
  function renderResult(result) {
    var traits = (result.traits || [])
      .map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; })
      .join('');

    var relatedIds = (state.config.related || []).filter(Boolean);
    var relatedHtml = relatedIds.length ? '<div id="te-related-container" class="te-related"></div>' : '';

    rootEl.innerHTML =
      '<div class="te-app te-screen-result te-has-fixed-footer">' +
        '<div class="te-result-body">' +
          '<img src="' + escapeAttr(result.image) + '" alt="' + escapeAttr(result.title) + '" class="te-result-img" style="width:100%;display:block;" />' +
          '<h2 class="te-result-title">' + escapeHtml(result.title) + '</h2>' +
          '<p class="te-result-subtitle">' + escapeHtml(result.subtitle || '') + '</p>' +
          '<ul class="te-result-traits">' + traits + '</ul>' +
          '<p class="te-result-tip">' + escapeHtml(result.tip || '') + '</p>' +
          '<p class="te-save-hint">📸 이미지를 꾹 눌러 저장해보세요</p>' +
          relatedHtml +
        '</div>' +
        '<div class="te-choices-fixed te-result-footer">' +
          '<button type="button" class="te-btn te-btn-kakao" id="te-kakao-btn">💬 카카오톡으로 공유하기</button>' +
          '<button type="button" class="te-btn te-btn-accent" id="te-save-btn">🖼️ 이미지 저장</button>' +
          '<button type="button" class="te-btn te-btn-primary" id="te-share-btn">공유하기</button>' +
          '<button type="button" class="te-btn te-btn-secondary" id="te-restart-btn">다시하기</button>' +
        '</div>' +
      '</div>';

    qs('#te-restart-btn').addEventListener('click', renderIntro);
    qs('#te-share-btn').addEventListener('click', function () { shareResult(result); });
    qs('#te-save-btn').addEventListener('click', function () { handleSaveImageClick(result); });
    qs('#te-kakao-btn').addEventListener('click', function () { shareResultToKakao(result); });

    if (relatedIds.length) loadRelatedBanner(relatedIds);
  }

  // ---------- 카카오톡 공유 ----------
  function shareResultToKakao(result) {
    if (!window.Kakao || !Kakao.isInitialized()) {
      alert('카카오 공유 준비 중이에요. 잠시 후 다시 시도해주세요.');
      loadKakaoSdk();
      return;
    }
    try {
      var imageUrl = new URL(result.image, document.baseURI).href;
      var shareUrl = window.location.href;
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: result.title,
          description: state.config.title + (result.subtitle ? ' — ' + result.subtitle : ''),
          imageUrl: imageUrl,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
        },
        buttons: [{ title: '나도 테스트하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }]
      });
    } catch (e) {
      console.error('[test-engine] 카카오 공유 실패', e);
      alert('카카오 공유에 실패했어요.');
    }
  }

  // ---------- 결과 공유카드 저장 (result-card.js 위임) ----------
  async function handleSaveImageClick(result) {
    var btn = qs('#te-save-btn');
    if (!btn || btn.disabled) return;
    if (!window.TestEngineResultCard) {
      console.error('[test-engine] result-card.js가 로드되지 않았습니다.');
      alert('이미지 생성 기능을 불러오지 못했어요.');
      return;
    }
    var originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = '생성 중...';
    try {
      var canvas = await window.TestEngineResultCard.renderCard(state.config, result);
      openSaveImageModal(canvas);
    } catch (err) {
      console.error('[test-engine] 결과 카드 생성 실패', err);
      alert('이미지를 만들지 못했어요. 다시 시도해주세요.');
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  }

  function openSaveImageModal(canvas) {
    closeSaveImageModal();
    var overlay = document.createElement('div');
    overlay.className = 'te-modal-backdrop';
    overlay.id = 'te-save-modal';
    overlay.innerHTML =
      '<div class="te-modal-card">' +
        '<img src="' + canvas.toDataURL('image/png') + '" alt="결과 공유 카드" class="te-modal-img" />' +
        '<p class="te-modal-hint">📱 이미지를 길게 눌러서 저장해보세요</p>' +
        '<div class="te-modal-actions">' +
          '<button type="button" class="te-btn te-btn-primary" id="te-modal-download-btn">📥 다운로드</button>' +
          '<button type="button" class="te-btn te-btn-secondary" id="te-modal-close-btn">닫기</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSaveImageModal();
    });
    document.getElementById('te-modal-close-btn').addEventListener('click', closeSaveImageModal);
    document.getElementById('te-modal-download-btn').addEventListener('click', function () {
      window.TestEngineResultCard.saveCanvasAsImage(canvas, state.config.id + '-result');
    });
  }

  function closeSaveImageModal() {
    var existing = document.getElementById('te-save-modal');
    if (existing) existing.remove();
  }

  // ---------- 관련 테스트 배너 (config.related, 비어있으면 렌더 자체를 생략) ----------
  async function loadRelatedBanner(relatedIds) {
    var container = qs('#te-related-container');
    if (!container) return;
    var cards = [];
    for (var i = 0; i < relatedIds.length; i++) {
      var rid = relatedIds[i];
      try {
        var res = await fetch('../' + rid + '/config.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('config fetch failed: ' + res.status);
        var cfg = await res.json();
        cards.push({ id: rid, title: cfg.title, cover: '../' + rid + '/' + cfg.cover_image });
      } catch (e) {
        console.warn('[test-engine] 관련 테스트(' + rid + ') 정보를 불러오지 못했습니다:', e.message);
        cards.push({ id: rid, title: rid, cover: null });
      }
    }
    container.innerHTML =
      '<p class="te-related-label">🔥 이런 테스트는 어때요?</p>' +
      '<div class="te-related-list">' +
      cards.map(function (c) {
        var thumb = c.cover ? '<img src="' + escapeAttr(c.cover) + '" alt="" class="te-related-thumb" />' : '';
        return '<a class="te-related-item" href="../' + escapeAttr(c.id) + '/index.html">' + thumb +
          '<span>' + escapeHtml(c.title) + '</span></a>';
      }).join('') +
      '</div>';
  }

  function shareResult(result) {
    var shareData = {
      title: state.config.title,
      text: result.title + ' - ' + state.config.title,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(
        function () { alert('링크가 복사됐어요! 친구에게 공유해보세요 🙌'); },
        function () { alert('복사에 실패했어요. 링크: ' + window.location.href); }
      );
    } else {
      alert('현재 브라우저에서는 공유 기능을 지원하지 않아요. 링크: ' + window.location.href);
    }
  }

  // ---------- 유틸 ----------
  function qs(sel) { return rootEl.querySelector(sel); }
  function qsa(sel) { return Array.prototype.slice.call(rootEl.querySelectorAll(sel)); }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function escapeAttr(str) { return escapeHtml(str); }

  // ---------- 시작 ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
