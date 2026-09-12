import { FIXED_CLOCK, OWNER_DEMO, SCREENS, type ScrId } from './generated/ids';

/** 소유주 화면의 읽기 모델. 배치·통신·이상은 서로 더할 수 없는 독립 축이다. */
export type OwnerView = (typeof OWNER_DEMO)[number]['view'];
export type OwnerApp = 'web' | 'pwa';
export type OwnerDataset = 'owner' | 'empty' | 'boundaries' | 'large';
/** 전국 현황의 지역 집계 단위(좁은 지도에서 현장 대신 표시) */
export const OWNER_REGIONS = ['서울', '인천·경기', '강원', '대전·충청', '광주·호남', '대구·경북', '부산·경남'] as const;
export type OwnerRegion = (typeof OWNER_REGIONS)[number];
/** 호기가 투입·보관된 장소. 보관소(depot)는 건설사·담당자·기간이 없다. */
export interface OwnerSite {
  id: string;
  ownerId: string;
  name: string;
  /** 지도 알약에 들어가는 짧은 이름(2~4자) */
  short: string;
  kind: 'site' | 'depot';
  company: string | null;
  address: string;
  region: OwnerRegion;
  location: { lat: number; lng: number };
  contact: { name: string; job: string; phone: string } | null;
  period: { from: string; to: string } | null;
}
export interface OwnerDevice {
  id: string;
  ownerId: string;
  unit: number;
  model: string;
  siteId: string;
  site: string;
  address: string;
  location: { lat: number; lng: number } | null;
  deployment: 'deployed' | 'stored' | 'unknown';
  connection: 'current' | 'stale' | 'unintegrated' | 'detached';
  receivedAt: string | null;
  voltage: number | null;
  /** 단선 감지 — 마지막 수신값. null = 미연동·미장착 */
  harness: 'ok' | 'disconnected' | null;
  fault: string | null;
  /** 제어기 고장 코드(고객 관제 요구: 전압·단선 고장코드). fault가 없으면 null */
  errorCode: string | null;
  inspection: string | null;
  contract: { company: string; from: string; to: string; installed: string } | null;
  contact: { name: string; job: string; phone: string } | null;
  parts: { name: string; measured: string; reference: string | null; due: boolean }[];
}
export interface OwnerDocument {
  id: string;
  deviceId: string;
  title: string;
  filename: string;
  kind: '제작증' | '비파괴 검사 성적서' | '시연용 첨부';
  type: 'application/pdf' | 'image/png' | 'image/jpeg';
  url: string;
  /** 모바일에서도 식별 가능한 원문 이미지. PDF와 동일 내용의 파생본. */
  previewUrl?: string;
  issuedAt: string;
  expiresAt: string | null;
  sessionOnly: boolean;
}
export interface OwnerAlert {
  id: string;
  deviceId: string;
  kind: 'fault' | 'inspection' | 'connection';
  title: string;
  detail: string;
  at: string;
  read: boolean;
}
export interface OwnerCamera {
  id: string;
  deviceId: string;
  purpose: 'pour' | 'install';
  label: string;
  available: boolean;
  url: string;
  poster: string;
  durationSec: number;
  operatingDay: string;
  recordedAt: string;
}
export interface OwnerSnapshot {
  dataset: OwnerDataset;
  at: string;
  company: string;
  sites: OwnerSite[];
  devices: OwnerDevice[];
  documents: OwnerDocument[];
  alerts: OwnerAlert[];
  cameras: OwnerCamera[];
}
export interface OwnerAttachment {
  name: string;
  type: OwnerDocument['type'];
  size: number;
  url: string;
  previewUrl?: string;
}
/** 세션에 바인딩한다. 호출자가 ownerId를 지정·변경하는 API는 제공하지 않는다. */
export interface OwnerApi {
  snapshot(): Promise<OwnerSnapshot>;
  device(id: string): Promise<OwnerDevice>;
  document(id: string): Promise<OwnerDocument>;
  camera(id: string): Promise<OwnerCamera>;
  alert(id: string): Promise<OwnerAlert>;
  markRead(id: string): Promise<void>;
  attach(deviceId: string, file: OwnerAttachment): Promise<OwnerDocument>;
}
export const OWNER_CLOCK = FIXED_CLOCK;
/** 소유주 데모 계정 — 실인증(IdP) 전 mock 검증(DISC-020). 화면에는 ID를 표시하지 않고 "데모 계정으로 로그인"이 채워 넣는다 */
export const OWNER_DEMO_LOGIN = { userId: 'owner01', password: 'boomeyes' } as const;
export const OWNER_UPLOAD_LIMIT = 10 * 1024 * 1024;
export const OWNER_MENU: readonly OwnerView[] = [...OWNER_DEMO]
  .filter((v) => v.menu > 0)
  .sort((a, b) => a.menu - b.menu)
  .map((v) => v.view);
export const ownerScreen = (view: OwnerView, app: OwnerApp): ScrId => OWNER_DEMO.find((x) => x.view === view)![app];
export function ownerPath(view: OwnerView, app: OwnerApp, device?: string) {
  const path = SCREENS[ownerScreen(view, app)].route.replace('[device]', encodeURIComponent(device ?? 'CPB-001'));
  return view === 'entry' && app === 'web' ? `${path}?demo=owner` : path;
}
export const ownerViewOf = (screen: ScrId | undefined, app: OwnerApp): OwnerView | undefined =>
  OWNER_DEMO.find((v) => v[app] === screen)?.view;

/** 현재 QA/테마 조건은 보존하고 업무 선택은 명시적으로 교체한다. */
export function ownerHref(
  url: URL,
  view: OwnerView,
  app: OwnerApp,
  params: Record<string, string | null> = {},
  device?: string,
) {
  const target = new URL(ownerPath(view, app, device), url.origin);
  for (const key of ['capture', 'state', 'scene', 'theme']) {
    const value = url.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  for (const [key, value] of Object.entries(params))
    if (value !== null && value !== '') target.searchParams.set(key, value);
  return target.pathname + target.search;
}
export interface OwnerViewProps {
  data: OwnerSnapshot;
  api: OwnerApi;
  app: OwnerApp;
  url: URL;
  navigate: (href: string) => void;
  refresh: () => Promise<void>;
  capture?: boolean;
}

/** 뷰어에서 같은 호기의 상세로 복귀한다. 외부 주소·다른 호기는 복귀 경로가 될 수 없다. */
export function ownerDetailReturn(url: URL, app: OwnerApp, device: string): string {
  const fallback = ownerHref(url, 'detail', app, {}, device);
  const raw = url.searchParams.get('return');
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return fallback;
  try {
    const target = new URL(raw, url.origin);
    return target.origin === url.origin && target.pathname === ownerPath('detail', app, device)
      ? target.pathname + target.search
      : fallback;
  } catch {
    return fallback;
  }
}

export function ownerSummary(devices: readonly OwnerDevice[], alerts: readonly OwnerAlert[]) {
  const count = (state: OwnerDevice['deployment']) => devices.filter((d) => d.deployment === state).length;
  const ids = new Set(devices.map((d) => d.id));
  const unique = [...new Map(alerts.filter((a) => ids.has(a.deviceId)).map((a) => [a.id, a])).values()];
  return {
    total: devices.length,
    deployed: count('deployed'),
    stored: count('stored'),
    unknown: count('unknown'),
    attention: new Set(unique.map((a) => a.deviceId)).size,
    alerts: unique.length,
  };
}
/** 운영 상태 띠 — 가동 중은 투입·최근 수신·이상 없음. 보관은 가동으로 더하지 않는다. */
export function ownerStrip(devices: readonly OwnerDevice[]) {
  const strip = { total: devices.length, running: 0, inspection: 0, fault: 0, stale: 0, stored: 0, unknown: 0 };
  for (const d of devices) {
    if (d.deployment === 'stored') strip.stored++;
    else if (d.deployment === 'unknown') strip.unknown++;
    else if (d.fault) strip.fault++;
    else if (d.inspection) strip.inspection++;
    else if (d.connection === 'stale') strip.stale++;
    else if (d.connection === 'current') strip.running++;
  }
  return strip;
}
export const OWNER_SITE_WORST = ['normal', 'stale', 'inspection', 'fault'] as const;
export type OwnerSiteWorst = (typeof OWNER_SITE_WORST)[number];
/** 현장 한 줄 요약 — 호기 수·투입/보관·확인 필요 대수·가장 나쁜 상태 */
export function ownerSiteSummary(site: OwnerSite, devices: readonly OwnerDevice[], alerts: readonly OwnerAlert[]) {
  const units = devices.filter((d) => d.siteId === site.id);
  const ids = new Set(units.map((d) => d.id));
  const attention = new Set(alerts.filter((a) => ids.has(a.deviceId)).map((a) => a.deviceId)).size;
  let worst: OwnerSiteWorst = 'normal';
  for (const d of units) {
    const state: OwnerSiteWorst = d.fault
      ? 'fault'
      : d.inspection
        ? 'inspection'
        : d.connection === 'stale'
          ? 'stale'
          : 'normal';
    if (OWNER_SITE_WORST.indexOf(state) > OWNER_SITE_WORST.indexOf(worst)) worst = state;
  }
  return {
    units: units.length,
    deployed: units.filter((d) => d.deployment === 'deployed').length,
    stored: units.filter((d) => d.deployment === 'stored').length,
    attention,
    worst,
  };
}
export type OwnerLevel =
  | { level: 'nation'; site?: undefined; device?: undefined }
  | { level: 'site'; site: OwnerSite; device?: undefined }
  | { level: 'unit'; site: OwnerSite; device: OwnerDevice };
/** 현황 드릴다운 단계 — ?site= 가 실존해야 현장, ?device= 는 그 현장 소속일 때만 호기 */
export function ownerLevel(url: URL, snap: Pick<OwnerSnapshot, 'sites' | 'devices'>): OwnerLevel {
  const site = snap.sites.find((s) => s.id === url.searchParams.get('site'));
  if (!site) return { level: 'nation' };
  const device = snap.devices.find((d) => d.id === url.searchParams.get('device') && d.siteId === site.id);
  return device ? { level: 'unit', site, device } : { level: 'site', site };
}
export const OWNER_DEPLOYMENT = { deployed: '현장 투입', stored: '보관 중', unknown: '배치 미확인' } as const;
export const OWNER_CONNECTION = {
  current: '최근 수신',
  stale: '수신 지연',
  unintegrated: '미연동',
  detached: '단말기 미장착',
} as const;
export function ownerMatches(device: OwnerDevice, query: string, filter: string) {
  const q = query.trim().toLocaleLowerCase('ko');
  const text = `${device.unit}호기 ${device.id} ${device.site} ${device.contract?.company ?? ''}`.toLocaleLowerCase(
    'ko',
  );
  return (
    (!q || text.includes(q)) &&
    (filter === 'all' ||
      filter === device.deployment ||
      (filter === 'attention' && !!(device.fault || device.inspection || device.connection === 'stale')))
  );
}
