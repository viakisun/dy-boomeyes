// 목업 서버. 경로로 응답을 고르고, 지연을 주고, 복사본을 돌려준다.
// 복사본인 이유: 화면이 받은 것을 고쳐도 서버 쪽이 바뀌면 안 된다(실 HTTP와 같게).
import { buildDb } from './seed';
import type { Alert, Candidate, Request, Site, Unit } from '../types';

const db = buildDb();
const LATENCY = 60;

const wait = () => new Promise(r => setTimeout(r, LATENCY));
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const MSG = { fault: '공급 전압 저하', check: '수송관 점검 시기 도래' };

/** 알림은 현장·호기 상태에서 서버가 만들어 준다. */
function alerts(sites: Site[]): Alert[] {
  const out: Alert[] = [];
  const at = (kind: Alert['kind'], t: string, s: Site, u: Unit | null, title: string, sub: string) =>
    out.push({
      id: title + (u ? u.code : s.id),
      kind,
      t,
      siteId: s.id,
      siteName: s.name,
      unitNum: u ? u.num : null,
      unitCode: u ? u.code : null,
      title,
      sub,
    });
  for (const s of sites)
    for (const u of s.units) {
      if (u.st === 'fault') at('fault', '08:41', s, u, '고장', MSG.fault);
      if (u.st === 'late') at('late', '7. 3. 08:22', s, u, '수신 지연', '마지막 수신 이후 응답 없음');
      if (u.st === 'check') at('check', '어제', s, u, '점검 시기', MSG.check + ' · 기한 9. 20.');
      for (const e of u.ai.filter(e => e.lvl === 'warn')) at('ai', e.t.slice(0, 5), s, u, 'AI · ' + e.type, e.detail);
      for (const p of u.parts)
        if (p[1] === 'wear' && p[2] >= p[3]!)
          at('check', '오늘', s, u, '소모품 한계', `${p[0]} ${p[2]}% · 교체 기준 ${p[3]}%`);
    }
  for (const s of sites)
    if (s.st !== 'store' && s.dday <= 35)
      at('exp', `D-${s.dday}`, s, null, '계약 종료 임박', `${s.name} · ${s.units.length}대 · ${s.end}`);
  return out;
}

/** 가용 호기 판단 — 보관 중이거나 계약이 60일 안에 끝나는 현장의 호기.
 *  고장 난 호기와 다른 요청이 이미 가져간 호기는 뺀다. */
function candidates(reqId: string): Candidate[] {
  if (!db.requests.some(r => r.id === reqId)) throw new Error(`404 ${reqId}`);
  const taken = new Set(db.requests.filter(r => r.id !== reqId).flatMap(r => r.picked));
  return db.sites
    .flatMap(s => s.units.map(u => ({ u, s })))
    .filter(({ s }) => s.st === 'store' || s.dday <= 60)
    .filter(({ u }) => u.st !== 'fault' && !taken.has(u.code))
    .sort((a, b) => (a.s.st === 'store' ? 0 : 1) - (b.s.st === 'store' ? 0 : 1) || a.s.dday - b.s.dday)
    .map(({ u, s }) => ({
      num: u.num,
      code: u.code,
      st: u.st,
      recv: u.recv,
      docs: u.docs.length,
      siteName: s.name,
      siteEnd: s.end,
      dday: s.dday,
      stored: s.st === 'store',
    }));
}

function assign(reqId: string, codes: string[]): Request {
  const r = db.requests.find(x => x.id === reqId);
  if (!r) throw new Error(`404 ${reqId}`);
  if (r.st !== 'new') throw new Error(`409 ${reqId} 는 이미 ${r.st} 다`);
  if (codes.length !== r.n) throw new Error(`400 ${r.n}대가 필요한데 ${codes.length}대다`);
  r.picked = codes;
  r.st = 'assign';
  return r;
}

/** 실 HTTP와 같은 모양. 없는 경로는 던진다. */
export async function request(method: string, path: string, body?: unknown): Promise<unknown> {
  await wait();
  const cand = path.match(/^\/requests\/([\w-]+)\/candidates$/);
  const asg = path.match(/^\/requests\/([\w-]+)\/assign$/);
  if (method === 'GET' && path === '/sites') return copy(db.sites);
  if (method === 'GET' && path === '/requests') return copy(db.requests);
  if (method === 'GET' && path === '/alerts') return copy(alerts(db.sites));
  if (method === 'GET' && cand) return copy(candidates(cand[1]));
  if (method === 'POST' && asg) return copy(assign(asg[1], (body as { codes: string[] }).codes));
  throw new Error(`404 ${method} ${path}`);
}
