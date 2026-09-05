// A2-02 오늘 — 출근 · 점검 배너 · 배정 장비 · 알림 · 촬영/동의 (specs/driver-daily AC-1 · AC-2 · AC-4 · AC-6)
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const userId = session.user?.userId ?? 'driver03';
  const today = await api.today(userId);
  return { today, userId, gpsOut: url.searchParams.get('gps') === 'out' };
};
