import { redirect } from '@sveltejs/kit';
import { SCREENS, canAccess, screenForPath, type RoleId, type ScrId } from '@boomeyes/domain';
import { bootMock, clock, createMockRealtime, demoSession, optionsFromUrl, resetMock } from '@boomeyes/mock';
import { session } from '$lib/session.svelte';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;
const LOGINS: ScrId[] = ['A1-01', 'A2-01', 'A3-01', 'A4-01'];

export const load: LayoutLoad = ({ url }) => {
  const screen = screenForPath(url.pathname, url.search, 'pwa');
  const opts = optionsFromUrl(url, screen);
  const api = bootMock(opts);
  if (opts.capture && !session.user && screen && !LOGINS.includes(screen))
    session.user = demoSession(SCREENS[screen].roles[0] as RoleId);
  const user = session.user;
  const surface = url.pathname.split('/')[1] ?? 'a1';
  if (screen && !LOGINS.includes(screen) && !user && !opts.capture) throw redirect(302, `/${surface}/login`);
  const forbidden = !!(user && screen && !canAccess(user.role, screen));
  const realtime = createMockRealtime({ enabled: !opts.capture });
  return { api, clock, realtime, resetMock, screen, capture: !!opts.capture, forbidden, surface };
};
