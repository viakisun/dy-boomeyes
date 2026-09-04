import { describe, expect, it } from 'vitest';
import { bootMock, clock, H } from './index';

describe('[FR-008] MockApi 업무 흐름', () => {
  it('C-105 접수 → 완료 (task 상태기계)', async () => {
    const api = bootMock({ capture: true });
    const c1 = await api.acceptCase('C-105', 'safety01');
    expect(c1.state).toBe('in-progress');
    const c2 = await api.completeCase('C-105', 'safety01', '전압 릴레이 교체');
    expect(c2.state).toBe('done');
    expect(c2.history.at(-1)?.note).toBe('전압 릴레이 교체');
  });
  it('[FR-001] 시드 계정 7 · 스코프별 장비', async () => {
    const api = bootMock({ capture: true });
    expect((await api.users()).map((u) => u.role).sort()).toEqual([
      'control',
      'driver',
      'hq-safety',
      'maintenance',
      'ops-admin',
      'owner',
      'site-safety',
    ]);
    expect((await api.devices({ role: 'control' })).length).toBe(5);
    expect((await api.devices({ role: 'site-safety', siteIds: ['SITE-001'] })).length).toBe(3);
  });
  it('[FR-002] KPI · capture 시각 고정', async () => {
    const api = bootMock({ capture: true });
    const k = await api.kpis({ role: 'control' });
    expect(k).toMatchObject({ total: 5, fault: 1, offline: 1, escalated: 1 });
    expect(clock.iso().startsWith('2026-07-03')).toBe(true);
    clock.jump(H);
    expect(clock.now().getUTCHours()).toBe(2);
  });
  it('[FR-034] CPB-002 AI 채널은 ai-unavailable, CPB-004 채널은 offline', async () => {
    const api = bootMock({ capture: true });
    const cams = await api.cameras();
    expect(cams.find((c) => c.id === 'CAM-2-2')?.state).toBe('ai-unavailable');
    expect(cams.filter((c) => c.deviceId === 'CPB-004').every((c) => c.state === 'offline')).toBe(true);
  });
});
