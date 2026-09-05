// B1-05 서류 현황 — 완비율·만료 임박·이력·요청 회신(모니터링, 등록·승인 없음) (specs/documents AC-4)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const scope = { role: 'control' as const };
  const [docs, completeness, requests, sites] = await Promise.all([
    api.docs(scope),
    api.docCompleteness(scope),
    api.requests(scope),
    api.sites(scope),
  ]);
  return { docs, completeness, requests, sites, doc: url.searchParams.get('doc') };
};
