<script lang="ts">
  // 현장 행 — IconTile(가장 나쁜 상태 톤) · 현장명 · 건설사·주소 · 호기 수 · 확인 필요 배지 · 후행. 클릭 → 현장 단계(push).
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Warehouse from '@lucide/svelte/icons/warehouse';
  import { ownerSiteSummary, type OwnerAlert, type OwnerDevice, type OwnerSite } from '@boomeyes/domain';
  import { cx } from '../lib/cx';
  import Badge from '../primitives/Badge.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import { ownerControl } from './core-helpers';
  let {
    site,
    devices,
    alerts,
    href,
    selected = false,
    onselect,
    onmouseenter,
    onmouseleave,
  }: {
    site: OwnerSite;
    devices: OwnerDevice[];
    alerts: OwnerAlert[];
    href: string;
    selected?: boolean;
    onselect?: (site: OwnerSite) => void;
    onmouseenter?: () => void;
    onmouseleave?: () => void;
  } = $props();
  const summary = $derived(ownerSiteSummary(site, devices, alerts));
  const tone = $derived(
    summary.worst === 'fault' ? 'danger' : summary.worst === 'normal' ? 'neutral' : ('warning' as const),
  );
</script>

<a
  {href}
  data-site={site.id}
  data-worst={summary.worst}
  aria-label="{site.name} 현장 보기"
  {onmouseenter}
  {onmouseleave}
  class={cx(
    ownerControl(),
    'gap-inline-md px-inset-md py-inset-sm hover:bg-ui-hover grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center transition-colors',
    selected && 'bg-selected',
  )}
  onclick={(event: MouseEvent) => {
    if (onselect && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
      event.preventDefault();
      onselect(site);
    }
  }}
>
  <IconTile {tone}>
    {#if site.kind === 'depot'}<Warehouse class="size-size-icon-lg" />{:else}<MapPin class="size-size-icon-lg" />{/if}
  </IconTile>
  <span class="gap-stack-xs flex min-w-0 flex-col">
    <span class="text-body-md font-semibold break-words">{site.name}</span>
    <span class="text-body-sm text-fg-muted break-words">{site.company ?? '장비 보관소'} · {site.address}</span>
  </span>
  <span class="gap-inline-sm flex shrink-0 items-center">
    <span class="text-label-md tabular-nums">{summary.units}대</span>
    {#if summary.attention > 0}<Badge tone="danger" count={summary.attention} />{/if}
    <ChevronRight class="text-fg-muted size-size-icon-md" aria-hidden="true" />
  </span>
</a>
