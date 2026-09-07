#!/usr/bin/env python3
"""tools/brand/wordmark.py — 워드마크 아웃라인 (DY-design §13)

DS 서체 Pretendard Bold(OFL)로 "BoomEyes"를 패스로 바꿔 packages/tokens/src/logo.json의 `wordmark`를 쓴다.
라이브 텍스트를 쓰지 않는 이유: Pretendard는 토큰에 선언만 되고 웹폰트로 로드되지 않아 기기마다 다르게 그려진다.
서비스명이 바뀌면(DISC-021) --text 만 바꿔 다시 생성한다.

  python3 tools/brand/wordmark.py [--font ~/Library/Fonts/Pretendard-Bold.otf] [--text BoomEyes] [--accent-from 4]

좌표계: 64 높이 박스(마크와 같은 단위). 대문자 높이 = 34 → 워드마크 baseline y = 49.
"""
import argparse
import json
import os
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

OUT = os.path.join('packages', 'tokens', 'src', 'logo.json')
CAP = 34.0  # 대문자 높이(유닛)
BASELINE = 49.0
HEIGHT = 64


def ntos(v: float) -> str:
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def kern_table(font: TTFont):
    """GPOS PairPos(format 1·2) → {(left, right): xadvance}"""
    pairs = {}
    if 'GPOS' not in font:
        return pairs
    for lookup in font['GPOS'].table.LookupList.Lookup:
        for st in lookup.SubTable:
            if getattr(st, 'LookupType', lookup.LookupType) == 9:  # Extension
                st = st.ExtSubTable
            if st.LookupType != 2:
                continue
            cov = st.Coverage.glyphs
            if st.Format == 1:
                for left, ps in zip(cov, st.PairSet):
                    for pvr in ps.PairValueRecord:
                        adv = getattr(pvr.Value1, 'XAdvance', 0) if pvr.Value1 else 0
                        if adv:
                            pairs.setdefault((left, pvr.SecondGlyph), adv)
            elif st.Format == 2:
                c1 = st.ClassDef1.classDefs
                c2 = st.ClassDef2.classDefs
                for left in cov:
                    k1 = c1.get(left, 0)
                    rec1 = st.Class1Record[k1]
                    for right, k2 in c2.items():
                        v = rec1.Class2Record[k2].Value1
                        adv = getattr(v, 'XAdvance', 0) if v else 0
                        if adv:
                            pairs.setdefault((left, right), adv)
    return pairs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--font', default=os.path.expanduser('~/Library/Fonts/Pretendard-Bold.otf'))
    ap.add_argument('--text', default='BoomEyes')
    ap.add_argument('--accent-from', type=int, default=4, help='이 글리프 인덱스부터 accent(기본 4 = "Eyes")')
    a = ap.parse_args()
    if not os.path.exists(a.font):
        print(f'✗ 서체 없음: {a.font} (Pretendard Bold OFL — https://github.com/orioncactus/pretendard)', file=sys.stderr)
        return 2

    font = TTFont(a.font)
    upem = font['head'].unitsPerEm
    cap_units = getattr(font['OS/2'], 'sCapHeight', 0) or int(upem * 0.7)
    scale = CAP / cap_units  # 유닛/em 단위
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    hmtx = font['hmtx']
    kern = kern_table(font)

    names = [cmap[ord(ch)] for ch in a.text]
    ink, accent = [], []
    x = 0.0
    for i, name in enumerate(names):
        pen = SVGPathPen(gs, ntos=ntos)
        # y 뒤집기(폰트 좌표는 위가 +) · baseline으로 이동
        tpen = TransformPen(pen, (scale, 0, 0, -scale, x, BASELINE))
        gs[name].draw(tpen)
        d = pen.getCommands()
        (accent if i >= a.accent_from else ink).append(d)
        adv = hmtx[name][0]
        if i + 1 < len(names):
            adv += kern.get((name, names[i + 1]), 0)
        x += adv * scale
    width = x
    # 마지막 글리프의 오른쪽 사이드베어링은 advance에 포함 — 워드마크 폭은 advance 합으로 둔다
    wordmark = {
        'viewBox': f'0 0 {ntos(width)} {HEIGHT}',
        'text': a.text,
        'font': f'{font["name"].getDebugName(4)} · OFL 1.1 · cap {CAP}/{HEIGHT}',
        'ink': ink,
        'accent': accent,
    }
    prev = {}
    if os.path.exists(OUT):
        with open(OUT, encoding='utf-8') as f:
            prev = json.load(f)
    prev['wordmark'] = wordmark
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(prev, f, ensure_ascii=False, indent=2)
        f.write('\n')
    kerned = [(names[i], names[i + 1], kern[(names[i], names[i + 1])]) for i in range(len(names) - 1) if (names[i], names[i + 1]) in kern]
    print(f'✓ brand: wordmark "{a.text}" {wordmark["font"]} · 폭 {ntos(width)} · kern {kerned or "없음"} · 패스 {sum(len(p) for p in ink + accent)}자')
    return 0


if __name__ == '__main__':
    sys.exit(main())
