# 이상형 월드컵 이미지 소싱 방식 (팩별로 다름)

이 프로젝트의 이미지형 월드컵 팩 4개는 소싱 방식이 팩마다 다르다 — 전부 AI로 통일하지 않았다.

| 팩 | 소싱 방식 | 이유 |
|---|---|---|
| `cute-animals-32` | CC0 실사 스톡사진 (수동 수급) | 동물/음식/여행은 "진짜 사진"이라는 리얼함 자체가 재미 요소라, AI 생성 이미지로 대체하면 부자연스럽고 상업이용 스톡사진(Unsplash/Pexels/Pixabay 등)이 이미 충분히 존재함. 키워드는 `worldcup-sources/cute-animals-32.sources.json` 참고 |
| `soul-food-32` | CC0 실사 스톡사진 (수동 수급) | 위와 동일. `worldcup-sources/soul-food-32.sources.json` |
| `korea-travel-16` | CC0 실사 스톡사진 (수동 수급) | 위와 동일. `worldcup-sources/korea-travel-16.sources.json` |
| `gwamol-emotion-16` | **AI 생성** (`scripts/generateWorldcupImages.js`) | "과몰이" 마스코트는 이 사이트 오리지널 캐릭터라 실사 사진이 존재하지 않음 — AI로 신규 생성하는 것이 유일한 방법. 프롬프트는 `gwamol-emotion-16.prompts.md` |

CC0 3팩은 `worldcup-images-raw/{packId}/{itemId}.(png|jpg)`에 원본을 넣고
`python3 scripts/process_worldcup_images.py`로 변환한다(사람이 사진을 직접 고르는 수동 워크플로우).

`gwamol-emotion-16`만 `node scripts/generateWorldcupImages.js gwamol-emotion-16`로 자동 생성 —
내부적으로 OpenAI Images API(`gpt-image-1`) 호출 후 동일한 `process_worldcup_images.py` 파이프라인을
자동으로 이어서 실행해 `worldcup/images/gwamol-emotion-16/*.webp`까지 한 번에 끝낸다.
