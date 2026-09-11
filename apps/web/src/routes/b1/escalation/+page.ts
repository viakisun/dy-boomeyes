// B1-04 에스컬레이션 — 1h 미접수 업무 · 통보 (specs/task-escalation AC-7)
import { session } from '$lib/session.svelte';
import { scopeOf } from '@boomeyes/domain';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const [escalations, sites] = await Promise.all([
    api.escalations(),
    api.sites(scopeOf(session.user)), // 역할 + 소유주면 ownerId(ADR-012) — B1 loader 공통
  ]);
  return { escalations, sites };
};
