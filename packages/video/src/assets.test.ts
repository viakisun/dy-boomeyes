// [FR-004] 목업 카메라 자산 — 스틸 3 · 루프 2 · bbox 정규화 범위 (tools/media/build.py 산출, specs/video-basics W2.6)
import { describe, expect, it } from 'vitest';
import { LOOP_MP4, LOOP_SEC, STILL, STILL_BBOX } from './assets';
import manifest from './assets/manifest.json';

describe('[FR-004] 목업 카메라 자산', () => {
  it('스틸 3(front · boom · boom-person)은 webp · 루프는 front/boom mp4(파일명 유지 — e2e가 boom.*\\.mp4 를 단언)', () => {
    expect(Object.keys(STILL).sort()).toEqual(['boom', 'boom-person', 'front']);
    for (const url of Object.values(STILL)) expect(url).toMatch(/\.webp$/);
    expect(LOOP_MP4.front).toMatch(/front.*\.mp4$/);
    expect(LOOP_MP4.boom).toMatch(/boom.*\.mp4$/);
  });
  it('[FR-005] LOOP_SEC은 manifest의 클립 길이와 같다 — 저장 영상 목록의 길이 표기가 이 값을 쓴다', () => {
    expect(manifest.assets.front.mp4.duration).toBe(LOOP_SEC);
    expect(manifest.assets.boom.mp4.duration).toBe(LOOP_SEC);
  });
  it('[FR-028] STILL_BBOX는 0~1 정규화이고 스틸 안에 든다', () => {
    const b = STILL_BBOX['boom-person'];
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.w).toBeLessThanOrEqual(1);
    expect(b.y + b.h).toBeLessThanOrEqual(1);
    expect(b.w).toBeGreaterThan(0.05); // 사람 크기 — 0에 가까우면 검출·크롭이 어긋난 것
    expect(b.h).toBeGreaterThan(0.2);
  });
});
