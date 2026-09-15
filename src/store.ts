// 서버에서 받아 둔 것(db)과 화면 상태(state). 화면은 db를 읽기만 한다 — 쓰기는 api를 거친다.
import * as api from './api';
import type { Alert, Candidate, Request, Site, Unit } from './types';

export const db = {
  sites: [] as Site[],
  requests: [] as Request[],
  alerts: [] as Alert[],
};

export const state = {
  level: 'nation' as 'nation' | 'site' | 'unit',
  siteId: null as string | null,
  unitNum: null as number | null,
  tab: 'ops' as 'ops' | 'fleet' | 'req',
  /** 상세를 보고 있는 요청 */
  reqId: null as string | null,
  /** 아직 확정하지 않은 배정 — 서버에 보내기 전까지는 화면 안에만 있다 */
  draft: [] as string[],
  /** 열어 둔 요청의 후보. reqId가 바뀔 때 서버에서 다시 받는다 */
  cands: [] as Candidate[],
  /** 전체 화면으로 연 카메라 번호 */
  full: null as number | null,
  read: new Set<string>(),
  q: '',
  fst: 'all',
  fsite: 'all',
  fexp: 'all',
  sort: 'attn',
  group: false,
};

const site = (id = state.siteId): Site | null => db.sites.find(s => s.id === id) ?? null;
const unit = (siteId = state.siteId, num = state.unitNum): Unit | null =>
  site(siteId)?.units.find(u => u.num === num) ?? null;
export const curSite = () => site();
export const curUnit = () => unit();
export const curReq = (): Request | null => db.requests.find(r => r.id === state.reqId) ?? null;
/** 호기를 현장과 함께 — 보유 장비 표와 집계가 쓴다 */
export const allUnits = () => db.sites.flatMap(s => s.units.map(u => ({ u, s })));

export async function loadAll() {
  const [sites, requests, alerts] = await Promise.all([api.getSites(), api.getRequests(), api.getAlerts()]);
  db.sites = sites;
  db.requests = requests;
  db.alerts = alerts;
}

export async function loadRequests() {
  db.requests = await api.getRequests();
}

export async function loadCandidates() {
  state.cands = state.reqId ? await api.getCandidates(state.reqId) : [];
}
