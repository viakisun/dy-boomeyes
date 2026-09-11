<script lang="ts">
  import type { Snippet } from 'svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Search from '@lucide/svelte/icons/search';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
  import Radio from '@lucide/svelte/icons/radio';
  import { ownerHref, ownerSummary, type OwnerDevice, type OwnerViewProps } from '@boomeyes/domain';
  import { fmtDateTime } from '../lib/format';
  import PageHeader from '../primitives/PageHeader.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import FleetSummary from './FleetSummary.svelte';
  import EquipmentRow from './EquipmentRow.svelte';
  import { ownerControl, ownerLink } from './core-helpers';
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

<div class="gap-stack-xl flex min-w-0 flex-col">
  <div class="gap-inline-lg flex flex-wrap items-end justify-between">
    <PageHeader title="운영 현황" description="{data.company}의 장비와 현장을 한눈에 확인하세요." />
    <p class="text-body-sm text-fg-muted">시연 기준 {fmtDateTime(data.at)}</p>
  </div>
  <form
    class="gap-inline-sm flex min-w-0"
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
        placeholder="호기 또는 현장으로 장비 찾기"
        class="{ownerControl(app)} text-body-md min-w-0 flex-1 bg-transparent"
      />
    </div>
    <button
      type="submit"
      class="{ownerControl(
        app,
      )} rounded-control bg-accent text-accent-on-solid hover:bg-accent-solid-hover px-inset-lg text-body-md shrink-0"
      >검색</button
    >
  </form>
  <FleetSummary devices={data.devices} alerts={data.alerts} {app} {url} />
  <div class="gap-stack-xl grid min-w-0 grid-cols-1 xl:grid-cols-2">
    <section class="gap-stack-md flex min-w-0 flex-col" aria-labelledby="owner-attention-title">
      <div class="gap-inline-sm flex flex-wrap items-center justify-between">
        <h2 id="owner-attention-title" class="text-heading-md">
          확인이 필요한 장비 <span class="ml-inline-xs tabular-nums">{summary.attention}대</span>
        </h2>
        <a href={ownerHref(url, 'alerts', app)} class={ownerLink(app)}
          >알림 전체 보기 <ArrowRight class="size-size-icon-md" aria-hidden="true" /></a
        >
      </div>
      {#if shown.length > 0}
        <ul
          class="rounded-card border-border bg-surface divide-border divide-y overflow-hidden border"
          aria-label="우선 확인 알림"
        >
          {#each shown as alert (alert.id)}
            {@const device = data.devices.find((item) => item.id === alert.deviceId)!}
            <li>
              <a
                href={ownerHref(url, 'alerts', app, { alert: alert.id, device: device.id })}
                class="{ownerControl(
                  app,
                )} gap-inline-md px-inset-lg py-inset-lg hover:bg-ui-hover flex min-w-0 items-start"
                data-device={device.id}
              >
                <span
                  class="rounded-control p-inset-sm shrink-0 {alert.kind === 'fault'
                    ? 'bg-danger-bg text-danger-fg'
                    : 'bg-warning-bg text-warning-fg'}"
                  aria-hidden="true"
                >
                  {#if alert.kind === 'fault'}<TriangleAlert
                      class="size-size-icon-lg"
                    />{:else if alert.kind === 'inspection'}<ClipboardCheck class="size-size-icon-lg" />{:else}<Radio
                      class="size-size-icon-lg"
                    />{/if}
                </span>
                <div class="gap-stack-xs flex min-w-0 flex-1 flex-col">
                  <p class="text-body-md font-semibold break-words">{alert.title}</p>
                  <p class="text-body-md break-words">{device.unit}호기 · {device.site}</p>
                  <p class="text-body-sm text-fg-muted">{fmtDateTime(alert.at)} · {alert.read ? '읽음' : '미확인'}</p>
                </div>
                <ArrowRight class="size-size-icon-md text-fg-muted mt-stack-xs shrink-0" aria-hidden="true" />
              </a>
            </li>
          {/each}
        </ul>
        <p class="text-body-sm text-fg-muted">
          전체 알림 {summary.alerts}건 중 {shown.length}건 표시 · 같은 장비에 여러 알림이 있을 수 있습니다.
        </p>
      {:else}
        <EmptyState
          title={data.devices.length ? '등록된 확인 알림이 없습니다' : '등록된 장비가 없습니다'}
          description={data.devices.length
            ? '장비별 수신 시각과 계약 정보는 보유 장비에서 확인할 수 있습니다.'
            : '장비 등록 후 현장과 상태를 확인할 수 있습니다.'}
        />
      {/if}
    </section>
    <section class="gap-stack-md flex min-w-0 flex-col" aria-labelledby="owner-location-title">
      <div class="gap-inline-sm flex flex-wrap items-center justify-between">
        <h2 id="owner-location-title" class="text-heading-md">장비와 현장</h2>
        <a href={ownerHref(url, 'fleet', app)} class={ownerLink(app)}
          >전체 장비 보기 <ArrowRight class="size-size-icon-md" aria-hidden="true" /></a
        >
      </div>
      {#if map && data.devices.length > 0}
        <div class="rounded-card border-border min-h-layout-map-min overflow-hidden border">
          {@render map(data.devices)}
        </div>
      {/if}
      {#if devices.length > 0}
        <ul
          class="rounded-card border-border bg-surface divide-border divide-y overflow-hidden border"
          aria-label="현장별 장비"
        >
          {#each devices as device (device.id)}
            <li><EquipmentRow {device} {app} href={ownerHref(url, 'detail', app, {}, device.id)} location={!map} /></li>
          {/each}
        </ul>
        <p class="text-body-sm text-fg-muted">
          전체 {data.devices.length}대 중 {devices.length}대 표시 · 개별 수신 시각을 기준으로 확인하세요.
        </p>
      {:else}
        <EmptyState
          title="표시할 현장이 없습니다"
          description="장비의 현장 및 GPS 정보가 등록되면 여기에 표시됩니다."
        />
      {/if}
    </section>
  </div>
</div>
