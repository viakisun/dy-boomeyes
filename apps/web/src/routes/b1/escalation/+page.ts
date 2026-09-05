// B1-04 에스컬레이션 — 1h 미접수 업무 · 통보 (specs/task-escalation AC-7)
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const [escalations, sites] = await Promise.all([
    api.escalations(),
    api.sites({ role: session.user?.role ?? ('control' as const) }),
  ]);
  return { escalations, sites };
};
