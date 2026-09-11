import { describe, expect, it } from 'vitest';
import { periodPosition, periodProgress } from './period';

describe('[B1-10] periodProgress', () => {
  it('중간 시점은 during · 경과 비율 · 남은 일수', () => {
    const r = periodProgress('2026-06-01', '2026-09-30', '2026-07-03T10:42:00+09:00');
    expect(r.state).toBe('during');
    expect(r.pct).toBeGreaterThan(20);
    expect(r.pct).toBeLessThan(35);
    expect(r.remainingDays).toBe(89);
  });
  it('시작 전은 before 0% · 종료 뒤는 after 100% · 남은 일수 음수', () => {
    expect(periodProgress('2026-06-01', '2026-09-30', '2026-05-01')).toMatchObject({ state: 'before', pct: 0 });
    const after = periodProgress('2026-06-01', '2026-09-30', '2026-10-05');
    expect(after).toMatchObject({ state: 'after', pct: 100 });
    expect(after.remainingDays).toBeLessThan(0);
  });
  it('잘못된 기간(끝 ≤ 시작)은 before 0%', () => {
    expect(periodProgress('2026-09-30', '2026-06-01', '2026-07-03').pct).toBe(0);
  });
  it('마커 위치는 기간 안에서만', () => {
    expect(periodPosition('2026-06-03', '2026-06-01', '2026-09-30')).toBe(2);
    expect(periodPosition('2026-05-03', '2026-06-01', '2026-09-30')).toBeNull();
  });
});
