// ApiClient 인터페이스 — 구현: @boomeyes/mock(인메모리) · @boomeyes/api-client(http, W3). 화면은 이 인터페이스만 의존 (ADR-002).
import type { Alert, Camera, Case, Device, Doc, Escalation, Kpis, Lease, Request, Scope, Site, User } from './types';

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
  /** 정비 담당 호출 — 이력 + 정비(maintenance) 통보 (A1-03) */
  callMaintenance(id: string, by: string): Promise<Case>;
  /** FR-017 수신함 — 신청·요청 */
  requests(scope: Scope): Promise<Request[]>;
  request(id: string): Promise<Request | undefined>;
  approveRequest(id: string, by: string, note?: string): Promise<Request>;
  rejectRequest(id: string, by: string, note: string): Promise<Request>;
  /** FR-010 — 임계(1h) 경과한 new 업무를 escalated로 전이하고 통보 목록을 돌려준다 */
  escalations(): Promise<Escalation[]>;
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
/** 영상 소스 — 라이브 대체(루프 MP4) · 스냅샷 · 저장 영상 메타. mock 구현은 W1 video-basics, 실 스트림은 W3 (ADR-002) */
export interface MediaSource {
  live(cameraId: string): Promise<{ kind: 'mp4' | 'hls'; url: string } | null>;
  snapshot(cameraId: string): Promise<{ url: string; at: string } | null>;
  recordings(
    cameraId: string,
    source: 'server' | 'sd' | 'nvr',
  ): Promise<{ id: string; at: string; durationSec: number; source: 'server' | 'sd' | 'nvr' }[]>;
}
export type RealtimeEvent =
  | { type: 'alert.raised'; alert: Alert }
  | { type: 'device.updated'; device: Device }
  | { type: 'case.created'; case: Case }
  | { type: 'case.escalated'; case: Case }
  | { type: 'camera.updated'; camera: Camera };
