// 목업 서버. 경로로 응답을 고르고, 지연을 주고, 복사본을 돌려준다.
// 복사본인 이유: 화면이 받은 것을 고쳐도 서버 쪽이 바뀌면 안 된다(실 HTTP와 같게).
import { buildDataset } from './dataset';
import { STATUS_NOTE } from '../labels';
import { HttpError } from '../http-error';
import type { Alert, Candidate, EquipmentRequest, Site, Unit } from '../types';

const data = buildDataset();
const LATENCY_MS = 60;
/** 이 안에 계약이 끝나는 현장의 호기는 다음 요청에 돌릴 수 있다 */
const AVAILABLE_WITHIN_DAYS = 60;
/** 이 안에 끝나는 현장은 계약 종료 임박 알림을 낸다 */
const CONTRACT_ALERT_DAYS = 35;

const wait = () => new Promise(resolve => setTimeout(resolve, LATENCY_MS));
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** 알림은 현장·호기 상태에서 서버가 만들어 준다. */
function buildAlerts(sites: Site[]): Alert[] {
  const alerts: Alert[] = [];
  const add = (kind: Alert['kind'], at: string, site: Site, unit: Unit | null, title: string, detail: string) =>
    alerts.push({
      id: title + (unit ? unit.code : site.id),
      kind,
      at,
      siteId: site.id,
      siteName: site.name,
      unitNumber: unit ? unit.number : null,
      unitCode: unit ? unit.code : null,
      title,
      detail,
    });

  for (const site of sites)
    for (const unit of site.units) {
      if (unit.status === 'fault') add('fault', '08:41', site, unit, '고장', STATUS_NOTE.fault);
      if (unit.status === 'late') add('late', '7. 3. 08:22', site, unit, '수신 지연', '마지막 수신 이후 응답 없음');
      if (unit.status === 'check') add('check', '어제', site, unit, '점검 시기', STATUS_NOTE.check + ' · 기한 9. 20.');
      for (const e of unit.aiEvents)
        if (e.level === 'warn') add('ai', e.at.slice(0, 5), site, unit, 'AI · ' + e.title, e.detail);
      for (const part of unit.parts)
        if (part.kind === 'wear' && part.wornPercent >= part.limitPercent)
          add(
            'check',
            '오늘',
            site,
            unit,
            '소모품 한계',
            `${part.name} ${part.wornPercent}% · 교체 기준 ${part.limitPercent}%`,
          );
    }

  for (const site of sites)
    if (site.status !== 'store' && site.daysToEnd <= CONTRACT_ALERT_DAYS)
      add(
        'contract',
        `D-${site.daysToEnd}`,
        site,
        null,
        '계약 종료 임박',
        `${site.name} · ${site.units.length}대 · ${site.contractEnd}`,
      );
  return alerts;
}

/** 가용 호기 — 보관 중이거나 계약이 곧 끝나는 현장의 호기.
 *  고장 난 호기와 다른 요청이 이미 가져간 호기는 뺀다. */
function buildCandidates(requestId: string): Candidate[] {
  if (!data.requests.some(r => r.id === requestId)) throw new HttpError(404, `요청 ${requestId} 가 없다`);
  const taken = new Set(data.requests.filter(r => r.id !== requestId).flatMap(r => r.assignedCodes));
  return data.sites
    .flatMap(site => site.units.map(unit => ({ unit, site })))
    .filter(({ site }) => site.status === 'store' || site.daysToEnd <= AVAILABLE_WITHIN_DAYS)
    .filter(({ unit }) => unit.status !== 'fault' && !taken.has(unit.code))
    .sort(
      (a, b) =>
        (a.site.status === 'store' ? 0 : 1) - (b.site.status === 'store' ? 0 : 1) ||
        a.site.daysToEnd - b.site.daysToEnd,
    )
    .map(({ unit, site }) => ({
      unitNumber: unit.number,
      code: unit.code,
      status: unit.status,
      lastSeen: unit.lastSeen,
      documentCount: unit.documents.length,
      siteName: site.name,
      contractEnd: site.contractEnd,
      daysToEnd: site.daysToEnd,
      inStorage: site.status === 'store',
    }));
}

function assignUnits(requestId: string, codes: string[]): EquipmentRequest {
  const request = data.requests.find(r => r.id === requestId);
  if (!request) throw new HttpError(404, `요청 ${requestId} 가 없다`);
  if (request.status !== 'new') throw new HttpError(409, `요청 ${requestId} 는 이미 배정됐다`);
  if (codes.length !== request.neededCount)
    throw new HttpError(400, `${request.neededCount}대가 필요한데 ${codes.length}대를 보냈다`);
  const available = new Set(buildCandidates(requestId).map(c => c.code));
  const missing = codes.filter(c => !available.has(c));
  if (missing.length) throw new HttpError(409, `쓸 수 없는 호기: ${missing.join(', ')}`);
  request.assignedCodes = codes;
  request.status = 'assign';
  return request;
}

/** 실 HTTP와 같은 모양. 없는 경로는 404를 던진다. */
export async function handle(method: string, path: string, body?: unknown): Promise<unknown> {
  await wait();
  const candidates = path.match(/^\/requests\/([\w-]+)\/candidates$/);
  const assign = path.match(/^\/requests\/([\w-]+)\/assign$/);
  if (method === 'GET' && path === '/sites') return copy(data.sites);
  if (method === 'GET' && path === '/requests') return copy(data.requests);
  if (method === 'GET' && path === '/alerts') return copy(buildAlerts(data.sites));
  if (method === 'GET' && candidates) return copy(buildCandidates(candidates[1]));
  if (method === 'POST' && assign) return copy(assignUnits(assign[1], (body as { codes: string[] }).codes));
  throw new HttpError(404, `${method} ${path} 는 없는 경로다`);
}
