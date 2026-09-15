// 소유주 앱이 서버에서 받아 둔 것(server)과 지금 보고 있는 것(view).
// 화면은 server를 읽기만 한다 — 바꾸는 것은 shared/api를 거친다.
import * as api from '../../shared/api';
import type { Alert, Candidate, EquipmentRequest, Site, Unit } from '../../shared/types';

/** 서버에서 받아 둔 것 */
export const server = {
  sites: [] as Site[],
  requests: [] as EquipmentRequest[],
  alerts: [] as Alert[],
};

export type Level = 'nation' | 'site' | 'unit';
export type Tab = 'ops' | 'fleet' | 'requests';
export type SortKey = 'attention' | 'number' | 'site' | 'contractEnd';

/** 지금 무엇을 보고 있나 */
export const view = {
  tab: 'ops' as Tab,
  level: 'nation' as Level,
  siteId: null as string | null,
  unitNumber: null as number | null,
  /** 전체 화면으로 연 카메라 번호 */
  openCamera: null as number | null,
  /** 읽음 표시한 알림 — 화면 안에만 있다 */
  readAlerts: new Set<string>(),

  /** 상세를 보고 있는 요청 */
  requestId: null as string | null,
  /** 서버가 준 후보 */
  candidates: [] as Candidate[],
  /** 아직 확정하지 않은 배정 — 보내기 전까지 화면 안에만 있다 */
  draftCodes: [] as string[],
  /** 서버에 보내는 중 — 두 번 눌러도 한 번만 간다 */
  submitting: false,

  // 보유 장비 표
  query: '',
  statusFilter: 'all',
  siteFilter: 'all',
  contractFilter: 'all',
  sortBy: 'attention' as SortKey,
  groupBySite: false,
};

export const currentSite = (): Site | null => server.sites.find(s => s.id === view.siteId) ?? null;
export const currentUnit = (): Unit | null => currentSite()?.units.find(u => u.number === view.unitNumber) ?? null;
export const currentRequest = (): EquipmentRequest | null => server.requests.find(r => r.id === view.requestId) ?? null;

/** 호기를 현장과 함께 — 보유 장비 표와 집계가 쓴다 */
export const allUnitsWithSite = () => server.sites.flatMap(site => site.units.map(unit => ({ unit, site })));

export const unreadAlertCount = () => server.alerts.filter(a => !view.readAlerts.has(a.id)).length;
export const newRequestCount = () => server.requests.filter(r => r.status === 'new').length;

export async function loadEverything() {
  const [sites, requests, alerts] = await Promise.all([api.fetchSites(), api.fetchRequests(), api.fetchAlerts()]);
  server.sites = sites;
  server.requests = requests;
  server.alerts = alerts;
}

export async function reloadRequests() {
  server.requests = await api.fetchRequests();
}

export async function loadCandidates() {
  view.candidates = view.requestId ? await api.fetchCandidates(view.requestId) : [];
}
