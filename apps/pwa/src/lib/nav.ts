// 내비 계산 — SCREENS(ids.ts) × 역할 × 웨이브. ui는 항목만 받는다.
import { CURRENT_WAVE, SCREENS, type RoleId, type ScrId } from '@boomeyes/domain';
import type { NavGroup, NavItem } from '@boomeyes/ui';

const HIDDEN: ScrId[] = [
  'B0-01',
  'B1-02M',
  'A1-01',
  'A2-01',
  'A3-01',
  'A4-01',
  'A1-03',
  'A1-05',
  'A1-08',
  'A1-11',
  'A2-03',
  'A2-09',
  'A3-03',
  'A3-04',
  'B1-08',
  'B2-03',
  'B4-08',
];
export function navFor(
  role: RoleId,
  app: 'web' | 'pwa',
  currentScr: ScrId | undefined,
  resolve: (path: string) => string,
): NavGroup[] {
  const bySurface = new Map<string, NavItem[]>();
  for (const [id, s] of Object.entries(SCREENS) as [ScrId, (typeof SCREENS)[ScrId]][]) {
    if (s.app !== app || !(s.roles as readonly string[]).includes(role) || HIDDEN.includes(id) || s.route.includes('['))
      continue;
    const items = bySurface.get(s.surface) ?? [];
    bySurface.set(s.surface, items);
    items.push({
      id,
      label: s.name,
      href: resolve(s.route),
      active: id === currentScr,
      disabled: s.wave > CURRENT_WAVE && id !== currentScr, // 현재 화면은 비활성 처리하지 않는다(대비·포커스)
    });
  }
  return [...bySurface.entries()].map(([surface, items]) => ({ label: surface, items }));
}
