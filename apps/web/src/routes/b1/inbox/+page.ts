// B1-03 수신함 — 신청·요청 승인/반려 · ?case= 로 열린 업무 패널 (specs/task-escalation AC-6)
import { session } from '$lib/session.svelte';
import { scopeOf } from '@boomeyes/domain';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const scope = scopeOf(session.user); // 역할 + 소유주면 ownerId(ADR-012) — control·maintenance는 전국
  const [requests, sites, users] = await Promise.all([api.requests(scope), api.sites(scope), api.users()]);
  const caseId = url.searchParams.get('case') ?? (url.searchParams.get('state') === 'report' ? 'C-107' : null); // ?state=report 픽스처(FR-038)
  const focus = caseId ? await api.case(caseId) : undefined;
  const focusEvent = focus?.eventId ? await api.event(focus.eventId) : undefined; // 영상 확보 상태(ENT-19)
  return { requests, sites, users, focus, focusEvent, req: url.searchParams.get('req') };
};
