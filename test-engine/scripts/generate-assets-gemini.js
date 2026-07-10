#!/usr/bin/env node
/**
 * test-engine/scripts/generate-assets-gemini.js — 2단계 자동화 스크래폴드 (2026-07-10)
 * "Midjourney로 스타일 확정 → Nano Banana Pro(Gemini 3 Pro Image) API로 나머지 세트 자동 생성"
 * 2단계 워크플로우 중 2단계 담당. generate-assets.js(OpenAI, STEP 1.5)와 동일한 config/prompts.md
 * 컨벤션을 그대로 쓰되, assets/reference/ 폴더의 이미지를 스타일 참조로 함께 전달한다는 점만 다름.
 *
 * 이 스크립트는 아직 실사용 검증 전 상태(레퍼런스 이미지가 없어 테스트 불가) — GEMINI_API_KEY와
 * assets/reference/*.{png,jpg,webp}가 준비된 뒤 실제로 한 번 돌려보고 문제가 있으면 그때 수정할 것.
 *
 * 입력: test-engine/tests/{testId}/assets/prompts.md (## {id} 헤딩 다음 줄 = 최종 프롬프트)
 *       test-engine/tests/{testId}/assets/reference/*.{png,jpg,jpeg,webp} (스타일 락 레퍼런스, 최대 8장 권장)
 * 출력: test-engine/tests/{testId}/assets/cover.webp
 *       test-engine/tests/{testId}/assets/result/{id}.webp (id !== 'cover'인 항목)
 *       (generate-assets.js와 동일한 출력 경로 — 기존 OpenAI 스크립트와 결과물을 그대로 대체 가능)
 *
 * 실행: node test-engine/scripts/generate-assets-gemini.js {testId}
 *
 * 필요 환경변수: GEMINI_API_KEY (Google AI Studio에서 발급, Codespaces Secrets에 등록 필요.
 *              값을 코드에 하드코딩하지 말 것 — OPENAI_API_KEY와 동일한 보안 원칙)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..'); // test-engine/
const MODEL = 'gemini-3-pro-image-preview';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_WIDTH = 700; // engine 레이아웃 max-width(500px)의 1.4배 정도 — 레티나 여유
const REQUEST_DELAY_MS = 2000;
const MAX_RETRIES = 2;
const MAX_REFERENCE_IMAGES = 8; // Gemini 3 Pro Image가 블렌딩을 보장하는 상한

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
    const data = fs.readFileSync(path.join(refDir, f)).toString('base64');
    return { mimeType: MIME_BY_EXT[ext], data };
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
  const parts = [{ text: prompt }];
  for (const ref of referenceImages) {
    parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
  }
  const res = await fetch(`${API_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const resultParts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = resultParts.find((p) => p.inlineData?.data);
  if (!imagePart) throw new Error('응답에 이미지 데이터(inlineData)가 없습니다');
  return { buffer: Buffer.from(imagePart.inlineData.data, 'base64'), mimeType: imagePart.inlineData.mimeType };
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

function convertToWebp(rawImgPath, outWebpPath) {
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
  const result = spawnSync('python3', ['-c', py, rawImgPath, outWebpPath, String(MAX_WIDTH)], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error('python3 Pillow WebP 변환 실패 (Pillow 설치 여부 확인 필요)');
  }
}

async function main() {
  const testId = process.argv[2];
  if (!testId) {
    console.error('사용법: node test-engine/scripts/generate-assets-gemini.js {testId}');
    console.error('예시:  node test-engine/scripts/generate-assets-gemini.js real-vs-fake-mbti');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('환경변수 GEMINI_API_KEY가 설정되어 있지 않습니다. (값은 출력하지 않음)');
    console.error('Google AI Studio(aistudio.google.com)에서 발급 후 Codespaces Secrets에 등록하세요.');
    process.exit(1);
  }

  const items = parsePromptsFile(testId);
  if (items.length === 0) {
    console.error(`test-engine/tests/${testId}/assets/prompts.md에서 아이템을 하나도 찾지 못했습니다.`);
    process.exit(1);
  }

  const referenceImages = loadReferenceImages(testId);
  if (referenceImages.length === 0) {
    console.log(
      `⚠️ test-engine/tests/${testId}/assets/reference/ 에 레퍼런스 이미지가 없습니다. ` +
        `스타일 참조 없이(=텍스트 프롬프트만으로) 생성됩니다. Midjourney에서 확정한 이미지를 ` +
        `이 폴더에 넣으면 스타일이 고정됩니다.`
    );
  } else {
    console.log(`[${testId}] 레퍼런스 이미지 ${referenceImages.length}장 로드 완료`);
  }
  console.log(`[${testId}] 프롬프트 ${items.length}개 로드 완료`);

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
    let tmpImgPath;
    try {
      const { buffer, mimeType } = await generateWithRetry(apiKey, id, prompt, referenceImages);
      const ext = mimeType === 'image/jpeg' ? '.jpg' : '.png';
      tmpImgPath = path.join(os.tmpdir(), `test-engine-gemini-${testId}-${id}-${Date.now()}${ext}`);
      fs.writeFileSync(tmpImgPath, buffer);
      convertToWebp(tmpImgPath, outPath);
      console.log(`  ✅ ${id} 저장 완료 (${outPath})`);
      succeeded.push(id);
    } catch (err) {
      console.log(`  ❌ ${id} 최종 실패: ${err.message}`);
      failed.push(id);
    } finally {
      if (tmpImgPath && fs.existsSync(tmpImgPath)) fs.unlinkSync(tmpImgPath);
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
