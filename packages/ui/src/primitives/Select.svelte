<script lang="ts">
  // 선택(카탈로그 Select, Linear) — 네이티브 select(PWA는 네이티브 시트) · label 연결 · placeholder · 옵션 disabled · error
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import { cx, FOCUS } from '../lib/cx';
  let {
    value = $bindable(''),
    label,
    options,
    placeholder,
    help,
    error,
    size = 'md',
    id = `sel-${Math.random().toString(36).slice(2, 8)}`,
    class: cls,
    ...rest
  }: Omit<HTMLSelectAttributes, 'value' | 'size' | 'class'> & {
    value?: string;
    label?: string;
    options: { value: string; label: string; disabled?: boolean }[];
    placeholder?: string;
    help?: string;
    error?: string;
    size?: 'sm' | 'md';
    class?: string;
  } = $props();
</script>

<label for={id} class={cx('gap-stack-xs text-label-md text-fg-muted flex flex-col', cls)}>
  {#if label}<span>{label}</span>{/if}
  <select
    {id}
    bind:value
    class={cx(
      'rounded-control border-border bg-surface px-inset-sm text-body-md text-fg border',
      size === 'sm' ? 'h-size-control-sm' : 'h-size-control-md',
      FOCUS,
    )}
    aria-invalid={error ? 'true' : undefined}
    {...rest}
  >
    {#if placeholder}<option value="">{placeholder}</option>{/if}
    {#each options as o (o.value)}<option value={o.value} disabled={o.disabled}>{o.label}</option>{/each}
  </select>
  {#if error}<span class="text-label-sm text-danger-fg">{error}</span>
  {:else if help}<span class="text-label-sm text-fg-muted">{help}</span>{/if}
</label>
