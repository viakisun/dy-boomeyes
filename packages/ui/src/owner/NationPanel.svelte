<script lang="ts">
  // 전국 패널 — 확인이 필요한 장비(알림 3) · 현장 목록(13). hover → 지도 강조, 클릭 → 현장 단계.
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Bell from '@lucide/svelte/icons/bell';
  import {
    OWNER_ALERT_KINDS,
    ownerHref,
    ownerSummary,
    type OwnerApp,
    type OwnerRegion,
    type OwnerSite,
    type OwnerSnapshot,
  } from '@boomeyes/domain';
  import Button from '../primitives/Button.svelte';
  import Chip from '../primitives/Chip.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import List from '../primitives/List.svelte';
  import AlertCard from './AlertCard.svelte';
  import SiteRow from './SiteRow.svelte';
  let {
    data,
    app,
    url,
    region,
    focused,
    siteHref,
    onsite,
    onfocus,
    onregion,
  }: {
    data: OwnerSnapshot;
    app: OwnerApp;
    url: URL;
    region?: OwnerRegion;
    focused?: string;
    siteHref: (site: OwnerSite) => string;
    onsite: (site: OwnerSite) => void;
    onfocus: (id?: string) => void;
    onregion: (region?: OwnerRegion) => void;
  } = $props();
  const summary = $derived(ownerSummary(data.devices, data.alerts));
  const alerts = $derived(
    // 종류 순서는 원천(OWNER_ALERT_KINDS)이 정한다 — 종류가 늘 때 여기 표를 고치는 것을 잊지 않게
    [...new Map(data.alerts.map((alert) => [alert.id, alert])).values()].sort(
      (a, b) => OWNER_ALERT_KINDS.indexOf(a.kind) - OWNER_ALERT_KINDS.indexOf(b.kind),
    ),
  );
  const shown = $derived(alerts.slice(0, 3));
  const sites = $derived(region ? data.sites.filter((s) => s.region === region) : data.sites);
</script>

<section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-attention-title">
  <div class="gap-inline-sm flex flex-wrap items-center justify-between">
    <h2 id="owner-attention-title" class="text-heading-sm" tabindex="-1" data-panel-heading="nation">
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
          onmouseenter={() => onfocus(device.siteId)}
          onmouseleave={() => onfocus(undefined)}
        />
      {/snippet}
    </List>
    {#if summary.alerts > shown.length}
      <p class="text-body-sm text-fg-muted">전체 알림 {summary.alerts}건 중 {shown.length}건 표시</p>
    {/if}
  {:else}
    <EmptyState title="확인할 알림 없음">
      {#snippet icon()}<IconTile><Bell class="size-size-icon-lg" /></IconTile>{/snippet}
    </EmptyState>
  {/if}
</section>
<section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-sites-title">
  <div class="gap-inline-sm flex flex-wrap items-center justify-between">
    <h2 id="owner-sites-title" class="text-heading-sm">
      {region ? `${region} 현장` : '현장 목록'} <span class="text-fg-muted tabular-nums">{sites.length}</span>
    </h2>
    {#if region}
      <Chip size="md" onclick={() => onregion(undefined)}>전국으로</Chip>
    {:else}
      <Button variant="ghost" size="sm" href={ownerHref(url, 'fleet', app)}
        >전체 장비 보기 <ArrowRight class="size-size-icon-sm" aria-hidden="true" /></Button
      >
    {/if}
  </div>
  {#if sites.length > 0}
    <List items={sites} key={(s) => s.id} label="현장 목록" variant="plain">
      {#snippet item(site)}
        <SiteRow
          {site}
          devices={data.devices}
          alerts={data.alerts}
          href={siteHref(site)}
          selected={focused === site.id}
          onselect={onsite}
          onmouseenter={() => onfocus(site.id)}
          onmouseleave={() => onfocus(undefined)}
        />
      {/snippet}
    </List>
    <p class="text-body-sm text-fg-muted">전체 {data.devices.length}대 · {data.sites.length}개 현장</p>
  {:else}
    <EmptyState title="표시할 현장 없음" />
  {/if}
</section>
