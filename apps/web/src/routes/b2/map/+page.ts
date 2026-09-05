// B2-02 본사 지도 — hq 스코프(자사 현장 2)의 장비 마커·현장 카드 · 열람 전용, 마커/카드 → B2-03 · 보고 모드 → B2-04 (specs/sites-assets-leases AC-4 · DISC-015)
import type { RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'hq-safety') as RoleId, siteIds: me?.siteIds };
  const [sites, devices, kpis] = await Promise.all([api.sites(scope), api.devices(scope), api.kpis(scope)]);
  return { sites, devices, kpis };
};
