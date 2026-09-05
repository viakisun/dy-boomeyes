// A2-06 메뉴·현장 정보(운전자) — 배정 현장 기본정보 · 동의 요약(ENT-15) · 앱 정보, 편집 없음 (specs/sites-assets-leases AC-6 · driver-daily AC-7)
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const users = await api.users();
  const me = users.find((u) => u.id === session.user?.userId) ?? users.find((u) => u.role === 'driver');
  const today = await api.today(me?.id ?? 'driver03');
  const safety = users.find((u) => u.id === today.site?.safetyUserId);
  return { today, safety };
};
