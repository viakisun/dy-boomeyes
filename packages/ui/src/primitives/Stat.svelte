<script lang="ts">
  // 요약 지표(카탈로그 Stat, DY-design §11.4) — 값은 fg.default(danger만 채색) · 톤은 라벨 색(점 없음, §0-4) · 폭 ≤ layout.stat.width · 높이 size.stat.height · 힌트 1줄
  import { cx, type Tone } from '../lib/cx';
  let {
    label,
    value,
    unit,
    tone = 'neutral',
    hint,
    class: cls,
  }: { label: string; value: string | number; unit?: string; tone?: Tone; hint?: string; class?: string } = $props();
</script>

<div
  class={cx(
    'gap-stack-xs rounded-card border-border bg-surface px-inset-md py-inset-sm min-h-size-stat-height max-w-layout-stat-width flex w-full flex-col border',
    cls,
  )}
>
  <span
    class={cx(
      'text-label-md',
      tone === 'danger' ? 'text-danger-fg' : tone === 'warning' ? 'text-warning-fg' : 'text-fg-muted',
    )}>{label}</span
  >
  <span class={cx('text-display-md font-semibold tabular-nums', tone === 'danger' ? 'text-danger-fg' : 'text-fg')}
    >{value}{#if unit}<span class="text-body-sm text-fg-muted ml-inline-xs font-normal">{unit}</span>{/if}</span
  >
  {#if hint}<span class="text-body-sm text-fg-muted truncate" title={hint}>{hint}</span>{/if}
</div>
