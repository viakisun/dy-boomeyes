<script lang="ts">
  import { cx, FOCUS } from '../lib/cx';
  let {
    checked = $bindable(false),
    label,
    disabled = false,
    onchange,
  }: { checked?: boolean; label?: string; disabled?: boolean; onchange?: (v: boolean) => void } = $props();
</script>

<label
  class={cx(
    'min-h-size-touch-min gap-inline-sm text-body-md text-fg inline-flex cursor-pointer items-center select-none',
    disabled && 'cursor-not-allowed opacity-40',
  )}
>
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    {disabled}
    onclick={() => {
      checked = !checked;
      onchange?.(checked);
    }}
    class={cx(
      'h-size-icon-lg w-size-control-xs rounded-pill ease-standard relative shrink-0 transition-colors duration-150',
      checked ? 'bg-accent' : 'bg-border-strong',
      FOCUS,
    )}
  >
    <span
      class={cx(
        'size-size-icon-sm rounded-pill bg-surface shadow-raised ease-standard top-stack-xs left-inline-xs absolute transition-transform duration-150',
        checked &&
          'translate-x-[calc(var(--spacing-size-control-xs)-var(--spacing-size-icon-sm)-2*var(--spacing-inline-xs))]',
      )}
    ></span>
  </button>
  {#if label}<span>{label}</span>{/if}
</label>
