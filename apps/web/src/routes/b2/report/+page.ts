// B2-04 보고 모드 — hq 스코프 현장별 기간 요약(7 | 30일) · 열람 전용 (specs/records-reports AC-4)
import type { RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'hq-safety') as RoleId, siteIds: me?.siteIds };
  const days = url.searchParams.get('days') === '30' ? 30 : 7;
  const report = await api.report(scope, days);
  return { report, days };
};
