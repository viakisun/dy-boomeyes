<script lang="ts">
  // 운영 현황 — 드릴다운 관제: 전국(현장 알약·지역 집계) → 현장(호기 핀) → 호기(패널 + 실시간 영상).
  // 웹 lg: 무대(지도) 위에 상태 띠(좌상)와 패널(우측)이 떠 있다 · 웹 좁은 폭: 띠 → 지도 → 패널 세로 · PWA: 지도 전면 + 띠(상단) + 바텀 시트 3단(MapSheet).
  // URL이 단계를 정한다(?site= · ?device=) — 새로고침·뒤로가기가 그대로 동작한다. 목록은 보유 장비 화면에 있다.
  import { tick, type Snippet } from 'svelte';
  import Clock from '@lucide/svelte/icons/clock';
  import {
    ownerHref,
    ownerLevel,
    type OwnerAiEvent,
    type OwnerCamera,
    type OwnerDevice,
    type OwnerLevel,
    type OwnerMapScene,
    type OwnerRegion,
    type OwnerSite,
    type OwnerViewProps,
  } from '@boomeyes/domain';
  import { fmtDateTime } from '../lib/format';
  import MapSheet, { type MapSheetSnap } from '../primitives/MapSheet.svelte';
  import StatusStrip from './StatusStrip.svelte';
  import OverviewCrumbs from './OverviewCrumbs.svelte';
  import NationPanel from './NationPanel.svelte';
  import SitePanel from './SitePanel.svelte';
  import UnitPanel from './UnitPanel.svelte';
  import UnitCameras from './UnitCameras.svelte';
  let {
    data,
    app,
    url,
    navigate,
    capture = false,
    sim = false,
    map,
    live,
    aiShot,
  }: OwnerViewProps & {
    map?: Snippet<[OwnerMapScene]>;
    live?: Snippet<[OwnerCamera, string, boolean, boolean]>;
    aiShot?: Snippet<[OwnerAiEvent]>;
  } = $props();
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
  // 전국은 어느 폭에서든 지역 집계 7개 — 현장 13 알약은 수도권에서 세로 기둥이 된다. 지역 원을 누르면 그 지역으로 줌인하며 현장 알약으로 풀린다
  const aggregate = true;
  // 호기 단계는 지도 자리에 카메라 6분할이 들어간다(시안 «확정 2026-09-12») — 그 단계에는 지도가 없다.
  // 하나의 $derived로 장치와 카메라를 함께 내보내야 템플릿에서 좁혀진다.
  const wall = $derived(
    level.level === 'unit' && live
      ? { device: level.device, cameras: data.cameras.filter((c) => c.deviceId === level.device.id) }
      : null,
  );
  const hasMap = $derived(!!map && data.devices.length > 0 && !wall);
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
  // 전국으로 돌아오면(크럼·뒤로가기) 시트를 다시 접는다 — 전국 단계의 기본과 같게
  $effect(() => {
    if (sheet && level.level === 'nation') snap = 'collapsed';
  });
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
          right: inset * 4,
          bottom: inset * 4,
          // 패널은 좌측이다(시안 «확정 2026-09-12») — 이 여백을 반대쪽에 두면 카메라가 마커를
          // 패널 밑으로 밀어 넣고 캡처의 마커 도달 검사에서 늦게 터진다
          left: (floating ? panelWidth + inset : 0) + inset * 4,
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
  const mapMode = $derived(level.level !== 'nation' ? 'units' : region ? 'sites' : 'regions');
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
    <UnitPanel {data} {app} {url} device={level.device} {capture} {live} {aiShot} cameraWall={!!wall} />
  {/if}
{/snippet}

<div class="gap-stack-md flex min-h-0 min-w-0 flex-1 flex-col">
  <!-- 한 줄 헤더: 제목 · 경로 · 기준 시각 — 무대(지도)가 첫 뷰포트를 차지하도록 낮게 -->
  <div class="gap-inline-lg flex min-w-0 flex-wrap items-center justify-between">
    <div class="gap-inline-lg flex min-w-0 flex-wrap items-center">
      <h1 class="text-heading-md">운영 현황</h1>
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
    <span class="gap-inline-xs text-body-sm text-fg-muted inline-flex items-center"
      ><Clock class="size-size-icon-sm" aria-hidden="true" />{fmtDateTime(data.at)} 기준{#if sim}<span
          class="text-label-sm text-fg-muted ml-inline-sm"
          data-owner-sim-label>시뮬레이션 진행 중</span
        >{/if}</span
    >
  </div>
  <div class="gap-stack-md flex min-h-0 min-w-0 flex-1 flex-col lg:block">
    <div
      bind:this={stage}
      bind:clientWidth={stageWidth}
      bind:clientHeight={stageHeight}
      data-owner-stage
      data-owner-map-mode={hasMap ? mapMode : undefined}
      class="gap-stack-sm relative flex min-w-0 flex-col {sheet && (hasMap || wall)
        ? 'min-h-layout-panel-height flex-1 overflow-hidden'
        : hasMap
          ? 'lg:block lg:aspect-[16/9]'
          : wall
            ? 'min-h-layout-panel-height'
            : ''}"
    >
      {#if wall && sheet}
        <!-- PWA 호기: 상태 띠 → 카메라 2×3 → 시트(정보).
             지도 단계와 달리 띠를 띄우지 않는다 — 지도는 띠 아래로 이어지지만 타일은 가려지면 그만큼 사라진다. -->
        <div bind:clientHeight={stripHeight} class="shrink-0">
          <StatusStrip devices={data.devices} alerts={data.alerts} {app} {url} wrap={false} class="w-full" />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <UnitCameras device={wall.device} cameras={wall.cameras} {app} {capture} live={live!} class="h-full" />
        </div>
        <MapSheet bind:snap label="현황 패널">
          {@render panels()}
        </MapSheet>
      {:else if wall}
        <!-- 웹 호기: 카메라 3×2와 정보 패널을 나란히 둔다. 지도 단계처럼 겹치지 않는다 —
             영상 위에 글을 얹으면 배경이 매 프레임 바뀌어 아무것도 읽히지 않는다. -->
        <StatusStrip devices={data.devices} alerts={data.alerts} {app} {url} />
        <!-- 벽은 자기 비율만큼(3×2 = 8:3), 패널은 정해진 높이 안에서 스크롤한다.
             늘여 맞추면 둘 중 하나가 화면 밖으로 밀린다 — 패널 내용이 벽보다 훨씬 길다. -->
        <div class="gap-stack-md flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row lg:items-start">
          <UnitCameras
            device={wall.device}
            cameras={wall.cameras}
            {app}
            {capture}
            live={live!}
            class="min-w-0 flex-1"
          />
          <div
            class="bg-surface rounded-card shadow-raised border-border-subtle p-inset-md lg:max-h-layout-panel-height lg:w-layout-inspector-width min-w-0 shrink-0 overflow-y-auto border lg:order-first"
          >
            {@render panels()}
          </div>
        </div>
      {:else if hasMap && sheet}
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
        <!-- 웹: 지도 → 좌측 기둥(띠 위 · 패널 아래). lg에서는 DOM 순서대로 기둥이 지도 위에 그려진다
             (z 유틸리티 없이). 시안도 카드가 띠 아래 좌측이다(«확정 2026-09-12»).
             좁은 폭은 세로 스택이라 기둥이 먼저 오고(order-first) 지도가 그 아래다. -->
        <div
          class="rounded-card shadow-raised h-layout-panel-height flex overflow-hidden lg:absolute lg:inset-0 lg:h-auto"
        >
          {@render map!(scene)}
        </div>
        <!-- 기둥 자체는 포인터를 통과시킨다 — 띠·카드보다 넓은 투명 상자가 지도를 덮으면
             마커를 누를 수 없고 캡처의 도달 검사가 「마커가 겹친다」로 떨어진다 -->
        <div
          bind:this={panel}
          class="gap-stack-sm lg:top-inset-md lg:bottom-inset-md lg:left-inset-md order-first flex min-h-0 min-w-0 flex-col lg:pointer-events-none lg:absolute lg:order-none lg:items-start"
        >
          <div bind:clientHeight={stripHeight} class="pointer-events-auto w-fit max-w-full">
            <StatusStrip devices={data.devices} alerts={data.alerts} {app} {url} />
          </div>
          <aside
            bind:clientWidth={panelWidth}
            aria-label="현황 패널"
            class="rounded-card bg-surface shadow-overlay gap-stack-lg p-inset-md lg:w-layout-inspector-width pointer-events-auto flex min-h-0 min-w-0 flex-col lg:overflow-y-auto lg:overscroll-contain"
          >
            {@render panels()}
          </aside>
        </div>
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
