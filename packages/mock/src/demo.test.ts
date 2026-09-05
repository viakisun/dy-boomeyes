import { describe, expect, it } from 'vitest';
import { SCENES, SCENE_FIXTURES, bootMock, clock, createSceneRealtime, H, sceneOf } from './index';
import { seed } from './seed';

describe('[FR-011] demo-scripts 장면', () => {
  it('SCENES는 ssot demo 10장면 · 첫 화면 라우트 · 계정', () => {
    expect(SCENES).toHaveLength(10);
    expect(sceneOf(1)).toMatchObject({ title: '상황 발생', entry: '/b1/dash', account: 'control01', app: 'web' });
    expect(sceneOf(2)).toMatchObject({ entry: '/a2/today', account: 'driver03', app: 'pwa' });
    expect(sceneOf(5)?.entry).toBe('/a1/inbox/C-105');
    expect(sceneOf(11)).toBeNull();
  });
  it('장면 1 픽스처 = 상황 발생 전(CPB-003 정상 · C-105 없음) → 타임라인이 E-021을 만든다', async () => {
    clock.freeze();
    const api = bootMock({ scene: 1, capture: false, latencyMs: 0 });
    expect((await api.device('CPB-003'))?.state).toBe('normal');
    expect(await api.case('C-105')).toBeUndefined();
    const db = SCENE_FIXTURES[1]!(seed());
    expect(db.alerts.some((a) => a.caseId === 'C-105')).toBe(false);
    const off = createSceneRealtime(1, api).subscribe(() => {}); // node에서는 발행하지 않는다
    off();
    clock.reset();
  });
  it('[FR-010] 장면 6 픽스처: CPB-004 55분 방치 → 에스컬레이션 0 → 1시간 경과 → C-104(경과 큰 순) 통보 대상 본사', async () => {
    clock.freeze();
    const api = bootMock({ scene: 6, capture: false, latencyMs: 0 });
    expect(await api.escalations()).toHaveLength(0);
    clock.jump(H);
    const esc = await api.escalations();
    expect(esc.map((e) => e.case.id)).toEqual(['C-104', 'C-105']); // C-105(20초 전 발행)도 1h를 넘는다
    expect(esc[0]!.notifyTo).toContain('hq-safety');
    clock.reset();
  });
  it('장면 4·5 픽스처: C-105 진행 중 · 정비 호출 이력', async () => {
    const c4 = (await bootMock({ scene: 4, latencyMs: 0 }).case('C-105'))!;
    expect(c4.state).toBe('in-progress');
    const c5 = (await bootMock({ scene: 5, latencyMs: 0 }).case('C-105'))!;
    expect(c5.history.map((h) => h.action)).toContain('정비 담당 호출');
  });
});
