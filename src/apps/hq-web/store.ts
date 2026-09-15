// 본사 안전관리자 앱이 서버에서 받아 둔 것과 지금 보고 있는 것.
// 소유주와 달리 자기 현장만 본다 — 전국 지도도, 보유 장비도, 요청 배정도 없다.
import * as api from '../../shared/api';
import type { Alert, Site, Unit } from '../../shared/types';

/** 로그인이 생기기 전까지는 어느 건설사 본사로 볼지 주소로 고른다(?company=한빛건설). */
export const currentCompany = () => new URLSearchParams(location.search).get('company') ?? '한빛건설';

export const server = {
  sites: [] as Site[],
  alerts: [] as Alert[],
};

export const view = {
  level: 'site' as 'site' | 'unit',
  siteId: null as string | null,
  unitNumber: null as number | null,
  openCamera: null as number | null,
  readAlerts: new Set<string>(),
};

export const currentSite = (): Site | null => server.sites.find(s => s.id === view.siteId) ?? null;
export const currentUnit = (): Unit | null => currentSite()?.units.find(u => u.number === view.unitNumber) ?? null;

export const unreadAlertCount = () => server.alerts.filter(a => !view.readAlerts.has(a.id)).length;

/** 서버가 아직 건설사별 경로를 주지 않으므로 받아서 거른다.
 *  실서버가 생기면 GET /sites?builder= 로 옮긴다 — api.ts만 고치면 된다. */
export async function loadEverything() {
  const company = currentCompany();
  const [sites, alerts] = await Promise.all([api.fetchSites(), api.fetchAlerts()]);
  server.sites = sites.filter(s => s.builder === company);
  const mine = new Set(server.sites.map(s => s.id));
  server.alerts = alerts.filter(a => mine.has(a.siteId));
  if (!view.siteId && server.sites.length) view.siteId = server.sites[0].id;
}
