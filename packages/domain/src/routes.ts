// 라우트 ↔ 화면 코드 — SCREENS.route 템플릿(`/a1/inbox/[case]`)을 정규식으로 매칭
import { SCREENS, type ScrId } from './generated/ids';

const compiled = (Object.entries(SCREENS) as [ScrId, (typeof SCREENS)[ScrId]][]).map(([id, s]) => {
  const path = s.route.split('?')[0] ?? s.route;
  const re = new RegExp('^' + path.replace(/\[[a-z]+\]/g, '[^/]+').replace(/\//g, '\\/') + '\\/?$');
  return { id, app: s.app, re, hasQuery: s.route.includes('?'), query: s.route.split('?')[1] ?? '' };
});

/** pathname(+search)에 해당하는 화면 코드. 모달 화면(B1-02M)은 쿼리 키(cam=)로 구분 */
export function screenForPath(pathname: string, search = '', app?: 'web' | 'pwa'): ScrId | undefined {
  const cands = compiled.filter((c) => (!app || c.app === app) && c.re.test(pathname));
  if (!cands.length) return undefined;
  const params = new URLSearchParams(search);
  const withQuery = cands.find((c) => c.hasQuery && params.has(c.query.split('=')[0] ?? ''));
  return (withQuery ?? cands.find((c) => !c.hasQuery) ?? cands[0])?.id;
}

/** 화면의 라우트에 파라미터를 채운다 (`[case]` → C-105) */
export function routeOf(id: ScrId, params: Record<string, string> = {}): string {
  return SCREENS[id].route.replace(/\[([a-z]+)\]/g, (_, k) => params[k] ?? `[${k}]`);
}
