<script lang="ts">
  import { cx, FOCUS } from '../lib/cx';
  let {
    checked = $bindable(false),
    label,
    hideLabel = false,
    disabled = false,
    onchange,
  }: {
    checked?: boolean;
    label?: string;
    /** 라벨을 sr-only로(표 셀처럼 헤더가 뜻을 주는 자리) */
    hideLabel?: boolean;
    disabled?: boolean;
    onchange?: (v: boolean) => void;
  } = $props();
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
      'h-size-icon-lg w-size-control-xs rounded-pill ease-standard duration-base relative shrink-0 transition-colors',
      checked ? 'bg-accent' : 'bg-border-strong',
      FOCUS,
    )}
  >
    <span
      class={cx(
        'size-size-icon-sm rounded-pill bg-surface shadow-raised ease-standard top-stack-xs left-inline-xs duration-base absolute transition-transform',
        checked &&
          'translate-x-[calc(var(--spacing-size-control-xs)_-_var(--spacing-size-icon-sm)_-_2*var(--spacing-inline-xs))]',
      )}
    ></span>
  </button>
  {#if label}<span class={hideLabel ? 'sr-only' : undefined}>{label}</span>{/if}
</label>
