// [FR-011] [FR-010] PWA 알림 페이로드 — 딥링크 URL 규칙(specs/notifications AC-3) · 제목 · tag
import { describe, expect, it } from 'vitest';
import type { Alert } from './types';
import { toPushPayload } from './notify';

const alert: Alert = {
  id: 'AL-D01',
  deviceId: 'CPB-003',
  kind: 'voltage',
  severity: 'critical',
  message: 'CPB-003 380V 전압 이상 (E-021) — 342V',
  at: '2026-07-03T01:42:00.000Z',
  acked: false,
  caseId: 'C-105',
};

describe('[FR-011] toPushPayload', () => {
  it('현장(a1)은 업무 상세로, 업무가 없으면 업무함으로', () => {
    expect(toPushPayload(alert, 'a1')).toEqual({
      title: 'CPB-003 · 전압',
      body: alert.message,
      url: '/a1/inbox/C-105',
      tag: 'C-105',
      severity: 'critical',
    });
    expect(toPushPayload({ ...alert, caseId: null }, 'a1')).toMatchObject({ url: '/a1/inbox', tag: 'AL-D01' });
  });
  it('[FR-010] 운전자 a2 → 오늘 · 본사 a3 → 현장 목록(에스컬레이션) · 사업주 a4 → 보유 현황', () => {
    expect(toPushPayload(alert, 'a2').url).toBe('/a2/today');
    expect(toPushPayload(alert, 'a3').url).toBe('/a3/sites');
    expect(toPushPayload(alert, 'a4').url).toBe('/a4/fleet');
  });
});
