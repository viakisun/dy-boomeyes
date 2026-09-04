<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx, TONE, type Tone } from '../lib/cx';
  // 상태는 색 + 점 + 텍스트를 병행한다 (INTENT §8-4 · QA 패리티)
  let {
    tone,
    label,
    size = 'md',
    solid = false,
    class: cls,
    icon,
  }: { tone: Tone; label: string; size?: 'sm' | 'md'; solid?: boolean; class?: string; icon?: Snippet } = $props();
</script>

<span
  class={cx(
    'gap-inline-xs rounded-pill inline-flex items-center font-medium whitespace-nowrap',
    size === 'sm' ? 'h-size-badge px-inset-xs text-label-sm' : 'h-size-control-xs px-inset-sm text-label-md',
    solid ? TONE[tone].solid : TONE[tone].subtle,
    cls,
  )}
>
  {#if icon}{@render icon()}{:else}<span
      class={cx('size-size-indicator rounded-pill', solid ? 'bg-current' : TONE[tone].dot)}
      aria-hidden="true"
    ></span>{/if}
  {label}
</span>
