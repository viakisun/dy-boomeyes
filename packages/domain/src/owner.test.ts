import { describe, expect, it } from 'vitest';
import { ownerLevel, ownerSiteSummary, ownerStrip, type OwnerAlert, type OwnerDevice, type OwnerSite } from './owner';

const site = (id: string, kind: OwnerSite['kind'] = 'site'): OwnerSite => ({
  id,
  ownerId: 'OWN-001',
  name: id,
  short: id.slice(-2),
  kind,
  company: kind === 'site' ? '건설사' : null,
  address: '',
  region: '서울',
  location: { lat: 37.5, lng: 127 },
  contact: null,
  period: null,
  progress: null,
});
const device = (id: string, siteId: string, patch: Partial<OwnerDevice> = {}): OwnerDevice => ({
  id,
  ownerId: 'OWN-001',
  unit: Number(id.slice(-3)),
  model: 'DY CPB 32',
  siteId,
  site: siteId,
  address: '',
  location: { lat: 37.5, lng: 127 },
  deployment: 'deployed',
  connection: 'current',
  receivedAt: '2026-07-03T10:41:00+09:00',
  voltage: 380,
  harness: 'ok',
  fault: null,
  errorCode: null,
  inspection: null,
  contract: null,
  contact: null,
  parts: [],
  telemetry: { voltageV: 380, hydraulicBar: 210, oilTempC: 58, boomAngleDeg: 12, pouredTodayM3: 18, runHours: 1200 },
  driver: null,
  ...patch,
});
const alert = (deviceId: string, kind: OwnerAlert['kind']): OwnerAlert => ({
  id: `${deviceId}-${kind}`,
  deviceId,
  kind,
  title: kind,
  detail: '',
  at: '2026-07-03T10:00:00+09:00',
  read: false,
});
const A = site('SITE-A');
const DEPOT = site('SITE-D', 'depot');
const devices = [
  device('CPB-001', 'SITE-A'),
  device('CPB-002', 'SITE-A', { fault: '공급 전압 저하', errorCode: 'E-021', voltage: 342 }),
  device('CPB-003', 'SITE-A', { inspection: '점검', connection: 'stale' }),
  device('CPB-004', 'SITE-A', { connection: 'stale' }),
  device('CPB-005', 'SITE-D', { deployment: 'stored', connection: 'detached', voltage: null, harness: null }),
  device('CPB-006', 'SITE-A', { deployment: 'unknown', connection: 'unintegrated', harness: null }),
];

describe('[FR-024] 운영 상태 띠와 현장 요약', () => {
  it('가동 중은 투입·최근 수신·이상 없음만 세고, 고장 > 점검 > 지연 순으로 한 번만 센다', () => {
    expect(ownerStrip(devices)).toEqual({
      total: 6,
      running: 1,
      inspection: 1,
      fault: 1,
      stale: 1,
      stored: 1,
      unknown: 1,
    });
  });
  it('현장 요약은 그 현장 호기만 세고 가장 나쁜 상태를 고른다', () => {
    const alerts = [alert('CPB-002', 'fault'), alert('CPB-003', 'inspection'), alert('CPB-003', 'connection')];
    expect(ownerSiteSummary(A, devices, alerts)).toEqual({
      units: 5,
      deployed: 4,
      stored: 0,
      attention: 2,
      worst: 'fault',
    });
    expect(ownerSiteSummary(DEPOT, devices, alerts)).toEqual({
      units: 1,
      deployed: 0,
      stored: 1,
      attention: 0,
      worst: 'normal',
    });
    expect(ownerSiteSummary(A, devices.slice(2, 4), []).worst).toBe('inspection');
    expect(ownerSiteSummary(A, devices.slice(3, 4), []).worst).toBe('stale');
  });
});

describe('[FR-024] 현황 드릴다운 단계', () => {
  const snap = { sites: [A, DEPOT], devices };
  const at = (query: string) => ownerLevel(new URL(`https://x.test/b1/dash${query}`), snap);
  it('현장이 없거나 실존하지 않으면 전국', () => {
    expect(at('')).toEqual({ level: 'nation' });
    expect(at('?site=SITE-X&device=CPB-001')).toEqual({ level: 'nation' });
  });
  it('호기는 지정한 현장 소속일 때만 열린다', () => {
    expect(at('?site=SITE-A')).toMatchObject({ level: 'site', site: { id: 'SITE-A' } });
    expect(at('?site=SITE-A&device=CPB-001')).toMatchObject({ level: 'unit', device: { id: 'CPB-001' } });
    expect(at('?site=SITE-D&device=CPB-001')).toMatchObject({ level: 'site', site: { id: 'SITE-D' } });
    expect(at('?site=SITE-A&device=CPB-999')).toMatchObject({ level: 'site' });
  });
});
