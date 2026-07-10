#!/usr/bin/env node
/**
 * test-engine/scripts/generate-assets.js — STEP 1.5 → 2026-07-10 레퍼런스 이미지 지원 추가
 * config.json이 참조하는 이미지(cover, 결과 N종)를 OpenAI Images API(gpt-image-1)로
 * 생성해 WebP로 저장하는 1회성 빌드 스크립트. 사이트 런타임에서는 절대 호출되지 않음
 * (생성은 빌드타임, 서빙은 정적 파일).
 *
 * **무료/저비용 2단계 워크플로우(2026-07-10~)**: Gemini API(Nano Banana Pro)는 결제 없이는
 * 아예 호출이 안 되는 걸 확인해서(무료 티어 0), 대신 "사용자가 Gemini의 무료 채팅 UI
 * (gemini.google.com)로 레퍼런스 이미지 1장을 직접 뽑아 전달 → 이 스크립트가 OpenAI
 * images/edits API(레퍼런스 이미지 최대 16장 입력 지원, 스타일 전이 가능)로 그 스타일을
 * 참조해 나머지 세트를 생성"하는 방식으로 전환. `assets/reference/`에 레퍼런스 이미지가
 * 있으면 자동으로 이 경로를 쓰고, 없으면 기존처럼 순수 텍스트 프롬프트 생성(images/generations)
 * 그대로 동작 — 이미 생성된 mental-age/mbti-stat-window 등 기존 자산·워크플로우는 무변경.
 * gpt-image-1은 이미 이 프로젝트가 쓰던 모델이라 신규 API 키/결제 설정이 필요 없음
 * (건당 수 센트 수준, 이미 검증된 비용).
 *
 * 입력: test-engine/tests/{testId}/assets/prompts.md (## {id} 헤딩 다음 줄 = 최종 프롬프트)
 *       test-engine/tests/{testId}/assets/reference/*.{png,jpg,jpeg,webp} (선택, 스타일 참조)
 * 출력: test-engine/tests/{testId}/assets/cover.webp
 *       test-engine/tests/{testId}/assets/result/{id}.webp (id !== 'cover'인 항목)
 *
 * 실행: node test-engine/scripts/generate-assets.js mental-age
 *
 * 필요 환경변수: OPENAI_API_KEY (Codespaces Secrets에 이미 등록되어 있음, 코드에 하드코딩 금지)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..'); // test-engine/
const MODEL = 'gpt-image-1';
const SIZE = '1024x1024';
const QUALITY = 'medium';
const MAX_WIDTH = 700; // engine 레이아웃 max-width(500px)의 1.4배 정도 — 레티나 여유
const REQUEST_DELAY_MS = 1500;
const MAX_RETRIES = 2;
const MAX_REFERENCE_IMAGES = 16; // OpenAI images/edits 입력 상한

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function parsePromptsFile(testId) {
  const promptsPath = path.join(ROOT, 'tests', testId, 'assets', 'prompts.md');
  if (!fs.existsSync(promptsPath)) {
    throw new Error(`프롬프트 파일이 없습니다: ${promptsPath}`);
  }
  const text = fs.readFileSync(promptsPath, 'utf8');
  const lines = text.split('\n');
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+([a-zA-Z0-9_-]+)\s*$/);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (j >= lines.length) continue;
    const prompt = lines[j].trim();
    if (!prompt || prompt.startsWith('#')) continue;
    items.push({ id: m[1], prompt });
  }
  return items;
}

function loadReferenceImages(testId) {
  const refDir = path.join(ROOT, 'tests', testId, 'assets', 'reference');
  if (!fs.existsSync(refDir)) return [];
  const files = fs
    .readdirSync(refDir)
    .filter((f) => MIME_BY_EXT[path.extname(f).toLowerCase()])
    .sort();
  if (files.length > MAX_REFERENCE_IMAGES) {
    console.log(`⚠️ 레퍼런스 이미지가 ${files.length}장이라 앞 ${MAX_REFERENCE_IMAGES}장만 사용합니다.`);
  }
  return files.slice(0, MAX_REFERENCE_IMAGES).map((f) => {
    const ext = path.extname(f).toLowerCase();
    return {
      name: f,
      mimeType: MIME_BY_EXT[ext],
      buffer: fs.readFileSync(path.join(refDir, f)),
    };
  });
}

function outputPathFor(testId, id) {
  if (id === 'cover') return path.join(ROOT, 'tests', testId, 'assets', 'cover.webp');
  return path.join(ROOT, 'tests', testId, 'assets', 'result', `${id}.webp`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateOne(apiKey, prompt, referenceImages) {
  if (referenceImages && referenceImages.length > 0) {
    // 레퍼런스 이미지가 있으면 images/edits로 스타일 참조 생성
    const form = new FormData();
    form.append('model', MODEL);
    form.append('prompt', prompt);
    form.append('size', SIZE);
    form.append('quality', QUALITY);
    form.append('n', '1');
    for (const ref of referenceImages) {
      form.append('image[]', new Blob([ref.buffer], { type: ref.mimeType }), ref.name);
    }
    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` }, // Content-Type(멀티파트 boundary)은 fetch가 자동 설정
      body: form,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenAI API(edits) ${res.status}: ${errText.slice(0, 300)}`);
    }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error('응답에 이미지 데이터(b64_json)가 없습니다');
    return Buffer.from(b64, 'base64');
  }

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, prompt, size: SIZE, quality: QUALITY, n: 1 }),
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

async function generateWithRetry(apiKey, id, prompt, referenceImages) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await generateOne(apiKey, prompt, referenceImages);
    } catch (err) {
      lastErr = err;
      console.log(`  ⚠️ ${id} 시도 ${attempt + 1}/${MAX_RETRIES + 1} 실패: ${err.message}`);
      if (attempt < MAX_RETRIES) await sleep(REQUEST_DELAY_MS);
    }
  }
  throw lastErr;
}

function convertToWebp(rawPngPath, outWebpPath) {
  fs.mkdirSync(path.dirname(outWebpPath), { recursive: true });
  const py = `
import sys
from PIL import Image
src, dst, max_w = sys.argv[1], sys.argv[2], int(sys.argv[3])
img = Image.open(src).convert("RGB")
if img.width > max_w:
    ratio = max_w / img.width
    img = img.resize((max_w, round(img.height * ratio)), Image.LANCZOS)
img.save(dst, "WEBP", quality=85, method=6)
`;
  const result = spawnSync('python3', ['-c', py, rawPngPath, outWebpPath, String(MAX_WIDTH)], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error('python3 Pillow WebP 변환 실패 (Pillow 설치 여부 확인 필요)');
  }
}

async function main() {
  const testId = process.argv[2];
  if (!testId) {
    console.error('사용법: node test-engine/scripts/generate-assets.js {testId}');
    console.error('예시:  node test-engine/scripts/generate-assets.js mental-age');
    process.exit(1);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('환경변수 OPENAI_API_KEY가 설정되어 있지 않습니다. (값은 출력하지 않음)');
    process.exit(1);
  }

  const items = parsePromptsFile(testId);
  if (items.length === 0) {
    console.error(`test-engine/tests/${testId}/assets/prompts.md에서 아이템을 하나도 찾지 못했습니다.`);
    process.exit(1);
  }
  console.log(`[${testId}] 프롬프트 ${items.length}개 로드 완료`);

  const referenceImages = loadReferenceImages(testId);
  if (referenceImages.length > 0) {
    console.log(
      `[${testId}] 레퍼런스 이미지 ${referenceImages.length}장 로드 완료 (images/edits로 스타일 참조 생성)`
    );
  }

  const succeeded = [];
  const skipped = [];
  const failed = [];

  for (const { id, prompt } of items) {
    const outPath = outputPathFor(testId, id);
    if (fs.existsSync(outPath)) {
      console.log(`⏭️  ${id}: 이미 결과 파일 존재, 스킵 (${outPath})`);
      skipped.push(id);
      continue;
    }
    console.log(`🎨 ${id} 생성 중...`);
    const tmpPngPath = path.join(os.tmpdir(), `test-engine-${testId}-${id}-${Date.now()}.png`);
    try {
      const buf = await generateWithRetry(apiKey, id, prompt, referenceImages);
      fs.writeFileSync(tmpPngPath, buf);
      convertToWebp(tmpPngPath, outPath);
      console.log(`  ✅ ${id} 저장 완료 (${outPath})`);
      succeeded.push(id);
    } catch (err) {
      console.log(`  ❌ ${id} 최종 실패: ${err.message}`);
      failed.push(id);
    } finally {
      if (fs.existsSync(tmpPngPath)) fs.unlinkSync(tmpPngPath);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log('');
  console.log(`[${testId}] 생성 완료: 성공 ${succeeded.length} / 스킵 ${skipped.length} / 실패 ${failed.length}`);
  if (failed.length) console.log(`  실패 항목: ${failed.join(', ')}`);
}

main().catch((err) => {
  console.error('스크립트 실행 중 오류:', err);
  process.exit(1);
});
