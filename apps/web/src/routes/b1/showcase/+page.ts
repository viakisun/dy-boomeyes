// B1-07 쇼케이스 — 읽기 전용 집계(showcase) + 카메라 월 · control 스코프 (specs/owner-showcase AC-1~3 · 장면 10)
import { scopeOf } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const scope = scopeOf(session.user); // 세션 역할 + 소유주면 ownerId(ADR-012)
  const [showcase, devices, sites, cameras] = await Promise.all([
    api.showcase(scope),
    api.devices(scope),
    api.sites(scope),
    api.cameras(),
  ]);
  return { showcase, devices, sites, cameras };
};
