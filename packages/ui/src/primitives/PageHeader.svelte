<script lang="ts">
  // 페이지 헤더(카탈로그 PageHeader, Linear) — 제목 · 설명 · 우측 액션 · 아래 탭 슬롯
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    title,
    description,
    actions,
    children,
    class: cls,
  }: { title: string; description?: string; actions?: Snippet; children?: Snippet; class?: string } = $props();
</script>

<header class={cx('gap-stack-sm flex flex-col', cls)}>
  <div class="gap-inline-md flex items-start justify-between">
    <div class="gap-stack-xs flex flex-col">
      <h1 class="text-heading-xl">{title}</h1>
      {#if description}<p class="text-body-sm text-fg-muted">{description}</p>{/if}
    </div>
    {#if actions}<div class="gap-inline-sm flex shrink-0 items-center">{@render actions()}</div>{/if}
  </div>
  {@render children?.()}
</header>
