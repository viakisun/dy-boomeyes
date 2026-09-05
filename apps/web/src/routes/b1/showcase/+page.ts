// B1-07 쇼케이스 — 읽기 전용 집계(showcase) + 카메라 월 · control 스코프 (specs/owner-showcase AC-1~3 · 장면 10)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const scope = { role: 'control' as const };
  const [showcase, devices, sites, cameras] = await Promise.all([
    api.showcase(scope),
    api.devices(scope),
    api.sites(scope),
    api.cameras(),
  ]);
  return { showcase, devices, sites, cameras };
};
