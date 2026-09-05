// 도메인 상태 → 한글 라벨 (색은 cx.ts의 *_TONE, 라벨은 여기 — 색 + 텍스트 병행 규칙)
import type { Case, Request, RequestState, Severity, TaskState } from '@boomeyes/domain';
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
export const ERROR_CODE_LABEL: Record<string, string> = {
  'E-021': '380V 전압 이상 — 상 전압 342V, 릴레이·입력 전원 점검',
};
export const REQUEST_TONE: Record<RequestState, Tone> = {
  submitted: 'info',
  review: 'progress',
  approved: 'success',
  rejected: 'danger',
};
