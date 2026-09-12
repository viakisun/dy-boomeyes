<script lang="ts">
  // 운영 현황 — 헤더(제목·기준 시각 | 운영 구성 한 줄) → 지도(lg 7/12) + 오른쪽 패널(5/12: 확인할 것 · 장비 목록, 패널 안 스크롤).
  // 목록 hover/선택 → 지도 마커 강조(selected). 검색은 보유 장비 화면에 있다.
  import type { Snippet } from 'svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Clock from '@lucide/svelte/icons/clock';
  import Bell from '@lucide/svelte/icons/bell';
  import { ownerHref, ownerSummary, type OwnerDevice, type OwnerViewProps } from '@boomeyes/domain';
  import { fmtDateTime } from '../lib/format';
  import PageHeader from '../primitives/PageHeader.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import Button from '../primitives/Button.svelte';
  import List from '../primitives/List.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import FleetSummary from './FleetSummary.svelte';
  import EquipmentRow from './EquipmentRow.svelte';
  import AlertCard from './AlertCard.svelte';
  import { devicePoster } from './core-helpers';
  let { data, app, url, map }: OwnerViewProps & { map?: Snippet<[OwnerDevice[], string | undefined]> } = $props();
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
  let focused = $state<string | undefined>();
  const hasMap = $derived(!!map && data.devices.length > 0);
</script>

<div class="gap-stack-md flex min-w-0 flex-col">
  <div class="gap-inline-lg flex flex-wrap items-end justify-between">
    <PageHeader title="운영 현황">
      {#snippet meta()}<span class="gap-inline-xs text-body-sm text-fg-muted inline-flex items-center"
          ><Clock class="size-size-icon-sm" aria-hidden="true" />{fmtDateTime(data.at)} 기준</span
        >{/snippet}
    </PageHeader>
    <FleetSummary
      devices={data.devices}
      alerts={data.alerts}
      {app}
      {url}
      variant="inline"
      class="lg:max-w-layout-form-max"
    />
  </div>
  <div class="gap-stack-md grid min-w-0 grid-cols-1 items-stretch lg:grid-cols-12">
    {#if hasMap}
      <div
        class="rounded-card shadow-raised h-layout-panel-height flex overflow-hidden lg:col-span-7 lg:aspect-[7/6] lg:h-auto"
      >
        {@render map!(devices, focused)}
      </div>
    {/if}
    <div class="relative min-h-0 min-w-0 {hasMap ? 'lg:col-span-5' : 'lg:col-span-12'}">
      <div
        class="rounded-card bg-surface shadow-raised gap-stack-md p-inset-md flex min-w-0 flex-col {hasMap
          ? 'lg:absolute lg:inset-0 lg:overflow-y-auto'
          : ''}"
      >
        <section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-attention-title">
          <div class="gap-inline-sm flex flex-wrap items-center justify-between">
            <h2 id="owner-attention-title" class="text-heading-sm">
              확인이 필요한 장비 <span class="tabular-nums">{summary.attention}대</span>
            </h2>
            <Button variant="ghost" size="sm" href={ownerHref(url, 'alerts', app)}
              >알림 전체 보기 <ArrowRight class="size-size-icon-sm" aria-hidden="true" /></Button
            >
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
                  onmouseenter={() => (focused = device.id)}
                  onmouseleave={() => (focused = undefined)}
                />
              {/snippet}
            </List>
            {#if summary.alerts > shown.length}
              <p class="text-body-sm text-fg-muted">전체 알림 {summary.alerts}건 중 {shown.length}건 표시</p>
            {/if}
          {:else}
            <EmptyState title={data.devices.length ? '확인할 알림 없음' : '등록된 장비 없음'}>
              {#snippet icon()}<IconTile><Bell class="size-size-icon-lg" /></IconTile>{/snippet}
            </EmptyState>
          {/if}
        </section>
        <section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-location-title">
          <div class="gap-inline-sm flex flex-wrap items-center justify-between">
            <h2 id="owner-location-title" class="text-heading-sm">현장별 장비</h2>
            <Button variant="ghost" size="sm" href={ownerHref(url, 'fleet', app)}
              >전체 장비 보기 <ArrowRight class="size-size-icon-sm" aria-hidden="true" /></Button
            >
          </div>
          {#if devices.length > 0}
            <List items={devices} key={(d) => d.id} label="현장별 장비" variant="plain">
              {#snippet item(device)}
                <EquipmentRow
                  {device}
                  now={data.at}
                  poster={devicePoster(data.cameras, device.id)}
                  href={ownerHref(url, 'detail', app, {}, device.id)}
                  location={!map}
                  selected={focused === device.id}
                  onmouseenter={() => (focused = device.id)}
                  onmouseleave={() => (focused = undefined)}
                />
              {/snippet}
            </List>
            {#if data.devices.length > devices.length}
              <p class="text-body-sm text-fg-muted">전체 {data.devices.length}대 중 {devices.length}대 표시</p>
            {/if}
          {:else}
            <EmptyState title="표시할 현장 없음" />
          {/if}
        </section>
      </div>
    </div>
  </div>
</div>
