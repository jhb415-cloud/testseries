#!/usr/bin/env node
/**
 * v0.6.2 | 5-in-1 Dashboard SPA — scripts/generateWorldcupImages.js
 * 이상형 월드컵 "AI 소스" 팩(현재는 gwamol-emotion-16 하나) 전용 이미지 생성기.
 *
 * cute-animals-32 / soul-food-32 / korea-travel-16은 CC0 실사 사진을 수동으로 수급하는
 * 방식을 그대로 유지한다(worldcup-sources/*.sources.json 키워드 참고, 사람이 직접 무료
 * 상업이용 스톡사진 사이트에서 다운받아 worldcup-images-raw/{packId}/에 배치) — 실사 사진을
 * AI로 대체 생성하면 부자연스럽고, 이 스크립트는 그 3팩에는 사용하지 않는다.
 * gwamol-emotion-16만 AI 생성 오리지널 마스코트라 이 스크립트로 자동화한다.
 *
 * 입력: worldcup/packs/{packId}.prompts.md (## {itemId} 헤딩 다음 줄 = 최종 프롬프트)
 * 출력: worldcup-images-raw/{packId}/{itemId}.png (1024x1024 원본)
 *       → 생성 직후 scripts/process_worldcup_images.py를 자동 호출해
 *         worldcup/images/{packId}/{itemId}.webp(800px)로 변환·배치까지 완료.
 *
 * 실행: node scripts/generateWorldcupImages.js gwamol-emotion-16
 *
 * 필요 환경변수: OPENAI_API_KEY (Codespaces Secrets에 이미 등록되어 있음, 코드에 하드코딩 금지)
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MODEL = 'gpt-image-1';
const SIZE = '1024x1024';
const REQUEST_DELAY_MS = 1500;
const MAX_RETRIES = 2;

function parsePromptsFile(packId) {
  const promptsPath = path.join(ROOT, 'worldcup', 'packs', `${packId}.prompts.md`);
  if (!fs.existsSync(promptsPath)) {
    throw new Error(`프롬프트 파일이 없습니다: ${promptsPath}`);
  }
  const text = fs.readFileSync(promptsPath, 'utf8');
  const lines = text.split('\n');
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+([a-zA-Z0-9_-]+)\s*$/);
    if (!m) continue;
    // 헤딩 바로 다음 non-empty 줄이 프롬프트
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (j >= lines.length) continue;
    const prompt = lines[j].trim();
    if (!prompt || prompt.startsWith('#')) continue;
    items.push({ id: m[1], prompt });
  }
  return items;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateOne(apiKey, prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size: SIZE,
      n: 1,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI API ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('응답에 이미지 데이터(b64_json)가 없습니다');
  return Buffer.from(b64, 'base64');
}

async function generateWithRetry(apiKey, itemId, prompt) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await generateOne(apiKey, prompt);
    } catch (err) {
      lastErr = err;
      console.log(`  ⚠️ ${itemId} 시도 ${attempt + 1}/${MAX_RETRIES + 1} 실패: ${err.message}`);
      if (attempt < MAX_RETRIES) await sleep(REQUEST_DELAY_MS);
    }
  }
  throw lastErr;
}

async function main() {
  const packId = process.argv[2];
  if (!packId) {
    console.error('사용법: node scripts/generateWorldcupImages.js {packId}');
    console.error('예시:  node scripts/generateWorldcupImages.js gwamol-emotion-16');
    process.exit(1);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('환경변수 OPENAI_API_KEY가 설정되어 있지 않습니다. (값은 출력하지 않음)');
    process.exit(1);
  }

  const items = parsePromptsFile(packId);
  if (items.length === 0) {
    console.error(`worldcup/packs/${packId}.prompts.md에서 아이템을 하나도 찾지 못했습니다.`);
    process.exit(1);
  }
  console.log(`[${packId}] 프롬프트 ${items.length}개 로드 완료`);

  const rawDir = path.join(ROOT, 'worldcup-images-raw', packId);
  const outWebpDir = path.join(ROOT, 'worldcup', 'images', packId);
  fs.mkdirSync(rawDir, { recursive: true });

  const succeeded = [];
  const skipped = [];
  const failed = [];

  for (const { id, prompt } of items) {
    const webpPath = path.join(outWebpDir, `${id}.webp`);
    const rawPath = path.join(rawDir, `${id}.png`);
    if (fs.existsSync(webpPath)) {
      console.log(`⏭️  ${id}: 이미 결과 파일 존재, 스킵 (${webpPath})`);
      skipped.push(id);
      continue;
    }
    console.log(`🎨 ${id} 생성 중...`);
    try {
      const buf = await generateWithRetry(apiKey, id, prompt);
      fs.writeFileSync(rawPath, buf);
      console.log(`  ✅ ${id} 원본 저장 완료 (${rawPath})`);
      succeeded.push(id);
    } catch (err) {
      console.log(`  ❌ ${id} 최종 실패: ${err.message}`);
      failed.push(id);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log('');
  console.log(`[${packId}] 생성 완료: 성공 ${succeeded.length} / 스킵 ${skipped.length} / 실패 ${failed.length}`);
  if (failed.length) console.log(`  실패 항목: ${failed.join(', ')}`);

  if (succeeded.length > 0) {
    console.log('');
    console.log('원본 800px WebP 변환 파이프라인(process_worldcup_images.py) 실행 중...');
    const result = spawnSync('python3', [path.join(ROOT, 'scripts', 'process_worldcup_images.py')], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      console.log('⚠️ process_worldcup_images.py 실행 실패 — 수동으로 `python3 scripts/process_worldcup_images.py`를 실행해주세요.');
    }
  }

  console.log('');
  console.log(`요약: ${succeeded.length + skipped.length}/${items.length} 준비 완료 (신규 생성 ${succeeded.length}, 기존 유지 ${skipped.length}), 실패 ${failed.length}${failed.length ? `: ${failed.join(', ')}` : ''}`);
}

main().catch((err) => {
  console.error('스크립트 실행 중 오류:', err);
  process.exit(1);
});
