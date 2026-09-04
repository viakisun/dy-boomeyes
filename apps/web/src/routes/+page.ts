import { redirect } from '@sveltejs/kit';
import { HOME_OF, SCREENS } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
export const load = () => {
  const u = session.user;
  throw redirect(302, u ? SCREENS[HOME_OF[u.role]].route : '/login');
};
