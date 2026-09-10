// mock MediaSource — 라이브 대체 루프 MP4 + poster 스틸 · 스냅샷 = 삽화 스틸(고정 시각은 UI가 표시) · 저장 영상 메타 + 대체 클립 URL (ADR-002 · specs/video-basics W2.6)
import type { Camera, MediaSource } from '@boomeyes/domain';
import { LOOP_MP4, LOOP_SEC, STILL, type StillId } from '@boomeyes/video/assets';
import { clock, H, MIN } from './clock';
import type { Db } from './seed';

const gone = (c: Camera | undefined) => !c || c.state === 'offline' || c.health === 'lost';

export function createMockMedia(db: Db): MediaSource {
  const cam = (id: string) => db.cameras.find((c) => c.id === id);
  /** 스냅샷 스틸 — AI 채널에 bbox가 달린 알림(인원 접근)이 있으면 사람 장면, 아니면 채널 평시 */
  const stillOf = (c: Camera): StillId => {
    if (c.kind !== 'ai') return 'front';
    return db.alerts.some((a) => a.cameraId === c.id && a.bbox) ? 'boom-person' : 'boom';
  };
  return {
    async live(cameraId) {
      const c = cam(cameraId);
      if (gone(c)) return null;
      const kind = c!.kind === 'ai' ? 'boom' : 'front';
      return { kind: 'mp4', url: LOOP_MP4[kind], poster: STILL[kind] };
    },
    async snapshot(cameraId) {
      const c = cam(cameraId);
      if (gone(c)) return null;
      return { url: STILL[stillOf(c!)], at: clock.iso() };
    },
    async recordings(cameraId, source) {
      const c = cam(cameraId);
      if (!c) return [];
      const n = source === 'nvr' ? 4 : source === 'sd' ? 2 : 3;
      const kind = c.kind === 'ai' ? 'boom' : 'front';
      return Array.from({ length: n }, (_, i) => ({
        id: `REC-${cameraId}-${source}-${i + 1}`,
        at: clock.minus((i + 1) * H + 5 * MIN),
        durationSec: LOOP_SEC, // 대체 클립 길이 그대로 — 목록 표기 = 실제 재생 길이
        source,
        // SD 병행은 최신 구간만 서버에 올라와 있다 — 나머지는 구간 회수 뒤 재생(IF-007)
        ...(source === 'sd' && i > 0 ? {} : { url: LOOP_MP4[kind], poster: STILL[kind] }),
      }));
    },
  };
}
