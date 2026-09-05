<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx, FOCUS } from '../lib/cx';
  let {
    variant = 'default',
    selected = false,
    padding = 'md',
    as = 'div',
    class: cls,
    header,
    footer,
    children,
    ...rest
  }: HTMLAttributes<HTMLElement> & {
    variant?: 'default' | 'interactive' | 'brand' | 'flat';
    selected?: boolean;
    padding?: 'none' | 'sm' | 'md';
    as?: 'div' | 'article' | 'section' | 'button' | 'a';
    class?: string;
    header?: Snippet;
    footer?: Snippet;
    children?: Snippet;
  } = $props();
  const PAD = { none: '', sm: 'p-inset-md', md: 'p-inset-lg' };
</script>

<svelte:element
  this={as}
  class={cx(
    'gap-stack-md rounded-card flex flex-col border text-left',
    PAD[padding],
    // selected는 기본 배경·테두리 대신 적용 (같은 속성 유틸리티 충돌 방지 — Tailwind는 알파벳 순으로 뒤 클래스가 이김)
    selected
      ? 'border-accent-border-strong bg-selected'
      : variant === 'brand'
        ? 'border-accent-border bg-accent-bg-subtle'
        : variant === 'flat'
          ? 'bg-surface-sunken border-transparent'
          : 'border-border bg-surface',
    variant === 'interactive' &&
      cx('hover:border-border-strong hover:shadow-raised duration-base cursor-pointer transition-shadow', FOCUS),
    cls,
  )}
  aria-pressed={as === 'button' && selected ? true : undefined}
  {...rest}
>
  {#if header}<div class="gap-inline-md flex items-start justify-between">{@render header()}</div>{/if}
  {@render children?.()}
  {#if footer}<div class="gap-inline-sm flex items-center justify-end">{@render footer()}</div>{/if}
</svelte:element>
