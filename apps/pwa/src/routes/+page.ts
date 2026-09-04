import { redirect } from '@sveltejs/kit';
import { APP_HOME_OF, SCREENS } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
export const load = () => {
  const h = session.user && APP_HOME_OF[session.user.role];
  throw redirect(302, h ? SCREENS[h].route : '/a1/login');
};
