<script lang="ts">
  import { cx, FOCUS } from '../lib/cx';
  export interface Tab {
    id: string;
    label: string;
    count?: number;
    disabled?: boolean;
  }
  let {
    tabs,
    value = $bindable(''),
    variant = 'underline',
    size = 'md',
    onchange,
    class: cls,
  }: {
    tabs: Tab[];
    value?: string;
    variant?: 'underline' | 'pill';
    size?: 'sm' | 'md';
    onchange?: (id: string) => void;
    class?: string;
  } = $props();
  const select = (id: string) => {
    value = id;
    onchange?.(id);
  };
  const onkey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const enabled = tabs.filter((t) => !t.disabled);
    const cur = enabled.findIndex((t) => t.id === tabs[i]?.id);
    const next = enabled[(cur + (e.key === 'ArrowRight' ? 1 : enabled.length - 1)) % enabled.length];
    if (next) select(next.id);
  };
</script>

<div
  role="tablist"
  class={cx(
    'flex overflow-x-auto',
    variant === 'underline' ? 'gap-inline-md border-border border-b' : 'gap-inline-xs rounded-control bg-ui p-1',
    cls,
  )}
>
  {#each tabs as t, i (t.id)}
    <button
      role="tab"
      type="button"
      aria-selected={value === t.id}
      tabindex={value === t.id ? 0 : -1}
      disabled={t.disabled}
      onclick={() => select(t.id)}
      onkeydown={(e) => onkey(e, i)}
      class={cx(
        'gap-inline-xs inline-flex items-center whitespace-nowrap transition-colors duration-100 disabled:opacity-40',
        FOCUS,
        size === 'sm' ? 'text-label-md' : 'text-label-lg',
        variant === 'underline'
          ? cx(
              'px-inset-xs py-inset-sm -mb-px border-b-2',
              value === t.id ? 'border-accent text-accent-fg' : 'text-fg-muted hover:text-fg border-transparent',
            )
          : cx(
              'rounded-control px-inset-sm py-1',
              value === t.id ? 'bg-surface text-fg shadow-raised' : 'text-fg-muted hover:text-fg',
            ),
      )}
    >
      {t.label}{#if t.count !== undefined}<span class="rounded-pill bg-ui-active text-label-sm text-fg-muted px-1"
          >{t.count}</span
        >{/if}
    </button>
  {/each}
</div>
