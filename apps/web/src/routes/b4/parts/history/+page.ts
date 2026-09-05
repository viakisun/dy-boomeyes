// B4-08 점검·교체 이력 — 전 이력(부품·시각 정렬) · 구분 칩 ?kind= (specs/equipment-parts AC-4)
import type { PartEvent } from '@boomeyes/domain';
import type { PageLoad } from './$types';

const KINDS: PartEvent['kind'][] = ['inspect', 'replace', 'discard', 'install', 'register'];
export const load: PageLoad = async ({ parent, url }) => {
  const { api } = await parent();
  const [events, parts] = await Promise.all([api.partEvents(), api.parts({ role: 'ops-admin' })]);
  const k = url.searchParams.get('kind');
  return {
    events,
    parts,
    kind: KINDS.includes(k as PartEvent['kind']) ? (k as PartEvent['kind']) : 'all',
    kinds: KINDS,
    event: url.searchParams.get('event'),
  };
};
