# CLAUDE.md — 5-in-1 Dashboard SPA 아키텍처 규칙

## 현재 버전: v0.0.15

## 프로젝트 개요
Tailwind CSS(CDN) + 순수 Vanilla JS 기반 5-in-1 종합 테스트 대시보드 SPA.
빌드 도구 없음, 단일 HTML 파일 구조 (외부 JS/CSS 로드 방식).

---

## 2. 기능 현황

| 기능 | 상태 | 버전 | 비고 |
|---|---|---|---|
| MBTI 12문항 테스트 | ✅ 완료 | v0.0.1 | |
| 꿈 해몽 검색 (통합설명) | ✅ 완료 | v0.0.1 | |
| 오늘의 운세 (띠별) | ✅ 완료 | v0.0.1 | |
| 두뇌 나이 측정기 (스트룹) | ✅ 완료 | v0.0.1 | |
| ADHD 성향 진단 | ✅ 완료 | v0.0.1 | |
| 꿈해몽 구조 개편 (테마+하위칩) | ✅ 완료 | v0.0.4 | "오늘의 행동" 잘림버그 동시 수정 |
| 꿈해몽 데이터 15개→59개 확장 | ✅ 완료 | v0.0.5 | 약 20개 테마에 하위variants 포함 |
| 띠별 운세 행운숫자 필드 | ✅ 완료 | v0.0.6 | 로또 연동용 |
| 공유하기 (Web Share API) | ✅ 완료 | v0.0.7 | MBTI/운세/두뇌나이/ADHD 적용 |
| 마이홈 대시보드 | ✅ 완료 → v0.0.10에서 홈에 통합 | v0.0.8 | 닉네임/완주현황/방문스트릭/최근기록. 별도 섹션 제거, 홈 화면에 병합 |
| 로또 번호 조합기 (랜덤/직접지정/운세연동) | ✅ 완료 | v0.0.9 | |
| 라이트/다크 모드 토글 | ✅ 완료 | v0.0.10 | 사이드바(PC)·모바일 헤더에 토글 버튼. 기본값 다크, localStorage(`theme`)에 기억 |
| 마이홈 → 홈 화면 통합 | ✅ 완료 | v0.0.10 | 마이홈 섹션/메뉴 제거, 닉네임·스트릭·완주현황·최근기록을 홈 화면에 병합 |
| 카카오톡 공유 | 🔲 백로그 | - | Kakao Developers JS 키 발급 필요 |
| 로또 통계기반 추천 (실제 당첨번호) | 🔲 백로그 | - | Cloudflare Functions 프록시(B안)로 진행 예정 |
| 구글 애드센스 실 게재 | 🔲 백로그 | - | 심사 승인 후 publisher ID 삽입 |
| 댓글 백엔드 연동 | 🔲 백로그 | - | 현재 로컬스토리지 임시 저장 |
| MBTI 16유형 상세 텍스트 검수 | 🔲 백로그 | - | |
| PWA 오프라인 지원 | 🔲 백로그 | - | |
| 두뇌나이(스트룹) 모바일 터치 지연 보정 | 🔲 백로그 | - | PRD.md 학습 반영. touchstart 우선 처리로 ms 정밀도 확보 필요 |
| 오늘의 한마디 → 유명인 명언 200개 교체 | 🔲 백로그 | - | Stage B(신규테스트 10종) 완료 후 진행. 무작위 추첨 대신 날짜순 순환(200일 비중복). 상세는 PRD.md 9-4 |
| Phase 2 확장 로드맵 (신규 인지테스트 6종+α, 난이도/모드 체계, 메뉴 개편, 재미요소, 백엔드) | 📋 기획 완료·순차 구현 중 | - | 상세는 `PRD.md` "9. 확장 로드맵" 참고 |
| ㄴ Stage A: 메뉴 구조 개편 (사이드바 "테스트" 그룹화) | ✅ 완료 | v0.0.11 | MBTI/두뇌나이/ADHD를 접이식 그룹으로, 꿈해몽/운세/로또는 최상위 유지 |
| ㄴ Stage B: 신규 인지테스트 10종 | 🔄 진행 중 (4/10) | - | 순서 확정(PRD.md 9-1 참고): 반응속도→숫자기억→순서기억→색각→논리력→충동억제→숏폼집중력→인싸력→속담완성→그시절물가 |
| ㄴㄴ 반응속도 테스트 | ✅ 완료 | v0.0.12 | 쉬움(5회)/보통(7회,반칙페널티)/어려움(10회,가짜신호 30%). 티어 S~D + 유머 코멘트, 공유 |
| ㄴㄴ 숫자 기억력 테스트 | ✅ 완료 | v0.0.13 | 적응형 자릿수(맞히면 +1/틀리면 -1). 쉬움 3자리~/보통 4자리~/어려움 5자리~+3초 방해단계. 탭 키패드 UI |
| ㄴㄴ 순서 기억력 테스트 | ✅ 완료 | v0.0.14 | 격자 타일 순서 암기(3x3, 어려움은 4x4). 탭마다 즉시 정오답 판정(Simon-says류 UX). 적응형 칸수 |
| ㄴㄴ 색각 테스트 | ✅ 완료 | v0.0.15 | "미묘하게 다른 색 타일 찾기" 게임(임상 색맹검사 아님, 안내문구 명시). 격자 3x3~5x5+시간제한, 정확도·반응속도 기반 티어 |

---

## 3. 데이터 구조 요약
- `dreamData`: 테마(keywords/title/summary/detail/lucky/luckyNum/action) + `variants[]`(하위 세부꿈)
- `fortuneData`: 띠별 base 운세 + `luckyNum`
- localStorage 키: `ranking_*`, `done_*`, `app_nickname`, `visit_streak`, `last_fortune_luckynum`, `last_dream_luckynum` 등

---

## 4. 변경 이력 (요약)
| 일자 | 버전 | 내용 |
|---|---|---|
| 2026-06-28 | v0.0.1 | 최초 생성, 5개 테스트 구조 구현 |
| 2026-06-29 | v0.0.3 | 애드센스 승인 전 광고 플레이스홀더 제거 |
| 2026-07-02 | v0.0.4~0.0.9 | 꿈해몽 구조개편/확장, 공유하기, 마이홈, 로또조합기 추가 |
| 2026-07-02 | v0.0.10 | 라이트/다크 모드 토글 추가, 마이홈을 홈 화면으로 통합 |
| 2026-07-02 | v0.0.11 | Phase 2 확장 로드맵 기획 확정 (PRD.md 9번 섹션). Stage A: 사이드바에 "테스트" 그룹(접기/펼치기) 신설 |
| 2026-07-02 | v0.0.12 | Stage B 착수: 반응속도 테스트 신설 (난이도 3단계, pointerdown 기반 ms 정밀 측정, 가짜신호 반칙 로직) |
| 2026-07-02 | v0.0.13 | Stage B 계속: 숫자 기억력 테스트 신설 (적응형 자릿수, 탭 키패드 UI, 어려움 모드 방해단계) |
| 2026-07-02 | v0.0.14 | Stage B 계속: 순서 기억력 테스트 신설 (격자 타일, 즉시 판정 UX). 사이드바 "테스트" 그룹 높이 고정값 버그 수정(항목 늘어나며 위쪽이 잘리던 문제) |
| 2026-07-02 | v0.0.15 | Stage B 계속: 색각 테스트 신설 (색 구별 감각 게임, 임상 검사 아님을 명시) |

---

## 5. 진행 중 결정사항 로그 (기획 논의에서 합의된 것)
- 로또 조합기는 "다른 사이트와 차별화" 목적으로 4가지 모드(랜덤/직접지정/운세연동/통계기반) 설계, 통계기반은 후순위
- 꿈해몽 검색 UX: 드롭다운 강제 없이 "통합설명 먼저 → 하위 칩으로 점진적 심화" 방식 채택
- 카카오 공유는 JS 키 없어서 보류, Web Share API로 우선 대응
- 라이트 모드는 순백(#fff) 대신 은은한 블루그레이 톤으로 설계 (사용자 요청). 기본 테마는 계속 다크 유지, 라이트는 선택 옵션
- 마이홈은 별도 메뉴로 유지하지 않고 홈 화면에 완전 통합하기로 결정 (사용자 요청 — "적절히 합쳐줘")
- **Phase 2 확장(2026-07-02) 합의사항** — 상세는 `PRD.md` "9. 확장 로드맵" 참고:
  - 진행 순서: A.메뉴개편 → B.신규 인지테스트 6종+α → C.난이도체계 → (D.백엔드는 보류) → E.동물비유카드 → F.레이더차트 → G.라이트모드 일괄반영
  - 백엔드(퍼센타일 집계, Supabase+Cloudflare R2)는 지금 만들지 않음. 콘텐츠가 쌓여 실제 운영 단계 진입 시 카카오공유와 함께 착수 — **그 시점이 오면 Claude가 먼저 리마인드할 것**
  - 난이도 체계: 신규 인지테스트·두뇌나이(스트룹)는 쉬움/보통/어려움 3단계. MBTI·ADHD는 간단/정밀 2모드(난이도 아닌 진단 깊이 개념). 오늘의 운세는 이번 라운드 제외
  - 재미 요소(친구대결/오늘의챌린지/사운드/칭호 등)는 백로그로 기록만 해두고, 구조가 안정될 때까지 구현 보류

---

## 파일 구조 및 역할

```
testseries/
├── index.html        # 메인 SPA 진입점. 모든 섹션 div가 여기에 선언됨
├── style.css         # Tailwind로 커버 안 되는 커스텀 CSS (애니메이션, 게이지 바 등)
├── data.js           # 정적 데이터 파일 (꿈 해몽, 운세, MBTI 결과 등)
├── app.js            # 전체 SPA 로직, 이벤트 핸들러, 상태 관리
├── CLAUDE.md         # 아키텍처 규칙 (이 파일)
└── HISTORIC_LOG.md   # 히스토리 로그 (세션 간 이어서 작업할 때 반드시 먼저 읽기)
```

---

## index.html 구조 규칙

```html
<!-- 섹션 네이밍 규칙 -->
<div id="section-home"   class="section hidden"> ... </div>
<div id="section-mbti"   class="section hidden"> ... </div>
<div id="section-dream"  class="section hidden"> ... </div>
<div id="section-fortune" class="section hidden"> ... </div>
<div id="section-brain"  class="section hidden"> ... </div>
<div id="section-adhd"   class="section hidden"> ... </div>
<div id="section-lotto"  class="section hidden"> ... </div>  <!-- v0.0.9 추가 -->
```
※ `section-mypage`는 v0.0.10에서 제거됨 — 마이홈 내용은 `section-home` 내부의 `#home-mypage-container`로 통합 (`renderHomeMypage()` 참고)

- 모든 섹션은 `section` 클래스를 공유하고, 초기에는 `hidden` 상태
- active 섹션만 `hidden` 제거 + `fade-in` 애니메이션 적용
- Tailwind 클래스 우선, 커스텀 CSS는 style.css에만 작성

---

## data.js 규칙

```javascript
// 네임스페이스: window.AppData 사용
window.AppData = {
  quotes: [...],          // 오늘의 한마디 문구 배열
  dreamData: [...],       // 꿈 해몽 데이터 배열 (v0.0.9~ 구조 변경, 아래 참고)
  fortuneData: {...},     // 운세 데이터 객체 (띠별, v0.0.9~ luckyNum 필드 포함)
  mbtiQuestions: [...],   // MBTI 12문항 배열
  mbtiResults: {...},     // MBTI 16유형 결과 객체
  adhdQuestions: [...],   // ADHD 10문항 배열
  adhdResults: [...],     // ADHD 결과 등급 배열
};
```

### dreamData 구조 (v0.0.9~)
"검색 → 통합설명 먼저 → 하위 관련꿈 칩(chip)" UX를 위해 테마+하위variants 구조로 개편함.
```javascript
{
  keywords: ["뱀", "뱀꿈", "구렁이"],   // 테마 검색 키워드
  title: "뱀이 나오는 꿈",              // 테마 통합 제목
  summary: "...", detail: "...", lucky: "...", luckyNum: "...", action: "...",
  variants: [                          // 하위 세부 꿈 (없으면 빈 배열)
    { keywords: ["뱀에게 물리다"], title: "뱀에게 물리는 꿈", detail: "...", lucky: "...", luckyNum: "...", action: "..." }
  ]
}
```
- 총 59개 테마, 그중 약 20개 테마에 하위 variants 포함 (총 variants 44개)
- 검색은 테마 키워드 + 모든 variants 키워드를 동시에 매칭
- variants가 있는 테마는 모달 하단에 칩 형태로 노출, 클릭 시 로딩 없이 즉시 전환

### fortuneData 구조 (v0.0.9~)
띠별 데이터에 `luckyNum` 필드 추가 (로또 조합기 "오늘의 운세·꿈 연동" 모드에서 사용).

## localStorage 키 규칙 (v0.0.9~)
- `ranking_{section}`: 섹션별 결과 기록 (mbti/fortune/brain/adhd)
- `comments_{section}`: 섹션별 댓글 임시 저장
- `done_{section}`: 마이홈 완주 현황 플래그 ('1'이면 완료) — mbti/dream/fortune/brain/adhd
- `app_nickname`: 마이홈에 저장된 대표 닉네임
- `visit_streak`, `last_visit_date`: 연속 방문 스트릭
- `last_fortune_luckynum`, `last_dream_luckynum`: 로또 조합기 "운세·꿈 연동" 모드 시드값
- `theme`: `'light'` | `'dark'` (없으면 다크가 기본값) — v0.0.10 다크/라이트 토글

---

## 다크/라이트 테마 아키텍처 (v0.0.10~)

**절대 개별 요소에 `dark:`/`light:` variant를 달지 말 것.** 이 프로젝트는 빌드 도구가 없고 app.js가 Tailwind 유틸리티 클래스가 박힌 HTML 문자열을 대량으로 생성하기 때문에, 요소 하나하나에 라이트 모드 클래스를 추가하는 방식은 유지보수가 불가능하다. 대신 **CSS 변수 remap** 방식을 쓴다.

- `index.html`의 `tailwind.config`(Tailwind CDN 런타임 설정)에서 `slate` 팔레트 전체와, "부드러운 강조 박스"(`bg-{color}-900|800|700` + 투명도 + `text-{color}-200|300|400`)에 쓰이는 blue/indigo/violet/emerald/rose/amber/yellow의 일부 shade를 `rgb(var(--x) / <alpha-value>)` 형태로 remap해 둠.
- `style.css`의 `:root`(`html`, 다크=Tailwind 표준값)와 `html.light`(라이트 override) 두 블록에서 실제 색상값을 정의. 라이트 값은 순백이 아닌 블루그레이 계열로 설계됨.
- `app.js`의 `toggleTheme()`이 `<html>`에 `light` 클래스를 토글하고 `localStorage.theme`에 저장. `index.html` `<head>`의 인라인 스크립트가 렌더 전에 즉시 반영해 FOUC를 방지함.
- **500/600 shade(버튼·뱃지 원색)는 remap 대상이 아님** — 항상 선명한 원색 유지가 목적이므로 손대지 않는다.
- **새 UI를 추가할 때**: 중립 표면(카드/입력창/페이지 배경 등 slate 계열) 위에 올라가는 텍스트는 `text-white`를 절대 하드코딩하지 말고 `text-slate-100`(또는 hover 시 `text-slate-50`)을 쓸 것 — 그래야 라이트 모드에서도 자동으로 대비가 유지된다. `text-white`는 violet-600/blue-600/amber 그라데이션처럼 테마와 무관하게 항상 채도 높은 색상 배경 위에서만 사용한다.
- 새로운 accent 색상이나 shade가 필요해지면, 같은 패턴(`tailwind.config`에 remap 추가 + `style.css`에 dark/light 값 추가)을 따를 것.

---

## app.js 규칙

```javascript
// 전역 상태 네임스페이스: window.App
window.App = {
  state: {
    currentSection: 'home',
    // 섹션별 상태
    mbti: { nickname: '', answers: [], step: 0 },
    brain: { nickname: '', difficulty: null, answers: [], step: 0 },
    adhd: { nickname: '', answers: [], step: 0 },
    fortune: { year: null },
  },
  // 메서드
  navigate(sectionId) { ... },
  showLoader(callback) { ... },  // 3초 광고 프리로더
};
```

---

## SPA 네비게이션 규칙

- `navigate(sectionId)` 호출 → 모든 `.section` div에 `hidden` 추가 → 해당 섹션만 `hidden` 제거 + `fade-in` 클래스 추가
- URL hash 변경: `location.hash = '#' + sectionId`
- 뒤로가기 지원: `hashchange` 이벤트 리스닝
- **사이드바 "테스트" 그룹 (v0.0.11~)**: MBTI/두뇌나이/ADHD처럼 "인지·성향 테스트" 성격의 신규 섹션은 `#nav-group-tests-items` 안에 `nav-item nav-subitem` 형태로 추가할 것. 꿈해몽/운세/로또처럼 검색·도구·유틸 성격인 것은 그룹 밖 최상위 `nav-item`으로 유지. 그룹은 `.nav-group.open` 클래스로 펼침 상태 표시, `localStorage.nav_tests_collapsed`로 접힘 여부 기억, 그룹 내부 항목이 active가 되면 `navigate()`가 자동으로 그룹을 펼침

---

## 광고 프리로더 규칙

- 결과 화면 진입 전 3초 딜레이
- 중앙에 `<div id="ad-placeholder">` — 실제 애드센스 코드 삽입 위치
- `<!-- [광고] Google AdSense 삽입 위치 -->` 주석 필수

---

## 버전 관리 규칙

- 의미 있는 변경마다 v0.0.x 증가 (x += 1)
- 변경 시 index.html 최상단 주석 + HISTORIC_LOG.md 동시 업데이트
- 버전 형식: `<!-- v0.0.x | 5-in-1 Dashboard SPA -->`

---

## 확장 Placeholder UI 규칙 (모든 결과 페이지 하단 공통)

```html
<!-- ① 통계 비교 지면 (추후 실데이터 교체) -->
<!-- ② 랭킹/공유 지면 (로컬스토리지 연동) -->
<!-- ③ 댓글 지면 (추후 백엔드 연동) -->
```

---

## 커밋 메시지 규칙
`git commit` 시 아래 형식을 따른다.
```
타입: 내용 (버전)
```
- 타입: `feat`(기능추가) / `fix`(버그수정) / `docs`(문서수정) / `refactor`(구조개선)
- 예시: `feat: 로또 조합기 추가 (v0.0.9)`, `fix: 꿈해몽 텍스트 잘림 수정 (v0.0.4)`
- 여러 기능이 섞인 경우 커밋을 나눠서 진행 (한 커밋 = 한 목적)

## 이어서 작업 시 필수 체크리스트

0. `PRD.md`에서 프로젝트 목적/규칙/제약을 파악 (거의 안 바뀜, 최초 1회 숙지)
1. 이 문서 상단 "2. 기능 현황" 표 + "5. 진행 중 결정사항 로그"를 먼저 읽어 전체 기획 현황 파악 — **실행 기준**
2. `HISTORIC_LOG.md`는 최신 세션(맨 위) 위주로 훑어 직전 작업 맥락만 파악 (전체를 매번 다 읽을 필요는 없음)
3. 현재 버전 확인 후 작업 시 다음 버전으로 업데이트
4. 기획 모호한 부분 → 임의 코딩 금지, 즉시 질문
5. 새 기능/수정사항이 확정되면 이 문서의 "2. 기능 현황" 표와 "4. 변경 이력"에 동시 반영
