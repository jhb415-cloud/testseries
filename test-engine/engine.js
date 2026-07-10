/* test-engine v5 (STEP 5: MBTI 4축 동시 채점 + 인트로 자기신고 입력 추가) | engine.js — 공통 로직
   (config 로드, 화면 전환, 채점, 렌더, 결과 공유카드 저장, 관련 테스트 배너, 카카오톡 공유,
   메인 사이트로 돌아가기 링크) 순수 바닐라 JS. 외부 라이브러리 없음. 기능별 함수로 분리해 유지보수.
   결과 화면의 "이미지 저장" 기능은 별도 파일 result-card.js(window.TestEngineResultCard)에 위임한다.
   카카오 SDK 로드+초기화와 "메인으로" 링크는 이 파일이 init() 시점에 자동으로 주입한다 —
   새 테스트를 추가할 때 index.html에 별도로 스크립트/마크업을 추가할 필요가 없다(자동 적용).

   STEP 4: sum 채점(등급 구간)에 선택적 보조 태그 집계를 추가 — choice.tag가 있는 선택지만
   카운트해서 가장 많이 나온 태그를 결과에 merge(result.tag)한다. mental-age처럼 choice.tag가
   전혀 없는 기존 config는 tagCounts가 항상 빈 객체라 동작이 완전히 그대로 유지된다(하위호환).
   결과 카드 텍스트(subtitle/traits/tip)에 "{tag}" 플레이스홀더를 쓰면 렌더 시점에 치환되고,
   태그가 하나도 안 걸렸을 땐 결과 항목의 tagFallback 값으로 대체한다(빌런 지수 테스트 참고).

   STEP 5: 기존 axis(좌/우 단일 축)로는 16유형 MBTI를 산출할 수 없어(4축 동시 계산 불가) 신규
   scoring_type 2종을 추가— `mbti4`(choice.axis: E/I/S/N/T/F/J/P 4쌍 동시 집계→4글자 코드 산출)와
   `mbti4_dual`(question.block: 'outer'|'inner'로 두 세트를 독립 집계→코드 2개, "겉 MBTI/속 MBTI"류).
   결과 콘텐츠는 16(또는 256)개를 전부 손으로 쓰는 대신 config.resultTemplate 하나에
   "{code}"/"{outer}"/"{inner}"/"{claimed}" 플레이스홀더를 써서 즉석 생성하는 게 기본 전략
   (fillVarsTemplate) — 특정 코드만 결과를 다듬고 싶으면 results[]에 res.code로 끼워 넣으면 그
   항목이 우선 적용된다. 인트로 화면에 config.intro_input(라벨+옵션 배열)을 넣으면 테스트 시작
   전 자기신고 값(예: "당신이 생각하는 내 MBTI는?")을 드롭다운으로 받아 state.introInputValue에
   저장하고, mbti4 결과의 "{claimed}" 플레이스홀더로 사용할 수 있다(#20 메타 테스트용).
   intro_input이 없는 기존 config는 렌더링에 아무 변화가 없다(하위호환).

   STEP 6: mbti4 채점이 내부적으로 이미 계산해두던 축별 비율(codeFromCounts의 ratios)을
   fillVarsTemplate의 vars에 "{e}"/"{n}"/"{f}"/"{j}"(각각 E/N/F/J 쪽으로 기운 정도, 0~100
   정수%)로 추가 노출 — 새 scoring_type이 아니라 mbti4가 이미 구하던 값을 한 군데 더
   꺼내 쓰는 것뿐이라 이 필드를 참조하지 않는 기존 config(resultTemplate에 {e}등이 없는
   경우)는 렌더링에 아무 변화가 없다(하위호환, mbti-stat-window 테스트가 실사용 예시). */

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
    tagCounts: {},
    typeCounts: {},
    correctCount: 0,
    axisScore: { left: 0, right: 0 },
    mbtiCounts: makeMbtiCounter(),
    mbtiCountsOuter: makeMbtiCounter(),
    mbtiCountsInner: makeMbtiCounter(),
    introInputValue: ''
  };

  var MBTI_PAIRS = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
  function makeMbtiCounter() { return { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }; }

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

    // config.intro_input(선택): 결과 화면에서 "당신이 주장한 유형 vs AI 판정"처럼 자기신고 값과
    // 비교하고 싶을 때 인트로에 드롭다운 하나를 추가한다. 없으면 기존과 동일하게 렌더된다.
    var introInputHtml = '';
    if (c.intro_input && Array.isArray(c.intro_input.options) && c.intro_input.options.length) {
      var optionsHtml = c.intro_input.options
        .map(function (o) { return '<option value="' + escapeAttr(o) + '">' + escapeHtml(o) + '</option>'; })
        .join('');
      introInputHtml =
        '<label class="te-intro-input-label" for="te-intro-input">' + escapeHtml(c.intro_input.label || '') + '</label>' +
        '<select class="te-intro-input" id="te-intro-input">' + optionsHtml + '</select>';
    }

    rootEl.innerHTML =
      '<div class="te-app te-screen-intro te-has-fixed-footer">' +
        '<div class="te-intro-cover">' +
          '<img src="' + escapeAttr(c.cover_image) + '" alt="' + escapeAttr(c.title) + '" class="te-cover-img" style="width:100%;display:block;" />' +
        '</div>' +
        '<div class="te-intro-body">' +
          '<h1 class="te-title">' + escapeHtml(c.title) + '</h1>' +
          '<p class="te-desc">' + escapeHtml(c.description) + '</p>' +
          '<div class="te-chip-row">' + hashtags + '</div>' +
          introInputHtml +
        '</div>' +
        '<div class="te-choices-fixed te-intro-footer">' +
          '<button type="button" class="te-btn te-btn-primary" id="te-start-btn">테스트 시작</button>' +
          '<p class="te-seen-count">지금까지 <strong>' + getSeenCount().toLocaleString('ko-KR') + '</strong>명이 확인했어요</p>' +
        '</div>' +
      '</div>';

    qs('#te-start-btn').addEventListener('click', function () {
      var inputEl = qs('#te-intro-input');
      state.introInputValue = inputEl ? inputEl.value : '';
      startTest();
    });
    syncFixedFooterHeight();
  }

  function startTest() {
    state.questionIndex = 0;
    state.answers = [];
    state.sumScore = 0;
    state.tagCounts = {};
    state.typeCounts = {};
    state.correctCount = 0;
    state.axisScore = { left: 0, right: 0 };
    state.mbtiCounts = makeMbtiCounter();
    state.mbtiCountsOuter = makeMbtiCounter();
    state.mbtiCountsInner = makeMbtiCounter();
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
    syncFixedFooterHeight();
  }

  function selectChoice(question, choiceIndex) {
    var choice = question.choices[choiceIndex];
    state.answers.push(choice);
    applyScoring(choice, question);

    if (state.questionIndex < state.config.questions.length - 1) {
      state.questionIndex += 1;
      renderQuestion();
    } else {
      renderLoading();
    }
  }

  function applyScoring(choice, question) {
    switch (state.config.scoring_type) {
      case 'sum':
        state.sumScore += Number(choice.score) || 0;
        if (choice.tag) {
          state.tagCounts[choice.tag] = (state.tagCounts[choice.tag] || 0) + 1;
        }
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
      case 'mbti4':
        // choice.axis: 'E'|'I'|'S'|'N'|'T'|'F'|'J'|'P', choice.weight: number (기본 1) — 4축 동시 집계
        if (choice.axis && state.mbtiCounts.hasOwnProperty(choice.axis)) {
          state.mbtiCounts[choice.axis] += Number(choice.weight) || 1;
        }
        break;
      case 'mbti4_dual':
        // question.block: 'outer'|'inner'로 두 세트의 4축을 독립 집계(겉 MBTI/속 MBTI 등)
        if (choice.axis) {
          var bucket = (question && question.block === 'inner') ? state.mbtiCountsInner : state.mbtiCountsOuter;
          if (bucket.hasOwnProperty(choice.axis)) bucket[choice.axis] += Number(choice.weight) || 1;
        }
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
      case 'mbti4': return computeMbti4Result(c);
      case 'mbti4_dual': return computeMbti4DualResult(c);
      default:
        console.warn('[test-engine] 알 수 없는 scoring_type: ' + c.scoring_type);
        return c.results[0];
    }
  }

  function computeSumResult(c) {
    var score = state.sumScore;
    var matched = c.results.filter(function (r) { return score >= r.min && score <= r.max; })[0];
    var base = matched || c.results[c.results.length - 1];
    // choice.tag를 쓰는 config가 없으면(mental-age 등) bestTag/tagFallback 둘 다 falsy라
    // merged.tag는 빈 문자열로만 남고 렌더 결과는 기존과 완전히 동일하다.
    var bestTag = computeBestTag();
    var merged = {};
    Object.keys(base).forEach(function (k) { merged[k] = base[k]; });
    merged.tag = bestTag || base.tagFallback || '';
    return merged;
  }

  function computeBestTag() {
    var best = null;
    var bestCount = -1;
    Object.keys(state.tagCounts).forEach(function (tag) {
      if (state.tagCounts[tag] > bestCount) {
        bestCount = state.tagCounts[tag];
        best = tag;
      }
    });
    return best;
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

  // choice.axis 카운트(E/I/S/N/T/F/J/P)에서 4글자 MBTI 코드 산출 — 동점이면 각 쌍의 앞 글자
  // (E/S/T/J)로 처리(공식 규칙이 있는 게 아니라 이 엔진의 결정적 기본값).
  function codeFromCounts(counts) {
    var code = '';
    var ratios = {};
    MBTI_PAIRS.forEach(function (pair) {
      var a = counts[pair[0]] || 0;
      var b = counts[pair[1]] || 0;
      var total = a + b || 1;
      code += (b > a) ? pair[1] : pair[0];
      ratios[pair[0] + pair[1]] = Math.round((b / total) * 100); // 뒷글자(I/N/F/P) 비율 %
    });
    return { code: code, ratios: ratios };
  }

  // STEP 6: 퍼센트(0~100)를 10칸 이모지 블록 막대로 변환 — 텍스트 치환만 하는 fillVarsTemplate으로는
  // "값에 비례한 막대 길이"를 만들 수 없어 이 계산만 별도 헬퍼로 분리(순수 함수, 렌더링 로직 아님).
  function statBar(pct) {
    var filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
  }

  function computeMbti4Result(c) {
    var r = codeFromCounts(state.mbtiCounts);
    var eVal = 100 - r.ratios.EI, nVal = r.ratios.SN, fVal = r.ratios.TF, jVal = 100 - r.ratios.JP;
    var vars = {
      code: r.code,
      claimed: state.introInputValue || '',
      // STEP 6: 이미 계산돼있던 r.ratios(I/N/F/P 비율)를 앞글자(E/N/F/J) 기준 퍼센트로 뒤집어
      // 템플릿에서 바로 쓸 수 있게 노출 — 능력치/스탯 표시류 콘텐츠에서 "{e}%"/"{ebar}" 식으로 사용.
      e: eVal, n: nVal, f: fVal, j: jVal,
      ebar: statBar(eVal), nbar: statBar(nVal), fbar: statBar(fVal), jbar: statBar(jVal)
    };
    var matched = (c.results || []).filter(function (res) { return res.code === r.code; })[0];
    var merged = fillVarsTemplate(matched || c.resultTemplate || {}, vars);
    merged.code = r.code;
    merged.axisRatios = r.ratios;
    if (state.introInputValue) merged.claimed = state.introInputValue;
    return merged;
  }

  function computeMbti4DualResult(c) {
    var outer = codeFromCounts(state.mbtiCountsOuter);
    var inner = codeFromCounts(state.mbtiCountsInner);
    var vars = { outer: outer.code, inner: inner.code };
    var merged = fillVarsTemplate(c.resultTemplate || {}, vars);
    merged.outerCode = outer.code;
    merged.innerCode = inner.code;
    return merged;
  }

  // scoring_type이 mbti4/mbti4_dual일 때: title/subtitle/traits[]/tip 안의 "{code}"/"{outer}"/
  // "{inner}"/"{claimed}" 같은 플레이스홀더를 실제 계산값으로 치환한다. 손으로 쓴 results[]
  // 항목(res.code 매칭)이든 config.resultTemplate로 즉석 생성한 경량 콘텐츠든 동일하게 적용되므로,
  // 16개 결과를 전부 손으로 쓰지 않고 템플릿 하나로 대체하는 것도, 특정 코드만 손으로 다듬어
  // results[]에 끼워 넣는 것도 둘 다 자연스럽게 지원한다(2026-07-10 합의: 기본은 템플릿형).
  function fillVarsTemplate(src, vars) {
    function fill(str) {
      var out = String(str || '');
      Object.keys(vars).forEach(function (k) {
        out = out.split('{' + k + '}').join(vars[k]);
      });
      return out;
    }
    return {
      title: fill(src.title) || Object.keys(vars).map(function (k) { return vars[k]; }).join(' / '),
      subtitle: fill(src.subtitle),
      image: src.image || '',
      traits: (src.traits || []).map(fill),
      tip: fill(src.tip)
    };
  }

  // ---------- 화면: 결과 ----------
  function renderResult(result) {
    var traits = (result.traits || [])
      .map(function (t) { return '<li>' + escapeHtml(applyTagTemplate(t, result.tag)) + '</li>'; })
      .join('');

    var relatedIds = (state.config.related || []).filter(Boolean);
    var relatedHtml = relatedIds.length ? '<div id="te-related-container" class="te-related"></div>' : '';

    rootEl.innerHTML =
      '<div class="te-app te-screen-result te-has-fixed-footer">' +
        '<div class="te-result-body">' +
          '<img src="' + escapeAttr(result.image) + '" alt="' + escapeAttr(result.title) + '" class="te-result-img" style="width:100%;display:block;" />' +
          '<h2 class="te-result-title">' + escapeHtml(result.title) + '</h2>' +
          '<p class="te-result-subtitle">' + escapeHtml(applyTagTemplate(result.subtitle || '', result.tag)) + '</p>' +
          '<ul class="te-result-traits">' + traits + '</ul>' +
          '<p class="te-result-tip">' + escapeHtml(applyTagTemplate(result.tip || '', result.tag)) + '</p>' +
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
    syncFixedFooterHeight();

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

  // 하단 고정 버튼바(.te-choices-fixed)는 화면마다 버튼 개수가 다른데(인트로 1개/질문 2~N개/
  // 결과 4개), engine.css의 --te-footer-height(132px)는 고정값이라 선택지가 3개 이상인 질문
  // (예: type 채점처럼 선택지가 6개인 테스트)에서 버튼바가 실제로는 더 커져 본문과 겹치거나
  // 화면 아래로 잘려 보이는 문제가 있었음(2026-07-10 발견). 렌더 직후 실제 버튼바 높이를
  // 측정해 .te-app의 padding-bottom을 정확히 맞춰준다 — 버튼 개수와 무관하게 항상 정확.
  function syncFixedFooterHeight() {
    requestAnimationFrame(function () {
      var appEl = qs('.te-app');
      var footerEl = qs('.te-choices-fixed');
      if (!appEl || !footerEl) return;
      appEl.style.paddingBottom = footerEl.offsetHeight + 'px';
    });
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function escapeAttr(str) { return escapeHtml(str); }

  // sum 채점 결과 텍스트의 "{tag}" 플레이스홀더를 computeSumResult()가 merge한 result.tag로 치환.
  // tag가 없는 config(mental-age 등)는 "{tag}" 자체를 안 쓰므로 무해하게 그대로 통과한다.
  function applyTagTemplate(str, tag) {
    if (!tag) return str;
    return String(str).replace(/\{tag\}/g, tag);
  }

  // ---------- 시작 ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
