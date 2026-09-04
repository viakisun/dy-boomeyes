// 엔티티 타입 — 원천 ssot/entities.yaml (ENT-01~18). 목업 단계에 필요한 필드만.
import type { RoleId } from './generated/ids';

export type EquipmentState = 'normal' | 'caution' | 'fault' | 'offline' | 'maintenance';
export type CameraState = 'live' | 'snapshot' | 'recording' | 'offline' | 'ai-unavailable';
export type TaskState = 'new' | 'assigned' | 'in-progress' | 'done' | 'escalated';
export type DocState = 'valid' | 'expiring' | 'submitted' | 'review' | 'approved' | 'rejected';
export type Severity = 'critical' | 'warning' | 'info';
export type VideoProfile = 'P-LITE' | 'P-SD' | 'P-NVR';

export interface Site { id: string; name: string; address: string; company: string; lat: number; lng: number; videoProfile: VideoProfile; safetyUserId: string } // ENT-01
export interface Owner { id: string; name: string; contact: string } // ENT-13
export interface Device { // ENT-02 (+ENT-12 최신 상태)
  id: string; unitNo: number; siteId: string; ownerId: string; state: EquipmentState; lat: number; lng: number;
  telemetry: { at: string; voltage: number; voltageStatus: 'normal' | 'abnormal'; harness: 'ok' | 'disconnected'; lte: 'connected' | 'weak' | 'lost'; gpsFix: boolean; errorCode: string | null; pipeRatio: number; filterRatio: number; boomAngle: number };
}
export interface Camera { id: string; deviceId: string; kind: 'general' | 'ai'; state: CameraState; ingest: 'E1' | 'E2' | 'E3' | 'E4' | 'E5'; live: 'L1' | 'L2' | 'L3'; recording: 'server' | 'sd' | 'nvr' | 'edge'; retentionDays: number; snapshotAt: string } // ENT-04
export interface Alert { id: string; deviceId: string; kind: 'comm' | 'gps' | 'voltage' | 'harness' | 'error' | 'doc' | 'pipe' | 'filter' | 'ai-person' | 'camera-health'; severity: Severity; message: string; at: string; acked: boolean; caseId: string | null } // ENT-08
export interface Case { id: string; kind: 'fault' | 'doc' | 'inspection' | 'comm'; title: string; deviceId: string | null; siteId: string; state: TaskState; severity: Severity; assigneeId: string | null; dueAt: string; createdAt: string; history: HistoryItem[] } // ENT-06
export interface HistoryItem { at: string; by: string; action: string; note?: string } // ENT-09
export interface Doc { id: string; kind: 'cert' | 'ndt' | 'license' | 'training' | 'contract'; subject: string; subjectId: string; state: DocState; expiresAt: string | null; submittedAt: string | null } // ENT-07
export interface Lease { id: string; deviceId: string; siteId: string; ownerId: string; from: string; to: string } // ENT-10
export interface User { id: string; role: RoleId; display: string; org: string; siteIds: string[] } // ENT-05
export interface Kpis { total: number; normal: number; caution: number; fault: number; offline: number; maintenance: number; openCases: number; escalated: number }

export interface Scope { role: RoleId; siteIds?: string[]; ownerId?: string }
