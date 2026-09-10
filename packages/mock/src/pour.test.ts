import { describe, expect, it } from 'vitest';
import { bootMock } from './index';

// 시각 회귀가 픽셀 diff보다 먼저 여기서 터지게 — capture 고정 시각의 버킷 경계를 리터럴로 고정(FR-039)
describe('[FR-039] 타설량 시드 결정성', () => {
  it('CPB-001(정상) — 24버킷 · 첫/마지막 at 리터럴 · 합계 221 · 가동률 0.909', async () => {
    const api = bootMock({ capture: true });
    const d = await api.device('CPB-001');
    expect(d?.pour?.buckets).toHaveLength(24);
    expect(d?.pour?.buckets[0]!.at).toBe('2026-07-02T02:00:00.000Z');
    expect(d?.pour?.buckets[23]!.at).toBe('2026-07-03T01:00:00.000Z');
    expect(d?.pour?.totalM3).toBe(221);
    expect(d?.pour?.utilization).toBe(0.909);
  });
  it('CPB-003(고장) — 10시 버킷 0(표에 구운 서사) · 가동률 0.818 · 장면 1~5 E-021 서사와 같은 시각', async () => {
    const api = bootMock({ capture: true });
    const d = await api.device('CPB-003');
    expect(d?.pour?.buckets[23]!.m3).toBe(0);
    expect(d?.pour?.utilization).toBe(0.818);
    expect(d?.pour?.cumulativeM3).toBe(3910);
  });
  it('CPB-004(두절 08:37) — 09·10시 버킷 0(표에 구운 서사) · 08시는 남는다 · 가동률 8/11 = 0.727', async () => {
    const api = bootMock({ capture: true });
    const d = await api.device('CPB-004');
    expect(d?.pour?.buckets.slice(-2).map((b) => b.m3)).toEqual([0, 0]);
    expect(d?.pour?.buckets[21]!.m3).toBe(20);
    expect(d?.pour?.utilization).toBe(0.727);
  });
  it('API 경계는 복사본 — 돌려받은 pour를 바꿔도 다음 읽기에 안 보인다', async () => {
    const api = bootMock({ capture: true });
    const a = await api.device('CPB-001');
    a!.pour!.buckets[0]!.m3 = 999;
    const b = await api.device('CPB-001');
    expect(b?.pour?.buckets[0]!.m3).toBe(26);
  });
});
