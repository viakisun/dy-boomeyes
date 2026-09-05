// A3-06 기록(본사) — 자사 현장 2의 이력 병합 · 현장 칩 ?site= · 유형 칩 ?kind= · 처리 액션 없음 (specs/records-reports AC-3)
import type { RecordKind, RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

const KINDS: RecordKind[] = ['task', 'inspection', 'attendance', 'doc'];
export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'hq-safety') as RoleId, siteIds: me?.siteIds };
  const [records, sites] = await Promise.all([api.records(scope, { days: 30 }), api.sites(scope)]);
  const k = url.searchParams.get('kind');
  const site = url.searchParams.get('site');
  return {
    records,
    sites,
    kind: KINDS.includes(k as RecordKind) ? (k as RecordKind) : 'all',
    site: sites.some((s) => s.id === site) ? site! : 'all',
    kinds: KINDS,
  };
};
