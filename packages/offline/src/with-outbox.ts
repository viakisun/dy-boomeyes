// withOutbox(api) — ApiClient 데코레이터(ADR-010): 쓰기 4종은 오프라인이면 적재 + 낙관 결과, 전송 계층 오류면 적재 + 백오프. 읽기(today · docs · doc)에 대기 항목을 오버레이(pending)
import type { ApiClient, Attendance, Doc, Inspection, InspectionItem, Today, WriteMeta } from '@boomeyes/domain';
import { newId, TransportError, type Outbox } from './outbox';
import type { OutboxItem, OutboxKind } from './store';

const overlayToday = (t: Today, pend: OutboxItem[]): Today => {
  let attendance: Attendance = t.attendance;
  let inspection: Inspection = t.inspection;
  for (const it of pend) {
    if (it.kind === 'checkin') attendance = { ...attendance, checkinAt: it.at, checkoutAt: null, pending: true };
    else if (it.kind === 'checkout') attendance = { ...attendance, checkoutAt: it.at, pending: true };
    else if (it.kind === 'inspection')
      inspection = { ...inspection, items: it.args[1] as InspectionItem[], submittedAt: it.at, pending: true };
  }
  return { ...t, attendance, inspection };
};
const overlayDoc = (d: Doc, outbox: Outbox): Doc => {
  const it = outbox
    .state()
    .items.filter((x) => x.kind === 'doc' && x.args[0] === d.id)
    .at(-1);
  return it ? { ...d, state: 'submitted', submittedAt: it.at, file: it.args[1] as Doc['file'], pending: true } : d;
};

export function withOutbox(api: ApiClient, outbox: Outbox): ApiClient {
  outbox.attach(api);
  async function write<T>(
    kind: OutboxKind,
    userId: string,
    args: unknown[],
    direct: (meta: WriteMeta) => Promise<T>,
    optimistic: (item: OutboxItem) => Promise<T> | T,
  ): Promise<T> {
    if (outbox.isOffline()) return optimistic(await outbox.enqueue(kind, userId, args));
    const meta: WriteMeta = { clientId: newId(), at: outbox.clock.iso() };
    try {
      return await outbox.transport(() => direct(meta));
    } catch (e) {
      if (!(e instanceof TransportError)) throw e; // 업무 거부는 화면이 그대로 받는다(다이얼로그·토스트)
      // 전송 계층 오류 — 같은 clientId로 큐에 넣고 백오프(서버가 이미 받았어도 멱등)
      return optimistic(
        await outbox.enqueue(kind, userId, args, { id: meta.clientId, at: meta.at, tries: 1, error: e.message }),
      );
    }
  }
  const overrides: Partial<ApiClient> = {
    checkin: (userId, pos, meta) =>
      write(
        'checkin',
        userId,
        [userId, pos],
        (m) => api.checkin(userId, pos, meta ?? m),
        (it) => ({ userId, deviceId: '', siteId: '', checkinAt: it.at, checkoutAt: null, ...pos, pending: true }),
      ),
    checkout: (userId, meta) =>
      write(
        'checkout',
        userId,
        [userId],
        (m) => api.checkout(userId, meta ?? m),
        (it) => ({ userId, deviceId: '', siteId: '', checkinAt: null, checkoutAt: it.at, pending: true }),
      ),
    submitInspection: (userId, items, meta) =>
      write(
        'inspection',
        userId,
        [userId, items],
        (m) => api.submitInspection(userId, items, meta ?? m),
        (it) => ({ id: '', userId, deviceId: '', date: it.at.slice(0, 10), items, submittedAt: it.at, pending: true }),
      ),
    submitDoc: (id, file, by, meta) =>
      write(
        'doc',
        by,
        [id, file, by],
        (m) => api.submitDoc(id, file, by, meta ?? m),
        async (it) => {
          const d = await api.doc(id);
          if (!d) throw new Error(`doc ${id}`);
          return { ...d, state: 'submitted', submittedAt: it.at, file, pending: true };
        },
      ),
    today: async (userId) => overlayToday(await api.today(userId), outbox.pendingFor(userId)),
    docs: async (scope) => (await api.docs(scope)).map((d) => overlayDoc(d, outbox)),
    doc: async (id) => {
      const d = await api.doc(id);
      return d && overlayDoc(d, outbox);
    },
  };
  return new Proxy(api, {
    get(target, prop, receiver) {
      if (prop in overrides) return overrides[prop as keyof ApiClient];
      const v = Reflect.get(target, prop, receiver) as unknown;
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(target) : v;
    },
  });
}
