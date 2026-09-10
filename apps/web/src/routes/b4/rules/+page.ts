// B4-05 알림 기준 — 알림 9종 · 고장코드 · 시나리오 등급 (specs/admin-protocol-rules AC-4 · AC-5 · AC-6 · AC-7)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const rules = await api.rules();
  const tab = url.searchParams.get('tab');
  return { rules, tab: tab === 'codes' || tab === 'scenarios' ? tab : 'alerts' };
};
