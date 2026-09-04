<script lang="ts">
  import { cx, FOCUS } from '../lib/cx';
  import type { NavItem } from './nav';
  // PWA 하단 내비 56 + safe-area · 항목 3~5 · label-sm · 선택 = accent-fg (cmp.nav.bottomnav)
  let { items }: { items: NavItem[] } = $props();
</script>

<nav
  class="border-border-subtle bg-surface sticky bottom-0 flex h-[calc(var(--spacing-layout-bottomnav-height)+env(safe-area-inset-bottom))] shrink-0 items-stretch border-t pb-[env(safe-area-inset-bottom)]"
  style="z-index: var(--sys-z-nav)"
  aria-label="하단 내비게이션"
>
  {#each items as it (it.id)}
    <a
      href={it.href}
      aria-current={it.active ? 'page' : undefined}
      class={cx(
        'min-w-size-touch-min text-label-sm gap-stack-xs relative flex flex-1 flex-col items-center justify-center',
        FOCUS,
        it.active ? 'text-accent-fg' : 'text-fg-muted',
        it.disabled && 'pointer-events-none opacity-40',
      )}
    >
      {#if it.icon}<it.icon size={24} aria-hidden="true" />{:else}<span
          class="size-size-icon-lg rounded-mark bg-current opacity-30"
          aria-hidden="true"
        ></span>{/if}
      <span>{it.label}</span>
      {#if it.badge}<span
          class="rounded-pill bg-danger text-label-sm text-danger-on-solid top-stack-xs px-inline-xs absolute right-[calc(50%-var(--spacing-size-icon-lg))]"
          >{it.badge}</span
        >{/if}
    </a>
  {/each}
</nav>
