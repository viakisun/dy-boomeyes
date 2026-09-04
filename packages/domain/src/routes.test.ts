import { describe, expect, it } from 'vitest';
import { routeOf, screenForPath } from './routes';

describe('[FR-001] 라우트 ↔ 화면', () => {
  it('정적·파라미터·모달 라우트', () => {
    expect(screenForPath('/login')).toBe('B0-01');
    expect(screenForPath('/b1/dash')).toBe('B1-02');
    expect(screenForPath('/b1/dash', '?cam=CAM-3-2')).toBe('B1-02M');
    expect(screenForPath('/a1/inbox/C-105', '', 'pwa')).toBe('A1-03');
    expect(screenForPath('/a1/inbox/C-105', '?sheet=complete', 'pwa')).toBe('A1-08');
    expect(screenForPath('/nope')).toBeUndefined();
  });
  it('routeOf 파라미터 치환', () => expect(routeOf('A1-03', { case: 'C-105' })).toBe('/a1/inbox/C-105'));
});
