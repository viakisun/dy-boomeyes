// A2-03 일일점검 — 5항목 제출 (specs/driver-daily AC-3)
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const userId = session.user?.userId ?? 'driver03';
  const today = await api.today(userId);
  return { today, userId };
};
