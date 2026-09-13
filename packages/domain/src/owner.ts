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
  /** 공정 진행률 0~1. 기간이 없으면 null(보관소) */
  progress: number | null;
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
  parts: OwnerPart[];
  /** 호기 실시간 지표(FR-044 · FR-039 · FR-040). 연동 전 값은 null — 「미연동」으로 보인다(FR-034) */
  telemetry: OwnerTelemetry;
  /** 오늘 배정된 운전자(FR-027). 소유주 소속이고 배정이 매일 바뀐다 — 없으면 「배정 없음」 */
  driver: { id: string; name: string; phone: string } | null;
}
/** 마모·교체 부품 — 시안은 마모율(%)과 교체까지 남은 일수 두 축을 함께 보인다.
 *  measured·reference는 사람이 읽는 근거 문장이고, kind·value·limit은 막대가 읽는 수다. */
export interface OwnerPart {
  name: string;
  /** wear = 마모율(%) · days = 교체까지 남은 일수 */
  kind: 'wear' | 'days';
  value: number;
  /** wear의 한계치(%). days는 한계 개념이 없어 null */
  limit: number | null;
  measured: string;
  reference: string | null;
  due: boolean;
}
/** 호기 지표 6 — 전압은 FR-040, 오늘 타설은 FR-039, 나머지 넷은 FR-044.
 *  값의 출처·주기는 IF-001(DISC-008 미결)에 달렸고, 확정 전에는 시연 시드다. */
export interface OwnerTelemetry {
  /** 공급 전압 V — device.voltage와 같은 값을 지표 축에서도 읽는다 */
  voltageV: number | null;
  hydraulicBar: number | null;
  oilTempC: number | null;
  /** 붐 선회각 ° */
  boomAngleDeg: number | null;
  /** 오늘 타설량 m³ */
  pouredTodayM3: number | null;
  /** 장비 단위 누적 가동 시간 h */
  runHours: number | null;
}
/** 지표 한 줄의 표시 규칙 — 값이 null이면 「미연동」(원칙 4 · FR-034) */
export const OWNER_METRICS = [
  { key: 'voltageV', label: '공급 전압', unit: 'V' },
  { key: 'hydraulicBar', label: '유압', unit: 'bar' },
  { key: 'oilTempC', label: '유온', unit: '°C' },
  { key: 'boomAngleDeg', label: '붐 선회각', unit: '°' },
  { key: 'pouredTodayM3', label: '오늘 타설', unit: 'm³' },
  { key: 'runHours', label: '가동 시간', unit: 'h' },
] as const satisfies readonly { key: keyof OwnerTelemetry; label: string; unit: string }[];
/** 차량 서류 7종(시안 «확정 2026-09-12») — 운전자 서류(사람)는 별도 축이다(FR-027 · specs/owner-drivers).
 *  호기 화면의 서류 목록에 「운전자 자격증」을 넣지 않는다. */
export const OWNER_DOC_KINDS = [
  '제작증',
  '비파괴 검사 성적서',
  '안전검사 합격증',
  '보험 증서',
  '설치 확인서',
  '정기점검 기록',
  '수송관 교체 이력',
] as const;
export type OwnerDocKind = (typeof OWNER_DOC_KINDS)[number] | '시연용 첨부';
export interface OwnerDocument {
  id: string;
  deviceId: string;
  title: string;
  filename: string;
  kind: OwnerDocKind;
  type: 'application/pdf' | 'image/png' | 'image/jpeg';
  /** 원문 파일. null = 목록에는 있으나 원문이 등록되지 않았다(시연 세트에 실 파일이 없는 종류) */
  url: string | null;
  /** 모바일에서도 식별 가능한 원문 이미지. PDF와 동일 내용의 파생본. */
  previewUrl?: string;
  issuedAt: string;
  expiresAt: string | null;
  sessionOnly: boolean;
}
/** 투입 요청의 생애 — ssot/entities.yaml machines.assignment와 같은 5단계.
 *  소유주의 판단은 「이 기간에 낼 수 있는 장비가 있나」 하나이고 답은 보관 + 계약 종료 임박이다. */
export const OWNER_REQUEST_STATES = ['new', 'assign', 'ship', 'run', 'done'] as const;
export type OwnerRequestState = (typeof OWNER_REQUEST_STATES)[number];
export const OWNER_REQUEST_LABEL: Record<OwnerRequestState, string> = {
  new: '요청 접수',
  assign: '배정 중',
  ship: '운송·설치',
  run: '가동',
  done: '종료',
};
export interface OwnerRequest {
  id: string;
  ownerId: string;
  siteName: string;
  builder: string;
  /** 현장 안전관리자 — 회신 상대 */
  manager: { name: string; phone: string };
  from: string;
  to: string;
  /** 필요 대수 */
  count: number;
  spec: string;
  state: OwnerRequestState;
  /** 배정한 호기 id. 확정 전에는 비어 있다 */
  assigned: string[];
  receivedAt: string;
}
/** 운전자 — 소유주 소속이고 배정이 매일 바뀐다(FR-027).
 *  차량 서류(호기)와 달리 운전자 서류는 사람에 속한다. */
export interface OwnerDriver {
  id: string;
  ownerId: string;
  name: string;
  license: string;
  licenseTo: string;
  phone: string;
  /** 오늘 배정된 호기 id. 없으면 null */
  assignedTo: string | null;
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
  /** 장치 종류 — 시안의 호기 화면은 바디캠 3 · CCTV 2 · AI CCTV 1을 한 벽에 놓는다(FR-042 · DISC-004) */
  kind: 'body' | 'cctv' | 'ai';
  label: string;
  available: boolean;
  url: string;
  poster: string;
  /** 실 스트림이 아니라 시연 클립이다 — 화면이 이 사실을 숨기지 않게 표시 문구의 근거로 쓴다 */
  sample: boolean;
  durationSec: number;
  operatingDay: string;
  recordedAt: string;
}
/** AI 카메라가 올린 판단(FR-028) — 붐 하부 인원 감지.
 *  사람 문제이므로 그 시각 배정된 운전자를 함께 기록한다(FR-027 · 시안 «확정 2026-09-12»). */
export interface OwnerAiEvent {
  id: string;
  deviceId: string;
  cameraId: string;
  at: string;
  kind: 'person';
  title: string;
  detail: string;
  driver: { id: string; name: string } | null;
  /** 스틸 위에 그릴 상자(0~1 비율). 없으면 상자 없이 문장만 */
  bbox: { x: number; y: number; w: number; h: number } | null;
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
  aiEvents: OwnerAiEvent[];
  requests: OwnerRequest[];
  drivers: OwnerDriver[];
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
  /** 투입 요청에 호기를 배정한다(FR-026). N/N을 채우면 「배정 확정·회신」이 되어 계약 기간이 호기에 남는다. */
  assign(requestId: string, deviceIds: string[]): Promise<OwnerRequest>;
  /** 원천이 바뀌면 알린다(시뮬레이터 틱). 반환값은 해제. 실 API에서는 실시간 채널이 맡는다 */
  subscribe?(handler: () => void): () => void;
}
/** 활동 시뮬레이션 on/off — 기본 off(캡처·e2e 결정성), 셸 토글 또는 ?sim=1로 켠다. localStorage 키 */
export const OWNER_SIM_KEY = 'boomeyes.owner.sim';
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
  for (const key of ['capture', 'state', 'scene', 'theme', 'sim']) {
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
  /** history push = 드릴다운처럼 뒤로가기로 되돌릴 이동 · 기본(replace)은 같은 화면의 쿼리 교체 */
  navigate: (href: string, opts?: { history?: 'push' | 'replace' }) => void;
  refresh: () => Promise<void>;
  capture?: boolean;
  /** 활동 시뮬레이션이 켜져 있다(화면에 "시뮬레이션 진행 중" 표시) */
  sim?: boolean;
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
/** 가동 중 — 투입·최근 수신·이상 없음. 상태 띠의 수와 목록 필터가 같은 술어를 써야 «97대»를 눌렀을 때 97대가 나온다. */
export const ownerRunning = (d: OwnerDevice) =>
  d.deployment === 'deployed' && d.connection === 'current' && !d.fault && !d.inspection;
/** 운영 상태 띠 — 가동 중은 투입·최근 수신·이상 없음. 보관은 가동으로 더하지 않는다. */
export function ownerStrip(devices: readonly OwnerDevice[]) {
  // 분류는 ownerFleetState 하나뿐 — 띠의 수와 표의 필터가 갈라지지 않게(미연동은 띠에 칸이 없다)
  const strip = { total: devices.length, running: 0, inspection: 0, fault: 0, stale: 0, stored: 0, unknown: 0 };
  for (const d of devices) {
    const state = ownerFleetState(d);
    if (state !== 'unintegrated') strip[state]++;
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
/** 현황 지도 장면 — ui가 앱 스니펫(map)에 넘기고, 앱이 MapView 마커·카메라로 옮긴다(ui는 map을 import하지 않는다). */
export interface OwnerMapScene {
  level: OwnerLevel['level'];
  sites: readonly OwnerSite[];
  /** 그릴 호기 — nation: 대수 집계용 전체, site·unit: 그 현장 호기 */
  devices: readonly OwnerDevice[];
  site?: OwnerSite;
  device?: OwnerDevice;
  /** nation에서 한 지역만 펼쳐 볼 때 */
  region?: OwnerRegion;
  /** true면 nation을 지역 7개로 집계(좁은 지도) */
  aggregate: boolean;
  /** 목록 hover 등으로 강조할 현장·호기 id */
  focused?: string;
  animate: boolean;
  /** 상태 띠·패널·시트가 가리는 픽셀 — 카메라가 비워 둘 여백 */
  padding: { top: number; right: number; bottom: number; left: number };
  onselect?: (kind: 'region' | 'site' | 'unit', id: string) => void;
}
export const OWNER_DEPLOYMENT = { deployed: '현장 투입', stored: '보관 중', unknown: '배치 미확인' } as const;
export const OWNER_CONNECTION = {
  current: '최근 수신',
  stale: '수신 지연',
  unintegrated: '미연동',
  detached: '단말기 미장착',
} as const;
export function ownerMatches(device: OwnerDevice, query: string, filter: string) {
  return ownerSearchHit(device, query) && ownerStateHit(device, filter);
}

// ── 보유 장비 표 — 검색 1 · 필터 3축 · 정렬(시안 «확정 2026-09-12») ──────────────────────
/** 표의 상태 축 — 배치(보관·미확인)와 이상(고장·점검·지연)을 한 축으로 합친다. 소유주는 둘을 함께 고른다.
 *  한 호기는 정확히 하나에 든다 — 띠(ownerStrip)와 표가 같은 분류를 쓰지 않으면 수가 어긋난다. */
export const OWNER_FLEET_STATES = [
  'fault',
  'inspection',
  'stale',
  'unintegrated',
  'running',
  'unknown',
  'stored',
] as const;
export type OwnerFleetState = (typeof OWNER_FLEET_STATES)[number];
export const OWNER_FLEET_STATE_LABEL: Record<OwnerFleetState, string> = {
  fault: '고장',
  inspection: '점검',
  stale: '수신 지연',
  unintegrated: '미연동',
  running: '가동 중',
  unknown: '배치 미확인',
  stored: '보관',
};
/** 한 호기의 표 상태. 배치를 먼저 본다 — 보관 중인 장비에 남은 고장 기록이 현장 고장으로 세어지지 않게. */
export function ownerFleetState(d: OwnerDevice): OwnerFleetState {
  if (d.deployment === 'stored') return 'stored';
  if (d.deployment === 'unknown') return 'unknown';
  if (d.fault) return 'fault';
  if (d.inspection) return 'inspection';
  if (d.connection === 'stale') return 'stale';
  return ownerRunning(d) ? 'running' : 'unintegrated';
}
/** 「확인 필요 우선」 정렬 — 고장 › 점검 › 지연 › 미연동 › 가동 중 › 배치 미확인 › 보관(시안). */
export const ownerAttentionRank = (d: OwnerDevice) => OWNER_FLEET_STATES.indexOf(ownerFleetState(d));
/** 검색어 — 호기·코드·현장·건설사를 본다. */
export function ownerSearchHit(d: OwnerDevice, query: string) {
  const q = query.trim().toLocaleLowerCase('ko');
  if (!q) return true;
  return `${d.unit}호기 ${d.id} ${d.site} ${d.contract?.company ?? ''}`.toLocaleLowerCase('ko').includes(q);
}
/** 상태 축 — 상태 하나, 또는 여러 상태를 묶은 deployed·attention(띠·구성 막대의 링크가 쓴다). */
export function ownerStateHit(d: OwnerDevice, filter: string) {
  if (filter === 'all') return true;
  if (filter === 'deployed') return d.deployment === 'deployed';
  if (filter === 'attention') return ownerAttentionRank(d) <= OWNER_FLEET_STATES.indexOf('stale');
  return ownerFleetState(d) === filter;
}
/** 계약 종료까지 남은 일수. 계약이 없으면 null · 이미 끝났으면 음수. */
export function ownerExpiryDays(d: OwnerDevice, now: string): number | null {
  if (!d.contract) return null;
  return Math.round((Date.parse(d.contract.to) - Date.parse(now)) / 86_400_000);
}
export const OWNER_FLEET_EXPIRY = ['all', '30', '60', '90'] as const;
export type OwnerFleetExpiry = (typeof OWNER_FLEET_EXPIRY)[number];
export const OWNER_FLEET_SORTS = ['attention', 'unit', 'site', 'received', 'expiry'] as const;
export type OwnerFleetSort = (typeof OWNER_FLEET_SORTS)[number];
export interface OwnerFleetQuery {
  q: string;
  /** 상태 축 — 'all' · OwnerFleetState · 'deployed' · 'attention' */
  filter: string;
  site: string;
  expiry: OwnerFleetExpiry;
  sort: OwnerFleetSort;
  dir: 'asc' | 'desc';
}
export const OWNER_FLEET_DEFAULT: OwnerFleetQuery = {
  q: '',
  filter: 'all',
  site: 'all',
  expiry: 'all',
  sort: 'attention',
  dir: 'asc',
};
/** 세 축 + 검색어. 계약 종료 축은 「N일 안에 끝난다」이고 이미 끝난 계약도 포함한다(더 급한 쪽이다). */
export function ownerFleetMatches(d: OwnerDevice, query: OwnerFleetQuery, now: string) {
  if (!ownerSearchHit(d, query.q) || !ownerStateHit(d, query.filter)) return false;
  if (query.site !== 'all' && d.siteId !== query.site) return false;
  if (query.expiry !== 'all') {
    const days = ownerExpiryDays(d, now);
    if (days === null || days > Number(query.expiry)) return false;
  }
  return true;
}
/** 값이 없는 행은 방향과 상관없이 뒤로 보낸다 — 「수신 없음」이 먼저 오면 표가 쓸모없다. */
const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) =>
  a === null ? (b === null ? 0 : 1) : b === null ? -1 : (a - b) * dir;
/** 필터 → 정렬. 같은 값이면 호기 번호가 마지막 기준이다(정렬이 흔들리지 않게). */
export function ownerFleetRows(devices: readonly OwnerDevice[], query: OwnerFleetQuery, now: string): OwnerDevice[] {
  const dir = query.dir === 'desc' ? -1 : 1;
  const time = (at: string | null) => (at ? Date.parse(at) : null);
  return devices
    .filter((d) => ownerFleetMatches(d, query, now))
    .sort((a, b) => {
      const by =
        query.sort === 'unit'
          ? (a.unit - b.unit) * dir
          : query.sort === 'site'
            ? a.site.localeCompare(b.site, 'ko') * dir
            : query.sort === 'received'
              ? nullsLast(time(a.receivedAt), time(b.receivedAt), dir)
              : query.sort === 'expiry'
                ? nullsLast(ownerExpiryDays(a, now), ownerExpiryDays(b, now), dir)
                : (ownerAttentionRank(a) - ownerAttentionRank(b)) * dir;
      return by || a.unit - b.unit;
    });
}

// ── 계약 — 요청 · 후보 · 배정(시안 «확정 2026-09-12» · FR-026) ─────────────────────────
/** 사양의 최소 붐 길이(m) — 'CPB 32m 이상' → 32. 숫자가 없으면 제한 없음(null). */
export const ownerSpecMeters = (spec: string) => {
  const m = /(\d+)\s*m/i.exec(spec);
  return m ? Number(m[1]) : null;
};
/** 장비의 붐 길이 — 'DY CPB 32' → 32. */
export const ownerBoomMeters = (model: string) => {
  const m = /(\d+)\s*$/.exec(model.trim());
  return m ? Number(m[1]) : null;
};
export interface OwnerCandidate {
  device: OwnerDevice;
  /** stored = 지금 보관 중 · expiring = 요청 시작 전에 계약이 끝난다 */
  reason: 'stored' | 'expiring';
  /** 비는 날 — 보관 중이면 null(지금 낼 수 있다) */
  freeAt: string | null;
}
/**
 * 「이 기간에 낼 수 있는 장비가 있나」의 답 — 보관 + 종료 임박(시안).
 * 사양(최소 붐 길이)을 못 맞추는 장비는 후보가 아니다. 고장·점검 중인 장비도 뺀다.
 */
export function ownerCandidates(devices: readonly OwnerDevice[], request: OwnerRequest): OwnerCandidate[] {
  const need = ownerSpecMeters(request.spec);
  const start = Date.parse(request.from);
  const out: OwnerCandidate[] = [];
  for (const device of devices) {
    if (device.fault || device.inspection) continue;
    const boom = ownerBoomMeters(device.model);
    if (need !== null && (boom === null || boom < need)) continue;
    if (request.assigned.includes(device.id)) {
      out.push({ device, reason: 'stored', freeAt: null });
      continue;
    }
    if (device.deployment === 'stored') out.push({ device, reason: 'stored', freeAt: null });
    else if (device.contract && Date.parse(device.contract.to) <= start)
      out.push({ device, reason: 'expiring', freeAt: device.contract.to });
  }
  return out.sort((a, b) => (a.freeAt ?? '').localeCompare(b.freeAt ?? '') || a.device.unit - b.device.unit);
}
/**
 * 고른 호기 수에 따른 다음 상태 — 하나라도 고르면 「후보 확인 시작」(new → assign),
 * 필요 대수를 채우면 「배정 확정·회신」(assign → ship). 전이는 ssot machines.assignment가 정한다.
 * new에서 한 번에 채우면 두 전이를 차례로 밟는다 — new → ship은 상태기계에 없다.
 */
export function ownerAssignNext(request: OwnerRequest, picked: readonly string[]): OwnerRequestState {
  if (request.state !== 'new' && request.state !== 'assign') return request.state;
  if (picked.length === 0) return 'new'; // 후보 부족으로 보류(assign → new) · new면 그대로
  return picked.length >= request.count ? 'ship' : 'assign';
}
