import { describe, expect, it } from 'vitest';
import { fanOffsets, resolveOverlaps } from './fan';

const at = (id: string, x: number, y: number) => ({ id, x, y });

describe('[B1-02] 겹치는 마커 펼침', () => {
  it('떨어진 점은 오프셋 0, 겹치는 점은 id 순으로 대칭 배치', () => {
    const off = fanOffsets([at('b', 100, 100), at('a', 110, 100), at('c', 400, 100)], 56, 24);
    expect(off.get('a')).toEqual({ x: -28, y: 0 });
    expect(off.get('b')).toEqual({ x: 28, y: 0 });
    expect(off.get('c')).toEqual({ x: 0, y: 0 });
  });
  it('세로 축은 y로만 펼친다(알약이 패널 쪽으로 밀리지 않게)', () => {
    const off = fanOffsets([at('a', 0, 0), at('b', 5, 5), at('c', 8, 2)], 44, 24, 'y');
    expect(off.get('a')).toEqual({ x: 0, y: -44 });
    expect(off.get('b')).toEqual({ x: 0, y: 0 });
    expect(off.get('c')).toEqual({ x: 0, y: 44 });
  });
  it('묶음 판정은 첫 점 기준 near 거리 — 사슬처럼 이어져도 무한히 붙지 않는다', () => {
    const off = fanOffsets([at('a', 0, 0), at('b', 20, 0), at('c', 40, 0)], 10, 24);
    expect(off.get('c')).toEqual({ x: 0, y: 0 });
  });
});

describe('[B1-02] 알약 상자 겹침 해소', () => {
  const at = (id: string, x: number, y: number) => ({ id, x, y });
  it('겹치는 두 알약은 반씩 위·아래로 벌어진다', () => {
    const off = resolveOverlaps([at('a', 100, 100), at('b', 130, 120)], { w: 112, h: 56 });
    expect(off.get('a')!.y).toBeCloseTo(-18);
    expect(off.get('b')!.y).toBeCloseTo(18);
  });
  it('가로로 충분히 떨어지면 건드리지 않고, 사슬(3개)도 세로 간격 ≥ 높이가 된다', () => {
    expect(resolveOverlaps([at('a', 0, 0), at('b', 200, 0)], { w: 112, h: 56 }).get('b')).toEqual({ x: 0, y: 0 });
    const pts = [at('a', 100, 100), at('b', 140, 130), at('c', 180, 160)];
    const off = resolveOverlaps(pts, { w: 112, h: 56 });
    const ys = pts.map((p) => p.y + off.get(p.id)!.y).sort((p, q) => p - q);
    expect(ys[1]! - ys[0]!).toBeGreaterThanOrEqual(55.9);
    expect(ys[2]! - ys[1]!).toBeGreaterThanOrEqual(55.9);
  });
});
