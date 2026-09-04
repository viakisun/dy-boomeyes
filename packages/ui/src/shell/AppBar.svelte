<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx, FOCUS } from '../lib/cx';
  // PWA 앱바 56 — 뒤로 · 제목(heading-md) · 우측 1~2 액션 (CE headerWrap 참조)
  let {
    title,
    back,
    align = 'left',
    actions,
    logo,
  }: {
    title?: string;
    back?: { href: string; label?: string };
    align?: 'left' | 'center';
    actions?: Snippet;
    logo?: Snippet;
  } = $props();
</script>

<header
  class="h-layout-appbar-height gap-inline-sm border-border-subtle bg-surface px-inset-sm sticky top-0 flex shrink-0 items-center border-b pt-[env(safe-area-inset-top)]"
  style="z-index: var(--sys-z-nav)"
>
  {#if back}<a
      href={back.href}
      class={cx('size-size-control-md rounded-control text-fg inline-flex items-center justify-center', FOCUS)}
      aria-label={back.label ?? '뒤로'}>‹</a
    >{/if}
  {#if logo}{@render logo()}{/if}
  {#if title}<h1 class={cx('text-heading-md min-w-0 flex-1 truncate', align === 'center' && 'text-center')}>
      {title}
    </h1>{:else}<span class="flex-1"></span>{/if}
  {#if actions}<div class="gap-inline-xs flex items-center">{@render actions()}</div>{/if}
</header>
