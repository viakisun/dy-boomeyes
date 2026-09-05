// A2-04 내 장비 — 텔레메트리 · 소모품 도달률 (specs/driver-daily AC-5)
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const userId = session.user?.userId ?? 'driver03';
  const today = await api.today(userId);
  const cameras = today.device ? await api.cameras(today.device.id) : [];
  return { today, cameras };
};
