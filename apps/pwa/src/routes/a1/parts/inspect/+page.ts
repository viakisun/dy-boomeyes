// A1-11 부품 점검 입력(W2 구조) — 내 현장 부품 · ?part= 선택 유지 (specs/equipment-parts AC-2)
import type { RoleId } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId);
  const scope = { role: (me?.role ?? 'site-safety') as RoleId, siteIds: me?.siteIds };
  const [parts, events] = await Promise.all([api.parts(scope), api.partEvents()]);
  return { parts, events, part: url.searchParams.get('part') };
};
