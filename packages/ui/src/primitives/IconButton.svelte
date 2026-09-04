<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { cx, FOCUS } from '../lib/cx';
  type Variant = 'ghost' | 'outline' | 'solid';
  type Tone = 'accent' | 'neutral' | 'danger';
  let {
    variant = 'ghost',
    tone = 'neutral',
    size = 'md',
    label,
    class: cls,
    children,
    ...rest
  }: HTMLButtonAttributes & {
    variant?: Variant;
    tone?: Tone;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    label: string;
    children?: Snippet;
  } = $props();
  const SIZE = {
    xs: 'size-size-control-xs',
    sm: 'size-size-control-sm',
    md: 'size-size-control-md',
    lg: 'size-size-control-lg',
  };
  const STYLE: Record<Variant, Record<Tone, string>> = {
    ghost: {
      accent: 'text-accent-fg hover:bg-accent-bg',
      neutral: 'text-fg-muted hover:bg-ui-hover hover:text-fg',
      danger: 'text-danger-fg hover:bg-danger-bg',
    },
    outline: {
      accent: 'border border-accent-border text-accent-fg hover:bg-accent-bg',
      neutral: 'border border-border text-fg hover:bg-ui-hover',
      danger: 'border border-danger-border text-danger-fg hover:bg-danger-bg',
    },
    solid: {
      accent: 'bg-accent text-accent-on-solid hover:bg-accent-solid-hover',
      neutral: 'bg-ui text-fg hover:bg-ui-hover',
      danger: 'bg-danger text-danger-on-solid hover:bg-danger-solid-hover',
    },
  };
</script>

<button
  class={cx(
    'rounded-control inline-flex shrink-0 items-center justify-center transition-colors duration-100 disabled:pointer-events-none disabled:opacity-40',
    FOCUS,
    SIZE[size],
    STYLE[variant][tone],
    cls,
  )}
  aria-label={label}
  title={label}
  {...rest}
>
  {@render children?.()}
</button>
