# CLAUDE.md — 5-in-1 Dashboard SPA 아키텍처 규칙

## 현재 버전: v0.0.1

## 프로젝트 개요
Tailwind CSS(CDN) + 순수 Vanilla JS 기반 5-in-1 종합 테스트 대시보드 SPA.
빌드 도구 없음, 단일 HTML 파일 구조 (외부 JS/CSS 로드 방식).

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
```

- 모든 섹션은 `section` 클래스를 공유하고, 초기에는 `hidden` 상태
- active 섹션만 `hidden` 제거 + `fade-in` 애니메이션 적용
- Tailwind 클래스 우선, 커스텀 CSS는 style.css에만 작성

---

## data.js 규칙

```javascript
// 네임스페이스: window.AppData 사용
window.AppData = {
  quotes: [...],          // 오늘의 한마디 문구 배열
  dreamData: [...],       // 꿈 해몽 데이터 배열
  fortuneData: {...},     // 운세 데이터 객체 (띠별)
  mbtiQuestions: [...],   // MBTI 12문항 배열
  mbtiResults: {...},     // MBTI 16유형 결과 객체
  adhdQuestions: [...],   // ADHD 10문항 배열
  adhdResults: [...],     // ADHD 결과 등급 배열
};
```

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

## 이어서 작업 시 필수 체크리스트

1. `HISTORIC_LOG.md` 먼저 읽어 이전 세션 합의사항 파악
2. 현재 버전 확인 후 작업 시 다음 버전으로 업데이트
3. 기획 모호한 부분 → 임의 코딩 금지, 즉시 질문
