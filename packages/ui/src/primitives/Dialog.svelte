<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    open = $bindable(false),
    title,
    size = 'md',
    destructive = false,
    capture = false,
    onclose,
    class: cls,
    children,
    footer,
  }: {
    open?: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg';
    destructive?: boolean;
    capture?: boolean;
    onclose?: () => void;
    class?: string;
    children?: Snippet;
    footer?: Snippet;
  } = $props();
  let el = $state<HTMLDialogElement>();
  const W = {
    sm: 'w-[var(--cmp-overlay-dialog-width-sm)]',
    md: 'w-[var(--cmp-overlay-dialog-width-md)]',
    lg: 'w-[var(--cmp-overlay-dialog-width-lg)]',
  };
  $effect(() => {
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  });
  const close = () => {
    open = false;
    onclose?.();
  };
</script>

<dialog
  bind:this={el}
  onclose={close}
  onclick={(e) => {
    if (e.target === el) close();
  }}
  class={cx(
    'rounded-dialog border-border bg-surface text-fg shadow-modal backdrop:bg-overlay m-auto max-w-[calc(100vw-2*var(--spacing-inset-lg))] border p-0',
    W[size],
    cls,
  )}
  data-capture-dialog={capture ? '' : undefined}
  aria-labelledby={title ? 'dlg-title' : undefined}
>
  <div class="gap-stack-md p-inset-xl flex flex-col">
    {#if title}<h2 id="dlg-title" class={cx('text-heading-md', destructive && 'text-danger-fg')}>{title}</h2>{/if}
    {@render children?.()}
    {#if footer}<div class="gap-inline-sm pt-stack-xs flex justify-end">{@render footer()}</div>{/if}
  </div>
</dialog>
