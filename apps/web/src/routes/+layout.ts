// 정적 SPA — 서버 렌더 없음 (ADR-001 · ADR-007). 화면 진입마다 mock 부트(?state= · ?capture=1) + 역할 가드
import { redirect } from '@sveltejs/kit';
import { canAccess, screenForPath, type ScrId } from '@boomeyes/domain';
import { bootMock, optionsFromUrl } from '@boomeyes/mock';
import { session } from '$lib/session.svelte';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = ({ url }) => {
  const screen = screenForPath(url.pathname, url.search, 'web');
  const opts = optionsFromUrl(url, screen);
  const api = bootMock(opts);
  const user = session.user;
  if (screen !== 'B0-01' && !user && !opts.capture)
    throw redirect(302, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
  const forbidden = !!(user && screen && !canAccess(user.role, screen));
  return { api, screen: screen as ScrId | undefined, capture: !!opts.capture, forbidden };
};
