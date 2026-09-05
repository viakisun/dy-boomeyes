// 합성 루프 MP4(ffmpeg lavfi, 640×360 · 6s · 무음 · ~75KB) — 실스트림 대신 라이브 자리 (INTENT §5). Vite가 URL로 번들한다
export const LOOP_MP4 = {
  /** 일반 카메라 · 전방 조망 */
  front: new URL('./assets/front.mp4', import.meta.url).href,
  /** AI 카메라 · 붐 끝 하향 */
  boom: new URL('./assets/boom.mp4', import.meta.url).href,
} as const;
