// 소유주 현황 장면(OwnerMapScene) → MapView 마커·카메라. 순수 함수 — 앱 OwnerPage가 스니펫 안에서 호출한다.
import type { EquipmentState, OwnerDevice, OwnerMapScene, OwnerSite } from '@boomeyes/domain';
import type { MapCamera, MapMarker } from './types';

export const OWNER_ZOOM = { nation: 7, site: 17, single: 16 } as const;
const RANK: Record<EquipmentState, number> = { normal: 0, offline: 1, maintenance: 2, caution: 3, fault: 4 };

/** 호기 한 대의 마커 상태 — 고장 > 점검 > 수신 지연·미장착 > 정상 */
export function deviceState(d: OwnerDevice): EquipmentState {
  return d.fault
    ? 'fault'
    : d.inspection
      ? 'caution'
      : d.connection === 'stale' || d.connection === 'detached'
        ? 'offline'
        : 'normal';
}
/** 여러 호기의 가장 나쁜 상태. 보관(미장착)은 현장 상태를 나쁘게 만들지 않는다. */
export function worstState(devices: readonly OwnerDevice[]): EquipmentState {
  let worst: EquipmentState = 'normal';
  for (const d of devices) {
    const s = d.connection === 'detached' ? 'normal' : deviceState(d);
    if (RANK[s] > RANK[worst]) worst = s;
  }
  return worst;
}
export function unitDescription(d: OwnerDevice) {
  return `${d.unit}호기 · ${d.site}${d.connection === 'stale' ? ' · 마지막 수신 위치' : d.connection === 'detached' ? ' · 등록 보관 위치' : ''}`;
}
const bySite = (devices: readonly OwnerDevice[], site: OwnerSite) => devices.filter((d) => d.siteId === site.id);
/** 마커 둘째 줄 — 원의 색이 말하는 상태를 글로 한 번 더. 정상은 대수가 이미 원 안에 있으므로 짧게. */
const STATE_LINE: Record<EquipmentState, string> = {
  fault: '고장',
  caution: '점검',
  offline: '수신 지연',
  maintenance: '정비',
  normal: '정상',
};
function siteLine(state: EquipmentState, units: readonly OwnerDevice[], depot: boolean) {
  if (state === 'normal') return depot ? '보관' : '정상';
  const n = units.filter((d) => d.connection !== 'detached' && deviceState(d) === state).length;
  return `${STATE_LINE[state]} ${n}대`;
}

export function ownerMarkers(scene: OwnerMapScene): MapMarker[] {
  if (scene.level === 'nation') {
    // 전국은 현장 하나에 원 하나다(시안 «확정 2026-09-13») — 지역 집계는 지도에서 현장을 지워
    // 좌측 카드의 현장 목록과 대응하지 않았다. 겹침은 밀어내기와 라벨 숨김으로 푼다.
    return scene.sites.map((site) => {
      const units = bySite(scene.devices, site);
      const state = worstState(units);
      const depot = site.kind === 'depot';
      return {
        id: site.id,
        kind: 'site' as const,
        lat: site.location.lat,
        lng: site.location.lng,
        state,
        label: site.short,
        sub: siteLine(state, units, depot),
        count: units.length,
        variant: depot ? ('depot' as const) : undefined,
        description: `${site.name} · ${depot ? '보관' : '투입'} ${units.length}대${site.company ? ` · ${site.company}` : ''}`,
        selected: scene.focused === site.id,
      };
    });
  }
  return scene.devices
    .filter((d) => d.location)
    .map((d) => ({
      id: d.id,
      kind: 'unit' as const,
      lat: d.location!.lat,
      lng: d.location!.lng,
      state: deviceState(d),
      label: `${d.unit}호기`,
      description: unitDescription(d),
      selected: d.id === scene.device?.id || d.id === scene.focused,
    }));
}

function bounds(points: readonly { lat: number; lng: number }[]): [[number, number], [number, number]] {
  let [minLng, minLat, maxLng, maxLat] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of points) {
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
/** 전국 카메라는 한반도 남부 기본(현장이 없어도 지도가 빈 바다를 보이지 않게) */
const KOREA: [[number, number], [number, number]] = [
  [126.1, 34.3],
  [129.6, 38.3],
];
/** 단계별 베이스맵(시안 «확정 2026-09-12») — 전국은 타일 없는 국경, 그 아래는 회색조 타일. */
export function ownerBasemap(scene: OwnerMapScene): { basemap: 'tiles' | 'outline'; muted: boolean } {
  const outline = scene.level === 'nation';
  return { basemap: outline ? 'outline' : 'tiles', muted: !outline };
}

export function ownerCamera(scene: OwnerMapScene): MapCamera {
  const { padding } = scene;
  if (scene.level === 'nation') {
    return {
      key: 'nation',
      bounds: scene.sites.length ? bounds(scene.sites.map((s) => s.location)) : KOREA,
      maxZoom: OWNER_ZOOM.nation,
      padding,
    };
  }
  const site = scene.site!;
  const points = scene.devices.filter((d) => d.location).map((d) => d.location!);
  const key = `site:${site.id}`;
  const spread = points.length > 1 && bounds(points).some((edge, i, all) => edge.join() !== all[0]!.join());
  if (!spread)
    return {
      key,
      center: [points[0]?.lng ?? site.location.lng, points[0]?.lat ?? site.location.lat],
      zoom: OWNER_ZOOM.single,
      padding,
    };
  return { key, bounds: bounds(points), maxZoom: OWNER_ZOOM.site, padding };
}
