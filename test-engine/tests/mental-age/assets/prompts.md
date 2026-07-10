# 정신연령 테스트 — AI 이미지 생성 프롬프트 (STEP 1.5)

`scripts/generate-assets.js mental-age`가 이 파일을 파싱해 순서대로 사용한다.
파싱 규칙: `## {id}` 헤딩 바로 다음 줄이 그 아이템의 최종 프롬프트(베이스 캐릭터 묘사가 이미 인라인으로 포함된 완성형)다.

스타일/품질 결정 경위: 샘플 2종(플랫+굵은아웃라인 vs 손그림 러프라인)을 medium 품질로 먼저 생성해 사용자에게
Artifact로 비교시킨 뒤 "손그림 러프 라인" 채택, 이어서 동일 프롬프트를 medium vs high 품질로 한 번 더 비교해
"medium"으로 최종 확정.

## 베이스 캐릭터 시트 (참고용 — 각 프롬프트에 이미 인라인으로 포함되어 있음)

A cute round blob-shaped mascot character with a soft rounded body, two short stubby arms, two small stubby legs,
a small squiggly brain-shaped antenna on top of its head, simple dot eyes, warm orange circular cheeks. Rough
hand-drawn doodle illustration, sketchy loose ink lines, marker-style flat shading with slightly imperfect edges,
warm solid cream-colored paper background (evenly lit, no vignette, no dark corners), playful casual sketch
aesthetic. Color palette: deep teal (#085041) body outline/shadow, bright teal (#1D9E75) main body color, warm
orange (#D85A30) cheeks/accents. Centered composition, square format, original cartoon character, no text, no
watermark, no logos, no real people or existing franchise characters, consistent character design across all
variations (same body shape, same color palette, same line weight).

---

## cover

A cute round blob-shaped mascot character with a soft rounded body, two short stubby arms, two small stubby legs, a small squiggly brain-shaped antenna on top of its head, simple dot eyes, warm orange circular cheeks. Rough hand-drawn doodle illustration, sketchy loose ink lines, marker-style flat shading with slightly imperfect edges, warm solid cream-colored paper background (evenly lit, no vignette, no dark corners), playful casual sketch aesthetic. Color palette: deep teal (#085041) body outline/shadow, bright teal (#1D9E75) main body color, warm orange (#D85A30) cheeks/accents. Centered composition, square format, original cartoon character, no text, no watermark, no logos, no real people or existing franchise characters, consistent character design across all variations. The mascot is tilting its head with a curious puzzled expression, one stubby arm raised scratching its brain-antenna, surrounded by three floating hand-drawn question marks and one small floating lightbulb doodle, playful confused energy representing figuring out one's mental age.

## age-10

A cute round blob-shaped mascot character with a soft rounded body, two short stubby arms, two small stubby legs, a small squiggly brain-shaped antenna on top of its head, simple dot eyes, warm orange circular cheeks. Rough hand-drawn doodle illustration, sketchy loose ink lines, marker-style flat shading with slightly imperfect edges, warm solid cream-colored paper background (evenly lit, no vignette, no dark corners), playful casual sketch aesthetic. Color palette: deep teal (#085041) body outline/shadow, bright teal (#1D9E75) main body color, warm orange (#D85A30) cheeks/accents. Centered composition, square format, original cartoon character, no text, no watermark, no logos, no real people or existing franchise characters, consistent character design across all variations. The mascot wears a small paper party hat, both stubby arms raised straight up in pure joy, a huge open-mouthed grin with sparkly star-shaped eyes, tiny confetti pieces and one small balloon floating around it, bursting with innocent childlike excitement.

## age-17

A cute round blob-shaped mascot character with a soft rounded body, two short stubby arms, two small stubby legs, a small squiggly brain-shaped antenna on top of its head, simple dot eyes, warm orange circular cheeks. Rough hand-drawn doodle illustration, sketchy loose ink lines, marker-style flat shading with slightly imperfect edges, warm solid cream-colored paper background (evenly lit, no vignette, no dark corners), playful casual sketch aesthetic. Color palette: deep teal (#085041) body outline/shadow, bright teal (#1D9E75) main body color, warm orange (#D85A30) cheeks/accents. Centered composition, square format, original cartoon character, no text, no watermark, no logos, no real people or existing franchise characters, consistent character design across all variations. The mascot wears round sunglasses pushed slightly down its face, one stubby arm making a peace-sign gesture near its face, a small pair of headphones resting around its neck, a playful smirking mouth, leaning slightly to one side with rebellious carefree energy, one small music-note doodle floating nearby.

## age-25

A cute round blob-shaped mascot character with a soft rounded body, two short stubby arms, two small stubby legs, a small squiggly brain-shaped antenna on top of its head, simple dot eyes, warm orange circular cheeks. Rough hand-drawn doodle illustration, sketchy loose ink lines, marker-style flat shading with slightly imperfect edges, warm solid cream-colored paper background (evenly lit, no vignette, no dark corners), playful casual sketch aesthetic. Color palette: deep teal (#085041) body outline/shadow, bright teal (#1D9E75) main body color, warm orange (#D85A30) cheeks/accents. Centered composition, square format, original cartoon character, no text, no watermark, no logos, no real people or existing franchise characters, consistent character design across all variations. The mascot holds a small takeout coffee cup with one stubby arm, its other arm resting casually at its side, a relaxed content half-smile, standing in a laid-back slouched posture, one small steam-swirl doodle rising from the cup.

## age-32

A cute round blob-shaped mascot character with a soft rounded body, two short stubby arms, two small stubby legs, a small squiggly brain-shaped antenna on top of its head, simple dot eyes, warm orange circular cheeks. Rough hand-drawn doodle illustration, sketchy loose ink lines, marker-style flat shading with slightly imperfect edges, warm solid cream-colored paper background (evenly lit, no vignette, no dark corners), playful casual sketch aesthetic. Color palette: deep teal (#085041) body outline/shadow, bright teal (#1D9E75) main body color, warm orange (#D85A30) cheeks/accents. Centered composition, square format, original cartoon character, no text, no watermark, no logos, no real people or existing franchise characters, consistent character design across all variations. The mascot wears a small neat necktie doodle around its neck, one stubby arm holding a tiny clipboard, standing upright with a confident composed smile and a slightly raised chin, radiating dependable grown-up energy.

## age-43

A cute round blob-shaped mascot character with a soft rounded body, two short stubby arms, two small stubby legs, a small squiggly brain-shaped antenna on top of its head, simple dot eyes, warm orange circular cheeks. Rough hand-drawn doodle illustration, sketchy loose ink lines, marker-style flat shading with slightly imperfect edges, warm solid cream-colored paper background (evenly lit, no vignette, no dark corners), playful casual sketch aesthetic. Color palette: deep teal (#085041) body outline/shadow, bright teal (#1D9E75) main body color, warm orange (#D85A30) cheeks/accents. Centered composition, square format, original cartoon character, no text, no watermark, no logos, no real people or existing franchise characters, consistent character design across all variations. The mascot wears small round reading glasses, sits calmly with both stubby legs tucked under its body, holding a small open book with both stubby arms, a warm knowing smile with half-closed content eyes, peaceful wise atmosphere.

## age-60

A cute round blob-shaped mascot character with a soft rounded body, two short stubby arms, two small stubby legs, a small squiggly brain-shaped antenna on top of its head, simple dot eyes, warm orange circular cheeks. Rough hand-drawn doodle illustration, sketchy loose ink lines, marker-style flat shading with slightly imperfect edges, warm solid cream-colored paper background (evenly lit, no vignette, no dark corners), playful casual sketch aesthetic. Color palette: deep teal (#085041) body outline/shadow, bright teal (#1D9E75) main body color, warm orange (#D85A30) cheeks/accents. Centered composition, square format, original cartoon character, no text, no watermark, no logos, no real people or existing franchise characters, consistent character design across all variations. The mascot sits in a calm cross-legged resting posture, eyes gently closed in serene meditation, both stubby arms resting on its lap holding a small teacup with a soft steam-swirl doodle, a faint simple circular halo-like doodle glow above its head, radiating deep tranquil wisdom.
