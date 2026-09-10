import { describe, expect, it } from 'vitest';
import { FIXED_CLOCK } from './generated/ids';
import { PIPE_AREA_M2, bucketStart, inWorkWindow, pourRateM3h, pourSeries, todayM3 } from './pour';

// 정상 패턴 — idx0 = 23시간 전(KST 11시) … idx23 = 현재 버킷(KST 10시). 점심(12시) 0 · 야간 0
const PATTERN_A = [26, 0, 30, 32, 28, 22, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 24, 31, 14];

describe('[FR-039] 타설량 산출 기준안(DISC-055)', () => {
  it('D125 단면적 ≈ 0.0123 m² · Q = v×A (Δt 1.5s → v 1 m/s → 44.2 m³/h)', () => {
    expect(PIPE_AREA_M2).toBeCloseTo(0.0123, 4);
    expect(pourRateM3h(1.5)).toBeCloseTo(44.2, 1);
  });
  it('버킷 시작은 UTC 정시 내림 — 고정 시각 KST 10:42 → 10:00(01:00Z)', () => {
    expect(bucketStart(FIXED_CLOCK)).toBe('2026-07-03T01:00:00.000Z');
    expect(bucketStart(new Date('2026-07-03T01:59:59.999Z'))).toBe('2026-07-03T01:00:00.000Z');
  });
  it('작업 시간대 KST 07~17시 버킷만 가동률 분모', () => {
    expect(inWorkWindow('2026-07-02T22:00:00.000Z')).toBe(true); // KST 07
    expect(inWorkWindow('2026-07-02T08:00:00.000Z')).toBe(true); // KST 17
    expect(inWorkWindow('2026-07-02T09:00:00.000Z')).toBe(false); // KST 18
    expect(inWorkWindow('2026-07-02T21:00:00.000Z')).toBe(false); // KST 06
  });
  it('시계열 24버킷 — 첫/마지막 at 리터럴 · 합계 221 · 가동률 10/11(작업 11버킷 중 점심 0 하나)', () => {
    const s = pourSeries(FIXED_CLOCK, PATTERN_A, { cumulativeM3: 4820 });
    expect(s.buckets).toHaveLength(24);
    expect(s.buckets[0]!.at).toBe('2026-07-02T02:00:00.000Z');
    expect(s.buckets[23]!.at).toBe('2026-07-03T01:00:00.000Z');
    expect(s.totalM3).toBe(221);
    expect(s.utilization).toBe(0.909);
    expect(s.basis.areaM2).toBe(0.0123);
  });
  it('오늘 = KST 자정 이후 버킷(07·08·09·10시) 합 75 — 전날 버킷은 빠진다', () => {
    const s = pourSeries(FIXED_CLOCK, PATTERN_A, { cumulativeM3: 0 });
    expect(todayM3(s.buckets, FIXED_CLOCK)).toBe(75);
  });
  it('전부 0이면 합계 0 · 가동률 0(분모는 남는다) — 미연동(pour 없음)과 구분', () => {
    const s = pourSeries(FIXED_CLOCK, new Array<number>(24).fill(0), { cumulativeM3: 0 });
    expect(s.totalM3).toBe(0);
    expect(s.utilization).toBe(0);
  });
});
