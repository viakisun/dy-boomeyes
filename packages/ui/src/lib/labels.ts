// 도메인 상태 → 한글 라벨 (색은 cx.ts의 *_TONE, 라벨은 여기 — 색 + 텍스트 병행 규칙)
import type {
  Case,
  DocKind,
  EvidenceState,
  DocState,
  EquipmentState,
  Request,
  RequestState,
  Severity,
  TaskState,
  LeaseState,
  RecordKind,
  PartEvent,
  PartGroup,
  PartState,
  ScrId,
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
/** 영상 확보 상태(ENT-19) — 사건(업무) 상태와 별개(참고자료 v5.0 §15). 색은 확보 불가만 warning, 나머지는 텍스트(§0-4) */
export const EVIDENCE_LABEL: Record<EvidenceState, string> = {
  pending: '업로드 대기',
  partial: '일부 확보',
  secured: '확보',
  unavailable: '확보 불가',
};
export const EVIDENCE_TONE: Record<EvidenceState, Tone> = {
  pending: 'neutral',
  partial: 'neutral',
  secured: 'neutral',
  unavailable: 'warning',
};
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
/** ENT-15 개인정보 동의 항목(FR-031 표준 패키지) */
export const CONSENT_LABEL: Record<'video' | 'audio' | 'location', string> = {
  video: '영상',
  audio: '음성',
  location: '위치',
};
/** FR-012 기록 유형 */
export const RECORD_KIND_LABEL: Record<RecordKind, string> = {
  task: '업무',
  inspection: '점검',
  attendance: '출근',
  doc: '서류',
  rule: '규칙',
  lease: '임대',
};
/** ENT-16 부품 상태(part 상태기계) · 부품군 · 이력 구분 */
export const PART_STATE_LABEL: Record<PartState, string> = {
  registered: '등록',
  installed: '장착',
  inspected: '점검됨',
  due: '교체 대상',
  replaced: '교체됨',
  discarded: '폐기',
};
export const PART_TONE: Record<PartState, Tone> = {
  registered: 'neutral',
  installed: 'success',
  inspected: 'info',
  due: 'warning',
  replaced: 'progress',
  discarded: 'neutral',
};
export const PART_GROUP_LABEL: Record<PartGroup, string> = {
  pipe: '직관·이송배관',
  elbow: '엘보·리듀서',
  flange: '플랜지·클램프',
  gasket: '가스켓·안전핀',
  endhose: '엔드호스·피팅',
};
/** PWA 하단 내비 라벨(≤ 4자, DY-design §10-2 · 승인 세트 3: design-uplift §4 결정 2) — 앱바 제목은 SCREENS[id].name 그대로 · A4는 화면이 생길 때 추가 */
export const NAV_SHORT_LABEL: Partial<Record<ScrId, string>> = {
  'A1-02': '업무',
  'A1-04': '관제',
  'A1-06': '기록',
  'A1-07': '메뉴',
  'A2-02': '오늘',
  'A2-04': '장비',
  'A2-05': '서류',
  'A2-06': '메뉴',
  'A3-02': '현장',
  'A3-05': '업무',
  'A3-06': '기록',
};
export const PART_EVENT_LABEL: Record<PartEvent['kind'], string> = {
  register: '등록',
  install: '장착',
  inspect: '점검',
  replace: '교체',
  discard: '폐기',
};
