// 상태 어휘 — 세 역할이 같은 말을 써야 한다. 화면마다 다르게 부르지 않는다.
import type { EquipmentStatus, RequestStatus } from './types';

export const STATUS_LABEL: Record<EquipmentStatus, string> = {
  fault: '고장',
  check: '점검',
  late: '수신 지연',
  run: '정상',
  store: '보관',
};

export const STATUS_COLOR: Record<EquipmentStatus, string> = {
  fault: 'var(--fault)',
  check: 'var(--check)',
  late: 'var(--late)',
  run: 'var(--run)',
  store: 'var(--store)',
};

/** 상태마다 「무엇이 문제인가」 한 줄 */
export const STATUS_NOTE: Record<EquipmentStatus, string> = {
  fault: '공급 전압 저하',
  check: '수송관 점검 시기 도래',
  late: '마지막 수신 7. 3. 오전 08:22',
  run: '이상 신호 없음',
  store: '단말기 미장착',
};

/** 확인이 급한 순서 — 목록 정렬에 함께 쓴다 */
export const STATUS_ORDER: Record<EquipmentStatus, number> = {
  fault: 0,
  check: 1,
  late: 2,
  run: 3,
  store: 4,
};

/** 사람이 들여다봐야 하는 상태 */
export const NEEDS_ATTENTION: EquipmentStatus[] = ['fault', 'check', 'late'];

export const REQUEST_LABEL: Record<RequestStatus, string> = {
  new: '요청 접수',
  assign: '배정 중',
  ship: '운송·설치',
  run: '가동',
  done: '종료',
};
