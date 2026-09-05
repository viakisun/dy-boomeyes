// B4-07 부품 대장 — 부품 5(CPB-003) · 이력 · 재고 · ?part= 선택 (specs/equipment-parts AC-1 · W2 구조 DISC-044)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const scope = { role: 'ops-admin' as const };
  const [parts, events, stock, devices] = await Promise.all([
    api.parts(scope),
    api.partEvents(),
    api.stock(),
    api.devices(scope),
  ]);
  return { parts, events, stock, devices, part: url.searchParams.get('part') };
};
