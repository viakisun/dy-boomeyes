<script lang="ts">
  // 일일점검 체크리스트(FR-014 · DY-design F-13) — 행 3상태: 미입력(중립) · 정상(체크) · 이상(체크 해제 또는 "이상" 버튼). 제출값은 ok뿐이라 미입력은 이상으로 기록된다(요약에 "미입력 n 포함")
  import type { InspectionItem } from '@boomeyes/domain';
  import { SvelteSet } from 'svelte/reactivity';
  import { cx, FOCUS, TONE } from '../lib/cx';
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
  const touched = new SvelteSet<string>();
  const abnormal = $derived(items.filter((i) => !i.ok).length);
  const untouched = $derived(items.filter((i) => !i.ok && !touched.has(i.id)).length);
  const set = (id: string, ok: boolean) => {
    touched.add(id);
    items = items.map((i) => (i.id === id ? { ...i, ok } : i));
  };
  const stateOf = (i: InspectionItem) => (i.ok ? 'ok' : touched.has(i.id) ? 'abnormal' : 'untouched');
</script>

<form class="gap-stack-md flex flex-col" onsubmit={(e) => e.preventDefault()}>
  <fieldset class="rounded-card border-border bg-surface border" {disabled}>
    <legend class="text-label-md text-fg-muted px-inset-md pt-inset-sm">{legend}</legend>
    <ul class="divide-border-subtle divide-y">
      {#each items as it (it.id)}
        {@const st = stateOf(it)}
        <li
          class={cx(
            'min-h-size-control-lg px-inset-md gap-inline-md flex items-center',
            st === 'abnormal' && 'bg-warning-bg',
          )}
          data-state={st}
        >
          <label class="gap-inline-md flex min-w-0 flex-1 cursor-pointer items-center">
            <input
              type="checkbox"
              class={cx('size-size-icon-lg rounded-mark border-border-emphasis accent-accent shrink-0', FOCUS)}
              checked={it.ok}
              onchange={(e) => set(it.id, e.currentTarget.checked)}
              {disabled}
            />
            <span class="text-body-md flex-1">{it.label}</span>
          </label>
          {#if st === 'ok'}<span class="text-label-sm text-success-fg">정상</span>
          {:else}
            {#if st === 'untouched'}<span class="text-label-sm text-fg-muted">미입력</span>{/if}
            <button
              type="button"
              class={cx(
                'h-size-badge rounded-pill px-inset-sm text-label-sm border',
                st === 'abnormal' ? TONE.warning.outline : 'border-border text-fg-muted',
                FOCUS,
              )}
              aria-pressed={st === 'abnormal'}
              aria-label="{it.label} 이상 표시"
              {disabled}
              onclick={() => set(it.id, false)}>이상</button
            >
          {/if}
        </li>
      {/each}
    </ul>
  </fieldset>
  <div class="flex items-center justify-between">
    <span class="text-body-sm text-fg-muted">이상 {abnormal}건{untouched ? ` (미입력 ${untouched} 포함)` : ''}</span>
    <Button size="lg" {disabled} onclick={() => onsubmit?.(items)}>{submitLabel}</Button>
  </div>
</form>
