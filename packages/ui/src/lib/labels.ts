// 도메인 상태 → 한글 라벨 (색은 cx.ts의 *_TONE, 라벨은 여기 — 색 + 텍스트 병행 규칙)
import type {
  Case,
  DocKind,
  DocState,
  EquipmentState,
  Request,
  RequestState,
  Severity,
  TaskState,
  LeaseState,
} from '@boomeyes/domain';
import type { Tone } from './cx';

export const TASK_LABEL: Record<TaskState, string> = {
  new: '신규',
  assigned: '배정',
  'in-progress': '진행 중',
  done: '완료',
  escalated: '에스컬레이션',
};
export const CASE_KIND_LABEL: Record<Case['kind'], string> = {
  fault: '고장',
  doc: '서류',
  inspection: '점검',
  comm: '통신',
};
export const SEVERITY_LABEL: Record<Severity, string> = { critical: '긴급', warning: '경고', info: '정보' };
export const REQUEST_KIND_LABEL: Record<Request['kind'], string> = {
  'site-open': '현장 개설',
  'device-assign': '장비 배정',
  doc: '서류',
};
export const REQUEST_STATE_LABEL: Record<RequestState, string> = {
  submitted: '접수 대기',
  review: '검토 중',
  approved: '승인',
  rejected: '반려',
};
/** 고장코드 설명 — B4-05 고장코드 표(admin-protocol-rules)로 옮길 임시 원천 */
export const EQUIPMENT_LABEL: Record<EquipmentState, string> = {
  normal: '정상',
  caution: '주의',
  fault: '고장',
  offline: '두절',
  maintenance: '정비',
};
export const DOC_STATE_LABEL: Record<DocState, string> = {
  valid: '유효',
  expiring: '만료 임박',
  submitted: '제출',
  review: '검토 중',
  approved: '승인',
  rejected: '반려',
};
export const DOC_KIND_LABEL: Record<DocKind, string> = {
  cert: '제작증',
  ndt: '비파괴 검사 성적서',
  license: '면허·선임증',
  training: '교육 이수증',
  contract: '계약서',
};
export const ERROR_CODE_LABEL: Record<string, string> = {
  'E-021': '380V 전압 이상 — 상 전압 342V, 릴레이·입력 전원 점검',
};
export const REQUEST_TONE: Record<RequestState, Tone> = {
  submitted: 'info',
  review: 'progress',
  approved: 'success',
  rejected: 'danger',
};
export const LEASE_STATE_LABEL: Record<LeaseState, string> = {
  active: '계약 중',
  expiring: '만료 임박',
  relocated: '재배치',
  ended: '종료',
};
export const LEASE_TONE: Record<LeaseState, Tone> = {
  active: 'success',
  expiring: 'warning',
  relocated: 'info',
  ended: 'neutral',
};
