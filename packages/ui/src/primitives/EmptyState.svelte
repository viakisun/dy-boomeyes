<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    title,
    description,
    tone = 'neutral',
    ref,
    class: cls,
    icon,
    action,
  }: {
    title: string;
    description?: string;
    tone?: 'neutral' | 'danger';
    /** 근거 SSOT ID(data-ref) — 시연 모드 근거 토글에서만 보인다 */
    ref?: string;
    class?: string;
    icon?: Snippet;
    action?: Snippet;
  } = $props();
</script>

<div
  class={cx(
    'gap-stack-sm rounded-card border-border px-inset-lg py-inset-xl flex flex-col items-center justify-center border border-dashed text-center',
    cls,
  )}
  data-ref={ref}
>
  {#if icon}<span class={cx('text-size-icon-xl', tone === 'danger' ? 'text-danger-fg' : 'text-fg-subtle')}
      >{@render icon()}</span
    >{/if}
  <p class={cx('text-heading-sm', tone === 'danger' ? 'text-danger-fg' : 'text-fg')}>{title}</p>
  {#if description}<p class="text-body-sm text-fg-muted max-w-layout-prose-width">{description}</p>{/if}
  {#if action}<div class="pt-stack-xs">{@render action()}</div>{/if}
</div>
