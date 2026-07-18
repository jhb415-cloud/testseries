# CLAUDE.md — 5-in-1 Dashboard SPA 핵심 규칙 (현재 v1.1.7)

"과몰입 연구소": Tailwind CDN + Vanilla JS 단일 SPA, 빌드 도구 없음.

**작업 전 항상 이 순서로 읽기**: `PRD.md`(목적/제약) → `PROGRESS.md`(기능 현황·변경 이력·
결정사항 로그, 실행 기준) → `HISTORIC_LOG.md`(최근 세션 맥락). `test-engine/`은 별도
`test-engine/CLAUDE.md` 규칙을 따른다.

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

## 파일
`index.html`(SPA 전체) / `style.css` / `data.js` / `app.js` / `supabase-client.js` /
`kakao-share.js`. 전체 파일 트리, 데이터 구조 상세, 기능별 변경 이력은 `PROGRESS.md` 참고.
