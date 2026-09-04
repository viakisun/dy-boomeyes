// 내비 항목 타입 — 앱이 SCREENS(ids.ts)·역할·웨이브로 계산해 넘긴다 (ui는 SvelteKit $app에 의존하지 않는다)
import type { Component } from 'svelte';
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: Component;
  active?: boolean;
  badge?: number;
  disabled?: boolean;
}
export interface NavGroup {
  label?: string;
  items: NavItem[];
}
