import { redirect } from '@sveltejs/kit';
import { canAccess, screenForPath, type ScrId } from '@boomeyes/domain';
import { bootMock, clock, optionsFromUrl } from '@boomeyes/mock';
import { session } from '$lib/session.svelte';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;
const LOGINS: ScrId[] = ['A1-01', 'A2-01', 'A3-01', 'A4-01'];

export const load: LayoutLoad = ({ url }) => {
  const screen = screenForPath(url.pathname, url.search, 'pwa');
  const opts = optionsFromUrl(url, screen);
  const api = bootMock(opts);
  const user = session.user;
  const surface = url.pathname.split('/')[1] ?? 'a1';
  if (screen && !LOGINS.includes(screen) && !user && !opts.capture) throw redirect(302, `/${surface}/login`);
  const forbidden = !!(user && screen && !canAccess(user.role, screen));
  return { api, clock, screen, capture: !!opts.capture, forbidden, surface };
};
