// 목업 카메라 자산 — 참고자료 v5.0 삽화(저장소 밖 PPTX)에서 tools/media/build.py가 만든 스틸(WebP 960×540)과 루프 MP4(640×360 · 6s · 무음).
// 실스트림 대신 라이브 자리(INTENT §5). Vite가 URL로 번들한다 — 두 앱이 import하는 이 모듈의 new URL()은 두 번들에 모두 emit되므로
// 웹 전용 클립은 별도 모듈(assets-web.ts)로 분리한다(이번엔 없음). 원천·크롭·바이트는 ./assets/manifest.json.
export const LOOP_MP4 = {
  /** 일반 카메라 · 전방 조망(붐 전개, 슬라이드 11) — 파일명 유지: e2e가 boom.*\.mp4 를 단언 */
  front: new URL('./assets/front.mp4', import.meta.url).href,
  /** AI 카메라 · 붐 끝 하향(슬라이드 11 팁 크롭) */
  boom: new URL('./assets/boom.mp4', import.meta.url).href,
} as const;

/** 스틸 — 타일 배경·플레이어 poster·스냅샷. idle 스틸에는 알람 그래픽이 없다(specs/video-basics W2.6) */
export const STILL = {
  /** 일반 · 전방 평시 — B4-03 설치 구성도로도 쓴다(카메라 시야 원뿔 2개) */
  front: new URL('./assets/front.webp', import.meta.url).href,
  /** AI · 붐 끝 평시 */
  boom: new URL('./assets/boom.webp', import.meta.url).href,
  /** AI · 인원 접근(슬라이드 12) — 구워진 빨간 상자와 STILL_BBOX가 같은 자리 */
  'boom-person': new URL('./assets/boom-person.webp', import.meta.url).href,
} as const;
export type StillId = keyof typeof STILL;

// STILL_BBOX:begin — tools/media/build.py가 sources.json의 bbox_px를 크롭 안에서 정규화해 쓴다. seed·realtime이 그대로 소비(리터럴 금지)
export const STILL_BBOX = {
  'boom-person': { x: 0.585, y: 0.474, w: 0.125, h: 0.423 },
} as const;
// STILL_BBOX:end
