// ApiClient 인터페이스 — 구현: @boomeyes/mock(인메모리) · @boomeyes/api-client(http, W3). 화면은 이 인터페이스만 의존 (ADR-002).
import type { Alert, Camera, Case, Device, Doc, Kpis, Lease, Scope, Site, User } from './types';

export interface ApiClient {
  users(): Promise<User[]>;
  sites(scope: Scope): Promise<Site[]>;
  devices(scope: Scope): Promise<Device[]>;
  device(id: string): Promise<Device | undefined>;
  cameras(deviceId?: string): Promise<Camera[]>;
  alerts(scope: Scope): Promise<Alert[]>;
  ackAlert(id: string): Promise<Alert>;
  cases(scope: Scope): Promise<Case[]>;
  case(id: string): Promise<Case | undefined>;
  acceptCase(id: string, by: string): Promise<Case>;
  completeCase(id: string, by: string, note: string): Promise<Case>;
  docs(scope: Scope): Promise<Doc[]>;
  leases(scope: Scope): Promise<Lease[]>;
  kpis(scope: Scope): Promise<Kpis>;
}

/** 시각 원천 — 화면은 new Date() 대신 이것을 쓴다 (capture 모드에서 고정, 데모에서 점프) */
export interface Clock {
  now(): Date;
  iso(): string;
}

/** 실시간 스트림 — WS/SSE(W3) 또는 mock 리플레이 */
export interface RealtimeClient {
  subscribe(handler: (event: RealtimeEvent) => void): () => void;
}
export type RealtimeEvent =
  | { type: 'alert.raised'; alert: Alert }
  | { type: 'device.updated'; device: Device }
  | { type: 'case.created'; case: Case }
  | { type: 'case.escalated'; case: Case }
  | { type: 'camera.updated'; camera: Camera };
