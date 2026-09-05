<script lang="ts" generics="T">
  // 데이터 표 — 행 밀도(default 48 / dense 36) · 행 포커스 + Enter/Space 선택 · aria-selected (cmp.table)
  import type { Snippet } from 'svelte';
  import { cx, FOCUS } from '../lib/cx';
  import type { Column } from '../lib/table';
  let {
    columns,
    rows,
    rowKey,
    cell,
    selectedKey,
    onselect,
    dense = false,
    caption,
    class: cls,
  }: {
    columns: Column[];
    rows: T[];
    rowKey: (row: T) => string;
    cell: Snippet<[T, Column]>;
    selectedKey?: string | null;
    onselect?: (row: T) => void;
    dense?: boolean;
    caption?: string;
    class?: string;
  } = $props();
  const pick = (row: T) => onselect?.(row);
  const onkey = (e: KeyboardEvent, row: T) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(row);
    }
  };
</script>

<div class={cx('rounded-card border-border bg-surface overflow-x-auto border', cls)}>
  <table class="text-body-md w-full">
    {#if caption}<caption class="sr-only">{caption}</caption>{/if}
    <thead class="text-label-md text-fg-muted">
      <tr class="border-border-subtle border-b">
        {#each columns as c (c.key)}
          <th
            scope="col"
            class={cx(
              'px-inset-md font-medium whitespace-nowrap',
              dense ? 'h-size-row-dense' : 'h-size-row-default',
              c.align === 'right' ? 'text-right' : 'text-left',
            )}>{c.label}</th
          >
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row (rowKey(row))}
        <tr
          class={cx(
            'border-border-subtle border-b last:border-b-0',
            dense ? 'h-size-row-dense' : 'h-size-row-default',
            onselect && cx('hover:bg-ui cursor-pointer', FOCUS),
            selectedKey === rowKey(row) && 'bg-selected',
          )}
          tabindex={onselect ? 0 : undefined}
          aria-selected={onselect ? selectedKey === rowKey(row) : undefined}
          onclick={() => pick(row)}
          onkeydown={(e) => onkey(e, row)}
        >
          {#each columns as c (c.key)}
            <td class={cx('px-inset-md', c.align === 'right' ? 'text-right tabular-nums' : 'text-left')}
              >{@render cell(row, c)}</td
            >
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
