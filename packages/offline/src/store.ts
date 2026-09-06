// 아웃박스 저장소(ADR-010) — IndexedDB(앱 재시작·오프라인 새로고침에도 보존, NFR-016) · 메모리(IndexedDB 없는 환경 폴백)
export type OutboxKind = 'checkin' | 'checkout' | 'inspection' | 'doc';
export type OutboxItemState = 'queued' | 'sending' | 'failed';
export interface OutboxItem {
  /** 시간순 정렬되는 클라이언트 ID = 멱등 키(IF-009 Idempotency-Key) */
  id: string;
  userId: string;
  kind: OutboxKind;
  /** ApiClient 메서드 인자(meta 제외) — structuredClone 가능한 값만 */
  args: unknown[];
  /** 단말 발생 시각(DISC-045 기준안: 기록 시각 = 단말 탭 시각) */
  at: string;
  tries: number;
  /** queued 재전송 대기 · sending 전송 중 · failed 백오프 5회 소진(사용자 재시도) */
  state: OutboxItemState;
  error?: string;
}
export interface OutboxStore {
  all(): Promise<OutboxItem[]>;
  put(item: OutboxItem): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export function memoryStore(): OutboxStore {
  const m = new Map<string, OutboxItem>();
  return {
    async all() {
      return [...m.values()].map((x) => structuredClone(x));
    },
    async put(item) {
      m.set(item.id, structuredClone(item));
    },
    async remove(id) {
      m.delete(id);
    },
    async clear() {
      m.clear();
    },
  };
}

const STORE = 'items';
export const hasIndexedDB = () => typeof indexedDB !== 'undefined';

/** IndexedDB 저장소 — DB 하나(name) · 객체 저장소 'items'(keyPath id) */
export function idbStore(name = 'boomeyes-outbox'): OutboxStore {
  let dbp: Promise<IDBDatabase> | null = null;
  const open = () =>
    (dbp ??= new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  const tx = async <T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>) => {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
      const r = run(db.transaction(STORE, mode).objectStore(STORE));
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  };
  return {
    all: () => tx<OutboxItem[]>('readonly', (s) => s.getAll()),
    async put(item) {
      await tx<IDBValidKey>('readwrite', (s) => s.put(item));
    },
    async remove(id) {
      await tx<undefined>('readwrite', (s) => s.delete(id));
    },
    async clear() {
      await tx<undefined>('readwrite', (s) => s.clear());
    },
  };
}
