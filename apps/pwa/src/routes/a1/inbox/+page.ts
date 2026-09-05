// A1-02 업무함 — 내 현장 업무 · 필터 칩(미처리 기본 · 전체 · 고장·이상) (specs/task-escalation AC-1 · AC-2 · AC-8)
import type { RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'site-safety') as RoleId, siteIds: me?.siteIds };
  const [cases, sites] = await Promise.all([api.cases(scope), api.sites(scope)]);
  const state = url.searchParams.get('state');
  const chip = url.searchParams.get('filter') ?? (state === 'filter' ? 'fault' : 'open');
  return { cases, sites, chip };
};
