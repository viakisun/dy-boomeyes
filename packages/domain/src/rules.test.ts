// [FR-040] 3상 판정 — DISC-056 확정 전 기준안(PHASE_LIMITS)이 결상·역상·단상·과전압·정상·미연동을 가른다
import { describe, expect, it } from 'vitest';
import { PHASE_LIMITS, PHASE_NOMINAL_V, phaseImbalance, powerStatus } from './rules';
import type { PowerReading } from './types';

const p = (r: number, s: number, t: number, fault: PowerReading['fault'] = 'none'): PowerReading => ({
  volts: { r, s, t },
  fault,
  motorReady: fault === 'none',
});

describe('[FR-040] powerStatus — 3상 판정', () => {
  it('균형 정상 → normal · 미연동(unlinked power 또는 값 없음) → unlinked', () => {
    expect(powerStatus(p(381, 380, 382))).toBe('normal');
    expect(powerStatus(undefined)).toBe('unlinked');
    expect(powerStatus(p(381, 380, 382), ['power'])).toBe('unlinked');
  });
  it('제어기 판정(fault)이 있으면 그대로 — 임계보다 우선', () => {
    expect(powerStatus(p(381, 380, 382, 'reverse'))).toBe('reverse');
  });
  it('한 상이 정격×loss 아래면 결상(loss) — CPB-003 시드(S상 118V)', () => {
    expect(118).toBeLessThan(PHASE_NOMINAL_V * PHASE_LIMITS.loss);
    expect(powerStatus(p(381, 118, 379))).toBe('loss');
  });
  it('정격×over 초과 → over · 정격×under 미만(결상 아님) → under', () => {
    expect(powerStatus(p(381, 430, 382))).toBe('over');
    expect(powerStatus(p(330, 335, 332))).toBe('under');
  });
  it('불평형이 imbalance 초과면 reverse · phaseImbalance = (max−min)/avg', () => {
    expect(phaseImbalance(p(380, 380, 380))).toBe(0);
    const x = p(400, 360, 380);
    expect(phaseImbalance(x)).toBeCloseTo(40 / 380, 5);
    expect(powerStatus(x)).toBe('reverse');
  });
});
