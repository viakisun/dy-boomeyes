<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
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
  <input
    type="checkbox"
    bind:checked
    {indeterminate}
    class={cx(
      'size-size-icon-lg rounded-2 border-border-emphasis bg-surface accent-accent checked:border-accent checked:bg-accent shrink-0 cursor-pointer appearance-none border',
      FOCUS,
    )}
    {...rest}
  />
  {#if label}<span>{label}</span>{/if}
</label>
