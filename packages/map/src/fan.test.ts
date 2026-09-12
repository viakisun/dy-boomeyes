import { describe, expect, it } from 'vitest';
import { fanOffsets } from './fan';

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
