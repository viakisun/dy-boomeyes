<script lang="ts">
  // 현황 경로 — 전국 › 현장 › N호기. 앞 단계는 링크(뒤로가기와 같은 push 이동), 현재 단계는 aria-current.
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import type { OwnerLevel } from '@boomeyes/domain';
  import { cx } from '../lib/cx';
  import { ownerControl } from './core-helpers';
  let {
    level,
    hrefs,
    onnavigate,
    class: cls,
  }: {
    level: OwnerLevel;
    hrefs: { nation: string; site?: string };
    onnavigate: (href: string) => void;
    class?: string;
  } = $props();
  const link = cx(ownerControl(), 'rounded-control px-inset-xs inline-flex items-center text-fg-muted hover:text-fg');
  const go = (href: string) => (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onnavigate(href);
  };
</script>

<nav aria-label="현황 경로" class={cx('text-body-md flex flex-wrap items-center', cls)}>
  {#if level.level === 'nation'}
    <span aria-current="page" class="px-inset-xs font-semibold">전국</span>
  {:else}
    <a href={hrefs.nation} class={link} onclick={go(hrefs.nation)}>전국</a>
  {/if}
  {#if level.level !== 'nation'}
    <ChevronRight class="size-size-icon-sm text-fg-subtle" aria-hidden="true" />
    {#if level.level === 'site' || !hrefs.site}
      <span aria-current="page" class="px-inset-xs font-semibold">{level.site.name}</span>
    {:else}
      <a href={hrefs.site} class={link} onclick={go(hrefs.site)}>{level.site.name}</a>
    {/if}
  {/if}
  {#if level.level === 'unit'}
    <ChevronRight class="size-size-icon-sm text-fg-subtle" aria-hidden="true" />
    <span aria-current="page" class="px-inset-xs font-semibold">{level.device.unit}호기</span>
  {/if}
</nav>
