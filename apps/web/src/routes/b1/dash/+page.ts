import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const scope = { role: 'control' as const };
  const [devices, sites, cameras, alerts, cases, kpis] = await Promise.all([
    api.devices(scope),
    api.sites(scope),
    api.cameras(),
    api.alerts(scope),
    api.cases(scope),
    api.kpis(scope),
  ]);
  return { devices, sites, cameras, alerts, cases, kpis, cam: url.searchParams.get('cam') };
};
