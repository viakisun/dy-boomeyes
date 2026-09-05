// A3-05 업무(열람) — 전 현장 통합 목록 · 확인 요청만 (specs/task-escalation AC-11)
import type { RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'hq-safety') as RoleId, siteIds: me?.siteIds };
  const [cases, sites] = await Promise.all([api.cases(scope), api.sites(scope)]);
  return { cases, sites, chip: url.searchParams.get('filter') ?? 'open' };
};
