<script lang="ts">
  // 운영 현황 — 벤토: 헤더+검색 · 운영 구성 한 줄 · 지도 히어로(xl 8/12) + 확인할 것 레일(4/12, sticky) · 현장별 장비.
  import type { Snippet } from 'svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Search from '@lucide/svelte/icons/search';
  import Clock from '@lucide/svelte/icons/clock';
  import Bell from '@lucide/svelte/icons/bell';
  import { ownerHref, ownerSummary, type OwnerDevice, type OwnerViewProps } from '@boomeyes/domain';
  import { fmtDateTime } from '../lib/format';
  import PageHeader from '../primitives/PageHeader.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import Badge from '../primitives/Badge.svelte';
  import Button from '../primitives/Button.svelte';
  import List from '../primitives/List.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import FleetSummary from './FleetSummary.svelte';
  import EquipmentRow from './EquipmentRow.svelte';
  import AlertCard from './AlertCard.svelte';
  import { devicePoster, ownerControl } from './core-helpers';
  let { data, app, url, navigate, map }: OwnerViewProps & { map?: Snippet<[OwnerDevice[]]> } = $props();
  let query = $state('');
  const summary = $derived(ownerSummary(data.devices, data.alerts));
  const alerts = $derived(
    [
      ...new Map(
        data.alerts
          .filter((alert) => data.devices.some((device) => device.id === alert.deviceId))
          .map((alert) => [alert.id, alert]),
      ).values(),
    ].sort(
      (a, b) =>
        ({ fault: 0, inspection: 1, connection: 2 })[a.kind] - { fault: 0, inspection: 1, connection: 2 }[b.kind],
    ),
  );
  const shown = $derived(alerts.slice(0, 3));
  const devices = $derived(data.devices.slice(0, 5));
</script>

<div class="gap-stack-lg flex min-w-0 flex-col">
  <div class="gap-inline-lg flex flex-wrap items-center justify-between">
    <PageHeader title="운영 현황">
      {#snippet meta()}<span class="gap-inline-xs text-body-sm text-fg-muted inline-flex items-center"
          ><Clock class="size-size-icon-sm" aria-hidden="true" />{fmtDateTime(data.at)} 기준</span
        >{/snippet}
    </PageHeader>
    <form
      class="gap-inline-sm sm:max-w-layout-form-max flex min-w-0 flex-1"
      onsubmit={(event) => {
        event.preventDefault();
        navigate(ownerHref(url, 'fleet', app, { q: query }));
      }}
      role="search"
      aria-label="장비 찾기"
    >
      <div
        class="gap-inline-sm rounded-control border-border-strong bg-surface px-inset-md flex min-w-0 flex-1 items-center border"
      >
        <Search class="size-size-icon-md text-fg-muted shrink-0" aria-hidden="true" />
        <input
          type="search"
          bind:value={query}
          aria-label="호기·현장 검색"
          placeholder="호기 또는 현장"
          class="{ownerControl()} text-body-md min-w-0 flex-1 bg-transparent"
        />
      </div>
      <Button type="submit">검색</Button>
    </form>
  </div>
  <FleetSummary devices={data.devices} alerts={data.alerts} {app} {url} />
  <div class="gap-stack-lg grid min-w-0 grid-cols-1 xl:grid-cols-12">
    {#if map && data.devices.length > 0}
      <div
        class="rounded-card shadow-raised h-layout-map-min xl:h-layout-panel-height flex overflow-hidden xl:col-span-8"
      >
        {@render map(data.devices)}
      </div>
    {/if}
    <section
      class="gap-stack-sm rounded-card bg-surface shadow-raised p-inset-md flex min-w-0 flex-col xl:col-span-4 {map &&
      data.devices.length > 0
        ? ''
        : 'xl:col-span-12'}"
      aria-labelledby="owner-attention-title"
    >
      <div class="gap-inline-sm px-inset-xs flex flex-wrap items-center justify-between">
        <h2 id="owner-attention-title" class="text-heading-sm">
          확인이 필요한 장비 <span class="tabular-nums">{summary.attention}대</span>
        </h2>
        {#if summary.alerts > 0}<Badge count={summary.alerts} />{/if}
      </div>
      {#if shown.length > 0}
        <List items={shown} key={(a) => a.id} label="우선 확인 알림" variant="plain">
          {#snippet item(alert)}
            {@const device = data.devices.find((d) => d.id === alert.deviceId)!}
            <AlertCard
              {alert}
              {device}
              now={data.at}
              href={ownerHref(url, 'alerts', app, { alert: alert.id, device: device.id })}
              data-device={device.id}
            />
          {/snippet}
        </List>
        <p class="px-inset-xs text-body-sm text-fg-muted">전체 알림 {summary.alerts}건 중 {shown.length}건 표시</p>
      {:else}
        <EmptyState title={data.devices.length ? '확인할 알림 없음' : '등록된 장비 없음'}>
          {#snippet icon()}<IconTile><Bell class="size-size-icon-lg" /></IconTile>{/snippet}
        </EmptyState>
      {/if}
      <Button variant="ghost" href={ownerHref(url, 'alerts', app)} class="mt-auto self-start"
        >알림 전체 보기 <ArrowRight class="size-size-icon-sm" aria-hidden="true" /></Button
      >
    </section>
  </div>
  <section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-location-title">
    <div class="gap-inline-sm flex flex-wrap items-center justify-between">
      <h2 id="owner-location-title" class="text-heading-sm">현장별 장비</h2>
      <Button variant="ghost" href={ownerHref(url, 'fleet', app)}
        >전체 장비 보기 <ArrowRight class="size-size-icon-sm" aria-hidden="true" /></Button
      >
    </div>
    {#if devices.length > 0}
      <List items={devices} key={(d) => d.id} label="현장별 장비">
        {#snippet item(device)}
          <EquipmentRow
            {device}
            now={data.at}
            poster={devicePoster(data.cameras, device.id)}
            href={ownerHref(url, 'detail', app, {}, device.id)}
            location={!map}
          />
        {/snippet}
      </List>
      <p class="text-body-sm text-fg-muted">전체 {data.devices.length}대 중 {devices.length}대 표시</p>
    {:else}
      <EmptyState title="표시할 현장 없음" />
    {/if}
  </section>
</div>
