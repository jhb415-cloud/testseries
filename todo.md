# TODO — 2026-07-21(월) 오후 작업

> 오전 세션에서 **MBTI존 게임형 개편 #53 파일럿**을 완주해 푸시함(커밋 `0535c24` 엔진 + `e3738e3` 이미지).
> 이 문서만 읽으면 오후에 바로 이어받을 수 있게 정리해둠. 상세 이력은 `test-engine/progress.md`
> "MBTI존 게임형 개편 — #53 파일럿" 절 참고.

---

## 0. 배경 — 무엇을 하려는 건가
51~60 MBTI존이 대부분 평범한 카드형 Q&A라, **"읽는 테스트 → 가지고 노는 테스트"** 로 바꾸는 작업.
이미 쓰인 인터랙션(슬라이더51 / 분기트리56 / 인트로입력58 / 타이머60 / 채팅UI48 / 각성게이지41 /
반응속도39)과 **중복되지 않는** 새 메커니즘을 테스트마다 하나씩 얹는다.

### 확정 5개 메커니즘 로드맵
| # | 테스트 | config 키 | 게임 컨셉 | 상태 |
|---|--------|----------|----------|------|
| 52 | 반려동물 판별기 | `image_choices` | 그림 카드를 탭하는 교감/컬렉션 게임 | 대기 |
| **53** | **종말 후 부족 리더** | **`resource_meters`** | **식량·식수·사기 3게이지 생존 대시보드** | **✅ 완료** |
| 54 | 로맨스 웹툰 주인공 | `affinity_meter` | 상대 반응 + ♥호감도로 엔딩 언락(오토메) | 대기 |
| 55 | 판타지 무기 판별기 | `point_budget` | 힘/민첩/지혜/의지 포인트 분배 RPG 빌드 | 대기 |
| 57 | 편의점 음식 판별기 | `multi_select` | 매대 돌며 장바구니 담기 수집 게임 | 대기 |

(59는 사용자가 제외. 56/58은 이미 특수엔진이라 대상 아님.)

---

## 1. ⭐ 먼저 결정할 것 — 사이트 연동 범위
**51~60이 통째로 사이트에 미연동 상태**다(`data.js`의 `mbtiZoneTests`는 #50까지만, `sections.json`
큐레이션·`sitemap`도 없음). 그래서 완성된 #53도 홈에 안 뜨고 아래 직접 URL로만 접근된다:

```
/test-engine/tests/53-mbti-post-apocalypse-tribe-leader/index.html
```

- [ ] **결정**: #53만 먼저 홈에 노출할지 / 51~60을 배치로 묶어 한 번에 연동할지
  - 배치로 묶으면: 52·54~60 이미지부터 다 만들어야 함(아래 3번)
  - #53만 먼저 노출하려면: `data.js` mbtiZoneTests에 항목 추가(`theme: 'wasteland'`,
    `engagementKey: 'site-mbtitribeleader-plays'`, `baseCount: 231` — config.json과 반드시 일치),
    `sections.json` 큐레이션 4그룹 중 하나에 배치(50개 넘기 전엔 새 그룹 금지),
    `sitemap.xml` + `llms.txt`/`llms-full.txt` 갱신, `index.html` 하단 "콘텐츠 최근 업데이트" 날짜 bump

## 2. ⭐ 라이브 속도 게이트 (나머지 4개 진행 여부를 결정)
엔진 v14가 61개 테스트 전체에 배포된 상태다.
- [ ] 라이브에서 **페이지 속도·로딩속도** 확인(PSI 등)
- [ ] 문제 없으면 → 52/54/55/57 확장 착수. 문제 있으면 → 원인부터 잡기
- 참고: `resource_meters`는 순수 연출 레이어라 채점 무관, 추가 네트워크 요청도 없음
  (engine.css에 클래스 몇 개 + engine.js에 함수 5개 추가가 전부)

## 3. 이미지 미생성 테스트 마무리
**52·54~60은 아직 이미지가 없다**(51도 확인 필요). 전수 QA에서 "깨진 이미지"로 잡힌 항목들.

- [ ] 각 테스트별로 `assets/prompts.md` 작성 → `node test-engine/scripts/generate-assets.js {폴더명}`
- **규칙(중요)**:
  - ❌ **무료/placeholder 이미지 만들지 말 것** (사용자 명시)
  - ✅ 각 폴더 `assets/reference/`에 승인된 레퍼런스가 이미 있음 → 스크립트가 자동으로
    `images/edits`(스타일 전이)로 전환됨. `.gitignore` 대상이라 커밋엔 안 올라감
  - ✅ 결과별 이미지 컨셉은 **`test-engine/mbti41~60.md`** 의 "(이미지: …)" 설명을 참고
  - ✅ 프롬프트 템플릿은 **`tests/53-.../assets/prompts.md`** 가 좋은 본보기
    (레퍼런스가 2패널이면 "SINGLE panel only, ignore the reference's two-panel split" 명시 필수)
  - ✅ 기존 파일은 자동 스킵되므로, 커버+샘플 1장만 먼저 넣고 돌려서 톤 확인 후 나머지 추가(4-4 절차)
  - ✅ 생성 후 홈 썸네일도: `cover-home.webp`(360px) — CLAUDE.md 4-5의 PIL 원라이너
- [ ] `style-guide.md` "사용된 매체 목록"에 매체 추가(기존과 중복 금지)

## 4. 나머지 4개 메커니즘 구현 (2번 게이트 통과 후)
#53과 동일한 패턴으로 진행하면 된다. **엔진 확장 시 반드시 지킬 것**:
- 새 config 키로만 켜지는 **옵트인**, 그 키가 없는 config는 렌더·채점 완전 동일(하위호환)
- 채점 switch(`applyScoring`/`computeResult`)는 가능하면 건드리지 말고 **연출 레이어**로 처리
  (#41 awaken_meter, #53 resource_meters가 그 방식)
- `engine.js` 헤더 vN + `ENGINE_ASSET_VERSION` 올리고 → **61개 index.html의 `?v=` 일괄 sed 치환**
  (`result-card.js`는 안 건드렸으면 v2 그대로)
- 새 테마는 `themes/{name}.css` 신규 파일 + `app.js`의 `THEME_TITLE_FONTS` 등록 +
  `.te-app`에 `--te-footer-bg` 정의 + `.te-choices-fixed`에 position/margin-top 덮어쓰기 금지
- 끝나면 Playwright 전수 QA

---

## 참고 — 오전에 끝낸 것 (다시 하지 말 것)
- `engine.js` v13→v14: `resource_meters` 옵트인 추가
  (`resetResources`/`applyResourceDelta`/`resourceMeterHtml`/`animateResourceMeter`/`computeSurvivalIndex`),
  결과 화면 "🏕️ 부족 생존 지수 N% + 판정" 스탯
- `engine.css`: `.te-resource-*` 대시보드 + `.te-result-stat-sub`
- `themes/wasteland.css` 신규(폐허 생존기지, Black Ops One) + `app.js` 폰트 등록
- `#53 config.json`: `resource_meters` 정의 + 32개 선택지 `delta` + `theme: wasteland`
- 61개 index.html `?v=13→14` 일괄 교체
- #53 이미지 9/9 생성(실사 손조각 나무 토템 + 폐허 보케 세피아) + `cover-home.webp`
- 전수 QA 62개: **pageerror 0 / 파일404 0 / #53 통과**
  (남은 경고는 전부 Supabase 익명로그인 **429 레이트리밋** — 62개 연속 재생 탓인 환경 이슈,
   개별 재생하면 사라짐. 회귀 아님)
- `/CLAUDE.md`에 "사용자 응답은 무조건 한글" 규칙 강조 반영
