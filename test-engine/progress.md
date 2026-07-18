# 심리테스트 제작 진행상황 (test-engine 20개 목록 + mental-age)

이 파일은 `/test-engine/` 콘텐츠 제작(20개 목록, `tests/index.json` 기준)의 진행상황을
사람이 한눈에 보는 대시보드다. **세션을 시작하기 전에 항상 먼저 읽을 것** — `[~]` 상태가
있으면 거기부터 이어서 진행한다(처음부터 다시 만들지 않는다).

**"완료([x])"의 정의 = 문항+답변+이미지(커버·결과)+채점 스키마가 전부 끝난 것.**
사이트 연동(`data.js`/`app.js`/`sections.json`/`sitemap.xml` 반영, git push)은 별도
단계이며, 완료 여부와 무관하게 "연동" 컬럼으로 따로 표시한다 — 예약/배치 세션은 연동을
하지 않는다(아래 "작업 규칙" 참고).

## 몰입테스트 (1~10)
- [x] mental-age (번호 없음, 20개 목록 이전 1호 콘텐츠) — 완료 · 연동 O
- [x] #1 k-office-type — 완료 · 연동 O
- [x] #2 desert-island-type — 완료 · 연동 O
- [x] #3 text-reply-love-type — 완료 (commit: 4cc0470, 2026-07-11) · 연동 O(2026-07-12)
- [x] #4 spending-type — 완료 · 연동 O
- [x] #5 villain-index — 완료 · 연동 O
- [x] #6 mbti-addiction-level — 완료 · 연동 O
- [x] #7 idol-position-type — 완료 (commit: 630b8ba, 2026-07-11) · 연동 O(2026-07-12)
- [x] #8 group-chat-character — 완료 (2026-07-11) · 연동 O(2026-07-12)
- [x] #9 dopamine-addiction-level — 완료 (2026-07-11) · 연동 O(2026-07-12)
- [x] #10 joseon-past-life-type — 완료 (2026-07-11) · 연동 O(2026-07-12)

**몰입테스트(1~10) 전체 완료.**

## MBTI존 (11~20)
- [x] #11 real-vs-fake-mbti — 완료 · 연동 O
- [x] #12 love-mode-mbti — 완료 · 연동 O
- [x] #13 drunk-mbti — 완료 · 연동 O
- [x] #14 villain-mbti — 완료 · 연동 O (commit: 8256ff3, 2026-07-11)
- [x] #15 crush-mode-mbti — 완료 · 연동 O (commit: 8256ff3, 2026-07-11)
- [x] #16 brain-structure-report — 완료 · 연동 O (commit: 8256ff3, 2026-07-11)
- [x] #17 office-mask-mbti — 완료 (2026-07-11) · 연동 O(2026-07-12)
- [x] #18 shadow-mbti — 완료 (2026-07-11) · 연동 O(2026-07-12)
- [x] #19 mbti-stat-window — **콘텐츠 완료**(이미지·QA까지, commit: 8256ff3에서 질문 텍스트만 추가 수정) · 연동 O(2026-07-12)
- [x] #20 ai-mbti-judge — 완료 (commit: 305e6ba, 2026-07-11) · 연동 O(2026-07-12)

**MBTI존(11~20) 전체 완료. 20개 목록 + mental-age 전체 콘텐츠 제작 완료. 전체 사이트 연동도 완료.**

## 몰입테스트 2차 배치 (21~30)
문항/선택지/결과 텍스트는 이전 세션에서 스켈레톤으로 이미 작성돼 있었고, 이번 세션은 사용자가
`assets/reference/`에 미리 올려둔 레퍼런스를 보고 톤·매체·신규 테마 CSS 확정 + 이미지 생성 + 문항
SVG 제작 + config.json 연결까지 진행(상세 컨셉은 `style-guide.md` "2026-07-17 추가" 절 참고).
- [x] #21 balance-3sec-speed — 완료 (2026-07-17, theme: arcade)
- [x] #22 ai-daily-documentary — 완료 (2026-07-17, theme: camcorder)
- [x] #23 past-life-death-cause — 완료 (2026-07-17, theme: tarot)
- [x] #24 life-drama-genre — 완료 (2026-07-17, theme: streamcard)
- [x] #25 katok-reply-style — 완료 (2026-07-17, theme: stickynote)
- [x] #26 medieval-job-past-life — 완료 (2026-07-17, theme: tapestry)
- [x] #27 village-animal-neighbor — 완료 (2026-07-17, theme: diorama)
- [x] #28 hold-or-sell-index — 완료 (2026-07-17, theme: tradefloor)
- [x] #29 dopamine-source-type — 완료 (2026-07-17, theme: manual)
- [x] #30 zombie-apocalypse-survival — 완료 (2026-07-17, theme: stencil)

**#21~30 전체 콘텐츠 제작 + 사이트 연동 완료(2026-07-17).** `data.js`(externalTests 10개 추가,
baseCount/engagementKey/theme이 각 config.json의 seed_count/engagement_key/theme과 정확히 일치
확인), `app.js`(THEME_TITLE_FONTS에 신규 테마 10종 등록), `sections.json`(psych-2/3/4 그룹에 분배 —
psych-1엔 이번엔 해당 없음), `sitemap.xml`/`sitemap-main.xml`(10개 URL 추가), `llms.txt`/
`llms-full.txt`(21종→31종 갱신) 전부 반영 후 push 완료.

## novel mechanic 5종 복구 (2026-07-17)
`gwamol_test_ideas_2026_v0.0.6.md` 원안(맨 끝 "🛠 Claude Code 작업 메모" 절)에 21~40번 중
5개(#21/#25/#30/#33/#39)는 일반 카드형 Q&A와 다른 특수 인터랙션으로 만들라고 명시돼 있었는데,
문항 스켈레톤을 옮겨 적는 단계에서 전부 누락된 채 평범한 `type`/`sum` 구조로만 만들어졌던 걸
사용자가 "#21에 카운트다운이 안 뜬다"고 지적해 발견. 이 요구사항이 progress.md/index.json 같은
실제 추적 파일이 아니라 md 파일 맨 끝에만 적혀있어 유실된 것으로 추정(재발 방지책은 아래 참고).
engine.js에 opt-in 필드/신규 scoring_type 5종을 추가해 전부 복구:
- [x] #21 balance-3sec-speed — `timer_sec:3` 추가(3초 카운트다운+타임아웃 시 무응답 처리+결과에
  타임아웃 개수 표시)
- [x] #25 katok-reply-style — `chat_ui:true` 추가(말풍선 UI, 텍스트의 "(상대) " 표기 제거)
- [x] #30 zombie-apocalypse-survival — `questions_tree`+`start_node`로 분기 시나리오 재설계
  (6개 결과 중 4개가 조기 종료되는 짧은 경로를 가짐). `type` 채점에 `choice.weight` 지원 추가.
- [x] #33 lucky-vicky-index — `slider_ui:true` 추가(range input, 기존 sum/score 로직 그대로)
- [x] #39 decision-time-test — `scoring_type: reaction_time` 신설(문항 노출~클릭 실측 ms 평균),
  자기신고형이던 선택지를 원안 md의 중립 선택지로 교체
전부 Playwright로 로컬 검증(정상 경로/각 조기종료 경로/기존 24개 테스트 회귀 없음) 완료,
테스트별 개별 커밋. `#33`/`#39`는 아직 이미지 제작 전(`theme: "pending"`) 단계라 사이트 연동은
별도 — 이미지 준비되면 나머지 배치(31~60)와 함께 진행.

> **41~60번 기획 정본 = `test-engine/mbti41~60.md`** (2026-07-18, 사용자가
> `gwamol_test_ideas_2026_v0.0.6.md`에서 MBTI존만 분리·저장). 앞으로 41~60의 문항/결과/
> 오프닝·중반이벤트는 이 파일을 기준으로 제작한다.

## MBTI존 41~60 novel mechanic 8종 적용 (2026-07-18, 5종→8종 확장)
41~60번은 전부 텍스트만 있는 스켈레톤(이미지·테마 미정) 상태였는데, 사용자가 최근 몰입테스트
(#25/#30/#33/#39)처럼 "3개 중 최소 1개(=7개 이상)"는 표준 "8문항×4지선다" mbti4 틀을 벗어난
엔진을 적용해달라고 요청 — 이미지 작업 전이라 매몰비용 없이 구조를 바꿀 수 있는 시점이었음.
**최종 결정: 총 8개(20개 중 40%). 기존 5개 유지 + 재사용 2개(#50/#58) + 완전 신규 엔진 1개(#41).**
`mbti4`/`mbti4_dual` 채점이 `chat_ui`/`slider_ui`/`timer_sec`/`questions_tree`와 조합 가능한지
engine.js를 조사해 확인(선택 로직이 렌더링과 분리돼 있어 기존 코드 그대로 조합 가능, 단
`mbti4`+`reaction_time`만 채점 로직이 배타적이라 불가)한 뒤 진행:
- [x] #43 mbti-villain-story — `mbti4_dual`로 전환(겉모습 8문항=outer/평범한 일상 8문항=inner,
  총 16문항). 기존 16종 결과(빌런 정체)는 outer 코드로 그대로 매칭, `{inner}` 플레이스홀더로
  "평소엔 감쪽같이 {inner}처럼 산다" 트레잇 1줄 추가
- [x] #48 mbti-idol-debut-position — `chat_ui:true` 추가, 8문항을 연습생 단체 채팅방(매니저·
  스탭·멤버가 보내는 메시지)에 답장하는 형식으로 재구성. axis 값은 그대로, 텍스트만 채팅 톤으로
  재작성
- [x] #51 mbti-drinking-party-character — `slider_ui:true` 추가, 8문항 각각의 4지선다를
  "텐션 게이지"가 자연스럽게 이어지는 스펙트럼 순서로 재배열(예: 조용함→시끄러움)
- [x] #56 mbti-cyberpunk-world — `questions_tree`+`start_node`로 분기 시나리오 재설계(해킹
  잠입 스토리, 노드 9개). 첫 선택(E/I)에서만 두 갈래로 갈라졌다가 바로 합류하는 구조라 모든
  경로가 동일하게 축 8개(각 2회)를 전부 지나가도록 설계 — 트리 채점이라도 mbti4 16유형 정확도가
  떨어지지 않게 함(경로 전수 트레이스로 검증 완료)
- [x] #60 mbti-office-resignation — `timer_sec:7` 추가, 문항 텍스트를 "부장님이 급하게 면담실로
  부른다" 식의 즉답 압박 시나리오로 재작성(선택지/axis는 그대로)

**추가 3종 (2026-07-18, 8종 확장):**
- [x] #41 mbti-hero-awakening — **신규 엔진 `awaken_meter`**(engine v11→v12): 문항을 풀수록
  화면 상단에 4축(E/I·N/S·T/F·J/P) 우세도 막대 + "각성률(진행률)"이 실시간으로 차오르는 진행형
  시각화. mbti4가 이미 쌓아둔 `state.mbtiCounts`를 렌더링만 하는 것이라 채점 불변, `awaken_meter`
  없는 config는 무영향(하위호환). engine.js: `computeAwakenTargets`(순수함수)/`awakenMeterHtml`/
  `animateAwakenMeter`(직전 프레임→목표값 CSS width 트랜지션), engine.css: `.te-awaken-*`.
  config: `"awaken_meter": true` + loading 문구를 "각성률 100% 도달..."로. **ENGINE_ASSET_VERSION
  11→12, 61개 index.html의 engine.js/engine.css `?v=11→12` 일괄 동기화**(result-card.js는 무변경 v2).
- [x] #50 mbti-rpg-character-sheet — 스탯 시트 시각화(STEP6 `{ebar}/{e}`류 재사용, 엔진 무변경):
  16종 결과 traits 앞에 실측 퍼센트 스탯바 4줄(🗡️사교 SOC/🔮직관 INT/❤️공감 EMP/🛡️계획 PLN)
  추가 — 고정 스탯이 아니라 내 응답 기반 실측치가 막대로 나옴.
- [x] #58 mbti-past-future-life — `intro_input`(띠 12지 드롭다운, STEP5 재사용, 엔진 무변경):
  인트로에서 내 띠 선택 → 16종 결과 traits 앞에 `{claimed}` 개인화 1줄("○○띠의 기운을 품고
  이 유형으로 환생한 영혼") 추가.

8개 전부 JSON 파싱 검증 + engine.js가 실제로 읽는 필드명과 일치하는지 대조 완료. **이미지·테마
제작과 실제 브라우저 QA(완주 재생)는 아직 진행 전**(4-4 이미지 승인 절차부터 시작해야 함) —
나머지 12개(42,44,45,46,47,49,52,53,54,55,57,59)는 표준 mbti4(8문항×4지선다) 그대로 유지.

## 몰입테스트 3차 배치 (31~40) — 1차 5개 (2026-07-18)
사용자가 각 폴더 `assets/reference/`에 레퍼런스를 미리 올려두고 "31~40번, 5개씩 제작 후 QA→커밋"
요청. 문항/선택지/결과 텍스트는 기존 스켈레톤 그대로, 이번 세션은 톤·매체·신규 테마 CSS 확정 +
이미지 생성 + 문항 SVG 제작 + config.json 연결까지 진행(상세 컨셉은 style-guide.md "2026-07-18
추가" 절 참고).
- [x] #31 romance-webtoon-genre — 완료 (2026-07-18, theme: goldhour)
- [x] #32 office-slacker-skilltree — 완료 (2026-07-18, theme: metromap)
- [x] #33 lucky-vicky-index — 완료 (2026-07-18, theme: photobooth, slider_ui 유지)
- [x] #34 t-factor-index — 완료 (2026-07-18, theme: crayonbook)
- [x] #35 caffeine-addiction-type — 완료 (2026-07-18, theme: kraftbag)

**#31~35 콘텐츠 제작 완료.** Playwright 전수 QA(5/5 PASS: 콘솔 에러 0, 결과 이미지 정상 로드,
버튼바-본문 겹침 0, 플레이스홀더 미치환 없음, 320px 가로 스크롤 없음) 통과, 커밋(`00a2b83`)+push
완료, 라이브 사이트 5개 URL 200 재확인 완료. 사용자 검토 후 "진행해" 승인받아 #36~40 이어서 진행.

- [x] #36 friend-group-position — 완료 (2026-07-18, theme: miniature)
- [x] #37 godsaeng-fail-type — 완료 (2026-07-18, theme: pennant)
- [x] #38 room-state-psychology — 완료 (2026-07-18, theme: blueprint)
- [x] #39 decision-time-test — 완료 (2026-07-18, theme: ekgmonitor, reaction_time 유지)
- [x] #40 ai-black-history-type — 완료 (2026-07-18, theme: vhsnoir)

**#36~40 콘텐츠 제작 완료.** Playwright 전수 QA(5/5 PASS, #39의 `{avgSec}` 실측 치환 확인 포함)
통과 후 테스트별 개별 커밋 예정. **이로써 #31~40(3차 배치 전체) 콘텐츠 제작 완료.** 사이트 연동
(data.js 등)과 41~60 착수는 사용자 확인 후 별도 진행.

## MBTI존 4차 배치 (41~50, 2026-07-18 야간, 사용자 취침 중 자동 진행 위임)
사용자가 41~50 문항/결과 텍스트 + 레퍼런스 이미지(`assets/reference/`)를 전부 미리 준비해둔
상태로 시작. 5개씩 제작→QA→커밋, 다시 5개 반복 후 사이트 연동+push까지 이번 세션 한정 위임받음.
- [x] #41 mbti-hero-awakening — 완료 (2026-07-18, theme: halftonepop)
- [x] #42 mbti-fantasy-race — 완료 (2026-07-18, theme: embroidery)
- [x] #43 mbti-villain-story — 완료 (2026-07-18, theme: linocut, mbti4_dual 유지)
- [x] #44 mbti-zombie-survival-class — 완료 (2026-07-18, theme: claymation)
- [x] #45 mbti-mythology-god — 완료 (2026-07-18, theme: mosaic)
- [x] #46 mbti-cafe-drink — 완료 (2026-07-18, theme: botanical)
- [x] #47 mbti-magic-school-house — 완료 (2026-07-18, theme: wizardletter)
- [x] #48 mbti-idol-debut-position — 완료 (2026-07-18, theme: lightstick, chat_ui 유지)
- [x] #49 mbti-joseon-government-post — 완료 (2026-07-18, theme: hanjiscroll)
- [x] #50 mbti-rpg-character-sheet — 완료 (2026-07-18, theme: holocard, stat bar 유지)

**#41~50(4차 배치 전체) 콘텐츠 제작 완료.** Playwright 전수 QA 통과(콘솔 에러 0, 깨진 이미지 0,
버튼바-본문 겹침 0). 문항 이미지는 전부 4지선다라 4-4-1 규칙상 대상 제외. 사이트 연동(data.js/
app.js/sections.json/sitemap.xml/llms.txt)까지 같은 세션에서 이어서 진행, push 완료.

## 다음 배치 후보
#21~50 완료(novel mechanic 포함). #51~60(2026-07-16 스켈레톤 생성분)이 다음 배치 후보 — 이 중
**novel mechanic 나머지(51/56/58/60)는 엔진 필드·config 구조까지 정리됨**, 나머지는 문항·결과
텍스트만 있고 이미지 컨셉 미정 상태. **문항/결과 텍스트를 `mbti41~60.md` 정본의 완성 문장으로
다듬는 작업 + 이미지·테마 제작**은 4-7 배치 규칙(5개씩)으로 진행 — 시작 전 레퍼런스 이미지 확보
절차(4-4)부터 진행할 것.

## 품질 개선 — MBTI존 9개(#11~18,#20) 16종 결과 세분화 (2026-07-12)
사용자가 "#19 빼고는 결과가 다 하나뿐이라 노잼"이라고 지적해 진행. `resultTemplate` 공용 템플릿
1개(제목의 `{code}`만 바뀜)였던 #11/12/13/14/15/16/17/18/20을 전부 16종 결과(제목/부제/특징3줄/팁
전부 다름)로 재작성 — 이미지는 절반인 8장(E/I만 다른 쌍끼리 공유)으로 절충. `engine.js`가
`mbti4_dual`(#11)에는 `results[]` 매칭을 지원 안 하던 걸 발견해 확장(v7→v8, 상세는 style-guide.md
"2026-07-12 추가" 절 참고). 9개 전부 Playwright 2-극단 QA(콘솔 에러 0, 플레이스홀더 미치환 없음,
이미지 700px 정상 로드, 두 결과 제목 상이) 통과 후 테스트별 개별 커밋 + push 완료(이미 사이트
연동돼있던 #11~16은 이 push로 라이브에 바로 반영됨, #17/18/20은 아직 미연동 상태라 위 "사이트 연동"
작업 완료 시 함께 적용될 예정).

## 버그 수정 — 인트로/결과 화면 하단 버튼바-본문 겹침 근본 수정 (2026-07-12)
사용자가 실제 화면 스크린샷 5장(mental-age/drunk-mbti/ai-mbti-judge/real-vs-fake-mbti/villain-index)으로
"본문이 죄다 버튼에 가려 보인다"고 재차 제보(v0.6.9/v0.7.0/v0.7.1에서 세 차례 땜질했던 것과 같은
버그 계열, 이번엔 인트로/결과 화면 한정 — 질문 화면은 문제없음을 사용자가 명시적으로 확인해줌).
원인은 `.te-choices-fixed`(하단 버튼바)가 `position:fixed`인 채로, 실제 버튼바 높이를 JS로 측정해
본문에 `padding-bottom`을 얹어두는 방식(`syncFixedFooterHeight()`) 자체의 구조적 한계 — 웹폰트
로딩 타이밍/문항별 버튼 개수 차이 등 "측정이 어긋나는" 모든 경우에 재발할 수밖에 없었음(세 번의
수정이 전부 "측정을 더 정확히/더 늦게" 하는 대증요법이었음).

**근본 수정**: `position:fixed`+JS 높이 측정을 완전히 버리고, `.te-app`(이미
`display:flex;flex-direction:column;min-height:100vh`였음)의 마지막 자식인 버튼바에 `margin-top:auto`만
적용하는 순수 flexbox 정렬로 전환 — 본문이 짧으면 남는 여백을 흡수해 버튼바가 뷰포트 맨 아래로
밀려나고(기존 fixed와 시각적으로 동일), 본문이 길면 흡수할 여백이 없어 그냥 본문 바로 다음(문서의
진짜 끝)에 자연스럽게 이어져 **겹침이 구조적으로 불가능**해짐(`syncFixedFooterHeight()`와 호출부
3곳, resize 리스너 전부 제거 — 측정 자체가 필요 없어짐).

**한 번 삽질한 함정**: 처음엔 `position:sticky; bottom:0`을 `margin-top:auto`와 함께 적용했다가
Playwright로 실측했더니 sticky가 "본문이 긴 경우에도 스크롤 여부와 무관하게 항상 뷰포트 하단에
즉시 도킹"돼버려 fixed와 완전히 똑같이 겹치는 것을 발견(`.te-app`이 body 스크롤을 그대로 쓰는
전체 페이지 컨테이너라, sticky의 컨테이닝 블록이 사실상 문서 전체라 스크롤 전에도 즉시 달라붙음).
`position` 자체를 아예 안 쓰는(기본값 static) 순수 `margin-top:auto`로 수정해 해결 — 앞으로 새
테마를 만들 때 `.te-choices-fixed`에 `position:sticky`를 추가하면 이 버그가 재현되니 절대 금지
(`test-engine/CLAUDE.md` 4-6 체크리스트에 명문화).

캐시버스팅: `engine.css?v=5→6`, `engine.js?v=8→9`(21개 테스트 index.html 전부 일괄 교체,
result-card.js는 무변경이라 v=2 그대로). **검증**: `node --check` 통과, Playwright로 사용자가
제보한 5개 테스트 전부(mental-age/13-drunk-mbti/20-ai-mbti-judge/11-real-vs-fake-mbti/5-villain-index)
인트로·결과 화면을 스크롤 없이(자연 상태) 캡처해 겹침 0건 확인(수정 전엔 전부 겹침 재현됨), 끝까지
스크롤한 상태도 겹침 0건 유지 확인, 질문 화면(회귀 확인용, retro 테마의 가짜 타이틀바 포함) 정상
렌더링 확인, 콘솔 에러 없음.

## 작업 규칙 (test-engine/CLAUDE.md 4-8과 동일, 요약)
1. **커밋 타이밍 = 완료 단위.** 테스트 1개가 문항+답변+이미지+채점까지 전부 끝났을 때만
   `git commit`. 문항 텍스트만 쓴 중간 상태에서는 커밋하지 않는다.
   커밋 메시지 예: `feat: 심리테스트 #7 몰입테스트 제작완료`
2. **커밋 직후 이 파일을 갱신**한다 — 해당 항목을 `[x]`로 바꾸고 commit hash를 적어넣는다.
   아직 안 끝난 항목은 절대 `[x]`로 표시하지 않는다(진행 중이면 `[~]`와 현재 단계를 기록).
3. 작업 중간에 세션이 끊기면, 다음 세션은 이 파일을 먼저 읽고 `[~]` 또는 `[ ]` 상태부터
   재개한다.
4. **배치/예약 세션은 사이트 연동 금지**: `data.js`/`app.js`/`sections.json`/`sitemap.xml`
   수정 금지, **`git push`도 금지**(로컬 커밋까지만 — Cloudflare Pages가 push 시 자동배포되므로
   무인 세션이 검증 없이 라이브에 반영되는 걸 막기 위함). 연동+배포는 사용자가 있는 세션에서
   별도로 진행한다.

## 세션 로그
- 2026-07-18 (MBTI존 41~60 novel mechanic 8종 확장 세션): 사용자가 `mbti41~60.md`(41~60 기획
  정본) 추가 + "3개 중 1개 이상을 다른 엔진으로" 요청 → 5종→8종 확장 확정. **신규 엔진
  `awaken_meter`(#41 각성 게이지)** 구현(engine.js `computeAwakenTargets`/`awakenMeterHtml`/
  `animateAwakenMeter`, engine.css `.te-awaken-*`, ENGINE_ASSET_VERSION 11→12, 61개 index.html
  `?v=` 동기화), **#50** 스탯 시트에 실측 스탯바 4줄(STEP6 재사용), **#58** 전생/환생에
  intro_input 띠 드롭다운+`{claimed}` 개인화(STEP5 재사용) 반영. index.json note/status 갱신 +
  정본 참조 추가. `node --check` 통과, Playwright 회귀/신규 QA는 이어서 진행. **콘텐츠 텍스트
  md 정본화·이미지·사이트 연동은 4-7 배치로 별도.**
- 2026-07-18 (콘텐츠 제작 세션, 이어서): 몰입테스트 #36~40 콘텐츠 제작 완료 — 신규 테마 5종
  (miniature/pennant/blueprint/ekgmonitor/vhsnoir) 설계, 각 테스트 cover+결과 이미지 전량 생성
  (#40 결과 1장은 세이프티 필터 1차 실패 후 재시도로 성공), 문항 SVG 16장(2지선다 4개 테스트 ×
  1/4/7/10번, #39는 4지선다+reaction_time이라 제외) 제작, config.json theme/image 필드 연결,
  Playwright로 5개 전수 완주 QA 통과(#39 `{avgSec}` 실측 치환 확인). `tests/index.json`
  상태/concept_style/scoring_type(#39는 sum→reaction_time으로 오기 수정) 갱신, `style-guide.md`에
  컨셉 기록 추가. **이로써 #31~40(3차 배치 전체) 콘텐츠 제작 완료.** 사이트 연동과 #41~60은
  범위 밖 — 사용자 승인 후 진행.
- 2026-07-18 (콘텐츠 제작 세션): 몰입테스트 #31~35 콘텐츠 제작 완료 — 신규 테마 5종(goldhour/
  metromap/photobooth/crayonbook/kraftbag) 설계, 각 테스트 cover+결과 이미지 전량 생성(#31 결과
  1장은 세이프티 필터에 1차 실패 후 재시도로 성공), 문항 SVG 16장(2지선다/슬라이더 4개 테스트 ×
  1/4/7/10번) 제작, config.json theme/image 필드 연결, Playwright로 5개 전수 완주 QA 통과.
  `tests/index.json` 상태/concept_style 갱신, `style-guide.md`에 컨셉 기록 추가. 사이트 연동
  (data.js 등)과 git push는 이번 세션 범위 밖 — 사용자 승인 후 진행. 다음은 #36~40.
- 2026-07-17 (콘텐츠 제작 세션): 몰입테스트 #21~30 콘텐츠 제작 완료 — 신규 테마 10종(arcade/
  camcorder/tarot/streamcard/stickynote/tapestry/diorama/tradefloor/manual/stencil) 설계,
  각 테스트 cover+결과 이미지 전량 생성(katok-reply-style 결과 2장은 도중 OpenAI 결제 하드리밋에
  걸렸다가 사용자 크레딧 충전 후 재시도로 해결), 문항 SVG 20장(2지선다 8개 테스트 × 1/4/7/10번)
  제작, config.json theme/image 필드 연결, Node 스크립트로 10개 전수 검증(파일 존재+seed_count
  범위) 통과. `tests/index.json` 상태/concept_style 갱신, `style-guide.md`에 컨셉 기록 추가.
  사이트 연동(data.js 등)과 git push는 이번 세션 범위 밖 — 사용자 승인 후 진행.
- 2026-07-12 (버그 수정 세션): 인트로/결과 화면 하단 버튼바-본문 겹침을 근본 수정 — 상세는 위
  "버그 수정" 절 참고. `engine.css`/`engine.js` v9, 21개 테스트 index.html 캐시버스팅 갱신.
- 2026-07-12 (사용자 실시간 세션, "이번 세션 한정 승인 없이 자동 진행" 위임받음): MBTI존 9개
  (#11~18,#20) 16종 결과 세분화 완료 — 상세는 위 "품질 개선" 절 참고. `engine.js` v7→v8(mbti4_dual
  results[] 매칭 지원), 144개 결과 텍스트 신규 작성, 이미지 72장(8쌍×9개) 전량 1회 생성 성공,
  Playwright QA 9/9 통과, 테스트별 개별 커밋 + push 완료. 이 세션은 "무인 배치"가 아니라 사용자가
  실시간으로 지켜보는 세션이었고 사용자가 명시적으로 자동 진행+push까지 위임했기 때문에 4-8의
  "무인 세션은 push 금지" 제약은 해당 없음(이미 사이트에 연동된 #11~16은 push 즉시 라이브 반영됨).
- 2026-07-11 (야간 무인 배치 세션, 사용자 취침 중): **8개(#3/#7/#8/#9/#10/#17/#18/#20) 전부 완료
  — 20개 목록 + mental-age 콘텐츠 제작이 이 세션으로 전부 끝남.** #19는 이미 완료돼 있어 스킵.
  - #3: 이미지 컨셉 3차 재설계 끝에 확정(1차 폰 UI 레퍼런스 그대로 흉내→깨진 텍스트, 2차
    "messaging app" 문구→로고 오인, 3차 "말풍선을 소재로 한 손그림 코믹"으로 성공). **재확인된
    함정**: generate-assets.js 프롬프트 파서가 `##` 헤딩 다음 "한 줄"만 읽는다(줄바꿈하면 프롬프트가
    중간에 잘려 엉뚱한 이미지가 나옴, k-office-type에서 이미 한 번 발견됐던 문제를 이번에 재현) —
    이후 #7~#20 전부 처음부터 한 줄로 작성해 문제 없었음.
  - #7/#8/#9/#10(몰입테스트 마무리): 레퍼런스 기반 images/edits 1회 생성으로 전부 성공(재시도 없음).
    #9는 레퍼런스의 "차분함 vs 글리치" 대비를 5단계 중독 레벨 진행축으로 그대로 활용한 게 특히 효과적.
  - #17/#18/#20(MBTI존 잔여, 전부 mbti4+resultTemplate 공용 구조): 이미지가 cover+generic 2장만
    필요해 몰입테스트보다 가벼움. 셋 다 레퍼런스가 정확히 2패널(전/후, 평소/그림자, 신문/판결)
    구도라 그대로 cover/generic으로 매칭해 1회 생성 성공. #20은 intro_input 드롭다운+{claimed}
    vs {code} 비교 subtitle까지 Playwright로 정상 동작 확인.
  - 매 항목 QA(padding-bottom=footer 높이 정확히 일치, broken image 0, 콘솔 에러 0) 통과 후
    개별 커밋, tests/index.json·style-guide.md·progress.md 매번 갱신.
  - **다음 세션 필수 작업**: 9개 전부(#3/7/8/9/10/17/18/19/20) 사이트 연동이 아직 안 된 상태 —
    사용자에게 스크린샷으로 확인받은 뒤 `data.js`/`app.js`/`sections.json`/`sitemap.xml` 반영 +
    `git push` 필요(무인 세션 규칙상 이번엔 로컬 커밋까지만 진행, push 안 함).
- 2026-07-11: #14/#15/#16 콘텐츠 제작+연동 완료, 나머지 9개(#3/#7/#8/#9/#10/#17/#18/#19/#20)
  질문 텍스트만 상황 서술형으로 일괄 리라이팅(이미지 작업 전). commit 8256ff3, push 완료.
  이 progress.md와 CLAUDE.md 4-8 규칙은 이 세션에서 신규 작성.
