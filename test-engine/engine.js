/* test-engine v15 (config.image_choices/affinity_meter/point_budget — 게임형 개편 2차 배치 추가) | engine.js — 공통 로직
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
   경우)는 렌더링에 아무 변화가 없다(하위호환, mbti-stat-window 테스트가 실사용 예시).

   v6(2026-07-11): ①웹폰트 비동기 로딩으로 결과 화면 하단 고정 버튼바가 커지며 본문과
   겹치던 문제 수정 — syncFixedFooterHeight()가 document.fonts.ready 완료 후 한 번 더
   재측정 + 화면 회전 등 대비 window resize 리스너 추가. ②이 파일(engine.js)과
   engine.css/result-card.js가 여태 캐시버스팅 쿼리스트링이 전혀 없어서, 방금 배포한 위 수정을
   포함해 이 파일이 바뀔 때마다 Cloudflare/브라우저가 몇 시간씩 구버전을 계속 서빙할 수 있는
   상태였음(메인 사이트 index.html은 v0.6.5부터 ?v= 캐시버스팅이 있는데 이 폴더만 빠져있었음)
   — 10개 완성 테스트의 index.html 전부에 engine.js/engine.css/result-card.js "?v=" 추가,
   동적 주입되는 themes(각 css)는 아래 ENGINE_ASSET_VERSION 하나로 중앙 관리(themes 파일이
   바뀔 땐 이 상수만 올리면 됨). 앞으로 engine.js/engine.css/result-card.js를 고칠 때마다 반드시
   1) 이 헤더의 "vN"과 아래 ENGINE_ASSET_VERSION을 새 번호로 올리고
   2) tests 폴더 아래 완성된 테스트 10개 index.html 전부의 해당 "?v="도 같은 번호로 일괄
      교체할 것(engine.js와 engine.css와 result-card.js 세 파일의 물음표-v 쿼리스트링을
      한 번에 sed로 치환하면 됨) — 안 하면 이번과 같은 "고쳤는데 반영이 안 된 것처럼 보이는"
      배포 지연 버그가 재발한다.

   v7(2026-07-11): 하단 고정 버튼바(.te-choices-fixed)가 배경이 투명해서, 스크롤 중 본문
   (이미지/텍스트)이 버튼 사이 틈으로 그대로 비쳐 겹쳐 보이던 문제 수정(v6의 padding-bottom
   보정과는 별개 이슈, 사용자 스크린샷 제보). engine.css가 버튼바에 상단만 페이드되는 불투명
   배경(var(--te-footer-bg))을 깔고, 테마 10종 전부가 .te-app에 자기 페이지 배경과 같은 톤의
   --te-footer-bg를 정의. engine.js 자체 로직 변경은 없고 ENGINE_ASSET_VERSION만 6→7
   (themes/*.css 캐시버스팅용).

   v8(2026-07-12): mbti4_dual이 지금까지 resultTemplate 하나로만 렌더링돼(겉/속 256개 조합이
   전부 같은 문구) MBTI존 9개 테스트가 전부 "결과가 하나뿐"이라는 지적을 받아, mbti4와 동일한
   패턴으로 computeMbti4DualResult에도 c.results 매칭을 추가 — outer.code로 results[]를 찾고
   (겉모습이 주 정체성이므로), 있으면 그 항목을, 없으면 기존처럼 resultTemplate을 폴백으로 쓴다.
   vars에 {outer}/{inner}는 그대로 유지해 매칭된 결과 텍스트 안에서도 "{inner}"로 속마음 코드를
   계속 언급할 수 있다. results가 비어있는 기존/향후 mbti4_dual config는 완전히 그대로 동작
   (하위호환, 이 변경 이전 동작과 동일).

   v9(2026-07-12): 하단 버튼바-본문 겹침 버그를 근본 수정 — engine.css가 `.te-choices-fixed`를
   `position:fixed`에서 플렉스박스 sticky footer 패턴(`position:sticky; bottom:0;
   margin-top:auto`, 상세는 engine.css 상단 v6 코멘트 참고)으로 전환하면서, 버튼바 실제 높이를
   측정해 본문에 padding-bottom을 미리 얹어두던 `syncFixedFooterHeight()`가 완전히 불필요해져
   삭제(호출 3곳 + resize 리스너 + document.fonts.ready 후처리까지 전부 제거). 새 레이아웃은
   버튼바가 항상 본문 "다음"에 위치하는 구조라 애초에 겹칠 수 없으므로 별도 JS 측정이 필요 없음.

   v10(2026-07-17): 21~40번 배치 기획서(gwamol_test_ideas md 맨 끝 "작업 메모")에 명시돼 있던
   "novel mechanic 5종"이 실제 콘텐츠 제작 때 전부 누락된 걸 발견해 복구 — 전부 opt-in
   config 필드/신규 scoring_type이라 이 필드들을 쓰지 않는 기존 config는 렌더링·채점에
   아무 변화가 없다(기존 STEP 4~6과 동일한 하위호환 원칙).
   ① `config.timer_sec`(숫자): 문항마다 카운트다운을 띄우고, 시간 안에 못 고르면
      `handleTimeout()`이 그 문항을 무응답 처리하며 `state.timeoutCount`만 올리고 다음 문항으로
      진행(#21). 클릭/타임아웃 중 하나만 한 번 처리되도록 `state.questionLocked`로 이중 진행을
      막고, 기존 `selectChoice()`의 "다음 문항 또는 로딩" 진행부를 `advance()`로 추출해
      `handleTimeout()`과 공유한다.
   ② `config.chat_ui`(불리언): 질문/선택지를 평문 버튼 대신 카카오톡풍 말풍선으로 렌더(#25).
      스코어링(`type`)은 완전히 동일 — 렌더링 전용 레이어라 `applyScoring`/`computeResult`는
      손대지 않았다.
   ③ `config.questions_tree`(노드맵) + `config.start_node`: 기존 `questions[]` 배열 대신 노드
      그래프를 순회하는 분기 시나리오(#30). 각 choice의 `next`가 다음 노드 id, 없으면 결과로
      진행. `renderQuestion()`이 최상단에서 `c.questions_tree` 유무로 분기해 `renderTreeQuestion()`
      으로 위임하므로 `questions_tree`가 없는 기존 config는 이 분기 자체를 안 탄다. 조기 종료
      경로(예: 초반에 죽는 엔딩)에서도 의도한 결과가 확실히 나오도록 `type` 채점이 `choice.weight`
      (선택, 기본 1)를 반영하도록 같이 확장 — weight를 안 쓰는 기존 type 테스트는 매 선택 +1
      그대로라 무변화.
   ④ `config.slider_ui`(불리언): 기존 `sum`/`score` 로직은 그대로 두고 렌더링만 range input
      슬라이더로 교체(#33) — choices[].score가 이미 등간격이라 스코어링 변경이 전혀 필요 없었다.
   ⑤ 신규 `scoring_type: 'reaction_time'`: 문항 렌더 시각(`state.questionShownAt`)과 클릭 시각의
      차이를 `state.reactionTimes[]`에 쌓아 평균을 `results[].min/max`(ms 단위)로 매칭한다(#39).
      결과 텍스트의 `{avgSec}` 플레이스홀더는 `applyStatTemplate()`이 실제 평균(초)으로 치환한다
      (기존 `{tag}` 치환 패턴과 동일 방식).

   v11(2026-07-18): MBTI존 41~60 배치용 novel mechanic 확장 — `config.awaken_meter`(#41 히어로
   각성). mbti4 채점이 이미 쌓아둔 축별 카운트(state.mbtiCounts)를 진행 중에 미리 꺼내, 문항을
   풀수록 "각성률(진행률) + 4축(E/I·N/S·T/F·J/P) 우세도 막대"가 차오르는 진행형 시각화를
   문항 화면 상단에 얹는다. 새 scoring_type이 아니라 mbti4의 파생값을 렌더링만 하는 것이라
   채점 결과에는 영향이 없고(computeAwakenTargets는 순수 함수), `awaken_meter`가 없는 config는
   awakenMeterHtml/animateAwakenMeter가 호출되지 않아 렌더링에 아무 변화가 없다(하위호환).
   매 문항 렌더 때 직전 프레임값(state.awakenPrev)에서 목표값으로 CSS width 트랜지션을 걸어
   "스르륵 차오르는" 애니메이션을 만든다. #50(스탯 시트)은 STEP 6의 {ebar}류를, #58(전생/환생)은
   STEP 5의 intro_input을 재사용하므로 엔진 변경 없이 config만으로 처리된다.

   v13(2026-07-20): 결과 화면에서 뒤로가기를 누르면 메인 사이트 홈으로 튕겨 다른 테스트를
   이어서 못 하던 문제 대응(메인 사이트 결과 화면에 동일한 버튼을 추가한 것과 짝) —
   "이미지 저장" 버튼 바로 아래에 "🔄 다른 테스트 하러가기" 버튼을 추가, 클릭하면 이 테스트가
   속한 카테고리(몰입테스트/MBTI존)로 메인 사이트 심리테스트존을 열어 바로 다른 테스트를
   고를 수 있게 한다. 카테고리는 각 config.json에 신규 추가한 `psych_category`
   ("immersive"|"mbtizone", tests/index.json의 category 필드와 동일 매핑, 61개 config.json
   전부 반영) 값을 그대로 `/#psychtest?category=` 쿼리로 넘긴다 — 메인 사이트(app.js)의
   initPsychtest()가 이 쿼리를 읽어 해당 카테고리 화면으로 바로 진입하도록 별도 반영(app.js
   쪽 변경, 이 파일과 무관). psych_category가 없는 config(이론상 없어야 하지만 방어적으로)는
   쿼리 없이 `/#psychtest`(서브 메인 개요 페이지)로만 보낸다.

   v14(2026-07-20): MBTI존 52~57 게임형 개편 배치의 첫 파일럿 — `config.resource_meters`
   (#53 종말 후 부족 리더). 문항 화면 상단에 "식량·식수·사기" 같은 자원 게이지 대시보드를 얹고,
   각 선택지의 `choice.delta`(예: {food:+2,water:-1,morale:+1})만큼 게이지가 오르내리는 생존
   시뮬 연출을 준다. awaken_meter(#41)와 완전히 같은 전략 — 새 scoring_type이 아니라 기존
   mbti4 채점은 그대로 두고 게이지는 순수 렌더링/연출 레이어(applyScoring/computeResult 미변경)라
   채점 결과에 전혀 영향이 없다. resource_meters/choice.delta가 없는 기존 60개 config는
   resetResources/resourceMeterHtml/animateResourceMeter/applyResourceDelta가 호출되지 않아
   렌더링·채점에 아무 변화가 없다(하위호환). 직전 프레임값(state.resourcePrev)에서 목표값
   (state.resourceValues)으로 CSS width 트랜지션을 걸어 "스르륵" 차오르고 줄어들게 하고, 결과
   화면에는 자원 평균 기반 "부족 생존 지수 N% + 판정"을 부가 스탯으로 노출한다.

   v15(2026-07-21): MBTI존 52~57 게임형 개편 2차 배치 — 나머지 3개 신규 메커니즘.
   이전 v11/v14와 동일 원칙(새 scoring_type이 아니라 mbti4 위에 얹는 순수 opt-in 연출/보조
   레이어, applyScoring/computeResult의 mbti4 채점 자체는 무변경, 필드가 없는 기존 config는
   아래 함수들이 전혀 호출되지 않아 렌더링에 무변화)을 그대로 따른다.
   ① `config.image_choices`(#52 반려동물 판별기): `{ icons: {E:'🐾', I:'😼', ...} }` — 문항
      선택지 버튼을 아이콘+텍스트 카드로 렌더하고, 답할 때마다 고른 축의 아이콘이 상단
      "수집 스티커판"에 하나씩 쌓인다(state.answers를 그대로 훑어 렌더만 하는 파생값이라
      별도 상태 저장 불필요). 결과 화면엔 완성된 8개 스티커 줄을 부가 스탯으로 노출.
   ② `config.affinity_meter`(#54 로맨스 웹툰): `{ init, max }` — 자원게이지(#53)의 단일 값
      버전. 선택지의 숫자 `choice.delta`만큼 호감도가 오르내리고, 선택지에 `choice.reaction`
      문구가 있으면 다음 문항 상단에 "상대가 살짝 웃었다" 식 반응 한 줄이 함께 뜬다. 결과
      화면엔 최종 호감도%+엔딩 등급(운명적 로맨스/썸/다음 화 기약)을 부가 스탯으로 노출.
   ③ `config.point_budget`(#55 판타지 무기): `{ pool, stats:[{key,label}] }` — 인트로의
      "테스트 시작" 클릭 직후, 8문항을 시작하기 전에 고정 포인트를 스탯 4종에 직접 배분하는
      화면을 하나 끼워 넣는다(`renderPointBudgetScreen`, +/- 스테퍼, 포인트 전부 소진해야
      "시작하기" 활성화). 이 배분은 mbti4 8문항 채점과 완전히 무관한 별도 상태(state.pointBudget)
      라 축 코드 산출에 전혀 영향 없고, 가장 많이 투자한 스탯 라벨을 `{topstat}` 플레이스홀더로
      결과 텍스트에 노출 + 결과 화면에 4개 스탯 막대(statBar 재사용)를 부가 스탯으로 보여준다. */

(function () {
  'use strict';

  // engine.js 자체가 바뀔 때마다 이 번호를 올리고, 위 헤더 안내대로 10개 index.html의
  // engine.js/engine.css/result-card.js ?v=도 같은 번호로 맞출 것 — themes/*.css는
  // injectThemeCSS()가 이 상수를 그대로 재사용해 자동으로 캐시버스팅된다(파일별로 안 챙겨도 됨).
  var ENGINE_ASSET_VERSION = '15';

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
    introInputValue: '',
    // v10: novel mechanic 5종용 상태 — 옵트인 config 필드를 안 쓰는 테스트는 아래 값들이
    // 그냥 초기값(0/빈 배열/false)으로만 남아있고 아무 로직에도 관여하지 않는다.
    timeoutCount: 0,       // config.timer_sec(#21)
    reactionTimes: [],     // scoring_type 'reaction_time'(#39)
    currentNode: '',       // config.questions_tree(#30)
    pathLength: 0,         // config.questions_tree(#30) — 진행률 표시용
    questionShownAt: 0,    // scoring_type 'reaction_time'(#39)
    questionLocked: false, // 타이머/클릭 이중 진행 방지(#21)
    timerHandle: null,     // config.timer_sec(#21) — clearActiveTimer() 대상
    // v11: config.awaken_meter(#41) — 문항을 풀수록 4개 축 게이지가 차오르는 진행형 시각화의
    // "직전 프레임" 값(각 축의 앞글자 우세 %, overall=각성률 %). 다음 문항 렌더 때 이 값에서
    // 목표값으로 CSS 트랜지션을 걸어 "스르륵 차오르는" 애니메이션을 만든다. awaken_meter를 안
    // 쓰는 config는 이 값이 초기값으로만 남고 아무 로직에도 관여하지 않는다.
    awakenPrev: { overall: 0, EI: 50, NS: 50, TF: 50, JP: 50 },
    // v14: config.resource_meters(#53) — 자원 게이지 현재값/직전 프레임값. resource_meters를 안
    // 쓰는 config는 두 값이 빈 객체로만 남고 아무 로직에도 관여하지 않는다(하위호환).
    resourceValues: {},
    resourcePrev: {},
    // v15: config.affinity_meter(#54) — 단일 호감도 값 현재/직전 프레임. 없는 config는 무관여.
    affinityValue: 0,
    affinityPrev: 0,
    // v15: config.point_budget(#55) — 스탯별 배분 포인트. mbti4 채점과 별개 상태라 없는 config는
    // 빈 객체로만 남고 결과 계산에 전혀 관여하지 않는다.
    pointBudget: {}
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

  // 결과 화면 "다른 테스트 하러가기" 버튼 — 이 테스트가 속한 카테고리(config.psych_category:
  // "immersive"|"mbtizone")로 메인 사이트 심리테스트존을 바로 열어준다(app.js의 initPsychtest()가
  // ?category= 쿼리를 읽어 처리, v13 헤더 코멘트 참고). 값이 없으면 서브 메인 개요 페이지로만 이동.
  function goToOtherTests() {
    var category = state.config && state.config.psych_category;
    location.href = category ? '/#psychtest?category=' + category : '/#psychtest';
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
    // themes/*.css는 engine.js가 동적으로 <link>를 주입하는 방식이라(정적 태그가 아님)
    // 여기서만 버전을 올리면 21개 index.html을 손대지 않고도 캐시버스팅됨(아래 ENGINE_ASSET_VERSION
    // 참고, engine.js/engine.css/result-card.js처럼 정적 <script>/<link>로 로드되는 파일은
    // 각 index.html의 ?v=를 직접 올려야 함 — 2026-07-11 발견: 캐시버스팅 자체가 아예 없어서
    // 배포 후에도 브라우저/Cloudflare가 구버전 engine.js를 계속 서빙하던 문제가 있었음).
    link.href = ENGINE_BASE + 'themes/' + themeName + '.css?v=' + ENGINE_ASSET_VERSION;
    link.dataset.teTheme = themeName;
    document.head.appendChild(link);
  }

  // ---------- localStorage 완료 카운터 ----------
  // v0.8.9~: 메인 사이트 홈 화면 "이번주 인기 TOP"이 이 테스트를 가리킬 때 보여주는 숫자와
  // 이 화면 자체가 보여주는 "지금까지 N명이 확인했어요"가 서로 다른 카운터라 숫자가 어긋나는
  // 문제를 사용자가 실기기에서 발견 — config.json에 engagement_key(메인 사이트 data.js의
  // engagementKey와 동일 문자열)가 있으면 메인 사이트와 완전히 같은 localStorage 키
  // (engage_{engagementKey})를 그대로 읽고 써서 두 화면의 숫자가 항상 정확히 일치하게 함.
  // engagement_key가 없는 테스트(아직 메인 사이트에 연동 전인 초안)는 기존 방식 그대로 유지.
  function getCompletionKey() {
    if (state.config.engagement_key) return 'engage_' + state.config.engagement_key;
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
      // v15: config.point_budget(#55) — 문항 시작 전에 포인트 배분 화면을 하나 끼워 넣는다.
      if (c.point_budget) renderPointBudget(); else startTest();
    });
  }

  function startTest() {
    var c = state.config;
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
    state.timeoutCount = 0;
    state.reactionTimes = [];
    state.awakenPrev = { overall: 0, EI: 50, NS: 50, TF: 50, JP: 50 }; // v11(#41)
    if (c.resource_meters) resetResources(); // v14(#53)
    if (c.affinity_meter) resetAffinity(); // v15(#54)
    state.currentNode = c.questions_tree ? c.start_node : '';
    state.pathLength = 0;
    state.questionLocked = false;
    clearActiveTimer();
    renderQuestion();
  }

  // ---------- 화면: 질문 (루프) ----------
  function renderQuestion() {
    var c = state.config;
    state.questionLocked = false;

    // v10: config.questions_tree(#30)가 있으면 인덱스 배열이 아니라 노드 그래프를 순회한다 —
    // 이 필드가 없는 기존 24개 테스트는 아래로 내려가지 않고 기존 경로 그대로 탄다.
    if (c.questions_tree) {
      renderTreeQuestion();
      return;
    }

    var total = c.questions.length;
    var idx = state.questionIndex;
    var q = c.questions[idx];
    var progress = Math.round((idx / total) * 100);

    var imageHtml = q.image
      ? '<img src="' + escapeAttr(q.image) + '" alt="" class="te-question-img" />'
      : '';

    var questionTextHtml = c.chat_ui
      ? '<div class="te-chat-thread">' +
          '<div class="te-chat-bubble te-chat-bubble-them te-chat-typing" id="te-chat-typing"><span></span><span></span><span></span></div>' +
          '<div class="te-chat-bubble te-chat-bubble-them" id="te-chat-message" style="display:none;">' + escapeHtml(q.text) + '</div>' +
        '</div>'
      : '<h2 class="te-question-text">' + escapeHtml(q.text) + '</h2>';

    var timerHtml = c.timer_sec
      ? '<div class="te-timer-wrap">' +
          '<div class="te-timer-count" id="te-timer-count">' + c.timer_sec + '</div>' +
          '<div class="te-timer-bar"><div class="te-timer-bar-fill" id="te-timer-bar-fill"></div></div>' +
        '</div>'
      : '';

    // config.awaken_meter(#41): 각성률 + 4축 게이지 (mbti4 전용, 이미 쌓인 카운트 기준)
    var awakenHtml = c.awaken_meter ? awakenMeterHtml() : '';

    // config.resource_meters(#53): 식량·식수·사기 같은 자원 게이지 생존 대시보드 (연출 전용)
    var resourceHtml = c.resource_meters ? resourceMeterHtml() : '';

    // config.affinity_meter(#54): ♥ 호감도 게이지 (연출 전용)
    var affinityHtml = c.affinity_meter ? affinityMeterHtml() : '';

    // config.image_choices(#52): 답할 때마다 쌓이는 수집 스티커판 (연출 전용)
    var collectHtml = c.image_choices ? collectionStripHtml() : '';

    var choicesHtml;
    if (c.slider_ui) {
      var mid = Math.floor((q.choices.length - 1) / 2);
      choicesHtml =
        '<p class="te-slider-label" id="te-slider-label">' + escapeHtml(q.choices[mid].label) + '</p>' +
        '<input type="range" class="te-slider-input" id="te-slider-input" min="0" max="' + (q.choices.length - 1) + '" step="1" value="' + mid + '">' +
        '<button type="button" class="te-btn te-btn-primary te-slider-confirm" id="te-slider-confirm">다음</button>';
    } else if (c.chat_ui) {
      choicesHtml = q.choices
        .map(function (choice, i) {
          return '<button type="button" class="te-btn te-chat-bubble te-chat-bubble-me" data-choice-index="' + i + '">' +
            escapeHtml(choice.label) +
          '</button>';
        })
        .join('');
    } else if (c.image_choices) {
      // config.image_choices(#52): 선택지를 아이콘+텍스트 카드로 렌더 — 축(choice.axis)에 매핑된
      // 이모지를 config.image_choices.icons에서 찾아 보여준다(없으면 기본 ⭐).
      var icIcons = imageChoiceIcons();
      choicesHtml = q.choices
        .map(function (choice, i) {
          var icon = icIcons[choice.axis] || '⭐';
          return '<button type="button" class="te-btn te-btn-choice te-btn-choice-img" data-choice-index="' + i + '">' +
            '<span class="te-choice-icon">' + escapeHtml(icon) + '</span>' +
            '<span class="te-choice-label">' + escapeHtml(choice.label) + '</span>' +
          '</button>';
        })
        .join('');
    } else {
      choicesHtml = q.choices
        .map(function (choice, i) {
          return '<button type="button" class="te-btn te-btn-choice" data-choice-index="' + i + '">' +
            escapeHtml(choice.label) +
          '</button>';
        })
        .join('');
    }

    rootEl.innerHTML =
      '<div class="te-app te-screen-question te-has-fixed-footer">' +
        '<div style="padding:12px 20px 0;">' +
          '<div class="te-progress-track"><div class="te-progress-fill" style="width:' + progress + '%"></div></div>' +
        '</div>' +
        '<div class="te-question-body">' +
          '<p class="te-question-counter">' + (idx + 1) + ' / ' + total + '</p>' +
          awakenHtml +
          resourceHtml +
          affinityHtml +
          collectHtml +
          timerHtml +
          imageHtml +
          questionTextHtml +
        '</div>' +
        '<div class="te-choices-fixed te-question-footer">' +
          choicesHtml +
        '</div>' +
      '</div>';

    // scoring_type 'reaction_time'(#39): 문항이 실제로 화면에 커밋된 직후 시각을 기준점으로 삼는다.
    if (c.scoring_type === 'reaction_time') state.questionShownAt = performance.now();

    if (c.chat_ui) {
      setTimeout(function () {
        var typingEl = qs('#te-chat-typing');
        var msgEl = qs('#te-chat-message');
        if (typingEl) typingEl.style.display = 'none';
        if (msgEl) msgEl.style.display = '';
      }, 400);
    }

    if (c.slider_ui) {
      var sliderEl = qs('#te-slider-input');
      var sliderLabelEl = qs('#te-slider-label');
      sliderEl.addEventListener('input', function () {
        sliderLabelEl.textContent = q.choices[Number(sliderEl.value)].label;
      });
      qs('#te-slider-confirm').addEventListener('click', function () {
        selectChoice(q, Number(sliderEl.value));
      });
    } else {
      qsa('[data-choice-index]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var choiceIndex = Number(btn.dataset.choiceIndex);
          selectChoice(q, choiceIndex);
        });
      });
    }

    // config.awaken_meter(#41): 렌더 커밋 직후 직전 프레임값 → 이번 목표값으로 게이지를 채운다.
    if (c.awaken_meter) animateAwakenMeter(idx, total);

    // config.resource_meters(#53): 직전 프레임값 → 지금까지 누적된 자원값으로 게이지를 옮긴다.
    if (c.resource_meters) animateResourceMeter();

    // config.affinity_meter(#54): 직전 프레임값 → 지금까지 누적된 호감도로 게이지를 옮긴다.
    if (c.affinity_meter) animateAffinityMeter();

    // config.timer_sec(#21): 렌더가 끝나고 리스너까지 붙은 뒤에 카운트다운을 시작한다.
    if (c.timer_sec) {
      startCountdown(c.timer_sec, function (remainingMs) {
        var countEl = qs('#te-timer-count');
        var barEl = qs('#te-timer-bar-fill');
        if (countEl) countEl.textContent = String(Math.ceil(remainingMs / 1000));
        if (barEl) barEl.style.width = Math.max(0, (remainingMs / (c.timer_sec * 1000)) * 100) + '%';
      }, function () {
        handleTimeout(q);
      });
    }
  }

  // ---------- 화면: 질문 (분기 트리, #30) ----------
  // config.questions_tree: { [nodeId]: { text, image, choices: [{ label, type, next }] } },
  // config.start_node: 시작 노드 id. choice.next가 없으면 그 선택으로 시나리오가 종료되고
  // 결과 화면으로 진행한다(예: 초반 선택으로 조기 사망하는 경로).
  function renderTreeQuestion() {
    var c = state.config;
    var node = c.questions_tree[state.currentNode];
    state.pathLength += 1;

    var imageHtml = node.image
      ? '<img src="' + escapeAttr(node.image) + '" alt="" class="te-question-img" />'
      : '';

    var choicesHtml = node.choices
      .map(function (choice, i) {
        return '<button type="button" class="te-btn te-btn-choice" data-choice-index="' + i + '">' +
          escapeHtml(choice.label) +
        '</button>';
      })
      .join('');

    rootEl.innerHTML =
      '<div class="te-app te-screen-question te-has-fixed-footer">' +
        '<div class="te-question-body">' +
          '<p class="te-question-counter">' + state.pathLength + '번째 선택</p>' +
          imageHtml +
          '<h2 class="te-question-text">' + escapeHtml(node.text) + '</h2>' +
        '</div>' +
        '<div class="te-choices-fixed te-question-footer">' +
          choicesHtml +
        '</div>' +
      '</div>';

    qsa('[data-choice-index]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var choiceIndex = Number(btn.dataset.choiceIndex);
        selectTreeChoice(node, choiceIndex);
      });
    });
  }

  function selectTreeChoice(node, choiceIndex) {
    if (state.questionLocked) return;
    state.questionLocked = true;
    var choice = node.choices[choiceIndex];
    state.answers.push(choice);
    applyScoring(choice, node);
    if (choice.next) {
      state.currentNode = choice.next;
      renderQuestion();
    } else {
      renderLoading();
    }
  }

  function selectChoice(question, choiceIndex) {
    if (state.questionLocked) return;
    state.questionLocked = true;
    clearActiveTimer();
    var choice = question.choices[choiceIndex];
    state.answers.push(choice);
    applyScoring(choice, question);
    if (state.config.resource_meters) applyResourceDelta(choice); // v14(#53) — 채점과 무관한 연출값
    if (state.config.affinity_meter) applyAffinityDelta(choice); // v15(#54) — 채점과 무관한 연출값
    advance();
  }

  // config.timer_sec(#21): 시간 안에 못 고른 문항 — 채점에는 반영하지 않고(무응답) 카운트만 올린다.
  function handleTimeout(question) {
    if (state.questionLocked) return;
    state.questionLocked = true;
    state.timeoutCount += 1;
    state.answers.push(null);
    advance();
  }

  // selectChoice/handleTimeout 공통 진행부 — "다음 문항으로" 또는 "로딩(결과 계산)으로".
  function advance() {
    if (state.questionIndex < state.config.questions.length - 1) {
      state.questionIndex += 1;
      renderQuestion();
    } else {
      renderLoading();
    }
  }

  // config.timer_sec(#21) 전용 카운트다운 — Date.now() 기준 deadline과의 차이로 매 tick을
  // 계산해서(고정 카운터 감소가 아니라) 탭이 잠깐 비활성화돼 setInterval이 밀리는 경우에도
  // 어긋나지 않는다.
  function startCountdown(seconds, onTick, onExpire) {
    var deadline = Date.now() + seconds * 1000;
    function tick() {
      var remaining = deadline - Date.now();
      if (remaining <= 0) {
        clearActiveTimer();
        onExpire();
        return;
      }
      onTick(remaining);
    }
    tick();
    state.timerHandle = setInterval(tick, 100);
  }

  function clearActiveTimer() {
    if (state.timerHandle) {
      clearInterval(state.timerHandle);
      state.timerHandle = null;
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
        // v10(#30): choice.weight(선택)이 있으면 그 값만큼, 없으면 기존과 동일하게 1을 더한다 —
        // 분기 트리의 조기 종료 지점처럼 "이 선택 하나가 이전 선택들보다 결과를 확정지어야 하는"
        // 경우에만 쓰고, weight 필드가 없는 기존 type 테스트는 전부 그대로 매 선택 +1이라 무변화.
        if (choice.type) {
          state.typeCounts[choice.type] = (state.typeCounts[choice.type] || 0) + (Number(choice.weight) || 1);
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
      case 'reaction_time':
        // choice 내용 자체는 채점에 안 쓰인다 — 문항 렌더~클릭 사이의 실제 경과시간(ms)만 누적(#39).
        state.reactionTimes.push(performance.now() - state.questionShownAt);
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
      case 'reaction_time': return computeReactionTimeResult(c);
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

  // scoring_type 'reaction_time'(#39): 문항별 실측 경과시간(ms) 평균을 기존 sum/quiz와 같은
  // results[].min/max(단, 단위는 ms) 구간 매칭에 그대로 재사용한다.
  function computeReactionTimeResult(c) {
    var times = state.reactionTimes;
    var avgMs = times.length ? (times.reduce(function (a, b) { return a + b; }, 0) / times.length) : 0;
    var matched = c.results.filter(function (r) { return avgMs >= r.min && avgMs <= r.max; })[0];
    var base = matched || c.results[c.results.length - 1];
    var avgSec = (avgMs / 1000).toFixed(1);
    var merged = {};
    Object.keys(base).forEach(function (k) { merged[k] = base[k]; });
    merged.title = applyStatTemplate(merged.title, avgSec);
    merged.subtitle = applyStatTemplate(merged.subtitle, avgSec);
    merged.tip = applyStatTemplate(merged.tip, avgSec);
    merged.traits = (merged.traits || []).map(function (t) { return applyStatTemplate(t, avgSec); });
    merged.avgReactionMs = Math.round(avgMs);
    return merged;
  }

  // {tag} 치환(applyTagTemplate)과 동일한 패턴 — 결과 텍스트의 "{avgSec}"를 실측 평균(초)으로 치환.
  function applyStatTemplate(str, avgSec) {
    if (str == null) return str;
    return String(str).replace(/\{avgSec\}/g, avgSec);
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

  // v11: config.awaken_meter(#41 히어로 각성) — mbti4가 이미 쌓아둔 축별 카운트(state.mbtiCounts)를
  // 진행 중에 미리 꺼내, "각성률(진행률)" + 4개 축 우세도 막대를 보여주는 진행형 시각화. 새
  // scoring_type이 아니라 mbti4의 파생값을 렌더링만 하는 것이라 채점 결과엔 영향이 없고,
  // awaken_meter가 없는 config는 아래 함수들이 호출되지 않는다(하위호환).
  var AWAKEN_AXES = [
    { key: 'EI', l: 'E', r: 'I', lWord: '표출', rWord: '내면' },
    { key: 'NS', l: 'N', r: 'S', lWord: '직관', rWord: '감각' },
    { key: 'TF', l: 'T', r: 'F', lWord: '이성', rWord: '감성' },
    { key: 'JP', l: 'J', r: 'P', lWord: '계획', rWord: '즉흥' }
  ];
  function computeAwakenTargets(answered, total) {
    var counts = state.mbtiCounts;
    var t = { overall: total ? Math.round((answered / total) * 100) : 0 };
    AWAKEN_AXES.forEach(function (ax) {
      var a = counts[ax.l] || 0, b = counts[ax.r] || 0;
      t[ax.key] = (a + b) ? Math.round((a / (a + b)) * 100) : 50; // 앞글자(왼쪽) 우세 %
    });
    return t;
  }
  function awakenMeterHtml() {
    var p = state.awakenPrev; // 직전 프레임 값에서 시작 → 목표값으로 CSS 트랜지션 애니메이션
    var rows = AWAKEN_AXES.map(function (ax) {
      var lead = (state.mbtiCounts[ax.l] || 0) >= (state.mbtiCounts[ax.r] || 0) ? 'l' : 'r';
      var tie = ((state.mbtiCounts[ax.l] || 0) + (state.mbtiCounts[ax.r] || 0)) === 0;
      return '<div class="te-awaken-axis">' +
          '<span class="te-awaken-side te-awaken-side-l' + (!tie && lead === 'l' ? ' is-lead' : '') + '">' +
            ax.l + '<i>' + ax.lWord + '</i></span>' +
          '<div class="te-awaken-track"><div class="te-awaken-fill" data-axis="' + ax.key + '" style="width:' + p[ax.key] + '%"></div></div>' +
          '<span class="te-awaken-side te-awaken-side-r' + (!tie && lead === 'r' ? ' is-lead' : '') + '">' +
            ax.r + '<i>' + ax.rWord + '</i></span>' +
        '</div>';
    }).join('');
    return '<div class="te-awaken" id="te-awaken">' +
        '<div class="te-awaken-head">' +
          '<span class="te-awaken-label">⚡ 각성률</span>' +
          '<span class="te-awaken-pct" id="te-awaken-pct">' + p.overall + '%</span>' +
        '</div>' +
        '<div class="te-awaken-overall"><div class="te-awaken-overall-fill" id="te-awaken-overall" style="width:' + p.overall + '%"></div></div>' +
        '<div class="te-awaken-axes">' + rows + '</div>' +
      '</div>';
  }
  // 렌더가 커밋된 뒤 목표값으로 폭을 옮겨(트랜지션 발동) 다음 프레임의 시작값으로 저장.
  function animateAwakenMeter(answered, total) {
    var t = computeAwakenTargets(answered, total);
    requestAnimationFrame(function () {
      var pctEl = qs('#te-awaken-pct');
      var ovEl = qs('#te-awaken-overall');
      if (pctEl) pctEl.textContent = t.overall + '%';
      if (ovEl) ovEl.style.width = t.overall + '%';
      qsa('#te-awaken .te-awaken-fill').forEach(function (el) {
        var k = el.dataset.axis;
        if (t.hasOwnProperty(k)) el.style.width = t[k] + '%';
      });
    });
    state.awakenPrev = t;
  }

  // v14: config.resource_meters(#53 종말 후 부족 리더) — "식량·식수·사기" 같은 자원 게이지를
  // 문항마다 choice.delta만큼 오르내리게 하는 생존 시뮬 대시보드. awaken_meter(#41)와 동일하게
  // mbti4 채점에는 전혀 영향이 없고(순수 연출 레이어), resource_meters가 없는 config는 아래
  // 함수들이 호출되지 않아 렌더링에 아무 변화가 없다(하위호환).
  // config.resource_meters: { resources: [{ key, label, emoji, init }], max }
  function resourceConfig() {
    var rm = state.config.resource_meters || {};
    return { list: Array.isArray(rm.resources) ? rm.resources : [], max: rm.max || 10 };
  }
  function clampResource(v, max) { return Math.max(0, Math.min(max, v)); }
  function resetResources() {
    var rc = resourceConfig();
    state.resourceValues = {};
    state.resourcePrev = {};
    rc.list.forEach(function (r) {
      var v = clampResource(typeof r.init === 'number' ? r.init : Math.round(rc.max / 2), rc.max);
      state.resourceValues[r.key] = v;
      state.resourcePrev[r.key] = v;
    });
  }
  // 선택지의 delta({key: 증감})를 현재 자원값에 반영(0~max로 클램프). 채점과 무관한 연출값.
  function applyResourceDelta(choice) {
    if (!choice || !choice.delta) return;
    var rc = resourceConfig();
    rc.list.forEach(function (r) {
      var d = choice.delta[r.key];
      if (typeof d === 'number') {
        state.resourceValues[r.key] = clampResource((state.resourceValues[r.key] || 0) + d, rc.max);
      }
    });
  }
  function resourceMeterHtml() {
    var rc = resourceConfig();
    var rows = rc.list.map(function (r) {
      var prev = state.resourcePrev.hasOwnProperty(r.key) ? state.resourcePrev[r.key] : (r.init || 0);
      var pct = rc.max ? Math.round((prev / rc.max) * 100) : 0;
      var cls = pct <= 25 ? ' is-low' : (pct >= 75 ? ' is-high' : '');
      return '<div class="te-resource-row">' +
          '<span class="te-resource-name">' + (r.emoji ? escapeHtml(r.emoji) + ' ' : '') + escapeHtml(r.label || r.key) + '</span>' +
          '<div class="te-resource-track"><div class="te-resource-fill' + cls + '" data-res="' + escapeAttr(r.key) + '" style="width:' + pct + '%"></div></div>' +
          '<span class="te-resource-val" data-res-val="' + escapeAttr(r.key) + '">' + prev + '</span>' +
        '</div>';
    }).join('');
    return '<div class="te-resource" id="te-resource">' +
        '<div class="te-resource-head"><span class="te-resource-title">🏕️ 부족 생존 지표</span></div>' +
        rows +
      '</div>';
  }
  // 렌더 커밋 직후 현재 누적 자원값으로 폭을 옮겨(트랜지션 발동) 다음 프레임 시작값으로 저장.
  function animateResourceMeter() {
    var rc = resourceConfig();
    requestAnimationFrame(function () {
      rc.list.forEach(function (r) {
        var val = state.resourceValues[r.key] || 0;
        var pct = rc.max ? Math.round((val / rc.max) * 100) : 0;
        var fill = qs('#te-resource .te-resource-fill[data-res="' + r.key + '"]');
        var valEl = qs('#te-resource .te-resource-val[data-res-val="' + r.key + '"]');
        if (fill) {
          fill.style.width = pct + '%';
          fill.classList.remove('is-low', 'is-high');
          if (pct <= 25) fill.classList.add('is-low');
          else if (pct >= 75) fill.classList.add('is-high');
        }
        if (valEl) valEl.textContent = val;
      });
    });
    var snapshot = {};
    rc.list.forEach(function (r) { snapshot[r.key] = state.resourceValues[r.key] || 0; });
    state.resourcePrev = snapshot;
  }
  // 결과 화면용 — 자원 평균 비율(0~100%)과 요약 문자열, 상태 판정을 만든다.
  function computeSurvivalIndex() {
    var rc = resourceConfig();
    if (!rc.list.length) return { pct: 0, parts: '', verdict: '' };
    var ratioSum = 0;
    var parts = rc.list.map(function (r) {
      var v = state.resourceValues[r.key] || 0;
      ratioSum += rc.max ? (v / rc.max) : 0;
      return (r.emoji ? r.emoji + ' ' : '') + (r.label || r.key) + ' ' + v;
    }).join(' · ');
    var pct = Math.round((ratioSum / rc.list.length) * 100);
    var verdict = pct >= 80 ? '풍요로운 부족' : pct >= 55 ? '버틸 만한 부족' : pct >= 30 ? '위태로운 부족' : '멸망 직전의 부족';
    return { pct: pct, parts: parts, verdict: verdict };
  }

  // v15: config.image_choices(#52 반려동물 판별기) — 선택지 버튼을 아이콘+텍스트 카드로 렌더하고,
  // 답한 만큼 상단에 스티커가 쌓이는 수집판을 보여준다. 새 상태 없이 기존 state.answers(이미
  // 매 선택마다 쌓이던 배열)를 그대로 훑어 렌더만 하는 파생값이라 채점과 완전히 무관하다.
  function imageChoiceIcons() {
    var ic = state.config.image_choices;
    return (ic && ic.icons) || {};
  }
  function collectionStripHtml() {
    var icons = imageChoiceIcons();
    var total = state.config.questions.length;
    var stamps = state.answers.map(function (a) {
      var icon = (a && a.axis && icons[a.axis]) || '⭐';
      return '<span class="te-collect-stamp is-stamped">' + escapeHtml(icon) + '</span>';
    }).join('');
    var empty = '';
    for (var i = state.answers.length; i < total; i++) {
      empty += '<span class="te-collect-stamp is-empty">?</span>';
    }
    return '<div class="te-collect-strip" id="te-collect-strip">' +
        '<span class="te-collect-title">🐾 수집판</span>' +
        '<div class="te-collect-row">' + stamps + empty + '</div>' +
      '</div>';
  }

  // v15: config.affinity_meter(#54 로맨스 웹툰) — resource_meters(#53)의 단일 값 버전. 선택지의
  // 숫자 choice.delta만큼 호감도가 오르내리고, choice.reaction이 있으면 다음 문항 상단에 짧은
  // 반응 문구가 함께 뜬다. affinity_meter가 없는 config는 아래 함수들이 호출되지 않는다.
  function affinityConfig() {
    var am = state.config.affinity_meter || {};
    return { init: typeof am.init === 'number' ? am.init : 50, max: am.max || 100 };
  }
  function resetAffinity() {
    var ac = affinityConfig();
    state.affinityValue = ac.init;
    state.affinityPrev = ac.init;
  }
  function applyAffinityDelta(choice) {
    if (!choice || typeof choice.delta !== 'number') return;
    var ac = affinityConfig();
    state.affinityValue = Math.max(0, Math.min(ac.max, state.affinityValue + choice.delta));
  }
  function affinityMeterHtml() {
    var ac = affinityConfig();
    var pct = ac.max ? Math.round((state.affinityPrev / ac.max) * 100) : 0;
    var lastChoice = state.answers[state.answers.length - 1];
    var reactionHtml = (lastChoice && lastChoice.reaction)
      ? '<p class="te-affinity-reaction">' + escapeHtml(lastChoice.reaction) + '</p>'
      : '';
    return '<div class="te-affinity" id="te-affinity">' +
        '<div class="te-affinity-head">' +
          '<span class="te-affinity-label">💕 호감도</span>' +
          '<span class="te-affinity-pct" id="te-affinity-pct">' + pct + '%</span>' +
        '</div>' +
        '<div class="te-affinity-track"><div class="te-affinity-fill" id="te-affinity-fill" style="width:' + pct + '%"></div></div>' +
        reactionHtml +
      '</div>';
  }
  function animateAffinityMeter() {
    var ac = affinityConfig();
    requestAnimationFrame(function () {
      var pct = ac.max ? Math.round((state.affinityValue / ac.max) * 100) : 0;
      var pctEl = qs('#te-affinity-pct');
      var fillEl = qs('#te-affinity-fill');
      if (pctEl) pctEl.textContent = pct + '%';
      if (fillEl) fillEl.style.width = pct + '%';
    });
    state.affinityPrev = state.affinityValue;
  }
  // 결과 화면용 — 최종 호감도%와 엔딩 등급 판정.
  function computeAffinityResult() {
    var ac = affinityConfig();
    var pct = ac.max ? Math.round((state.affinityValue / ac.max) * 100) : 0;
    var verdict = pct >= 80 ? '운명적 로맨스 엔딩' : pct >= 55 ? '설레는 썸 엔딩' : pct >= 30 ? '어색한 친구 엔딩' : '다음 화를 기약하는 엔딩';
    return { pct: pct, verdict: verdict };
  }

  // v15: config.point_budget(#55 판타지 무기) — 인트로 "테스트 시작" 클릭 직후, 8문항을 시작하기
  // 전에 고정 포인트를 스탯 4종에 배분하는 화면을 하나 끼워 넣는다. mbti4 8문항 채점과는 완전히
  // 별개 상태(state.pointBudget)라 축 코드 산출에 전혀 영향이 없고, 가장 많이 투자한 스탯만
  // {topstat} 플레이스홀더로 결과 텍스트에 노출한다(순수 플레이버). point_budget이 없는 config는
  // renderIntro의 시작 버튼이 곧장 startTest()로 가므로 이 화면 자체가 존재하지 않는다.
  function pointBudgetRemaining() {
    var pb = state.config.point_budget;
    var used = Object.keys(state.pointBudget).reduce(function (sum, k) { return sum + state.pointBudget[k]; }, 0);
    return pb.pool - used;
  }
  function renderPointBudget() {
    var pb = state.config.point_budget;
    state.pointBudget = {};
    pb.stats.forEach(function (s) { state.pointBudget[s.key] = 0; });
    renderPointBudgetScreen();
  }
  function renderPointBudgetScreen() {
    var pb = state.config.point_budget;
    var remaining = pointBudgetRemaining();
    var rows = pb.stats.map(function (s) {
      var val = state.pointBudget[s.key];
      var pct = pb.pool ? Math.round((val / pb.pool) * 100) : 0;
      return '<div class="te-budget-row">' +
          '<span class="te-budget-label">' + escapeHtml(s.label) + '</span>' +
          '<button type="button" class="te-budget-btn" data-budget-dec="' + escapeAttr(s.key) + '"' + (val <= 0 ? ' disabled' : '') + '>−</button>' +
          '<div class="te-budget-track"><div class="te-budget-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="te-budget-val">' + val + '</span>' +
          '<button type="button" class="te-budget-btn" data-budget-inc="' + escapeAttr(s.key) + '"' + (remaining <= 0 ? ' disabled' : '') + '>+</button>' +
        '</div>';
    }).join('');
    rootEl.innerHTML =
      '<div class="te-app te-screen-budget te-has-fixed-footer">' +
        '<div class="te-budget-body">' +
          '<h2 class="te-question-text">' + escapeHtml(pb.intro_text || '포인트를 스탯에 배분하세요') + '</h2>' +
          '<p class="te-budget-remaining">남은 포인트 <strong id="te-budget-remaining">' + remaining + '</strong></p>' +
          rows +
        '</div>' +
        '<div class="te-choices-fixed te-question-footer">' +
          '<button type="button" class="te-btn te-btn-primary" id="te-budget-confirm"' + (remaining > 0 ? ' disabled' : '') + '>시작하기</button>' +
        '</div>' +
      '</div>';
    qsa('[data-budget-inc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.dataset.budgetInc;
        if (pointBudgetRemaining() > 0) { state.pointBudget[k] += 1; renderPointBudgetScreen(); }
      });
    });
    qsa('[data-budget-dec]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.dataset.budgetDec;
        if (state.pointBudget[k] > 0) { state.pointBudget[k] -= 1; renderPointBudgetScreen(); }
      });
    });
    qs('#te-budget-confirm').addEventListener('click', function () {
      if (pointBudgetRemaining() === 0) startTest();
    });
  }
  // 결과 화면용 — 가장 많이 투자한 스탯의 라벨({topstat} 플레이스홀더용).
  function topBudgetStatLabel() {
    var pb = state.config.point_budget;
    if (!pb) return '';
    var top = pb.stats.reduce(function (best, s) {
      return (state.pointBudget[s.key] || 0) > (state.pointBudget[best.key] || 0) ? s : best;
    }, pb.stats[0]);
    return top.label;
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
      ebar: statBar(eVal), nbar: statBar(nVal), fbar: statBar(fVal), jbar: statBar(jVal),
      // v15: config.point_budget(#55)이 있을 때만 의미 있는 값 — 없으면 빈 문자열로 남아
      // resultTemplate에 "{topstat}"이 없는 기존 config는 완전히 무관하다.
      topstat: c.point_budget ? topBudgetStatLabel() : ''
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
    // v8: mbti4와 동일하게 겉모습(outer) 코드로 results[]를 우선 매칭 — 손으로 쓴 16종 결과가
    // 있으면 그걸 쓰고, 없으면(results 비어있음) 기존처럼 resultTemplate 폴백(하위호환).
    var matched = (c.results || []).filter(function (res) { return res.code === outer.code; })[0];
    var merged = fillVarsTemplate(matched || c.resultTemplate || {}, vars);
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

    // config.timer_sec(#21) 테스트에서만 노출되는 부가 스탯 — 없는 24개 테스트는 이 줄 자체가 렌더되지 않는다.
    var timeoutStatHtml = state.config.timer_sec
      ? '<p class="te-result-stat">⏱ 3초 안에 답하지 못한 문항: ' + state.timeoutCount + '개</p>'
      : '';

    // config.resource_meters(#53) 테스트에서만 노출되는 부가 스탯 — 없는 테스트는 이 줄 자체가 렌더되지 않는다.
    var survivalStatHtml = '';
    if (state.config.resource_meters) {
      var si = computeSurvivalIndex();
      survivalStatHtml =
        '<p class="te-result-stat">🏕️ 부족 생존 지수 ' + si.pct + '% · ' + escapeHtml(si.verdict) + '</p>' +
        '<p class="te-result-stat te-result-stat-sub">' + escapeHtml(si.parts) + '</p>';
    }

    // config.affinity_meter(#54) 테스트에서만 노출되는 부가 스탯.
    var affinityStatHtml = '';
    if (state.config.affinity_meter) {
      var ar = computeAffinityResult();
      affinityStatHtml = '<p class="te-result-stat">💕 최종 호감도 ' + ar.pct + '% · ' + escapeHtml(ar.verdict) + '</p>';
    }

    // config.image_choices(#52) 테스트에서만 노출되는 부가 스탯 — 완성된 스티커판 재노출.
    var collectionStatHtml = '';
    if (state.config.image_choices) {
      var icIcons = imageChoiceIcons();
      var stampRow = state.answers.map(function (a) {
        return (a && a.axis && icIcons[a.axis]) || '⭐';
      }).join(' ');
      collectionStatHtml = '<p class="te-result-stat">🐾 완성된 스티커판 ' + escapeHtml(stampRow) + '</p>';
    }

    // config.point_budget(#55) 테스트에서만 노출되는 부가 스탯 — 배분한 스탯 4종 막대.
    var budgetStatHtml = '';
    if (state.config.point_budget) {
      var pb = state.config.point_budget;
      var budgetRows = pb.stats.map(function (s) {
        var pct = pb.pool ? Math.round(((state.pointBudget[s.key] || 0) / pb.pool) * 100) : 0;
        return escapeHtml(s.label) + ' ' + statBar(pct) + ' ' + (state.pointBudget[s.key] || 0);
      }).join('<br>');
      budgetStatHtml = '<p class="te-result-stat">⚔️ 능력치 배분<br>' + budgetRows + '</p>';
    }

    rootEl.innerHTML =
      '<div class="te-app te-screen-result te-has-fixed-footer">' +
        '<div class="te-result-body">' +
          '<img src="' + escapeAttr(result.image) + '" alt="' + escapeAttr(result.title) + '" class="te-result-img" style="width:100%;display:block;" />' +
          '<h2 class="te-result-title">' + escapeHtml(result.title) + '</h2>' +
          '<p class="te-result-subtitle">' + escapeHtml(applyTagTemplate(result.subtitle || '', result.tag)) + '</p>' +
          '<ul class="te-result-traits">' + traits + '</ul>' +
          '<p class="te-result-tip">' + escapeHtml(applyTagTemplate(result.tip || '', result.tag)) + '</p>' +
          timeoutStatHtml +
          survivalStatHtml +
          affinityStatHtml +
          collectionStatHtml +
          budgetStatHtml +
          '<p class="te-save-hint">📸 이미지를 꾹 눌러 저장해보세요</p>' +
          relatedHtml +
        '</div>' +
        '<div class="te-choices-fixed te-result-footer">' +
          '<button type="button" class="te-btn te-btn-kakao" id="te-kakao-btn">💬 카카오톡으로 공유하기</button>' +
          '<button type="button" class="te-btn te-btn-accent" id="te-save-btn">🖼️ 이미지 저장</button>' +
          '<button type="button" class="te-btn te-btn-secondary" id="te-othertests-btn">🔄 다른 테스트 하러가기</button>' +
          '<button type="button" class="te-btn te-btn-primary" id="te-share-btn">공유하기</button>' +
          '<button type="button" class="te-btn te-btn-secondary" id="te-restart-btn">다시하기</button>' +
        '</div>' +
      '</div>';

    qs('#te-restart-btn').addEventListener('click', renderIntro);
    qs('#te-share-btn').addEventListener('click', function () { shareResult(result); });
    qs('#te-save-btn').addEventListener('click', function () { handleSaveImageClick(result); });
    qs('#te-kakao-btn').addEventListener('click', function () { shareResultToKakao(result); });
    qs('#te-othertests-btn').addEventListener('click', goToOtherTests);

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
