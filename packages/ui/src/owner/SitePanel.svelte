<script lang="ts">
  // 현장 패널 — 현장명·건설사 · 주소·기간(PeriodBar) · 담당자(ContactCard) · 투입/보관 호기 목록(EquipmentRow) · 현장 알림. 호기 클릭 → 호기 단계.
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import { ownerHref, type OwnerApp, type OwnerDevice, type OwnerSite, type OwnerSnapshot } from '@boomeyes/domain';
  import Badge from '../primitives/Badge.svelte';
  import Button from '../primitives/Button.svelte';
  import ContactCard from '../primitives/ContactCard.svelte';
  import KeyValueList from '../primitives/KeyValueList.svelte';
  import List from '../primitives/List.svelte';
  import PeriodBar from '../primitives/PeriodBar.svelte';
  import AlertCard from './AlertCard.svelte';
  import EquipmentRow from './EquipmentRow.svelte';
  import { devicePoster, ownerDate } from './core-helpers';
  let {
    data,
    app,
    url,
    site,
    focused,
    unitHref,
    onunit,
    onfocus,
  }: {
    data: OwnerSnapshot;
    app: OwnerApp;
    url: URL;
    site: OwnerSite;
    focused?: string;
    unitHref: (device: OwnerDevice) => string;
    onunit: (device: OwnerDevice) => void;
    onfocus: (id?: string) => void;
  } = $props();
  const units = $derived(data.devices.filter((d) => d.siteId === site.id));
  const ids = $derived(new Set(units.map((d) => d.id)));
  const alerts = $derived(data.alerts.filter((a) => ids.has(a.deviceId)));
  const depot = $derived(site.kind === 'depot');
</script>

<section class="gap-stack-md flex min-w-0 flex-col" aria-labelledby="owner-site-title">
  <div class="gap-stack-xs flex min-w-0 flex-col">
    <div class="gap-inline-sm flex flex-wrap items-center">
      <h2 id="owner-site-title" class="text-heading-md" tabindex="-1" data-panel-heading="site">{site.name}</h2>
      <Badge variant="outline">{depot ? '보관소' : site.company}</Badge>
    </div>
    <p class="text-body-sm text-fg-muted">{site.address}</p>
  </div>
  {#if site.period}
    <PeriodBar start={site.period.from} end={site.period.to} now={data.at} label="현장 기간" format={ownerDate} />
  {/if}
  <KeyValueList
    items={[
      { label: '지역', value: site.region },
      { label: depot ? '보관' : '투입', value: `${units.length}대` },
      ...(site.period
        ? [{ label: '기간', value: `${ownerDate(site.period.from)} – ${ownerDate(site.period.to)}` }]
        : []),
    ]}
  />
  {#if site.contact}
    <ContactCard name={site.contact.name} role={site.contact.job} phone={site.contact.phone} />
  {/if}
</section>
<section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-site-units-title">
  <div class="gap-inline-sm flex flex-wrap items-center justify-between">
    <h3 id="owner-site-units-title" class="text-heading-sm">
      {depot ? '보관 호기' : '투입 호기'} <span class="tabular-nums">{units.length}대</span>
    </h3>
    <Button variant="ghost" size="sm" href={ownerHref(url, 'fleet', app, { q: site.name })}
      >목록에서 보기 <ArrowRight class="size-size-icon-sm" aria-hidden="true" /></Button
    >
  </div>
  <List items={units} key={(d) => d.id} label="현장 호기" variant="plain">
    {#snippet item(device)}
      <EquipmentRow
        {device}
        now={data.at}
        poster={devicePoster(data.cameras, device.id)}
        href={unitHref(device)}
        onselect={onunit}
        selected={focused === device.id}
        onmouseenter={() => onfocus(device.id)}
        onmouseleave={() => onfocus(undefined)}
      />
    {/snippet}
  </List>
</section>
{#if alerts.length > 0}
  <section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-site-alerts-title">
    <h3 id="owner-site-alerts-title" class="text-heading-sm">
      현장 알림 <span class="tabular-nums">{alerts.length}건</span>
    </h3>
    <List items={alerts} key={(a) => a.id} label="현장 알림" variant="plain">
      {#snippet item(alert)}
        {@const device = units.find((d) => d.id === alert.deviceId)!}
        <AlertCard
          {alert}
          {device}
          now={data.at}
          href={ownerHref(url, 'alerts', app, { alert: alert.id, device: device.id })}
          data-device={device.id}
        />
      {/snippet}
    </List>
  </section>
{/if}
