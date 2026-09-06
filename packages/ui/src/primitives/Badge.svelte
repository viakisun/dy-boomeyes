<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx, TONE, type Tone } from '../lib/cx';
  let {
    tone = 'neutral',
    variant = 'subtle',
    dot = false,
    count,
    max = 99,
    ref,
    class: cls,
    children,
  }: {
    tone?: Tone;
    variant?: 'subtle' | 'solid' | 'outline' | 'dot';
    dot?: boolean;
    count?: number;
    max?: number;
    /** 근거 SSOT ID(data-ref) — 시연 모드 근거 토글에서만 보인다 */
    ref?: string;
    class?: string;
    children?: Snippet;
  } = $props();
  const shown = $derived(count === undefined ? null : count > max ? `${max}+` : String(count));
</script>

{#if variant === 'dot'}
  <span class={cx('size-size-indicator rounded-pill inline-block', TONE[tone].dot, cls)} aria-hidden="true"></span>
{:else}
  <span
    class={cx(
      'h-size-badge gap-inline-xs rounded-pill px-inset-xs text-label-md inline-flex items-center font-medium whitespace-nowrap',
      variant === 'outline' && 'border',
      TONE[tone][variant],
      cls,
    )}
    data-ref={ref}
  >
    {#if dot}<span
        class={cx('size-size-indicator rounded-pill', variant === 'solid' ? 'bg-current' : TONE[tone].dot)}
        aria-hidden="true"
      ></span>{/if}
    {#if shown !== null}{shown}{/if}
    {@render children?.()}
  </span>
{/if}
