// A1-04 현장 모니터 — 장비별 2채널 타일 · 헬스 · AI 이벤트 · 바디캠 자리 (specs/video-basics AC-1 · AC-2 · AC-5 · AC-6)
import { profileFlags, type RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'site-safety') as RoleId, siteIds: me?.siteIds };
  const [devices, cameras, sites] = await Promise.all([api.devices(scope), api.cameras(), api.sites(scope)]);
  const site = sites[0];
  const flags = profileFlags(site?.videoProfile ?? 'P-SD');
  // 현장 신고 시트(FR-038) — ?sheet=report · capture 픽스처 ?state=report
  const reportSheet =
    url.searchParams.get('sheet') === 'report' ||
    (url.searchParams.get('capture') === '1' && url.searchParams.get('state') === 'report');
  return {
    devices,
    cameras,
    site,
    flags,
    tab: url.searchParams.get('tab') === 'bodycam' ? 'bodycam' : 'cameras',
    reportSheet,
    // 카메라 영상 시트(FR-004 · IF-006) — B1-02M과 같은 ?cam= 규약
    cam: url.searchParams.get('cam'),
  };
};
