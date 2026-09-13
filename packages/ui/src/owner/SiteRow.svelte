<script lang="ts">
  // 현장 행 — 현장명 · 상태·사유(없으면 건설사·주소) · 호기 수 · 확인 필요 배지 · 후행.
  // 클릭 → 현장 단계(push). 시안의 «확인 필요» 카드가 이 행으로 채워진다.
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Warehouse from '@lucide/svelte/icons/warehouse';
  import { ownerSiteSummary, type OwnerAlert, type OwnerDevice, type OwnerSite } from '@boomeyes/domain';
  import { cx, TONE } from '../lib/cx';
  import Badge from '../primitives/Badge.svelte';
  import { ownerControl, siteCondition } from './core-helpers';
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
  const condition = $derived(siteCondition(site, devices));
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
    'gap-inline-sm px-inset-md py-inset-sm hover:bg-ui-hover flex min-w-0 items-center transition-colors',
    selected && 'bg-selected',
  )}
  onclick={(event: MouseEvent) => {
    if (onselect && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
      event.preventDefault();
      onselect(site);
    }
  }}
>
  <!-- 상태는 둘째 줄의 글자가 말한다(시안 «확정 2026-09-12») — 아이콘 타일은 같은 말을 한 번 더
       하면서 좁은 카드의 글자 자리를 먹었다. 보관소만 종류가 글에 드러나지 않아 표식을 남긴다. -->
  {#if site.kind === 'depot'}
    <Warehouse class="size-size-icon-md text-fg-muted shrink-0" aria-hidden="true" />
  {/if}
  <span class="gap-stack-xs flex min-w-0 flex-1 flex-col">
    <span class="text-body-md font-semibold break-words">{site.name}</span>
    <!-- 둘째 줄은 확인할 것이 있으면 상태·사유, 없으면 건설사·주소다(시안 «확정 2026-09-12») -->
    {#if condition}
      <span class="text-body-sm break-words">
        <strong class={TONE[condition.tone].fg}>{condition.label}</strong>
        <span class="text-fg-muted">· {condition.detail}</span>
      </span>
    {:else}
      <span class="text-body-sm text-fg-muted break-words">{site.company ?? '장비 보관소'} · {site.address}</span>
    {/if}
  </span>
  <span class="gap-inline-sm flex shrink-0 items-center">
    <span class="text-label-md tabular-nums">{summary.units}대</span>
    {#if summary.attention > 0}<Badge tone="danger" count={summary.attention} />{/if}
    <ChevronRight class="text-fg-muted size-size-icon-md" aria-hidden="true" />
  </span>
</a>
