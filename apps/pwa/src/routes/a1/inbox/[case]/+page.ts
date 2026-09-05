// A1-03 업무 상세 — 업무 · 장비 요약 · 이력 (specs/task-escalation AC-3 · AC-4)
import { error } from '@sveltejs/kit';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
  const { api } = await parent();
  const c = await api.case(params.case);
  if (!c) error(404, `업무 ${params.case} 없음`);
  const [device, sites] = await Promise.all([
    c.deviceId ? api.device(c.deviceId) : Promise.resolve(undefined),
    api.sites({ role: session.user?.role ?? ('site-safety' as const) }),
  ]);
  return { task: c, device, site: sites.find((s) => s.id === c.siteId) };
};
