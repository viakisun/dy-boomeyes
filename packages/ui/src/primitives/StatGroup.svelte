<script lang="ts">
  // 요약 지표 묶음(카탈로그 StatGroup, DY-design §11.4) — 최대 4(보고는 6), 폭을 늘려 채우지 않는다: 열 폭 = layout.stat.width, 좌측 정렬 · 모바일 2열
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    cols = 4,
    label,
    class: cls,
    children,
  }: { cols?: 4 | 6; label?: string; class?: string; children?: Snippet } = $props();
</script>

<div
  class={cx(
    'gap-inline-md grid grid-cols-2',
    cols === 6
      ? 'md:grid-cols-3 xl:grid-cols-[repeat(6,minmax(0,var(--spacing-layout-stat-width)))]'
      : 'md:grid-cols-[repeat(4,minmax(0,var(--spacing-layout-stat-width)))]',
    cls,
  )}
  aria-label={label}
>
  {@render children?.()}
</div>
