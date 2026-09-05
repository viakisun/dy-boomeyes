// B1-03 수신함 — 신청·요청 승인/반려 · ?case= 로 열린 업무 패널 (specs/task-escalation AC-6)
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const scope = { role: session.user?.role ?? ('control' as const) }; // control·maintenance 전국
  const [requests, sites, users] = await Promise.all([api.requests(scope), api.sites(scope), api.users()]);
  const caseId = url.searchParams.get('case');
  const focus = caseId ? await api.case(caseId) : undefined;
  return { requests, sites, users, focus, req: url.searchParams.get('req') };
};
