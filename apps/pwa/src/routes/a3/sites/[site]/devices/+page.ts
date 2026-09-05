// A3-04 장비 열람(본사) — 현장 [site]의 장비 × 채널 타일 · 열람 전용 (specs/video-basics AC-9)
import { error } from '@sveltejs/kit';
import { profileFlags, type RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'hq-safety') as RoleId, siteIds: me?.siteIds };
  const [devices, cameras, sites] = await Promise.all([api.devices(scope), api.cameras(), api.sites(scope)]);
  const site = sites.find((s) => s.id === params.site);
  if (!site) error(404, `현장 ${params.site} 없음`);
  const flags = profileFlags(site.videoProfile ?? 'P-SD');
  return { site, devices: devices.filter((d) => d.siteId === site.id), cameras, flags };
};
