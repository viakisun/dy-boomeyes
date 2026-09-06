// 내비 계산 — SCREENS(ids.ts) × 역할 × 웨이브 · 아이콘(§11.5) · 표면 이름(§12.1-7). ui는 SvelteKit $app에 의존하지 않으므로 href는 앱이 resolve()를 넘긴다
import type { Component } from 'svelte';
import { CURRENT_WAVE, SCREENS, SURFACE_NAME, type RoleId, type ScrId, type SurfaceId } from '@boomeyes/domain';
import { NAV_SHORT_LABEL } from '../lib/labels';
import { NAV_ICON } from './nav-icons';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: Component;
  active?: boolean;
  badge?: number;
  disabled?: boolean;
}
export interface NavGroup {
  label?: string;
  items: NavItem[];
}
export interface Crumb {
  label: string;
  href?: string;
}

/** 내비에 넣지 않는 화면 — 로그인 · 모달(B1-02M) · 상세·시트·입력(목록·카드에서 진입) */
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
  const bySurface = new Map<SurfaceId, NavItem[]>();
  for (const [id, s] of Object.entries(SCREENS) as [ScrId, (typeof SCREENS)[ScrId]][]) {
    if (s.app !== app || !(s.roles as readonly string[]).includes(role) || HIDDEN.includes(id) || s.route.includes('['))
      continue;
    const items = bySurface.get(s.surface) ?? [];
    bySurface.set(s.surface, items);
    items.push({
      id,
      label: app === 'pwa' ? (NAV_SHORT_LABEL[id] ?? s.name) : s.name, // 하단 내비 라벨은 ≤ 4자(§10-2) · 앱바 제목은 화면 이름
      href: resolve(s.route),
      icon: NAV_ICON[id],
      active: id === currentScr,
      disabled: s.wave > CURRENT_WAVE && id !== currentScr, // 현재 화면은 비활성 처리하지 않는다(대비·포커스)
    });
  }
  return [...bySurface.entries()].map(([surface, items]) => ({ label: SURFACE_NAME[surface], items }));
}

/** 상세 화면의 부모 — 브레드크럼 가운데 조각(링크). 뒤로 가기는 브레드크럼이 담당하고 본문에는 뒤로 링크를 두지 않는다(§11.1) */
const PARENT: Partial<Record<ScrId, ScrId>> = {
  'B1-08': 'B1-02',
  'B2-03': 'B2-02',
  'B4-08': 'B4-07',
  'B1-02M': 'B1-02',
};

/** 브레드크럼 — 표면 이름 / (부모 화면) / 화면 이름 (표면 코드는 화면에 내지 않는다) */
export function crumbsFor(screen: ScrId, resolve: (path: string) => string): Crumb[] {
  const s = SCREENS[screen];
  const parent = PARENT[screen];
  return [
    { label: SURFACE_NAME[s.surface] },
    ...(parent ? [{ label: SCREENS[parent].name, href: resolve(SCREENS[parent].route) }] : []),
    { label: s.name },
  ];
}
