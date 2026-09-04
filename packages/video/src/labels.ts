import type { CameraState } from '@boomeyes/domain';
/** 카메라 상태 라벨 — 장애 중 "정상" 표시 금지 (FR-034) */
export const CAMERA_LABEL: Record<CameraState, string> = {
  live: 'LIVE',
  snapshot: '스냅샷',
  recording: 'REC',
  offline: '오프라인',
  'ai-unavailable': 'AI 판단 불가',
};
