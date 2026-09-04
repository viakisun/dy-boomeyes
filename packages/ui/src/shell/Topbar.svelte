<script lang="ts">
  import type { Snippet } from 'svelte';
  // 웹 상단 바 48 — 브레드크럼 · 검색 · 액션 (페이지 제목은 본문 PageHeader)
  let {
    crumbs = [],
    search,
    actions,
  }: { crumbs?: { label: string; href?: string }[]; search?: Snippet; actions?: Snippet } = $props();
</script>

<header
  class="h-layout-topbar-height gap-inline-md border-border-subtle bg-surface px-inset-lg flex shrink-0 items-center border-b"
  style="z-index: var(--sys-z-nav)"
>
  <nav aria-label="경로" class="gap-inline-xs text-body-sm text-fg-muted flex items-center">
    {#each crumbs as c, i (i)}
      {#if i > 0}<span aria-hidden="true">/</span>{/if}
      {#if c.href}<a class="hover:text-fg" href={c.href}>{c.label}</a>{:else}<span class="text-fg">{c.label}</span>{/if}
    {/each}
  </nav>
  <div class="gap-inline-sm ml-auto flex items-center">
    {#if search}{@render search()}{/if}
    {#if actions}{@render actions()}{/if}
  </div>
</header>
