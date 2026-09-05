// B4-06 서류 관리 — 5유형 등록(장비/현장/운전자 · 유효기간) · 목록 (specs/documents AC-5)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const scope = { role: 'ops-admin' as const };
  const [docs, devices, users] = await Promise.all([api.docs(scope), api.devices(scope), api.users()]);
  return { docs, devices, users, tab: url.searchParams.get('tab') === 'register' ? 'register' : 'list' };
};
