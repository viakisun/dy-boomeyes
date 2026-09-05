<script lang="ts">
  // 이력 타임라인 — ENT-09 append-only (시각 · 행위자 · 내용 · 메모). 최신이 위
  import type { HistoryItem } from '@boomeyes/domain';
  import { cx } from '../lib/cx';
  import { fmtDateTime } from '../lib/format';
  let {
    items,
    newestFirst = true,
    class: cls,
  }: { items: HistoryItem[]; newestFirst?: boolean; class?: string } = $props();
  const ordered = $derived(newestFirst ? [...items].reverse() : items);
</script>

<ol class={cx('gap-stack-sm flex flex-col', cls)} aria-label="이력">
  {#each ordered as h, i (h.at + h.action + i)}
    <li class="gap-inline-sm flex items-start">
      <span class="pt-stack-xs flex flex-col items-center self-stretch" aria-hidden="true">
        <span class={cx('size-size-indicator rounded-pill', i === 0 ? 'bg-accent' : 'bg-border-strong')}></span>
        {#if i < ordered.length - 1}<span class="bg-border-subtle mt-stack-xs w-px flex-1"></span>{/if}
      </span>
      <div class="gap-stack-xs flex min-w-0 flex-1 flex-col">
        <span class="text-body-md text-fg">{h.action}</span>
        {#if h.note}<span class="text-body-sm text-fg-muted">{h.note}</span>{/if}
        <span class="text-label-sm text-fg-muted tabular-nums">{fmtDateTime(h.at)} · {h.by}</span>
      </div>
    </li>
  {/each}
</ol>
