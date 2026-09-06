// [FR-037] [NFR-016] 아웃박스 — 오프라인 적재 · 오버레이 · FIFO 전송 · 멱등 키 · 백오프 5회 · 업무 거부 · 보존 · 충돌 규칙 (ADR-010)
import { describe, expect, it } from 'vitest';
import type { ApiClient, Clock, WriteMeta } from '@boomeyes/domain';
import { createOutbox } from './outbox';
import { idbStore, memoryStore } from './store';
import { withOutbox } from './with-outbox';

const clock: Clock = { now: () => new Date('2026-07-03T01:42:00Z'), iso: () => '2026-07-03T01:42:00.000Z' };
function fakeApi() {
  const calls: { kind: string; meta?: WriteMeta; args: unknown[] }[] = [];
  const api = {
    checkin: async (u: string, pos: { lat: number; lng: number }, meta?: WriteMeta) => {
      calls.push({ kind: 'checkin', meta, args: [u, pos] });
      if (pos.lat > 90) throw new Error('현장 반경 밖 — 5000m');
      return {
        userId: u,
        deviceId: 'CPB-003',
        siteId: 'SITE-001',
        checkinAt: meta?.at ?? clock.iso(),
        checkoutAt: null,
      };
    },
    checkout: async (u: string, meta?: WriteMeta) => {
      calls.push({ kind: 'checkout', meta, args: [u] });
      return { userId: u, deviceId: 'CPB-003', siteId: 'SITE-001', checkinAt: 'x', checkoutAt: meta?.at ?? '' };
    },
    submitInspection: async (u: string, items: unknown[], meta?: WriteMeta) => {
      calls.push({ kind: 'inspection', meta, args: [u, items] });
      return { id: 'INS', userId: u, deviceId: '', date: '', items, submittedAt: meta?.at ?? '' };
    },
    submitDoc: async (id: string, file: unknown, by: string, meta?: WriteMeta) => {
      calls.push({ kind: 'doc', meta, args: [id, file, by] });
      return { id, state: 'submitted', submittedAt: meta?.at, file, history: [] };
    },
    today: async (u: string) => ({
      user: { id: u },
      attendance: { userId: u, deviceId: '', siteId: '', checkinAt: null, checkoutAt: null },
      inspection: { id: 'INS', userId: u, deviceId: '', date: '', items: [], submittedAt: null },
    }),
    docs: async () => [{ id: 'DOC-001', state: 'expiring', history: [] }],
    doc: async (id: string) => ({ id, state: 'expiring', history: [] }),
  } as unknown as ApiClient;
  return { api, calls };
}
const boot = (name: string, net: 'on' | 'off' | 'fail' = 'on', store = idbStore(name)) =>
  createOutbox({ store, clock, auto: false, backoffMs: 1, net });

describe('[FR-037] withOutbox — 오프라인 적재 · 읽기 오버레이 · 온라인 전송', () => {
  it('오프라인 체크인은 큐에 쌓이고 today가 pending으로 보이며, 온라인 sync에서 같은 clientId·단말 시각으로 전송된다', async () => {
    const { api, calls } = fakeApi();
    const ob = boot('t1', 'off');
    await ob.load();
    const w = withOutbox(api, ob);
    const r = await w.checkin('driver03', { lat: 37.5, lng: 127 });
    expect(r.pending).toBe(true);
    expect(ob.state().queued).toBe(1);
    expect(calls).toHaveLength(0);
    const t = await w.today('driver03');
    expect(t.attendance.pending).toBe(true);
    expect(t.attendance.checkinAt).toBe('2026-07-03T01:42:00.000Z');
    const id = ob.state().items[0]?.id;
    ob.setNet('on');
    await ob.sync();
    expect(ob.state().queued).toBe(0);
    expect(calls[0]?.meta).toEqual({ clientId: id, at: '2026-07-03T01:42:00.000Z' });
    expect((await w.today('driver03')).attendance.pending).toBeUndefined();
  });
  it('온라인이면 직접 전송(큐 0) · 업무 거부는 화면으로 그대로 throw', async () => {
    const { api, calls } = fakeApi();
    const ob = boot('t2');
    const w = withOutbox(api, ob);
    await w.checkout('driver03');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.meta?.clientId).toBeTruthy();
    expect(ob.state().queued).toBe(0);
    await expect(w.checkin('driver03', { lat: 99, lng: 0 })).rejects.toThrow('현장 반경 밖');
    expect(ob.state().queued).toBe(0);
  });
  it('서류 제출 오버레이 — docs/doc가 submitted·pending으로 보이고 전송 뒤 원래 상태로', async () => {
    const { api, calls } = fakeApi();
    const ob = boot('t3', 'off');
    const w = withOutbox(api, ob);
    const d = await w.submitDoc('DOC-001', { name: 'cert.jpg', type: 'image/jpeg', size: 1 }, 'driver03');
    expect(d.pending).toBe(true);
    expect((await w.docs({ role: 'driver' })).find((x) => x.id === 'DOC-001')?.state).toBe('submitted');
    expect((await w.doc('DOC-001'))?.pending).toBe(true);
    ob.setNet('on');
    await ob.sync();
    expect(calls.at(-1)?.kind).toBe('doc');
    expect((await w.doc('DOC-001'))?.pending).toBeUndefined();
  });
});

describe('[NFR-016] 아웃박스 — FIFO · 백오프 · 거부 · 보존 · 충돌', () => {
  it('같은 사용자 FIFO(체크인 → 점검) · 앱 재시작(같은 IndexedDB) 후 보존', async () => {
    const { api, calls } = fakeApi();
    const ob = boot('t4', 'off');
    const w = withOutbox(api, ob);
    await w.checkin('driver03', { lat: 37.5, lng: 127 });
    await w.submitInspection('driver03', []);
    const again = boot('t4');
    await again.load();
    expect(again.state().queued).toBe(2);
    again.attach(api);
    await again.sync();
    expect(calls.map((c) => c.kind)).toEqual(['checkin', 'inspection']);
    expect(again.state().queued).toBe(0);
  });
  it('전송 계층 오류(net=fail)는 같은 clientId로 재시도, 5회 소진이면 failed → retry()로 전송', async () => {
    const { api, calls } = fakeApi();
    const ob = boot('t5', 'fail');
    const w = withOutbox(api, ob);
    await w.checkin('driver03', { lat: 37.5, lng: 127 });
    expect(ob.state().items[0]?.tries).toBe(1);
    const id = ob.state().items[0]?.id;
    for (let i = 0; i < 4; i++) await ob.sync();
    expect(ob.state()).toMatchObject({ queued: 0, failed: 1 });
    expect(ob.state().items[0]).toMatchObject({ id, tries: 5, state: 'failed' });
    await ob.sync(); // failed는 자동 재전송 대상이 아니다
    expect(calls).toHaveLength(0);
    ob.setNet('on');
    await ob.retry();
    expect(calls[0]?.meta?.clientId).toBe(id);
    expect(ob.state().failed).toBe(0);
  });
  it('업무 거부(반경 밖)는 항목 단위로 알리고 제거, 뒤 항목은 계속 전송된다', async () => {
    const { api, calls } = fakeApi();
    const ob = boot('t6', 'off');
    const events: string[] = [];
    ob.subscribe((_, e, detail) => events.push(detail ? `${e}:${detail}` : e));
    const w = withOutbox(api, ob);
    await w.checkin('driver03', { lat: 99, lng: 0 });
    await w.submitInspection('driver03', []);
    ob.setNet('on');
    await ob.sync();
    expect(events).toContain('rejected:현장 반경 밖 — 5000m');
    expect(calls.map((c) => c.kind)).toEqual(['checkin', 'inspection']);
    expect(ob.state().items).toHaveLength(0);
  });
  it('충돌 규칙: 대기 체크인은 교체(1건) · 서류는 같은 서류만 교체(다른 서류는 누적)', async () => {
    const { api } = fakeApi();
    const ob = boot('t7', 'off', memoryStore());
    const w = withOutbox(api, ob);
    await w.checkin('driver03', { lat: 1, lng: 1 });
    await w.checkin('driver03', { lat: 2, lng: 2 });
    await w.submitDoc('DOC-001', { name: 'a', type: 't', size: 1 }, 'driver03');
    await w.submitDoc('DOC-001', { name: 'b', type: 't', size: 1 }, 'driver03');
    await w.submitDoc('DOC-002', { name: 'c', type: 't', size: 1 }, 'driver03');
    const items = ob.state().items;
    expect(items.filter((x) => x.kind === 'checkin')).toHaveLength(1);
    expect(items.filter((x) => x.kind === 'doc').map((x) => (x.args[1] as { name: string }).name)).toEqual(['b', 'c']);
  });
});
