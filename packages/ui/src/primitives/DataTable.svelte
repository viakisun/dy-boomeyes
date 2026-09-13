<script lang="ts" generics="T">
  // 데이터 표(DY-design §11.2) — 행 밀도(compact: default 36 / dense 32) · 열 kind별 서식(식별자 code-md·nowrap · 수치 우측 tabular · 텍스트 1줄 truncate) · 행 포커스 + Enter/Space 선택 · aria-selected (cmp.table)
  import type { Snippet } from 'svelte';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
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
    sort,
    onsort,
    stickyHead = false,
    rowAttrs,
    isSelected,
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
    /** 지금 정렬된 열과 방향 — sortable 열의 머리글에 aria-sort로 나타난다 */
    sort?: { key: string; dir: 'asc' | 'desc' };
    /** 머리글을 눌렀다 — 같은 열이면 방향을 뒤집는 것은 호출부가 정한다 */
    onsort?: (key: string) => void;
    /** 머리글을 스크롤 위쪽에 고정한다. 본문 칸은 static이라 z 유틸리티 없이도 위에 그려진다. */
    stickyHead?: boolean;
    /** 행에 붙일 데이터 속성 — 표와 카드가 같은 선택자로 잡히게(e2e·캡처) */
    rowAttrs?: (row: T) => Record<string, string>;
    /** 여러 행을 고르는 표(배정 후보)에서 선택 여부 — 없으면 selectedKey 하나만 본다 */
    isSelected?: (row: T) => boolean;
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
          {@const active = sort?.key === c.key}
          <th
            scope="col"
            aria-sort={c.sortable && onsort
              ? active
                ? sort.dir === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'
              : undefined}
            class={cx(
              'text-left font-medium whitespace-nowrap',
              c.sortable && onsort ? 'p-0' : 'px-inset-md',
              dense ? 'h-size-row-dense' : 'h-size-row-default',
              stickyHead && 'bg-surface sticky top-0',
              thClass(c),
            )}
          >
            {#if c.sortable && onsort}
              <button
                type="button"
                onclick={() => onsort(c.key)}
                class={cx('gap-inline-xs px-inset-md hover:text-fg flex h-full w-full items-center', FOCUS)}
              >
                <!-- 소유주 셸이 [data-owner-root] button의 줄바꿈을 허용한다(선택자가 더 강하다) — 라벨을 감싸 막는다 -->
                <span class="whitespace-nowrap">{c.label}</span>
                {#if active}
                  {#if sort.dir === 'asc'}<ArrowUp class="size-size-icon-sm shrink-0" aria-hidden="true" />{:else}
                    <ArrowDown class="size-size-icon-sm shrink-0" aria-hidden="true" />{/if}
                {:else}
                  <ChevronsUpDown class="size-size-icon-sm text-fg-subtle shrink-0" aria-hidden="true" />
                {/if}
              </button>
            {:else}{c.label}{/if}
          </th>
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
            (isSelected ? isSelected(row) : selectedKey === rowKey(row)) && 'bg-selected',
          )}
          tabindex={onselect ? 0 : undefined}
          aria-selected={isSelected ? isSelected(row) : onselect ? selectedKey === rowKey(row) : undefined}
          onclick={() => pick(row)}
          onkeydown={(e) => onkey(e, row)}
          {...rowAttrs?.(row)}
        >
          {#each columns as c (c.key)}
            <td class={cx('px-inset-md text-left', tdClass(c))}>{@render cell(row, c)}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
