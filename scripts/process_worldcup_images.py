#!/usr/bin/env python3
"""
v0.6.1 | 5-in-1 Dashboard SPA — scripts/process_worldcup_images.py
이상형 월드컵 이미지형 팩(cute-animals-32/soul-food-32/korea-travel-16/gwamol-emotion-16) 이미지 파이프라인.

입력: worldcup-images-raw/{packId}/{itemId}.(png|jpg|jpeg|webp)  (.gitignore 처리됨, 커밋 안 함)
출력: worldcup/images/{packId}/{itemId}.webp  (repo 루트 — 이 프로젝트는 /public 폴더가 없는 정적 사이트라
      share-cards/, assets/ 와 동일하게 루트에서 바로 서빙되는 경로를 씀. 스펙 원문의 "/public/worldcup/..."은
      이 프로젝트 구조에 맞게 "worldcup/images/..."로 조정)

처리: 최대 800px로 리사이즈(원본이 더 작으면 그대로), WebP(quality=85)로 변환.
data.js의 AppData.worldcupPacks에 이미 imagePath가 이 규칙대로 채워져 있어(예: null이 아니라
"worldcup/images/cute-animals-32/an01.webp") 파일만 이 경로에 갖다 놓으면 코드 변경 없이 즉시 반영됨
(app.js의 <img onerror> placeholder 폴백이 파일 존재 여부와 무관하게 항상 안전하게 동작).

실행: python3 scripts/process_worldcup_images.py
"""
import os
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / 'worldcup-images-raw'
OUT_DIR = ROOT / 'worldcup' / 'images'
MAX_SIZE = 800
QUALITY = 85
EXTS = ('.png', '.jpg', '.jpeg', '.webp')


def process_pack(pack_dir: Path):
    pack_id = pack_dir.name
    out_pack_dir = OUT_DIR / pack_id
    out_pack_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for f in sorted(pack_dir.iterdir()):
        if f.suffix.lower() not in EXTS:
            continue
        item_id = f.stem
        out_path = out_pack_dir / f'{item_id}.webp'
        with Image.open(f) as im:
            im = im.convert('RGB') if im.mode in ('P', 'CMYK') else im
            im.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
            im.save(out_path, 'WEBP', quality=QUALITY)
        count += 1
        print(f'  {pack_id}/{item_id}.webp 생성 완료 ({im.width}x{im.height})')
    return count


def main():
    if not RAW_DIR.exists():
        print(f'입력 폴더가 없습니다: {RAW_DIR}')
        print('worldcup-images-raw/{packId}/{itemId}.(png|jpg) 형태로 원본 이미지를 넣어주세요.')
        return
    total = 0
    for pack_dir in sorted(RAW_DIR.iterdir()):
        if not pack_dir.is_dir():
            continue
        print(f'[{pack_dir.name}] 처리 중...')
        total += process_pack(pack_dir)
    print(f'총 {total}개 이미지 처리 완료 → {OUT_DIR}')


if __name__ == '__main__':
    main()
