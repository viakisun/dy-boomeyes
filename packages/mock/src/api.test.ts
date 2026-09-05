import { describe, expect, it } from 'vitest';
import { INSPECTION_ITEMS } from '@boomeyes/domain';
import { bootMock, clock, H, MIN } from './index';

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

describe('[FR-017] 수신함 신청·요청 (B1-03)', () => {
  it('승인/반려는 doc 상태기계로 전이하고 이력을 남긴다 · 스코프', async () => {
    const api = bootMock({ capture: true });
    expect((await api.requests({ role: 'control' })).map((r) => r.id)).toEqual([
      'RQ-003',
      'RQ-001',
      'RQ-005',
      'RQ-002',
      'RQ-004',
    ]);
    expect((await api.requests({ role: 'site-safety', siteIds: ['SITE-001'] })).length).toBe(4);
    const a = await api.approveRequest('RQ-001', 'control01', '2공구 개설 승인');
    expect(a.state).toBe('approved');
    expect(a.history.at(-1)).toMatchObject({ by: 'control01', action: '승인', note: '2공구 개설 승인' });
    const r = await api.rejectRequest('RQ-003', 'control01', '서류 원본 필요');
    expect(r.state).toBe('rejected');
    await expect(api.approveRequest('RQ-004', 'control01')).rejects.toThrow(); // approved에서 재승인 불가
  });
});

describe('[FR-010] 에스컬레이션 (B1-04)', () => {
  it('new 업무가 1h를 넘기면 escalated + 본사·관제 통보 · 경과 시간', async () => {
    const api = bootMock({ capture: true });
    expect((await api.escalations()).map((e) => e.case.id)).toEqual(['C-104']);
    clock.jump(61 * MIN);
    const es = await api.escalations();
    expect(es.map((e) => e.case.id).sort()).toEqual(['C-104', 'C-105']);
    const e = es.find((x) => x.case.id === 'C-105');
    expect(e?.case.state).toBe('escalated');
    expect(e?.notifyTo).toEqual(['hq-safety', 'control']);
    expect(e?.elapsedMs).toBeGreaterThanOrEqual(61 * MIN);
    expect(e?.case.history.at(-1)?.action).toMatch(/^에스컬레이션/);
    const again = await api.acceptCase('C-105', 'safety01'); // escalated → in-progress
    expect(again.state).toBe('in-progress');
  });
  it('B1-04 esc 픽스처는 C-105를 65분 전 발행으로 둔다', async () => {
    const api = bootMock({ capture: true, screen: 'B1-04', state: 'esc' });
    expect((await api.escalations()).map((e) => e.case.id).sort()).toEqual(['C-104', 'C-105']);
  });
});

describe('[FR-013] 출근 체크인 · [FR-014] 일일점검 (driver-daily)', () => {
  it('오늘: 배정 CPB-003 · 미체크인 · 동의 3항목 · 촬영 중', async () => {
    const api = bootMock({ capture: true });
    const t = await api.today('driver03');
    expect(t.device?.id).toBe('CPB-003');
    expect(t.site?.id).toBe('SITE-001');
    expect(t.attendance.checkinAt).toBeNull();
    expect(t.inspection.items.map((i) => i.id)).toEqual(INSPECTION_ITEMS.map((i) => i.id));
    expect(t.consent.items.map((c) => `${c.kind}:${c.agreed}`)).toEqual(['video:true', 'audio:false', 'location:true']);
    expect(t.filming).toBe(true);
  });
  it('반경 밖 체크인은 거리와 함께 거부 · 반경 안은 기록 · 체크아웃', async () => {
    const api = bootMock({ capture: true });
    await expect(api.checkin('driver03', { lat: 36.0, lng: 127.0 })).rejects.toThrow(/반경 밖 — \d+m/);
    const t = await api.today('driver03');
    const a = await api.checkin('driver03', { lat: t.site!.lat + 0.0005, lng: t.site!.lng });
    expect(a.checkinAt).toBeTruthy();
    expect((await api.today('driver03')).attendance.checkinAt).toBe(a.checkinAt);
    expect((await api.checkout('driver03')).checkoutAt).toBeTruthy();
  });
  it('점검 5항목 제출 → submittedAt · 픽스처 inspected/checked/mydev', async () => {
    const api = bootMock({ capture: true });
    const r = await api.submitInspection(
      'driver03',
      INSPECTION_ITEMS.map((x) => ({ ...x, ok: true })),
    );
    expect(r.submittedAt).toBeTruthy();
    expect(r.items.every((i) => i.ok)).toBe(true);
    expect(
      (await bootMock({ capture: true, screen: 'A2-03', state: 'inspected' }).today('driver03')).inspection.submittedAt,
    ).toBeTruthy();
    expect(
      (await bootMock({ capture: true, screen: 'A2-02', state: 'checked' }).today('driver03')).attendance.checkinAt,
    ).toBeTruthy();
    expect(
      (await bootMock({ capture: true, screen: 'A2-04', state: 'mydev' }).device('CPB-003'))?.telemetry.filterRatio,
    ).toBe(0.92);
  });
});
