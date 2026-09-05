<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  import Sidebar from './Sidebar.svelte';
  import Topbar from './Topbar.svelte';
  import type { NavGroup } from './nav';
  // 3열 셸: 사이드바 240/56 · 탑바 48 · 콘텐츠(최대 1400, 여백 24) · 인스펙터 360 (DY-design §9)
  let {
    groups,
    crumbs = [],
    inspectorOpen = false,
    brand,
    footer,
    search,
    actions,
    inspector,
    children,
  }: {
    groups: NavGroup[];
    crumbs?: { label: string; href?: string }[];
    inspectorOpen?: boolean;
    brand?: Snippet;
    footer?: Snippet;
    search?: Snippet;
    actions?: Snippet;
    inspector?: Snippet;
    children?: Snippet;
  } = $props();
  let collapsed = $state(false);
</script>

<div class="bg-canvas text-fg flex h-dvh overflow-hidden">
  <Sidebar {groups} bind:collapsed {brand} {footer} />
  <div class="flex min-w-0 flex-1 flex-col">
    <Topbar {crumbs} {search} {actions} />
    <div class="flex min-h-0 flex-1">
      <main class="min-w-0 flex-1 overflow-y-auto">
        <div class="max-w-layout-container-max p-page-gutter mx-auto">{@render children?.()}</div>
      </main>
      {#if inspector}
        <aside
          class={cx(
            'border-border-subtle bg-surface ease-standard shrink-0 overflow-y-auto border-l transition-[width] duration-200',
            inspectorOpen ? 'w-layout-inspector-width' : 'w-0 border-l-0',
          )}
          aria-label="상세 패널"
          aria-hidden={!inspectorOpen}
        >
          {#if inspectorOpen}<div class="p-inset-lg">{@render inspector()}</div>{/if}
        </aside>
      {/if}
    </div>
  </div>
</div>
