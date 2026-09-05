import { describe, expect, it } from 'vitest';
import { PROFILE_IDS, profileFlags } from './profile';

describe('[FR-005] 현장 프로파일 → 저장 소스·피처 플래그 (options.profiles)', () => {
  it('ssot 프로파일 3종이 전부 해석된다', () => {
    expect(PROFILE_IDS).toEqual(['P-LITE', 'P-SD', 'P-NVR']);
    for (const id of PROFILE_IDS) expect(profileFlags(id).profile).toBe(id);
  });
  it('P-LITE: 1채널 · 서버 탭만 · 스냅샷 10s', () => {
    const f = profileFlags('P-LITE');
    expect(f.channels).toBe(1);
    expect(f.sources).toEqual(['server']);
    expect(f.sdRecall).toBe(false);
    expect(f.nvrTimeline).toBe(false);
    expect(f.snapshotEveryMs).toBe(10_000);
  });
  it('P-SD: 2채널 · 서버 + SD 탭 · 구간 회수 · 바디캠 A', () => {
    const f = profileFlags('P-SD');
    expect(f.channels).toBe(2);
    expect(f.sources).toEqual(['server', 'sd']);
    expect(f.sdRecall).toBe(true);
    expect(f.bodycam).toBe('A');
  });
  it('P-NVR: 서버 + NVR 탭 · 타임라인 · E5/L3/T2', () => {
    const f = profileFlags('P-NVR');
    expect(f.sources).toEqual(['server', 'nvr']);
    expect(f.nvrTimeline).toBe(true);
    expect([f.eventRoute, f.liveRoute, f.telemetry]).toEqual(['E5', 'L3', 'T2']);
  });
  it('서버 탭은 항상 첫 번째 · 알 수 없는 프로파일은 Error', () => {
    for (const id of PROFILE_IDS) expect(profileFlags(id).sources[0]).toBe('server');
    expect(() => profileFlags('P-X' as never)).toThrow();
  });
});
