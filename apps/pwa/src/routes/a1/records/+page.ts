// A1-06 기록 — 내 현장 이력 병합(업무·점검·출근·서류, 30일) · 유형 칩 ?kind= (specs/records-reports AC-1 · AC-2)
import type { RecordKind, RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

const KINDS: RecordKind[] = ['task', 'inspection', 'attendance', 'doc'];
export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'site-safety') as RoleId, siteIds: me?.siteIds };
  const [records, sites] = await Promise.all([api.records(scope, { days: 30 }), api.sites(scope)]);
  const k = url.searchParams.get('kind');
  return { records, sites, kind: KINDS.includes(k as RecordKind) ? (k as RecordKind) : 'all', kinds: KINDS };
};
