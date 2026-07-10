# 이미지 컨셉 제안 대기 목록 (사용자 확인 대기 중)

새 워크플로우(Claude가 컨셉+포터블 프롬프트만 제안 → 사용자가 미드저니/나노바나나 등으로
직접 샘플 생성 → 맘에 드는 샘플을 Claude에게 전달 → Claude가 그 스타일로 나머지 확장)로
2026-07-10에 제안한 5개 테스트의 컨셉. 아직 사용자 승인 전, 이미지 미생성 상태.

번호는 `test-engine/tests/index.json`의 number 필드 기준(1~20).

---

## #1. K-직장인 유형 (6개 결과: 조용한퇴사형/월급루팡장인/일잘러코스프레형/프로일러형/사축형/오피스인싸형)
**컨셉**: "사원증 배지" 플랫 벡터 일러스트 — 회사 사원증 목걸이를 건 캐릭터가 각 유형의 소품
(예: 조용한퇴사형=책상에 엎드림+퇴사 스티커, 사축형=산더미 서류+다크서클)을 들고 있는 밈 카드.
클린한 벡터 라인(#19 mbti-stat-window의 회화풍과 완전히 다른 매체로 의도적 차별화).

```
Flat vector illustration, bold clean outlines, modern corporate meme poster style, a stylized office worker character wearing an employee ID badge lanyard, deadpan exaggerated expression, minimal flat shading, muted corporate palette (grays/navy) with brand teal (#1D9E75) and orange (#D85A30) accent props, no photorealism, no text, square format. [subject: 조용한퇴사형 — the character slumped face-down on a desk, a "퇴사각" sticky note on the monitor, resigned dead-eyed expression]
```

## #2. 무인도 생존 유형 (6개 결과: 3일컷리타이어형/족장등극형/혼자만생존형/눈치빌런형/감성낭만형/브레인참모형)
**컨셉**: "서바이벌 예능 포스터" 플랫 일러스트 — 열대 무인도 배경(야자수/모래사장), 각 유형별
생존 소품(족장등극형=코코넛 왕관+지휘봉, 브레인참모형=모래에 전략도 그림). #1과 같은 벡터
계열이지만 팔레트(샌디베이지+오션블루)로 구분.

```
Flat vector illustration, bold clean outlines, tropical survival reality-show poster style, a stylized character on a sandy desert island with palm trees and ocean horizon, deadpan exaggerated expression, minimal flat shading, sandy beige and ocean blue palette with brand teal (#1D9E75) and orange (#D85A30) accents, no photorealism, no text, square format. [subject: 족장등극형 — the character wearing a makeshift coconut-shell crown, holding a driftwood staff, standing triumphantly on a small sand mound like a throne]
```

## #11. 찐 MBTI vs 겉 MBTI (겉바속촉, outer×inner 256조합 — 유형별 개별 제작 불가, 범용 1~2장만)
**컨셉**: "이중 가면(연극 가면)" 모티프 — 겉/속 이분법에 정확히 맞는 소재. 스플릿 라이팅
(반은 화사한 사회적 가면, 반은 어두운 진짜 얼굴), 극장 가면 오브제.

```
Semi-flat painterly illustration, a dramatic theatrical mask split in half floating in space, one half a polished smiling golden mask catching bright light, the other half a cracked shadowy mask with a more raw honest expression, split dramatic lighting (bright warm orange on one side, deep teal shadow on the other), dark background, no text, no real people, square format.
```

## #12. 연애하면 바뀌는 MBTI (16유형 — #19처럼 유형별 개별 제작 후보)
**컨셉**: "로맨스 코미디 포스터" — 파스텔이 아니라 브랜드톤 유지한 채 따뜻한 데이트 무드,
설레는 표정 중심.

```
Semi-flat painterly illustration, warm romantic comic-poster style, a character on a date holding a small bouquet with a flustered lovestruck blush expression, soft warm lighting, dreamy bokeh-like light spots in the background, brand color accents in warm orange (#D85A30) and bright teal (#1D9E75), no text, no real people, square format.
```

## #13. 취중 MBTI (16유형 — #19처럼 유형별 개별 제작 후보)
**컨셉**: "포장마차 밤" 무드 — 네온 간판, 소주병, 노래방 마이크 등 소품으로 "취하면 나오는
인격" 표현. #12(연애모드)와 확실히 다른 무드(혼돈·코믹).

```
Semi-flat painterly illustration, chaotic late-night Korean street tent bar (pojangmacha) mood, a character mid-action looking tipsy and dramatically emotional, neon sign glow in the background, a small soju bottle nearby, exaggerated comic expression, brand color accents in warm orange (#D85A30) and bright teal (#1D9E75), dark night atmosphere, no text, no real people, square format.
```

---

## 다음 단계
사용자가 이 중 마음에 드는 방향을 미드저니/나노바나나 등으로 직접 생성해보고 샘플을
Claude에게 전달하면, 그 스타일을 기준으로 해당 테스트의 전체 결과 세트(#1/#2는 6장씩,
#11은 범용 1~2장, #12/#13은 16유형 전체)로 확장 진행.
