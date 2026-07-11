# 심리테스트 엔진 (test-engine) — STEP 5까지 진행된 프로토타입, 사이트에 실제 연동됨

> **신규 심리테스트 콘텐츠를 추가/제작하는 작업이라면 이 README보다 [`CLAUDE.md`](./CLAUDE.md)(작업 규칙)·[`style-guide.md`](./style-guide.md)(톤 가이드)·[`tests/index.json`](./tests/index.json)(콘텐츠 레지스트리)를 먼저 읽을 것** — "새 심리테스트 추가해줘" 요청이 오면 항상 이 세 파일 기준으로 진행한다(2026-07-10 셋업). 이 README는 엔진 자체(`engine.js`/`engine.css`/`result-card.js`)의 기술 구조 설명이다.

## 버전 표기 규칙
이 하위 프로젝트는 메인 사이트의 `vX.Y.Z` 버전과 무관하게 **`test-engine vN (STEP N)`** 자체 표기를 씀 (engine.js/engine.css/themes/*.css 등 수정 파일 상단 주석 참고). 현재 `v5 (STEP 5: MBTI 4축 동시 채점 + 인트로 자기신고 입력 추가)`.

## 개요
`engine.js`/`engine.css`/`result-card.js`/`themes/*.css`는 기존 사이트(`index.html` / `app.js` / `data.js`)와 분리된 신규 엔진입니다.
목표는 `config.json` 하나로 새로운 심리테스트를 빠르게 찍어낼 수 있는 범용 엔진을 만드는 것입니다.
**단, STEP 3부터는 메인 사이트의 "심리 테스트존 > 몰입테스트" 탭과 홈 화면에서 실제로 링크가 걸려 있어(`app.js`의 `AppData.externalTests`/`sections.json`), 더 이상 완전히 격리된 프로토타입은 아닙니다.**

- **1호 콘텐츠**: `tests/mental-age/` — 정신연령 테스트 (MZ 톤, `sum` 채점, 윈도우95 레트로 테마, AI 생성 일러스트)
- 엔진 자체는 4가지 채점 방식(`sum`/`type`/`quiz`/`axis`)을 전부 지원하도록 설계했지만, 1호는 `sum`만 실제로 사용합니다.
- **STEP 2 추가**: 결과 화면 Canvas 공유카드 저장(`result-card.js`), 관련 테스트 배너(`config.related`)
- **STEP 3 추가**: 결과 화면 카카오톡 공유 버튼(메인 사이트와 같은 Kakao 앱 키 재사용, 같은 도메인이라 추가 등록 불필요), 모든 화면에 "← 메인으로" 고정 링크 — 둘 다 `engine.js`가 `init()` 시점에 자동으로 주입하므로 **새 테스트를 추가해도 별도 설정 없이 자동 적용됩니다.**
- **STEP 4 추가**: `sum` 채점 전용 선택적 보조 태그 집계 — 등급 구간(예: 천사~찐빌런)과 별개로 문항 선택지에 `tag`를 달아두면 가장 많이 나온 태그가 결과에 merge되고, 결과 텍스트의 `{tag}` 플레이스홀더가 자동 치환됩니다(`tests/villain-index/config.json` 참고). `tag`가 없는 기존 `sum` 테스트(mental-age 등)는 완전히 그대로 동작(하위호환 Playwright 검증 완료).
- **STEP 5 추가**: 신규 `scoring_type` 2종 — `mbti4`(choice.axis로 E/I·S/N·T/F·J/P 4쌍을 동시 집계해 4글자 MBTI 코드 산출)와 `mbti4_dual`(question.block: `outer`/`inner`로 두 세트를 독립 집계, "겉 MBTI/속 MBTI"류). 기존 `axis`는 좌/우 단일 축만 지원해 16유형 MBTI 산출이 불가능했던 걸 보완. 결과 콘텐츠는 `config.resultTemplate`(제목/부제/특징/팁에 `{code}`/`{outer}`/`{inner}`/`{claimed}` 플레이스홀더)로 즉석 생성하는 게 기본 전략이라 16개(또는 그 이상) 결과를 전부 손으로 안 써도 됩니다. 인트로 화면에 `config.intro_input`(라벨+옵션 배열)을 넣으면 테스트 시작 전 자기신고 값을 드롭다운으로 받아 `{claimed}`로 쓸 수 있습니다("AI가 판별하는 진짜 내 MBTI"류). `intro_input`이 없으면 렌더링에 변화 없음(하위호환).

## 로컬에서 확인하는 방법
`config.json`을 `fetch()`로 불러오기 때문에 `file://`로 직접 열면 CORS 에러가 납니다. **반드시 로컬 서버로 열어야 합니다.**

```bash
# 저장소 루트(testseries/)에서
npx serve .
# 또는
python3 -m http.server 8080
```

서버 실행 후 브라우저에서 아래 주소로 접속하세요 (포트는 사용한 서버에 맞게 조정):

```
http://localhost:8080/test-engine/tests/mental-age/index.html
```

VSCode를 쓴다면 Live Server 확장으로 `test-engine/tests/mental-age/index.html`을 열어도 동일하게 동작합니다.

## 폴더 구조
```
test-engine/
  engine.js            # 공통 로직 (config 로드, 화면 전환, 채점, 렌더, 결과 이미지 저장, 관련 테스트 배너)
  engine.css           # 테마 무관 공통 레이아웃(골격)
  result-card.js       # STEP 2: 결과 공유카드(Canvas) 합성 + 저장 (window.TestEngineResultCard)
  themes/
    retro.css          # 1호 테마: 윈도우95 레트로 스킨
  scripts/
    generate-assets.js         # STEP 1.5: config가 참조하는 이미지를 gpt-image-1로 생성하는 빌드타임 스크립트
    generate-assets-gemini.js  # 2단계 자동화(2026-07-10): Nano Banana Pro(gemini-3-pro-image-preview)로
                                # assets/reference/의 스타일 락 이미지를 참조해 나머지 세트를 생성.
                                # generate-assets.js와 출력 경로/prompts.md 컨벤션은 동일, 참조 이미지
                                # 유무만 다름(GEMINI_API_KEY 필요, 아래 "이미지 생성 2단계 워크플로우" 참고)
  tests/
    mental-age/
      index.html       # 진입점. engine + result-card 로드, data-test-id="mental-age"
      config.json       # 테스트 데이터(질문/채점/결과/related)
      assets/
        cover.webp       # 커버 일러스트 (AI 생성, STEP 1.5)
        result/          # 결과 구간별 일러스트 (6개, AI 생성)
        prompts.md       # 이미지 생성에 사용한 프롬프트 (generate-assets.js/-gemini.js가 파싱)
        reference/        # (선택) generate-assets-gemini.js 전용 — Midjourney 등에서 확정한 스타일
                          # 락 이미지를 여기 넣으면 매 생성마다 스타일 참조로 함께 전달됨(최대 8장)
```

## 화면 흐름
`인트로 → 질문 루프 → 가짜 로딩 연출 → 결과` (해시 라우팅 없는 단일 페이지 상태 전환)

- **인트로**: 커버 이미지 + 제목 + 후킹 카피 + 해시태그 칩 + 하단 고정 "테스트 시작" 버튼 + "지금까지 N명이 확인했어요"
- **질문**: 상단 진행바 + 질문 카드(현재/총 개수) + 하단 고정 선택지 버튼 2개
- **로딩**: `loading.text` 표시 + 프로그레스바 애니메이션, `loading.duration_ms` 후 결과로 자동 전환(계산 자체는 즉시 수행됨)
- **결과**: 결과 이미지 + 타이틀 + 서브카피 + traits 리스트 + tip + (있으면) 관련 테스트 배너 + "💬 카카오톡으로 공유하기"(feed 템플릿, 결과 이미지+제목+설명)/"🖼️ 이미지 저장"(Canvas로 세로형 카드 합성 → 모달에 미리보기+"길게 눌러 저장" 안내+다운로드 버튼)/"공유하기"(Web Share API, 미지원 시 클립보드 복사 폴백)/"다시하기"(인트로로)
- **모든 화면 공통**: 좌상단 "← 메인으로" 고정 링크(`/`로 이동, 질문 중간에 이탈해도 항상 노출)

## config.json 스키마
| 필드 | 설명 |
|---|---|
| `id` | 테스트 고유 ID (localStorage 완료 카운터 키에 사용) |
| `title` / `description` | 인트로에 노출되는 제목/후킹 카피 |
| `hashtags` | 인트로 해시태그 칩 배열 |
| `theme` | `themes/{theme}.css` 파일명 (확장자 제외) |
| `cover_image` | 인트로 커버 이미지 경로 (config.json 기준 상대경로) |
| `seed_count` | "N명이 확인했어요"의 기준값. 실제 표시값 = seed + 로컬 완료 카운트. **항상 두세 자리 안팎(대략 40~200)의 현실적인 값만 쓸 것** — 2026-07-11 21개 테스트 전부 15만~29만대의 비현실적인 값으로 잘못 세팅돼 있던 걸 사용자가 실사용 중 "말도 안되는 숫자"라고 지적해 전량 수정한 사례가 있음(경위는 CLAUDE.md 변경이력 v0.6.9 참고). 이 테스트가 메인 사이트 카드 그리드에 연동돼있다면(`data.js`의 `externalTests`/`mbtiZoneTests`의 `baseCount`, 조회수) 그보다 낮은 값으로 맞출 것(완료자 ≤ 조회자가 자연스러움) |
| `scoring_type` | `sum` \| `type` \| `quiz` \| `axis` |
| `loading.text` / `loading.duration_ms` | 로딩 연출 문구/지속시간(ms) |
| `questions[]` | `text`, `image`(nullable), `choices[]` |
| `results[]` | 채점 방식별로 매칭 필드가 다름 (아래 참고) |
| `related[]` | (STEP 2) 결과 화면 하단에 노출할 다른 테스트의 `id` 배열. 각 id로 `../{id}/config.json`을 fetch해 제목/커버를 가져옴. 빈 배열이면 배너 자체가 렌더되지 않음 |

### scoring_type 4종
| 타입 | 선택지 필드 | 결과 매칭 방식 | 1호 사용 여부 |
|---|---|---|---|
| `sum` | `score`(숫자) | 합산 점수가 `results[].min`~`max` 구간에 속하는 항목 | ✅ 실사용 |
| `type` | `type`(문자열) | 가장 많이 나온 `type`과 `results[].type`이 일치하는 항목 | 스키마/분기만 준비 |
| `quiz` | `correct`(true/false) | 정답 개수가 `results[].min`~`max` 구간에 속하는 항목 | 스키마/분기만 준비 |
| `axis` | `axis`(`'left'`\|`'right'`), `weight`(숫자, 기본 1) | `right` 비율(%)이 `results[].min`~`max` 구간에 속하는 항목. 결과에 `axisRatio` 필드가 추가로 붙음 | 스키마/분기만 준비 (2호 MBTI용) |

## 새 테스트를 추가하려면
1. `tests/{새-id}/` 폴더 생성
2. `index.html`을 `mental-age`의 것을 복사해 `data-test-id` 값만 교체
3. `config.json` 작성 (원하는 `scoring_type`에 맞는 `questions`/`results` 구조로)
4. `assets/cover.svg`, `assets/result/*.svg` 준비 — 이미지 경로는 전부 config.json에서 참조하므로 하드코딩된 경로 없음
5. 새 테마가 필요하면 `themes/{테마명}.css`를 추가하고 config의 `theme` 값을 그 이름으로 지정

## 이미지 생성 2단계 워크플로우 (2026-07-10~)
OpenAI(`gpt-image-1`) 단독 생성 품질이 부족하다고 판단해, 스타일 탐색과 프로덕션 생성을 분리했다.
비용을 최소화하려고 두 가지 경로를 준비해뒀다 — **기본값은 A(사실상 무료)**, B는 전액 자동화가
필요할 때만 쓰는 대안(결제 필요).

**A. 무료 레퍼런스 + OpenAI 배치 생성 (기본, 사실상 무료)**
1. **스타일 탐색(수동, 무료)**: Claude가 컨셉+포터블 프롬프트를 제안 → 사용자가 Gemini 무료 채팅
   (gemini.google.com, API 아닌 소비자용 앱이라 결제 없이 사용 가능) 등 외부 툴로 레퍼런스 이미지
   1장을 직접 뽑아 전달.
2. 받은 레퍼런스 이미지를 `tests/{testId}/assets/reference/`에 넣고
   `node test-engine/scripts/generate-assets.js {testId}` 실행 — `reference/`가 있으면 자동으로
   OpenAI `images/edits`(레퍼런스 이미지 최대 16장 입력, 스타일 전이 지원)로 그 스타일을 참조해
   나머지 세트를 생성한다. `reference/`가 없으면 기존처럼 순수 텍스트 생성(`images/generations`)
   그대로 동작(하위호환, mental-age 등 기존 자산 무변경). 이미 등록된 `OPENAI_API_KEY`만 있으면 되고
   신규 결제 설정 불필요, 건당 수 센트 수준(2026-07-10 실측: images/edits 200 OK 확인).

**B. 전액 자동화(참고용, 결제 필요) — `generate-assets-gemini.js`**
스타일 탐색까지 사람이 개입하지 않고 완전 자동으로 돌리고 싶을 때의 대안. 확정한 레퍼런스 이미지를
`tests/{testId}/assets/reference/`에 넣고 `node test-engine/scripts/generate-assets-gemini.js {testId}`로
나머지 결과 세트를 일괄 생성(Nano Banana Pro / `gemini-3-pro-image-preview`, 참조 이미지 최대 8장까지
블렌딩). `GEMINI_API_KEY` 필요(Codespaces Secrets에 등록됨) — **단, 이 모델은 무료 티어가 없어 키가
속한 Google Cloud 프로젝트에 결제가 활성화되어 있어야 실제로 이미지가 생성된다**(2026-07-10 실측:
결제 미활성 상태에서 `429 RESOURCE_EXHAUSTED` 확인, API 호출 구조 자체는 정상 검증됨). 현재는 A로
충분해 실사용 우선순위는 낮음.

## 알려진 제약 / 다음 단계
- `axis` 채점은 스키마와 분기 로직만 준비되어 있고, 실제 콘텐츠는 아직 없습니다 (2호 MBTI형 테스트 예정).
- 이 프로토타입은 아직 실제 사이트(메인 사이드바/심리테스트존)에 연결되지 않았습니다 — 사이트 연동은 기존 파일(`app.js` 등) 수정이 필요해 사전 승인 절차를 거쳐 진행 예정입니다.
- `sitemap.xml`에는 이미 `test-engine/tests/mental-age/index.html` URL이 등재되어 있습니다(STEP 2).
