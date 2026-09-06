<script lang="ts">
  // 이력 타임라인 — ENT-09 append-only (시각 · 행위자 · 내용 · 메모). 최신이 위
  import type { HistoryItem } from '@boomeyes/domain';
  import { cx } from '../lib/cx';
  import { fmtDateTime } from '../lib/format';
  import Badge from './Badge.svelte';
  let {
    items,
    newestFirst = true,
    label = '이력',
    class: cls,
  }: {
    /** tag가 있으면 행 앞에 배지(기록 화면의 유형·현장) */
    items: (HistoryItem & { tag?: string })[];
    /** items가 이미 최신순이면 false */
    newestFirst?: boolean;
    label?: string;
    class?: string;
  } = $props();
  const ordered = $derived(newestFirst ? [...items].reverse() : items);
</script>

<ol class={cx('gap-stack-sm flex flex-col', cls)} aria-label={label}>
  {#each ordered as h, i (h.at + h.action + i)}
    <li class="gap-inline-sm flex items-start">
      <span class="pt-stack-xs flex flex-col items-center self-stretch" aria-hidden="true">
        <span class="size-size-indicator rounded-mark bg-border-strong"></span>
        {#if i < ordered.length - 1}<span class="bg-border-subtle mt-stack-xs w-px flex-1"></span>{/if}
      </span>
      <div class="gap-stack-xs flex min-w-0 flex-1 flex-col">
        <span class="text-body-md text-fg"
          >{#if h.tag}<Badge tone="neutral" variant="outline" class="mr-inline-sm">{h.tag}</Badge>{/if}{h.action}</span
        >
        {#if h.note}<span class="text-body-sm text-fg-muted">{h.note}</span>{/if}
        <span class="text-label-sm text-fg-muted tabular-nums">{fmtDateTime(h.at)} · {h.by}</span>
      </div>
    </li>
  {/each}
</ol>
