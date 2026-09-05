<script lang="ts">
  import { cx, TONE } from '../lib/cx';
  import { dismiss, toasts } from './toast-store.svelte';
  let { position = 'bottom-end' }: { position?: 'bottom' | 'bottom-end' } = $props();
</script>

<div
  class={cx(
    'gap-stack-sm p-inset-lg pointer-events-none fixed inset-x-0 bottom-0 flex flex-col items-center',
    position === 'bottom-end' && 'items-end',
  )}
  style="z-index: var(--sys-z-toast)"
  aria-live="polite"
>
  {#each toasts as t (t.id)}
    <div
      class="gap-inline-md rounded-card bg-inverse px-inset-md py-inset-sm text-body-md text-fg-on-inverse shadow-popover max-w-layout-toast-width pointer-events-auto flex w-full items-center"
      role="status"
    >
      <span class={cx('size-size-indicator rounded-pill shrink-0', TONE[t.tone].dot)} aria-hidden="true"></span>
      <span class="flex-1">{t.message}</span>
      {#if t.action}<button
          type="button"
          class="text-label-lg text-accent-fg-strong font-semibold underline-offset-2 hover:underline"
          onclick={() => {
            t.action?.onclick();
            dismiss(t.id);
          }}>{t.action.label}</button
        >{/if}
      <button
        type="button"
        class="text-fg-on-inverse/70 hover:text-fg-on-inverse"
        aria-label="닫기"
        onclick={() => dismiss(t.id)}>×</button
      >
    </div>
  {/each}
</div>
