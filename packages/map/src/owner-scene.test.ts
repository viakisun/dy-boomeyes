import { describe, expect, it } from 'vitest';
import type { OwnerDevice, OwnerMapScene, OwnerSite } from '@boomeyes/domain';
import { deviceState, ownerBasemap, ownerCamera, ownerMarkers, worstState } from './owner-scene';

const site = (
  id: string,
  region: OwnerSite['region'],
  lat: number,
  lng: number,
  kind: OwnerSite['kind'] = 'site',
): OwnerSite => ({
  id,
  ownerId: 'OWN-001',
  name: `${id} 현장`,
  short: id.slice(5, 7),
  kind,
  company: kind === 'site' ? '건설사' : null,
  address: '',
  region,
  location: { lat, lng },
  contact: null,
  period: null,
  progress: null,
});
const device = (
  id: string,
  siteId: string,
  lat: number,
  lng: number,
  patch: Partial<OwnerDevice> = {},
): OwnerDevice => ({
  id,
  ownerId: 'OWN-001',
  unit: Number(id.slice(-3)),
  model: 'DY CPB 32',
  siteId,
  site: `${siteId} 현장`,
  address: '',
  location: { lat, lng },
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
const A = site('SITE-AA', '서울', 37.55, 126.94);
const B = site('SITE-BB', '인천·경기', 37.38, 126.64);
const D = site('SITE-DD', '인천·경기', 37.24, 127.2, 'depot');
const devices = [
  device('CPB-001', 'SITE-AA', 37.55, 126.94),
  device('CPB-002', 'SITE-AA', 37.5507, 126.94, { fault: '고장', errorCode: 'E-021' }),
  device('CPB-003', 'SITE-BB', 37.38, 126.64, { connection: 'stale' }),
  device('CPB-005', 'SITE-DD', 37.24, 127.2, {
    deployment: 'stored',
    connection: 'detached',
    voltage: null,
    harness: null,
  }),
];
const padding = { top: 0, right: 0, bottom: 0, left: 0 };
const nation = (patch: Partial<OwnerMapScene> = {}): OwnerMapScene => ({
  level: 'nation',
  sites: [A, B, D],
  devices,
  animate: false,
  padding,
  ...patch,
});

describe('[B1-02] 현황 지도 장면 → 마커', () => {
  it('호기 상태는 고장 > 점검 > 지연·미장착 > 정상, 현장 상태는 보관을 나쁘게 치지 않는다', () => {
    expect(devices.map(deviceState)).toEqual(['normal', 'fault', 'offline', 'offline']);
    expect(worstState(devices)).toBe('fault');
    expect(worstState([devices[3]!])).toBe('normal');
    expect(worstState([devices[2]!])).toBe('offline');
  });
  it('전국은 현장마다 원 하나 — 대수는 원 안, 상태 한 줄은 이름표 둘째 줄(시안 «확정 2026-09-13»)', () => {
    const sites = ownerMarkers(nation({ focused: 'SITE-BB' }));
    expect(sites.map((m) => [m.id, m.kind, m.label, m.count, m.state, m.selected])).toEqual([
      ['SITE-AA', 'site', 'AA', 2, 'fault', false],
      ['SITE-BB', 'site', 'BB', 1, 'offline', true],
      ['SITE-DD', 'site', 'DD', 1, 'normal', false],
    ]);
    // 둘째 줄의 대수는 그 상태인 호기만 센다 — 원 안의 전체 대수와 다른 수다
    expect(sites.map((m) => m.sub)).toEqual(['고장 1대', '수신 지연 1대', '보관']);
    expect(sites[2]!.description).toContain('보관 1대');
    expect(sites.map((m) => m.variant)).toEqual([undefined, undefined, 'depot']);
    // 현장 수만큼 원이 있고 원 안의 수를 더하면 보유 대수가 된다(지역 집계로 현장이 사라지지 않는다)
    expect(sites).toHaveLength(nation().sites.length);
    expect(sites.reduce((sum, m) => sum + (m.count ?? 0), 0)).toBe(devices.length);
  });
  it('현장·호기 단계는 호기 핀이며 선택 호기와 hover 호기를 강조한다', () => {
    const scene: OwnerMapScene = {
      ...nation(),
      level: 'unit',
      site: A,
      device: devices[1],
      focused: 'CPB-001',
      devices: devices.slice(0, 2),
    };
    expect(ownerMarkers(scene).map((m) => [m.id, m.kind, m.selected])).toEqual([
      ['CPB-001', 'unit', true],
      ['CPB-002', 'unit', true],
    ]);
  });
});

describe('[B1-02] 현황 지도 장면 → 카메라', () => {
  it('전국은 현장 전체 범위 — 단계가 하나뿐이라 key도 하나다', () => {
    expect(ownerCamera(nation())).toMatchObject({
      key: 'nation',
      maxZoom: 7,
      bounds: [
        [126.64, 37.24],
        [127.2, 37.55],
      ],
    });
  });
  it('현장은 호기 범위(최대 17), 호기 한 대면 고정 줌 16, 호기 단계도 같은 key(카메라 유지)', () => {
    const many = ownerCamera({ ...nation(), level: 'site', site: A, devices: devices.slice(0, 2) });
    expect(many).toMatchObject({ key: 'site:SITE-AA', maxZoom: 17 });
    const one = ownerCamera({ ...nation(), level: 'site', site: B, devices: [devices[2]!] });
    expect(one).toMatchObject({ key: 'site:SITE-BB', center: [126.64, 37.38], zoom: 16 });
    const unit = ownerCamera({ ...nation(), level: 'unit', site: A, device: devices[0], devices: devices.slice(0, 2) });
    expect(unit.key).toBe('site:SITE-AA');
  });
  it('현장이 없으면 한반도 기본 범위', () => {
    expect(ownerCamera(nation({ sites: [] }))).toMatchObject({
      key: 'nation',
      bounds: [
        [126.1, 34.3],
        [129.6, 38.3],
      ],
    });
  });
});

describe('[B1-02] 현황 지도 장면 → 베이스맵', () => {
  it('전국만 타일 없는 국경 · 현장·호기는 회색조 타일', () => {
    expect(ownerBasemap(nation())).toEqual({ basemap: 'outline', muted: false });
    expect(ownerBasemap({ ...nation(), level: 'site', site: A })).toEqual({ basemap: 'tiles', muted: true });
    expect(ownerBasemap({ ...nation(), level: 'unit', site: A, device: devices[0] })).toEqual({
      basemap: 'tiles',
      muted: true,
    });
  });
});
