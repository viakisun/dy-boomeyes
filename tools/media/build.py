#!/usr/bin/env python3
"""tools/media/build.py — 참고자료 삽화 → 목업 카메라 스틸(WebP)·루프(MP4) 생성기 (specs/video-basics W2.6)

  python3 tools/media/build.py --deck ~/Downloads/BoomEyes_CPB_통합관제_참고자료_v5.0.pptx [--only front,boom] [--all] [--proof <png>]

- 원천 PPTX는 저장소 밖(--deck). zipfile로 ppt/media/*.png를 직접 읽는다 — 추출본·PPTX는 커밋하지 않는다.
- tools/media/sources.json의 crop → LANCZOS 리사이즈 → WebP. loop=true는 스틸에서 ffmpeg zoompan(±3% · sin 주기 90프레임)으로
  640×360 · 15fps · 6s · 무음 H.264를 만든다(파일명 유지: front.mp4 · boom.mp4 — e2e가 boom.*\\.mp4를 단언).
- bbox_px(원본 좌표의 빨간 상자)는 크롭 안에서 정규화해 packages/video/src/assets.ts의 STILL_BBOX 블록에 쓴다.
- --proof는 크롭·bbox를 그린 콘택트 시트 PNG — 커밋 전에 눈으로 확인한다(제목 띠·⚠ 잔존 0 · bbox 정렬).
- 산출물 manifest: packages/video/src/assets/manifest.json(원천 sha256 · 크롭 · 크기 · 바이트 · bbox).
"""
import argparse
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import zipfile

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'tools', 'media', 'sources.json')
ASSETS_TS = os.path.join(ROOT, 'packages', 'video', 'src', 'assets.ts')


def ffmpeg_loop(still: Image.Image, out: str) -> dict:
    with tempfile.TemporaryDirectory() as td:
        png = os.path.join(td, 'still.png')
        still.save(png)
        vf = (
            "zoompan=z='1.03+0.03*sin(2*PI*on/90)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
            ':d=1:s=640x360:fps=15,format=yuv420p'
        )
        cmd = [
            'ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-framerate', '15', '-i', png,
            '-vf', vf, '-frames:v', '90', '-c:v', 'libx264', '-profile:v', 'baseline', '-crf', '30',
            '-tune', 'stillimage', '-preset', 'slow', '-movflags', '+faststart', '-an', out,
        ]
        subprocess.run(cmd, check=True)
    probe = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,nb_frames,duration',
         '-of', 'json', out], check=True, capture_output=True, text=True)
    streams = json.loads(probe.stdout)['streams']
    v = [s for s in streams if s['codec_type'] == 'video'][0]
    a = [s for s in streams if s['codec_type'] == 'audio']
    assert not a, f'{out}: 오디오 스트림이 있다(무음이어야 한다 — QA video-caption 면제)'
    assert int(v['nb_frames']) == 90 and v['width'] == 640 and v['height'] == 360, v
    return {'codec': v['codec_name'], 'frames': int(v['nb_frames']), 'duration': round(float(v['duration']), 2)}


def write_bbox_block(bboxes: dict) -> bool:
    if not os.path.exists(ASSETS_TS):
        return False
    src = io.open(ASSETS_TS, encoding='utf-8').read()
    m = re.search(r'// STILL_BBOX:begin.*?\n(.*?)// STILL_BBOX:end', src, re.S)
    if not m:
        return False
    entries = ',\n'.join(
        f"  '{k}': {{ x: {v['x']}, y: {v['y']}, w: {v['w']}, h: {v['h']} }}" for k, v in sorted(bboxes.items()))
    block = f'export const STILL_BBOX = {{\n{entries},\n}} as const;\n'
    io.open(ASSETS_TS, 'w', encoding='utf-8').write(src[: m.start(1)] + block + src[m.end(1):])
    return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--deck', default=os.path.expanduser('~/Downloads/BoomEyes_CPB_통합관제_참고자료_v5.0.pptx'))
    ap.add_argument('--only', default='', help='쉼표로 id 목록')
    ap.add_argument('--all', action='store_true', help='emit=false 항목도 (proof용, 산출물은 임시 디렉터리)')
    ap.add_argument('--proof', default='', help='콘택트 시트 PNG 경로')
    a = ap.parse_args()
    if not os.path.exists(a.deck):
        print(f'✗ 참고자료 PPTX 없음: {a.deck}', file=sys.stderr)
        return 2
    spec = json.load(io.open(SRC, encoding='utf-8'))
    only = set(filter(None, a.only.split(',')))
    out_dir = os.path.join(ROOT, spec['out'])
    os.makedirs(out_dir, exist_ok=True)
    manifest = {'$comment': 'tools/media/build.py 산출 — 원천은 참고자료 v5.0(저장소 밖)', 'deck': spec['deck'], 'assets': {}}
    bboxes = {}
    proofs = []
    with zipfile.ZipFile(a.deck) as z:
        for s in spec['sources']:
            if only and s['id'] not in only:
                continue
            if not s.get('emit') and not a.all:
                continue
            raw = z.read(s['file'])
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            x0, y0, x1, y1 = s['crop']
            crop = im.crop((x0, y0, x1, y1))
            w, h = s['size']
            still = crop.resize((w, h), Image.LANCZOS)
            entry = {
                'slide': s['slide'], 'source': s['file'], 'sha256': hashlib.sha256(raw).hexdigest()[:16],
                'source_size': list(im.size), 'crop': s['crop'], 'size': s['size'], 'role': s.get('role', ''),
            }
            bbox = None
            if s.get('bbox_px'):
                bx0, by0, bx1, by1 = s['bbox_px']
                bbox = {
                    'x': round((bx0 - x0) / (x1 - x0), 3), 'y': round((by0 - y0) / (y1 - y0), 3),
                    'w': round((bx1 - bx0) / (x1 - x0), 3), 'h': round((by1 - by0) / (y1 - y0), 3),
                }
                assert 0 <= bbox['x'] and bbox['x'] + bbox['w'] <= 1 and 0 <= bbox['y'] and bbox['y'] + bbox['h'] <= 1, bbox
                entry['bbox'] = bbox
                bboxes[s['id']] = bbox
            if s.get('emit'):
                webp = os.path.join(out_dir, f"{s['id']}.webp")
                still.save(webp, 'WEBP', quality=s.get('quality', 75), method=6)
                entry['webp'] = os.path.getsize(webp)
                if s.get('loop'):
                    mp4 = os.path.join(out_dir, f"{s['id']}.mp4")
                    entry['mp4'] = {'bytes': None, **ffmpeg_loop(still, mp4)}
                    entry['mp4']['bytes'] = os.path.getsize(mp4)
                manifest['assets'][s['id']] = entry
                print(f"  {s['id']:<12} slide {s['slide']:>2} crop {s['crop']} → {w}×{h} webp {entry['webp']//1024}KB"
                      + (f" · mp4 {entry['mp4']['bytes']//1024}KB {entry['mp4']['duration']}s" if s.get('loop') else '')
                      + (f" · bbox {bbox}" if bbox else ''))
            else:
                print(f"  {s['id']:<12} slide {s['slide']:>2} (미발행 — proof만)")
            proofs.append((s, still, bbox))
    if manifest['assets']:
        io.open(os.path.join(out_dir, 'manifest.json'), 'w', encoding='utf-8').write(
            json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        wrote = write_bbox_block(bboxes) if bboxes else False
        print(f"  manifest.json · STILL_BBOX {'갱신' if wrote else '(assets.ts 마커 없음 — 수동)'}: {bboxes}")
    if a.proof and proofs:
        tw = 480
        cells = []
        for s, still, bbox in proofs:
            th = round(tw * still.height / still.width)
            t = still.resize((tw, th), Image.LANCZOS)
            d = ImageDraw.Draw(t)
            if bbox:
                d.rectangle([bbox['x'] * tw, bbox['y'] * th, (bbox['x'] + bbox['w']) * tw, (bbox['y'] + bbox['h']) * th],
                            outline=(0, 255, 0), width=3)
            label = f"{s['id']} · slide {s['slide']} · {'emit' if s.get('emit') else '미발행'}"
            d.rectangle([0, 0, tw, 18], fill=(0, 0, 0))
            d.text((4, 3), label, fill=(255, 255, 255))
            cells.append(t)
        cols = 2
        rows = (len(cells) + cols - 1) // cols
        ch = max(c.height for c in cells) + 8
        sheet = Image.new('RGB', (cols * (tw + 8) + 8, rows * ch + 8), (40, 40, 40))
        for i, c in enumerate(cells):
            sheet.paste(c, (8 + (i % cols) * (tw + 8), 8 + (i // cols) * ch))
        os.makedirs(os.path.dirname(os.path.abspath(a.proof)), exist_ok=True)
        sheet.save(a.proof)
        print(f'  proof → {a.proof}')
    total = sum(e.get('webp', 0) + (e.get('mp4', {}) or {}).get('bytes', 0) for e in manifest['assets'].values())
    print(f"✓ media: {len(manifest['assets'])} assets · {total // 1024}KB")
    return 0


if __name__ == '__main__':
    sys.exit(main())
