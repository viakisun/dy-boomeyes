// A3-03 현장 상세(본사) — hq 스코프 현장 [site] 요약(장비·이상·업무·완비율) · 미처리 업무 확인 요청(DISC-015) (specs/sites-assets-leases AC-7)
import { error } from '@sveltejs/kit';
import type { RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'hq-safety') as RoleId, siteIds: me?.siteIds };
  const [sites, devices, cases, completeness] = await Promise.all([
    api.sites(scope),
    api.devices(scope),
    api.cases(scope),
    api.docCompleteness(scope),
  ]);
  const site = sites.find((s) => s.id === params.site);
  if (!site) error(404, `현장 ${params.site} 없음`);
  return {
    site,
    users,
    devices: devices.filter((d) => d.siteId === site.id),
    cases: cases.filter((c) => c.siteId === site.id),
    docs: completeness.find((c) => c.kind === 'site' && c.siteId === site.id) ?? null,
  };
};
