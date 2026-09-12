<script lang="ts">
  // 운영 현황 — 드릴다운 관제: 전국(현장 알약·지역 집계) → 현장(호기 핀) → 호기(패널 + 실시간 영상).
  // 웹 lg: 무대(지도) 위에 상태 띠(좌상)와 패널(우측)이 떠 있다 · 웹 좁은 폭: 띠 → 지도 → 패널 세로 · PWA: 지도 전면 + 띠(상단) + 바텀 시트 3단(MapSheet).
  // URL이 단계를 정한다(?site= · ?device=) — 새로고침·뒤로가기가 그대로 동작한다. 목록은 보유 장비 화면에 있다.
  import { tick, type Snippet } from 'svelte';
  import Clock from '@lucide/svelte/icons/clock';
  import {
    OWNER_AGGREGATE_BELOW,
    ownerHref,
    ownerLevel,
    type OwnerCamera,
    type OwnerDevice,
    type OwnerLevel,
    type OwnerMapScene,
    type OwnerRegion,
    type OwnerSite,
    type OwnerViewProps,
  } from '@boomeyes/domain';
  import { fmtDateTime } from '../lib/format';
  import PageHeader from '../primitives/PageHeader.svelte';
  import MapSheet, { type MapSheetSnap } from '../primitives/MapSheet.svelte';
  import StatusStrip from './StatusStrip.svelte';
  import OverviewCrumbs from './OverviewCrumbs.svelte';
  import NationPanel from './NationPanel.svelte';
  import SitePanel from './SitePanel.svelte';
  import UnitPanel from './UnitPanel.svelte';
  let {
    data,
    app,
    url,
    navigate,
    capture = false,
    map,
    live,
  }: OwnerViewProps & { map?: Snippet<[OwnerMapScene]>; live?: Snippet<[OwnerCamera, string, boolean]> } = $props();
  const level = $derived(ownerLevel(url, data));
  let region = $state<OwnerRegion | undefined>();
  let focused = $state<string | undefined>();
  const sheet = $derived(app === 'pwa');
  // 전국 단계는 지도가 주인공(시트 접힘 — 지역 알약 7개가 들어갈 자리), 현장·호기 단계는 패널이 보이게 절반
  let snap = $state<MapSheetSnap>(level.level === 'nation' ? 'collapsed' : 'half');
  // 무대·띠·패널·시트 치수 — 카메라 여백과 집계 판정에 쓴다
  let stage = $state<HTMLDivElement>();
  let panel = $state<HTMLElement>();
  let stageWidth = $state(0);
  let stageHeight = $state(0);
  let stripHeight = $state(0);
  let panelWidth = $state(0);
  let inset = $state(0);
  let row = $state(0);
  let insetXl = $state(0);
  let floating = $state(false);
  $effect(() => {
    void stageWidth;
    if (!stage) return;
    const style = getComputedStyle(stage);
    inset = parseFloat(style.getPropertyValue('--sys-space-inset-md')) || 0;
    insetXl = parseFloat(style.getPropertyValue('--sys-space-inset-xl')) || 0;
    row = parseFloat(style.getPropertyValue('--sys-size-row-default')) || 0;
    floating = !sheet && !!panel && getComputedStyle(panel).position === 'absolute';
  });
  // 시트가 가리는 지도 높이(MapSheet의 3단 transform과 같은 식)
  const sheetVisible = $derived(
    !sheet
      ? 0
      : snap === 'collapsed'
        ? row * 2
        : snap === 'half'
          ? stageHeight / 2
          : Math.max(0, stageHeight - insetXl),
  );
  const visibleWidth = $derived(floating ? stageWidth - panelWidth - inset * 2 : stageWidth);
  const aggregate = $derived(stageWidth > 0 && visibleWidth < OWNER_AGGREGATE_BELOW);
  const hasMap = $derived(!!map && data.devices.length > 0);
  const siteDevices = $derived(
    level.level === 'nation' ? data.devices : data.devices.filter((d) => d.siteId === level.site.id),
  );
  const hrefs = $derived({
    nation: ownerHref(url, 'overview', app),
    site: level.level === 'nation' ? undefined : ownerHref(url, 'overview', app, { site: level.site.id }),
  });
  const siteHref = (site: OwnerSite) => ownerHref(url, 'overview', app, { site: site.id });
  const unitHref = (device: OwnerDevice) => ownerHref(url, 'overview', app, { site: device.siteId, device: device.id });
  // 이동 뒤 포커스 — 출발 단계(from)를 기억해 두고, 단계 객체가 실제로 바뀐 렌더에서만 패널 제목(또는 호기 카드)으로 옮긴다
  // $state.raw — 깊은 프록시가 from(단계 객체)을 감싸면 identity 비교가 늘 거짓이 된다
  let pending = $state.raw<{ from: OwnerLevel; target: 'heading' | string } | null>(null);
  function go(href: string, target: 'heading' | string = 'heading') {
    pending = { from: level, target };
    focused = undefined;
    if (sheet && snap === 'collapsed') snap = 'half'; // 접힌 시트 위에서 고르면 패널이 보이게
    navigate(href, { history: 'push' });
  }
  $effect(() => {
    const p = pending;
    if (!p || level === p.from) return;
    pending = null;
    // 이 $effect는 같은 컴포넌트의 {#if} 블록보다 먼저 돌므로, DOM이 새 단계로 바뀐 뒤(tick) 포커스한다
    void tick().then(() => {
      const el =
        p.target === 'heading'
          ? stage?.querySelector<HTMLElement>(`[data-panel-heading="${level.level}"]`)
          : stage?.querySelector<HTMLElement>(`[data-device="${p.target}"]`);
      el?.focus();
    });
  });
  const scene = $derived<OwnerMapScene>({
    level: level.level,
    sites: data.sites,
    devices: siteDevices,
    site: level.site,
    device: level.device,
    region: level.level === 'nation' ? region : undefined,
    aggregate,
    focused: level.level === 'unit' ? level.device.id : focused,
    animate: !capture,
    // 여백 = 띠·패널·시트가 가리는 만큼 + 알약 크기(위로 50px·좌우 55px)만큼 — 가장자리 현장의 알약이 지도 밖으로 잘리지 않게
    padding: sheet
      ? {
          top: stripHeight + inset * 6, // 띠 아래로 알약 높이(50) + 세로 밀림(56)까지
          right: inset * 3,
          bottom: sheetVisible + inset * 2,
          left: inset * 3,
        }
      : {
          top: (floating ? stripHeight + inset * 2 : 0) + inset * 4,
          right: (floating ? panelWidth + inset : 0) + inset * 4,
          bottom: inset * 4,
          left: inset * 4,
        },
    onselect: (kind, id) => {
      if (kind === 'region') region = id as OwnerRegion;
      else if (kind === 'site') go(siteHref(data.sites.find((s) => s.id === id)!));
      else {
        const device = data.devices.find((d) => d.id === id);
        if (device) go(unitHref(device));
      }
    },
  });
  const mapMode = $derived(level.level !== 'nation' ? 'units' : aggregate && !region ? 'regions' : 'sites');
</script>

{#snippet panels()}
  {#if level.level === 'nation'}
    <NationPanel
      {data}
      {app}
      {url}
      {region}
      {focused}
      {siteHref}
      onsite={(site) => go(siteHref(site))}
      onfocus={(id) => (focused = id)}
      onregion={(next) => (region = next)}
    />
  {:else if level.level === 'site'}
    <SitePanel
      {data}
      {app}
      {url}
      site={level.site}
      {focused}
      {unitHref}
      onunit={(device) => go(unitHref(device))}
      onfocus={(id) => (focused = id)}
    />
  {:else}
    <UnitPanel {data} {app} {url} device={level.device} {capture} {live} />
  {/if}
{/snippet}

<div class="gap-stack-md flex min-h-0 min-w-0 flex-1 flex-col">
  <div class="gap-inline-lg flex flex-wrap items-end justify-between">
    <PageHeader title="운영 현황">
      {#snippet meta()}<span class="gap-inline-xs text-body-sm text-fg-muted inline-flex items-center"
          ><Clock class="size-size-icon-sm" aria-hidden="true" />{fmtDateTime(data.at)} 기준</span
        >{/snippet}
    </PageHeader>
    <OverviewCrumbs
      {level}
      {region}
      {hrefs}
      onnavigate={(href) => {
        region = undefined;
        go(href);
      }}
    />
  </div>
  <div class="gap-stack-md flex min-h-0 min-w-0 flex-1 flex-col lg:block">
    <div
      bind:this={stage}
      bind:clientWidth={stageWidth}
      bind:clientHeight={stageHeight}
      data-owner-stage
      data-owner-map-mode={hasMap ? mapMode : undefined}
      class="gap-stack-sm relative flex min-w-0 flex-col {hasMap
        ? sheet
          ? 'min-h-layout-panel-height flex-1 overflow-hidden'
          : 'lg:block lg:aspect-[16/9]'
        : ''}"
    >
      {#if hasMap && sheet}
        <!-- PWA: 지도 전면 → 상태 띠(상단 부유) → 바텀 시트(패널). DOM 순서대로 위에 그려진다 -->
        <div class="rounded-card shadow-raised absolute inset-0 flex overflow-hidden">
          {@render map!(scene)}
        </div>
        <div bind:clientHeight={stripHeight} class="top-inset-sm inset-x-inset-sm absolute">
          <StatusStrip devices={data.devices} alerts={data.alerts} {app} {url} wrap={false} class="w-full" />
        </div>
        <MapSheet bind:snap label="현황 패널">
          {@render panels()}
        </MapSheet>
      {:else if hasMap}
        <!-- 웹: 지도 → 상태 띠 → 패널 순서. lg에서는 DOM 순서대로 띠·패널이 지도 위에 그려진다(z 유틸리티 없이). 좁은 폭은 띠가 먼저(order-first) -->
        <div
          class="rounded-card shadow-raised h-layout-panel-height flex overflow-hidden lg:absolute lg:inset-0 lg:h-auto"
        >
          {@render map!(scene)}
        </div>
        <div
          bind:clientHeight={stripHeight}
          class="lg:top-inset-md lg:left-inset-md order-first w-fit max-w-full lg:absolute lg:order-none"
        >
          <StatusStrip devices={data.devices} alerts={data.alerts} {app} {url} />
        </div>
        <aside
          bind:this={panel}
          bind:clientWidth={panelWidth}
          aria-label="현황 패널"
          class="rounded-card bg-surface shadow-overlay gap-stack-lg p-inset-md lg:top-inset-md lg:right-inset-md lg:bottom-inset-md lg:w-layout-inspector-width flex min-w-0 flex-col lg:absolute lg:overflow-y-auto lg:overscroll-contain"
        >
          {@render panels()}
        </aside>
      {:else}
        <div class="w-fit max-w-full"><StatusStrip devices={data.devices} alerts={data.alerts} {app} {url} /></div>
        <div class="rounded-card bg-surface shadow-raised gap-stack-lg p-inset-md flex min-w-0 flex-col">
          <NationPanel
            {data}
            {app}
            {url}
            {region}
            {focused}
            {siteHref}
            onsite={(site) => go(siteHref(site))}
            onfocus={(id) => (focused = id)}
            onregion={(next) => (region = next)}
          />
        </div>
      {/if}
    </div>
  </div>
</div>
