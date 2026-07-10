# 심리테스트 엔진 (test-engine) — STEP 3까지 진행된 프로토타입, 사이트에 실제 연동됨

## 버전 표기 규칙
이 하위 프로젝트는 메인 사이트의 `vX.Y.Z` 버전과 무관하게 **`test-engine vN (STEP N)`** 자체 표기를 씀 (engine.js/engine.css/themes/*.css 등 수정 파일 상단 주석 참고). 현재 `v3 (STEP 3 버그수정)`.

## 개요
`engine.js`/`engine.css`/`result-card.js`/`themes/*.css`는 기존 사이트(`index.html` / `app.js` / `data.js`)와 분리된 신규 엔진입니다.
목표는 `config.json` 하나로 새로운 심리테스트를 빠르게 찍어낼 수 있는 범용 엔진을 만드는 것입니다.
**단, STEP 3부터는 메인 사이트의 "심리 테스트존 > 몰입테스트" 탭과 홈 화면에서 실제로 링크가 걸려 있어(`app.js`의 `AppData.externalTests`/`sections.json`), 더 이상 완전히 격리된 프로토타입은 아닙니다.**

- **1호 콘텐츠**: `tests/mental-age/` — 정신연령 테스트 (MZ 톤, `sum` 채점, 윈도우95 레트로 테마, AI 생성 일러스트)
- 엔진 자체는 4가지 채점 방식(`sum`/`type`/`quiz`/`axis`)을 전부 지원하도록 설계했지만, 1호는 `sum`만 실제로 사용합니다.
- **STEP 2 추가**: 결과 화면 Canvas 공유카드 저장(`result-card.js`), 관련 테스트 배너(`config.related`)
- **STEP 3 추가**: 결과 화면 카카오톡 공유 버튼(메인 사이트와 같은 Kakao 앱 키 재사용, 같은 도메인이라 추가 등록 불필요), 모든 화면에 "← 메인으로" 고정 링크 — 둘 다 `engine.js`가 `init()` 시점에 자동으로 주입하므로 **새 테스트를 추가해도 별도 설정 없이 자동 적용됩니다.**

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
    generate-assets.js # STEP 1.5: config가 참조하는 이미지를 gpt-image-1로 생성하는 빌드타임 스크립트
  tests/
    mental-age/
      index.html       # 진입점. engine + result-card 로드, data-test-id="mental-age"
      config.json       # 테스트 데이터(질문/채점/결과/related)
      assets/
        cover.webp       # 커버 일러스트 (AI 생성, STEP 1.5)
        result/          # 결과 구간별 일러스트 (6개, AI 생성)
        prompts.md       # 이미지 생성에 사용한 프롬프트 (generate-assets.js가 파싱)
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
| `seed_count` | "N명이 확인했어요"의 기준값. 실제 표시값 = seed + 로컬 완료 카운트 |
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

## 알려진 제약 / 다음 단계
- `axis` 채점은 스키마와 분기 로직만 준비되어 있고, 실제 콘텐츠는 아직 없습니다 (2호 MBTI형 테스트 예정).
- 이 프로토타입은 아직 실제 사이트(메인 사이드바/심리테스트존)에 연결되지 않았습니다 — 사이트 연동은 기존 파일(`app.js` 등) 수정이 필요해 사전 승인 절차를 거쳐 진행 예정입니다.
- `sitemap.xml`에는 이미 `test-engine/tests/mental-age/index.html` URL이 등재되어 있습니다(STEP 2).
