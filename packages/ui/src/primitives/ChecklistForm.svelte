<script lang="ts">
  // 일일점검 체크리스트 — 항목 행 48px · 체크 = 정상, 미체크 = 이상 · 제출 (FR-014). fieldset/legend
  import type { InspectionItem } from '@boomeyes/domain';
  import { cx, FOCUS } from '../lib/cx';
  import Button from './Button.svelte';
  let {
    items = $bindable(),
    legend = '작업 전 일일점검',
    disabled = false,
    submitLabel = '점검 제출',
    onsubmit,
  }: {
    items: InspectionItem[];
    legend?: string;
    disabled?: boolean;
    submitLabel?: string;
    onsubmit?: (items: InspectionItem[]) => void;
  } = $props();
  const abnormal = $derived(items.filter((i) => !i.ok).length);
  const toggle = (id: string) => {
    items = items.map((i) => (i.id === id ? { ...i, ok: !i.ok } : i));
  };
</script>

<form class="gap-stack-md flex flex-col" onsubmit={(e) => e.preventDefault()}>
  <fieldset class="rounded-card border-border bg-surface border" {disabled}>
    <legend class="text-label-md text-fg-muted px-inset-md pt-inset-sm">{legend}</legend>
    <ul class="divide-border-subtle divide-y">
      {#each items as it (it.id)}
        <li>
          <label
            class={cx(
              'min-h-size-control-lg px-inset-md gap-inline-md flex cursor-pointer items-center',
              !it.ok && 'bg-warning-bg',
            )}
          >
            <input
              type="checkbox"
              class={cx('size-size-icon-lg rounded-mark border-border-emphasis accent-accent shrink-0', FOCUS)}
              checked={it.ok}
              onchange={() => toggle(it.id)}
              {disabled}
            />
            <span class="text-body-md flex-1">{it.label}</span>
            <span class={cx('text-label-sm', it.ok ? 'text-success-fg' : 'text-warning-fg')}
              >{it.ok ? '정상' : '이상'}</span
            >
          </label>
        </li>
      {/each}
    </ul>
  </fieldset>
  <div class="flex items-center justify-between">
    <span class="text-body-sm text-fg-muted">이상 {abnormal}건</span>
    <Button size="lg" {disabled} onclick={() => onsubmit?.(items)}>{submitLabel}</Button>
  </div>
</form>
