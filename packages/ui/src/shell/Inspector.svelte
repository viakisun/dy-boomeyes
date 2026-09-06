<script lang="ts">
  // 웹 우측 인스펙터(카탈로그 Inspector) — 목록 선택 시 상세. 2열 그리드(`xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]`)의 오른쪽 칸
  // footer = 하단 액션 행(주 1 · 보조 1, 우측 정렬 — DY-design §11.1 인스펙터 골격)
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    label,
    class: cls,
    children,
    footer,
  }: { label: string; class?: string; children?: Snippet; footer?: Snippet } = $props();
</script>

<aside
  class={cx(
    'rounded-card border-border bg-surface p-inset-lg gap-stack-md sticky top-0 hidden h-fit flex-col border xl:flex',
    cls,
  )}
  aria-label={label}
>
  {@render children?.()}
  {#if footer}<div
      class="border-border-subtle gap-inline-sm pt-inset-md flex flex-wrap items-center justify-end border-t"
    >
      {@render footer()}
    </div>{/if}
</aside>
