<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx, TONE, type Tone } from '../lib/cx';
  // 상태 표시(DY-design §0-4 색 예산) — warning·danger만 톤 배경 pill, 그 밖의 톤(success·info·progress·neutral·accent)은 텍스트 라벨(quiet)
  // solid는 미디어 위 오버레이(카메라 타일)용 · 점(signal)은 LIVE·REC·촬영 중처럼 살아 움직이는 신호에만
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
    /** 살아 움직이는 신호(LIVE · REC · 촬영 중)에만 점을 붙인다 */
    signal?: boolean;
    class?: string;
    icon?: Snippet;
  } = $props();
  const quiet = $derived(!solid && tone !== 'warning' && tone !== 'danger');
</script>

<span
  class={cx(
    'gap-inline-xs inline-flex items-center font-medium whitespace-nowrap',
    quiet
      ? cx(size === 'sm' ? 'text-label-sm' : 'text-label-md', 'text-fg')
      : cx(
          'rounded-pill',
          size === 'sm' ? 'h-size-badge px-inset-xs text-label-sm' : 'h-size-control-xs px-inset-sm text-label-md',
          solid ? TONE[tone].solid : TONE[tone].subtle,
        ),
    cls,
  )}
>
  {#if icon}{@render icon()}{:else if signal}<span
      class={cx('size-size-indicator rounded-pill', solid ? 'bg-current' : TONE[tone].dot)}
      aria-hidden="true"
    ></span>{/if}
  {label}
</span>
