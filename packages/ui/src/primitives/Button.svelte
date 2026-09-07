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
  // 비활성 — 톤(accent·neutral·danger)과 무관하게 항상 같은 중립 톤(화면 검수 F-22).
  // opacity 합성 대신 이미 대비 감사를 통과한 토큰 쌍만 쓴다(fg.muted × bg.surface-sunken · bg.canvas · bg.surface = 4.5:1, check.mjs PAIRS)
  const DISABLED: Record<Variant, string> = {
    solid: 'disabled:bg-surface-sunken disabled:text-fg-muted',
    outline: 'disabled:border-border disabled:text-fg-muted',
    ghost: 'disabled:text-fg-muted',
    link: 'disabled:text-fg-muted',
  };
</script>

<button
  class={cx(
    'gap-inline-xs ease-standard duration-fast inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none',
    FOCUS,
    variant === 'link' ? 'h-auto px-0' : SIZE[size],
    STYLE[variant][tone],
    DISABLED[variant],
    pill ? 'rounded-pill' : 'rounded-control',
    block && 'w-full',
    cls,
  )}
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  {...rest}
>
  {#if loading}<span
      class="size-size-icon-sm rounded-pill border-strong animate-spin border-current border-t-transparent"
      aria-hidden="true"
    ></span>{/if}
  {@render children?.()}
</button>
