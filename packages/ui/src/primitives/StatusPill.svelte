<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx, TONE, type Tone } from '../lib/cx';
  // 상태 pill = 톤 배경 + 텍스트(두 번째 단서는 텍스트, DY-design §0-4). 점은 signal(스스로 변하는 상태: 장비 · 카메라 · 신호)에만
  let {
    tone,
    label,
    size = 'md',
    solid = false,
    signal = false,
    class: cls,
    icon,
  }: {
    tone: Tone;
    label: string;
    size?: 'sm' | 'md';
    solid?: boolean;
    /** 살아 있는 신호(장비 상태 · 카메라 LIVE/REC · 범례)에만 점을 붙인다 */
    signal?: boolean;
    class?: string;
    icon?: Snippet;
  } = $props();
</script>

<span
  class={cx(
    'gap-inline-xs rounded-pill inline-flex items-center font-medium whitespace-nowrap',
    size === 'sm' ? 'h-size-badge px-inset-xs text-label-sm' : 'h-size-control-xs px-inset-sm text-label-md',
    solid ? TONE[tone].solid : TONE[tone].subtle,
    cls,
  )}
>
  {#if icon}{@render icon()}{:else if signal}<span
      class={cx('size-size-indicator rounded-pill', solid ? 'bg-current' : TONE[tone].dot)}
      aria-hidden="true"
    ></span>{/if}
  {label}
</span>
