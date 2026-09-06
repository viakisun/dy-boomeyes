// 아웃박스(ADR-010 · FR-037 · NFR-016) — 사용자별 FIFO · 클라이언트 ID 멱등 · 전송 계층 오류는 백오프 5회 후 사용자 재시도 · 업무 거부는 항목 단위 표시 후 제거
import type { ApiClient, Clock, Doc, InspectionItem, WriteMeta } from '@boomeyes/domain';
import type { OutboxItem, OutboxKind, OutboxStore } from './store';

/** 전송 조건 흉내(`?net=`, 앱 레이아웃이 해석) — off 오프라인 · fail 전송 계층 오류 · slow 지연 */
export type NetMode = 'on' | 'off' | 'fail' | 'slow';
export interface OutboxState {
  queued: number;
  failed: number;
  syncing: boolean;
  items: OutboxItem[];
}
export type OutboxEvent = 'load' | 'enqueue' | 'sent' | 'failed' | 'rejected' | 'sync';
export type OutboxListener = (state: OutboxState, event: OutboxEvent, detail?: string) => void;
export interface OutboxOptions {
  store: OutboxStore;
  clock: Clock;
  /** 자동 재전송(online 이벤트 · attach 시) — capture 모드는 false(결정성) */
  auto?: boolean;
  /** 백오프 기본 ms — 재시도 n회째 대기 = backoffMs × 2^n (상한 30초) */
  backoffMs?: number;
  net?: NetMode;
}
export interface Outbox {
  state(): OutboxState;
  subscribe(fn: OutboxListener): () => void;
  load(): Promise<void>;
  /** 전송 대상 ApiClient 연결(조립 지점마다 최신 api로) — auto면 대기 항목을 바로 전송 */
  attach(api: ApiClient): void;
  setNet(mode: NetMode): void;
  net(): NetMode;
  isOffline(): boolean;
  /** 전송 조건을 지나 fn 실행 — 오프라인·fail은 TransportError */
  transport<T>(fn: () => Promise<T>): Promise<T>;
  /** 사용자의 대기 항목(시간순) — 읽기 오버레이용 */
  pendingFor(userId: string): OutboxItem[];
  enqueue(
    kind: OutboxKind,
    userId: string,
    args: unknown[],
    init?: { id?: string; at?: string; tries?: number; error?: string },
  ): Promise<OutboxItem>;
  /** queued 항목 전송(사용자별 FIFO) */
  sync(): Promise<void>;
  /** failed 항목까지 다시 전송(배너 "재시도") */
  retry(): Promise<void>;
  /** 픽스처 시드 — 저장소를 비우고 항목을 넣는다(capture `?state=queued`) */
  seed(items: OutboxItem[]): Promise<void>;
  clock: Clock;
}

export const MAX_TRIES = 5;
export class TransportError extends Error {}
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** 시간순 정렬되는 클라이언트 ID(ULID 대용 — 밀리초 base36 + 같은 밀리초 시퀀스 + 난수). 문자열 비교로 생성 순서가 유지된다 */
let lastMs = 0;
let seq = 0;
export const newId = () => {
  const t = Date.now();
  seq = t === lastMs ? seq + 1 : 0;
  lastMs = t;
  return `${t.toString(36).padStart(9, '0')}${seq.toString(36).padStart(3, '0')}${Math.random().toString(36).slice(2, 6)}`;
};

export function createOutbox(opts: OutboxOptions): Outbox {
  const { store, clock, auto = true, backoffMs = 200 } = opts;
  let net: NetMode = opts.net ?? 'on';
  let api: ApiClient | null = null;
  let items: OutboxItem[] = [];
  let syncing = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<OutboxListener>();
  const state = (): OutboxState => ({
    queued: items.filter((x) => x.state !== 'failed').length,
    failed: items.filter((x) => x.state === 'failed').length,
    syncing,
    items: items.map((x) => ({ ...x })),
  });
  const emit = (e: OutboxEvent, detail?: string) => {
    const s = state();
    for (const fn of listeners) fn(s, e, detail);
  };
  // navigator.onLine === false만 오프라인 — Node(Vitest)의 navigator에는 onLine이 없다
  const isOffline = () => net === 'off' || (typeof navigator !== 'undefined' && navigator.onLine === false);
  async function transport<T>(fn: () => Promise<T>): Promise<T> {
    if (isOffline()) throw new TransportError('오프라인');
    if (net === 'fail') throw new TransportError('네트워크 오류(?net=fail)');
    if (net === 'slow') await delay(1500);
    return fn();
  }
  const send = (item: OutboxItem): Promise<unknown> => {
    if (!api) throw new TransportError('api 미연결');
    const meta: WriteMeta = { clientId: item.id, at: item.at };
    const a = item.args;
    switch (item.kind) {
      case 'checkin':
        return api.checkin(a[0] as string, a[1] as { lat: number; lng: number }, meta);
      case 'checkout':
        return api.checkout(a[0] as string, meta);
      case 'inspection':
        return api.submitInspection(a[0] as string, a[1] as InspectionItem[], meta);
      case 'doc':
        return api.submitDoc(a[0] as string, a[1] as NonNullable<Doc['file']>, a[2] as string, meta);
    }
  };
  async function persist(item: OutboxItem) {
    await store.put(item);
    const i = items.findIndex((x) => x.id === item.id);
    if (i >= 0) items[i] = item;
    else items.push(item);
  }
  async function drop(id: string) {
    await store.remove(id);
    items = items.filter((x) => x.id !== id);
  }
  const backoff = (tries: number) => Math.min(backoffMs * 2 ** tries, 30_000);
  const schedule = (ms: number) => {
    if (!auto) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void run(false);
    }, ms);
  };
  async function run(retryFailed: boolean): Promise<void> {
    if (syncing || !api || isOffline()) return;
    syncing = true;
    emit('sync');
    let wait: number | null = null;
    try {
      const byUser = new Map<string, OutboxItem[]>();
      for (const it of [...items].sort((a, b) => (a.id < b.id ? -1 : 1)))
        if (it.state === 'queued' || (retryFailed && it.state === 'failed'))
          byUser.set(it.userId, [...(byUser.get(it.userId) ?? []), it]);
      for (const list of byUser.values()) {
        for (const it of list) {
          const cur: OutboxItem = { ...it, state: 'sending' };
          await persist(cur);
          try {
            await transport(() => send(cur));
            await drop(cur.id);
            emit('sent');
          } catch (e) {
            if (e instanceof TransportError) {
              // 전송 계층 오류 — 같은 clientId로 백오프 재시도, 5회 소진이면 failed(사용자 재시도). 이 사용자의 뒤 항목은 순서를 지켜 기다린다
              const tries = cur.tries + 1;
              if (tries >= MAX_TRIES) {
                await persist({ ...cur, tries, state: 'failed', error: e.message });
                emit('failed', e.message);
              } else {
                await persist({ ...cur, tries, state: 'queued', error: e.message });
                wait = backoff(tries);
              }
              break;
            }
            // 업무 거부(반경 밖 · 체크인 전 …) — 항목 단위로 알리고 제거, 다음 항목은 계속
            const msg = e instanceof Error ? e.message : String(e);
            await drop(cur.id);
            emit('rejected', msg);
          }
        }
      }
    } finally {
      syncing = false;
      emit('sync');
      if (wait !== null) schedule(wait);
    }
  }
  const outbox: Outbox = {
    clock,
    state,
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    async load() {
      items = (await store.all()).map((x) => (x.state === 'sending' ? { ...x, state: 'queued' } : x)); // 전송 중 종료 → 다시 대기
      emit('load');
    },
    attach(a) {
      api = a;
      if (auto && items.some((x) => x.state === 'queued')) void run(false);
    },
    setNet(m) {
      net = m;
    },
    net: () => net,
    isOffline,
    transport,
    pendingFor: (userId) => items.filter((x) => x.userId === userId).sort((a, b) => (a.id < b.id ? -1 : 1)),
    async enqueue(kind, userId, args, init = {}) {
      // 충돌 규칙: 같은 사용자의 대기 체크인·체크아웃·점검은 최신으로 교체, 서류는 같은 서류만 교체(누적)
      const dup = items.find(
        (x) => x.userId === userId && x.kind === kind && (kind !== 'doc' || x.args[0] === args[0]),
      );
      if (dup) await drop(dup.id);
      const tries = init.tries ?? 0;
      const item: OutboxItem = {
        id: init.id ?? newId(),
        userId,
        kind,
        args,
        at: init.at ?? clock.iso(),
        tries,
        state: tries >= MAX_TRIES ? 'failed' : 'queued',
      };
      if (init.error) item.error = init.error;
      await persist(item);
      emit('enqueue');
      if (item.state === 'queued' && tries > 0) schedule(backoff(tries));
      return item;
    },
    sync: () => run(false),
    retry: () => run(true),
    async seed(list) {
      await store.clear();
      items = [];
      for (const it of list) await persist(it);
      emit('load');
    },
  };
  if (auto && typeof window !== 'undefined') window.addEventListener('online', () => void run(false));
  return outbox;
}
