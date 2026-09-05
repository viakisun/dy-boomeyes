import type { CameraHealth, CameraState } from '@boomeyes/domain';
/** 카메라 상태 라벨 — 장애 중 "정상" 표시 금지 (FR-034) */
export const CAMERA_LABEL: Record<CameraState, string> = {
  live: 'LIVE',
  snapshot: '스냅샷',
  recording: 'REC',
  offline: '오프라인',
  'ai-unavailable': 'AI 판단 불가',
};
/** 카메라 헬스 라벨 (FR-034) — ok는 라이브·스냅샷이 정상일 때만 */
export const HEALTH_LABEL: Record<CameraHealth, string> = {
  ok: '정상',
  frozen: '정지화면',
  blurry: '흐림',
  occluded: '가림',
  lost: '수신 끊김',
};
export const SOURCE_LABEL = { server: '서버', sd: 'SD', nvr: 'NVR' } as const;
