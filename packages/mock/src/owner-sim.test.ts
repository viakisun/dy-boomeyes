import { describe, expect, it } from 'vitest';
import { ownerSummary } from '@boomeyes/domain';
import { createOwnerApi, seedOwner } from './owner';
import { createOwnerSim, mulberry32 } from './owner-sim';

const A = { role: 'owner', ownerId: 'OWN-001' } as const;

describe('[FR-024] 활동 시뮬레이터', () => {
  it('같은 seed는 같은 순서(결정적)이고 첫 틱에 반드시 알림 한 건이 생긴다', () => {
    const run = () => {
      const s = seedOwner();
      let notified = 0;
      const sim = createOwnerSim(s, () => notified++, { seed: 7 });
      const changed = [sim.tick(), sim.tick(), sim.tick()];
      return { changed, alerts: s.alerts.map((a) => a.id), notified };
    };
    const a = run();
    const b = run();
    expect(a).toEqual(b);
    expect(a.changed[0]!.length).toBeGreaterThanOrEqual(1);
    expect(a.alerts.length).toBeGreaterThan(seedOwner().alerts.length);
    expect(a.notified).toBe(3);
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });
  it('보관·투입 축과 페르소나 사실(002 고장 · 003 점검 · 004 지연)은 바꾸지 않고, 알림 id는 유일하다', () => {
    const s = seedOwner();
    const sim = createOwnerSim(s, () => {}, { seed: 3 });
    for (let i = 0; i < 40; i++) sim.tick();
    const summary = ownerSummary(s.devices, s.alerts);
    expect({ stored: summary.stored, unknown: summary.unknown }).toEqual({ stored: 17, unknown: 0 });
    expect(s.devices.find((d) => d.id === 'CPB-002')!.fault).toBe('공급 전압 저하');
    expect(s.devices.find((d) => d.id === 'CPB-003')!.inspection).toBeTruthy();
    expect(s.devices.find((d) => d.id === 'CPB-004')!.connection).toBe('stale');
    expect(new Set(s.alerts.map((a) => a.id)).size).toBe(s.alerts.length);
    for (const d of s.devices) expect(d.errorCode !== null).toBe(d.fault !== null);
  });
  it('API 구독자는 틱마다 알림을 받고 해제 뒤에는 받지 않으며, 응답은 복사본이다', async () => {
    const s = seedOwner();
    let calls = 0;
    const api = createOwnerApi(A, { latencyMs: 0 }, s);
    const off = api.subscribe!(() => calls++);
    const sim = createOwnerSim(s, () => (api as unknown as { notify: () => void }).notify(), { seed: 9 });
    sim.tick();
    expect(calls).toBe(1);
    const snap = await api.snapshot();
    snap.alerts.length = 0;
    expect((await api.snapshot()).alerts.length).toBeGreaterThan(0);
    off();
    sim.tick();
    expect(calls).toBe(1);
  });
  it('start/stop은 타이머를 한 번만 걸고 해제한다', () => {
    const s = seedOwner();
    const timers: unknown[] = [];
    const sim = createOwnerSim(s, () => {}, {
      setTimer: ((fn: () => void, ms: number) => {
        timers.push([fn, ms]);
        return 1 as unknown as ReturnType<typeof setInterval>;
      }) as unknown as typeof setInterval,
      clearTimer: (() => timers.pop()) as unknown as typeof clearInterval,
    });
    sim.start();
    sim.start();
    expect(sim.running).toBe(true);
    expect(timers).toHaveLength(1);
    sim.stop();
    expect(sim.running).toBe(false);
    expect(timers).toHaveLength(0);
  });
});
