<script lang="ts">
  // PWA 하단 시트 — <dialog> 기반(포커스 트랩·Esc), 화면 하단 고정. capture=true면 [data-capture-dialog]로 캡처 클립 대상
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    open = $bindable(false),
    title,
    capture = false,
    onclose,
    class: cls,
    children,
    footer,
  }: {
    open?: boolean;
    title?: string;
    capture?: boolean;
    onclose?: () => void;
    class?: string;
    children?: Snippet;
    footer?: Snippet;
  } = $props();
  let el = $state<HTMLDialogElement>();
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
    'rounded-t-dialog border-border bg-surface text-fg shadow-modal backdrop:bg-overlay max-w-layout-frame-mobile fixed inset-x-0 bottom-0 mx-auto mt-auto mb-0 w-full border border-b-0 p-0',
    cls,
  )}
  data-capture-dialog={capture ? '' : undefined}
  data-bottom-sheet
  aria-labelledby={title ? 'sheet-title' : undefined}
>
  <div
    class="gap-stack-md p-inset-lg flex flex-col"
    style="padding-bottom: calc(var(--spacing-inset-lg) + env(safe-area-inset-bottom))"
  >
    <div class="bg-border-strong rounded-pill h-size-icon-xs w-size-icon-lg self-center" aria-hidden="true"></div>
    {#if title}<h2 id="sheet-title" class="text-heading-md">{title}</h2>{/if}
    {@render children?.()}
    {#if footer}<div class="gap-inline-sm flex flex-col">{@render footer()}</div>{/if}
  </div>
</dialog>
