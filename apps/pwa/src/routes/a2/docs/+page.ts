// A2-05 내 서류 — 운전자·배정 장비 서류 · 촬영 제출 (specs/documents AC-1 · AC-2 · AC-6)
import type { RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'driver') as RoleId, siteIds: me?.siteIds };
  const docs = await api.docs(scope);
  const mine = docs.filter((d) => d.subjectId === me?.id || (me?.deviceId && d.subjectId === me.deviceId));
  return { docs: mine, me };
};
