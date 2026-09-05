// A1-07 메뉴·현장 정보 — 현장 기본정보 · 내 신청 · 신청 시트(?state=apply) (specs/sites-assets-leases AC-5)
import type { RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId) ?? users.find((u) => u.role === 'site-safety');
  const scope = { role: (me?.role ?? 'site-safety') as RoleId, siteIds: me?.siteIds };
  const [sites, devices, requests] = await Promise.all([api.sites(scope), api.devices(scope), api.requests(scope)]);
  const site = sites[0];
  return {
    me,
    site,
    users,
    devices: site ? devices.filter((d) => d.siteId === site.id) : [],
    requests: requests.filter((r) => r.requesterId === me?.id),
    apply: url.searchParams.get('state') === 'apply', // 픽스처 apply = 신청 시트 열림(캡처·e2e)
  };
};
