// B4-04 사용자·권한 — 7역할 × 데모 계정 7 · ?user= 선택 (specs/sites-assets-leases AC-2)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const [users, sites] = await Promise.all([api.users(), api.sites({ role: 'ops-admin' })]);
  return { users, sites, user: url.searchParams.get('user') };
};
