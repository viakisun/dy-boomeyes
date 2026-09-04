<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx, TONE, type Tone } from '../lib/cx';
  let {
    tone = 'neutral',
    dismissible = false,
    class: cls,
    children,
    action,
    icon,
  }: {
    tone?: Tone;
    dismissible?: boolean;
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
    class={cx(
      'gap-inline-md rounded-card px-inset-md py-inset-sm text-body-md flex items-center border',
      TONE[tone].subtle,
      TONE[tone].outline.split(' ')[0],
      cls,
    )}
  >
    {#if icon}<span class="shrink-0">{@render icon()}</span>{:else}<span
        class={cx('size-size-indicator rounded-pill shrink-0', TONE[tone].dot)}
        aria-hidden="true"
      ></span>{/if}
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
