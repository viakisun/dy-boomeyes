// 소유주 현황 장면(OwnerMapScene) → MapView 마커·카메라. 순수 함수 — 앱 OwnerPage가 스니펫 안에서 호출한다.
import {
  OWNER_REGIONS,
  type EquipmentState,
  type OwnerDevice,
  type OwnerMapScene,
  type OwnerSite,
} from '@boomeyes/domain';
import type { MapCamera, MapMarker } from './types';

export const OWNER_ZOOM = { nation: 7, region: 10, site: 17, single: 16 } as const;
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
const visibleSites = (scene: OwnerMapScene) =>
  scene.region ? scene.sites.filter((s) => s.region === scene.region) : scene.sites;

export function ownerMarkers(scene: OwnerMapScene): MapMarker[] {
  if (scene.level === 'nation') {
    const sites = visibleSites(scene);
    if (scene.aggregate && !scene.region) {
      return OWNER_REGIONS.flatMap((region) => {
        const group = sites.filter((s) => s.region === region);
        if (!group.length) return [];
        const units = group.flatMap((s) => bySite(scene.devices, s));
        return [
          {
            id: region,
            kind: 'region' as const,
            lat: group.reduce((sum, s) => sum + s.location.lat, 0) / group.length,
            lng: group.reduce((sum, s) => sum + s.location.lng, 0) / group.length,
            state: worstState(units),
            label: region,
            count: units.length,
            description: `${region} · 현장 ${group.length}곳 · 호기 ${units.length}대`,
            selected: scene.focused === region,
          },
        ];
      });
    }
    return sites.map((site) => {
      const units = bySite(scene.devices, site);
      return {
        id: site.id,
        kind: 'site' as const,
        lat: site.location.lat,
        lng: site.location.lng,
        state: worstState(units),
        label: site.short,
        count: units.length,
        description: `${site.name} · ${site.kind === 'depot' ? '보관' : '투입'} ${units.length}대${site.company ? ` · ${site.company}` : ''}`,
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
export function ownerCamera(scene: OwnerMapScene): MapCamera {
  const { padding } = scene;
  if (scene.level === 'nation') {
    const sites = visibleSites(scene);
    return {
      key: scene.region ? `nation:${scene.region}` : 'nation',
      bounds: sites.length ? bounds(sites.map((s) => s.location)) : KOREA,
      maxZoom: scene.region ? OWNER_ZOOM.region : OWNER_ZOOM.nation,
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
