<script lang="ts">
  // 칩(카탈로그 Chip, CE Chip) — variant filter: 토글 버튼(aria-pressed) · count · selected/disabled · size sm(기본)/md
  import type { Snippet } from 'svelte';
  import { cx, FOCUS } from '../lib/cx';
  let {
    selected = false,
    count,
    disabled = false,
    size = 'sm',
    onclick,
    class: cls,
    children,
  }: {
    selected?: boolean;
    count?: number;
    disabled?: boolean;
    size?: 'sm' | 'md';
    onclick?: () => void;
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<button
  type="button"
  aria-pressed={selected}
  {disabled}
  {onclick}
  class={cx(
    'rounded-pill gap-inline-sm duration-fast inline-flex items-center border whitespace-nowrap transition-colors',
    size === 'md' ? 'h-size-control-md px-inset-md text-body-sm' : 'h-size-control-sm px-inset-sm text-label-md',
    selected
      ? 'border-accent-border-strong bg-accent-bg-subtle text-accent-fg'
      : 'border-border bg-surface text-fg-muted hover:bg-ui-hover',
    disabled && 'cursor-not-allowed opacity-40',
    FOCUS,
    cls,
  )}
>
  {@render children?.()}
  {#if count !== undefined}<span class="text-label-sm tabular-nums">{count}</span>{/if}
</button>
