<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import Check from '@lucide/svelte/icons/check';
  import { cx, FOCUS } from '../lib/cx';
  let {
    checked = $bindable(false),
    indeterminate = false,
    label,
    class: cls,
    ...rest
  }: HTMLInputAttributes & { checked?: boolean; indeterminate?: boolean; label?: string; class?: string } = $props();
</script>

<label
  class={cx(
    'min-h-size-touch-min gap-inline-sm text-body-md text-fg inline-flex cursor-pointer items-center select-none',
    rest.disabled && 'cursor-not-allowed opacity-40',
    cls,
  )}
>
  <span class="size-size-icon-lg relative inline-flex shrink-0">
    <input
      type="checkbox"
      bind:checked
      {indeterminate}
      class={cx(
        'peer rounded-mark border-border-emphasis bg-surface accent-accent checked:border-accent checked:bg-accent size-full cursor-pointer appearance-none border',
        FOCUS,
      )}
      {...rest}
    />
    <Check
      class="text-accent-on-solid pointer-events-none absolute inset-0 hidden size-full peer-checked:block"
      strokeWidth={3}
      aria-hidden="true"
    />
  </span>
  {#if label}<span>{label}</span>{/if}
</label>
