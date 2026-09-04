// MockApi — 인메모리 ApiClient (ADR-002). 상태기계로만 전이한다.
import { transition, type Alert, type ApiClient, type Case, type Device, type Kpis, type Scope } from '@boomeyes/domain';
import { clock } from './clock';
import type { Db } from './seed';

const inScope = (scope: Scope, siteId: string) => !scope.siteIds?.length || scope.siteIds.includes(siteId);
const delay = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

export function createMockApi(db: Db, opts: { latencyMs?: number } = {}): ApiClient & { db: Db } {
  const wait = () => delay(opts.latencyMs ?? 0);
  const devScope = (scope: Scope) => db.devices.filter((d) => inScope(scope, d.siteId) && (!scope.ownerId || d.ownerId === scope.ownerId));
  return {
    db,
    async users() { await wait(); return db.users; },
    async sites(scope) { await wait(); return db.sites.filter((s) => inScope(scope, s.id)); },
    async devices(scope) { await wait(); return devScope(scope); },
    async device(id) { await wait(); return db.devices.find((d) => d.id === id); },
    async cameras(deviceId) { await wait(); return db.cameras.filter((c) => !deviceId || c.deviceId === deviceId); },
    async alerts(scope) { await wait(); const ids = new Set(devScope(scope).map((d) => d.id)); return db.alerts.filter((a) => ids.has(a.deviceId)).sort((a, b) => (a.at < b.at ? 1 : -1)); },
    async ackAlert(id) { await wait(); const a = db.alerts.find((x) => x.id === id); if (!a) throw new Error(`alert ${id}`); a.acked = true; return a; },
    async cases(scope) { await wait(); return db.cases.filter((c) => inScope(scope, c.siteId)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); },
    async case(id) { await wait(); return db.cases.find((c) => c.id === id); },
    async acceptCase(id, by) { await wait(); const c = must(db, id); c.state = transition('task', c.state === 'escalated' ? 'escalated' : 'new', 'in-progress'); c.assigneeId = by; c.history.push({ at: clock.iso(), by, action: '접수' }); return c; },
    async completeCase(id, by, note) { await wait(); const c = must(db, id); c.state = transition('task', 'in-progress', 'done'); c.history.push({ at: clock.iso(), by, action: '완료 확인', note }); return c; },
    async docs(scope) {
      await wait();
      if (!scope.siteIds?.length) return db.docs;
      const subjects = new Set([...devScope(scope).map((d) => d.id), ...db.users.filter((u) => u.siteIds.some((s) => scope.siteIds?.includes(s))).map((u) => u.id)]);
      return db.docs.filter((d) => subjects.has(d.subjectId));
    },
    async leases(scope) { await wait(); return db.leases.filter((l) => inScope(scope, l.siteId)); },
    async kpis(scope): Promise<Kpis> {
      await wait(); const ds = devScope(scope); const count = (s: Device['state']) => ds.filter((d) => d.state === s).length;
      const cs = db.cases.filter((c) => inScope(scope, c.siteId));
      return { total: ds.length, normal: count('normal'), caution: count('caution'), fault: count('fault'), offline: count('offline'), maintenance: count('maintenance'), openCases: cs.filter((c) => c.state !== 'done').length, escalated: cs.filter((c) => c.state === 'escalated').length };
    },
  };
}
function must(db: Db, id: string): Case { const c = db.cases.find((x) => x.id === id); if (!c) throw new Error(`case ${id}`); return c; }
export const severityOf = (a: Alert) => a.severity;
