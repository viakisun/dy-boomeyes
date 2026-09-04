<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cx, FOCUS } from '../lib/cx';
  let {
    group = $bindable(''),
    value,
    label,
    class: cls,
    ...rest
  }: HTMLInputAttributes & { group?: string; value: string; label?: string; class?: string } = $props();
</script>

<label
  class={cx(
    'min-h-size-touch-min gap-inline-sm text-body-md text-fg inline-flex cursor-pointer items-center select-none',
    rest.disabled && 'cursor-not-allowed opacity-40',
    cls,
  )}
>
  <input
    type="radio"
    bind:group
    {value}
    class={cx(
      'size-size-icon-lg rounded-pill border-border-emphasis bg-surface checked:border-accent shrink-0 cursor-pointer appearance-none border checked:border-4',
      FOCUS,
    )}
    {...rest}
  />
  {#if label}<span>{label}</span>{/if}
</label>
