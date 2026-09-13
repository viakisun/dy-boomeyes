import { describe, expect, it } from 'vitest';
import { canTransition } from './machines';
import {
  OWNER_FLEET_DEFAULT,
  ownerAssignNext,
  ownerCandidates,
  ownerExpiryDays,
  ownerFleetRows,
  ownerFleetState,
  ownerLevel,
  ownerSiteSummary,
  ownerStrip,
  type OwnerAlert,
  type OwnerDevice,
  type OwnerFleetQuery,
  type OwnerRequest,
  type OwnerSite,
} from './owner';

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

describe('[FR-025] 보유 장비 표 — 세 축 · 정렬', () => {
  const NOW = '2026-07-03T10:42:00+09:00';
  const lease = (to: string) => ({ company: '건설사', from: '2026-01-01', to, installed: '2026-01-03' });
  const fleet = [
    device('CPB-001', 'SITE-A', { site: '마포', contract: lease('2026-09-30T00:00:00+09:00') }),
    device('CPB-002', 'SITE-A', { site: '마포', fault: '유압 이상', contract: lease('2026-07-20T00:00:00+09:00') }),
    device('CPB-003', 'SITE-B', { site: '판교', inspection: '수송관 점검' }),
    device('CPB-004', 'SITE-B', { site: '판교', connection: 'stale', receivedAt: '2026-07-01T08:00:00+09:00' }),
    device('CPB-005', 'SITE-D', { site: '보관소', deployment: 'stored', connection: 'detached', receivedAt: null }),
  ];
  const q = (patch: Partial<OwnerFleetQuery> = {}): OwnerFleetQuery => ({ ...OWNER_FLEET_DEFAULT, ...patch });
  const ids = (query: OwnerFleetQuery) => ownerFleetRows(fleet, query, NOW).map((d) => d.id);

  it('상태는 고장 › 점검 › 지연 › 보관 › 정상 순으로 가려낸다', () => {
    expect(fleet.map(ownerFleetState)).toEqual(['running', 'fault', 'inspection', 'stale', 'stored']);
    // 배치가 먼저다 — 보관 장비에 남은 고장 기록이 현장 고장으로 세어지면 띠와 표가 갈라진다
    expect(ownerFleetState({ ...fleet[4]!, fault: 'E-107' })).toBe('stored');
    // 투입됐는데 수신이 없는 장비는 「가동 중」이 아니다(FR-034)
    expect(ownerFleetState({ ...fleet[0]!, connection: 'unintegrated' })).toBe('unintegrated');
  });
  it('띠와 표가 같은 분류를 쓴다', () => {
    const strip = ownerStrip(fleet);
    expect(strip).toMatchObject({ total: 5, fault: 1, inspection: 1, stale: 1, stored: 1, running: 1 });
    for (const key of ['fault', 'inspection', 'stale', 'stored', 'running'] as const)
      expect(ownerFleetRows(fleet, q({ filter: key }), NOW)).toHaveLength(strip[key]);
  });
  it('기본 정렬은 확인 필요 우선이고 보관은 정상보다 뒤다', () => {
    expect(ids(q())).toEqual(['CPB-002', 'CPB-003', 'CPB-004', 'CPB-001', 'CPB-005']);
    expect(ids(q({ dir: 'desc' }))).toEqual(['CPB-005', 'CPB-001', 'CPB-004', 'CPB-003', 'CPB-002']);
    // 확인 필요 = 고장·점검·지연 셋(띠·구성 막대의 링크)
    expect(ids(q({ filter: 'attention' }))).toEqual(['CPB-002', 'CPB-003', 'CPB-004']);
  });
  it('값이 없는 행은 방향과 상관없이 뒤로 간다', () => {
    // 보관 장비는 수신도 계약도 없다 — 오름·내림 어느 쪽에서도 맨 뒤여야 한다
    expect(ids(q({ sort: 'received' })).at(-1)).toBe('CPB-005');
    expect(ids(q({ sort: 'received', dir: 'desc' })).at(-1)).toBe('CPB-005');
    expect(ids(q({ sort: 'expiry' }))).toEqual(['CPB-002', 'CPB-001', 'CPB-003', 'CPB-004', 'CPB-005']);
  });
  it('세 축은 함께 걸린다', () => {
    expect(ids(q({ filter: 'fault' }))).toEqual(['CPB-002']);
    expect(ids(q({ site: 'SITE-B' }))).toEqual(['CPB-003', 'CPB-004']);
    expect(ids(q({ site: 'SITE-B', filter: 'stale' }))).toEqual(['CPB-004']);
    // 계약 종료 30일 = 「30일 안에 끝난다」 — 계약이 없는 장비는 걸리지 않는다
    expect(ownerExpiryDays(fleet[1]!, NOW)).toBe(17);
    expect(ids(q({ expiry: '30' }))).toEqual(['CPB-002']);
    expect(ids(q({ expiry: '90' }))).toEqual(['CPB-002', 'CPB-001']);
  });
  it('검색은 호기·코드·현장·건설사를 본다', () => {
    expect(ids(q({ q: '판교' }))).toEqual(['CPB-003', 'CPB-004']);
    expect(ids(q({ q: 'cpb-005' }))).toEqual(['CPB-005']);
    expect(ids(q({ q: '2호기' }))).toEqual(['CPB-002']);
    expect(ids(q({ q: '건설사' }))).toEqual(['CPB-002', 'CPB-001']);
  });
});

describe('[FR-026] 계약 — 후보와 배정', () => {
  const lease = (to: string) => ({ company: '건설사', from: '2026-01-01', to, installed: '2026-01-03' });
  const request = (patch: Partial<OwnerRequest> = {}): OwnerRequest => ({
    id: 'REQ-001',
    ownerId: 'OWN-001',
    siteName: '성수 2공구',
    region: '서울 성동구',
    builder: '대성건설',
    manager: { name: '윤안전', phone: '010-0000-0101' },
    from: '2026-08-01',
    to: '2026-11-30',
    count: 2,
    spec: 'CPB 32m 이상',
    state: 'new',
    assigned: [],
    receivedAt: '2026-07-03T09:10:00+09:00',
    ...patch,
  });
  const fleet = [
    device('CPB-001', 'SITE-A', { contract: lease('2026-12-31') }), // 기간이 겹친다
    device('CPB-002', 'SITE-D', { deployment: 'stored', connection: 'detached' }), // 보관
    device('CPB-003', 'SITE-A', { contract: lease('2026-07-25') }), // 요청 시작 전에 끝난다
    device('CPB-004', 'SITE-D', { deployment: 'stored', fault: '유압 이상' }), // 보관이지만 고장
    device('CPB-005', 'SITE-D', { deployment: 'stored', model: 'DY CPB 28' }), // 사양 미달
  ];
  it('후보는 보관 + 종료 임박이고 고장·사양 미달은 빠진다', () => {
    expect(ownerCandidates(fleet, request()).map((c) => [c.device.id, c.reason])).toEqual([
      ['CPB-002', 'stored'],
      ['CPB-003', 'expiring'],
    ]);
    // 사양 제한이 없으면 28m도 후보다
    expect(ownerCandidates(fleet, request({ spec: 'CPB 전 기종' })).map((c) => c.device.id)).toEqual([
      'CPB-002',
      'CPB-005',
      'CPB-003',
    ]);
    // 낼 수 있는 장비가 없는 요청(시안의 «기간에 낼 수 있는 호기 없음»)
    expect(ownerCandidates(fleet, request({ spec: 'CPB 40m 이상' }))).toEqual([]);
  });
  it('고른 수가 다음 상태를 정하고 그 전이는 ssot machines.assignment에 있다', () => {
    const r = request();
    expect(ownerAssignNext(r, [])).toBe('new');
    expect(ownerAssignNext(r, ['CPB-002'])).toBe('assign');
    expect(ownerAssignNext(r, ['CPB-002', 'CPB-003'])).toBe('ship');
    // 확정된 뒤에는 이 화면이 상태를 되돌리지 않는다
    expect(ownerAssignNext(request({ state: 'ship' }), [])).toBe('ship');
    expect(ownerAssignNext(request({ state: 'done' }), ['CPB-002'])).toBe('done');
    // 나오는 전이는 모두 상태기계에 실존해야 한다
    expect(canTransition('assignment', 'new', 'assign')).toBe(true);
    expect(canTransition('assignment', 'assign', 'ship')).toBe(true);
    expect(canTransition('assignment', 'assign', 'new')).toBe(true);
    expect(canTransition('assignment', 'new', 'ship')).toBe(false);
  });
});
