// A2-09 교체·폐기 처리(W2 구조) — 내 장비 부품 중 due(교체)·replaced(폐기) · 재고 (specs/equipment-parts AC-3)
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId) ?? users.find((u) => u.role === 'driver');
  const today = await api.today(me?.id ?? 'driver03');
  const [all, stock, events] = await Promise.all([
    api.parts({ role: 'driver', siteIds: me?.siteIds }),
    api.stock(),
    api.partEvents(),
  ]);
  const parts = all.filter((p) => !today.device || p.deviceId === today.device.id);
  return { me, parts, stock, events, part: url.searchParams.get('part') };
};
