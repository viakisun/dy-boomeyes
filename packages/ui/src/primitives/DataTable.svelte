<script lang="ts" generics="T">
  // 데이터 표(DY-design §11.2) — 행 밀도(compact: default 36 / dense 32) · 열 kind별 서식(식별자 code-md·nowrap · 수치 우측 tabular · 텍스트 1줄 truncate) · 행 포커스 + Enter/Space 선택 · aria-selected (cmp.table)
  import type { Snippet } from 'svelte';
  import { cx, FOCUS } from '../lib/cx';
  import type { Column, ColumnKind } from '../lib/table';
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
  const KIND: Record<ColumnKind, { th: string; td: string }> = {
    id: { th: 'w-px', td: 'text-code-md whitespace-nowrap' },
    num: { th: 'w-px text-right', td: 'text-right tabular-nums whitespace-nowrap' },
    date: { th: 'w-px', td: 'tabular-nums whitespace-nowrap' },
    status: { th: 'w-px', td: 'whitespace-nowrap' },
    text: { th: '', td: '' },
  };
  const kindOf = (c: Column): ColumnKind => c.kind ?? (c.align === 'right' ? 'num' : 'text');
  const thClass = (c: Column) => cx(KIND[kindOf(c)].th, kindOf(c) === 'text' && c.nowrap && 'w-px');
  const tdClass = (c: Column) =>
    cx(KIND[kindOf(c)].td, kindOf(c) === 'text' && (c.nowrap ? 'whitespace-nowrap' : 'w-full max-w-0 truncate')); // w-full + max-w-0: 남는 폭은 텍스트 열이 받고, 넘치면 1줄로 자른다
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
              'px-inset-md text-left font-medium whitespace-nowrap',
              dense ? 'h-size-row-dense' : 'h-size-row-default',
              thClass(c),
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
            <td class={cx('px-inset-md text-left', tdClass(c))}>{@render cell(row, c)}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
