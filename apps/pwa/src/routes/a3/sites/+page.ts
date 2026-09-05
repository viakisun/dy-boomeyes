// A3-02 현장 목록(본사) — hq 스코프 현장 카드 · 이상·업무·에스컬레이션 배지 (specs/task-escalation AC-10)
import type { RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'hq-safety') as RoleId, siteIds: me?.siteIds };
  const [sites, devices, cases] = await Promise.all([api.sites(scope), api.devices(scope), api.cases(scope)]);
  return { sites, devices, cases };
};
