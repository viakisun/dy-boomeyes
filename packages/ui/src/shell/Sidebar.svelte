<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx, FOCUS } from '../lib/cx';
  import type { NavGroup } from './nav';
  // 웹 사이드바 — 240 / 접힘 56 · 항목 32(compact) · 선택 = bg-selected (DY-design §9 · cmp.nav.sidebar)
  // brand 스니펫은 접힘 여부를 받는다(접힘 = 글리프만, §13) · 접힘 헤더는 세로 적층(글리프 / 토글 — 56px에 한 줄로 안 들어간다)
  let {
    groups,
    collapsed = $bindable(false),
    brand,
    footer,
  }: { groups: NavGroup[]; collapsed?: boolean; brand?: Snippet<[collapsed: boolean]>; footer?: Snippet } = $props();
</script>

<aside
  class={cx(
    'border-border-subtle bg-canvas ease-standard duration-base flex h-full shrink-0 flex-col border-r transition-[width]',
    collapsed ? 'w-layout-sidebar-collapsed' : 'w-layout-sidebar-width',
  )}
  style="z-index: var(--sys-z-nav)"
  aria-label="주 내비게이션"
>
  <div
    class={cx(
      'px-inset-sm flex',
      collapsed
        ? 'gap-stack-xs py-inset-xs flex-col items-center'
        : 'h-layout-topbar-height gap-inline-sm items-center',
    )}
  >
    {#if brand}{@render brand(collapsed)}{/if}
    <button
      type="button"
      class={cx(
        'size-size-control-sm rounded-control text-fg-muted hover:bg-ui-hover inline-flex items-center justify-center',
        !collapsed && 'ml-auto',
        FOCUS,
      )}
      aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
      aria-expanded={!collapsed}
      onclick={() => (collapsed = !collapsed)}>{collapsed ? '»' : '«'}</button
    >
  </div>
  <nav class="gap-stack-md px-inset-xs py-inset-sm flex flex-1 flex-col overflow-y-auto">
    {#each groups as g, gi (gi)}
      <div class="gap-stack-xs flex flex-col">
        {#if g.label && !collapsed}<div class="px-inset-sm text-label-sm text-fg-muted pb-stack-xs uppercase">
            {g.label}
          </div>{/if}
        {#each g.items as it (it.id)}
          <a
            href={it.href}
            aria-current={it.active ? 'page' : undefined}
            aria-disabled={it.disabled || undefined}
            title={collapsed ? it.label : undefined}
            class={cx(
              'h-size-control-md gap-inline-sm rounded-control px-inset-sm text-label-lg duration-fast flex items-center transition-colors',
              FOCUS,
              it.active ? 'bg-selected text-accent-fg-strong' : 'text-fg-muted hover:bg-ui-hover hover:text-fg',
              it.disabled && 'pointer-events-none opacity-40',
              collapsed && 'justify-center px-0',
            )}
          >
            <it.icon class="size-size-icon-md shrink-0" aria-hidden="true" />
            {#if !collapsed}<span class="flex-1 truncate">{it.label}</span>{#if it.badge}<span
                  class="rounded-pill bg-danger text-label-sm text-danger-on-solid px-inline-xs">{it.badge}</span
                >{/if}{/if}
          </a>
        {/each}
      </div>
    {/each}
  </nav>
  {#if footer}<div class="border-border-subtle p-inset-sm border-t">{@render footer()}</div>{/if}
</aside>
