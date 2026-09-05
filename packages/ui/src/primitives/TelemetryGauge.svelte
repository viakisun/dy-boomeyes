<script lang="ts">
  // 소모품 도달률 게이지 — 임계 접근(caution) · 초과(danger) 색 + 텍스트, role=meter (FR-007 · DISC-013/014 기준 확정 전 0.9/1.0)
  import { cx } from '../lib/cx';
  let {
    label,
    value,
    caution = 0.9,
    danger = 1,
    class: cls,
  }: { label: string; value: number; caution?: number; danger?: number; class?: string } = $props();
  const pct = $derived(Math.round(value * 100));
  const level = $derived(value >= danger ? 'danger' : value >= caution ? 'warning' : 'success');
  const text = $derived(level === 'danger' ? '임계 초과' : level === 'warning' ? '임계 접근' : '정상');
  const BAR = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' } as const;
  const FG = { success: 'text-success-fg', warning: 'text-warning-fg', danger: 'text-danger-fg' } as const;
</script>

<div
  class={cx('gap-stack-xs flex flex-col', cls)}
  role="meter"
  aria-label="{label} 도달률"
  aria-valuenow={pct}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuetext="{pct}% {text}"
  data-level={level}
>
  <div class="text-body-sm flex items-center justify-between">
    <span class="text-fg">{label}</span>
    <span class={cx('font-semibold tabular-nums', FG[level])}>{pct}% · {text}</span>
  </div>
  <div class="bg-surface-sunken rounded-pill h-size-indicator w-full overflow-hidden" aria-hidden="true">
    <div class={cx('rounded-pill h-full', BAR[level])} style="width: {Math.min(100, pct)}%"></div>
  </div>
</div>
