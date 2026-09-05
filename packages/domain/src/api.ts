// ApiClient 인터페이스 — 구현: @boomeyes/mock(인메모리) · @boomeyes/api-client(http, W3). 화면은 이 인터페이스만 의존 (ADR-002).
import type { RoleId } from './generated/ids';
import type { Issue, ParseResult } from './protocol';
import type {
  Alert,
  AlertRule,
  Attendance,
  ErrorCode,
  ProtocolVersion,
  RuleSet,
  SampleTest,
  Camera,
  Case,
  Device,
  Doc,
  DocKind,
  DocSummary,
  Escalation,
  Inspection,
  InspectionItem,
  Kpis,
  Lease,
  Request,
  Scope,
  Site,
  Today,
  User,
  VideoProfile,
} from './types';

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
  /** 본사 확인 요청(DISC-015 권한 경계) — 이력 + 현장 알림, 상태 전이 없음 */
  requestConfirm(id: string, by: string, note?: string): Promise<Case>;
  /** FR-017 수신함 — 신청·요청 */
  requests(scope: Scope): Promise<Request[]>;
  request(id: string): Promise<Request | undefined>;
  approveRequest(id: string, by: string, note?: string): Promise<Request>;
  rejectRequest(id: string, by: string, note: string): Promise<Request>;
  /** FR-010 — 임계(1h) 경과한 new 업무를 escalated로 전이하고 통보 목록을 돌려준다 */
  escalations(): Promise<Escalation[]>;
  /** driver-daily — 오늘(배정 장비 · 출근 · 점검 · 알림 · 동의) */
  today(userId: string): Promise<Today>;
  /** FR-013 — 현장 반경 밖이면 Error(거리 포함) */
  checkin(userId: string, pos: { lat: number; lng: number }): Promise<Attendance>;
  checkout(userId: string): Promise<Attendance>;
  /** FR-014 — 5항목 제출 */
  submitInspection(userId: string, items: InspectionItem[]): Promise<Inspection>;
  /** FR-020 프로토콜 — 목록 · 업로드(객체로 파싱된 정의; YAML 파싱은 앱) · 샘플 테스트 */
  protocols(): Promise<ProtocolVersion[]>;
  uploadProtocol(
    def: unknown,
    meta: { filename: string; by: string },
  ): Promise<{ ok: boolean; errors: Issue[]; version?: ProtocolVersion }>;
  samples(): Promise<SampleTest[]>;
  testSample(versionId: string, sample: unknown): Promise<ParseResult>;
  /** FR-011 알림 기준 · 고장코드 · 시나리오 등급 (B4-05) */
  rules(): Promise<RuleSet>;
  saveRules(patch: { alerts?: AlertRule[]; errorCodes?: ErrorCode[] }, by: string): Promise<RuleSet>;
  docs(scope: Scope): Promise<Doc[]>;
  doc(id: string): Promise<Doc | undefined>;
  /** 촬영 제출(IF-011) — expiring|rejected → submitted → review(자동) + 서류 검토 업무 생성 */
  submitDoc(id: string, file: { name: string; type: string; size: number; url?: string }, by: string): Promise<Doc>;
  /** 현장 검토 — review → approved|rejected(사유 필수) · 연결 업무 done */
  reviewDoc(id: string, decision: 'approved' | 'rejected', by: string, note?: string): Promise<Doc>;
  /** 관리자 등록(B4-06) — 만료 D-30 이내면 expiring */
  registerDoc(
    input: { kind: DocKind; subject: string; subjectId: string; expiresAt: string | null },
    by: string,
  ): Promise<Doc>;
  /** 완비율(%)·만료 임박 — 대상(장비·운전자)별 */
  docCompleteness(scope: Scope): Promise<DocSummary[]>;
  leases(scope: Scope): Promise<Lease[]>;
  lease(id: string): Promise<Lease | undefined>;
  /** FR-019 재배치 계획(B1-06) — lease 상태기계 expiring → relocated · 대상 현장·메모·이력 */
  planRelocation(leaseId: string, toSiteId: string, note: string, by: string): Promise<Lease>;
  kpis(scope: Scope): Promise<Kpis>;
  /** FR-018 현장·호기 마스터(B4-03) — 현장 등록·편집(현장명·주소·기간·담당 안전관리자) · 호기(1~120) 등록(중복 오류)·배정 */
  createSite(input: {
    name: string;
    address: string;
    company: string;
    safetyUserId: string;
    period?: { from: string; to: string };
    videoProfile?: VideoProfile;
    lat?: number;
    lng?: number;
  }): Promise<Site>;
  updateSite(
    id: string,
    patch: Partial<Pick<Site, 'name' | 'address' | 'company' | 'safetyUserId' | 'period'>>,
  ): Promise<Site>;
  registerDevice(input: { unitNo: number; siteId: string; ownerId?: string }): Promise<Device>;
  assignDevice(deviceId: string, siteId: string): Promise<Device>;
  /** FR-029(W2 = 프리셋 전환만) — 현장 프로파일 프리셋(P-LITE/P-SD/P-NVR) → 카메라 월·타일 채널 수가 즉시 따른다 */
  setSiteProfile(siteId: string, preset: VideoProfile): Promise<Site>;
  /** FR-021 사용자·권한(B4-04) — 역할(운영사는 site-safety 부여 불가, entities.rules) · 현장 범위 · 계정 상태 */
  setUserRole(userId: string, role: RoleId): Promise<User>;
  setUserSites(userId: string, siteIds: string[]): Promise<User>;
  setUserStatus(userId: string, status: 'active' | 'suspended'): Promise<User>;
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
