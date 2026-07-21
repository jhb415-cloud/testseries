# TODO — 2026-07-21(월) 이어서 작업

> 오전 세션: **MBTI존 게임형 개편 #53 파일럿** 완주해 푸시(커밋 `0535c24` 엔진 + `e3738e3` 이미지).
> 이어서 이번 세션: 사용자가 "성능 저하는 나중에 손본다 치고 51/52/54/55번 제작해줘"로 속도 게이트를
> 건너뛰고 진행 승인 → **#51/52/54/55 콘텐츠 제작 완료**(엔진 v14→v15). 상세 이력은
> `test-engine/progress.md` "MBTI존 게임형 개편 2차 배치 — #51/52/54/55" 절 참고. 아직 커밋 전.

---

## 0. 배경 — 무엇을 하려는 건가
51~60 MBTI존이 대부분 평범한 카드형 Q&A라, **"읽는 테스트 → 가지고 노는 테스트"** 로 바꾸는 작업.
이미 쓰인 인터랙션(슬라이더51 / 분기트리56 / 인트로입력58 / 타이머60 / 채팅UI48 / 각성게이지41 /
반응속도39)과 **중복되지 않는** 새 메커니즘을 테스트마다 하나씩 얹는다.

### 확정 5개 메커니즘 로드맵
| # | 테스트 | config 키 | 게임 컨셉 | 상태 |
|---|--------|----------|----------|------|
| 52 | 반려동물 판별기 | `image_choices` | 축별 이모지 카드 탭 + 수집 스티커판 | **✅ 완료** |
| 53 | 종말 후 부족 리더 | `resource_meters` | 식량·식수·사기 3게이지 생존 대시보드 | **✅ 완료** |
| 54 | 로맨스 웹툰 주인공 | `affinity_meter` | ♥호감도 게이지 + 상대 반응 문구 | **✅ 완료** |
| 55 | 판타지 무기 판별기 | `point_budget` | 힘/민첩/지혜/의지 포인트 분배 미니게임 | **✅ 완료** |
| 57 | 편의점 음식 판별기 | `multi_select` | 매대 돌며 장바구니 담기 수집 게임 | 대기 |

(51은 로드맵 5개엔 없었지만 기존 `slider_ui` 재사용 + 테마·이미지 신규 제작으로 이번에 같이 완료.
59는 사용자가 제외. 56/58은 이미 특수엔진이라 대상 아님.)

---

## 1. ⭐ 다음에 결정할 것 — 사이트 연동 범위 (그대로 미결)
**51~60이 통째로 사이트에 미연동 상태**다(`data.js`의 `mbtiZoneTests`는 #50까지만, `sections.json`
큐레이션·`sitemap`도 없음). 완성된 #51/52/53/54는 아직 홈에 안 뜨고 직접 URL로만 접근된다:
```
/test-engine/tests/51-mbti-drinking-party-character/index.html
/test-engine/tests/52-mbti-pet-animal-type/index.html
/test-engine/tests/53-mbti-post-apocalypse-tribe-leader/index.html
/test-engine/tests/54-mbti-webtoon-romance-lead/index.html
/test-engine/tests/55-mbti-fantasy-weapon/index.html
```
- [ ] **결정**: 지금까지 완료된 5개(51/52/53/54/55)만 먼저 배치로 묶어 연동할지 / #57까지 마저
  만들고 51~60 전체를 한 번에 연동할지
- 연동 시 필요한 것(5개 전부): `data.js` mbtiZoneTests 항목 추가(`theme`/`engagementKey`/
  `baseCount`= config.json의 seed_count와 반드시 일치), `sections.json` 큐레이션 4그룹 중 하나에
  배치(50개 넘기 전엔 새 그룹 금지), `sitemap.xml` + `llms.txt`/`llms-full.txt` 갱신, `index.html`
  하단 "콘텐츠 최근 업데이트" 날짜 bump — **이 파일들 수정 전엔 항상 먼저 보여주고 승인받을 것**
  (test-engine/CLAUDE.md 4-5).

## 2. 라이브 속도 게이트 — 이번엔 건너뜀
사용자가 "성능이 떨어지긴 했다, 나중에 손본다 치고 진행해줘"로 명시적으로 게이트를 건너뛰고
51/52/54/55 제작을 승인함. **PSI 등 실측정은 여전히 안 한 상태** — 언젠가 사용자가 "이제 성능
손보자"고 하면 그때 대응(dreamData 지연 로드 등, `project_pagespeed_followup` 메모리 참고).
엔진은 v15까지 올라 61개 테스트 전체에 배포된 상태.

## 3. 이미지 — 51/52/54/55는 완료, 57만 남음
- [x] #51/52/54/55: 각 9/9(cover+결과8) 생성 완료, `cover-home.webp` 썸네일도 전부 생성함
- [ ] #57(편의점 음식 판별기)만 레퍼런스 확보(`assets/reference/`) → 4-4 절차로 진행 필요

## 4. 나머지 1개 메커니즘 구현 — `multi_select`(#57)
51/52/54/55와 동일한 패턴으로 진행하면 된다. **엔진 확장 시 반드시 지킬 것**:
- 새 config 키로만 켜지는 **옵트인**, 그 키가 없는 config는 렌더·채점 완전 동일(하위호환)
- 채점 switch(`applyScoring`/`computeResult`)는 가능하면 건드리지 말고 **연출 레이어**로 처리
- `engine.js` 헤더 vN + `ENGINE_ASSET_VERSION` 올리고 → **61개 index.html의 `?v=` 일괄 sed 치환**
  (`result-card.js`는 안 건드렸으면 v2 그대로)
- 새 테마는 `themes/{name}.css` 신규 파일 + `app.js`의 `THEME_TITLE_FONTS` 등록 +
  `.te-app`에 `--te-footer-bg` 정의 + `.te-choices-fixed`에 position/margin-top 덮어쓰기 금지
- 끝나면 Playwright 전수 QA

---

## 참고 — 이번 세션에 끝낸 것 (다시 하지 말 것)
- `engine.js`/`engine.css` v14→v15: `image_choices`(#52)/`affinity_meter`(#54)/`point_budget`(#55)
  옵트인 3종 추가 — 전부 mbti4 채점 위 순수 연출/보조 레이어, 하위호환
- 61개 index.html `?v=14→15` 일괄 교체
- `themes/receipt.css`(#51, VT323) / `themes/vetclip.css`(#52, Patrick Hand) /
  `themes/webtoon.css`(#54, Gowun Dodum) / `themes/rpginventory.css`(#55, Rajdhani) 신규 +
  `app.js` THEME_TITLE_FONTS 4건 등록
- #51/52/54/55 config.json 4개 전부: theme 반영 + 신규 메커니즘 필드/선택지 delta·reaction 작성
- #51/52/54/55 이미지 9/9×4 = 36장 생성(실패 0) + `cover-home.webp` 4개
- #55 결과 traits에 `{topstat}` 문법 버그 발견·수정("{topstat}였다" → "{topstat} 쪽이었다",
  받침 유무 무관하게 항상 자연스럽도록)
- Playwright QA 4/4 통과(콘솔 에러 0/깨진 이미지 0/플레이스홀더 미치환 0)
- `test-engine/tests/index.json`, `style-guide.md`, `progress.md` 갱신
- **아직 안 한 것**: 사이트 연동(1번), git 커밋/푸시 — 사용자 확인 후 진행
