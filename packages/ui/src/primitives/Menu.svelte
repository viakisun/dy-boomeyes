<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cx, FOCUS } from '../lib/cx';
  export interface MenuItem {
    id: string;
    label: string;
    danger?: boolean;
    disabled?: boolean;
    shortcut?: string;
    group?: string;
  }
  let {
    items,
    open = $bindable(false),
    align = 'start',
    onselect,
    trigger,
    class: cls,
  }: {
    items: MenuItem[];
    open?: boolean;
    align?: 'start' | 'end';
    onselect?: (id: string) => void;
    trigger: Snippet<[{ toggle: () => void; open: boolean }]>;
    class?: string;
  } = $props();
  let root = $state<HTMLDivElement>();
  const toggle = () => (open = !open);
  const pick = (it: MenuItem) => {
    if (it.disabled) return;
    open = false;
    onselect?.(it.id);
  };
  $effect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => {
      if (root && !root.contains(e.target as Node)) open = false;
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') open = false;
    };
    document.addEventListener('mousedown', off);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', off);
      document.removeEventListener('keydown', esc);
    };
  });
</script>

<div bind:this={root} class={cx('relative inline-block', cls)}>
  {@render trigger({ toggle, open })}
  {#if open}
    <div
      role="menu"
      class={cx(
        'z-dropdown rounded-dialog border-border bg-surface-raised p-inset-xs shadow-overlay mt-stack-xs min-w-layout-menu-min absolute border',
        align === 'end' ? 'right-0' : 'left-0',
      )}
      style="z-index: var(--sys-z-dropdown)"
    >
      {#each items as it, i (it.id)}
        {#if it.group && (i === 0 || items[i - 1]?.group !== it.group)}<div
            class={cx(
              'px-inset-sm pt-inset-xs text-label-sm text-fg-subtle pb-stack-xs',
              i > 0 && 'border-border-subtle mt-stack-xs border-t',
            )}
          >
            {it.group}
          </div>{/if}
        <button
          role="menuitem"
          type="button"
          disabled={it.disabled}
          onclick={() => pick(it)}
          class={cx(
            'gap-inline-md rounded-control px-inset-sm py-inset-xs text-body-md flex w-full items-center justify-between text-left disabled:opacity-40',
            FOCUS,
            it.danger ? 'text-danger-fg hover:bg-danger-bg' : 'text-fg hover:bg-ui-hover',
          )}
        >
          <span>{it.label}</span>{#if it.shortcut}<kbd class="text-code-sm text-fg-subtle">{it.shortcut}</kbd>{/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
