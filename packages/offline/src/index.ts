// @boomeyes/offline — 오프라인 제출 큐(ADR-010). 앱 조립 지점(+layout.ts)에서 withOutbox(api)로 감싼다. 화면은 ApiClient만 본다
export { createOutbox, MAX_TRIES, TransportError, newId } from './outbox';
export type { NetMode, Outbox, OutboxEvent, OutboxListener, OutboxOptions, OutboxState } from './outbox';
export { hasIndexedDB, idbStore, memoryStore } from './store';
export type { OutboxItem, OutboxItemState, OutboxKind, OutboxStore } from './store';
export { withOutbox } from './with-outbox';
