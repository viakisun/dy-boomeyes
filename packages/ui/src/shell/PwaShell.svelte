<script lang="ts">
  import type { Snippet } from 'svelte';
  import AppBar from './AppBar.svelte';
  import BottomNav from './BottomNav.svelte';
  import type { NavItem } from './nav';
  // PWA 셸: 앱바 56 · 콘텐츠(좌우 20) · 하단 내비 56+safe-area · 배너 슬롯 · 시트 호스트 (DY-design §10)
  let {
    title,
    back,
    align = 'left',
    tabs = [],
    offline = false,
    banner,
    actions,
    logo,
    sheet,
    bar,
    children,
  }: {
    title?: string;
    back?: { href: string; label?: string };
    align?: 'left' | 'center';
    tabs?: NavItem[];
    offline?: boolean;
    banner?: Snippet;
    actions?: Snippet;
    logo?: Snippet;
    sheet?: Snippet;
    /** 하단 내비 위 고정 바(시연 장면 바) */
    bar?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<div class="max-w-layout-frame-mobile bg-canvas text-fg mx-auto flex min-h-dvh w-full flex-col" data-capture-frame>
  <AppBar {title} {back} {align} {actions} {logo} />
  {#if offline}<div role="status" class="bg-neutral-bg px-page-gutter py-inset-xs text-body-sm text-neutral-fg">
      오프라인 — 저장한 작업은 연결 후 동기화됩니다
    </div>{/if}
  {#if banner}<div class="px-page-gutter pt-stack-sm">{@render banner()}</div>{/if}
  <main class="px-page-gutter py-stack-md flex-1">{@render children?.()}</main>
  {#if bar}{@render bar()}{/if}
  {#if tabs.length}<BottomNav items={tabs} />{/if}
  {#if sheet}{@render sheet()}{/if}
</div>
