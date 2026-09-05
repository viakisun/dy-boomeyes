// B4-03 장비·현장·프로파일 — 탭 devices|sites|profiles · ?site= 선택 (specs/sites-assets-leases AC-1)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const scope = { role: 'ops-admin' as const };
  const [sites, devices, users, cameras] = await Promise.all([
    api.sites(scope),
    api.devices(scope),
    api.users(),
    api.cameras(),
  ]);
  const tab = url.searchParams.get('tab');
  return {
    sites,
    devices,
    users,
    cameras,
    tab: tab === 'sites' || tab === 'profiles' ? tab : 'devices',
    site: url.searchParams.get('site'),
  };
};
