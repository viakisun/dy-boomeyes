import { describe, expect, it } from 'vitest';
import { routeOf, screenForPath } from './routes';

describe('[FR-001] 라우트 ↔ 화면', () => {
  it('정적·파라미터·모달 라우트', () => {
    expect(screenForPath('/login')).toBe('B0-01');
    expect(screenForPath('/b1/dash')).toBe('B1-02');
    expect(screenForPath('/b1/dash', '?cam=CAM-3-2')).toBe('B1-02M');
    expect(screenForPath('/a1/inbox/C-105', '', 'pwa')).toBe('A1-03');
    expect(screenForPath('/a1/inbox/C-105', '?sheet=complete', 'pwa')).toBe('A1-08');
    expect(screenForPath('/a1/inbox/C-105', '?sheet=complete&state=sheet&capture=1', 'pwa')).toBe('A1-08');
    expect(screenForPath('/a1/inbox/C-106', '?sheet=review', 'pwa')).toBe('A1-03'); // 반려 사유 시트는 A1-03의 일부
    expect(screenForPath('/b1/dash', '?state=dash&cam=CAM-1-1')).toBe('B1-02M'); // 값 자리([camera])는 키만
    expect(screenForPath('/b1/events/EV-001')).toBe('B1-08');
    expect(screenForPath('/nope')).toBeUndefined();
  });
  it('routeOf 파라미터 치환', () => expect(routeOf('A1-03', { case: 'C-105' })).toBe('/a1/inbox/C-105'));
});
