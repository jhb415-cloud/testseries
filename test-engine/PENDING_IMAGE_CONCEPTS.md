# 이미지 컨셉 제안 대기 목록 (사용자 확인 대기 중)

새 워크플로우(Claude가 컨셉+포터블 프롬프트만 제안 → 사용자가 Gemini 무료 채팅 등으로 직접
레퍼런스 1장 생성 → Claude에게 전달 → Claude가 OpenAI images/edits로 그 스타일 참조해 나머지
확장, `test-engine/README.md` "이미지 생성 2단계 워크플로우" 참고)로 2026-07-10에 제안한 5개
테스트의 컨셉. **#1은 완료(아래 "완료" 절 참고). #2/#11/#12/#13은 2026-07-10에 재설계**
(사용자가 "컨셉은 다 다른데 이미지 톤/매체가 계속 비슷하다, 매번 플레이할 때마다 새로운
느낌이 들어야 한다"고 지적 — 팔레트만 다른 게 아니라 **렌더링 매체 자체**를 서로 겹치지
않게 재설계함, `test-engine/style-guide.md`의 "이미지 매체 다양성 원칙" 참고). 아직 사용자
승인 전, 이미지 미생성 상태.

번호는 `test-engine/tests/index.json`의 number 필드 기준(1~20).

---

## 완료 — #1. K-직장인 유형 (6개 결과 전부 생성·QA 완료, 사이트 연동만 남음)
**컨셉**: "사원증 배지" 플랫 벡터 일러스트. 매체: 플랫 벡터, 굵은 아웃라인. 팔레트: 그레이/네이비
+ 브랜드 청록/주황. UI 테마: 신규 `themes/office.css`. 사용자가 직접 뽑은 Gemini 레퍼런스
1장(조용한퇴사형)을 그대로 최종 결과로 채택, 나머지 5개+커버는 OpenAI images/edits로 그 스타일
참조 생성. **버그 발견**: `generate-assets.js` 파서가 헤딩당 한 줄만 읽는데 최초 프롬프트를
여러 줄로 줄바꿈해서 써서 truncation됨 — 이후 모든 프롬프트는 반드시 한 줄로 작성.

---

## 완료 — #2. 무인도 생존 유형 (6개 결과 전부 생성·QA 완료, 사이트 연동만 남음)
**컨셉**: 세피아 잉크 탐험일지/지도 스케치. 매체: 손그림 펜화(크로스해칭), 팔레트 세피아/브라운
단색. UI 테마: 신규 `themes/journal.css`. 사용자가 준 2패널 합성 레퍼런스를 좌(커버용)/우(눈치빌런형
포즈용)로 분리 — 우측은 그대로 opportunist.webp로 채택, 나머지 5개+커버는 OpenAI images/edits로
그 스타일 참조 생성(k-office-type에서 익힌 "레퍼런스 포즈 복사 금지 + 한 줄 프롬프트" 원칙 그대로
적용해 첫 시도에 전부 성공).

## #11. 찐 MBTI vs 겉 MBTI (겉바속촉, outer×inner 256조합 — 유형별 개별 제작 불가, 범용 1~2장만)
**컨셉(재설계)**: 종이 콜라주(레이어드 페이퍼컷) — 실제 색종이를 오려 붙인 듯한 층 구조, 종이
사이 그림자로 입체감. "겉/속" 이분법에 맞게 위층 종이 가면이 한쪽 모서리에서 들춰지며 안쪽에
다른 색 종이가 드러나는 구도. 촉각적인 paper-craft 질감이라 벡터·잉크스케치와도 확실히 다름.

커버 샘플 프롬프트:
```
Layered paper-cutout craft art (paper quilling style), multiple layers of colored cardstock with soft drop shadows between layers, a paper mask shape peeling up at one corner to reveal a different colored paper layer underneath, warm orange (#D85A30) paper on the top layer, teal (#1D9E75) paper visible underneath, cream paper background layer, subtle visible paper grain texture, no photorealism, no text, no watermark, no real people, square format.
```

## #12. 연애하면 바뀌는 MBTI (16유형 — #19처럼 유형별 개별 제작 후보)
**컨셉(재설계)**: 폴라로이드/스크랩북 다이어리 콜라주 — 다이어리 페이지에 폴라로이드 프레임
(둥근 흰 테두리) 붙이고 마스킹테이프·손낙서 하트를 곁들인 따뜻하고 개인적인 톤. 캐릭터는
폴라로이드 프레임 안에 일러스트로 등장(사진 대신 그림).

커버 샘플 프롬프트:
```
Scrapbook diary collage, a polaroid-style photo frame with a rounded white border containing a warm flat-illustration character portrait inside, surrounding washi tape strips at angles, small hand-doodled hearts and stars scribbled around the frame, a cream paper diary page background with subtle grid lines, soft warm color palette with brand orange (#D85A30) accents, no photorealism, no text, no watermark, no real people, square format.
```

## #13. 취중 MBTI (16유형 — #19처럼 유형별 개별 제작 후보)
**컨셉(재설계)**: 네온사인 라인아트 — 어두운 배경 위에 네온 튜브처럼 빛나는 아웃라인(글로우
효과), 포장마차/야간 술자리 소품을 네온 사인 형태로 표현. "빛나는 선" 매체라 위 3개와도
겹치지 않음.

커버 샘플 프롬프트:
```
Neon sign line art illustration on a dark navy background, a character silhouette outlined entirely in glowing neon tube lines (bright orange #D85A30 and teal #1D9E75 neon glow with soft bloom halo effect), minimal interior detail, a small neon soju bottle icon and neon speech-bubble icon glowing nearby, subtle dark cityscape silhouette in the background, no photorealism, no text, no watermark, no real people, square format.
```

---

## 다음 단계
사용자가 #2/#11/#12/#13 중 마음에 드는 방향을 컨펌하면, 그 컨셉의 레퍼런스 1장을 Gemini 무료
채팅 등으로 직접 뽑아 전달 → Claude가 OpenAI images/edits로 나머지 세트를 그 스타일로 확장
(#2는 6장, #11은 범용 1~2장, #12/#13은 16유형 전체 — 단 16유형 전체는 templateResult 방식이라
"대표 이미지 몇 종"으로 축소할지 여부도 착수 시 재확인 필요).
