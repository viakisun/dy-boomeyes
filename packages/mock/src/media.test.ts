// [FR-004] mock MediaSource — 삽화 스틸 키 · poster · 인원 접근 bbox 정렬 (specs/video-basics W2.6)
import { describe, expect, it } from 'vitest';
import { STILL, STILL_BBOX } from '@boomeyes/video/assets';
import { createMockMedia } from './media';
import { seed } from './seed';

describe('[FR-004] mock MediaSource — 삽화 스틸', () => {
  const db = seed();
  const media = createMockMedia(db);
  it('라이브 = 채널 루프 + poster 스틸 · 스냅샷 = 평시 스틸, 인원 접근 알림(bbox)이 있는 AI 채널만 사람 장면', async () => {
    expect((await media.live('CAM-3-1'))?.poster).toBe(STILL.front);
    expect((await media.live('CAM-3-2'))?.poster).toBe(STILL.boom);
    expect((await media.snapshot('CAM-3-1'))?.url).toBe(STILL.front);
    expect((await media.snapshot('CAM-3-2'))?.url).toBe(STILL['boom-person']); // AL-008(cameraId CAM-3-2 · bbox)
    expect((await media.snapshot('CAM-1-2'))?.url).toBe(STILL.boom);
  });
  it('두절 장비(CPB-004)의 카메라는 라이브·스냅샷 모두 null', async () => {
    expect(await media.live('CAM-4-1')).toBeNull();
    expect(await media.snapshot('CAM-4-2')).toBeNull();
  });
  it('[FR-028] AL-008(ai-person)의 bbox는 STILL_BBOX 값 · AL-003(pipe)에는 카메라·bbox가 없다', () => {
    const al8 = db.alerts.find((a) => a.id === 'AL-008')!;
    expect(al8.cameraId).toBe('CAM-3-2');
    expect(al8.bbox).toEqual(STILL_BBOX['boom-person']);
    const al3 = db.alerts.find((a) => a.id === 'AL-003')!;
    expect(al3.cameraId).toBeUndefined();
    expect(al3.bbox).toBeUndefined();
  });
});
