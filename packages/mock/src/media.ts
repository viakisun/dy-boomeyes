// mock MediaSource — 라이브 대체 루프 MP4(합성) · 스냅샷(SVG data URL, 고정 시각) · 저장 영상 메타 (ADR-002 · specs/video-basics)
import type { Camera, MediaSource } from '@boomeyes/domain';
import { LOOP_MP4 } from '@boomeyes/video/assets';
import { clock, H, MIN } from './clock';
import type { Db } from './seed';

const gone = (c: Camera | undefined) => !c || c.state === 'offline' || c.health === 'lost';

/** 스냅샷 — 카메라·시각을 새긴 SVG (실 JPEG 대신, 결정적) */
const kst = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
function snapshotSvg(c: Camera, at: string): string {
  const t = kst(at); // 화면 포맷터와 같은 시간대(Asia/Seoul)
  const hue = c.kind === 'ai' ? 160 : 210;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 20% 22%)"/><stop offset="1" stop-color="hsl(${hue} 35% 40%)"/></linearGradient></defs><rect width="160" height="90" fill="url(#g)"/><text x="6" y="14" font-size="7" fill="#fff" font-family="sans-serif">${c.id} · ${c.kind === 'ai' ? 'AI 붐 끝' : '전방'}</text><text x="6" y="84" font-size="7" fill="#fff" font-family="monospace">${t}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createMockMedia(db: Db): MediaSource {
  const cam = (id: string) => db.cameras.find((c) => c.id === id);
  return {
    async live(cameraId) {
      const c = cam(cameraId);
      if (gone(c)) return null;
      return { kind: 'mp4', url: c!.kind === 'ai' ? LOOP_MP4.boom : LOOP_MP4.front };
    },
    async snapshot(cameraId) {
      const c = cam(cameraId);
      if (gone(c)) return null;
      const at = clock.iso();
      return { url: snapshotSvg(c!, at), at };
    },
    async recordings(cameraId, source) {
      const c = cam(cameraId);
      if (!c) return [];
      const n = source === 'nvr' ? 4 : source === 'sd' ? 2 : 3;
      return Array.from({ length: n }, (_, i) => ({
        id: `REC-${cameraId}-${source}-${i + 1}`,
        at: clock.minus((i + 1) * H + 5 * MIN),
        durationSec: 3600,
        source,
      }));
    },
  };
}
