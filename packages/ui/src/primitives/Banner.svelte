<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx, TONE, type Tone } from '../lib/cx';
  let {
    tone = 'neutral',
    dismissible = false,
    ref,
    class: cls,
    children,
    action,
    icon,
  }: {
    tone?: Tone;
    dismissible?: boolean;
    /** 근거 SSOT ID(data-ref) — 시연 모드 근거 토글에서만 보인다 */
    ref?: string;
    class?: string;
    children?: Snippet;
    action?: Snippet;
    icon?: Snippet;
  } = $props();
  let shown = $state(true);
</script>

{#if shown}
  <div
    role="status"
    data-ref={ref}
    class={cx(
      'gap-inline-md rounded-card px-inset-md py-inset-sm text-body-md flex items-center border',
      TONE[tone].subtle,
      TONE[tone].outline.split(' ')[0],
      cls,
    )}
  >
    {#if icon}<span class="shrink-0">{@render icon()}</span>{/if}
    <div class="flex-1">{@render children?.()}</div>
    {#if action}{@render action()}{/if}
    {#if dismissible}<button
        type="button"
        class="text-fg-muted hover:text-fg"
        aria-label="닫기"
        onclick={() => (shown = false)}>×</button
      >{/if}
  </div>
{/if}
