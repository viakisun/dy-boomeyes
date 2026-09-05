// B2-03 현장 상세(본사 웹) — hq 스코프 현장 [site]의 장비·카메라 월·업무 · 확인 요청만(DISC-015) (specs/video-basics AC-8)
import { error } from '@sveltejs/kit';
import { profileFlags, type RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'hq-safety') as RoleId, siteIds: me?.siteIds };
  const [devices, cameras, sites, cases] = await Promise.all([
    api.devices(scope),
    api.cameras(),
    api.sites(scope),
    api.cases(scope),
  ]);
  const site = sites.find((s) => s.id === params.site);
  if (!site) error(404, `현장 ${params.site} 없음`);
  return {
    site,
    sites,
    devices: devices.filter((d) => d.siteId === site.id),
    cameras,
    cases: cases.filter((c) => c.siteId === site.id),
    flags: profileFlags(site.videoProfile ?? 'P-SD'),
  };
};
