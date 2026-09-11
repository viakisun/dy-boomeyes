// B1-06 임대 계약 — 만료 임박(D-n) 최상단 · 재배치 계획(lease expiring → relocated) · ?lease= 선택 (specs/sites-assets-leases AC-3 · 장면 9)
import { session } from '$lib/session.svelte';
import { scopeOf } from '@boomeyes/domain';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const scope = scopeOf(session.user); // 역할 + 소유주면 ownerId(ADR-012) — control·maintenance는 전국
  const [leases, sites, devices, users] = await Promise.all([
    api.leases(scope),
    api.sites(scope),
    api.devices(scope),
    api.users(),
  ]);
  return { leases, sites, devices, users, lease: url.searchParams.get('lease') };
};
