<script lang="ts">
  import { cx, TONE, type Tone } from '../lib/cx';
  let {
    label,
    value,
    unit,
    tone = 'neutral',
    hint,
    class: cls,
  }: { label: string; value: string | number; unit?: string; tone?: Tone; hint?: string; class?: string } = $props();
</script>

<div class={cx('gap-stack-xs rounded-card border-border bg-surface p-inset-md flex flex-col border', cls)}>
  <span class="text-label-md text-fg-muted">{label}</span>
  <span class={cx('text-display-md font-semibold tabular-nums', tone === 'neutral' ? 'text-fg' : TONE[tone].fg)}
    >{value}{#if unit}<span class="text-body-sm text-fg-muted ml-inline-xs font-normal">{unit}</span>{/if}</span
  >
  {#if hint}<span class="text-body-sm text-fg-muted">{hint}</span>{/if}
</div>
