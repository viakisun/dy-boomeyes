import { describe, expect, it } from 'vitest';
import { fanOffsets, spreadCircles } from './fan';

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

describe('[B1-02] 현장 원 밀어내기', () => {
  const at = (id: string, x: number, y: number) => ({ id, x, y });
  it('겹치는 두 원은 중심 거리가 min이 될 때까지 반씩 벌어진다', () => {
    const pts = [at('a', 100, 100), at('b', 120, 100)];
    const off = spreadCircles(pts, 44);
    const gap = Math.hypot(
      pts[1]!.x + off.get('b')!.x - (pts[0]!.x + off.get('a')!.x),
      pts[1]!.y + off.get('b')!.y - (pts[0]!.y + off.get('a')!.y),
    );
    expect(gap).toBeGreaterThanOrEqual(43);
    expect(off.get('a')!.x).toBeCloseTo(-off.get('b')!.x, 5);
  });
  it('되당김이 있어 밀린 원이 실제 좌표 근처에 머문다 — 한 줄로 늘어서지 않는다', () => {
    const pts = [at('a', 0, 0), at('b', 4, 2), at('c', 2, 5), at('d', 6, 6)];
    const off = spreadCircles(pts, 44);
    for (const p of pts) expect(Math.hypot(off.get(p.id)!.x, off.get(p.id)!.y)).toBeLessThan(44 * 2);
  });
  it('충분히 떨어진 원은 건드리지 않는다', () => {
    const off = spreadCircles([at('a', 0, 0), at('b', 300, 300)], 44);
    expect(off.get('a')).toEqual({ x: 0, y: 0 });
    expect(off.get('b')).toEqual({ x: 0, y: 0 });
  });
  it('완전히 같은 좌표도 결정적으로 갈라진다 — 두 번 돌려도 같은 오프셋(캡처가 흔들리지 않는다)', () => {
    const pts = [at('a', 50, 50), at('b', 50, 50), at('c', 50, 50)];
    const one = spreadCircles(pts, 44);
    const two = spreadCircles(pts, 44);
    expect([...one]).toEqual([...two]);
    const spread = pts.map((p) => ({ x: p.x + one.get(p.id)!.x, y: p.y + one.get(p.id)!.y }));
    for (let i = 0; i < spread.length; i++)
      for (let j = i + 1; j < spread.length; j++)
        expect(Math.hypot(spread[j]!.x - spread[i]!.x, spread[j]!.y - spread[i]!.y)).toBeGreaterThan(0);
  });
});
