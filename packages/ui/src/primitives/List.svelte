<script lang="ts" generics="T">
  // 목록 컨테이너(카탈로그 List) — <ul aria-label> + <li> 보장 · 카드 크롬은 여기 한 곳 · 행은 item 스니펫이 그린다.
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    items,
    key,
    item,
    label,
    variant = 'card',
    as = 'ul',
    header,
    footer,
    empty,
    class: cls,
  }: {
    items: T[];
    key: (it: T) => string;
    item: Snippet<[T, number]>;
    label: string;
    variant?: 'card' | 'plain';
    as?: 'ul' | 'ol';
    header?: Snippet;
    footer?: Snippet;
    empty?: Snippet;
    class?: string;
  } = $props();
</script>

{#if items.length === 0 && empty}
  {@render empty()}
{:else}
  <div class={cx(variant === 'card' && 'rounded-card bg-surface shadow-raised overflow-hidden', cls)}>
    {#if header}{@render header()}{/if}
    <svelte:element this={as} aria-label={label} class="divide-border-subtle divide-y">
      {#each items as it, i (key(it))}
        <li>{@render item(it, i)}</li>
      {/each}
    </svelte:element>
    {#if footer}{@render footer()}{/if}
  </div>
{/if}
