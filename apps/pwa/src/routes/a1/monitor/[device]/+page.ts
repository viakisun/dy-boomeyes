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
  // 내 현장 밖 장비는 딥링크로도 열지 않는다 — api.device(id)는 scope를 받지 않아 여기서 막는다(AC-15).
  // siteIds가 비면 전 현장(캡처 세션·본사) — mock api의 inScope와 같은 규칙
  if (scope.siteIds?.length && !scope.siteIds.includes(device.siteId)) error(404, `장비 ${params.device} 없음`);
  const [cameras, sites, docs, completeness] = await Promise.all([
    api.cameras(device.id),
    api.sites(scope),
    api.docs(scope),
    api.docCompleteness(scope),
  ]);
  const site = sites.find((s) => s.id === device.siteId);
  const driver = users.find((u) => u.deviceId === device.id);
  const deviceDocs = docs.filter((d) => d.subjectId === device.id);
  const driverDocs = driver ? docs.filter((d) => d.subjectId === driver.id) : [];
  const flags = profileFlags(site?.videoProfile ?? 'P-SD');
  const source = url.searchParams.get('source');
  const tab = url.searchParams.get('tab');
  // 기본 탭은 상태. plite 픽스처(캡처·e2e 전용 ?state=)는 1채널·서버 소스가 영상 탭에만 보이므로 영상 탭으로 연다 — dev/plite 캡처가 같은 화면이 되지 않게
  const fallback = url.searchParams.get('state') === 'plite' ? 'video' : 'status';
  return {
    tab: (['status', 'docs', 'video', 'parts'] as const).find((t) => t === tab) ?? fallback,
    device,
    cameras: cameras.filter((c) => flags.channels === 2 || c.kind === 'general'), // AX-1 1채널이면 AI 채널 숨김
    site,
    driver,
    deviceDocs,
    driverDocs,
    completeness: completeness.find((c) => c.subjectId === device.id),
    flags,
    source: source && flags.sources.includes(source as 'server') ? source : flags.sources[0]!,
    // 카메라 영상 시트(FR-004 · IF-006) — B1-02M과 같은 ?cam= 규약
    cam: url.searchParams.get('cam'),
  };
};
