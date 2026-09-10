import { describe, expect, it } from 'vitest';
import { FIXED_CLOCK } from './generated/ids';
import { PIPE_AREA_M2, bucketStart, inWorkWindow, kstHour, pourRateM3h, pourSeries, todayM3 } from './pour';

// 정상 패턴 — KST 시각별(0~23시) 타설량. 야간 0 · 07시부터 상승 · 12시(점심) 0 · 오후 · 18시 이후 0
const PATTERN_A = [0, 0, 0, 0, 0, 0, 0, 6, 24, 31, 14, 26, 0, 30, 32, 28, 22, 8, 0, 0, 0, 0, 0, 0];

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
  it('합계·가동률은 now와 무관 — 14:00·03:00에 열어도 221 · 0.909(24버킷이 매 시각을 한 번씩 덮는다) · 차트만 돈다', () => {
    for (const now of ['2026-07-03T05:00:00.000Z', '2026-07-02T18:00:00.000Z']) {
      const s = pourSeries(now, PATTERN_A, { cumulativeM3: 0 });
      expect(s.totalM3).toBe(221);
      expect(s.utilization).toBe(0.909);
      expect(kstHour(s.buckets[23]!.at)).toBe(now.endsWith('05:00:00.000Z') ? 14 : 3);
    }
  });
  it('zeroFrom — 그 시각 이후 버킷은 0(고장 뒤 현재 버킷 · 두절 뒤)', () => {
    const cur = pourSeries(FIXED_CLOCK, PATTERN_A, { cumulativeM3: 0, zeroFrom: bucketStart(FIXED_CLOCK) });
    expect(cur.buckets[23]!.m3).toBe(0);
    expect(cur.buckets[22]!.m3).toBe(31);
    expect(cur.totalM3).toBe(207);
    const lost = pourSeries(FIXED_CLOCK, PATTERN_A, { cumulativeM3: 0, zeroFrom: '2026-07-02T23:37:00.000Z' }); // KST 08:37 두절
    expect(lost.buckets.slice(-2).map((b) => b.m3)).toEqual([0, 0]); // 09시 · 10시
    expect(lost.buckets[21]!.m3).toBe(24); // 08시 버킷은 두절 전 시작
  });
  it('전부 0이면 합계 0 · 가동률 0(분모는 남는다) — 미연동(pour 없음)과 구분', () => {
    const s = pourSeries(FIXED_CLOCK, new Array<number>(24).fill(0), { cumulativeM3: 0 });
    expect(s.totalM3).toBe(0);
    expect(s.utilization).toBe(0);
  });
});
