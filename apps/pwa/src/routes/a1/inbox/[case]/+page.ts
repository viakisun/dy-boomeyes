// A1-03 업무 상세 — 업무 · 장비 요약 · 이력 (specs/task-escalation AC-3 · AC-4)
import { error } from '@sveltejs/kit';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, url }) => {
  const { api } = await parent();
  const c = await api.case(params.case);
  if (!c) error(404, `업무 ${params.case} 없음`);
  const [device, sites, doc] = await Promise.all([
    c.deviceId ? api.device(c.deviceId) : Promise.resolve(undefined),
    api.sites({ role: session.user?.role ?? ('site-safety' as const) }),
    c.docId ? api.doc(c.docId) : Promise.resolve(undefined),
  ]);
  const event = c.eventId ? await api.event(c.eventId) : undefined; // 영상 확보 상태(ENT-19) — 업무 상태와 별개
  // A1-08 완료 처리 시트 — 같은 경로의 모달형 화면(?sheet=complete, screens.yaml)
  return {
    task: c,
    event,
    device,
    site: sites.find((s) => s.id === c.siteId),
    sheet: url.searchParams.get('sheet') === 'complete',
    doc,
    review: url.searchParams.get('sheet') === 'review',
  };
};
