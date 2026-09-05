// A1-05 장비 상세 — 텔레메트리 · 소모품 · 서류 · 저장 영상 · 카메라 (specs/video-basics AC-3)
import { error } from '@sveltejs/kit';
import { profileFlags, type RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, url }) => {
  const { api } = await parent();
  const device = await api.device(params.device);
  if (!device) error(404, `장비 ${params.device} 없음`);
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'site-safety') as RoleId, siteIds: me?.siteIds };
  const [cameras, sites, docs] = await Promise.all([api.cameras(device.id), api.sites(scope), api.docs(scope)]);
  const site = sites.find((s) => s.id === device.siteId);
  const driver = users.find((u) => u.deviceId === device.id);
  const deviceDocs = docs.filter((d) => d.subjectId === device.id);
  const driverDocs = driver ? docs.filter((d) => d.subjectId === driver.id) : [];
  const flags = profileFlags(site?.videoProfile ?? 'P-SD');
  const source = url.searchParams.get('source');
  return {
    device,
    cameras: cameras.filter((c) => flags.channels === 2 || c.kind === 'general'), // AX-1 1채널이면 AI 채널 숨김
    site,
    driver,
    deviceDocs,
    driverDocs,
    flags,
    source: source && flags.sources.includes(source as 'server') ? source : flags.sources[0]!,
  };
};
