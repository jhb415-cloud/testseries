# CLAUDE.md — 5-in-1 Dashboard SPA 핵심 규칙 (현재 v1.2.4)

"과몰입 연구소": Tailwind(사전 컴파일 정적 `tailwind.css`, v1.2.4~) + Vanilla JS 단일 SPA,
런타임 빌드 도구 없음. **새 Tailwind 클래스를 처음 쓰면 `tailwind.css` 재생성 필수**
(`tailwind.config.js` 상단 주석의 npx 한 줄 — 안 하면 그 클래스만 스타일이 안 먹음).

**작업 전 항상 이 순서로 읽기**: `PRD.md`(목적/제약) → `PROGRESS.md`(기능 현황·결정사항 로그,
실행 기준 — 유일한 변경 이력 문서). `HISTORIC_LOG.md`는 2026-08-09부로 폐기(2026-07-09 세션
#19 이후 갱신 안 됨, PROGRESS.md로 완전히 대체) — 더 이상 읽거나 쓰지 않는다. `test-engine/`은
별도 `test-engine/CLAUDE.md` 규칙을 따른다.

## 핵심 규칙
- 섹션: `#section-{id}` + `.section.hidden`, `App.navigate(id)`로 전환.
- 데이터 `window.AppData`(data.js) / 상태 `window.App.state`(app.js) 네임스페이스 유지.
- **테마**: 요소별 `dark:`/`light:` 절대 금지. `tailwind.config` remap + `style.css`의
  `:root`/`html.light` CSS 변수로만 처리. 중립 배경 위 텍스트는 `text-white` 대신
  `text-slate-100`.
- **버전**: 자리올림 카운터(각 자리 0~9, 9 다음 윗자리 +1 — v0.1.9 → v0.2.0). 올릴 때마다
  `index.html` 주석+사이드바 표시+정적자산 5곳 `?v=` 동기화, `PROGRESS.md`에 기록.
- 커밋: `타입: 내용 (버전)`, 목적당 1커밋만.
- 기획이 모호하면 임의로 구현하지 말고 먼저 질문할 것.
- **보고 언어(무조건 한글)**: 사용자에게 하는 모든 응답/보고/질문은 예외 없이 **항상 한국어로만**
  작성한다. 영어 혼용·영어 단독 응답 금지. Agent(서브에이전트) 조사 결과가 영어로 반환되더라도
  그대로 붙여넣지 말고 반드시 한국어로 번역해서 전달한다.

## 파일
`index.html`(SPA 전체) / `style.css` / `data.js` / `app.js` / `supabase-client.js` /
`kakao-share.js`. 전체 파일 트리, 데이터 구조 상세, 기능별 변경 이력은 `PROGRESS.md` 참고.
