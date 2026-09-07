// 엔티티 타입 — 원천 ssot/entities.yaml (ENT-01~18). 목업 단계에 필요한 필드만.
import type { ProtocolDef } from './protocol';
import type { RoleId } from './generated/ids';

export type EquipmentState = 'normal' | 'caution' | 'fault' | 'offline' | 'maintenance';
export type CameraState = 'live' | 'snapshot' | 'recording' | 'offline' | 'ai-unavailable';
export type TaskState = 'new' | 'assigned' | 'in-progress' | 'done' | 'escalated';
export type DocState = 'valid' | 'expiring' | 'submitted' | 'review' | 'approved' | 'rejected';
export type Severity = 'critical' | 'warning' | 'info';
export type VideoProfile = 'P-LITE' | 'P-SD' | 'P-NVR';

export interface Site {
  id: string;
  name: string;
  address: string;
  company: string;
  lat: number;
  lng: number;
  videoProfile: VideoProfile;
  safetyUserId: string;
  /** 현장 기간(B4-03 등록·편집) */
  period?: { from: string; to: string };
} // ENT-01
export interface Owner {
  id: string;
  name: string;
  contact: string;
} // ENT-13
export interface Device {
  // ENT-02 (+ENT-12 최신 상태)
  id: string;
  unitNo: number;
  siteId: string;
  ownerId: string;
  state: EquipmentState;
  lat: number;
  lng: number;
  telemetry: {
    at: string;
    voltage: number;
    voltageStatus: 'normal' | 'abnormal';
    harness: 'ok' | 'disconnected';
    lte: 'connected' | 'weak' | 'lost';
    gpsFix: boolean;
    errorCode: string | null;
    pipeRatio: number;
    filterRatio: number;
    boomAngle: number;
  };
}
/** 서류 완비율 — 대상(장비·운전자) 단위 (FR-016) */
export interface DocSummary {
  subjectId: string;
  subject: string;
  kind: 'site' | 'device' | 'driver' | 'person';
  siteId: string;
  total: number;
  complete: number;
  rate: number;
  expiring: number;
}
/** FR-034 카메라 헬스 — 정지화면·흐림·가림·수신 끊김이면 "정상" 표시 금지 */
export type CameraHealth = 'ok' | 'frozen' | 'blurry' | 'occluded' | 'lost';
/** 장착 위치(ENT-04) — 본체·1번 관절 인근 / 마지막 강체·경사 시야 (참고자료 v5.0 §8) */
export type CameraMount = 'body-joint1' | 'last-rigid';
export interface Camera {
  id: string;
  deviceId: string;
  kind: 'general' | 'ai';
  state: CameraState;
  health?: CameraHealth;
  /** 복구 후 누락분 재전송 표시 (IF-018) */
  backfill?: { segments: number; since: string };
  ingest: 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
  live: 'L1' | 'L2' | 'L3';
  recording: 'server' | 'sd' | 'nvr' | 'edge';
  retentionDays: number;
  snapshotAt: string;
  mount?: CameraMount;
} // ENT-04
export interface Alert {
  id: string;
  deviceId: string;
  kind: 'comm' | 'gps' | 'voltage' | 'harness' | 'error' | 'doc' | 'pipe' | 'filter' | 'ai-person' | 'camera-health';
  severity: Severity;
  message: string;
  at: string;
  acked: boolean;
  caseId: string | null;
  /** AI 카메라 이벤트(IF-015) — 카메라 · 정규화 bbox(0~1) */
  cameraId?: string;
  bbox?: { x: number; y: number; w: number; h: number };
  /** 이벤트 복기 축(ENT-19) — 있으면 B1-02 피드에 "복기" 링크 */
  eventId?: string;
} // ENT-08
export interface Case {
  id: string;
  kind: 'fault' | 'doc' | 'inspection' | 'comm';
  title: string;
  deviceId: string | null;
  siteId: string;
  state: TaskState;
  severity: Severity;
  assigneeId: string | null;
  dueAt: string;
  createdAt: string;
  history: HistoryItem[];
  /** kind=doc 업무가 검토하는 서류 */
  docId?: string;
  /** 연결 이벤트(ENT-19 · 0..1) — 이벤트 복기 B1-08 · 영상 확보 상태 표시 */
  eventId?: string;
} // ENT-06
export interface HistoryItem {
  at: string;
  by: string;
  action: string;
  note?: string;
} // ENT-09
export type DocKind = 'cert' | 'ndt' | 'license' | 'training' | 'contract';
export interface Doc {
  id: string;
  kind: DocKind;
  subject: string;
  subjectId: string;
  /** 대상이 속한 현장(장비 → 현장, 사용자 → 첫 현장, 현장 자신) — 완비율의 현장 차원 */
  siteId: string;
  state: DocState;
  expiresAt: string | null;
  submittedAt: string | null;
  /** 제출·검토 이력(ENT-09, append-only) */
  history: HistoryItem[];
  /** 제출 파일 메타(mock: objectURL) */
  file?: { name: string; type: string; size: number; url?: string };
  /** 아웃박스 대기(ADR-010 읽기 오버레이) — 제출이 아직 서버에 닿지 않음 */
  pending?: boolean;
} // ENT-07
export type LeaseState = 'active' | 'expiring' | 'relocated' | 'ended';
export interface Lease {
  id: string;
  deviceId: string;
  siteId: string;
  ownerId: string;
  from: string;
  to: string;
  /** 상태기계 lease(ENT-10): active → expiring(D-30) → relocated | ended */
  state: LeaseState;
  /** 재배치 계획 대상 현장(B1-06) */
  toSiteId?: string;
  note?: string;
  history: HistoryItem[];
} // ENT-10
export interface User {
  id: string;
  role: RoleId;
  display: string;
  org: string;
  siteIds: string[];
  /** 운전자 배정 장비 (driver-daily) */
  deviceId?: string;
  phone?: string;
  /** 계정 상태(B4-04) — 없으면 active */
  status?: 'active' | 'suspended';
} // ENT-05
/** FR-012 기록(ENT-09 병합) — 업무·점검·출근·서류(현장) + 규칙·임대(전국) 이력을 한 타임라인으로, append-only(NFR-012) */
export type RecordKind = 'task' | 'inspection' | 'attendance' | 'doc' | 'rule' | 'lease';
export interface RecordItem {
  at: string;
  kind: RecordKind;
  actor: string;
  subjectId: string;
  siteId: string;
  text: string;
  note?: string;
}
/** FR-023 보고 모드(B2-04) — 현장별 기간 요약(mock 계산, 열람 전용) */
export interface SiteReport {
  siteId: string;
  site: string;
  days: number;
  devices: number;
  abnormal: number;
  casesTotal: number;
  casesDone: number;
  /** 업무 처리율 % (기간 내 발행 업무 중 done) */
  caseRate: number;
  inspections: number;
  /** 점검 제출률 % (기간 내 점검이 1건 이상 제출된 호기 비율) */
  inspectionRate: number;
  docRate: number;
  docTotal: number;
  escalated: number;
  alerts: number;
}
export interface Kpis {
  total: number;
  normal: number;
  caution: number;
  fault: number;
  offline: number;
  maintenance: number;
  openCases: number;
  escalated: number;
}

/** FR-017 신청·요청(현장 개설 · 장비 배정 · 서류, ENT-20) — 운영사 수신함(B1-03)에서 승인/반려. 상태기계 request(submitted → review → approved|rejected → submitted) */
export type RequestState = 'submitted' | 'review' | 'approved' | 'rejected';
export interface Request {
  id: string;
  kind: 'site-open' | 'device-assign' | 'doc';
  title: string;
  requesterId: string;
  siteId: string;
  state: RequestState;
  requestedAt: string;
  note?: string;
  history: HistoryItem[];
}
/** FR-010 에스컬레이션 — 미접수 임계 경과 업무 + 통보 (entities.rules: 건설사 본사 + 관제) */
export interface Escalation {
  case: Case;
  elapsedMs: number;
  notifyTo: RoleId[];
  notifiedAt: string;
}

/** 쓰기 요청 메타(FR-037 · IF-009) — 클라이언트 멱등 키(ULID 대용) · 단말 발생 시각(DISC-045). 같은 clientId 재전송은 같은 결과 */
export interface WriteMeta {
  clientId: string;
  at: string;
}
/** FR-013 출근 체크인·퇴근 체크아웃 — 현장 반경 판정은 rules.ts CHECKIN_RADIUS_M */
export interface Attendance {
  userId: string;
  deviceId: string;
  siteId: string;
  checkinAt: string | null;
  checkoutAt: string | null;
  lat?: number;
  lng?: number;
  /** 아웃박스 대기(ADR-010 읽기 오버레이) — 서버 미반영 */
  pending?: boolean;
}
/** FR-014 작업 전 일일점검 — 항목은 rules.ts INSPECTION_ITEMS(DISC-033 확정 전 임시) */
export interface InspectionItem {
  id: string;
  label: string;
  ok: boolean;
  note?: string;
}
export interface Inspection {
  id: string;
  userId: string;
  deviceId: string;
  date: string;
  items: InspectionItem[];
  submittedAt: string | null;
  /** 아웃박스 대기(ADR-010 읽기 오버레이) */
  pending?: boolean;
}
/** ENT-15 개인정보 동의 — FR-031 표준 패키지(영상 · 음성 · 위치) */
export interface Consent {
  userId: string;
  items: { kind: 'video' | 'audio' | 'location'; agreed: boolean; at: string }[];
}
/** A2-02 오늘 화면 묶음 */
export interface Today {
  user: User;
  device: Device | undefined;
  site: Site | undefined;
  attendance: Attendance;
  inspection: Inspection;
  alerts: Alert[];
  consent: Consent;
  /** 촬영 중 표시 — 배정 장비 카메라가 살아 있으면 true (FR-031 촬영 표시) */
  filming: boolean;
  /** 정비 담당(대응 안내 연락처) */
  maintenance: User | undefined;
}

/** ENT-11 프로토콜 버전 — 정의(코드 스키마) · 운영/테스트 구분 (FR-020) */
export interface ProtocolVersion {
  id: string;
  version: string;
  kind: 'production' | 'test';
  def: ProtocolDef;
  uploadedAt: string;
  uploadedBy: string;
  lastReceivedAt: string | null;
  note?: string;
}
/** B4-02 샘플 테스트용 JSON 3종(정상 · 필드 누락 · 타입 오류) */
export interface SampleTest {
  id: string;
  label: string;
  json: string;
}
/** FR-011 알림 8종 기준 — 등급 · 수신 역할 · 임계 (B4-05) */
export interface AlertRule {
  kind: Alert['kind'];
  label: string;
  severity: Severity;
  roles: RoleId[];
  threshold?: { caution: number; danger: number; unit: string };
  enabled: boolean;
}
/** 고장코드 표 — DISC-012 확정 전 시드 (B4-05) */
export interface ErrorCode {
  code: string;
  name: string;
  severity: Severity;
  guide: string;
}
/** FR-036 시나리오별 알림 등급(2단계) — 전도·무동작은 현장 검증 후(DISC-042) */
export interface ScenarioRule {
  id: string;
  title: string;
  severity: Severity | 'none';
  locked: boolean;
  note: string;
}
export interface RuleSet {
  alerts: AlertRule[];
  errorCodes: ErrorCode[];
  scenarios: ScenarioRule[];
  updatedAt: string;
  updatedBy: string;
  history: HistoryItem[];
}

/** ENT-16 마모·교체 부품 — 상태기계 part(registered → installed → inspected → due → replaced → discarded). W2 = 구조(DISC-044) · 임계·주기 OEM 미확정(DISC-038) */
export type PartState = 'registered' | 'installed' | 'inspected' | 'due' | 'replaced' | 'discarded';
export type PartGroup = 'pipe' | 'elbow' | 'flange' | 'gasket' | 'endhose';
export interface Part {
  id: string;
  partNo: string;
  group: PartGroup;
  deviceId: string;
  position: string;
  installedAt: string;
  lot: string;
  /** 기준두께 · 최근 실측(mm) — 합불 판정은 입력자(OEM 기준 미확정) */
  baseThicknessMm: number;
  lastThicknessMm: number | null;
  /** 보조지표(단독 폐기 기준 아님, FR-032 note) */
  pouredM3: number;
  runHours: number;
  state: PartState;
}
/** ENT-17 부품 이력(append-only) — 점검 실측·외관·체결·합불 · 교체/폐기 사유·작업자·증빙 */
export interface PartEvent {
  id: string;
  partId: string;
  kind: 'register' | 'install' | 'inspect' | 'replace' | 'discard';
  at: string;
  by: string;
  thicknessMm?: number;
  visual?: 'ok' | 'wear' | 'crack';
  fastening?: 'ok' | 'loose';
  pass?: boolean;
  reason?: string;
  worker?: string;
  photo?: { name: string; url?: string };
  note?: string;
}
/** ENT-18 재고·발주 — 발주·안전재고 편집은 2단계 */
export interface Stock {
  id: string;
  partNo: string;
  group: PartGroup;
  onHand: number;
  safety: number;
}
/** ENT-19 이벤트(복기 축) — W2 스텁 EV-001. 이름은 DOM `Event`와 충돌을 피해 ReplayEvent. 채번·공통 시각 원천은 DISC-039, 실 세그먼트 조회는 API-018(2단계) */
export type ReplaySource = 'general' | 'ai' | 'bodycam' | 'cpb';
export interface ReplayLane {
  source: ReplaySource;
  /** 소스 없음(바디캠 미연동 등) — 화면은 "없음" */
  available: boolean;
  cameraId?: string;
  note?: string;
  /** 공통 시각축 위의 세그먼트(메타만, 실영상 seek 없음) */
  segments: { from: string; to: string; label: string }[];
  /** 공통 시각축 위의 마커(상태 변화 · 알림 · 부품 이력) */
  markers: { at: string; label: string }[];
}
/** 영상 확보 상태(ENT-19) — 사건(업무) 상태와 별개: 업로드 대기 · 일부 확보 · 확보 · 확보 불가 (참고자료 v5.0 §15) */
export type EvidenceState = 'pending' | 'partial' | 'secured' | 'unavailable';
export interface ReplayEvent {
  id: string;
  kind: Alert['kind'];
  deviceId: string;
  /** t0 = 알림 시각 */
  at: string;
  /** 복기 창 ±초 */
  windowSec: number;
  alertId: string;
  caseId: string | null;
  lanes: Record<ReplaySource, ReplayLane>;
  /** 긴급 이벤트 원본 보존 잠금(NFR-015) — 삭제·편집 없음 */
  locked: boolean;
  evidence: EvidenceState;
}
/** FR-023 쇼케이스(B1-07) — 읽기 전용 집계 · 이름·연락처는 마스킹된 채로 온다(mask.ts) */
export interface Showcase {
  /** 스코프 안 현장의 무사고 일수 최솟값 — 사고 기록이 없어 현장 개설일(period.from) 기준 */
  daysWithoutAccident: number;
  /** 오늘(24시간) 점검이 제출된 호기 비율 % */
  inspectionRate: number;
  /** 서류 완비율 %(valid·approved / 전체) */
  docRate: number;
  alerts24h: number;
  devices: number;
  normal: number;
  sites: {
    id: string;
    name: string;
    company: string;
    daysWithoutAccident: number;
    devices: number;
    abnormal: number;
    /** 마스킹된 현장 안전관리자 · 임대인 연락처 */
    safety: string;
    contact: string;
  }[];
}
export interface Scope {
  role: RoleId;
  siteIds?: string[];
  ownerId?: string;
}
