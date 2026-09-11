<script lang="ts">
  // 아이콘 타일 — 카드·행의 미디어 자리에 놓는 정사각 배경 + 아이콘. 색 예산(§0-4): 틴트는 warning·danger만, 정상은 sunken.
  // 의미는 옆 텍스트가 진다(aria-hidden).
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    tone = 'neutral',
    size = 'lg',
    class: cls,
    children,
  }: { tone?: 'neutral' | 'warning' | 'danger'; size?: 'md' | 'lg'; class?: string; children: Snippet } = $props();
  const TONE_CLASS = {
    neutral: 'bg-surface-sunken text-fg-muted',
    warning: 'bg-warning-bg text-warning-fg',
    danger: 'bg-danger-bg text-danger-fg',
  };
</script>

<span
  class={cx(
    'rounded-control inline-flex shrink-0 items-center justify-center',
    size === 'md' ? 'size-size-avatar-md' : 'size-size-avatar-lg',
    TONE_CLASS[tone],
    cls,
  )}
  aria-hidden="true">{@render children()}</span
>
