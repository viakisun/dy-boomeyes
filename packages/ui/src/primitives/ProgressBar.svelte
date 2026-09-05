<script lang="ts">
  // 진행 막대(카탈로그 ProgressBar, CE 부하율) — role=progressbar · tone · label · 계기 대신 선형(보조지표 표시)
  import { cx, TONE, type Tone } from '../lib/cx';
  let {
    value,
    label,
    tone = 'accent',
    hint,
    class: cls,
  }: { value: number; label: string; tone?: Tone; hint?: string; class?: string } = $props();
  const pct = $derived(Math.max(0, Math.min(100, Math.round(value))));
</script>

<div class={cx('gap-stack-xs flex flex-col', cls)}>
  <div class="text-label-sm text-fg-muted gap-inline-sm flex justify-between whitespace-nowrap">
    <span>{label}</span>
    {#if hint}<span class="tabular-nums">{hint}</span>{/if}
  </div>
  <div
    class="bg-surface-sunken rounded-pill h-size-indicator w-full overflow-hidden"
    role="progressbar"
    aria-label={label}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={pct}
    aria-valuetext="{pct}%{hint ? ` · ${hint}` : ''}"
  >
    <div class={cx('rounded-pill h-full', TONE[tone].solid)} style="width: {pct}%"></div>
  </div>
</div>
