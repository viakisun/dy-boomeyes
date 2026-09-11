import { scopeOf, todayM3 } from '@boomeyes/domain';
import { session } from '$lib/session.svelte';
import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, url }) => {
  const { api, clock } = await parent();
  const scope = scopeOf(session.user); // 세션 역할 + 소유주면 ownerId(ADR-012) — owner는 보유 호기만
  const [devices, sites, cameras, alerts, cases, kpis] = await Promise.all([
    api.devices(scope),
    api.sites(scope),
    api.cameras(),
    api.alerts(scope),
    api.cases(scope),
    api.kpis(scope),
  ]);
  // 소유주 KPI 첫 줄(ADR-012 §후속 5 · FR-039 · specs/control-dashboard AC-9) — 보유 호기 전체 집계는 여기서 1회(결정성 · 화면은 그리기만)
  const now = clock.now();
  const withPour = devices.filter((d) => d.pour);
  const fleet = {
    count: withPour.length,
    utilization: withPour.length
      ? Math.round((withPour.reduce((s, d) => s + d.pour!.utilization, 0) / withPour.length) * 100)
      : 0,
    todayM3: Math.round(withPour.reduce((s, d) => s + todayM3(d.pour!.buckets, now), 0) * 10) / 10,
    pouring: withPour.filter((d) => (d.pour!.buckets.at(-1)?.m3 ?? 0) > 0).length,
  };
  return { devices, sites, cameras, alerts, cases, kpis, fleet, cam: url.searchParams.get('cam') };
};
