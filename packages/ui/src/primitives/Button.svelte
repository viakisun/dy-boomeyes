<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { cx, FOCUS, type Size } from '../lib/cx';
  type Variant = 'solid' | 'outline' | 'ghost' | 'link';
  type Tone = 'accent' | 'neutral' | 'danger';
  let {
    variant = 'solid',
    tone = 'accent',
    size = 'md',
    loading = false,
    pill = false,
    block = false,
    disabled,
    class: cls,
    children,
    ...rest
  }: HTMLButtonAttributes & {
    variant?: Variant;
    tone?: Tone;
    size?: Size;
    loading?: boolean;
    pill?: boolean;
    block?: boolean;
    children?: Snippet;
  } = $props();
  const SIZE = {
    sm: 'h-size-control-sm px-inset-sm text-label-md',
    md: 'h-size-control-md px-inset-md text-label-lg',
    lg: 'h-size-control-lg px-inset-lg text-body-lg font-semibold',
  };
  const STYLE: Record<Variant, Record<Tone, string>> = {
    solid: {
      accent: 'bg-accent text-accent-on-solid hover:bg-accent-solid-hover active:bg-accent-solid-active',
      neutral: 'bg-ui text-fg hover:bg-ui-hover active:bg-ui-active',
      danger: 'bg-danger text-danger-on-solid hover:bg-danger-solid-hover',
    },
    outline: {
      accent: 'border border-accent-border-strong text-accent-fg hover:bg-accent-bg',
      neutral: 'border border-border-strong text-fg hover:bg-ui-hover',
      danger: 'border border-danger-border-strong text-danger-fg hover:bg-danger-bg',
    },
    ghost: {
      accent: 'text-accent-fg hover:bg-accent-bg',
      neutral: 'text-fg hover:bg-ui-hover',
      danger: 'text-danger-fg hover:bg-danger-bg',
    },
    link: {
      accent: 'text-fg-link hover:text-fg-link-hover hover:underline underline-offset-2',
      neutral: 'text-fg-muted hover:text-fg hover:underline underline-offset-2',
      danger: 'text-danger-fg hover:underline underline-offset-2',
    },
  };
</script>

<button
  class={cx(
    'gap-inline-xs ease-standard inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors duration-100 select-none disabled:pointer-events-none disabled:opacity-40',
    FOCUS,
    variant === 'link' ? 'h-auto px-0' : SIZE[size],
    STYLE[variant][tone],
    pill ? 'rounded-pill' : 'rounded-control',
    block && 'w-full',
    cls,
  )}
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  {...rest}
>
  {#if loading}<span
      class="size-size-icon-sm rounded-pill animate-spin border-2 border-current border-t-transparent"
      aria-hidden="true"
    ></span>{/if}
  {@render children?.()}
</button>
