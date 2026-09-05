<script lang="ts">
  // 키-값 목록(카탈로그 KeyValueList, CE 카드 규칙) — 라벨 muted · 값 default · 행 간 stack.xs · columns 1/2
  import { cx } from '../lib/cx';
  let {
    items,
    columns = 1,
    label,
    class: cls,
  }: {
    items: { label: string; value: string; muted?: boolean }[];
    columns?: 1 | 2;
    label?: string;
    class?: string;
  } = $props();
</script>

<dl
  class={cx(
    'gap-x-inline-md gap-y-stack-xs grid',
    columns === 2 ? 'grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]' : 'grid-cols-[auto_minmax(0,1fr)]',
    cls,
  )}
  aria-label={label}
>
  {#each items as it (it.label)}
    <dt class="text-label-md text-fg-muted">{it.label}</dt>
    <dd class={cx('text-body-md', it.muted && 'text-fg-muted')}>{it.value}</dd>
  {/each}
</dl>
