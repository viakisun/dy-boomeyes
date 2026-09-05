// 엔티티 타입 — 원천 ssot/entities.yaml (ENT-01~18). 목업 단계에 필요한 필드만.
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
export interface Camera {
  id: string;
  deviceId: string;
  kind: 'general' | 'ai';
  state: CameraState;
  ingest: 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
  live: 'L1' | 'L2' | 'L3';
  recording: 'server' | 'sd' | 'nvr' | 'edge';
  retentionDays: number;
  snapshotAt: string;
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
} // ENT-06
export interface HistoryItem {
  at: string;
  by: string;
  action: string;
  note?: string;
} // ENT-09
export interface Doc {
  id: string;
  kind: 'cert' | 'ndt' | 'license' | 'training' | 'contract';
  subject: string;
  subjectId: string;
  state: DocState;
  expiresAt: string | null;
  submittedAt: string | null;
} // ENT-07
export interface Lease {
  id: string;
  deviceId: string;
  siteId: string;
  ownerId: string;
  from: string;
  to: string;
} // ENT-10
export interface User {
  id: string;
  role: RoleId;
  display: string;
  org: string;
  siteIds: string[];
  /** 운전자 배정 장비 (driver-daily) */
  deviceId?: string;
} // ENT-05
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

/** FR-017 신청·요청(현장 개설 · 장비 배정 · 서류) — 운영사 수신함(B1-03)에서 승인/반려. 상태는 doc 상태기계의 부분집합. ENT 등재는 ssot 후속 */
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

/** FR-013 출근 체크인·퇴근 체크아웃 — 현장 반경 판정은 rules.ts CHECKIN_RADIUS_M */
export interface Attendance {
  userId: string;
  deviceId: string;
  siteId: string;
  checkinAt: string | null;
  checkoutAt: string | null;
  lat?: number;
  lng?: number;
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
}

export interface Scope {
  role: RoleId;
  siteIds?: string[];
  ownerId?: string;
}
