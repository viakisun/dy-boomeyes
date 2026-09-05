<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cx, FOCUS } from '../lib/cx';
  let {
    value = $bindable(''),
    label,
    help,
    error,
    size = 'md',
    prefix,
    suffix,
    id = `tf-${Math.random().toString(36).slice(2, 8)}`,
    class: cls,
    ...rest
  }: Omit<HTMLInputAttributes, 'size' | 'prefix' | 'value' | 'class'> & {
    value?: string;
    label?: string;
    help?: string;
    error?: string;
    size?: 'md' | 'lg';
    prefix?: Snippet;
    suffix?: Snippet;
    class?: string;
  } = $props();
</script>

<div class={cx('gap-stack-xs flex flex-col', cls)}>
  {#if label}<label for={id} class="text-label-md text-fg-muted"
      >{label}{#if rest.required}<span class="text-danger-fg"> *</span>{/if}</label
    >{/if}
  <div
    class={cx(
      'gap-inline-xs rounded-control bg-surface px-inset-md focus-within:border-focus-ring hover:border-border-strong duration-fast flex items-center border transition-colors',
      size === 'lg' ? 'h-size-control-lg' : 'h-size-control-md',
      error ? 'border-danger-border-strong' : 'border-border',
      rest.disabled && 'bg-disabled opacity-60',
    )}
  >
    {#if prefix}<span class="text-fg-subtle">{@render prefix()}</span>{/if}
    <input
      {id}
      bind:value
      class={cx(
        'text-body-md text-fg placeholder:text-fg-placeholder min-w-0 flex-1 bg-transparent outline-none',
        FOCUS.replace('focus-visible:outline-2', 'focus-visible:outline-0'),
      )}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-err` : help ? `${id}-help` : undefined}
      {...rest}
    />
    {#if suffix}<span class="text-fg-subtle">{@render suffix()}</span>{/if}
  </div>
  {#if error}<p id="{id}-err" class="text-body-sm text-danger-fg">{error}</p>{:else if help}<p
      id="{id}-help"
      class="text-body-sm text-fg-muted"
    >
      {help}
    </p>{/if}
</div>
