// 정적 SPA — 서버 렌더 없음 (ADR-001 · ADR-007). 화면 진입마다 mock 부트(?state= · ?capture=1) + 역할 가드
import { redirect } from '@sveltejs/kit';
import { SCREENS, canAccess, screenForPath, type RoleId, type ScrId } from '@boomeyes/domain';
import { bootMock, clock, createMockRealtime, demoSession, optionsFromUrl, resetMock } from '@boomeyes/mock';
import { session } from '$lib/session.svelte';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = ({ url }) => {
  const screen = screenForPath(url.pathname, url.search, 'web');
  const opts = optionsFromUrl(url, screen);
  const api = bootMock(opts);
  // capture 모드: 로그인 없이도 셸까지 그리도록 화면 첫 역할의 데모 세션을 합성 (QA §3)
  if (opts.capture && !session.user && screen && screen !== 'B0-01')
    session.user = demoSession(SCREENS[screen].roles[0] as RoleId);
  const user = session.user;
  if (screen !== 'B0-01' && !user && !opts.capture)
    throw redirect(302, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
  const forbidden = !!(user && screen && !canAccess(user.role, screen));
  const realtime = createMockRealtime({ enabled: !opts.capture });
  return { api, clock, realtime, resetMock, screen: screen as ScrId | undefined, capture: !!opts.capture, forbidden };
};
